import { useEffect, useMemo, useState } from "react";
import { Loader2, DoorOpen, Camera, ClipboardList, ChevronDown, ChevronUp, ShieldCheck, CreditCard } from "lucide-react";
import { getUsageSummary } from "./summaryApi";
import { PageHeader, PageStamp, TrackLaneDivider } from "./ThemeUI";

function toISODate(d) {
  // ห้ามใช้ toISOString() เพราะแปลงเป็น UTC ทำให้วันที่เพี้ยนไป 1 วันสำหรับโซนเวลาไทย (UTC+7)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function firstDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function lastDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const PURPOSE_LABEL = {
  teaching: "การเรียนการสอนในรายวิชา",
  activity: "กิจกรรม/งานภายในสาขาวิชา",
  other: "อื่นๆ",
};

const STATUS_LABEL = { approved: "อนุมัติแล้ว", borrowed: "กำลังยืม", returned: "คืนแล้ว" };
const STATUS_STYLE = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  borrowed: "bg-blue-50 text-blue-700 border-blue-200",
  returned: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

export default function UsageSummary() {
  const today = new Date();
  const [startDate, setStartDate] = useState(toISODate(firstDayOfMonth(today)));
  const [endDate, setEndDate] = useState(toISODate(lastDayOfMonth(today)));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsageSummary({ startDate, endDate });
      setBookings(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const roomStats = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      for (const br of b.booking_rooms) {
        const name = br.rooms.name;
        map[name] = (map[name] || 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const equipmentStats = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      for (const be of b.booking_equipment) {
        const name = be.equipment.name;
        map[name] = (map[name] || 0) + be.qty;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const maxRoomCount = roomStats[0]?.[1] || 1;
  const maxEquipCount = equipmentStats[0]?.[1] || 1;

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="สรุปการใช้ห้องและอุปกรณ์" />

        <div className="flex items-end gap-3 mb-6 flex-wrap">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">ถึงวันที่</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
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
        ) : (
          <>
            {/* การ์ดสรุปรวม */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="text-xs text-neutral-400 mb-1">จำนวนคำขอที่ใช้งานจริง</p>
                <p className="text-2xl font-semibold text-neutral-900">{bookings.length}</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="text-xs text-neutral-400 mb-1">ห้องที่ใช้บ่อยที่สุด</p>
                <p className="text-lg font-semibold text-neutral-900 truncate">{roomStats[0]?.[0] || "—"}</p>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="text-xs text-neutral-400 mb-1">อุปกรณ์ที่ยืมบ่อยที่สุด</p>
                <p className="text-lg font-semibold text-neutral-900 truncate">{equipmentStats[0]?.[0] || "—"}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {/* สถิติห้อง */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-1.5">
                  <DoorOpen className="w-4 h-4 text-neutral-400" />
                  การใช้งานห้อง Lab
                </h3>
                {roomStats.length === 0 ? (
                  <p className="text-sm text-neutral-400">ไม่มีข้อมูลในช่วงที่เลือก</p>
                ) : (
                  <div className="space-y-2">
                    {roomStats.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex justify-between text-xs text-neutral-600 mb-1">
                          <span>{name}</span>
                          <span className="font-medium">{count} ครั้ง</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FBF3E6]0 rounded-full"
                            style={{ width: `${(count / maxRoomCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* สถิติอุปกรณ์ */}
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-neutral-400" />
                  การยืมอุปกรณ์
                </h3>
                {equipmentStats.length === 0 ? (
                  <p className="text-sm text-neutral-400">ไม่มีข้อมูลในช่วงที่เลือก</p>
                ) : (
                  <div className="space-y-2">
                    {equipmentStats.map(([name, count]) => (
                      <div key={name}>
                        <div className="flex justify-between text-xs text-neutral-600 mb-1">
                          <span>{name}</span>
                          <span className="font-medium">{count} ชิ้น</span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(count / maxEquipCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* รายการทั้งหมด */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-neutral-400" />
                รายการคำขอทั้งหมดในช่วงที่เลือก
              </h3>
              {bookings.length === 0 ? (
                <p className="text-sm text-neutral-400">ไม่มีข้อมูลในช่วงที่เลือก</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => {
                    const isOpen = expandedId === b.id;
                    return (
                      <div key={b.id} className="border-b border-neutral-100 last:border-0 pb-2 last:pb-0">
                        <button
                          onClick={() => setExpandedId(isOpen ? null : b.id)}
                          className="w-full flex items-center justify-between text-sm text-left"
                        >
                          <div>
                            <span className="font-medium text-neutral-800">
                              {b.users?.prefix}
                              {b.users?.full_name}
                            </span>
                            <span className="text-neutral-400 ml-2">
                              {b.use_date} · {b.start_time?.slice(0, 5)}–{b.end_time?.slice(0, 5)} น. ·{" "}
                              {b.booking_rooms.map((r) => r.rooms.name).join(", ")}
                            </span>
                            <div className="text-xs text-neutral-400 mt-0.5">
                              {PURPOSE_LABEL[b.purpose]}
                              {b.purpose_detail ? ` — ${b.purpose_detail}` : ""}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>
                              {STATUS_LABEL[b.status]}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="mt-2 mb-1 bg-neutral-50 rounded-md p-3 text-xs text-neutral-600 space-y-2">
                            <div className="flex flex-wrap gap-x-5 gap-y-1">
                              <span>
                                รหัสนิสิต/รหัสอาจารย์: <span className="font-medium">{b.users?.student_id || "—"}</span>
                              </span>
                              <span>
                                ส่งมอบเมื่อ:{" "}
                                <span className="font-medium">
                                  {b.checked_out_at ? new Date(b.checked_out_at).toLocaleString("th-TH") : "ยังไม่ส่งมอบ"}
                                </span>
                              </span>
                              <span>
                                รับคืนเมื่อ:{" "}
                                <span className="font-medium">
                                  {b.checked_in_at ? new Date(b.checked_in_at).toLocaleString("th-TH") : "ยังไม่คืน"}
                                </span>
                              </span>
                            </div>

                            <div className="flex gap-4">
                              {b.liability_agreed && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  ยอมรับเงื่อนไขความรับผิดชอบแล้ว
                                </span>
                              )}
                              {b.id_verified && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <CreditCard className="w-3.5 h-3.5" />
                                  ตรวจสอบบัตรนิสิตแล้ว
                                </span>
                              )}
                            </div>

                            {b.booking_equipment.length > 0 && (
                              <div>
                                <p className="font-medium text-neutral-700 mb-1">รายการอุปกรณ์ที่ยืม</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {b.booking_equipment.map((be, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white rounded px-2 py-1">
                                      <span>
                                        {be.equipment.name} × {be.qty}
                                      </span>
                                      {be.condition_in && (
                                        <span
                                          className={
                                            be.condition_in === "ปกติ"
                                              ? "text-emerald-600"
                                              : "text-red-600 font-medium"
                                          }
                                        >
                                          {be.condition_in}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {b.note && (
                              <div>
                                <p className="font-medium text-neutral-700 mb-1">หมายเหตุการรับคืน</p>
                                <p className="bg-white rounded px-2 py-1">{b.note}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <TrackLaneDivider />
        <PageStamp />
      </div>
    </div>
  );
}
