import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { CalendarPlus, ClipboardCheck, PackageCheck } from "lucide-react";
import BookingForm from "./BookingForm.jsx";
import ApprovalPage from "./ApprovalPage.jsx";
import StaffDashboard from "./StaffDashboard.jsx";

const NAV_ITEMS = [
  { path: "/", label: "ยื่นคำขอจอง", icon: CalendarPlus },
  { path: "/approve", label: "อนุมัติ (อาจารย์)", icon: ClipboardCheck },
  { path: "/staff", label: "รับ-คืน (เจ้าหน้าที่)", icon: PackageCheck },
];

function TopNav() {
  const location = useLocation();
  return (
    <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<BookingForm />} />
        <Route path="/approve" element={<ApprovalPage reviewerId={1} />} />
        <Route path="/staff" element={<StaffDashboard staffId={1} />} />
      </Routes>
    </BrowserRouter>
  );
}
