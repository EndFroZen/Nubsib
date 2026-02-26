package service

import (
	"fmt"
	"regexp"
	"strings"
)

// dangerousKeywords — คำสั่ง SQL ที่ห้ามใช้ (ต้องเป็น SELECT/WITH เท่านั้น)
var dangerousKeywords = []string{
	"INSERT",
	"UPDATE",
	"DELETE",
	"DROP",
	"ALTER",
	"TRUNCATE",
	"CREATE",
	"GRANT",
	"REVOKE",
	"COPY",
	"EXECUTE",
	"CALL",
	"MERGE",
	"UPSERT",
	"REPLACE",
	"LOCK",
	"VACUUM",
	"REINDEX",
	"CLUSTER",
	"COMMENT",
	"SET",
}

// stripSQLComments ลบ comment ออกจาก SQL
// รองรับทั้ง -- (single-line) และ /* */ (multi-line)
func stripSQLComments(sql string) string {
	// ลบ multi-line comments /* ... */
	reBlock := regexp.MustCompile(`/\*[\s\S]*?\*/`)
	sql = reBlock.ReplaceAllString(sql, " ")

	// ลบ single-line comments -- ...
	reLine := regexp.MustCompile(`--[^\n]*`)
	sql = reLine.ReplaceAllString(sql, " ")

	return sql
}

// ValidateSQL ตรวจสอบว่า SQL ที่ได้จาก AI เป็น READ-ONLY (SELECT/WITH) เท่านั้น
// Return nil ถ้าปลอดภัย, return error ถ้าพบคำสั่งอันตราย
func ValidateSQL(sql string) error {
	if strings.TrimSpace(sql) == "" {
		return fmt.Errorf("SQL ว่างเปล่า")
	}

	// ลบ comment ออก
	cleaned := stripSQLComments(sql)

	// Normalize whitespace
	cleaned = regexp.MustCompile(`\s+`).ReplaceAllString(cleaned, " ")
	cleaned = strings.TrimSpace(cleaned)

	// แยก multi-statement โดย ;
	statements := strings.Split(cleaned, ";")

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		upper := strings.ToUpper(stmt)

		// ตรวจว่า statement ขึ้นต้นด้วย SELECT หรือ WITH (CTE) เท่านั้น
		if !strings.HasPrefix(upper, "SELECT") && !strings.HasPrefix(upper, "WITH") {
			// หาว่าขึ้นต้นด้วยคำสั่งอะไร
			firstWord := strings.Fields(upper)
			if len(firstWord) > 0 {
				return fmt.Errorf("❌ พบคำสั่งต้องห้าม: '%s' — อนุญาตเฉพาะ SELECT เท่านั้น", firstWord[0])
			}
			return fmt.Errorf("❌ SQL ไม่ใช่ SELECT — อนุญาตเฉพาะ SELECT เท่านั้น")
		}

		// ตรวจ dangerous keywords ที่ซ่อนอยู่ภายใน statement
		// เช่น SELECT * FROM t; DROP TABLE t;
		// กรณีนี้จับได้จาก multi-statement แล้ว
		// แต่ยังต้องตรวจ subquery injection เช่น SELECT (DELETE FROM ...)
		for _, keyword := range dangerousKeywords {
			// ใช้ word boundary เพื่อไม่ให้จับ column ที่มีชื่อคล้ายๆ เช่น "updated_at"
			pattern := fmt.Sprintf(`\b%s\b`, keyword)
			re := regexp.MustCompile(`(?i)` + pattern)

			// ตรวจเฉพาะตำแหน่งที่ไม่ได้เป็นส่วนของ string literal
			if re.MatchString(upper) {
				// เช็คว่า keyword อยู่ตำแหน่งที่เหมือนเป็นคำสั่ง SQL จริงๆ
				// ไม่ใช่แค่ชื่อ column (เช่น set_name, delete_flag ไม่ควร block)
				// แต่ถ้า keyword ขึ้นต้น statement หรืออยู่หลัง ; ควร block
				loc := re.FindStringIndex(upper)
				if loc != nil {
					// ถ้าเป็น keyword เดี่ยวๆ ที่ดูเหมือนเป็นคำสั่ง SQL
					// ตรวจว่า char ก่อนหน้าไม่ใช่ . หรือ _ (ซึ่งหมายถึงเป็นส่วนของชื่อ)
					pos := loc[0]
					if pos > 0 {
						prev := cleaned[pos-1]
						if prev == '.' || prev == '_' {
							continue // เป็นส่วนของชื่อ column/table ไม่ block
						}
					}
					// ตรวจ char หลัง keyword
					endPos := loc[1]
					if endPos < len(cleaned) {
						next := cleaned[endPos]
						if next == '_' || next == '.' {
							continue // เป็นส่วนของชื่อ column/table ไม่ block
						}
					}
					return fmt.Errorf("🚫 พบคำสั่งอันตราย '%s' ใน SQL — อนุญาตเฉพาะ SELECT เท่านั้น", keyword)
				}
			}
		}
	}

	return nil
}

// ExtractSQL ดึง SQL query ออกจาก response ของ AI
// รองรับ: code block (```sql ... ```), หัวข้อ [SQL]: ..., หรือ SQL ที่ขึ้นต้นด้วย SELECT/WITH
func ExtractSQL(response string) string {
	// 1. ลองหาจาก code block ```sql ... ```
	reCodeBlock := regexp.MustCompile("(?s)```(?:sql)?\\s*\\n?(.*?)\\n?```")
	matches := reCodeBlock.FindStringSubmatch(response)
	if len(matches) > 1 {
		sql := strings.TrimSpace(matches[1])
		if sql != "" {
			return sql
		}
	}

	// 2. ลองหาจากหัวข้อ [SQL]: ...
	reSQLSection := regexp.MustCompile(`(?si)\[SQL\][:\s]*\n?(.*?)(?:\n\[|\z)`)
	matches = reSQLSection.FindStringSubmatch(response)
	if len(matches) > 1 {
		sql := strings.TrimSpace(matches[1])
		// ลบ code block wrapper ถ้ามี
		sql = regexp.MustCompile("(?s)```(?:sql)?\\s*\\n?(.*?)\\n?```").ReplaceAllString(sql, "$1")
		sql = strings.TrimSpace(sql)
		if sql != "" {
			return sql
		}
	}

	// 3. หา SELECT หรือ WITH ที่ขึ้นต้นบรรทัด
	reSelect := regexp.MustCompile(`(?im)^((?:SELECT|WITH)\b[\s\S]*?);?\s*$`)
	matches = reSelect.FindStringSubmatch(response)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}

	return ""
}
