import buLogo from "./assets/burapha-logo.png";

/**
 * ชิ้นส่วนกราฟิกที่ใช้ร่วมกันทุกหน้า ให้เป็นอัตลักษณ์เดียวกับหน้า Login
 * (ลายรัศมีจากตราครุฑ + เส้นลู่วิ่งกรีฑา + ตราประทับท้ายหน้า)
 */

const RAY_COUNT = 24;

export function SunburstMotif({ opacity = 0.05, className = "", animate = false }) {
  const rays = Array.from({ length: RAY_COUNT });
  return (
    <svg
      viewBox="0 0 400 400"
      className={`pointer-events-none ${animate ? "motion-safe:animate-[spin_160s_linear_infinite]" : ""} ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <g stroke="#D4AF37" strokeWidth="1.5">
        {rays.map((_, i) => (
          <line
            key={i}
            x1="200"
            y1="200"
            x2="200"
            y2="20"
            transform={`rotate(${(i * 360) / RAY_COUNT} 200 200)`}
          />
        ))}
      </g>
      <circle cx="200" cy="200" r="90" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="200" cy="200" r="140" stroke="#D4AF37" strokeWidth="1" fill="none" opacity="0.35" />
    </svg>
  );
}

export function LogoBadge({ size = 28 }) {
  return (
    <img
      src={buLogo}
      alt="ตราสัญลักษณ์มหาวิทยาลัยบูรพา"
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}

export function TrackLaneDivider() {
  return (
    <div
      className="h-8 my-8 rounded-md relative overflow-hidden"
      style={{
        background:
          "repeating-linear-gradient(100deg, rgba(212,175,55,0.10) 0px, rgba(212,175,55,0.10) 2px, transparent 2px, transparent 22px)",
        maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
      }}
      aria-hidden="true"
    />
  );
}

export function PageStamp() {
  return (
    <div className="text-center mt-2">
      <LogoBadge size={34} />
      <p className="font-display text-[10px] text-[#c2bba6] tracking-widest mt-2">
        คณะวิทยาศาสตร์การกีฬา · มหาวิทยาลัยบูรพา
      </p>
    </div>
  );
}

export function PageHeader({ title }) {
  return (
    <div className="relative mb-6">
      <SunburstMotif opacity={0.05} className="absolute -top-6 -right-10 w-64 h-64" />
      <div className="relative z-10">
        <p className="font-display text-[11px] tracking-[0.2em] text-[#B8952B] uppercase mb-1">
          คณะวิทยาศาสตร์การกีฬา
        </p>
        <h1 className="font-display text-xl font-bold text-[#212124]">{title}</h1>
      </div>
    </div>
  );
}

// สี/คลาสมาตรฐานของธีม ให้เรียกใช้ค่าเดียวกันทุกหน้า
export const theme = {
  pageBg: "bg-[#FAF8F3]",
  cardBg: "bg-white border border-[#EAE3D0]",
  gold: "#D4AF37",
  goldDeep: "#B8952B",
  ink: "#212124",
  primaryBtn:
    "bg-gradient-to-b from-[#D4AF37] to-[#B8952B] hover:from-[#E0BD4C] hover:to-[#C6A22E] text-[#212124] font-bold shadow-[0_2px_10px_rgba(212,175,55,0.3)]",
  tabActive: "border-[#B8952B] text-[#B8952B]",
  linkGold: "text-[#B8952B] hover:text-[#96762a]",
};
