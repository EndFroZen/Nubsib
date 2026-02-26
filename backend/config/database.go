package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Database() {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?client_encoding=UTF8",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	dbpool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}

	// test connection
	err = dbpool.Ping(ctx)
	if err != nil {
		log.Fatal("Database ping failed:", err)
	}

	DB = dbpool

	log.Println("✅ Connected to PostgreSQL successfully")
}
