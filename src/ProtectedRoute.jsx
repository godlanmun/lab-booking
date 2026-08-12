import { Navigate } from "react-router-dom";
import { Loader2, ShieldOff } from "lucide-react";
import { useAuth } from "./AuthContext";
import { signOut } from "./authApi";

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

  if (profile && profile.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShieldOff className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-800 mb-1">บัญชีนี้ถูกระงับการใช้งาน</p>
          <p className="text-xs text-neutral-500 mb-4">กรุณาติดต่อเจ้าหน้าที่หรืออาจารย์ผู้ดูแลระบบ</p>
          <button
            onClick={() => signOut()}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

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
