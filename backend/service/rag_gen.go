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
	dataDir := "./data"

	// Check if data directory exists relative to current execution context?
	// Usually running from backend root, so ./data is correct if running "go run main.go" from backend/
	// If running from backend/service, it would be ../data.
	// Let's assume running from backend root, so "data".
	// The user's tree command showed "data" is in "backend/data".
	// main.go is in backend/. So path should be "data".
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		// Try absolute path or assume caller context.
		// Let's just try "data" first.
		dataDir = "data"
	}

	// Walk through data directory
	err = filepath.Walk(dataDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".csv") {
			fmt.Printf("Processing file: %s\n", path)
			if err := ingestFile(ctx, store, path); err != nil {
				log.Printf("Error ingesting %s: %v\n", path, err)
			}
		}
		return nil
	})

	if err != nil {
		log.Printf("Error walking data directory: %v\n", err)
	}

	log.Println("Ingestion complete")
}

var ctx = context.Background()

func ingestFile(ctx context.Context, store qdrant.Store, filePath string) error {
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	// Read header
	headers, err := reader.Read()
	if err != nil {
		return err
	}

	var documents []schema.Document

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// Create a text representation of the row
		var contentBuilder strings.Builder
		contentBuilder.WriteString(fmt.Sprintf("File: %s\n", filepath.Base(filePath)))
		for i, value := range record {
			if i < len(headers) {
				contentBuilder.WriteString(fmt.Sprintf("%s: %s\n", headers[i], value))
			}
		}

		doc := schema.Document{
			PageContent: contentBuilder.String(),
			Metadata: map[string]interface{}{
				"source": filePath,
				"row":    strings.Join(record, ","),
			},
		}
		documents = append(documents, doc)
	}

	if len(documents) > 0 {
		_, err := store.AddDocuments(ctx, documents)
		if err != nil {
			return err
		}
		fmt.Printf("Added %d documents from %s\n", len(documents), filePath)
	}

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
