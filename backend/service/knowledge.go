package service

// KnowledgeBase — ความรู้ PostgreSQL พื้นฐาน (Read-Only)
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
25) WITH (CTE - Read Only)
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

// TableRelationships — แผนที่ความสัมพันธ์ของตาราง HOSxP
const TableRelationships = `
====================================
TABLE RELATIONSHIPS (JOIN MAP)
====================================

ใช้ข้อมูลนี้ในการเลือก JOIN ที่ถูกต้อง

--- ตาราง patient (ข้อมูลผู้ป่วย) ---
patient.hn → ovst.hn          (ผู้ป่วย → visit ผู้ป่วยนอก)
patient.hn → opd_allerg.hn    (ผู้ป่วย → ประวัติแพ้ยา)
patient.hn → opdscreen.hn     (ผู้ป่วย → คัดกรอง)
patient.hn → ovstdiag.hn      (ผู้ป่วย → วินิจฉัยโรค)

--- ตาราง ovst (visit ผู้ป่วยนอก - ตารางหลักสำหรับ Visit) ---
ovst.vn → ovstdiag.vn         (visit → วินิจฉัยโรค)
ovst.vn → opdscreen.vn        (visit → คัดกรอง/Vital Signs)
ovst.vn → referout.vn         (visit → ส่งต่อออก)
ovst.vn → referin.vn          (visit → ส่งต่อเข้า)
ovst.pttype → pttype.pttype   (visit → ประเภทสิทธิ)

--- ตาราง ovstdiag (วินิจฉัยโรค) ---
ovstdiag.icd10 → icd101.code  (รหัส ICD-10 → ชื่อโรค)

--- ตาราง s_drugitems (รายการยา) ---
s_drugitems เป็นตาราง master ยา ใช้ icode เป็น key

--- ตาราง icd9cm1 (หัตถการ) ---
icd9cm1 เป็นตาราง master หัตถการ ใช้ code เป็น key

=== IMPORTANT NOTES ===
- ใช้ vn เป็น key หลักในการ JOIN ระหว่าง visit tables (ovst, ovstdiag, opdscreen, referout, referin)
- ใช้ hn เป็น key หลักในการ JOIN กับ patient
- ใช้ vstdate ในการกรองวันที่ (ไม่ใช่ ovstdate)
- ovst เป็นตารางหลักสำหรับ visit ผู้ป่วยนอก ใช้เป็นจุดเริ่มต้นในการ JOIN
- pttype เป็นตาราง lookup สำหรับดูชื่อสิทธิ
- icd101 เป็นตาราง lookup สำหรับดูชื่อโรค
- icd9cm1 เป็นตาราง lookup สำหรับดูชื่อหัตถการ
====================================
`

