import { supabase } from "./supabaseClient";

/**
 * สมัครสมาชิกใหม่ (นิสิต หรือ อาจารย์)
 * หลังสมัคร Supabase trigger จะสร้างแถวใน public.users ให้อัตโนมัติ (role/full_name/phone เบื้องต้น)
 * แล้วเราค่อย update รายละเอียดเพิ่ม (รหัสนิสิต, สาขา, ชั้นปี) ด้วย completeProfile()
 */
export async function signUp({ email, password, fullName, phone, role }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role }, // ส่งเข้า trigger handle_new_auth_user
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * เติมรายละเอียดโปรไฟล์หลังสมัคร (รหัสนิสิต, คำนำหน้า, สาขา, ชั้นปี)
 */
export async function completeProfile({ prefix, studentId, major, year }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ยังไม่ได้เข้าสู่ระบบ");

  const { error } = await supabase
    .from("users")
    .update({ prefix, student_id: studentId || null, major, year_level: year || null })
    .eq("auth_id", user.id);

  if (error) throw error;
}

/**
 * ดึงข้อมูลผู้ใช้ปัจจุบัน (ทั้ง auth session + ข้อมูลใน public.users เช่น role)
 * คืนค่า null ถ้ายังไม่ได้ login
 */
export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("users").select("*").eq("auth_id", user.id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * ฟัง event เปลี่ยนสถานะ login/logout (ใช้ใน AuthContext)
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}
