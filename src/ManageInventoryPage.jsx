import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Check,
  X,
  ShieldOff,
  ShieldCheck,
  DoorOpen,
  Camera,
} from "lucide-react";
import {
  listRoomsAdmin,
  createRoom,
  updateRoom,
  setRoomActive,
  listEquipmentAdmin,
  createEquipment,
  updateEquipment,
  setEquipmentActive,
} from "./inventoryApi";
import { PageHeader, PageStamp, TrackLaneDivider } from "./ThemeUI";

const CATEGORY_OPTIONS = [
  "กล้อง",
  "เลนส์และอุปกรณ์เสริมกล้อง",
  "เสียง",
  "พลังงานและสายสัญญาณ",
  "อื่นๆ",
];

/* ---------------- ห้องปฏิบัติการ ---------------- */

function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", capacity: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRooms(await listRoomsAdmin());
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const startEdit = (r) => {
    setEditingId(r.id);
    setDraft({ name: r.name, capacity: r.capacity || "" });
  };

  const saveEdit = async (id) => {
    if (!draft.name.trim()) return;
    setBusyId(id);
    try {
      await updateRoom(id, { name: draft.name.trim(), capacity: draft.capacity ? Number(draft.capacity) : null });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (r) => {
    setBusyId(r.id);
    try {
      await setRoomActive(r.id, !r.is_active);
      await load();
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async () => {
    if (!newRoom.name.trim()) return;
    setBusyId("new");
    try {
      await createRoom({ name: newRoom.name.trim(), capacity: newRoom.capacity ? Number(newRoom.capacity) : null });
      setNewRoom({ name: "", capacity: "" });
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err.message || "เพิ่มห้องไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#B8952B] hover:text-[#96762a] mb-4"
        >
          <Plus className="w-4 h-4" />
          เพิ่มห้องใหม่
        </button>
      ) : (
        <div className="bg-[#FBF3E6] border border-[#E9D6A8] rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">ชื่อห้อง</label>
            <input
              value={newRoom.name}
              onChange={(e) => setNewRoom((f) => ({ ...f, name: e.target.value }))}
              placeholder="ชื่อห้อง"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm w-48"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">ความจุ (คน) — ไม่บังคับ</label>
            <input
              type="number"
              value={newRoom.capacity}
              onChange={(e) => setNewRoom((f) => ({ ...f, capacity: e.target.value }))}
              placeholder="เช่น 20"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm w-28"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={busyId === "new"}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-[#B8952B] hover:bg-[#96762a] disabled:opacity-50 text-white font-medium"
          >
            {busyId === "new" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            บันทึก
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            ยกเลิก
          </button>
        </div>
      )}

      <div className="bg-white border border-[#EAE3D0] rounded-lg overflow-hidden divide-y divide-neutral-100">
        {rooms.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editingId === r.id ? (
              <div className="flex flex-wrap gap-2 items-center flex-1">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((f) => ({ ...f, name: e.target.value }))}
                  className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-40"
                />
                <input
                  type="number"
                  value={draft.capacity}
                  onChange={(e) => setDraft((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="ความจุ"
                  className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-24"
                />
                <button onClick={() => saveEdit(r.id)} disabled={busyId === r.id} className="text-emerald-600 hover:text-emerald-700">
                  {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingId(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-1">
                <DoorOpen className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {r.name} {!r.is_active && <span className="text-xs text-red-500 font-normal">(ปิดใช้งาน)</span>}
                  </p>
                  {r.capacity && <p className="text-xs text-neutral-400">ความจุ {r.capacity} คน</p>}
                </div>
              </div>
            )}

            {editingId !== r.id && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(r)} className="p-1.5 rounded-md text-neutral-400 hover:text-[#B8952B] hover:bg-[#FBF3E6]">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleActive(r)}
                  disabled={busyId === r.id}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                    r.is_active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {busyId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : r.is_active ? (
                    <ShieldOff className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {r.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- อุปกรณ์ ---------------- */

function EquipmentTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", category: "", totalQty: "", unit: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: CATEGORY_OPTIONS[0], totalQty: "", unit: "Pcs." });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listEquipmentAdmin());
    } catch (err) {
      setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const startEdit = (e) => {
    setEditingId(e.id);
    setDraft({ name: e.name, category: e.category, totalQty: e.total_qty, unit: e.unit || "Pcs." });
  };

  const saveEdit = async (id) => {
    if (!draft.name.trim()) return;
    setBusyId(id);
    try {
      await updateEquipment(id, {
        name: draft.name.trim(),
        category: draft.category,
        totalQty: Number(draft.totalQty) || 1,
        unit: draft.unit,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (item) => {
    setBusyId(item.id);
    try {
      await setEquipmentActive(item.id, !item.is_active);
      await load();
    } catch (err) {
      setError(err.message || "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    setBusyId("new");
    try {
      await createEquipment({
        name: newItem.name.trim(),
        category: newItem.category,
        totalQty: Number(newItem.totalQty) || 1,
        unit: newItem.unit || "Pcs.",
      });
      setNewItem({ name: "", category: CATEGORY_OPTIONS[0], totalQty: "", unit: "Pcs." });
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err.message || "เพิ่มอุปกรณ์ไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#B8952B] hover:text-[#96762a] mb-4"
        >
          <Plus className="w-4 h-4" />
          เพิ่มอุปกรณ์ใหม่
        </button>
      ) : (
        <div className="bg-[#FBF3E6] border border-[#E9D6A8] rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">ชื่ออุปกรณ์</label>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem((f) => ({ ...f, name: e.target.value }))}
              placeholder="เช่น กล้อง Nikon Z50"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm w-52"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">หมวดหมู่</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem((f) => ({ ...f, category: e.target.value }))}
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">จำนวนทั้งหมด</label>
            <input
              type="number"
              min={1}
              value={newItem.totalQty}
              onChange={(e) => setNewItem((f) => ({ ...f, totalQty: e.target.value }))}
              placeholder="เช่น 4"
              className="border border-neutral-300 rounded-md px-3 py-1.5 text-sm w-24"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={busyId === "new"}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-[#B8952B] hover:bg-[#96762a] disabled:opacity-50 text-white font-medium"
          >
            {busyId === "new" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            บันทึก
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="text-sm px-3 py-1.5 rounded-md text-neutral-600 hover:bg-neutral-100"
          >
            ยกเลิก
          </button>
        </div>
      )}

      <div className="bg-white border border-[#EAE3D0] rounded-lg overflow-hidden divide-y divide-neutral-100">
        {items.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
            {editingId === e.id ? (
              <div className="flex flex-wrap gap-2 items-center flex-1">
                <input
                  value={draft.name}
                  onChange={(ev) => setDraft((f) => ({ ...f, name: ev.target.value }))}
                  className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-44"
                />
                <select
                  value={draft.category}
                  onChange={(ev) => setDraft((f) => ({ ...f, category: ev.target.value }))}
                  className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={draft.totalQty}
                  onChange={(ev) => setDraft((f) => ({ ...f, totalQty: ev.target.value }))}
                  className="border border-neutral-300 rounded-md px-2 py-1 text-sm w-20"
                />
                <button onClick={() => saveEdit(e.id)} disabled={busyId === e.id} className="text-emerald-600 hover:text-emerald-700">
                  {busyId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingId(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-1">
                <Camera className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {e.name} {!e.is_active && <span className="text-xs text-red-500 font-normal">(ปิดใช้งาน)</span>}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {e.category} · มีทั้งหมด {e.total_qty} {e.unit}
                  </p>
                </div>
              </div>
            )}

            {editingId !== e.id && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(e)} className="p-1.5 rounded-md text-neutral-400 hover:text-[#B8952B] hover:bg-[#FBF3E6]">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleActive(e)}
                  disabled={busyId === e.id}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                    e.is_active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {busyId === e.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : e.is_active ? (
                    <ShieldOff className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {e.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- หน้าหลัก ---------------- */

export default function ManageInventoryPage() {
  const [tab, setTab] = useState("rooms");

  return (
    <div className="min-h-screen bg-[#FAF8F3] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="จัดการห้องปฏิบัติการและอุปกรณ์" />

        <div className="flex gap-1 mb-6 border-b border-neutral-200">
          <button
            onClick={() => setTab("rooms")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "rooms" ? "border-[#B8952B] text-[#B8952B]" : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            ห้องปฏิบัติการ
          </button>
          <button
            onClick={() => setTab("equipment")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "equipment" ? "border-[#B8952B] text-[#B8952B]" : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            อุปกรณ์
          </button>
        </div>

        {tab === "rooms" ? <RoomsTab /> : <EquipmentTab />}

        <TrackLaneDivider />
        <PageStamp />
      </div>
    </div>
  );
}
