import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { signIn, signUp, completeProfile, isStudentIdTaken, translateAuthError } from "./authApi";
import { useAuth } from "./AuthContext";

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
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="mb-6 text-center">
          <p className="text-xs font-mono text-orange-600 tracking-widest mb-1">คณะวิทยาศาสตร์การกีฬา</p>
          <h1 className="text-xl font-semibold text-neutral-900">ระบบจองห้อง Lab</h1>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex gap-1 mb-5 bg-neutral-100 rounded-md p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                mode === "signin" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                mode === "signup" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder="อีเมล"
              value={form.email}
              onChange={update("email")}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={form.password}
              onChange={update("password")}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />

            {mode === "signup" && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={form.prefix}
                    onChange={update("prefix")}
                    className="col-span-1 border border-neutral-300 rounded-md px-2 py-2 text-sm"
                  >
                    <option>นาย</option>
                    <option>นาง</option>
                    <option>นางสาว</option>
                  </select>
                  <input
                    placeholder="ชื่อ-นามสกุล"
                    value={form.fullName}
                    onChange={update("fullName")}
                    className="col-span-2 border border-neutral-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <input
                  placeholder="เบอร์โทร"
                  value={form.phone}
                  onChange={update("phone")}
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                />

                <div className="flex gap-4 text-sm text-neutral-700 py-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.role === "student"}
                      onChange={() => setForm((f) => ({ ...f, role: "student" }))}
                      className="accent-orange-600"
                    />
                    นิสิต
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.role === "instructor"}
                      onChange={() => setForm((f) => ({ ...f, role: "instructor" }))}
                      className="accent-orange-600"
                    />
                    อาจารย์
                  </label>
                </div>

                {form.role === "student" && (
                  <input
                    placeholder="รหัสนิสิต"
                    value={form.studentId}
                    onChange={update("studentId")}
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="สาขาวิชา"
                    value={form.major}
                    onChange={update("major")}
                    className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
                  />
                  {form.role === "student" && (
                    <input
                      placeholder="ชั้นปี"
                      value={form.year}
                      onChange={update("year")}
                      className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </div>
      </div>
    </div>
  );
}
