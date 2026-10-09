// Edge Function: notify-instructor
// ทำงานเมื่อมีคำขอจองใหม่ (bookings INSERT) → ส่งอีเมลแจ้งอาจารย์ทุกคน
//
// วิธี deploy: Supabase Dashboard > Edge Functions > Create a new function
// ตั้งชื่อ "notify-instructor" แล้ววางโค้ดนี้ทั้งหมด กด Deploy

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const brevoApiKey = Deno.env.get("BREVO_API_KEY")!;
const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL")!;
const siteUrl = Deno.env.get("SITE_URL") ?? "https://lab-booking-one.vercel.app";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const PURPOSE_LABEL: Record<string, string> = {
  teaching: "การเรียนการสอนในรายวิชา",
  activity: "กิจกรรม/งานภายในสาขาวิชา",
  other: "อื่นๆ",
};

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const booking = payload.record;

    if (!booking) {
      return new Response("no record in payload", { status: 400 });
    }

    // ดึงข้อมูลผู้ขอใช้ (นิสิต/อาจารย์ที่ส่งคำขอ)
    const { data: student } = await supabase
      .from("users")
      .select("prefix, full_name, student_id")
      .eq("id", booking.user_id)
      .maybeSingle();

    // ดึงอีเมลอาจารย์ทุกคนที่ยังใช้งานอยู่ (ไม่ระงับ)
    const { data: instructors, error: instructorErr } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("role", "instructor")
      .eq("is_active", true);

    if (instructorErr) throw instructorErr;
    if (!instructors || instructors.length === 0) {
      return new Response(JSON.stringify({ message: "no instructors to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const studentName = student ? `${student.prefix}${student.full_name}` : "ผู้ใช้งาน";
    const purposeLabel = PURPOSE_LABEL[booking.purpose] ?? booking.purpose;

    const subject = `มีคำขอจองห้อง Lab ใหม่จาก ${studentName}`;
    const html = `
      <div style="font-family: 'Sarabun', sans-serif; line-height:1.7; color:#232323;">
        <p style="font-size:15px;">มีคำขอใช้ห้อง Lab / ยืมอุปกรณ์ใหม่ รอการพิจารณา</p>
        <table style="border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:4px 16px 4px 0; color:#888;">ผู้ขอใช้</td><td>${studentName}${student?.student_id ? ` (รหัส ${student.student_id})` : ""}</td></tr>
          <tr><td style="padding:4px 16px 4px 0; color:#888;">วัตถุประสงค์</td><td>${purposeLabel}</td></tr>
          <tr><td style="padding:4px 16px 4px 0; color:#888;">วันที่ใช้</td><td>${booking.use_date}</td></tr>
          <tr><td style="padding:4px 16px 4px 0; color:#888;">เวลา</td><td>${(booking.start_time || "").slice(0, 5)} - ${(booking.end_time || "").slice(0, 5)} น.</td></tr>
        </table>
        <p style="margin-top:24px;">
          <a href="${siteUrl}/approve" style="background:#EA580C; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:600;">ไปที่หน้าอนุมัติ</a>
        </p>
        <p style="font-size:12px; color:#999; margin-top:24px;">อีเมลนี้ส่งอัตโนมัติจากระบบจองห้อง Lab คณะวิทยาศาสตร์การกีฬา มหาวิทยาลัยบูรพา</p>
      </div>
    `;

    // ส่งอีเมลหาอาจารย์ทุกคนพร้อมกัน
    const results = await Promise.all(
      instructors.map((ins) =>
        fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoApiKey,
          },
          body: JSON.stringify({
            sender: { email: senderEmail, name: "ระบบจองห้อง Lab" },
            to: [{ email: ins.email, name: ins.full_name }],
            subject,
            htmlContent: html,
          }),
        })
      )
    );

    const failed = results.filter((r) => !r.ok).length;

    return new Response(
      JSON.stringify({ sent: instructors.length - failed, failed }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
