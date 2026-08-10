import { supabase } from "./supabaseClient";

/**
 * ดึงคำขอที่ "อนุมัติแล้ว" (พร้อมให้ยืม) หรือ "กำลังยืม" (รอรับคืน)
 */
export async function listReadyBookings(status = "approved") {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, use_date, start_time, end_time, return_date, return_time, status, note,
       checked_out_at, checked_in_at,
       users:user_id (prefix, full_name, student_id, phone),
       booking_rooms ( rooms ( name ) ),
       booking_equipment ( id, qty, condition_out, condition_in, equipment ( name ) )`
    )
    .eq("status", status)
    .order("use_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * เจ้าหน้าที่ส่งมอบอุปกรณ์/ห้อง ให้ผู้ขอ (ยืม)
 * เปลี่ยนสถานะคำขอ approved -> borrowed พร้อมบันทึกผู้ส่งมอบ/เวลา
 */
export async function checkOutBooking({ bookingId, staffId }) {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "borrowed",
      checked_out_by: staffId,
      checked_out_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("status", "approved"); // กันการส่งมอบซ้ำ

  if (error) throw error;
}

/**
 * บันทึกสภาพอุปกรณ์แต่ละชิ้นตอนคืน (condition_in) ทีละรายการ
 * item: { id: booking_equipment.id, condition: 'ปกติ' | 'ชำรุด' | ... }
 */
export async function setEquipmentCondition({ bookingEquipmentId, condition }) {
  const { error } = await supabase
    .from("booking_equipment")
    .update({ condition_in: condition })
    .eq("id", bookingEquipmentId);

  if (error) throw error;
}

/**
 * เจ้าหน้าที่รับคืนอุปกรณ์/ห้อง (คืนครบ) ปิดคำขอ
 */
export async function checkInBooking({ bookingId, staffId, note }) {
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "returned",
      checked_in_by: staffId,
      checked_in_at: new Date().toISOString(),
      note: note || null,
    })
    .eq("id", bookingId)
    .eq("status", "borrowed"); // กันการรับคืนซ้ำ

  if (error) throw error;
}
