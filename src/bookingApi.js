import { supabase } from "./supabaseClient";

/**
 * ดึง id ของห้อง/อุปกรณ์ จากชื่อ (ตาราง rooms / equipment เป็น master data คงที่)
 */
async function getIdsByNames(table, names) {
  if (names.length === 0) return [];
  const { data, error } = await supabase.from(table).select("id, name").in("name", names);
  if (error) throw error;
  return data.map((row) => row.id);
}

/**
 * เช็คว่าห้องที่เลือก "ว่าง" ในช่วงเวลาที่ขอหรือไม่
 * คืนค่า array ของชื่อห้องที่ชนกับคำขออื่นที่ pending/approved/borrowed อยู่แล้ว
 */
export async function checkRoomConflicts({ roomIds, useDate, startTime, endTime }) {
  if (roomIds.length === 0) return [];

  const { data, error } = await supabase
    .from("booking_rooms")
    .select(
      `room_id, rooms(name), bookings!inner(use_date, start_time, end_time, status)`
    )
    .in("room_id", roomIds)
    .eq("bookings.use_date", useDate)
    .in("bookings.status", ["pending", "approved", "borrowed"]);

  if (error) throw error;

  // หา overlap ด้วยเงื่อนไข start1 < end2 AND start2 < end1
  const conflicts = data.filter(
    (row) => startTime < row.bookings.end_time && row.bookings.start_time < endTime
  );

  return [...new Set(conflicts.map((c) => c.rooms.name))];
}

/**
 * เช็คว่าอุปกรณ์ที่เลือกมีจำนวนพอให้ยืมในช่วงเวลาที่ขอหรือไม่
 * คืนค่า array ของ { name, requested, available } สำหรับรายการที่ไม่พอ
 */
export async function checkEquipmentAvailability({ equipmentNames, useDate, startTime, endTime }) {
  if (equipmentNames.length === 0) return [];

  const { data: equipmentRows, error: eqErr } = await supabase
    .from("equipment")
    .select("id, name, total_qty")
    .in("name", equipmentNames);
  if (eqErr) throw eqErr;

  const shortages = [];

  for (const eq of equipmentRows) {
    const { data: overlapping, error } = await supabase
      .from("booking_equipment")
      .select(`qty, bookings!inner(use_date, start_time, end_time, status)`)
      .eq("equipment_id", eq.id)
      .eq("bookings.use_date", useDate)
      .in("bookings.status", ["pending", "approved", "borrowed"]);

    if (error) throw error;

    const alreadyBooked = overlapping
      .filter((row) => startTime < row.bookings.end_time && row.bookings.start_time < endTime)
      .reduce((sum, row) => sum + row.qty, 0);

    const available = eq.total_qty - alreadyBooked;
    if (available < 1) {
      shortages.push({ name: eq.name, requested: 1, available: Math.max(available, 0) });
    }
  }

  return shortages;
}

/**
 * สร้างคำขอจองแบบเต็ม: ตรวจสอบ conflict ก่อน แล้วค่อย insert
 * userId: id ของผู้ใช้ (จาก public.users, ได้จาก profile ที่ login อยู่)
 * throw Error พร้อมข้อความภาษาไทยถ้าห้อง/อุปกรณ์ไม่ว่าง
 */
export async function createBooking(form, userId) {
  if (!userId) throw new Error("กรุณาเข้าสู่ระบบก่อนทำการจอง");

  const roomIds = await getIdsByNames("rooms", form.rooms);
  const equipmentNames = Object.keys(form.equipment).filter((k) => form.equipment[k]);

  // 1. เช็คห้องว่าง
  const roomConflicts = await checkRoomConflicts({
    roomIds,
    useDate: form.useDate,
    startTime: form.startTime,
    endTime: form.endTime,
  });
  if (roomConflicts.length > 0) {
    throw new Error(`ห้องต่อไปนี้ถูกจองแล้วในช่วงเวลาที่เลือก: ${roomConflicts.join(", ")}`);
  }

  // 2. เช็คอุปกรณ์พอไหม
  const shortages = await checkEquipmentAvailability({
    equipmentNames,
    useDate: form.useDate,
    startTime: form.startTime,
    endTime: form.endTime,
  });
  if (shortages.length > 0) {
    const msg = shortages.map((s) => `${s.name} (เหลือ ${s.available})`).join(", ");
    throw new Error(`อุปกรณ์ไม่พอในช่วงเวลาที่เลือก: ${msg}`);
  }

  // 3. คำนวณชั่วโมงใช้งาน
  const [sh, sm] = form.startTime.split(":").map(Number);
  const [eh, em] = form.endTime.split(":").map(Number);
  const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;

  // 4. สร้างคำขอจอง (bookings)
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      purpose: form.purpose,
      purpose_detail: form.purposeDetail || null,
      use_date: form.useDate,
      start_time: form.startTime,
      end_time: form.endTime,
      return_date: form.returnDate || form.useDate,
      return_time: form.endTime,
      duration_hours: durationHours,
      status: "pending",
      liability_agreed: !!form.liabilityAgreed,
    })
    .select("id")
    .single();

  if (bookingErr) throw bookingErr;

  // 5. ผูกห้องที่เลือก
  if (roomIds.length > 0) {
    const { error: roomErr } = await supabase
      .from("booking_rooms")
      .insert(roomIds.map((room_id) => ({ booking_id: booking.id, room_id })));
    if (roomErr) throw roomErr;
  }

  // 6. ผูกอุปกรณ์ที่เลือก
  if (equipmentNames.length > 0) {
    const equipmentIds = await getIdsByNames("equipment", equipmentNames);
    const { error: eqErr } = await supabase
      .from("booking_equipment")
      .insert(equipmentIds.map((equipment_id) => ({ booking_id: booking.id, equipment_id, qty: 1 })));
    if (eqErr) throw eqErr;
  }

  return booking.id;
}
