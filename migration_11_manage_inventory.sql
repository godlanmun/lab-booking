-- ============================================================
-- MIGRATION 11: เพิ่มการจัดการห้องปฏิบัติการ/อุปกรณ์ (เพิ่ม/แก้ไข/ปรับจำนวน) สำหรับอาจารย์-เจ้าหน้าที่
-- ============================================================

-- 1. เพิ่มคอลัมน์หมวดหมู่ให้อุปกรณ์ (ไว้จัดกลุ่มแสดงในฟอร์มจอง)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'อื่นๆ';

-- 2. จัดหมวดหมู่ของเดิมให้ตรงกับที่เคย hardcode ไว้ในฟอร์ม
UPDATE equipment SET category = 'กล้อง'
  WHERE name IN ('กล้อง Panasonic', 'กล้อง Canon DSLR EOS80D', 'กล้อง Sony Mirrorless ZV-E10');
UPDATE equipment SET category = 'เลนส์และอุปกรณ์เสริมกล้อง'
  WHERE name IN ('เลนส์', 'ฟิวเตอร์เลนส์', 'ขาตั้งกล้อง', 'ราง Dolly');
UPDATE equipment SET category = 'เสียง'
  WHERE name IN ('ไมค์', 'ไมโครโฟน Saramonic');
UPDATE equipment SET category = 'พลังงานและสายสัญญาณ'
  WHERE name IN ('แบตเตอรี่', 'ที่ชาร์จแบต', 'สายไฟ', 'สายสัญญาณ', 'Memory');
UPDATE equipment SET category = 'อื่นๆ'
  WHERE name IN ('กระเป๋า');

-- 3. เปิดสิทธิ์ให้อาจารย์/เจ้าหน้าที่ เพิ่ม-แก้ไข-ปิดใช้งานห้องและอุปกรณ์ได้
--    (นโยบายอ่านข้อมูลเดิม "rooms/equipment readable by authenticated" ยังอยู่ควบคู่กัน)
DROP POLICY IF EXISTS "staff manages rooms" ON rooms;
CREATE POLICY "staff manages rooms" ON rooms
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "staff manages equipment" ON equipment;
CREATE POLICY "staff manages equipment" ON equipment
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
