package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/schema"
	"github.com/tmc/langchaingo/vectorstores/qdrant"
)

func RagGen() {
	// Initialize Ollama as embedder
	llm, err := ollama.New(
		ollama.WithModel("qwen3-embedding:0.6b"),
	)
	if err != nil {
		log.Fatal(err)
	}

	embedder, err := embeddings.NewEmbedder(llm)
	if err != nil {
		log.Fatal(err)
	}

	qdrantURL, err := url.Parse("http://localhost:6333")
	if err != nil {
		log.Fatal(err)
	}

	// 1. Get embedding dimension
	dummyEmb, err := embedder.EmbedQuery(context.Background(), "test")
	if err != nil {
		log.Fatal("Failed to get embedding dimension:", err)
	}
	vectorSize := len(dummyEmb)

	// 2. Ensure collection exists
	collectionName := "medical_knowledge"

	// ลบ collection เก่าแล้วสร้างใหม่ เพราะ format เปลี่ยนจาก row-level → table-level
	err = deleteCollection(qdrantURL.String(), collectionName)
	if err != nil {
		log.Printf("Note: Could not delete old collection (may not exist): %v", err)
	}

	err = ensureCollectionExists(qdrantURL.String(), collectionName, vectorSize)
	if err != nil {
		log.Fatal("Failed to ensure collection exists:", err)
	}

	store, err := qdrant.New(
		qdrant.WithURL(*qdrantURL),
		qdrant.WithCollectionName(collectionName),
		qdrant.WithEmbedder(embedder),
	)
	if err != nil {
		log.Fatal(err)
	}

	// 3. Check if collection has data
	count, err := getCollectionPointCount(qdrantURL.String(), collectionName)
	if err != nil {
		log.Printf("Failed to get collection point count: %v", err)
	} else if count > 0 {
		log.Printf("Collection %s already has %d points. Skipping ingestion.\n", collectionName, count)
		return
	}

	// Data directory path
	dataDir := "data"
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		dataDir = "./data"
	}

	ctx := context.Background()

	// Walk through data directory — ใช้ table-level ingestion แทน row-level
	err = filepath.Walk(dataDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".csv") {
			fmt.Printf("Processing file: %s\n", path)
			if err := ingestTableLevel(ctx, store, path); err != nil {
				log.Printf("Error ingesting %s: %v\n", path, err)
			}
		}
		return nil
	})

	if err != nil {
		log.Printf("Error walking data directory: %v\n", err)
	}

	// เพิ่ม relationship document เข้า RAG
	err = ingestRelationships(ctx, store)
	if err != nil {
		log.Printf("Error ingesting relationships: %v\n", err)
	}

	log.Println("Ingestion complete")
}

// ingestTableLevel — สร้าง 1 document ต่อ 1 table (รวม schema ทั้งตาราง)
// แทนที่จะสร้าง 1 document ต่อ 1 row (แบบเก่า)
func ingestTableLevel(ctx context.Context, store qdrant.Store, filePath string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	// Read header: name,type,data_type,description,example
	headers, err := reader.Read()
	if err != nil {
		return err
	}

	var tableName, tableDesc string
	var columns []string

	// Find header indices
	nameIdx, typeIdx, dataTypeIdx, descIdx, exampleIdx := -1, -1, -1, -1, -1
	for i, h := range headers {
		switch strings.TrimSpace(h) {
		case "name":
			nameIdx = i
		case "type":
			typeIdx = i
		case "data_type":
			dataTypeIdx = i
		case "description":
			descIdx = i
		case "example":
			exampleIdx = i
		}
	}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue // skip malformed rows
		}

		rowType := ""
		if typeIdx >= 0 && typeIdx < len(record) {
			rowType = strings.TrimSpace(record[typeIdx])
		}

		name := ""
		if nameIdx >= 0 && nameIdx < len(record) {
			name = strings.TrimSpace(record[nameIdx])
		}

		desc := ""
		if descIdx >= 0 && descIdx < len(record) {
			desc = strings.TrimSpace(record[descIdx])
		}

		if rowType == "table" {
			tableName = name
			tableDesc = desc
		} else if rowType == "column" {
			dataType := ""
			if dataTypeIdx >= 0 && dataTypeIdx < len(record) {
				dataType = strings.TrimSpace(record[dataTypeIdx])
			}
			example := ""
			if exampleIdx >= 0 && exampleIdx < len(record) {
				example = strings.TrimSpace(record[exampleIdx])
			}

			colLine := fmt.Sprintf("  - %s (%s): %s", name, dataType, desc)
			if example != "" && example != "NULL" {
				colLine += fmt.Sprintf(" [example: %s]", example)
			}
			columns = append(columns, colLine)
		}
	}

	if tableName == "" {
		return fmt.Errorf("no table found in %s", filePath)
	}

	// สร้าง 1 document รวม schema ทั้งตาราง
	var contentBuilder strings.Builder
	contentBuilder.WriteString(fmt.Sprintf("Table: %s\n", tableName))
	contentBuilder.WriteString(fmt.Sprintf("Description: %s\n", tableDesc))
	contentBuilder.WriteString(fmt.Sprintf("Total Columns: %d\n", len(columns)))
	contentBuilder.WriteString("Columns:\n")
	for _, col := range columns {
		contentBuilder.WriteString(col + "\n")
	}

	doc := schema.Document{
		PageContent: contentBuilder.String(),
		Metadata: map[string]interface{}{
			"source":     filePath,
			"table_name": tableName,
			"type":       "table_schema",
		},
	}

	_, err = store.AddDocuments(ctx, []schema.Document{doc})
	if err != nil {
		return err
	}
	fmt.Printf("Added table-level document for: %s (%d columns)\n", tableName, len(columns))
	return nil
}

