-- ============================================================
-- MIGRATION 7: ปรับจำนวนอุปกรณ์ให้ตรงกับของจริง
-- ============================================================

UPDATE equipment SET total_qty = 4 WHERE name = 'กล้อง Canon DSLR EOS80D';
UPDATE equipment SET total_qty = 4 WHERE name = 'กล้อง Sony Mirrorless ZV-E10';
UPDATE equipment SET total_qty = 5 WHERE name = 'ไมโครโฟน Saramonic';
