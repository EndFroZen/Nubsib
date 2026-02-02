package controller

import (
	"api-nubsib/public"
	"time"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
	
	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "CORS enabled successfully 🚀",
		"data":    "Nubsib Backend",
		"time":    time.Now(),
		"version": public.Version(),
	})
}
