import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createBooking } from "./bookingApi";
import { useAuth } from "./AuthContext";

const ROOMS = ["Production Studio", "Control Room", "Sound Recording Room", "Computer (Mac PC)"];

const EQUIPMENT_LEFT = ["กล้อง", "เลนส์", "แบตเตอรี่", "Memory", "ขาตั้งกล้อง", "สายสัญญาณ", "อื่นๆ"];
const EQUIPMENT_RIGHT = ["กระเป๋า", "ฟิวเตอร์เลนส์", "ที่ชาร์จแบต", "ไมค์", "สายไฟ", "ราง Dolly", "อื่นๆ"];

const PURPOSES = [
  { value: "teaching", label: "การเรียนการสอนในรายวิชา" },
  { value: "activity", label: "กิจกรรม/งานภายในสาขาวิชา" },
  { value: "other", label: "อื่นๆ โปรดระบุ" },
];

function Section({ number, title, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-xs font-mono text-orange-600 tracking-widest">{number}</span>
        <h2 className="text-sm font-semibold text-neutral-800 tracking-wide">{title}</h2>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
      {children}
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      <span
        onClick={onChange}
        className={`w-5 h-5 flex items-center justify-center border rounded transition-colors
          ${checked ? "bg-orange-600 border-orange-600" : "border-neutral-300 group-hover:border-orange-400"}`}
      >
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  );
}

export default function BookingForm() {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    purpose: "teaching",
    purposeDetail: "",
    rooms: [],
    equipment: {},
    useDate: "",
    startTime: "",
    returnDate: "",
    endTime: "",
    duration: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleRoom = (room) => {
    setForm((f) => ({
      ...f,
      rooms: f.rooms.includes(room) ? f.rooms.filter((r) => r !== room) : [...f.rooms, room],
    }));
  };

  const toggleEquipment = (item) => {
    setForm((f) => ({
      ...f,
      equipment: { ...f.equipment, [item]: !f.equipment[item] },
    }));
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (form.rooms.length === 0) {
      setError("กรุณาเลือกห้อง Lab อย่างน้อย 1 ห้อง");
      return;
    }
    if (!form.useDate || !form.startTime || !form.endTime) {
      setError("กรุณาระบุวันและเวลาที่ต้องการใช้งาน");
      return;
    }
    if (form.endTime <= form.startTime) {
      setError("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
      return;
    }
    // ตามระเบียบ: ยืม/ขอใช้ได้ในวัน ไม่อนุญาตให้ยืมข้ามวัน
    if (form.returnDate && form.returnDate !== form.useDate) {
      setError("ไม่อนุญาตให้ยืม/ใช้งานข้ามวัน กรุณาเลือกวันคืนเป็นวันเดียวกับวันที่ใช้");
      return;
    }

    setLoading(true);
    try {
      await createBooking(form, profile?.id);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-orange-600" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 mb-1">ส่งคำขอแล้ว</h1>
          <p className="text-sm text-neutral-500 mb-6">
            คำขอของคุณอยู่ระหว่างรอการอนุมัติจากอาจารย์ผู้รับผิดชอบ
          </p>
          <div className="text-left bg-neutral-50 rounded-md p-4 text-sm text-neutral-600 space-y-1 mb-6">
            <p><span className="text-neutral-400">ผู้ขอใช้:</span> {form.prefix}{form.fullName}</p>
            <p><span className="text-neutral-400">ห้อง:</span> {form.rooms.join(", ")}</p>
            <p><span className="text-neutral-400">วันที่ใช้:</span> {form.useDate} เวลา {form.startTime}–{form.endTime}</p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            ← กลับไปแก้ไขคำขอ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-mono text-orange-600 tracking-widest mb-1">คณะวิทยาศาสตร์การกีฬา</p>
          <h1 className="text-xl font-semibold text-neutral-900">แบบฟอร์มขอยืม-คืนครุภัณฑ์ / ห้อง LAB</h1>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8">
          {/* ผู้ขอใช้ (จากบัญชีที่ login) */}
          <Section number="01" title="ข้อมูลผู้ขอใช้">
            <div className="bg-neutral-50 rounded-md px-4 py-3 text-sm">
              <p className="font-medium text-neutral-900">
                {profile?.prefix}
                {profile?.full_name}
              </p>
              <p className="text-neutral-500 text-xs mt-0.5">
                {profile?.student_id ? `รหัสนิสิต ${profile.student_id} · ` : ""}
                {profile?.major} {profile?.year_level ? `ชั้นปี ${profile.year_level}` : ""}
              </p>
            </div>
          </Section>

          {/* วัตถุประสงค์ */}
          <Section number="02" title="วัตถุประสงค์การใช้งาน">
            <div className="space-y-2">
              {PURPOSES.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    checked={form.purpose === p.value}
                    onChange={() => setForm((f) => ({ ...f, purpose: p.value }))}
                    className="accent-orange-600"
                  />
                  {p.label}
                </label>
              ))}
              {form.purpose === "other" && (
                <input
                  placeholder="โปรดระบุ..."
                  value={form.purposeDetail}
                  onChange={update("purposeDetail")}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              )}
            </div>
          </Section>

          {/* ห้อง Lab */}
          <Section number="03" title="ห้อง LAB ที่ต้องการใช้">
            <div className="grid grid-cols-2 gap-y-3">
              {ROOMS.map((room) => (
                <Checkbox key={room} label={room} checked={form.rooms.includes(room)} onChange={() => toggleRoom(room)} />
              ))}
            </div>
          </Section>

          {/* อุปกรณ์ */}
          <Section number="04" title="อุปกรณ์ที่ต้องการยืม">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="space-y-3">
                {EQUIPMENT_LEFT.map((item) => (
                  <Checkbox key={item} label={item} checked={!!form.equipment[item]} onChange={() => toggleEquipment(item)} />
                ))}
              </div>
              <div className="space-y-3">
                {EQUIPMENT_RIGHT.map((item) => (
                  <Checkbox key={item} label={item} checked={!!form.equipment[item]} onChange={() => toggleEquipment(item)} />
                ))}
              </div>
            </div>
          </Section>

          {/* วันเวลา */}
          <Section number="05" title="วันและเวลาที่ต้องการใช้">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">วันที่ต้องการใช้</label>
                <input type="date" value={form.useDate} onChange={update("useDate")} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">วันที่คืน</label>
                <input type="date" value={form.returnDate} onChange={update("returnDate")} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">เวลาเริ่มใช้</label>
                <input type="time" value={form.startTime} onChange={update("startTime")} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">เวลาคืน</label>
                <input type="time" value={form.endTime} onChange={update("endTime")} className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <p className="text-xs text-neutral-400 mt-2">* ยืม/ขอใช้ได้ในวันและเวลาราชการ ไม่อนุญาตให้ยืมข้ามวัน</p>
          </Section>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-medium py-3 rounded-md transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "กำลังตรวจสอบและบันทึก..." : "ส่งคำขอจอง"}
          </button>
        </div>
      </div>
    </div>
  );
}
