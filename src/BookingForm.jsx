import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createBooking } from "./bookingApi";
import { useAuth } from "./AuthContext";

const ROOMS = ["Production Studio", "Control Room", "Sound Recording Room", "Computer (Mac PC)"];

const EQUIPMENT_CATEGORIES = [
  {
    name: "กล้อง",
    items: [
      { key: "กล้อง Panasonic", label: "กล้อง Panasonic" },
      { key: "กล้อง Canon DSLR EOS80D", label: "กล้อง Canon DSLR EOS80D" },
      { key: "กล้อง Sony Mirrorless ZV-E10", label: "กล้อง Sony Mirrorless ZV-E10" },
    ],
  },
  {
    name: "เลนส์และอุปกรณ์เสริมกล้อง",
    items: [
      { key: "เลนส์", label: "เลนส์" },
      { key: "ฟิวเตอร์เลนส์", label: "ฟิวเตอร์เลนส์" },
      { key: "ขาตั้งกล้อง", label: "ขาตั้งกล้อง" },
      { key: "ราง Dolly", label: "ราง Dolly" },
    ],
  },
  {
    name: "เสียง",
    items: [
      { key: "ไมค์", label: "ไมค์" },
      { key: "ไมโครโฟน Saramonic", label: "ไมโครโฟน Saramonic" },
    ],
  },
  {
    name: "พลังงานและสายสัญญาณ",
    items: [
      { key: "แบตเตอรี่", label: "แบตเตอรี่" },
      { key: "ที่ชาร์จแบต", label: "ที่ชาร์จแบต" },
      { key: "สายไฟ", label: "สายไฟ" },
      { key: "สายสัญญาณ", label: "สายสัญญาณ" },
      { key: "Memory", label: "Memory" },
    ],
  },
  {
    name: "อื่นๆ",
    items: [
      { key: "กระเป๋า", label: "กระเป๋า" },
      { key: "equipment_other", label: "อื่นๆ (โปรดระบุ)" },
    ],
  },
];

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

function QtyStepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 ml-7 mt-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-6 h-6 flex items-center justify-center rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-100 text-sm leading-none"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 text-center border border-neutral-300 rounded px-1 py-0.5 text-sm"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 flex items-center justify-center rounded border border-neutral-300 text-neutral-500 hover:bg-neutral-100 text-sm leading-none"
      >
        +
      </button>
      <span className="text-xs text-neutral-400">ชิ้น</span>
    </div>
  );
}

