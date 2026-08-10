-- ============================================================
-- ระบบจองห้อง Lab และอุปกรณ์ (Lab Room & Equipment Booking System)
-- คณะวิทยาศาสตร์การกีฬา
-- Compatible with PostgreSQL / Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1. ผู้ใช้งาน (นิสิต / อาจารย์)
-- ------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    auth_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    prefix          VARCHAR(10) NOT NULL CHECK (prefix IN ('นาย','นาง','นางสาว')),
    full_name       VARCHAR(150) NOT NULL,
    student_id      VARCHAR(20) UNIQUE,           -- รหัสนิสิต (NULL ถ้าเป็นอาจารย์)
    phone           VARCHAR(20) NOT NULL,
    major           VARCHAR(150),                 -- สาขาวิชา
    year_level      SMALLINT,                     -- ชั้นปี (นิสิตเท่านั้น)
    role            VARCHAR(20) NOT NULL CHECK (role IN ('student','instructor','admin')),
    email           VARCHAR(150) UNIQUE,
    created_at      TIMESTAMP DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. ห้อง Lab
-- ------------------------------------------------------------
CREATE TABLE rooms (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,        -- Production Studio, Control Room, ...
    capacity        INT,
    is_active       BOOLEAN DEFAULT true
);

INSERT INTO rooms (name, capacity) VALUES
('Production Studio', 20),
('Control Room', 8),
('Sound Recording Room', 6),
('Computer (Mac PC)', 30);

-- ------------------------------------------------------------
-- 3. อุปกรณ์ครุภัณฑ์
-- ------------------------------------------------------------
CREATE TABLE equipment (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,        -- กล้อง, เลนส์, Memory, ไมค์, ...
    total_qty       INT NOT NULL DEFAULT 1,        -- จำนวนที่มีทั้งหมด
    unit            VARCHAR(20) DEFAULT 'Pcs.',
    is_active       BOOLEAN DEFAULT true
);

INSERT INTO equipment (name, total_qty) VALUES
('กล้อง', 5), ('เลนส์', 8), ('แบตเตอรี่', 10), ('Memory', 10),
('ขาตั้งกล้อง', 5), ('สายสัญญาณ', 15), ('กระเป๋า', 5),
('ฟิวเตอร์เลนส์', 5), ('ที่ชาร์จแบต', 6), ('ไมค์', 6),
('สายไฟ', 15), ('ราง Dolly', 2);

-- ------------------------------------------------------------
-- 4. คำขอจอง (หัวฟอร์ม)
-- ------------------------------------------------------------
CREATE TABLE bookings (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id),

    -- วัตถุประสงค์การใช้งาน
    purpose         VARCHAR(30) NOT NULL
                    CHECK (purpose IN ('teaching','activity','other')),
    purpose_detail  TEXT,                          -- ใช้เมื่อ purpose = 'other'

    -- ช่วงเวลาที่ต้องการใช้ / คืน (ห้ามข้ามวัน)
    use_date        DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    return_date     DATE NOT NULL,
    return_time     TIME NOT NULL,
    duration_hours  NUMERIC(4,1),

    -- สถานะคำขอ
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','borrowed','returned','cancelled')),

    -- การอนุมัติของอาจารย์
    reviewed_by     INT REFERENCES users(id),
    review_result   VARCHAR(20) CHECK (review_result IN ('approved','rejected')),
    review_reason   TEXT,
    reviewed_at     TIMESTAMP,

    -- การรับ-คืนจริง (เจ้าหน้าที่)
    checked_out_by  INT REFERENCES users(id),
    checked_out_at  TIMESTAMP,
    checked_in_by   INT REFERENCES users(id),
    checked_in_at   TIMESTAMP,
    note            TEXT,

    created_at      TIMESTAMP DEFAULT now(),

    CONSTRAINT chk_same_day CHECK (use_date = return_date),  -- ยืม-คืนภายในวันเดียวกันตามระเบียบ
    CONSTRAINT chk_time_order CHECK (end_time > start_time)
);

-- ------------------------------------------------------------
-- 5. ห้อง Lab ที่ขอใช้ในแต่ละคำขอ (many-to-many)
-- ------------------------------------------------------------
CREATE TABLE booking_rooms (
    id              SERIAL PRIMARY KEY,
    booking_id      INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    room_id         INT NOT NULL REFERENCES rooms(id),
    UNIQUE (booking_id, room_id)
);

-- ------------------------------------------------------------
-- 6. อุปกรณ์ที่ขอยืมในแต่ละคำขอ (many-to-many + สถานะยืม/คืน)
-- ------------------------------------------------------------
CREATE TABLE booking_equipment (
    id              SERIAL PRIMARY KEY,
    booking_id      INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id    INT NOT NULL REFERENCES equipment(id),
    qty             INT NOT NULL DEFAULT 1,
    condition_out   VARCHAR(20) DEFAULT 'ปกติ',   -- สภาพตอนยืม
    condition_in    VARCHAR(20),                   -- สภาพตอนคืน
    UNIQUE (booking_id, equipment_id)
);

-- ------------------------------------------------------------
-- Index สำหรับตรวจสอบการจองซ้ำ (conflict check)
-- ------------------------------------------------------------
CREATE INDEX idx_bookings_date_status ON bookings (use_date, status);
CREATE INDEX idx_booking_rooms_room ON booking_rooms (room_id);
CREATE INDEX idx_booking_equipment_equip ON booking_equipment (equipment_id);

-- ------------------------------------------------------------
-- ตัวอย่างคิวรี: เช็คว่าห้องว่างไหมในช่วงเวลาที่ขอ
-- ------------------------------------------------------------
-- SELECT br.room_id
-- FROM booking_rooms br
-- JOIN bookings b ON b.id = br.booking_id
-- WHERE br.room_id = :room_id
--   AND b.use_date = :use_date
--   AND b.status IN ('pending','approved','borrowed')
--   AND (:start_time, :end_time) OVERLAPS (b.start_time, b.end_time);

-- ============================================================
-- Row Level Security (Supabase) — อิงสิทธิ์จริงผ่าน Supabase Auth
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- master data: อ่านได้ทุกคนที่ login แล้ว
CREATE POLICY "rooms readable by authenticated" ON rooms
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "equipment readable by authenticated" ON equipment
  FOR SELECT USING (auth.role() = 'authenticated');

-- ผู้ใช้เห็น/แก้ไขข้อมูลตัวเองได้ อาจารย์เห็นได้ทุกคน (ใช้เช็คตอนอนุมัติ)
CREATE POLICY "user reads own profile" ON users
  FOR SELECT USING (
    auth_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('instructor','admin'))
  );
CREATE POLICY "user inserts own profile" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());
CREATE POLICY "user updates own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- bookings: เจ้าของคำขอเห็น/แก้ของตัวเองได้, อาจารย์เห็น/แก้ได้ทุกคำขอ (อนุมัติ), เจ้าหน้าที่ (admin) เห็น/แก้ได้ทุกคำขอ (รับ-คืน)
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

-- booking_rooms / booking_equipment: สืบสิทธิ์จาก bookings ที่มองเห็นได้
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

-- ------------------------------------------------------------
-- Trigger: สร้างแถวใน public.users อัตโนมัติเมื่อมีคน sign up ใหม่
-- (ข้อมูลรายละเอียด เช่น ชื่อ/รหัสนิสิต จะถูกกรอกเพิ่มจากหน้าเว็บหลัง signup)
-- ------------------------------------------------------------
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
