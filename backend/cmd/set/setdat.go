package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strings"
)

func main() {

	inputFile, err := os.Open("/home/chanachol-lamdab/Documents/workspace/code/Project/Nubsib/backend/data/s_drugitems_table.csv")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer inputFile.Close()

	reader := csv.NewReader(inputFile)

	outputFile, err := os.Create("output.csv")
	if err != nil {
		fmt.Println(err)
		return
	}
	defer outputFile.Close()

	writer := csv.NewWriter(outputFile)
	defer writer.Flush()

	// อ่าน header
	header, err := reader.Read()
	if err != nil {
		fmt.Println("Error reading header:", err)
		return
	}

	// เขียน header กลับไปแบบเดิม (ไม่เพิ่มอะไร)
	writer.Write(header)

	textinsert := `,1900152,**CYCLOPHOSPHAMIDE Inj. (stock),200 mg.,Vial,INJECTIONS,ccppi:cyclophosphamide:endoxan,N,N,N,0,  ,16711935,N,,cyclophosphamide (ENDOXAN) inj. 200 mg/vial,121.000,03,,,Y, ,N,"",sticker,0


`

	textarray := strings.Split(textinsert, ",")

	var newArray []string
	for _, v := range textarray {
		if v == "" {
			v = "NULL"
		}
		newArray = append(newArray, v)
	}

	index := 0

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			fmt.Println("Error:", err)
			return
		}

		if index < len(newArray) {
			record = append(record, newArray[index])
		} else {
			record = append(record, "NULL")
		}

		writer.Write(record)
		index++
	}

	fmt.Println("เสร็จแล้ว → output.csv")
}
