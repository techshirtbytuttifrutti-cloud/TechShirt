// src/components/PrintPricing.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Plus, Edit, Trash2, X, FileText } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface Pricing {
  _id: Id<"print_pricing">;
  print_id: Id<"prints">;
  print_type: string;
  amount: number;
  shirt_type: Id<"shirt_types">;
  size: Id<"shirt_sizes">;
  created_at: number;
  updated_at?: number;
}

interface PrintType {
  _id: Id<"prints">;
  print_type?: string;
}

interface ShirtType {
  _id: Id<"shirt_types">;
  type_name: string;
  description?: string;
}

interface ShirtSize {
  _id: Id<"shirt_sizes">;
  size_label: string;
  w: number;
  h: number;
  type: Id<"shirt_types">; // points to shirt_types._id
  sleeves_w?: number;
  sleeves_h?: number;
  category: "kids" | "adult";
}

const emptyForm = {
  print_id: "",
  shirt_type: "",
  size: "",
  amount: "",
};

const PrintPricing: React.FC = () => {
  // --- Queries ---
  const pricing = useQuery(api.print_pricing.getAll) as Pricing[] | undefined;
  const printTypes = useQuery(api.prints.getAll) as PrintType[] | undefined;
  const shirtTypes = useQuery(api.shirt_types.getAll) as ShirtType[] | undefined;
  const sizes = useQuery(api.shirt_sizes.getAll) as ShirtSize[] | undefined;

  // --- Mutations ---
  const createPricing = useMutation(api.print_pricing.create);
  const updatePricing = useMutation(api.print_pricing.update);
  const deletePricing = useMutation(api.print_pricing.remove);

  // --- Local state ---
  const [localRows, setLocalRows] = useState<Pricing[]>([]);
  const [editing, setEditing] = useState<Pricing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(() => ({ ...emptyForm }));

  // keep localRows synced with server pricing
  useEffect(() => {
    if (pricing) setLocalRows(pricing);
  }, [pricing]);

  // --- Helpers to look up names ---
  const getPrintName = (id?: Id<"prints">) =>
    printTypes?.find((p) => String(p._id) === String(id))?.print_type ?? "Unknown";

  const getShirtTypeName = (id?: Id<"shirt_types">) =>
    shirtTypes?.find((t) => String(t._id) === String(id))?.type_name ?? "Unknown";

  const getSizeObj = (id?: Id<"shirt_sizes">) =>
    sizes?.find((s) => String(s._id) === String(id)) ?? null;

  // --- available sizes for currently selected shirt type (filter by id) ---
  const availableSizes = useMemo(() => {
    if (!form.shirt_type || !sizes) return [];
    return sizes.filter((s) => String(s.type) === String(form.shirt_type));
  }, [form.shirt_type, sizes]);

  // --- Handlers ---
  const openAddModal = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const handleShirtTypeChange = (value: string) => {
    // when shirt type changes, clear selected size
    setForm((f) => ({ ...f, shirt_type: value, size: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.print_id || !form.shirt_type || !form.size || !form.amount) return;

    const payload = {
      print_id: form.print_id as Id<"prints">,
      print_type: getPrintName(form.print_id as Id<"prints">),
      shirt_type: form.shirt_type as Id<"shirt_types">,
      size: form.size as Id<"shirt_sizes">,
      amount: Number(form.amount),
      
    };

    try {
      if (editing) {
        await updatePricing({ id: editing._id, ...payload });
        // update local copy
        setLocalRows((prev) =>
          prev.map((r) => (String(r._id) === String(editing._id) ? { ...r, ...payload } : r))
        );
      } else {
        await createPricing(payload);
        // best-effort local update (server will re-sync via query hook)
        setLocalRows((prev) => [...prev, { ...(payload as any), _id: "" as Id<"print_pricing"> }]);
      }
    } catch (err) {
      console.error("Failed to save pricing:", err);
      // optionally show a toast / notification
    } finally {
      setForm({ ...emptyForm });
      setEditing(null);
      setIsModalOpen(false);
    }
  };

  const handleEdit = (row: Pricing) => {
    setEditing(row);
    setForm({
      print_id: String(row.print_id),
      shirt_type: String(row.shirt_type),
      size: String(row.size),
      amount: String(row.amount),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: Id<"print_pricing">) => {
    if (!window.confirm("Delete this pricing?")) return;
    try {
      await deletePricing({ id });
      setLocalRows((prev) => prev.filter((r) => String(r._id) !== String(id)));
    } catch (err) {
      console.error("Failed to delete pricing:", err);
    }
  };

  // loading guard
  if (!pricing || !printTypes || !shirtTypes || !sizes) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader className="animate-spin h-6 w-6 text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 shadow rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Pricing of Prints</h2>
          <p className="text-gray-600 text-sm">Setup pricing per print, shirt type & size</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Pricing
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {localRows.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No pricing records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Print Type", "Shirt Type", "Size (category)", "Amount (₱)", "Created At"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {col}
                      </th>
                    )
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {localRows.map((row) => {
                  const printName = getPrintName(row.print_id);
                  const shirtName = getShirtTypeName(row.shirt_type);
                  const sizeObj = getSizeObj(row.size);
                  const sizeLabel = sizeObj?.size_label ?? "Unknown";
                  const sizeCategory = sizeObj?.category ?? "";

                  return (
                    <tr key={String(row._id)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{printName}</td>
                      <td className="px-6 py-4 text-sm">{shirtName}</td>
                      <td className="px-6 py-4 text-sm">
                        {sizeLabel}{" "}
                        <span className="text-gray-500 text-xs">({sizeCategory})</span>
                      </td>
                      <td className="px-6 py-4 text-sm">₱{row.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          aria-label="Edit pricing"
                          onClick={() => handleEdit(row)}
                          className="px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          aria-label="Delete pricing"
                          onClick={() => handleDelete(row._id)}
                          className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 relative"
          >
            <button
              aria-label="Close modal"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {editing ? "Edit Print Pricing" : "Add Print Pricing"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* Print Type */}
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Print Type</label>
                <select
                  aria-label="Select print type"
                  value={form.print_id}
                  onChange={(e) => setForm((f) => ({ ...f, print_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select print type</option>
                  {printTypes.map((p) => (
                    <option key={String(p._id)} value={String(p._id)}>
                      {p.print_type ?? "Unnamed"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shirt Type */}
              <div>
                <label className="block text-xs font-medium mb-1">Shirt Type</label>
                <select
                  aria-label="Select shirt type"
                  value={form.shirt_type}
                  onChange={(e) => handleShirtTypeChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select shirt type</option>
                  {shirtTypes.map((t) => (
                    <option key={String(t._id)} value={String(t._id)}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-medium mb-1">Size</label>
                <select
                  aria-label="Select size"
                  value={form.size}
                  onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                  disabled={!form.shirt_type}
                >
                  <option value="">Select size</option>
                  {availableSizes.map((s) => (
                    <option key={String(s._id)} value={String(s._id)}>
                      {s.size_label} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Amount (₱)</label>
                <input
                  aria-label="Enter amount"
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white rounded-lg">
                  {editing ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PrintPricing;
