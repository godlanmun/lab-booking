import { useState } from "react";
import {
  CalendarPlus,
  CalendarDays,
  ClipboardCheck,
  PackageCheck,
  BarChart3,
  Users,
  ShieldCheck,
  CreditCard,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { PageHeader, PageStamp, TrackLaneDivider } from "./ThemeUI";

function GuideCard({ icon: Icon, title, steps, note }) {
  return (
    <div className="bg-white border border-[#EAE3D0] rounded-lg p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#FBF3E6] flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-[#B8952B]" />
        </div>
        <h3 className="font-display text-[15px] font-semibold text-[#212124]">{title}</h3>
      </div>
      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-neutral-600 leading-relaxed">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#F5F2EA] text-[#B8952B] text-xs font-semibold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {note && (
        <div className="flex gap-2 mt-4 bg-[#FBF3E6] border border-[#E9D6A8] rounded-md px-3 py-2.5 text-xs text-[#7a5c1a] leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B8952B]" />
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}

const STUDENT_GUIDE = [
  {
    icon: LogIn,
    title: "1. สมัครสมาชิก / เข้าสู่ระบบ",
    steps: [
      "กด \"สมัครสมาชิก\" กรอกอีเมล รหัสผ่าน ชื่อ-นามสกุล เบอร์โทร รหัสนิสิต สาขาวิชา และชั้นปี",
      "ระบบจะเข้าสู่ระบบให้อัตโนมัติหลังสมัครสำเร็จ",
      "ครั้งต่อไปใช้อีเมล/รหัสผ่านเดิม เข้าสู่ระบบได้เลย",
    ],
    note: "การสมัครผ่านหน้านี้เป็นสถานะนิสิตเท่านั้น หากเป็นอาจารย์กรุณาติดต่อเจ้าหน้าที่เพื่อขอสิทธิ์เพิ่มเติม",
  },
  {
    icon: CalendarDays,
    title: "2. เช็คห้องว่างก่อนจอง",
    steps: [
      "เข้าเมนู \"ปฏิทินการจอง\" เพื่อดูภาพรวมทั้งเดือน จุดสีเขียว/เหลือง/แดง บอกว่าห้องว่าง/ว่างบางห้อง/เต็มทุกห้อง",
      "คลิกวันที่สนใจ จะเห็นรายห้องว่าง/ไม่ว่างชัดเจน",
      "หรือเช็คได้จากหน้ายื่นคำขอจองโดยตรง พอเลือกวันที่แล้ว badge สีเขียว/แดงจะขึ้นข้างชื่อห้องทันที",
    ],
  },
  {
    icon: CalendarPlus,
    title: "3. ยื่นคำขอจองห้อง / ยืมอุปกรณ์",
    steps: [
      "เลือกวัตถุประสงค์การใช้งาน (ถ้าเป็นการเรียนการสอน ต้องระบุชื่อรายวิชาด้วย)",
      "เลือกห้อง Lab ที่ต้องการ (เลือกได้มากกว่า 1 ห้อง หรือเลือก \"อื่นๆ\" ถ้าใช้งานนอกสถานที่)",
      "เลือกอุปกรณ์ที่ต้องการยืม ระบุจำนวนแต่ละชิ้นได้",
      "ระบุวันเวลาที่ต้องการใช้ และวันที่คืน (จองได้มากกว่า 1 วัน)",
      "ติ๊กยอมรับเงื่อนไขความรับผิดชอบต่ออุปกรณ์ แล้วกด \"ส่งคำขอจอง\"",
    ],
    note: "ยื่นคำขอได้เฉพาะวันจันทร์และพฤหัสบดี เวลา 8.30-16.30 น. เท่านั้น และหากยืมอุปกรณ์มากกว่า 1 วัน ต้องแจ้งอาจารย์ผู้รับผิดชอบเพิ่มเติม (ระบบจะเตือนให้อัตโนมัติ)",
  },
  {
    icon: CreditCard,
    title: "4. วันรับ-คืนอุปกรณ์จริง",
    steps: [
      "เมื่อคำขอได้รับการอนุมัติแล้ว ให้มารับอุปกรณ์ตามวันเวลาที่แจ้งไว้",
      "นำบัตรนิสิตมาแสดงต่อเจ้าหน้าที่ทุกครั้งที่รับและคืนอุปกรณ์",
      "ตรวจสอบสภาพอุปกรณ์ร่วมกับเจ้าหน้าที่ก่อนรับและหลังคืนทุกครั้ง",
    ],
  },
];

const STAFF_GUIDE = [
  {
    icon: ClipboardCheck,
    title: "1. พิจารณาอนุมัติคำขอ",
    steps: [
      "เข้าเมนู \"อนุมัติ\" ดูคำขอในแท็บ \"รออนุมัติ\"",
      "ตรวจสอบรายละเอียด: ผู้ขอใช้ วันเวลา ห้อง อุปกรณ์ และวัตถุประสงค์ (กด \"ดูรายการอุปกรณ์\" เพื่อดูรายละเอียดเต็ม)",
      "กด \"สมควร\" เพื่ออนุมัติ หรือ \"ไม่สมควร\" พร้อมระบุเหตุผลที่จะแจ้งกลับผู้ขอใช้",
    ],
  },
  {
    icon: Pencil,
    title: "2. แก้ไข / ลบคำขอ",
    steps: [
      "กดไอคอนดินสอที่มุมขวาบนของการ์ดคำขอ เพื่อแก้ไขวันเวลา วัตถุประสงค์ ทำได้แม้คำขออนุมัติไปแล้ว",
      "กดไอคอนถังขยะเพื่อลบคำขอทิ้ง (ต้องยืนยันก่อนเสมอ ลบแล้วกู้คืนไม่ได้)",
    ],
    note: "ปุ่มแก้ไข/ลบใช้ได้เฉพาะอาจารย์และเจ้าหน้าที่เท่านั้น นิสิตไม่มีสิทธิ์เข้าหน้านี้",
  },
  {
    icon: PackageCheck,
    title: "3. รับ-คืนอุปกรณ์จริง",
    steps: [
      "เข้าเมนู \"การคืนอุปกรณ์\" แท็บ \"รอส่งมอบ\" คือคำขอที่อนุมัติแล้วรอมารับของ",
      "ติ๊ก \"ตรวจสอบบัตรนิสิตแล้ว\" ก่อนกดปุ่ม \"ส่งมอบ\" เสมอ (ปุ่มจะกดไม่ได้จนกว่าจะติ๊ก)",
      "เมื่อผู้ยืมนำของมาคืน ให้สลับไปแท็บ \"รอรับคืน\" ตรวจสภาพอุปกรณ์แต่ละชิ้น (ปกติ/ชำรุด) แล้วกด \"รับคืนเรียบร้อย\"",
    ],
  },
  {
    icon: BarChart3,
    title: "4. สรุปการใช้ห้องและอุปกรณ์",
    steps: [
      "เข้าเมนู \"สรุปการใช้ห้องและอุปกรณ์\" เลือกช่วงวันที่ที่ต้องการดู",
      "ดูสถิติภาพรวม: ห้องที่ใช้บ่อยสุด อุปกรณ์ที่ยืมบ่อยสุด และกราฟสัดส่วนการใช้งาน",
      "คลิกรายการคำขอด้านล่างเพื่อดูรายละเอียดย้อนหลัง เช่น สภาพอุปกรณ์ตอนคืน เวลาส่งมอบ-รับคืนจริง",
    ],
  },
  {
    icon: Users,
    title: "5. จัดการสมาชิก",
    steps: [
      "เข้าเมนู \"จัดการสมาชิก\" ดูรายชื่อทั้งหมด กรองตามสถานะหรือค้นหาได้",
      "เปลี่ยนสิทธิ์ผู้ใช้ได้จาก dropdown (นิสิต / อาจารย์ / เจ้าหน้าที่)",
      "กด \"ระงับ\" เพื่อระงับการใช้งานบัญชีชั่วคราว (ไม่ใช่การลบถาวร) กด \"เปิดใช้งาน\" เพื่อคืนสิทธิ์",
    ],
    note: "ไม่สามารถเปลี่ยนสิทธิ์หรือระงับบัญชีของตัวเองได้ เพื่อป้องกันการล็อกตัวเองออกจากระบบโดยไม่ตั้งใจ",
  },
];

export default function GuidePage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState(
    profile?.role === "instructor" || profile?.role === "admin" ? "staff" : "student"
  );

  const guide = tab === "student" ? STUDENT_GUIDE : STAFF_GUIDE;

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="คู่มือการใช้งานระบบ" />

        <div className="flex gap-1 mb-6 bg-[#EFEADB] rounded-md p-1 max-w-sm">
          <button
            onClick={() => setTab("student")}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors font-display ${
              tab === "student" ? "bg-[#212124] text-[#D4AF37] shadow-sm" : "text-[#7a7568] hover:text-[#232323]"
            }`}
          >
            สำหรับนิสิต
          </button>
          <button
            onClick={() => setTab("staff")}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors font-display ${
              tab === "staff" ? "bg-[#212124] text-[#D4AF37] shadow-sm" : "text-[#7a7568] hover:text-[#232323]"
            }`}
          >
            สำหรับอาจารย์ / เจ้าหน้าที่
          </button>
        </div>

        <div className="space-y-4">
          {guide.map((g, i) => (
            <GuideCard key={i} icon={g.icon} title={g.title} steps={g.steps} note={g.note} />
          ))}
        </div>

        <div className="mt-6 bg-white border border-[#EAE3D0] rounded-lg p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <ShieldCheck className="w-4.5 h-4.5 text-[#B8952B]" />
            <h3 className="font-display text-[15px] font-semibold text-[#212124]">สถานะคำขอจอง</h3>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
              รออนุมัติ — อยู่ระหว่างรอการพิจารณาจากอาจารย์
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
              อนุมัติแล้ว — พร้อมมารับอุปกรณ์ตามวันเวลาที่แจ้งไว้
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
              กำลังยืม — รับอุปกรณ์ไปแล้ว รอนำมาคืน
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-200 bg-red-50 text-red-700">
              ไม่อนุมัติ — พร้อมเหตุผลจากอาจารย์
            </span>
          </div>
        </div>

        <TrackLaneDivider />
        <PageStamp />
      </div>
    </div>
  );
}
