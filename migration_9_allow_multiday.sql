-- ============================================================
-- MIGRATION 9: อนุญาตให้จองห้อง/ยืมอุปกรณ์ได้มากกว่า 1 วัน
-- (เดิมมี constraint บังคับว่า use_date ต้องเท่ากับ return_date เสมอ)
-- ============================================================

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_same_day;

-- คงไว้แค่เงื่อนไขว่าวันคืนต้องไม่มาก่อนวันเริ่มใช้งาน
ALTER TABLE bookings ADD CONSTRAINT chk_return_after_use CHECK (return_date >= use_date);
