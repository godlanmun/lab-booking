import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { createBooking, getRoomAvailabilityHint } from "./bookingApi";
import { useAuth } from "./AuthContext";
import { PageHeader, PageStamp, TrackLaneDivider } from "./ThemeUI";

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
        <span className="text-xs font-mono text-[#B8952B] tracking-widest">{number}</span>
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
          ${checked ? "bg-[#B8952B] border-[#B8952B]" : "border-neutral-300 group-hover:border-[#D4AF37]"}`}
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
  const [roomAvailability, setRoomAvailability] = useState(null); // { roomName: boolean(ไม่ว่าง) }
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMultiDayWarning, setShowMultiDayWarning] = useState(false);

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

  // เช็คห้องว่าง/ไม่ว่างแบบเร็ว (advisory) ทันทีที่เลือกวันที่ครบ ให้นิสิตเห็นก่อนเลือกห้อง
  useEffect(() => {
    if (!form.useDate) {
      setRoomAvailability(null);
      return;
    }
    let cancelled = false;
    setCheckingAvailability(true);
    getRoomAvailabilityHint({ useDate: form.useDate, returnDate: form.returnDate })
      .then((result) => {
        if (!cancelled) setRoomAvailability(result);
      })
      .catch(() => {
        if (!cancelled) setRoomAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.useDate, form.returnDate]);

  const hasEquipmentSelected = Object.entries(form.equipment).some(([, qty]) => qty > 0);
  const isMultiDay = form.useDate && form.returnDate && form.returnDate !== form.useDate;

  const validate = () => {
    if (form.purpose === "teaching" && !form.purposeDetail.trim()) {
      return "กรุณาระบุชื่อรายวิชา";
    }
    if (form.rooms.length === 0 && !form.otherRoom) {
      return "กรุณาเลือกห้อง Lab หรือระบุสถานที่ใช้งานอื่นๆ อย่างน้อย 1 รายการ";
    }
    if (form.otherRoom && !form.otherRoomNote.trim()) {
      return "กรุณาระบุรายละเอียดสถานที่ใช้งานอื่นๆ";
    }
    if (!form.useDate || !form.startTime || !form.endTime) {
      return "กรุณาระบุวันและเวลาที่ต้องการใช้งาน";
    }
    if (form.endTime <= form.startTime) {
      return "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น";
    }
    if (form.returnDate && form.returnDate < form.useDate) {
      return "วันที่คืนต้องอยู่หลังหรือเท่ากับวันที่เริ่มใช้งาน";
    }
    if (!form.liabilityAgreed) {
      return "กรุณายอมรับเงื่อนไขความรับผิดชอบต่ออุปกรณ์ก่อนส่งคำขอ";
    }
    return "";
  };

  const performSubmit = async () => {
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

  const handleSubmit = async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // ยืมอุปกรณ์ข้ามวัน (มากกว่า 1 วัน) ต้องเตือนก่อนเสมอ ให้อาจารย์พิจารณาเป็นรายกรณี
    if (isMultiDay && hasEquipmentSelected) {
      setShowMultiDayWarning(true);
      return;
    }

    await performSubmit();
  };

  const confirmMultiDayAndSubmit = async () => {
    setShowMultiDayWarning(false);
    await performSubmit();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-lg p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FBF3E6] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-[#B8952B]" />
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
            className="text-sm text-[#B8952B] hover:text-[#96762a] font-medium"
          >
            ← กลับไปแก้ไขคำขอ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="แบบฟอร์มขอยืม-คืนครุภัณฑ์ / ห้อง LAB" />

        <div className="bg-white border border-[#EAE3D0] rounded-lg p-6 sm:p-8 shadow-[0_1px_3px_rgba(33,33,36,0.04)]">
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
                    className="accent-[#B8952B]"
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
            {!form.useDate ? (
              <p className="text-xs text-neutral-400 mb-3">
                * เลือกวันที่ต้องการใช้งานในหัวข้อ 05 ด้านล่างก่อน เพื่อดูว่าห้องไหนว่าง
              </p>
            ) : checkingAvailability ? (
              <p className="text-xs text-neutral-400 mb-3 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                กำลังเช็คห้องว่าง...
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mb-3">
                สถานะห้องสำหรับวันที่เลือก (เช็คเบื้องต้น ระบบจะเช็คซ้ำอีกครั้งตอนส่งคำขอ)
              </p>
            )}
            <div className="grid grid-cols-2 gap-y-3">
              {ROOMS.map((room) => {
                const isOccupied = roomAvailability?.[room];
                return (
                  <div key={room} className="flex items-center justify-between gap-2">
                    <Checkbox label={room} checked={form.rooms.includes(room)} onChange={() => toggleRoom(room)} />
                    {roomAvailability && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                          isOccupied
                            ? "border-red-200 bg-red-50 text-red-600"
                            : "border-emerald-200 bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isOccupied ? "ไม่ว่าง" : "ว่าง"}
                      </span>
                    )}
                  </div>
                );
              })}
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
            <p className="text-xs text-neutral-400 mt-2">
              * เลือกวันคืนต่างจากวันเริ่มใช้ได้ (จองหลายวัน) — หากมีการยืมอุปกรณ์ร่วมด้วยและจองมากกว่า 1 วัน
              ระบบจะแจ้งเตือนให้ติดต่ออาจารย์ผู้รับผิดชอบก่อนส่งคำขอ
            </p>
          </Section>

          {/* ข้อตกลงความรับผิดชอบ */}
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-md p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <span
                onClick={() => setForm((f) => ({ ...f, liabilityAgreed: !f.liabilityAgreed }))}
                className={`mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center border rounded transition-colors
                  ${form.liabilityAgreed ? "bg-[#B8952B] border-[#B8952B]" : "border-neutral-300 bg-white"}`}
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
            className="w-full flex items-center justify-center gap-2 bg-[#B8952B] hover:bg-[#96762a] disabled:bg-[#e3cf94] text-white text-sm font-medium py-3 rounded-md transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "กำลังตรวจสอบและบันทึก..." : "ส่งคำขอจอง"}
          </button>

          <div className="mt-5 bg-red-50 border-2 border-red-200 rounded-lg px-4 py-3.5 flex items-start gap-2.5">
            <Clock className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed font-medium text-left">
              การยื่นขอจองห้องแล็บ และยืมอุปกรณ์ ให้นิสิตยื่นในระบบได้ในเวลาราชการ 8.30-16.30 น. เฉพาะวันจันทร์
              และวันพฤหัสบดี และการพิจารณาอนุมัติจะดำเนินการภายในวันจันทร์ และพฤหัสบดี เท่านั้น
            </p>
          </div>
        </div>

        <TrackLaneDivider />
        <PageStamp />
      </div>

      {showMultiDayWarning && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">ยืมอุปกรณ์มากกว่า 1 วัน</h3>
            <p className="text-sm text-neutral-600 leading-relaxed mb-5">
              กรณียืมอุปกรณ์มากกว่า 1 วัน ให้แจ้งอาจารย์ผู้รับผิดชอบ และจะพิจารณาความเหมาะสมเป็นรายกรณี
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMultiDayWarning(false)}
                className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmMultiDayAndSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-[#B8952B] hover:bg-[#96762a] disabled:bg-[#eeddb0] text-white font-medium"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                เข้าใจแล้ว ดำเนินการต่อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
