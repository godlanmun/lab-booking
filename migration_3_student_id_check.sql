-- ============================================================
-- MIGRATION 3: ฟังก์ชันเช็ครหัสนิสิตซ้ำ "ก่อน" สมัครสมาชิก
-- (เพื่อกันบัญชี auth ค้าง กรณีสมัครไปแล้วแต่รหัสนิสิตซ้ำ)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_student_id_taken(p_student_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE student_id = p_student_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- อนุญาตให้เรียกได้แม้ยังไม่ login (anon) เพราะต้องเช็คก่อนสมัครสมาชิก
-- ฟังก์ชันนี้คืนค่าแค่ true/false เท่านั้น ไม่เปิดเผยข้อมูลอื่นของผู้ใช้คนอื่น จึงปลอดภัย
GRANT EXECUTE ON FUNCTION public.check_student_id_taken(TEXT) TO anon, authenticated;
