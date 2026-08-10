# ระบบจองห้อง Lab — คู่มือ Deploy ออนไลน์ฟรี

เว็บเดียวมี 3 หน้า เข้าถึงผ่านเมนูด้านบน:
- `/` — ยื่นคำขอจอง (นิสิต/อาจารย์)
- `/approve` — อนุมัติคำขอ (อาจารย์)
- `/staff` — รับ-คืนอุปกรณ์ (เจ้าหน้าที่)

---

## ขั้นที่ 1: ตั้งค่า Supabase (ฐานข้อมูล — ฟรี)

1. สมัครที่ https://supabase.com ด้วย GitHub account
2. New Project → ตั้งชื่อ + รหัสผ่าน DB (เก็บไว้ให้ดี) → เลือก region ใกล้ไทย (Singapore)
3. เข้า **SQL Editor** → New query → คัดลอกทั้งหมดจาก `schema.sql` มาวาง → กด Run
4. ไปที่ **Project Settings > API** คัดลอก 2 ค่านี้เก็บไว้:
   - `Project URL`
   - `anon public` key

## ขั้นที่ 2: ทดสอบรันในเครื่องก่อน (ไม่บังคับ แต่แนะนำ)

```bash
npm install
cp .env.example .env
# แก้ .env ใส่ค่า Supabase URL และ anon key ที่คัดลอกไว้
npm run dev
```
เปิด http://localhost:5173 ทดสอบยื่นคำขอ → เข้า `/approve` อนุมัติ → เข้า `/staff` ส่งมอบ/รับคืน

## ขั้นที่ 3: ขึ้น GitHub

```bash
git init
git add .
git commit -m "lab booking system"
```
สร้าง repo ใหม่ที่ https://github.com/new (private ได้ ฟรี) แล้ว push:
```bash
git remote add origin https://github.com/<username>/lab-booking.git
git branch -M main
git push -u origin main
```
**สำคัญ:** อย่า commit ไฟล์ `.env` (ไฟล์ `.gitignore` กันไว้ให้แล้ว)

## ขั้นที่ 4: Deploy บน Vercel (ฟรี)

1. สมัคร https://vercel.com ด้วย GitHub account เดียวกัน
2. **Add New Project** → เลือก repo `lab-booking` → Import
3. ก่อนกด Deploy ไปที่ **Environment Variables** ใส่:
   - `VITE_SUPABASE_URL` = ค่าจาก Supabase
   - `VITE_SUPABASE_ANON_KEY` = ค่าจาก Supabase
4. กด **Deploy** รอประมาณ 1 นาที
5. ได้ URL ทันที เช่น `https://lab-booking-xxxx.vercel.app`

จากนี้ทุกครั้งที่ `git push` ขึ้น GitHub, Vercel จะ build และอัปเดตเว็บให้อัตโนมัติ

---

## ข้อควรระวัง (free tier)

- **Supabase**: โปรเจกต์ pause อัตโนมัติถ้าไม่มีการใช้งานติดต่อกัน 7 วัน (มีอีเมลแจ้งเตือนก่อน) เข้าไปกด "Resume" ใน dashboard ได้ทันที ไม่มีข้อมูลหาย
- **Vercel**: ฟรีสำหรับใช้งานทั่วไป ไม่จำกัดเวลา แต่ห้ามใช้เชิงพาณิชย์แบบมีรายได้ตรง — โปรเจกต์คณะ/มหาวิทยาลัยใช้ได้ปกติ
- **RLS policy** ในไฟล์ `schema.sql` ตอนนี้เป็นแบบเปิดกว้าง (public insert/select) เหมาะสำหรับ prototype เมื่อจะใช้งานจริงกับข้อมูลนิสิตจำนวนมาก แนะนำเพิ่มระบบ Auth ก่อน

## อยากได้โดเมนของคณะ (ไม่บังคับ)
ถ้าต้องการ URL แบบ `booking.faculty.ac.th` แทน `.vercel.app`:
1. ไปที่ Vercel Project > Settings > Domains > ใส่โดเมนที่ต้องการ
2. เอาค่า CNAME ที่ Vercel ให้มา ไปแจ้งทีมไอทีของมหาวิทยาลัยตั้งค่า DNS
3. ไม่มีค่าใช้จ่ายเพิ่มฝั่ง Vercel (โดเมนต้องเป็นของมหาวิทยาลัยอยู่แล้ว)
