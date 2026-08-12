-- ============================================================
-- MIGRATION 5: เพิ่มการจัดการสมาชิก (เปลี่ยน role / ระงับการใช้งาน)
-- ============================================================

-- 1. เพิ่มคอลัมน์สถานะการใช้งาน (แทนการลบถาวร)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. อนุญาตให้อาจารย์/เจ้าหน้าที่ แก้ไขข้อมูลผู้ใช้คนอื่นได้ (เปลี่ยน role, ระงับการใช้งาน)
--    (นโยบายเดิม "user updates own profile" ยังอยู่ควบคู่กัน — แก้ของตัวเองได้เสมอ)
DROP POLICY IF EXISTS "staff updates any profile" ON users;
CREATE POLICY "staff updates any profile" ON users
  FOR UPDATE USING (public.is_staff());
