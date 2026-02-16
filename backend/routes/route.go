package routes

import (
	"api-nubsib/controller"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func Route(app *fiber.App) {
	api := app.Group("/api")
	api.Use(logger.New(logger.Config{
		Format: "${time} ${ip} ${method} ${path} ${status} ${latency} ${error}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone: "Asia/Bangkok",
		
	}))
	api.Get("/health", controller.HealthCheck)
	api.Post("/chat", controller.Chat)
}
