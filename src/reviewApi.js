import { supabase } from "./supabaseClient";

/**
 * ดึงรายการคำขอจองพร้อมข้อมูลผู้ขอใช้ + ห้อง + อุปกรณ์
 * status: 'pending' | 'approved' | 'rejected' | ... หรือ 'all'
 */
export async function listBookings(status = "pending") {
  let query = supabase
    .from("bookings")
    .select(
      `id, purpose, purpose_detail, use_date, start_time, end_time,
       return_date, return_time, duration_hours, status,
       review_reason, reviewed_at, created_at, liability_agreed,
       users:user_id (prefix, full_name, student_id, phone, major, year_level),
       booking_rooms ( rooms ( name ) ),
       booking_equipment ( qty, equipment ( name ) )`
    )
    .order("use_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * อนุมัติ / ไม่อนุมัติ คำขอจอง
 * reviewerId: id ของอาจารย์ผู้พิจารณา (จากตาราง users, role = 'instructor')
 */
export async function reviewBooking({ bookingId, reviewerId, result, reason }) {
  if (!["approved", "rejected"].includes(result)) {
    throw new Error("ผลการพิจารณาต้องเป็น approved หรือ rejected เท่านั้น");
  }
  if (result === "rejected" && !reason) {
    throw new Error("กรุณาระบุเหตุผลที่ไม่อนุมัติ");
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: result,
      review_result: result,
      review_reason: reason || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("status", "pending"); // กันการอนุมัติซ้ำ/แก้คำขอที่ถูกพิจารณาไปแล้ว

  if (error) throw error;
}

/**
 * แก้ไขรายละเอียดคำขอจอง (วันเวลา/วัตถุประสงค์)
 * เฉพาะอาจารย์/เจ้าหน้าที่เท่านั้นที่เรียกได้ (จำกัดสิทธิ์ไว้ที่หน้า ApprovalPage และ RLS policy)
 * ทำได้กับคำขอทุกสถานะ (รวมที่อนุมัติไปแล้ว) เพื่อรองรับกรณีต้องแก้ไขภายหลัง
 */
export async function updateBookingDetails({
  bookingId,
  useDate,
  startTime,
  endTime,
  returnDate,
  purpose,
  purposeDetail,
}) {
  if (endTime <= startTime) {
    throw new Error("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
  }
  if (returnDate && returnDate !== useDate) {
    throw new Error("ไม่อนุญาตให้ยืม/ใช้งานข้ามวัน กรุณาเลือกวันคืนเป็นวันเดียวกับวันที่ใช้");
  }

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;

  const { error } = await supabase
    .from("bookings")
    .update({
      use_date: useDate,
      start_time: startTime,
      end_time: endTime,
      return_date: returnDate || useDate,
      return_time: endTime,
      duration_hours: durationHours,
      purpose,
      purpose_detail: purposeDetail || null,
    })
    .eq("id", bookingId);

  if (error) throw error;
}

/**
 * ลบคำขอจองทิ้งทั้งรายการ (booking_rooms / booking_equipment ลบตามอัตโนมัติผ่าน CASCADE)
 * เฉพาะอาจารย์/เจ้าหน้าที่เท่านั้น (บังคับที่ RLS policy ฝั่ง database ด้วย)
 */
export async function deleteBooking(bookingId) {
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) throw error;
}
