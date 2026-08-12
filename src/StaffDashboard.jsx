import { useEffect, useState } from "react";
import {
  Loader2,
  Clock,
  DoorOpen,
  PackageCheck,
  PackageX,
  ChevronDown,
  ChevronUp,
  ArrowRightCircle,
  ArrowLeftCircle,
  IdCard,
  ShieldCheck,
} from "lucide-react";
import { listReadyBookings, checkOutBooking, checkInBooking, setEquipmentCondition } from "./staffApi";

const TABS = [
  { value: "approved", label: "รอส่งมอบ (ยืม)" },
  { value: "borrowed", label: "รอรับคืน" },
];

function ConditionToggle({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {["ปกติ", "ชำรุด"].map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-xs px-2 py-1 rounded-md border transition-colors ${
            value === opt
              ? opt === "ปกติ"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-red-600 text-white border-red-600"
              : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function BookingRow({ booking, mode, onCheckOut, onCheckIn, busy }) {
  const [expanded, setExpanded] = useState(mode === "borrowed");
  const [idChecked, setIdChecked] = useState(false);
  const [conditions, setConditions] = useState(() =>
    Object.fromEntries(booking.booking_equipment.map((e) => [e.id, e.condition_in || "ปกติ"]))
  );
  const [note, setNote] = useState("");
  const u = booking.users;
  const rooms = booking.booking_rooms.map((r) => r.rooms.name);
  const equipment = booking.booking_equipment;

  const handleConditionChange = async (itemId, value) => {
    setConditions((c) => ({ ...c, [itemId]: value }));
    try {
      await setEquipmentCondition({ bookingEquipmentId: itemId, condition: value });
    } catch {
      // เงียบไว้ก่อน — ค่าจะซิงก์อีกครั้งตอนโหลดใหม่ ไม่บล็อกการทำงานของเจ้าหน้าที่
    }
  };

  const hasDamaged = Object.values(conditions).includes("ชำรุด");

  return (
    <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {u?.prefix}
              {u?.full_name}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              รหัสนิสิต {u?.student_id} · โทร {u?.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-neutral-600 mb-3">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            {mode === "approved"
              ? `${booking.use_date} · ${booking.start_time?.slice(0, 5)} น.`
              : `กำหนดคืน ${booking.return_date} · ${booking.return_time?.slice(0, 5)} น.`}
          </span>
          <span className="flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5 text-neutral-400" />
            {rooms.join(", ") || "—"}
          </span>
          {booking.liability_agreed && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              ยอมรับเงื่อนไขความรับผิดชอบแล้ว
            </span>
          )}
        </div>

        {equipment.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium mb-2"
          >
            {expanded ? "ซ่อนรายการอุปกรณ์" : `ดูรายการอุปกรณ์ (${equipment.length})`}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {expanded && equipment.length > 0 && (
          <div className="bg-neutral-50 rounded-md p-3 mb-3 space-y-2">
            {equipment.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <span className="text-xs text-neutral-700">
                  {e.equipment.name} × {e.qty}
                </span>
                {mode === "borrowed" ? (
                  <ConditionToggle
                    value={conditions[e.id]}
                    onChange={(v) => handleConditionChange(e.id, v)}
                  />
                ) : (
                  <span className="text-xs text-neutral-400">รอส่งมอบ</span>
                )}
              </div>
            ))}
          </div>
        )}

        {mode === "approved" && (
          <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
            <span
              onClick={() => setIdChecked((c) => !c)}
              className={`w-5 h-5 flex items-center justify-center border rounded transition-colors
                ${idChecked ? "bg-emerald-600 border-emerald-600" : "border-neutral-300"}`}
            >
              {idChecked && <IdCard className="w-3.5 h-3.5 text-white" />}
            </span>
            <span className="text-xs text-neutral-700">ตรวจสอบบัตรนิสิตของ {u?.prefix}{u?.full_name} แล้ว</span>
          </label>
        )}

        {mode === "borrowed" && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="หมายเหตุการรับคืน (ถ้ามี)..."
            rows={2}
            className="w-full border border-neutral-200 rounded-md px-3 py-2 text-xs mb-3"
          />
        )}

        {mode === "approved" ? (
          <button
            onClick={() => onCheckOut(booking.id, idChecked)}
            disabled={busy || !idChecked}
            title={!idChecked ? "กรุณาตรวจสอบบัตรนิสิตก่อน" : ""}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:bg-orange-200 disabled:cursor-not-allowed text-white py-2 rounded-md transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
            ส่งมอบ (ยืม)
          </button>
        ) : (
          <button
            onClick={() => onCheckIn(booking.id, note)}
            disabled={busy}
            className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors text-white disabled:opacity-50 ${
              hasDamaged ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasDamaged ? (
              <PackageX className="w-4 h-4" />
            ) : (
              <PackageCheck className="w-4 h-4" />
            )}
            {hasDamaged ? "รับคืน (มีของชำรุด)" : "รับคืนเรียบร้อย"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StaffDashboard({ staffId = 1 }) {
  const [tab, setTab] = useState("approved");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  const load = async (status) => {
    setLoading(true);
    setError("");
    try {
      const data = await listReadyBookings(status);
      setBookings(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleCheckOut = async (id, idVerified) => {
    setBusyId(id);
    try {
      await checkOutBooking({ bookingId: id, staffId, idVerified });
      setToast("บันทึกการส่งมอบเรียบร้อย");
      await load(tab);
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleCheckIn = async (id, note) => {
    setBusyId(id);
    try {
      await checkInBooking({ bookingId: id, staffId, note });
      setToast("บันทึกการรับคืนเรียบร้อย");
      await load(tab);
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-mono text-orange-600 tracking-widest mb-1">คณะวิทยาศาสตร์การกีฬา</p>
          <h1 className="text-xl font-semibold text-neutral-900">รับ-คืน ห้อง Lab / อุปกรณ์</h1>
        </div>

        <div className="flex gap-1 mb-5 border-b border-neutral-200">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                tab === t.value
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.value === "borrowed" ? (
                <ArrowLeftCircle className="w-3.5 h-3.5" />
              ) : (
                <ArrowRightCircle className="w-3.5 h-3.5" />
              )}
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            กำลังโหลด...
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-sm text-neutral-400">ไม่มีรายการในหมวดนี้</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                mode={tab}
                busy={busyId === b.id}
                onCheckOut={handleCheckOut}
                onCheckIn={handleCheckIn}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