export default function BookingForm() {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    purpose: "teaching",
    purposeDetail: "",
    equipmentOtherNote: "",
    liabilityAgreed: false,
    rooms: [],
    otherRoom: false,
    otherRoomNote: "",
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
    setForm((f) => {
      const nextEquipment = { ...f.equipment };
      if (nextEquipment[item]) {
        delete nextEquipment[item]; // ยกเลิกติ๊ก -> เอาออกทั้งหมด
      } else {
        nextEquipment[item] = 1; // ติ๊กใหม่ -> เริ่มที่จำนวน 1
      }
      return { ...f, equipment: nextEquipment };
    });
  };

  const setEquipmentQty = (item, qty) => {
    const n = Math.max(1, Math.min(99, Number(qty) || 1));
    setForm((f) => ({ ...f, equipment: { ...f.equipment, [item]: n } }));
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (form.purpose === "teaching" && !form.purposeDetail.trim()) {
      setError("กรุณาระบุชื่อรายวิชา");
      return;
    }
    if (form.rooms.length === 0 && !form.otherRoom) {
      setError("กรุณาเลือกห้อง Lab หรือระบุสถานที่ใช้งานอื่นๆ อย่างน้อย 1 รายการ");
      return;
    }
    if (form.otherRoom && !form.otherRoomNote.trim()) {
      setError("กรุณาระบุรายละเอียดสถานที่ใช้งานอื่นๆ");
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
    if (!form.liabilityAgreed) {
      setError("กรุณายอมรับเงื่อนไขความรับผิดชอบต่ออุปกรณ์ก่อนส่งคำขอ");
      return;
    }

    // รวมข้อความ "อุปกรณ์อื่นๆ" (ถ้ามี) เข้าไปในวัตถุประสงค์ที่บันทึกจริง
    // เพราะ schema เดิมยังไม่มีคอลัมน์แยกสำหรับอุปกรณ์กำหนดเอง
    const otherEquipmentNote =
      form.equipment.equipment_other && form.equipmentOtherNote.trim()
        ? form.equipmentOtherNote.trim()
        : null;
    const combinedPurposeDetail = [
      form.purposeDetail.trim() || null,
      otherEquipmentNote ? `อุปกรณ์อื่นๆ: ${otherEquipmentNote}` : null,
      form.otherRoom && form.otherRoomNote.trim() ? `สถานที่อื่นๆ: ${form.otherRoomNote.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    setLoading(true);
    try {
      await createBooking({ ...form, purposeDetail: combinedPurposeDetail }, profile?.id);
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
            <p><span className="text-neutral-400">ผู้ขอใช้:</span> {profile?.prefix}{profile?.full_name}</p>
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
              {form.purpose === "teaching" && (
                <input
                  placeholder="ระบุชื่อรายวิชา"
                  value={form.purposeDetail}
                  onChange={update("purposeDetail")}
                  className="mt-1 w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />
              )}
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
              <div>
                <Checkbox
                  label="อื่นๆ"
                  checked={form.otherRoom}
                  onChange={() => setForm((f) => ({ ...f, otherRoom: !f.otherRoom }))}
                />
                {form.otherRoom && (
                  <input
                    placeholder="เช่น ใช้งานนอกสถานที่..."
                    value={form.otherRoomNote}
                    onChange={update("otherRoomNote")}
                    className="mt-1.5 ml-7 w-[calc(100%-1.75rem)] border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
                  />
                )}
              </div>
            </div>
          </Section>

          {/* อุปกรณ์ */}
          <Section number="04" title="อุปกรณ์ที่ต้องการยืม">
            <div className="space-y-5">
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                    {cat.name}
                  </p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {cat.items.map((item) => (
                      <div key={item.key}>
                        <Checkbox
                          label={item.label}
                          checked={!!form.equipment[item.key]}
                          onChange={() => toggleEquipment(item.key)}
                        />
                        {!!form.equipment[item.key] && (
                          <QtyStepper
                            value={form.equipment[item.key]}
                            onChange={(v) => setEquipmentQty(item.key, v)}
                          />
                        )}
                        {item.key === "equipment_other" && form.equipment[item.key] && (
                          <input
                            placeholder="ระบุอุปกรณ์อื่นๆ..."
                            value={form.equipmentOtherNote}
                            onChange={update("equipmentOtherNote")}
                            className="mt-1.5 ml-7 w-[calc(100%-1.75rem)] border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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

          {/* ข้อตกลงความรับผิดชอบ */}
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-md p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <span
                onClick={() => setForm((f) => ({ ...f, liabilityAgreed: !f.liabilityAgreed }))}
                className={`mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center border rounded transition-colors
                  ${form.liabilityAgreed ? "bg-orange-600 border-orange-600" : "border-neutral-300 bg-white"}`}
              >
                {form.liabilityAgreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </span>
              <span className="text-xs text-neutral-700 leading-relaxed">
                ข้าพเจ้าขอรับรองว่าจะดูแลอุปกรณ์เป็นอย่างดี เมื่อเสร็จสิ้นการใช้งานแล้ว หากเกิดการชำรุดเสียหายประการใด
                ข้าพเจ้าจะเป็นผู้รับผิดชอบค่าใช้จ่ายในการซ่อมแซมอุปกรณ์ทั้งหมด และจะนำบัตรนิสิตมาแสดงตอนรับ-คืนอุปกรณ์ทุกครั้ง
              </span>
            </label>
          </div>

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
