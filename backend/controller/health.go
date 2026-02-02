package controller

import "github.com/gofiber/fiber/v2"

func HealthCheck(c *fiber.Ctx) error {
	
	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "CORS enabled successfully 🚀",
		"data":    "Hello World",
		"time":    time.Now(),
		"version": 
	})
}
