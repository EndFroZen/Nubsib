package service

import (
	"context"
	"os"

	"google.golang.org/genai"
)

func AiGennarate(prompt string) (string, error) {
	ctx := context.Background()
	apiKey := os.Getenv("GEMINI_API_KEY")

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		FLog("Error creating client: ", err)
		return "", err
	}

	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		FLog("Error generating content: ", err)
		return "", err
	}
	FLog("Generated content: ", result.Text())
	return result.Text(), nil
}
