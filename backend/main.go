package main

import (
	"api-nubsib/routes"
	"api-nubsib/service"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		service.FLog("Error loading .env file")
	}
	// Update LogEnabled after loading .env because global variables key initialized before main runs
	service.LogEnabled = os.Getenv("LOG_ENABLED") == "true"

	service.FLog("Starting server...")
	service.FLog("Port:", os.Getenv("PORT"))
	service.FLog("Log Enabled:", os.Getenv("LOG_ENABLED"))

	// Start RAG generation (data ingestion) in background
	go service.RagGen()

	app := fiber.New()
	origins := os.Getenv("ALLOW_ORIGINS")
	// 🔓 CORS configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins: origins,
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type, Authorization,Authorization",
	}))

	// Test route
	routes.Route(app)
	port := os.Getenv("PORT")
	service.FLog(app.Listen(":" + port))
}
