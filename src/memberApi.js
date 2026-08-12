import { supabase } from "./supabaseClient";

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะอาจารย์/เจ้าหน้าที่เท่านั้นที่เห็นได้ ตาม RLS policy)
 */
export async function listUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_id, prefix, full_name, student_id, phone, major, year_level, role, email, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * เปลี่ยน role ของผู้ใช้ (student / instructor / admin)
 */
export async function updateUserRole(userId, role) {
  const { error } = await supabase.from("users").update({ role }).eq("id", userId);
  if (error) throw error;
}

/**
 * เปิด/ระงับการใช้งานบัญชี (ไม่ใช่การลบถาวร — ปลอดภัยกว่าและย้อนกลับได้)
 */
export async function setUserActive(userId, isActive) {
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
  if (error) throw error;
}
