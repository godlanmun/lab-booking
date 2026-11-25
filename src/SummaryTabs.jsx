import { useState } from "react";
import UsageSummary from "./UsageSummary.jsx";
import EvaluationSummary from "./EvaluationSummary.jsx";

const TABS = [
  { value: "usage", label: "การใช้ห้องและอุปกรณ์" },
  { value: "eval", label: "ผลการประเมินความพึงพอใจ" },
];

/** หน้าสรุปรวม: แท็บการใช้ห้อง/อุปกรณ์ + ผลการประเมิน */
export default function SummaryTabs({ initial = "usage" }) {
  const [tab, setTab] = useState(initial);
  return (
    <div className="bg-[#FAF8F3]">
      <div className="max-w-4xl mx-auto px-4 pt-6">
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
      </div>
      {tab === "usage" ? <UsageSummary /> : <EvaluationSummary />}
    </div>
  );
}
