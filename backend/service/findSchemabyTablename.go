package service

import (
	"context"
	"fmt"
	"strings"

	"api-nubsib/config"

	"github.com/jackc/pgx/v5"
)

func FindSchemaByTablename(tableColumns map[string][]string) []string {
	var schemaNames []string
	for tableName, specifiedColumns := range tableColumns {
		row := config.DB.QueryRow(context.Background(), "SELECT table_schema FROM information_schema.tables WHERE table_name = $1", tableName)
		var schemaName string
		err := row.Scan(&schemaName)
		if err != nil {
			FLog("Error finding schema for table ", tableName, ": ", err)
		}
		
		// Get Columns
		var rows pgx.Rows
		var errQuery error

		if len(specifiedColumns) > 0 {
			placeholders := make([]string, len(specifiedColumns))
			args := []interface{}{schemaName, tableName}
			for i, col := range specifiedColumns {
				placeholders[i] = fmt.Sprintf("$%d", i+3)
				args = append(args, col)
			}
			query := fmt.Sprintf("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name IN (%s)", strings.Join(placeholders, ","))
			rows, errQuery = config.DB.Query(context.Background(), query, args...)

		} else {
			rows, errQuery = config.DB.Query(context.Background(), "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2", schemaName, tableName)
		}

		if errQuery != nil {
			FLog("Error finding columns for table ", tableName, ": ", errQuery)
		}
		defer rows.Close()

		var columns []string
		for rows.Next() {
			var columnName string
			if err := rows.Scan(&columnName); err != nil {
				FLog("Error scanning column: ", err)
				continue
			}
			columns = append(columns, columnName)
		}

		formattedSchema := fmt.Sprintf("Table: %s, Columns: %s", tableName, strings.Join(columns, ", "))
		schemaNames = append(schemaNames, formattedSchema)
	}
	return schemaNames
}
