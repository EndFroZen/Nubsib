package controller

import (
	"api-nubsib/models"
	"api-nubsib/service"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func Chat(c *fiber.Ctx) error {
	var req models.Request
	if err := c.BodyParser(&req); err != nil {
		service.FLog("Error parsing request: ", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request",
		})
	}
	service.FLog("Request: ", req.Prompt)
	result, err := service.AiGenerate(req.Prompt)
	if err != nil {
		service.FLog("Error generating content: ", err)

		// ตรวจว่าเป็น SQL safety error หรือไม่
		if strings.Contains(err.Error(), "SQL ไม่ปลอดภัย") {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"status":  "blocked",
				"message": err.Error(),
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}
	service.FLog("Result: ", result)

	// --- Extract SQL แล้ว query จริง ---
	sqlQuery := service.ExtractSQL(result)
	if sqlQuery != "" {
		queryResult, err := service.ExecuteSQL(sqlQuery)
		if err != nil {
			service.FLog("Query execution error: ", err)
			// ยังส่ง AI response กลับไป พร้อมแจ้ง error ของ query
			return c.JSON(fiber.Map{
				"status":     "ok",
				"message":    "SQL generated but query failed",
				"data":       result,
				"sql":        sqlQuery,
				"queryError": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"status":      "ok",
			"message":     "Query executed successfully",
			"data":        result,
			"sql":         sqlQuery,
			"queryResult": queryResult,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "ok",
		"message": "Chat endpoint is working!",
		"data":    result,
	})
}
