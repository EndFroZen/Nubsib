package main

import (
	"api-nubsib/routes"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()

	// 🔓 CORS configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000,http://localhost:5173",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type, Authorization,Authorization",
	}))

	// Test route
	routes.Route(app)

	log.Fatal(app.Listen(":3000"))
}
