package routes

import "github.com/gofiber/fiber/v2"

func Route(app *fiber.App) {
	app.Group("/api")
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "CORS enabled successfully 🚀",
		})
	})

}
