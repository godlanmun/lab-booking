-- ============================================================
-- MIGRATION: อัปเกรดฐานข้อมูลเดิมให้รองรับ Supabase Auth
-- (รันไฟล์นี้แทนการรัน schema.sql ใหม่ทั้งหมด เพราะมีข้อมูลอยู่แล้ว)
-- ============================================================

-- 1. เพิ่มคอลัมน์เชื่อมกับ Supabase Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. ลบ policy แบบเปิดกว้าง (public) ของเดิมทิ้งทั้งหมด
DROP POLICY IF EXISTS "public insert booking" ON bookings;
DROP POLICY IF EXISTS "public select booking" ON bookings;
DROP POLICY IF EXISTS "public update booking" ON bookings;
DROP POLICY IF EXISTS "public insert booking_rooms" ON booking_rooms;
DROP POLICY IF EXISTS "public select booking_rooms" ON booking_rooms;
DROP POLICY IF EXISTS "public insert booking_equipment" ON booking_equipment;
DROP POLICY IF EXISTS "public select booking_equipment" ON booking_equipment;
DROP POLICY IF EXISTS "public update booking_equipment" ON booking_equipment;
DROP POLICY IF EXISTS "public insert users" ON users;
DROP POLICY IF EXISTS "public select users" ON users;
DROP POLICY IF EXISTS "rooms readable by all" ON rooms;
DROP POLICY IF EXISTS "equipment readable by all" ON equipment;

-- 3. สร้าง policy ใหม่ที่อิงสิทธิ์จริงผ่าน auth.uid()
CREATE POLICY "rooms readable by authenticated" ON rooms
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "equipment readable by authenticated" ON equipment
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user reads own profile" ON users
  FOR SELECT USING (
    auth_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('instructor','admin'))
  );
CREATE POLICY "user inserts own profile" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());
CREATE POLICY "user updates own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "select own or staff" ON bookings
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('instructor','admin'))
  );
CREATE POLICY "insert own booking" ON bookings
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "update by staff or owner" ON bookings
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('instructor','admin'))
  );

CREATE POLICY "select booking_rooms via booking" ON booking_rooms
  FOR SELECT USING (booking_id IN (SELECT id FROM bookings));
CREATE POLICY "insert booking_rooms via booking" ON booking_rooms
  FOR INSERT WITH CHECK (booking_id IN (SELECT id FROM bookings));

CREATE POLICY "select booking_equipment via booking" ON booking_equipment
  FOR SELECT USING (booking_id IN (SELECT id FROM bookings));
CREATE POLICY "insert booking_equipment via booking" ON booking_equipment
  FOR INSERT WITH CHECK (booking_id IN (SELECT id FROM bookings));
CREATE POLICY "update booking_equipment via booking" ON booking_equipment
  FOR UPDATE USING (booking_id IN (SELECT id FROM bookings));

-- 4. Trigger: สร้างแถวใน public.users อัตโนมัติเมื่อมีคน sign up ใหม่
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, prefix, full_name, phone, role, email)
  VALUES (
    NEW.id,
    'นาย',
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'ผู้ใช้ใหม่'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. (ไม่บังคับ) ถ้าต้องการสร้าง user ทดสอบเป็นอาจารย์/เจ้าหน้าที่ทันที
-- หลัง signup ผ่านหน้าเว็บแล้ว ให้มา update role ทีหลังด้วยคำสั่งนี้:
-- UPDATE users SET role = 'instructor' WHERE email = 'อีเมลอาจารย์@example.com';
