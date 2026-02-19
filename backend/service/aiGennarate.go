package service

import (
	"context"
	"fmt"
	"net/url"
	"os"

	"github.com/tmc/langchaingo/embeddings"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/googleai"
	"github.com/tmc/langchaingo/llms/ollama"
	"github.com/tmc/langchaingo/vectorstores/qdrant"
)

func AiGenerate(prompt string) (string, error) {
	ctx := context.Background()
	KEYOPENAI := os.Getenv("GEMINI_API_KEY")

	// --- STEP 1: INITIALIZE ---
	FLog("1. Initializing LLM and Embedding")
	llmEmbed, err := ollama.New(ollama.WithModel("qwen3-embedding:0.6b"))
	if err != nil {
		return "", fmt.Errorf("ollama embed error: %v", err)
	}
	embedder, err := embeddings.NewEmbedder(llmEmbed)
	if err != nil {
		return "", fmt.Errorf("embedder error: %v", err)
	}
	qdrantURL, err := url.Parse("http://localhost:6333")
	if err != nil {
		return "", fmt.Errorf("qdrant URL error: %v", err)
	}
	store, err := qdrant.New(
		qdrant.WithURL(*qdrantURL),
		qdrant.WithCollectionName("medical_knowledge"),
		qdrant.WithEmbedder(embedder),
	)
	if err != nil {
		return "", fmt.Errorf("qdrant store error: %v", err)
	}

	// --- STEP 2: RAG SEARCH ---
	FLog("2. RAG Search")
	ragContext, err := GetContextFromRAG(ctx, prompt, store)
	if err != nil {
		return "", err
	}
	tableColumns := ExtractTableAndColumns(ragContext)
	schemaNames := FindSchemaByTablename(tableColumns)

	// --- STEP 3: LLM REASONING ---
	FLog("3. Initialize Generator LLM")
	llm, err := googleai.New(ctx,
		googleai.WithAPIKey(KEYOPENAI),
		googleai.WithDefaultModel("gemini-2.5-flash"),
	)
	if err != nil {
		return "", fmt.Errorf("googleai error: %v", err)
	}

	finalPrompt := fmt.Sprintf(`คุณคือผู้เชี่ยวชาญ HOSxP Database ที่เก่งมากในการเขียน SQL PostgreSQL
จงใช้ข้อมูลทั้งหมดด้านล่างในการตอบคำถาม

[POSTGRESQL KNOWLEDGE]
%s

[COLUMN ALIAS GUIDE - ใช้แก้ความสับสนเรื่อง column]
%s

[FEW-SHOT EXAMPLES - ศึกษาตัวอย่างเหล่านี้ก่อนตอบ]
%s

[SCHEMA FROM RAG - ข้อมูล schema ที่ดึงมาจากระบบ]
%s

[VERIFIED COLUMNS FROM DATABASE - คอลัมน์ที่มีจริงในฐานข้อมูล]
%s

[RULES - กฎเหล็กที่ต้องปฏิบัติตาม]
1. ใช้ภาษาไทยในการอธิบาย
2. ห้ามใช้ column ที่ไม่ได้อยู่ใน VERIFIED COLUMNS โดยเด็ดขาด
3. ห้ามเดาชื่อ column ถ้าไม่แน่ใจ ให้ใช้เฉพาะที่เห็นใน schema
4. ใช้ vstdate ในการกรองวันที่ (ห้ามใช้ ovstdate เพราะไม่มีอยู่จริง)
5. ถ้าต้องแสดงชื่อโรค ให้ JOIN กับ icd101 เสมอ (ovstdiag.icd10 = icd101.code)
6. ถ้าต้องแสดงข้อมูลผู้ป่วย ให้ JOIN กับ patient ผ่าน hn
7. ถ้าต้องแสดงชื่อสิทธิ ให้ JOIN กับ pttype (ovst.pttype = pttype.pttype)
8. ใช้ INNER JOIN เป็นหลัก ใช้ LEFT JOIN เมื่อต้องการรวมแถวที่ไม่มีข้อมูลด้วย
9. เมื่อกรองช่วงเวลาแบบเดือน ใช้ DATE_TRUNC('month', CURRENT_DATE) ถึง DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
10. SQL ต้องเป็น READ-ONLY เท่านั้น (SELECT) ห้าม INSERT, UPDATE, DELETE

[คำถาม]
%s

[ขั้นตอนการตอบ - ทำทีละขั้น]
1. [TABLE_SELECTION]: ระบุตารางที่ต้องใช้ + เหตุผลว่าทำไมถึงเลือกตารางนี้
2. [JOIN_PLAN]: ระบุ JOIN path ตาม TABLE RELATIONSHIPS (ถ้าต้อง JOIN) และตรวจสอบว่า key ที่ใช้ JOIN ถูกต้อง
3. [COLUMN_CHECK]: ตรวจสอบว่าทุก column ที่จะใช้มีอยู่ใน VERIFIED COLUMNS จริง
4. [SQL]: เขียน SQL สุดท้ายที่ถูกต้อง

คำตอบ:`,
		KnowledgeBase,
		
		ColumnAliasGuide,
		FewShotExamples,
		ragContext,
		schemaNames,
		prompt)

	FLog("4. Generate from Single Prompt", finalPrompt)
	return llms.GenerateFromSinglePrompt(ctx, llm, finalPrompt,
		llms.WithMaxTokens(4096),
		llms.WithTemperature(0), // 0 สำหรับ SQL เพื่อความแม่นยำ
	)
}
