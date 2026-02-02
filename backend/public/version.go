package public

import (
	"os"
	"strings"
)

func Version() string {
	version, _ := os.ReadFile("../VERSION")
	return strings.TrimSpace(string(version))
}
