import { supabase } from "./supabaseClient";

/* ---------- ห้องปฏิบัติการ ---------- */

export async function listRoomsAdmin() {
  const { data, error } = await supabase.from("rooms").select("*").order("id");
  if (error) throw error;
  return data;
}

export async function createRoom({ name, capacity }) {
  const { error } = await supabase.from("rooms").insert({ name, capacity: capacity || null });
  if (error) throw error;
}

export async function updateRoom(id, { name, capacity }) {
  const { error } = await supabase.from("rooms").update({ name, capacity: capacity || null }).eq("id", id);
  if (error) throw error;
}

export async function setRoomActive(id, isActive) {
  const { error } = await supabase.from("rooms").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

/* ---------- อุปกรณ์ ---------- */

export async function listEquipmentAdmin() {
  const { data, error } = await supabase.from("equipment").select("*").order("category").order("name");
  if (error) throw error;
  return data;
}

export async function createEquipment({ name, category, totalQty, unit }) {
  const { error } = await supabase.from("equipment").insert({
    name,
    category: category || "อื่นๆ",
    total_qty: totalQty || 1,
    unit: unit || "Pcs.",
  });
  if (error) throw error;
}

export async function updateEquipment(id, { name, category, totalQty, unit }) {
  const { error } = await supabase
    .from("equipment")
    .update({ name, category, total_qty: totalQty, unit })
    .eq("id", id);
  if (error) throw error;
}

export async function setEquipmentActive(id, isActive) {
  const { error } = await supabase.from("equipment").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

/* ---------- ดึงข้อมูลสำหรับใช้ในฟอร์มจอง (เฉพาะที่เปิดใช้งาน) ---------- */

export async function listActiveRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, capacity")
    .eq("is_active", true)
    .order("id");
  if (error) throw error;
  return data;
}

export async function listActiveEquipmentGrouped() {
  const { data, error } = await supabase
    .from("equipment")
    .select("id, name, category, total_qty, unit")
    .eq("is_active", true)
    .order("category")
    .order("name");
  if (error) throw error;

  const groups = {};
  const order = [];
  for (const item of data) {
    if (!groups[item.category]) {
      groups[item.category] = [];
      order.push(item.category);
    }
    groups[item.category].push(item);
  }
  return order.map((category) => ({ category, items: groups[category] }));
}
