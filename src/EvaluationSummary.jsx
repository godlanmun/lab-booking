import { useEffect, useMemo, useState } from "react";
import { Loader2, Star, MessageSquare, BarChart3 } from "lucide-react";
import { listEvaluations } from "./evaluationApi";
import { QUESTIONS } from "./EvaluationForm";
import { PageHeader, PageStamp, TrackLaneDivider } from "./ThemeUI";

function toISODate(d) {
  // ห้ามใช้ toISOString() (เพี้ยน 1 วันในโซนเวลาไทย)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function Dist({ values }) {
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, c: values.filter((v) => v === n).length }));
  const max = Math.max(1, ...counts.map((x) => x.c));
  return (
    <div className="space-y-1 mt-3">
      {counts.map(({ n, c }) => (
        <div key={n} className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="w-4 text-right">{n}</span>
          <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4AF37]" style={{ width: `${(c / max) * 100}%` }} />
          </div>
          <span className="w-6 text-right">{c}</span>
        </div>
      ))}
    </div>
  );
}

export default function EvaluationSummary() {
  const now = new Date();
  const [from, setFrom] = useState(toISODate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [room, setRoom] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    listEvaluations(from, to)
      .then((d) => alive && setRows(d))
      .catch((e) => alive && setError(e.message || "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [from, to]);

  const roomOptions = useMemo(() => [...new Set(rows.flatMap((r) => r.roomNames))].sort(), [rows]);
  const filtered = useMemo(
    () => (room === "all" ? rows : rows.filter((r) => r.roomNames.includes(room))),
    [rows, room]
  );

  const cols = { q1: "q1_ease", q2: "q2_ready", q3: "q3_overall" };
  const comments = filtered.filter((r) => r.comment);
  const overall = avg(filtered.flatMap((r) => [r.q1_ease, r.q2_ready, r.q3_overall]));

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="สรุปผลการประเมินความพึงพอใจ" />

        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">ตั้งแต่</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">ถึง</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">ห้อง</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="border border-neutral-300 rounded-md px-2 py-1.5 text-sm">
              <option value="all">ทุกห้อง</option>
              {roomOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-neutral-400">ยังไม่มีผลการประเมินในช่วงนี้</div>
        ) : (
          <>
            <div className="bg-[#212124] text-white rounded-lg p-5 mb-4 flex items-center gap-5 border-b-4 border-[#D4AF37]">
              <BarChart3 className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <p className="text-xs text-[#9a9aa2]">คะแนนเฉลี่ยรวม</p>
                <p className="font-display text-3xl font-bold text-[#D4AF37]">
                  {overall.toFixed(2)}<span className="text-base text-[#9a9aa2] font-normal"> / 5</span>
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-[#9a9aa2]">จำนวนผู้ประเมิน</p>
                <p className="font-display text-2xl font-bold">{filtered.length}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {QUESTIONS.map((q) => {
                const vals = filtered.map((r) => r[cols[q.key]]);
                return (
                  <div key={q.key} className="bg-white border border-[#EAE3D0] rounded-lg p-4">
                    <p className="text-xs text-neutral-500 leading-snug min-h-[2.5rem]">{q.text}</p>
                    <p className="font-display text-2xl font-bold text-[#B8952B] mt-1">{avg(vals).toFixed(2)}</p>
                    <Dist values={vals} />
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-[#EAE3D0] rounded-lg">
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2 text-sm font-medium text-neutral-800">
                <MessageSquare className="w-4 h-4 text-[#B8952B]" />
                ข้อเสนอแนะ ({comments.length})
              </div>
              {comments.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">ไม่มีข้อเสนอแนะ</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {comments.map((c) => (
                    <div key={c.id} className="px-4 py-3">
                      <p className="text-sm text-neutral-800">{c.comment}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {c.roomNames.join(", ") || "อุปกรณ์"} · ใช้งาน {c.useDate} · ภาพรวม {c.q3_overall}/5
                      </p>
                    </div>
                  ))}
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
