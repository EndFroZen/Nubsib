package routes

import "github.com/gofiber/fiber/v2"

func Route(app *fiber.App) {
	app.Group("/api")
	app.Get("/health",controller.HealthCheck)

}
