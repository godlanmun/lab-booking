import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Camera,
  DoorOpen,
  Pencil,
  Trash2,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { listBookings, reviewBooking, updateBookingDetails, deleteBooking } from "./reviewApi";

function formatSubmittedDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear() + 543; // พ.ศ.
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm} น.`;
}

const PURPOSE_LABEL = {
  teaching: "การเรียนการสอนในรายวิชา",
  activity: "กิจกรรม/งานภายในสาขาวิชา",
  other: "อื่นๆ",
};

const TABS = [
  { value: "pending", label: "รออนุมัติ" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "rejected", label: "ไม่อนุมัติ" },
  { value: "all", label: "ทั้งหมด" },
];

function StatusBadge({ status }) {
  const map = {
    pending: { label: "รออนุมัติ", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "อนุมัติแล้ว", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "ไม่อนุมัติ", cls: "bg-red-50 text-red-700 border-red-200" },
    borrowed: { label: "กำลังยืม", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    returned: { label: "คืนแล้ว", cls: "bg-neutral-50 text-neutral-500 border-neutral-200" },
    cancelled: { label: "ยกเลิก", cls: "bg-neutral-50 text-neutral-400 border-neutral-200" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function RejectDialog({ onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">ไม่อนุมัติคำขอ</h3>
        <p className="text-xs text-neutral-500 mb-3">กรุณาระบุเหตุผลเพื่อแจ้งผู้ขอใช้</p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="เช่น ห้องไม่ว่างในช่วงเวลาดังกล่าว..."
          rows={3}
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="text-sm px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-medium"
          >
            ยืนยันไม่อนุมัติ
          </button>
        </div>
      </div>
    </div>
  );
}

function EditDialog({ booking, onCancel, onConfirm, busy }) {
  const [form, setForm] = useState({
    useDate: booking.use_date,
    startTime: booking.start_time?.slice(0, 5) || "",
    endTime: booking.end_time?.slice(0, 5) || "",
    returnDate: booking.return_date || booking.use_date,
    purpose: booking.purpose,
    purposeDetail: booking.purpose_detail || "",
  });
  const [localError, setLocalError] = useState("");
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = () => {
    setLocalError("");
    if (form.endTime <= form.startTime) {
      setLocalError("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
      return;
    }
    if (form.returnDate < form.useDate) {
      setLocalError("วันที่คืนต้องอยู่หลังหรือเท่ากับวันที่เริ่มใช้งาน");
      return;
    }
    onConfirm(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-900 mb-3">แก้ไขคำขอจอง</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">วันที่เริ่มใช้</label>
              <input
                type="date"
                value={form.useDate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    useDate: e.target.value,
                    // ถ้าวันคืนเดิมอยู่ก่อนวันเริ่มใช้ใหม่ ให้เลื่อนตามไปด้วยกันเหตุผล
                    returnDate: f.returnDate < e.target.value ? e.target.value : f.returnDate,
                  }))
                }
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">วันที่คืน</label>
              <input
                type="date"
                min={form.useDate}
                value={form.returnDate}
                onChange={update("returnDate")}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">เวลาเริ่ม</label>
              <input
                type="time"
                value={form.startTime}
                onChange={update("startTime")}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1 block">เวลาคืน</label>
              <input
                type="time"
                value={form.endTime}
                onChange={update("endTime")}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">วัตถุประสงค์</label>
            <select
              value={form.purpose}
              onChange={update("purpose")}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="teaching">การเรียนการสอนในรายวิชา</option>
              <option value="activity">กิจกรรม/งานภายในสาขาวิชา</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          {form.purpose === "other" && (
            <input
              placeholder="โปรดระบุ..."
              value={form.purposeDetail}
              onChange={update("purposeDetail")}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          )}
        </div>

        {localError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {localError}
          </div>
        )}

        <div className="flex gap-2 justify-end mt-4">
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 disabled:bg-orange-200 text-white font-medium"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ onCancel, onConfirm, busy }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">ลบคำขอจองนี้?</h3>
        <p className="text-xs text-neutral-500 mb-4">
          การลบไม่สามารถย้อนกลับได้ ข้อมูลห้อง/อุปกรณ์ที่ผูกกับคำขอนี้จะถูกลบไปด้วย
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-medium"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            ยืนยันลบ
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onApprove, onReject, onEdit, onDelete, busy }) {
  const [expanded, setExpanded] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const u = booking.users;
  const rooms = booking.booking_rooms.map((r) => r.rooms.name);
  const equipment = booking.booking_equipment;

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
              รหัสนิสิต {u?.student_id} · {u?.major} ชั้นปี {u?.year_level}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
            <button
              onClick={() => setShowEdit(true)}
              title="แก้ไข"
              className="p-1.5 rounded-md text-neutral-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              title="ลบ"
              className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-neutral-600 mb-3">
          <span className="flex items-center gap-1.5 text-neutral-400">
            <CalendarClock className="w-3.5 h-3.5" />
            ยื่นคำขอเมื่อ {formatSubmittedDate(booking.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            {booking.return_date && booking.return_date !== booking.use_date
              ? `${booking.use_date} ถึง ${booking.return_date}`
              : booking.use_date}{" "}
            · {booking.start_time?.slice(0, 5)}–{booking.end_time?.slice(0, 5)} น.
            {booking.return_date && booking.return_date !== booking.use_date && (
              <span className="text-orange-600 font-medium ml-1">(หลายวัน)</span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <DoorOpen className="w-3.5 h-3.5 text-neutral-400" />
            {rooms.join(", ") || "—"}
          </span>
          {equipment.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-neutral-400" />
              {equipment.length} รายการ
            </span>
          )}
          {booking.liability_agreed && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              ยอมรับเงื่อนไขความรับผิดชอบแล้ว
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-500 mb-3">
          วัตถุประสงค์: {PURPOSE_LABEL[booking.purpose]}
          {booking.purpose_detail ? ` — ${booking.purpose_detail}` : ""}
        </p>

        {equipment.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium mb-1"
          >
            {expanded ? "ซ่อนรายการอุปกรณ์" : "ดูรายการอุปกรณ์"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
        {expanded && (
          <ul className="text-xs text-neutral-600 bg-neutral-50 rounded-md p-3 mb-3 grid grid-cols-2 gap-1">
            {equipment.map((e, i) => (
              <li key={i}>
                • {e.equipment.name} × {e.qty}
              </li>
            ))}
          </ul>
        )}

        {booking.status === "rejected" && booking.review_reason && (
          <p className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2 mb-3">
            เหตุผล: {booking.review_reason}
          </p>
        )}

        {booking.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onApprove(booking.id)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white py-2 rounded-md transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              สมควร
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 py-2 rounded-md transition-colors"
            >
              <XCircle className="w-4 h-4" />
              ไม่สมควร
            </button>
          </div>
        )}
      </div>

      {showReject && (
        <RejectDialog
          onCancel={() => setShowReject(false)}
          onConfirm={(reason) => {
            setShowReject(false);
            onReject(booking.id, reason);
          }}
        />
      )}

      {showEdit && (
        <EditDialog
          booking={booking}
          busy={busy}
          onCancel={() => setShowEdit(false)}
          onConfirm={async (form) => {
            await onEdit(booking.id, form);
            setShowEdit(false);
          }}
        />
      )}

      {showDelete && (
        <DeleteConfirmDialog
          busy={busy}
          onCancel={() => setShowDelete(false)}
          onConfirm={async () => {
            await onDelete(booking.id);
            setShowDelete(false);
          }}
        />
      )}
    </div>
  );
}

export default function ApprovalPage({ reviewerId = 1 }) {
  const [tab, setTab] = useState("pending");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  const load = async (status) => {
    setLoading(true);
    setError("");
    try {
      const data = await listBookings(status);
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

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await reviewBooking({ bookingId: id, reviewerId, result: "approved" });
      setToast("อนุมัติคำขอเรียบร้อย");
      await load(tab);
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleReject = async (id, reason) => {
    setBusyId(id);
    try {
      await reviewBooking({ bookingId: id, reviewerId, result: "rejected", reason });
      setToast("บันทึกผลไม่อนุมัติเรียบร้อย");
      await load(tab);
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleEdit = async (id, form) => {
    setBusyId(id);
    try {
      await updateBookingDetails({
        bookingId: id,
        useDate: form.useDate,
        startTime: form.startTime,
        endTime: form.endTime,
        returnDate: form.returnDate,
        purpose: form.purpose,
        purposeDetail: form.purposeDetail,
      });
      setToast("แก้ไขคำขอเรียบร้อย");
      await load(tab);
    } catch (err) {
      setError(err.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteBooking(id);
      setToast("ลบคำขอเรียบร้อย");
      await load(tab);
    } catch (err) {
      setError(err.message || "ลบไม่สำเร็จ");
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
          <h1 className="text-xl font-semibold text-neutral-900">พิจารณาคำขอใช้ห้อง Lab / ยืมอุปกรณ์</h1>
        </div>

        <div className="flex gap-1 mb-5 border-b border-neutral-200">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.value
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
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
          <div className="text-center py-16 text-sm text-neutral-400">ไม่มีคำขอในหมวดนี้</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                busy={busyId === b.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
