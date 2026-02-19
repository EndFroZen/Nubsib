package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/tmc/langchaingo/vectorstores/qdrant"
)

func GetContextFromRAG(ctx context.Context, prompt string, store qdrant.Store) (string, error) {
	// ดึง 8 docs (เพราะตอนนี้ 1 doc = 1 table schema แล้ว ไม่ใช่ row-level)
	// 11 tables + 6 relationships = 17 docs ทั้งหมด → ดึง 8 จะได้ครอบคลุมที่เกี่ยวข้อง
	docs, err := store.SimilaritySearch(ctx, prompt, 8)
	if err != nil {
		return "", err
	}

	var contextBuilder strings.Builder
	for _, doc := range docs {
		contextBuilder.WriteString(fmt.Sprintf("---\n%s\n", doc.PageContent))
	}
	return contextBuilder.String(), nil
}
