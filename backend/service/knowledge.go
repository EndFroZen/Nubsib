package service

const KnowledgeBase = `
====================================
POSTGRESQL READ-ONLY KNOWLEDGE BASE
(SAFE MODE - NO DATA MODIFICATION)
====================================

Database: PostgreSQL (pg)

----------------------------------------
1) SELECT
----------------------------------------
ใช้ดึงข้อมูลจากตาราง

SELECT * FROM users;
SELECT id, name FROM users;

----------------------------------------
2) WHERE
----------------------------------------
ใช้กรองข้อมูลตามเงื่อนไข

SELECT * FROM users WHERE age > 18;
SELECT * FROM orders WHERE status = 'success';

----------------------------------------
3) ORDER BY
----------------------------------------
ใช้เรียงลำดับข้อมูล

SELECT * FROM users ORDER BY created_at DESC;

----------------------------------------
4) LIMIT / OFFSET
----------------------------------------
ใช้แบ่งหน้า (pagination)

SELECT * FROM users
ORDER BY id DESC
LIMIT 10 OFFSET 0;

----------------------------------------
5) COUNT
----------------------------------------
ใช้สำหรับนับจำนวนข้อมูล

SELECT COUNT(*) FROM users;

----------------------------------------
6) SUM / AVG / MIN / MAX
----------------------------------------
ฟังก์ชันคำนวณ

SELECT SUM(amount) FROM orders;
SELECT AVG(score) FROM students;
SELECT MIN(price) FROM products;
SELECT MAX(price) FROM products;

----------------------------------------
7) GROUP BY
----------------------------------------
จัดกลุ่มข้อมูล

SELECT status, COUNT(*)
FROM orders
GROUP BY status;

----------------------------------------
8) HAVING
----------------------------------------
กรองข้อมูลหลัง GROUP BY

SELECT status, COUNT(*)
FROM orders
GROUP BY status
HAVING COUNT(*) > 10;

----------------------------------------
9) DISTINCT
----------------------------------------
ดึงค่าที่ไม่ซ้ำ

SELECT DISTINCT status FROM orders;

----------------------------------------
10) DISTINCT ON (PostgreSQL Specific)
----------------------------------------
ดึงแถวแรกของแต่ละกลุ่ม (ต้องใช้ ORDER BY ด้วย)

SELECT DISTINCT ON (user_id) *
FROM orders
ORDER BY user_id, created_at DESC;

----------------------------------------
11) INNER JOIN
----------------------------------------

SELECT u.name, o.id
FROM users u
INNER JOIN orders o
ON u.id = o.user_id;

----------------------------------------
12) LEFT JOIN
----------------------------------------

SELECT u.name, o.id
FROM users u
LEFT JOIN orders o
ON u.id = o.user_id;

----------------------------------------
13) CURRENT_DATE
----------------------------------------
ใช้ดึงวันที่ปัจจุบัน

SELECT CURRENT_DATE;

ใช้เปรียบเทียบวัน

SELECT *
FROM subscriptions
WHERE expire_date < CURRENT_DATE;

----------------------------------------
14) NOW() / CURRENT_TIMESTAMP
----------------------------------------
ดึงวันและเวลาปัจจุบัน

SELECT NOW();
SELECT CURRENT_TIMESTAMP;

----------------------------------------
15) DATE_TRUNC (PostgreSQL Specific)
----------------------------------------
ตัดเวลาให้เหลือระดับที่ต้องการ เช่น day / month

SELECT DATE_TRUNC('day', created_at)
FROM orders;

----------------------------------------
16) EXTRACT
----------------------------------------
ดึงส่วนของวันที่ เช่น ปี เดือน

SELECT EXTRACT(YEAR FROM created_at) FROM orders;
SELECT EXTRACT(MONTH FROM created_at) FROM orders;

----------------------------------------
17) BETWEEN
----------------------------------------

SELECT *
FROM orders
WHERE created_at BETWEEN '2025-01-01' AND '2025-01-31';

----------------------------------------
18) IN
----------------------------------------

SELECT *
FROM users
WHERE role IN ('admin', 'staff');

----------------------------------------
19) LIKE / ILIKE
----------------------------------------
LIKE  = case sensitive
ILIKE = case insensitive (PostgreSQL specific)

SELECT * FROM users WHERE name ILIKE '%john%';

----------------------------------------
20) IS NULL / IS NOT NULL
----------------------------------------

SELECT * FROM users WHERE deleted_at IS NULL;

----------------------------------------
21) CASE
----------------------------------------

SELECT
  name,
  CASE
    WHEN score >= 80 THEN 'A'
    WHEN score >= 70 THEN 'B'
    ELSE 'C'
  END as grade
FROM students;

----------------------------------------
22) COALESCE
----------------------------------------
แทนค่า NULL

SELECT COALESCE(phone, 'No Phone')
FROM users;

----------------------------------------
23) EXISTS
----------------------------------------

SELECT *
FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.user_id = u.id
);

----------------------------------------
24) TYPE CAST (::) PostgreSQL Specific
----------------------------------------
แปลงชนิดข้อมูล

SELECT '123'::INTEGER;
SELECT created_at::DATE FROM orders;

----------------------------------------
25) JSON / JSONB Query (PostgreSQL Specific)
----------------------------------------
ดึงข้อมูลจาก JSONB

SELECT data->>'name'
FROM users;

SELECT *
FROM users
WHERE data->>'role' = 'admin';

----------------------------------------
26) ARRAY (PostgreSQL Specific)
----------------------------------------

SELECT ARRAY[1,2,3];

SELECT *
FROM products
WHERE tags @> ARRAY['tech'];

----------------------------------------
27) WITH (CTE - Read Only)
----------------------------------------
ใช้สร้าง temporary result

WITH recent_orders AS (
  SELECT *
  FROM orders
  WHERE created_at > NOW() - INTERVAL '7 days'
)
SELECT COUNT(*) FROM recent_orders;

====================================
END OF POSTGRESQL SAFE KNOWLEDGE
====================================

`
