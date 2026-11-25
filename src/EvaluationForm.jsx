import { useEffect, useState } from "react";
import { Star, Loader2, ClipboardCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import { getPendingEvaluation, submitEvaluation } from "./evaluationApi";
import { PageHeader, PageStamp } from "./ThemeUI";

export const QUESTIONS = [
  { key: "q1", short: "ใช้งานง่าย", text: "ระบบจองใช้งานง่าย สะดวก (ฟอร์ม ปฏิทิน ขั้นตอนการอนุมัติ)" },
  { key: "q2", short: "ห้อง/อุปกรณ์พร้อม", text: "ห้องและอุปกรณ์พร้อมใช้งาน ตรงตามที่จอง" },
  { key: "q3", short: "ภาพรวม", text: "ความพึงพอใจโดยรวมต่อการใช้บริการ" },
];
const LABELS = ["", "ควรปรับปรุง", "พอใช้", "ปานกลาง", "ดี", "ดีมาก"];

function Stars({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} ดาว`}
          className="p-0.5"
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              n <= value ? "fill-[#D4AF37] text-[#D4AF37]" : "text-neutral-300 hover:text-[#D4AF37]/60"
            }`}
          />
        </button>
      ))}
      <span className="text-xs text-neutral-500 ml-2 w-20">{LABELS[value] || ""}</span>
    </div>
  );
}

/**
 * ครอบฟอร์มจอง: ถ้านิสิตมีรายการ "คืนแล้ว" ที่ยังไม่ประเมิน จะบังคับประเมินก่อนจึงจะจองใหม่ได้
 * อาจารย์/เจ้าหน้าที่ไม่ถูกบังคับ
 */
export default function EvaluationGate({ children }) {
  const { profile } = useAuth();
  const [pending, setPending] = useState(undefined); // undefined = กำลังเช็ค, null = ไม่มีค้าง
  const [answers, setAnswers] = useState({ q1: 0, q2: 0, q3: 0 });
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    try {
      setPending(await getPendingEvaluation(profile.id));
    } catch {
      setPending(null); // เช็คไม่ได้ → ไม่ขวางการจอง
    }
  };

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "student") return setPending(null);
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (pending === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        กำลังตรวจสอบ...
      </div>
    );
  }
  if (!pending) return children;

  const ready = answers.q1 && answers.q2 && answers.q3;

  const submit = async () => {
    setError("");
    if (!ready) return setError("กรุณาให้คะแนนครบทั้ง 3 ข้อ");
    setBusy(true);
    try {
      await submitEvaluation({
        bookingId: pending.id,
        userId: profile.id,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        comment,
      });
      setAnswers({ q1: 0, q2: 0, q3: 0 });
      setComment("");
      await check(); // อาจมีรายการค้างอีก
    } catch (err) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-xl mx-auto">
        <PageHeader title="ประเมินความพึงพอใจ" />
        <div className="bg-white border border-[#EAE3D0] rounded-lg p-6 sm:p-8 shadow-[0_1px_3px_rgba(33,33,36,0.04)]">
          <div className="flex items-start gap-3 bg-[#FBF3E6] border border-[#D4AF37]/40 rounded-md px-4 py-3 mb-6">
            <ClipboardCheck className="w-5 h-5 text-[#96762a] mt-0.5 shrink-0" />
            <div className="text-sm text-[#5c4a14]">
              <p className="font-medium">กรุณาประเมินการใช้งานครั้งก่อนก่อนจองครั้งใหม่</p>
              <p className="text-xs mt-0.5">
                รายการ: {pending.roomNames.join(", ") || "ยืมอุปกรณ์"} · วันที่ {pending.use_date}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {QUESTIONS.map((q, i) => (
              <div key={q.key}>
                <p className="text-sm font-medium text-neutral-800 mb-2">
                  {i + 1}. {q.text}
                </p>
                <Stars value={answers[q.key]} onChange={(v) => setAnswers((a) => ({ ...a, [q.key]: v }))} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-2">
                ข้อเสนอแนะ <span className="text-neutral-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-6 w-full bg-[#212124] text-[#D4AF37] font-medium text-sm py-2.5 rounded-md hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            ส่งการประเมิน แล้วไปจองต่อ
          </button>
        </div>
        <PageStamp />
      </div>
    </div>
  );
}
