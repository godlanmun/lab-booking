-- ============================================================
-- MIGRATION 6: ปรับชื่ออุปกรณ์กล้องเดิม + เพิ่มรายการอุปกรณ์ใหม่
-- ============================================================

-- 1. เปลี่ยนชื่อ "กล้อง" เดิม -> "กล้อง Panasonic"
--    ใช้ UPDATE แทนการลบ-สร้างใหม่ เพื่อไม่ให้กระทบคำขอจองเดิมที่ผูกกับอุปกรณ์ตัวนี้อยู่ (อ้างอิงด้วย id เดิม)
UPDATE equipment SET name = 'กล้อง Panasonic' WHERE name = 'กล้อง';

-- 2. เพิ่มอุปกรณ์ใหม่ (ปรับจำนวน total_qty ตามที่มีจริงได้ภายหลัง)
--    เช็คก่อนว่ายังไม่มีชื่อนี้อยู่ กันการรันซ้ำแล้วเพิ่มซ้ำ (ตาราง equipment ไม่มี unique constraint บนชื่อ)
INSERT INTO equipment (name, total_qty)
SELECT 'กล้อง Canon DSLR EOS80D', 2
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'กล้อง Canon DSLR EOS80D');

INSERT INTO equipment (name, total_qty)
SELECT 'กล้อง Sony Mirrorless ZV-E10', 2
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'กล้อง Sony Mirrorless ZV-E10');

INSERT INTO equipment (name, total_qty)
SELECT 'ไมโครโฟน Saramonic', 4
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE name = 'ไมโครโฟน Saramonic');
