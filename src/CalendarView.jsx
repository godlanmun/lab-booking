import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { listCalendarBookings, listRooms } from "./calendarApi";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_NAMES = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  borrowed: "bg-blue-100 text-blue-800 border-blue-200",
};
const STATUS_LABEL = { pending: "รออนุมัติ", approved: "อนุมัติแล้ว", borrowed: "กำลังยืม" };

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year, month) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarView() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [rooms, setRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const startDate = toISODate(new Date(year, month, 1));
        const endDate = toISODate(new Date(year, month + 1, 0));
        const data = await listCalendarBookings({ startDate, endDate });
        setBookings(data);
      } catch (err) {
        setError(err.message || "โหลดข้อมูลปฏิทินไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month]);

  const bookingsByDate = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const rooms = b.booking_rooms.map((r) => r.rooms);
      if (roomFilter !== "all" && !rooms.some((r) => String(r.id) === roomFilter)) continue;
      if (!map[b.use_date]) map[b.use_date] = [];
      map[b.use_date].push({ ...b, roomNames: rooms.map((r) => r.name).join(", ") });
    }
    return map;
  }, [bookings, roomFilter]);

  const selectedBookings = selectedDay ? bookingsByDate[selectedDay] || [] : [];

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-xs font-mono text-orange-600 tracking-widest mb-1">คณะวิทยาศาสตร์การกีฬา</p>
          <h1 className="text-xl font-semibold text-neutral-900">ปฏิทินการจองห้อง Lab</h1>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-neutral-900 min-w-[9rem] text-center">
              {MONTH_NAMES[month]} {year + 543}
            </span>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">ทุกห้อง</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 mb-3 text-xs text-neutral-500">
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm border ${STATUS_STYLE[k]}`} />
              {label}
            </span>
          ))}
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          )}
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-neutral-500 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((date, i) => {
              if (!date) return <div key={i} className="border-b border-r border-neutral-100 min-h-[6rem]" />;
              const iso = toISODate(date);
              const dayBookings = bookingsByDate[iso] || [];
              const isToday = iso === toISODate(today);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(iso)}
                  className={`text-left border-b border-r border-neutral-100 min-h-[6rem] p-1.5 hover:bg-neutral-50 transition-colors ${
                    selectedDay === iso ? "bg-orange-50" : ""
                  }`}
                >
                  <span
                    className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${
                      isToday ? "bg-orange-600 text-white" : "text-neutral-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        title={`${b.roomNames} · ${b.start_time?.slice(0, 5)}-${b.end_time?.slice(0, 5)}`}
                        className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${STATUS_STYLE[b.status]}`}
                      >
                        {b.start_time?.slice(0, 5)} {b.roomNames}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-neutral-400 px-1">+{dayBookings.length - 3} เพิ่มเติม</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="mt-4 bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">รายการวันที่ {selectedDay}</h3>
            {selectedBookings.length === 0 ? (
              <p className="text-sm text-neutral-400">ไม่มีการจองในวันนี้</p>
            ) : (
              <div className="space-y-2">
                {selectedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-sm border-b border-neutral-100 last:border-0 pb-2 last:pb-0"
                  >
                    <div>
                      <span className="font-medium text-neutral-800">
                        {b.users?.prefix}
                        {b.users?.full_name}
                      </span>
                      <span className="text-neutral-400 ml-2">
                        {b.roomNames} · {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)} น.
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
