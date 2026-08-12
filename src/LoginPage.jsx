import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { signIn, signUp, completeProfile, isStudentIdTaken, translateAuthError } from "./authApi";
import { useAuth } from "./AuthContext";
import buLogo from "./assets/burapha-logo.png";

/**
 * ลวดลายรัศมีเปล่งแสง ล้อกับตราสัญลักษณ์มหาวิทยาลัยบูรพา
 * วาดเป็นเส้นรัศมี 24 เส้นรอบจุดศูนย์กลาง หมุนช้ามาก (เคารพ prefers-reduced-motion)
 */
function SunburstMotif() {
  const rays = Array.from({ length: 24 });
  return (
    <svg
      viewBox="0 0 400 400"
      className="absolute inset-0 w-full h-full motion-safe:animate-[spin_140s_linear_infinite]"
      style={{ opacity: 0.16 }}
      aria-hidden="true"
    >
      <g stroke="#D4AF37" strokeWidth="1.5">
        {rays.map((_, i) => {
          const angle = (i * 360) / rays.length;
          return (
            <line
              key={i}
              x1="200"
              y1="200"
              x2="200"
              y2="20"
              transform={`rotate(${angle} 200 200)`}
            />
          );
        })}
      </g>
      <circle cx="200" cy="200" r="90" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="200" cy="200" r="140" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.35" />
    </svg>
  );
}

/**
 * เส้นลู่วิ่ง — สื่อถึงคณะวิทยาศาสตร์การกีฬา ไล่มุมเหมือนมองลู่กรีฑาจากมุมสูง
 */
function TrackLanes() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
      style={{
        background:
          "repeating-linear-gradient(78deg, rgba(212,175,55,0.16) 0px, rgba(212,175,55,0.16) 2px, transparent 2px, transparent 34px)",
        maskImage: "linear-gradient(to top, black, transparent)",
        WebkitMaskImage: "linear-gradient(to top, black, transparent)",
      }}
      aria-hidden="true"
    />
  );
}

function FieldLabel({ children }) {
  return <label className="text-xs text-[#8a8a92] mb-1 block">{children}</label>;
}