// ingestRelationships — เพิ่ม relationship document เข้า RAG
func ingestRelationships(ctx context.Context, store qdrant.Store) error {
	relationships := []struct {
		content  string
		metadata map[string]interface{}
	}{
		{
			content: `Relationship: patient → ovst (ผู้ป่วย → visit)
JOIN: patient.hn = ovst.hn
ใช้เมื่อ: ต้องการดูข้อมูลผู้ป่วย (ชื่อ นามสกุล วันเกิด) ร่วมกับข้อมูล visit
คำถามที่เกี่ยวข้อง: ผู้ป่วยมากี่ครั้ง, ชื่อผู้ป่วยที่มา visit`,
			metadata: map[string]interface{}{"type": "relationship", "tables": "patient,ovst"},
		},
		{
			content: `Relationship: ovst → ovstdiag → icd101 (visit → วินิจฉัย → ชื่อโรค)
JOIN: ovst.vn = ovstdiag.vn AND ovstdiag.icd10 = icd101.code
ใช้เมื่อ: ต้องการดูว่าผู้ป่วยเป็นโรคอะไร, สถิติโรค, Top 10 โรค
คำถามที่เกี่ยวข้อง: โรคที่พบบ่อย, วินิจฉัยโรค, ICD-10`,
			metadata: map[string]interface{}{"type": "relationship", "tables": "ovst,ovstdiag,icd101"},
		},
		{
			content: `Relationship: ovst → opdscreen (visit → คัดกรอง/Vital Signs)
JOIN: ovst.vn = opdscreen.vn
ใช้เมื่อ: ต้องการดูผลคัดกรอง ความดัน น้ำหนัก ส่วนสูง อุณหภูมิ ชีพจร
คำถามที่เกี่ยวข้อง: ความดัน, vital signs, BMI, น้ำหนัก, Lab`,
			metadata: map[string]interface{}{"type": "relationship", "tables": "ovst,opdscreen"},
		},
		{
			content: `Relationship: ovst → referout/referin (visit → ส่งต่อ)
JOIN: ovst.vn = referout.vn / ovst.vn = referin.vn
ใช้เมื่อ: ต้องการดูข้อมูลการส่งต่อผู้ป่วย
คำถามที่เกี่ยวข้อง: ส่งต่อออก, ส่งต่อเข้า, refer`,
			metadata: map[string]interface{}{"type": "relationship", "tables": "ovst,referout,referin"},
		},
		{
			content: `Relationship: ovst → pttype (visit → สิทธิการรักษา)
JOIN: ovst.pttype = pttype.pttype
ใช้เมื่อ: ต้องการดูชื่อสิทธิ, จำนวนผู้ป่วยตามสิทธิ
คำถามที่เกี่ยวข้อง: สิทธิ, บัตรทอง, ประกันสังคม, UC`,
			metadata: map[string]interface{}{"type": "relationship", "tables": "ovst,pttype"},
		},
		{
			content: `Relationship: patient → opd_allerg (ผู้ป่วย → แพ้ยา)
JOIN: patient.hn = opd_allerg.hn
ใช้เมื่อ: ต้องการดูประวัติแพ้ยาของผู้ป่วย
คำถามที่เกี่ยวข้อง: แพ้ยา, allergy, ADR`,
			metadata: map[string]interface{}{"type": "relationship", "tables": "patient,opd_allerg"},
		},
	}

	var docs []schema.Document
	for _, rel := range relationships {
		docs = append(docs, schema.Document{
			PageContent: rel.content,
			Metadata:    rel.metadata,
		})
	}

	_, err := store.AddDocuments(ctx, docs)
	if err != nil {
		return err
	}
	fmt.Printf("Added %d relationship documents\n", len(docs))
	return nil
}

func deleteCollection(baseURL, collectionName string) error {
	deleteURL := fmt.Sprintf("%s/collections/%s", baseURL, collectionName)
	req, err := http.NewRequest("DELETE", deleteURL, nil)
	if err != nil {
		return err
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to delete collection, status: %s", resp.Status)
	}
	log.Printf("Deleted old collection: %s\n", collectionName)
	return nil
}

func ensureCollectionExists(baseURL, collectionName string, vectorSize int) error {
	// Check if collection exists
	checkURL := fmt.Sprintf("%s/collections/%s", baseURL, collectionName)
	resp, err := http.Get(checkURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		return nil // Collection exists
	}

	// Create collection
	createURL := fmt.Sprintf("%s/collections/%s", baseURL, collectionName)
	body := map[string]interface{}{
		"vectors": map[string]interface{}{
			"size":     vectorSize,
			"distance": "Cosine",
		},
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PUT", createURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to create collection, status: %s", resp.Status)
	}

	log.Printf("Created collection %s with vector size %d\n", collectionName, vectorSize)
	return nil
}

func getCollectionPointCount(baseURL, collectionName string) (int, error) {
	url := fmt.Sprintf("%s/collections/%s", baseURL, collectionName)
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return 0, fmt.Errorf("failed to get collection info, status: %s", resp.Status)
	}

	var result struct {
		Result struct {
			PointsCount int `json:"points_count"`
		} `json:"result"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}

	return result.Result.PointsCount, nil
}