// FewShotExamples — ตัวอย่าง SQL แบบ HOSxP ที่หลากหลาย
const FewShotExamples = `
====================================
HOSxP FEW-SHOT SQL EXAMPLES
====================================

--- ตัวอย่างที่ 1: นับจำนวนผู้ป่วย ---
Q: วันนี้มีผู้ป่วยมากี่คน?
SQL:
SELECT COUNT(DISTINCT hn) AS total_patients
FROM ovst
WHERE vstdate = CURRENT_DATE;

--- ตัวอย่างที่ 2: ดูข้อมูลผู้ป่วยจาก HN ---
Q: ข้อมูลผู้ป่วย HN 12345?
SQL:
SELECT hn, pname, fname, lname, sex, birthday, cid
FROM patient
WHERE hn = 12345;

--- ตัวอย่างที่ 3: วินิจฉัยโรคของผู้ป่วย (ต้อง JOIN) ---
Q: ผู้ป่วย HN 12345 ได้รับวินิจฉัยเป็นโรคอะไรบ้าง?
SQL:
SELECT o.vn, o.vstdate, d.icd10, i.tname AS disease_name
FROM ovst o
INNER JOIN ovstdiag d ON o.vn = d.vn
INNER JOIN icd101 i ON d.icd10 = i.code
WHERE o.hn = 12345
ORDER BY o.vstdate DESC;

--- ตัวอย่างที่ 4: สถิติโรค 10 อันดับ ---
Q: สถิติโรคที่พบบ่อยที่สุด 10 อันดับแรกเดือนนี้?
SQL:
SELECT d.icd10, i.tname AS disease_name, COUNT(*) AS cnt
FROM ovstdiag d
INNER JOIN icd101 i ON d.icd10 = i.code
INNER JOIN ovst o ON d.vn = o.vn
WHERE o.vstdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND o.vstdate < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY d.icd10, i.tname
ORDER BY cnt DESC
LIMIT 10;

--- ตัวอย่างที่ 5: ข้อมูลคัดกรอง Vital Signs ---
Q: ผู้ป่วย HN 12345 มา visit วันนี้ ความดันเท่าไหร่?
SQL:
SELECT o.vn, o.vstdate, s.bps, s.bpd, s.pulse, s.temperature, s.bw
FROM ovst o
INNER JOIN opdscreen s ON o.vn = s.vn
WHERE o.hn = 12345
  AND o.vstdate = CURRENT_DATE;

--- ตัวอย่างที่ 6: จำนวนผู้ป่วยตามสิทธิ ---
Q: จำนวนผู้ป่วยแยกตามสิทธิการรักษาเดือนนี้?
SQL:
SELECT pt.name AS pttype_name, COUNT(DISTINCT o.hn) AS total_patients
FROM ovst o
INNER JOIN pttype pt ON o.pttype = pt.pttype
WHERE o.vstdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND o.vstdate < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY pt.name
ORDER BY total_patients DESC;

--- ตัวอย่างที่ 7: ข้อมูลส่งต่อออก ---
Q: เดือนนี้ส่งต่อผู้ป่วยออกไปกี่ราย?
SQL:
SELECT COUNT(*) AS total_referout
FROM referout r
INNER JOIN ovst o ON r.vn = o.vn
WHERE o.vstdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND o.vstdate < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

--- ตัวอย่างที่ 8: ค้นหาโรคจากชื่อ ---
Q: ค้นหารหัสโรคที่เกี่ยวกับ "เบาหวาน"?
SQL:
SELECT code, name, tname
FROM icd101
WHERE tname ILIKE '%เบาหวาน%'
   OR name ILIKE '%diabet%';

--- ตัวอย่างที่ 9: ข้อมูลแพ้ยาของผู้ป่วย ---
Q: ผู้ป่วย HN 12345 แพ้ยาอะไรบ้าง?
SQL:
SELECT agent, symptom, report_date, seriousness_id
FROM opd_allerg
WHERE hn = '12345'
ORDER BY report_date DESC;

--- ตัวอย่างที่ 10: สถิติจำนวน visit รายวัน ---
Q: จำนวนผู้ป่วยนอกรายวันของเดือนนี้?
SQL:
SELECT vstdate, COUNT(DISTINCT hn) AS total_patients, COUNT(*) AS total_visits
FROM ovst
WHERE vstdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND vstdate < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY vstdate
ORDER BY vstdate;

--- ตัวอย่างที่ 11: ผู้ป่วยที่มา visit บ่อยที่สุด ---
Q: ผู้ป่วยที่มารับบริการบ่อยที่สุด 10 อันดับเดือนนี้?
SQL:
SELECT o.hn, p.pname, p.fname, p.lname, COUNT(*) AS visit_count
FROM ovst o
INNER JOIN patient p ON o.hn = p.hn
WHERE o.vstdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND o.vstdate < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY o.hn, p.pname, p.fname, p.lname
ORDER BY visit_count DESC
LIMIT 10;

--- ตัวอย่างที่ 12: จำนวน visit ในช่วงเวลา ---
Q: จำนวนผู้ป่วยที่มารับบริการตั้งแต่วันที่ 1 ถึงวันที่ 15 มกราคม 2025?
SQL:
SELECT COUNT(DISTINCT hn) AS total_patients
FROM ovst
WHERE vstdate BETWEEN '2025-01-01' AND '2025-01-15';

--- ตัวอย่างที่ 13: ค้นหาผู้ป่วยจากชื่อ ---
Q: ค้นหาผู้ป่วยชื่อ "สมชาย"?
SQL:
SELECT hn, pname, fname, lname, birthday, sex, cid
FROM patient
WHERE fname ILIKE '%สมชาย%';

--- ตัวอย่างที่ 14: ข้อมูลส่งต่อเข้า ---
Q: ข้อมูลส่งต่อเข้าวันนี้มีกี่ราย?
SQL:
SELECT COUNT(*) AS total_referin
FROM referin r
INNER JOIN ovst o ON r.vn = o.vn
WHERE o.vstdate = CURRENT_DATE;

--- ตัวอย่างที่ 15: สถิติโรคตามช่วงอายุ ---
Q: สถิติโรคที่พบบ่อยในผู้ป่วยอายุ 60 ปีขึ้นไป เดือนนี้?
SQL:
SELECT d.icd10, i.tname AS disease_name, COUNT(*) AS cnt
FROM ovstdiag d
INNER JOIN icd101 i ON d.icd10 = i.code
INNER JOIN ovst o ON d.vn = o.vn
INNER JOIN patient p ON o.hn = p.hn
WHERE o.vstdate >= DATE_TRUNC('month', CURRENT_DATE)
  AND o.vstdate < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birthday)) >= 60
GROUP BY d.icd10, i.tname
ORDER BY cnt DESC
LIMIT 10;

====================================
END OF FEW-SHOT EXAMPLES
====================================
`

// ColumnAliasGuide — คู่มือ column ที่ชื่อคล้ายกัน
const ColumnAliasGuide = `
====================================
COLUMN ALIAS GUIDE
====================================

--- คอลัมน์ที่มักสับสน ---
vstdate (ovst, ovstdiag, opdscreen) = วันที่มารับบริการ → ใช้ column นี้ในการกรองวันที่
refer_date (referout, referin) = วันที่ทำใบส่งต่อ
birthday (patient) = วันเกิดผู้ป่วย

--- vn vs hn ---
vn = Visit Number → ใช้เชื่อม visit กับข้อมูลอื่น (ovstdiag, opdscreen, referout, referin)
hn = Hospital Number → ใช้เชื่อม patient กับ visit

--- pttype ---
ovst.pttype = รหัสสิทธิที่ใช้ใน visit นั้น
patient.pttype = รหัสสิทธิเริ่มต้นของผู้ป่วย
pttype.pttype = Primary Key ของตาราง pttype (ใช้ JOIN)

--- icd10 ---
ovstdiag.icd10 = รหัสโรคที่วินิจฉัย
icd101.code = Primary Key ของตาราง icd101 (ใช้ JOIN กับ ovstdiag.icd10)

--- doctor ---
ovst.doctor = แพทย์ผู้ตรวจ  
ovstdiag.doctor = แพทย์ผู้วินิจฉัย  
referout.doctor = แพทย์ผู้ส่งต่อ

--- hcode ---
ทุกตารางมี hcode = รหัสสถานพยาบาล (5 หลัก)

--- sex (patient) ---
1 = ชาย
2 = หญิง

--- diagtype (ovstdiag) ---
1 = Primary Diagnosis (วินิจฉัยหลัก)
2 = Secondary Diagnosis (วินิจฉัยรอง)

====================================
END OF COLUMN ALIAS GUIDE
====================================
`
