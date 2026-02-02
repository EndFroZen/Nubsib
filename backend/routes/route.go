package routes

import (
	"api-nubsib/controller"

	"github.com/gofiber/fiber/v2"
)

func Route(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/health", controller.HealthCheck)
	api.Post("/chat", controller.Chat)
}
