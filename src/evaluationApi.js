import { supabase } from "./supabaseClient";

/**
 * หารายการจองของผู้ใช้ที่ "คืนแล้ว" แต่ยังไม่ได้ประเมิน (คืนรายการล่าสุดก่อน)
 * คืน null ถ้าไม่มีค้าง
 */
export async function getPendingEvaluation(userId) {
  const { data: returned, error } = await supabase
    .from("bookings")
    .select("id, use_date, start_time, end_time, booking_rooms(rooms(name))")
    .eq("user_id", userId)
    .eq("status", "returned")
    .order("use_date", { ascending: false });
  if (error) throw error;
  if (!returned || returned.length === 0) return null;

  const { data: done, error: evErr } = await supabase
    .from("evaluations")
    .select("booking_id")
    .eq("user_id", userId);
  if (evErr) throw evErr;
  const doneIds = new Set((done || []).map((e) => e.booking_id));

  const pending = returned.find((b) => !doneIds.has(b.id));
  if (!pending) return null;
  return {
    ...pending,
    roomNames: (pending.booking_rooms || []).map((r) => r.rooms?.name).filter(Boolean),
  };
}

export async function submitEvaluation({ bookingId, userId, q1, q2, q3, comment }) {
  const { error } = await supabase.from("evaluations").insert({
    booking_id: bookingId,
    user_id: userId,
    q1_ease: q1,
    q2_ready: q2,
    q3_overall: q3,
    comment: comment?.trim() || null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("รายการนี้ถูกประเมินไปแล้ว");
    throw error;
  }
}

/**
 * ดึงผลประเมินทั้งหมด (เฉพาะอาจารย์/เจ้าหน้าที่ ตาม RLS) ในช่วงวันที่ประเมิน — ไม่ดึงชื่อผู้ประเมิน
 * fromISO / toISO เป็น yyyy-mm-dd (เวลาท้องถิ่น)
 */
export async function listEvaluations(fromISO, toISO) {
  const { data, error } = await supabase
    .from("evaluations")
    .select("id, q1_ease, q2_ready, q3_overall, comment, created_at, bookings(use_date, booking_rooms(rooms(name)))")
    .gte("created_at", `${fromISO}T00:00:00`)
    .lte("created_at", `${toISO}T23:59:59`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((e) => ({
    ...e,
    roomNames: (e.bookings?.booking_rooms || []).map((r) => r.rooms?.name).filter(Boolean),
    useDate: e.bookings?.use_date,
  }));
}
