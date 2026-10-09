// Edge Function: admin-update-user
// ให้อาจารย์/เจ้าหน้าที่ แก้ไขอีเมล (username ที่ใช้ล็อกอิน) และตั้งรหัสผ่านใหม่ให้ผู้ใช้ได้
//
// วิธี deploy: Supabase Dashboard > Edge Functions > Deploy a new function > Via Editor
// ตั้งชื่อ "admin-update-user" วางโค้ดนี้ทั้งหมด แล้วกด Deploy
// (ไม่ต้องตั้ง Secret เพิ่ม — SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY มีให้อัตโนมัติ)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceRoleKey);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // 1) ตรวจว่าผู้เรียก login อยู่จริง
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return json({ error: "ไม่ได้เข้าสู่ระบบ" }, 401);
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) return json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);

    // 2) ตรวจว่าเป็นอาจารย์/เจ้าหน้าที่ที่ยังใช้งานอยู่
    const { data: me } = await admin
      .from("users")
      .select("role, is_active")
      .eq("auth_id", caller.user.id)
      .maybeSingle();
    if (!me || !["instructor", "admin"].includes(me.role) || me.is_active === false) {
      return json({ error: "ไม่มีสิทธิ์ดำเนินการ" }, 403);
    }

    // 3) อ่านค่าที่ส่งมา
    const { userId, email, password } = await req.json();
    if (!userId) return json({ error: "ไม่พบรหัสผู้ใช้" }, 400);

    const { data: target } = await admin.from("users").select("id, auth_id, email").eq("id", userId).maybeSingle();
    if (!target?.auth_id) return json({ error: "ไม่พบบัญชีผู้ใช้" }, 404);

    const attrs: Record<string, unknown> = {};
    const newEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (newEmail && newEmail !== (target.email ?? "").toLowerCase()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, 400);
      attrs.email = newEmail;
      attrs.email_confirm = true;
    }
    if (password) {
      if (typeof password !== "string" || password.length < 6) {
        return json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, 400);
      }
      attrs.password = password;
    }
    if (Object.keys(attrs).length === 0) return json({ error: "ไม่มีข้อมูลที่ต้องแก้ไข" }, 400);

    // 4) อัปเดตบัญชีล็อกอิน
    const { error: updErr } = await admin.auth.admin.updateUserById(target.auth_id, attrs);
    if (updErr) {
      const msg = /already|registered|exists/i.test(updErr.message)
        ? "อีเมลนี้ถูกใช้งานแล้ว"
        : updErr.message;
      return json({ error: msg }, 400);
    }

    // 5) ซิงก์อีเมลในตารางผู้ใช้
    if (attrs.email) {
      const { error: syncErr } = await admin.from("users").update({ email: attrs.email }).eq("id", target.id);
      if (syncErr) return json({ error: "แก้อีเมลล็อกอินแล้ว แต่ซิงก์ตารางไม่สำเร็จ: " + syncErr.message }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
