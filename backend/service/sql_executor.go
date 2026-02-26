package service

import (
	"api-nubsib/config"
	"context"
	"fmt"
	"time"
)

// QueryResult — ผลลัพธ์จากการ query SQL
type QueryResult struct {
	Columns []string                 `json:"columns"`
	Rows    []map[string]interface{} `json:"rows"`
	Count   int                      `json:"count"`
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

	FLog(fmt.Sprintf("✅ Query completed — %d rows returned", len(resultRows)))

	return &QueryResult{
		Columns: columns,
		Rows:    resultRows,
		Count:   len(resultRows),
	}, nil
}
