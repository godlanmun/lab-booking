import { createClient } from "@supabase/supabase-js";

// สร้างโปรเจกต์ที่ https://supabase.com แล้วนำค่าจาก
// Project Settings > API มาใส่ในไฟล์ .env (ห้าม commit ค่าจริงขึ้น git)
//
// .env
// VITE_SUPABASE_URL=https://xxxxx.supabase.co
// VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
