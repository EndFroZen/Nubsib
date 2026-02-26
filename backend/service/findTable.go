package service

import (
	"strings"
)

// ExtractTableNames รับ string ทั้งก้อน แล้วคืนชื่อ table แบบไม่ซ้ำ
func ExtractTableNames(input string) []string {
	lines := strings.Split(input, "\n")
	seen := make(map[string]bool)
	var tables []string

	for _, line := range lines {
		line = strings.TrimSpace(line)

		// เช็คว่าเป็น table ไหม
		if strings.Contains(line, "type: table") {

			// หา name:
			nameIndex := strings.Index(line, "name:")
			if nameIndex == -1 {
				continue
			}

			// ตัด substring หลัง name:
			sub := line[nameIndex+5:]
			sub = strings.TrimSpace(sub)

			// name จะอยู่ก่อนคำว่า type:
			endIndex := strings.Index(sub, "type:")
			if endIndex != -1 {
				sub = sub[:endIndex]
			}

			tableName := strings.TrimSpace(sub)

			if !seen[tableName] {
				seen[tableName] = true
				tables = append(tables, tableName)
			}
		}
	}

	return tables
}

// ExtractTableAndColumns parses the RAG context and returns a map of table names to their relevant columns.
func ExtractTableAndColumns(input string) map[string][]string {
	lines := strings.Split(input, "\n")
	tableColumns := make(map[string][]string)
	seenTable := make(map[string]bool)

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.Contains(line, "type: table") {
			// Extract table name
			tableName := extractValue(line, "name:", "type:")
			if tableName != "" {
				if _, exists := tableColumns[tableName]; !exists {
					tableColumns[tableName] = []string{}
				}
				seenTable[tableName] = true
			}
		} else if strings.Contains(line, "type: column") {
			// Extract table name from File field (e.g., "File: ovst_table.csv")
			fileName := extractValue(line, "File:", "name:")
			tableName := strings.TrimSuffix(fileName, "_table.csv")

			// Extract column name
			colName := extractValue(line, "name:", "type:")

			if tableName != "" && colName != "" {
				// Check if column already exists for this table
				exists := false
				for _, c := range tableColumns[tableName] {
					if c == colName {
						exists = true
						break
					}
				}
				if !exists {
					tableColumns[tableName] = append(tableColumns[tableName], colName)
				}
			}
		}
	}
	return tableColumns
}

func extractValue(line, startMarker, endMarker string) string {
	startIndex := strings.Index(line, startMarker)
	if startIndex == -1 {
		return ""
	}
	sub := line[startIndex+len(startMarker):]
	sub = strings.TrimSpace(sub)

	endIndex := strings.Index(sub, endMarker)
	if endIndex != -1 {
		sub = sub[:endIndex]
	}
	return strings.TrimSpace(sub)
}
