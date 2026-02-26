package service

import (
	"api-nubsib/config"
	"context"
	"fmt"
	"strings"
	"time"
)

// QueryResult — ผลลัพธ์จากการ query SQL
type QueryResult struct {
	Columns []string                 `json:"columns"`
	Rows    []map[string]interface{} `json:"rows"`
	Count   int                      `json:"count"`
}

// pdpaSensitiveColumns — column ที่ต้อง mask ตาม PDPA
// key = ชื่อ column (lowercase), value = ประเภทการ mask
var pdpaSensitiveColumns = map[string]string{
	// ชื่อ-นามสกุล (pname ไม่ mask เพราะเป็นแค่คำนำหน้า เช่น นาย/นาง/น.ส.)
	"fname": "name",
	"lname": "name",
	// HN
	"hn": "hn",
	// เลขบัตรประชาชน
	"cid":         "cid",
	"patient_cid": "cid",
}

// maskName — mask ชื่อ/นามสกุล โชว์ครึ่งแรก + X เท่ากับจำนวนที่ซ่อน
// เช่น "สมชาย" → "สมXXX", "สุสิธิอุมา" → "สุสิธXXXXX"
func maskName(value string) string {
	if value == "" || value == "-" || value == "NULL" {
		return value
	}
	runes := []rune(value)
	if len(runes) <= 2 {
		return string(runes[0]) + strings.Repeat("X", len(runes)-1)
	}
	half := len(runes) / 2
	if half < 2 {
		half = 2
	}
	hidden := len(runes) - half
	return string(runes[:half]) + strings.Repeat("X", hidden)
}

// maskHN — mask HN เช่น "0028632" → "002XXX2"
func maskHN(value string) string {
	if value == "" || value == "-" || value == "NULL" {
		return value
	}
	if len(value) <= 4 {
		return "XXX"
	}
	return value[:3] + "XXX" + value[len(value)-1:]
}

// maskCID — mask เลขบัตรประชาชน เช่น "1234567890123" → "X-XXXX-XXXX-XX-3"
func maskCID(value string) string {
	if value == "" || value == "-" || value == "NULL" {
		return value
	}
	// แสดงเฉพาะตัวสุดท้าย
	cleaned := strings.ReplaceAll(value, "-", "")
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	if len(cleaned) < 4 {
		return "XXXX"
	}
	last4 := cleaned[len(cleaned)-4:]
	return "X-XXXX-XXXX-" + last4
}

// applyPDPAMask — mask ข้อมูลส่วนบุคคลในผลลัพธ์ Query
func applyPDPAMask(columns []string, rows []map[string]interface{}) {
	// หา column ที่ต้อง mask
	maskMap := make(map[string]string) // colName → maskType
	for _, col := range columns {
		colLower := strings.ToLower(col)
		if maskType, ok := pdpaSensitiveColumns[colLower]; ok {
			maskMap[col] = maskType
		}
	}

	if len(maskMap) == 0 {
		return // ไม่มี column ที่ต้อง mask
	}

	// Mask ทุกแถว
	for _, row := range rows {
		for col, maskType := range maskMap {
			val, exists := row[col]
			if !exists || val == nil {
				continue
			}
			strVal := fmt.Sprintf("%v", val)
			switch maskType {
			case "name":
				row[col] = maskName(strVal)
			case "hn":
				row[col] = maskHN(strVal)
			case "cid":
				row[col] = maskCID(strVal)
			}
		}
	}
}

// ExecuteSQL รัน SQL ที่ผ่าน validation แล้วกับ PostgreSQL (READ-ONLY)
// จะ validate อีกครั้งก่อนรัน เพื่อความปลอดภัย
func ExecuteSQL(sql string) (*QueryResult, error) {
	// Safety check อีกรอบก่อนรัน
	if err := ValidateSQL(sql); err != nil {
		return nil, fmt.Errorf("🚫 SQL ไม่ปลอดภัย: %v", err)
	}

	if config.DB == nil {
		return nil, fmt.Errorf("❌ ยังไม่ได้เชื่อมต่อฐานข้อมูล")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	FLog("📊 Executing SQL", sql)

	rows, err := config.DB.Query(ctx, sql)
	if err != nil {
		return nil, fmt.Errorf("❌ Query error: %v", err)
	}
	defer rows.Close()

	// อ่าน column names
	fieldDescs := rows.FieldDescriptions()
	columns := make([]string, len(fieldDescs))
	for i, fd := range fieldDescs {
		columns[i] = string(fd.Name)
	}

	// อ่าน rows
	var resultRows []map[string]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return nil, fmt.Errorf("❌ Row scan error: %v", err)
		}

		row := make(map[string]interface{})
		for i, col := range columns {
			val := values[i]
			// แปลง type ที่ pgx ส่งมาให้เป็น JSON-friendly
			switch v := val.(type) {
			case time.Time:
				row[col] = v.Format("2006-01-02 15:04:05")
			case []byte:
				row[col] = string(v)
			default:
				row[col] = v
			}
		}
		resultRows = append(resultRows, row)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("❌ Rows iteration error: %v", rows.Err())
	}

	// --- PDPA: mask ข้อมูลส่วนบุคคลก่อนส่งออก ---
	applyPDPAMask(columns, resultRows)

	FLog(fmt.Sprintf("✅ Query completed — %d rows returned (PDPA masked)", len(resultRows)))

	return &QueryResult{
		Columns: columns,
		Rows:    resultRows,
		Count:   len(resultRows),
	}, nil
}
