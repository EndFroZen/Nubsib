package controller

import (
	"api-nubsib/models"
	"api-nubsib/service"

	"github.com/gofiber/fiber/v2"
)

func Chat(c *fiber.Ctx) error {
	var req models.Request
	if err := c.BodyParser(&req); err != nil {
		service.FLog("Error parsing request: ", err)
		return err
	}
	
	result, err := service.AiGennarate(req.Prompt)
	if err != nil {
		service.FLog("Error generating content: ", err)
		return err
	}
	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "Chat endpoint is working!",
		"data":    result,
	})
}