const inputCls =
  "w-full bg-[#F5F2EA] border border-[#E4DFCF] rounded-md px-3 py-2.5 text-sm text-[#232323] placeholder:text-[#a7a294] focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent transition-shadow";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "student",
    prefix: "นาย",
    studentId: "",
    major: "",
    year: "",
  });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn({ email: form.email, password: form.password });
      } else {
        if (!form.email || !form.password || !form.fullName || !form.phone) {
          throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
        }
        if (form.role === "student" && !form.studentId) {
          throw new Error("กรุณากรอกรหัสนิสิต");
        }
        // เช็ครหัสนิสิตซ้ำก่อนสมัคร กันสร้างบัญชีค้างถ้ารหัสซ้ำ
        if (form.role === "student") {
          const taken = await isStudentIdTaken(form.studentId);
          if (taken) {
            throw new Error("รหัสนิสิตนี้มีผู้ใช้สมัครสมาชิกไปแล้ว กรุณาตรวจสอบรหัสนิสิตอีกครั้ง");
          }
        }
        await signUp({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
        });
        // trigger จะสร้างแถว users ให้ก่อน แล้วค่อยเติมรายละเอียดเพิ่ม
        await new Promise((r) => setTimeout(r, 800)); // เผื่อ trigger ทำงานยังไม่เสร็จ
        await completeProfile({
          prefix: form.prefix,
          studentId: form.role === "student" ? form.studentId : null,
          major: form.major,
          year: form.year || null,
        });
      }
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[44%_56%] bg-[#FAF8F3]">
      {/* ============ ฝั่งซ้าย/บน: อัตลักษณ์คณะ+มหาวิทยาลัย ============ */}
      <div className="relative overflow-hidden bg-[#212124] flex flex-col justify-between px-8 py-10 sm:px-12 sm:py-14 min-h-[19rem] md:min-h-screen">
        <SunburstMotif />
        <TrackLanes />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#2B2B2F] ring-1 ring-[#D4AF37]/50 shadow-[0_0_0_6px_rgba(212,175,55,0.08)] flex items-center justify-center overflow-hidden">
              <img src={buLogo} alt="ตราสัญลักษณ์มหาวิทยาลัยบูรพา" className="w-11 h-11 object-contain" />
            </div>
            <div>
              <p className="font-display text-[11px] tracking-[0.2em] text-[#D4AF37] uppercase">
                Burapha University
              </p>
              <p className="font-display text-xs text-[#c9c9ce]">มหาวิทยาลัยบูรพา</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 md:mt-0">
          <p className="font-display text-sm tracking-[0.25em] text-[#D4AF37] uppercase mb-2">
            คณะวิทยาศาสตร์การกีฬา
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] mb-4">
            ระบบจอง
            <br />
            ห้อง Lab
          </h1>
          <p className="text-sm text-[#a5a5ac] max-w-xs leading-relaxed">
            จองห้องปฏิบัติการและอุปกรณ์ ติดตามสถานะการอนุมัติ และดูปฏิทินการใช้งานร่วมกันได้ในที่เดียว
          </p>
        </div>

        <div className="relative z-10 hidden md:block text-[11px] text-[#6f6f78] font-display tracking-wide">
          FACULTY OF SPORTS SCIENCE
        </div>
      </div>

      {/* ============ ฝั่งขวา/ล่าง: ฟอร์ม ============ */}
      <div className="flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="flex gap-1 mb-6 bg-[#EFEADB] rounded-md p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors font-display ${
                mode === "signin"
                  ? "bg-[#212124] text-[#D4AF37] shadow-sm"
                  : "text-[#7a7568] hover:text-[#232323]"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors font-display ${
                mode === "signup"
                  ? "bg-[#212124] text-[#D4AF37] shadow-sm"
                  : "text-[#7a7568] hover:text-[#232323]"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          <div className="space-y-3.5">
            <div>
              <FieldLabel>อีเมล</FieldLabel>
              <input
                type="email"
                placeholder="you@buu.ac.th"
                value={form.email}
                onChange={update("email")}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>รหัสผ่าน</FieldLabel>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
                className={inputCls}
              />
            </div>

            {mode === "signup" && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <FieldLabel>คำนำหน้า</FieldLabel>
                    <select value={form.prefix} onChange={update("prefix")} className={inputCls}>
                      <option>นาย</option>
                      <option>นาง</option>
                      <option>นางสาว</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                    <input
                      placeholder="ชื่อ นามสกุล"
                      value={form.fullName}
                      onChange={update("fullName")}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>เบอร์โทร</FieldLabel>
                  <input placeholder="08xxxxxxxx" value={form.phone} onChange={update("phone")} className={inputCls} />
                </div>

                <div>
                  <FieldLabel>สถานะ</FieldLabel>
                  <div className="flex gap-2">
                    {[
                      { value: "student", label: "นิสิต" },
                      { value: "instructor", label: "อาจารย์" },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                        className={`flex-1 text-sm py-2 rounded-md border transition-colors ${
                          form.role === r.value
                            ? "bg-[#212124] border-[#212124] text-[#D4AF37] font-medium"
                            : "border-[#E4DFCF] text-[#7a7568] hover:border-[#C9A227]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.role === "student" && (
                  <div>
                    <FieldLabel>รหัสนิสิต</FieldLabel>
                    <input
                      placeholder="6xxxxxxx"
                      value={form.studentId}
                      onChange={update("studentId")}
                      className={inputCls}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>สาขาวิชา</FieldLabel>
                    <input placeholder="สาขาวิชา" value={form.major} onChange={update("major")} className={inputCls} />
                  </div>
                  {form.role === "student" && (
                    <div>
                      <FieldLabel>ชั้นปี</FieldLabel>
                      <input placeholder="ชั้นปี" value={form.year} onChange={update("year")} className={inputCls} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-5 flex items-center justify-center gap-2 bg-gradient-to-b from-[#D4AF37] to-[#B8952B] hover:from-[#E0BD4C] hover:to-[#C6A22E] disabled:opacity-50 text-[#212124] text-sm font-bold font-display py-3 rounded-md transition-all shadow-[0_2px_10px_rgba(212,175,55,0.35)]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>

          <p className="text-center text-[11px] text-[#a7a294] mt-6 font-display tracking-wide">
            คณะวิทยาศาสตร์การกีฬา · มหาวิทยาลัยบูรพา
          </p>
        </div>
      </div>
    </div>
  );
}
