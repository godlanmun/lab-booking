-- ============================================================
-- MIGRATION 12: ระบบประเมินความพึงพอใจ (นิสิตต้องประเมินการใช้งานครั้งก่อนก่อนจองใหม่)
-- วิธีใช้: Supabase > SQL Editor > New query > วางทั้งหมด > Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evaluations (
  id          SERIAL PRIMARY KEY,
  booking_id  INT NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  q1_ease     SMALLINT NOT NULL CHECK (q1_ease BETWEEN 1 AND 5),      -- ระบบจองใช้งานง่าย
  q2_ready    SMALLINT NOT NULL CHECK (q2_ready BETWEEN 1 AND 5),     -- ห้อง/อุปกรณ์พร้อมใช้งาน
  q3_overall  SMALLINT NOT NULL CHECK (q3_overall BETWEEN 1 AND 5),   -- ความพึงพอใจโดยรวม
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- นิสิตเห็นของตัวเอง / อาจารย์-เจ้าหน้าที่เห็นทั้งหมด
CREATE POLICY "eval select own or staff" ON public.evaluations
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR public.is_staff()
  );

-- ประเมินได้เฉพาะรายการจองของตัวเองที่ "คืนแล้ว"
CREATE POLICY "eval insert own returned booking" ON public.evaluations
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    AND booking_id IN (
      SELECT id FROM public.bookings
      WHERE status = 'returned'
        AND user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
  );
