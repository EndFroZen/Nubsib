package service

import (
	"log"
	"os"
	"path/filepath"
	"runtime"
)

var LogEnabled = os.Getenv("LOG_ENABLED") == "true"

func getEmoji(path string) string {
	dir := filepath.Base(filepath.Dir(path))
	switch dir {
	case "controller":
		return "🎮" // Controller
	case "service":
		return "⚙️" // Service
	case "routes":
		return "🛣️" // Routes
	case "backend":
		return "🚀" // Main/Root
	case "middleware":
		return "🛡️" // Middleware
	default:
		return "📂" // Default folder
	}
}

func FLog(v ...any) {
	if !LogEnabled {
		return
	}

	// Get caller information
	_, file, _, ok := runtime.Caller(1)
	prefix := ""
	if ok {
		prefix = getEmoji(file) + " [" + filepath.Base(filepath.Dir(file)) + "] "
	}

	// Prepare arguments with prefix
	args := append([]any{prefix}, v...)
	log.Println(args...)
}
