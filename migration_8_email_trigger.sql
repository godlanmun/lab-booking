-- ============================================================
-- MIGRATION 8: สร้าง Trigger เรียก Edge Function ผ่าน SQL โดยตรง
-- (ทางเลือกแทนการตั้งค่าผ่านหน้า Database Webhooks/Triggers UI ที่หาไม่เจอ)
-- ============================================================

-- 1. เปิดใช้ extension pg_net (ใช้สำหรับยิง HTTP request จากภายใน Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. สร้างฟังก์ชันที่จะยิงไปเรียก Edge Function ทุกครั้งที่มีคำขอจองใหม่
--    *** สำคัญ: แทน YOUR_PROJECT_ID และ YOUR_ANON_KEY ด้านล่างด้วยค่าจริงของคุณก่อนรัน ***
CREATE OR REPLACE FUNCTION public.trigger_notify_instructor()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/notify-instructor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'bookings',
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ผูก trigger เข้ากับตาราง bookings ให้ทำงานหลังมีการ insert คำขอใหม่
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.trigger_notify_instructor();
