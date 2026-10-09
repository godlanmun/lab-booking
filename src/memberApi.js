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
 * แก้ไขเบอร์โทรของสมาชิก
 */
export async function updateUserPhone(userId, phone) {
  const { error } = await supabase.from("users").update({ phone }).eq("id", userId);
  if (error) throw error;
}

/**
 * เปิด/ระงับการใช้งานบัญชี (ไม่ใช่การลบถาวร — ปลอดภัยกว่าและย้อนกลับได้)
 */
export async function setUserActive(userId, isActive) {
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
  if (error) throw error;
}

/**
 * แก้ไขอีเมลล็อกอิน (username) และ/หรือตั้งรหัสผ่านใหม่ให้ผู้ใช้
 * ทำผ่าน Edge Function "admin-update-user" (ใช้ service role ฝั่งเซิร์ฟเวอร์ ไม่เปิดเผยในหน้าเว็บ)
 * ส่ง email หรือ password อย่างใดอย่างหนึ่งหรือทั้งคู่
 */
export async function updateUserCredentials(userId, { email, password }) {
  const { data, error } = await supabase.functions.invoke("admin-update-user", {
    body: { userId, email, password },
  });
  if (data?.error) throw new Error(data.error);
  if (error) {
    let msg = error.message;
    try {
      const body = await error.context?.json?.();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return data;
}
