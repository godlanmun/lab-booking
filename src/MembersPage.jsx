import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShieldOff, ShieldCheck, Users, Pencil, Check, X } from "lucide-react";
import { listUsers, updateUserRole, setUserActive, updateUserPhone } from "./memberApi";
import { useAuth } from "./AuthContext";
import { PageHeader, PageStamp, TrackLaneDivider } from "./ThemeUI";

const ROLE_LABEL = { student: "นิสิต", instructor: "อาจารย์", admin: "เจ้าหน้าที่" };
const ROLE_STYLE = {
  student: "bg-neutral-100 text-neutral-600",
  instructor: "bg-[#FBF3E6] text-[#96762a]",
  admin: "bg-blue-50 text-blue-700",
};

const TABS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "student", label: "นิสิต" },
  { value: "instructor", label: "อาจารย์" },
  { value: "admin", label: "เจ้าหน้าที่" },
];

export default function MembersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");
  const [editingPhoneId, setEditingPhoneId] = useState(null);
  const [phoneDraft, setPhoneDraft] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (tab !== "all" && u.role !== tab) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${u.full_name} ${u.student_id || ""} ${u.email || ""} ${u.phone || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, tab, search]);

  const handleRoleChange = async (userId, role) => {
    setBusyId(userId);
    try {
      await updateUserRole(userId, role);
      setToast("เปลี่ยนสิทธิ์เรียบร้อย");
      await load();
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const handleToggleActive = async (userId, current) => {
    setBusyId(userId);
    try {
      await setUserActive(userId, !current);
      setToast(!current ? "เปิดใช้งานบัญชีแล้ว" : "ระงับการใช้งานบัญชีแล้ว");
      await load();
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const startEditPhone = (u) => {
    setEditingPhoneId(u.id);
    setPhoneDraft(u.phone || "");
  };

  const cancelEditPhone = () => {
    setEditingPhoneId(null);
    setPhoneDraft("");
  };

  const saveEditPhone = async (userId) => {
    setBusyId(userId);
    try {
      await updateUserPhone(userId, phoneDraft.trim());
      setToast("แก้ไขเบอร์โทรเรียบร้อย");
      setEditingPhoneId(null);
      await load();
    } catch (err) {
      setError(err.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(""), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-6">
          <p className="font-display text-[11px] tracking-[0.2em] text-[#B8952B] uppercase mb-1">
            คณะวิทยาศาสตร์การกีฬา
          </p>
          <h1 className="font-display text-xl font-bold text-[#212124] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#B8952B]" />
            จัดการสมาชิก
          </h1>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 border-b border-neutral-200">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.value
                    ? "border-[#B8952B] text-[#B8952B]"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              placeholder="ค้นหาชื่อ / รหัสนิสิต / อีเมล"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-neutral-300 rounded-md pl-8 pr-3 py-1.5 text-sm w-64"
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-neutral-400">ไม่พบสมาชิก</div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {filtered.map((u) => {
                const isSelf = u.id === profile?.id;
                const busy = busyId === u.id;
                return (
                  <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3 flex-wrap">
                    <div className="min-w-[14rem]">
                      <p className="text-sm font-medium text-neutral-900">
                        {u.prefix}
                        {u.full_name}
                        {isSelf && <span className="text-xs text-neutral-400 ml-1.5">(คุณ)</span>}
                        {!u.is_active && (
                          <span className="text-xs text-red-500 ml-1.5 font-normal">(ถูกระงับ)</span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {u.email} {u.student_id ? `· รหัสนิสิต ${u.student_id}` : ""} {u.major ? `· ${u.major}` : ""}
                      </p>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                        {editingPhoneId === u.id ? (
                          <>
                            <span>โทร:</span>
                            <input
                              autoFocus
                              value={phoneDraft}
                              onChange={(e) => setPhoneDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditPhone(u.id);
                                if (e.key === "Escape") cancelEditPhone();
                              }}
                              className="border border-neutral-300 rounded px-1.5 py-0.5 text-xs w-32"
                            />
                            <button
                              onClick={() => saveEditPhone(u.id)}
                              disabled={busyId === u.id}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={cancelEditPhone} className="text-neutral-400 hover:text-neutral-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span>โทร: {u.phone || "—"}</span>
                            <button
                              onClick={() => startEditPhone(u)}
                              title="แก้ไขเบอร์โทร"
                              className="text-neutral-300 hover:text-[#B8952B]"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                      <select
                        value={u.role}
                        disabled={isSelf || busy}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        title={isSelf ? "ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้" : "เปลี่ยนสิทธิ์"}
                        className="border border-neutral-300 rounded-md px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="student">นิสิต</option>
                        <option value="instructor">อาจารย์</option>
                        <option value="admin">เจ้าหน้าที่</option>
                      </select>

                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        disabled={isSelf || busy}
                        title={isSelf ? "ไม่สามารถระงับบัญชีตัวเองได้" : u.is_active ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          u.is_active
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : u.is_active ? (
                          <ShieldOff className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        {u.is_active ? "ระงับ" : "เปิดใช้งาน"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <TrackLaneDivider />
        <PageStamp />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
