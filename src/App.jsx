import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  CalendarPlus,
  ClipboardCheck,
  PackageCheck,
  CalendarDays,
  LogOut,
  BarChart3,
  Users,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./LoginPage";
import BookingForm from "./BookingForm.jsx";
import ApprovalPage from "./ApprovalPage.jsx";
import StaffDashboard from "./StaffDashboard.jsx";
import CalendarView from "./CalendarView.jsx";
import UsageSummary from "./UsageSummary.jsx";
import MembersPage from "./MembersPage.jsx";
import GuidePage from "./GuidePage.jsx";
import { signOut } from "./authApi";
import { SunburstMotif, LogoBadge } from "./ThemeUI";

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { path: "/", label: "ยื่นคำขอจอง", icon: CalendarPlus, roles: ["student", "instructor", "admin"] },
    { path: "/calendar", label: "ปฏิทินการจอง", icon: CalendarDays, roles: ["student", "instructor", "admin"] },
    { path: "/approve", label: "อนุมัติ", icon: ClipboardCheck, roles: ["instructor", "admin"] },
    { path: "/staff", label: "การคืนอุปกรณ์", icon: PackageCheck, roles: ["instructor", "admin"] },
    { path: "/summary", label: "สรุปการใช้ห้องและอุปกรณ์", icon: BarChart3, roles: ["instructor", "admin"] },
    { path: "/members", label: "จัดการสมาชิก", icon: Users, roles: ["instructor", "admin"] },
    { path: "/guide", label: "คู่มือการใช้งาน", icon: BookOpen, roles: ["student", "instructor", "admin"] },
  ].filter((item) => !profile || item.roles.includes(profile.role));

  const roleLabel =
    profile?.role === "student" ? "นิสิต" : profile?.role === "instructor" ? "อาจารย์" : "เจ้าหน้าที่";

  const handleLogout = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/login");
  };

  return (
    <div className="bg-[#212124] sticky top-0 z-40 relative overflow-hidden">
      <SunburstMotif opacity={0.07} animate className="absolute -top-36 left-1/2 -translate-x-1/2 w-[420px] h-[420px]" />
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* ตราโลโก้ + ชื่อคณะ */}
            <div className="flex items-center gap-2.5 py-2.5 pr-4 mr-1 border-r border-[#D4AF37]/20">
              <LogoBadge size={26} />
              <div className="hidden sm:block font-display text-[10px] text-[#D4AF37] leading-tight tracking-wide">
                คณะวิทยาศาสตร์
                <br />
                การกีฬา
              </div>
            </div>

            {/* เมนูแนวนอน — เห็นเฉพาะจอกว้าง (md ขึ้นไป) ไม่ต้องเลื่อนดู */}
            <div className="hidden md:flex gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 text-sm font-medium px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                      active
                        ? "border-[#D4AF37] text-[#D4AF37]"
                        : "border-transparent text-[#9a9aa2] hover:text-[#e0e0e4]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ปุ่มแฮมเบอร์เกอร์ — เห็นเฉพาะจอเล็ก (ต่ำกว่า md) */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden flex items-center gap-2 py-3 text-sm font-medium text-[#e0e0e4]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            เมนู
          </button>

          {profile && (
            <div className="flex items-center gap-3 text-xs text-[#9a9aa2] whitespace-nowrap">
              <span className="hidden md:inline">
                {profile.prefix}
                {profile.full_name} · {roleLabel}
              </span>
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1 text-[#9a9aa2] hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>

        {/* เมนูแบบ dropdown แนวตั้ง — โผล่มาเฉพาะจอเล็กตอนกดปุ่มแฮมเบอร์เกอร์ */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 py-2">
            {profile && (
              <div className="px-2 py-2 mb-1 text-xs text-[#9a9aa2] border-b border-white/10">
                {profile.prefix}
                {profile.full_name} · {roleLabel}
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 text-sm font-medium px-2 py-2.5 rounded-md transition-colors ${
                    active ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-[#c9c9ce] hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 text-sm font-medium px-2 py-2.5 rounded-md text-red-400 hover:bg-red-400/10 w-full mt-1"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50 relative z-10" />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {!isLoginPage && <TopNav />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approve"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <ApprovalPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <StaffDashboardWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <UsageSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guide"
          element={
            <ProtectedRoute>
              <GuidePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

// ส่ง id ผู้ใช้ที่ login อยู่จริงเข้าไปแทนค่า default เดิม
function ApprovalPageWrapper() {
  const { profile } = useAuth();
  return <ApprovalPage reviewerId={profile?.id} />;
}
function StaffDashboardWrapper() {
  const { profile } = useAuth();
  return <StaffDashboard staffId={profile?.id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
