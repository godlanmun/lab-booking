import { supabase } from "./supabaseClient";

/**
 * ดึงคำขอที่ "มีการใช้งานจริง" (อนุมัติแล้ว/กำลังยืม/คืนแล้ว) ในช่วงวันที่กำหนด
 * สำหรับคำนวณสรุปสถิติการใช้ห้อง/อุปกรณ์
 */
export async function getUsageSummary({ startDate, endDate }) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, use_date, start_time, end_time, status, purpose, purpose_detail,
       checked_out_at, checked_in_at, note, liability_agreed, id_verified,
       users:user_id (prefix, full_name, student_id),
       booking_rooms ( rooms ( id, name ) ),
       booking_equipment ( qty, condition_out, condition_in, equipment ( id, name ) )`
    )
    .gte("use_date", startDate)
    .lte("use_date", endDate)
    .in("status", ["approved", "borrowed", "returned"])
    .order("use_date", { ascending: false });

  if (error) throw error;
  return data;
}
