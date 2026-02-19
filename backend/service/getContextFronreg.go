package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/tmc/langchaingo/vectorstores/qdrant"
)

func GetContextFromRAG(ctx context.Context, prompt string, store qdrant.Store) (string, error) {
	// ดึงมา 6-8 docs เพื่อให้ครอบคลุมหลายตารางที่อาจต้อง JOIN กัน
	docs, err := store.SimilaritySearch(ctx, prompt, 30)
	if err != nil {
		return "", err
	}

	var contextBuilder strings.Builder
	for _, doc := range docs {
		contextBuilder.WriteString(fmt.Sprintf("- %s\n", doc.PageContent))
	}
	return contextBuilder.String(), nil
}
