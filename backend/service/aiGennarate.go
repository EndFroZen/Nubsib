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
	llmEmbed, _ := ollama.New(ollama.WithModel("qwen3-embedding:0.6b"))
	embedder, _ := embeddings.NewEmbedder(llmEmbed)
	qdrantURL, _ := url.Parse("http://localhost:6333")
	store, _ := qdrant.New(
		qdrant.WithURL(*qdrantURL),
		qdrant.WithCollectionName("medical_knowledge"),
		qdrant.WithEmbedder(embedder),
	)

	// --- STEP 2: RAG SEARCH ---
	FLog("2. RAG Search")
	ragContext, err := GetContextFromRAG(ctx, prompt, store)
	if err != nil {
		return "", err
	}
	tableColumns := ExtractTableAndColumns(ragContext)
	schemaNames := FindSchemaByTablename(tableColumns)
	

	// --- STEP 3: LLM REASONING ---
	// 3. Initialize Generator LLM
	FLog("3. Initialize Generator LLM")
	llm, err := googleai.New(ctx,
		googleai.WithAPIKey(KEYOPENAI), // ใส่ Key ของคุณที่นี่
		googleai.WithDefaultModel("gemini-2.5-flash"),
	)
	if err != nil {
		return "", fmt.Errorf("googleai error: %v", err)
	}

	finalPrompt := fmt.Sprintf(`คุณคือผู้เชี่ยวชาญ HOSxP Database 
จงใช้ข้อมูล Schema ที่ดึงมาจาก RAG ด้านล่างนี้ในการตอบคำถาม
[RULE]
1. ใช้ภาษาไทย
2. ห้ามใช้ column ที่ไม่มีใน schema และไม่มีใน table นั้น
3. อย่าเดาการใช้ column ที่ไม่มีใน schema และไม่มีใน table นั้น
[SCHEMA FROM RAG]
%s
[SCHEMA FROM DATABASE]
%s

[คำถาม]
%s

[ขั้นตอนการตอบ]
1. [ANALYSIS]: อธิบายเป็นภาษาไทยว่านายเลือกใช้ตารางไหน เพราะอะไร และคอลัมน์ไหนที่ตรงกับคำถาม (เช่น "เลือกใช้ 'ovst' เพราะต้องการนับ visit และใช้ 'vstdate' แทน 'ovstdate' ตามคำแนะนำใน schema")
2. [SQL]: เขียนคำสั่ง SQL PostgreSQL ที่ถูกต้อง

คำตอบ:`, ragContext,schemaNames, prompt)
	FLog("4. Generate from Single Prompt", finalPrompt)
	return llms.GenerateFromSinglePrompt(ctx, llm, finalPrompt,
		llms.WithMaxTokens(4096), // กำหนดตรงนี้ได้เลย
		llms.WithTemperature(0),  // แนะนำให้เป็น 0 สำหรับงาน SQL เพื่อความแม่นยำ
	)
}
