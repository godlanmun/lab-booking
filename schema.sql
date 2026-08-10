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
    prefix          VARCHAR(10) NOT NULL CHECK (prefix IN ('นาย','นาง','นางสาว')),
    full_name       VARCHAR(150) NOT NULL,
    student_id      VARCHAR(20) UNIQUE,           -- รหัสนิสิต (NULL ถ้าเป็นอาจารย์)
    phone           VARCHAR(20) NOT NULL,
    major           VARCHAR(150),                 -- สาขาวิชา
    year_level      SMALLINT,                     -- ชั้นปี (นิสิตเท่านั้น)
    role            VARCHAR(20) NOT NULL CHECK (role IN ('student','instructor','admin')),
    email           VARCHAR(150) UNIQUE,
    password_hash   TEXT,
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
-- Row Level Security (Supabase)
-- เปิดใช้เมื่อ deploy จริง เพื่อป้องกันไม่ให้ client อ่าน/แก้ข้อมูลคนอื่นได้
-- ตอนพัฒนา/ทดสอบเบื้องต้นสามารถข้ามส่วนนี้ไปก่อนได้
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_equipment ENABLE ROW LEVEL SECURITY;

-- rooms/equipment เป็น master data อ่านได้ทุกคน แก้ได้เฉพาะ admin (ตั้งค่าเพิ่มภายหลังตามระบบ auth จริง)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms readable by all" ON rooms FOR SELECT USING (true);
CREATE POLICY "equipment readable by all" ON equipment FOR SELECT USING (true);

-- หมายเหตุ: policy ด้านล่างเป็นแบบเปิดกว้างสำหรับช่วง prototype
-- (อนุญาต insert/select แบบ public) เมื่อเพิ่มระบบ login จริงแล้ว
-- ควรเปลี่ยนเป็นอิง auth.uid() แทน
CREATE POLICY "public insert booking" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "public select booking" ON bookings FOR SELECT USING (true);
CREATE POLICY "public insert booking_rooms" ON booking_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "public select booking_rooms" ON booking_rooms FOR SELECT USING (true);
CREATE POLICY "public insert booking_equipment" ON booking_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "public select booking_equipment" ON booking_equipment FOR SELECT USING (true);
CREATE POLICY "public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "public select users" ON users FOR SELECT USING (true);
