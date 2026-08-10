import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

/**
 * ห่อหน้าที่ต้อง login ก่อนถึงจะเข้าได้
 * allowedRoles: array ของ role ที่อนุญาต เช่น ['instructor'] หรือ ['instructor','admin']
 * ถ้าไม่ระบุ = อนุญาตทุก role ที่ login แล้ว
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-neutral-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return children;
}
