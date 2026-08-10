-- ============================================================
-- MIGRATION 2: แก้ infinite recursion (ถ้ายังไม่ได้แก้) + เพิ่มสิทธิ์ลบคำขอสำหรับอาจารย์/เจ้าหน้าที่
-- ============================================================

-- 1. ถ้ายังไม่เคยรัน fix infinite recursion มาก่อน ให้รันส่วนนี้
--    (ถ้ารันไปแล้วรอบก่อน ข้ามได้ - CREATE OR REPLACE / DROP IF EXISTS ปลอดภัยรันซ้ำได้)
DROP POLICY IF EXISTS "user reads own profile" ON users;
DROP POLICY IF EXISTS "select own or staff" ON bookings;
DROP POLICY IF EXISTS "update by staff or owner" ON bookings;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('instructor','admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "user reads own profile" ON users
  FOR SELECT USING (auth_id = auth.uid() OR public.is_staff());

CREATE POLICY "select own or staff" ON bookings
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR public.is_staff()
  );

CREATE POLICY "update by staff or owner" ON bookings
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR public.is_staff()
  );

-- 2. เพิ่มสิทธิ์ลบคำขอจอง — เฉพาะอาจารย์/เจ้าหน้าที่เท่านั้น
DROP POLICY IF EXISTS "delete by staff" ON bookings;
CREATE POLICY "delete by staff" ON bookings
  FOR DELETE USING (public.is_staff());
