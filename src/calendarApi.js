import { supabase } from "./supabaseClient";

/**
 * ดึงคำขอจองทั้งหมดที่ "มีผลจริง" ในช่วงวันที่กำหนด (สำหรับแสดงบนปฏิทิน)
 * รวมสถานะ pending/approved/borrowed (ไม่รวม rejected/cancelled เพราะไม่ใช่การจองที่ยังมีผล)
 */
export async function listCalendarBookings({ startDate, endDate }) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, use_date, start_time, end_time, status, purpose,
       users:user_id (prefix, full_name),
       booking_rooms ( rooms ( id, name ) )`
    )
    .gte("use_date", startDate)
    .lte("use_date", endDate)
    .in("status", ["pending", "approved", "borrowed"])
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listRooms() {
  const { data, error } = await supabase.from("rooms").select("id, name").order("id");
  if (error) throw error;
  return data;
}
