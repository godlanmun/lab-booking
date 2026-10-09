-- ============================================================
-- MIGRATION 10: ปิดช่องโหว่ - ห้ามสมัครสมาชิกเป็นอาจารย์/เจ้าหน้าที่เองผ่าน signup
-- (แก้ที่ trigger โดยตรง เพื่อป้องกันแม้มีคนเรียก API ตรงๆ ข้าม UI)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, prefix, full_name, phone, role, email)
  VALUES (
    NEW.id,
    'นาย',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'ผู้ใช้ใหม่'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'student',  -- บังคับเป็น student เสมอ ไม่สนใจค่าที่ client ส่งมา
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- หมายเหตุ: trigger เดิม (on_auth_user_created) ยังใช้ฟังก์ชันนี้อยู่แล้ว ไม่ต้องสร้างใหม่
-- CREATE OR REPLACE FUNCTION ด้านบนจะอัปเดต logic ให้ทันที

-- ------------------------------------------------------------
-- วิธีตั้งอาจารย์คนแรก (ต้องทำผ่าน SQL เท่านั้น หลังจากนี้)
-- ------------------------------------------------------------
-- 1. ให้อาจารย์สมัครสมาชิกผ่านหน้าเว็บตามปกติ (จะได้ role = student โดยอัตโนมัติ)
-- 2. รันคำสั่งนี้เพื่อเลื่อนสิทธิ์เป็นอาจารย์ (แทนอีเมลจริง):
--    UPDATE users SET role = 'instructor' WHERE email = 'อีเมลอาจารย์@example.com';
-- 3. หลังจากนั้น อาจารย์/เจ้าหน้าที่ที่มีอยู่แล้วสามารถเลื่อนสิทธิ์คนอื่นเพิ่มได้เองผ่านหน้า
--    "จัดการสมาชิก" ในเว็บ (เปลี่ยน role ได้จาก dropdown โดยไม่ต้องใช้ SQL อีก)
