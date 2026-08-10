import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getCurrentProfile, onAuthStateChange } from "./authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = ยังไม่เช็ค, null = ไม่ login
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const p = await getCurrentProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) await refreshProfile();
      setLoading(false);
    });

    const unsubscribe = onAuthStateChange(async (session) => {
      setSession(session);
      if (session) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth ต้องถูกใช้ภายใน AuthProvider");
  return ctx;
}
