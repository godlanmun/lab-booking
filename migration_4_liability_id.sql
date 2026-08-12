-- ============================================================
-- MIGRATION 4: เพิ่มการรับรองความรับผิดชอบ (ตอนจอง) + เช็คบัตรนิสิต (ตอนส่งมอบ)
-- ============================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS liability_agreed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP;
