// src/components/PrintPricing.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader, Plus, Edit, Trash2, X } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface Pricing {
  _id: Id<"print_pricing">;
  print_id: Id<"prints"> | "default";
  print_type: string;
  amount: number;
  shirt_type: Id<"shirt_types"> | "default";
  size: Id<"shirt_sizes"> | "default";
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
}

interface ShirtSize {
  _id: Id<"shirt_sizes">;
  size_label: string;
  w: number;
  h: number;
  type: Id<"shirt_types">;
  category: "kids" | "adult";
}

const emptyForm = {
  print_id: "" as Id<"prints"> | "default" | "",
  shirt_type: "" as Id<"shirt_types"> | "default" | "",
  size: "" as Id<"shirt_sizes"> | "default" | "",
  amount: "",
};

const PrintPricing: React.FC = () => {
  const pricing = useQuery(api.print_pricing.getAll) as Pricing[] | undefined;
  const printTypes = useQuery(api.prints.getAll) as PrintType[] | undefined;
  const shirtTypes = useQuery(api.shirt_types.getAll) as ShirtType[] | undefined;
  const sizes = useQuery(api.shirt_sizes.getAll) as ShirtSize[] | undefined;

  const createPricing = useMutation(api.print_pricing.create);
  const updatePricing = useMutation(api.print_pricing.update);
  const deletePricing = useMutation(api.print_pricing.remove);
  const upsertDefault = useMutation(api.print_pricing.upsertDefault);

  const [localRows, setLocalRows] = useState<Pricing[]>([]);
  const [editing, setEditing] = useState<Pricing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(() => ({ ...emptyForm }));

  useEffect(() => {
    if (pricing) setLocalRows(pricing);
  }, [pricing]);

  const getPrintName = (id?: Id<"prints"> | "default") =>
    id === "default" ? "Default" : printTypes?.find((p) => String(p._id) === String(id))?.print_type ?? "Unknown";

  const getShirtTypeName = (id?: Id<"shirt_types"> | "default") =>
    id === "default" ? "Default" : shirtTypes?.find((t) => String(t._id) === String(id))?.type_name ?? "Unknown";

  const getSizeObj = (id?: Id<"shirt_sizes"> | "default") =>
    id === "default" ? null : sizes?.find((s) => String(s._id) === String(id)) ?? null;

  const availableSizes = useMemo(() => {
    if (!form.shirt_type || form.shirt_type === "default" || !sizes) return [];
    return sizes.filter((s) => String(s.type) === String(form.shirt_type));
  }, [form.shirt_type, sizes]);

  const openAddModal = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const handleShirtTypeChange = (value: string) => {
    setForm((f) => ({ ...f, shirt_type: value as Id<"shirt_types">, size: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDefault = form.print_id === "default";

    if (!form.amount || (!isDefault && (!form.shirt_type || !form.size))) return;

    try {
      if (editing) {
        if (isDefault) {
          await upsertDefault({
            amount: Number(form.amount),
          });
          setLocalRows((prev) => {
            const exists = prev.find((r) => r.print_id === "default");
            if (exists) return prev.map((r) => r.print_id === "default" ? { ...r, amount: Number(form.amount) } : r);
            return [...prev, { _id: "" as any, print_id: "default", print_type: "Default", shirt_type: "default", size: "default", amount: Number(form.amount), created_at: Date.now() }];
          });
        } else {
          await updatePricing({
            id: editing._id,
            print_id: form.print_id as Id<"prints">,
            shirt_type: form.shirt_type as Id<"shirt_types">,
            size: form.size as Id<"shirt_sizes">,
            amount: Number(form.amount),
            print_type: getPrintName(form.print_id as Id<"prints">),
          });
          setLocalRows((prev) =>
            prev.map((r) =>
              r._id === editing._id
                ? { ...r, print_id: form.print_id as Id<"prints">, shirt_type: form.shirt_type as Id<"shirt_types">, size: form.size as Id<"shirt_sizes">, amount: Number(form.amount) }
                : r
            )
          );
        }
      } else {
        if (isDefault) {
          await upsertDefault({
            description: "Default pricing",
            amount: Number(form.amount),
          });
          setLocalRows((prev) => [
            ...prev,
            { _id: "" as any, print_id: "default", print_type: "Default", shirt_type: "default", size: "default", amount: Number(form.amount), created_at: Date.now() },
          ]);
        } else {
          await createPricing({
            print_id: form.print_id as Id<"prints">,
            shirt_type: form.shirt_type as Id<"shirt_types">,
            size: form.size as Id<"shirt_sizes">,
            amount: Number(form.amount),
            print_type: getPrintName(form.print_id as Id<"prints">),
          });
          setLocalRows((prev) => [
            ...prev,
            {
              _id: "" as Id<"print_pricing">,
              print_id: form.print_id as Id<"prints">,
              shirt_type: form.shirt_type as Id<"shirt_types">,
              size: form.size as Id<"shirt_sizes">,
              amount: Number(form.amount),
              print_type: getPrintName(form.print_id as Id<"prints">),
              created_at: Date.now(),
            },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setForm({ ...emptyForm });
      setEditing(null);
      setIsModalOpen(false);
    }
  };

  const handleEdit = (row: Pricing) => {
    setEditing(row);
    setForm({
      print_id: row.print_id,
      shirt_type: row.shirt_type,
      size: row.size,
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

  const getDefaultPricing = () => localRows.find((r) => r.print_id === "default");

  const openDefaultModal = () => {
    const defaultRow = getDefaultPricing();
    setEditing(defaultRow ?? null);
    setForm({
      print_id: "default",
      shirt_type: defaultRow?.shirt_type ?? "default",
      size: defaultRow?.size ?? "default",
      amount: defaultRow?.amount ? String(defaultRow.amount) : "",
    });
    setIsModalOpen(true);
  };

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
              {/* Default Row */}
              <tr className="bg-blue-50 hover:bg-blue-100">
                <td className="px-6 py-4 text-sm font-semibold">Default</td>
                <td colSpan={2} className="px-6 py-4 text-gray-500">
                  Applies when no specific pricing is set
                </td>
                <td className="px-6 py-4 text-sm">
                  {getDefaultPricing()?.amount
                    ? `₱${getDefaultPricing()?.amount.toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">—</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={openDefaultModal}
                    className="flex items-center gap-1 text-teal-600"
                  >
                    {getDefaultPricing() ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {getDefaultPricing() ? "Edit" : "Set"}
                  </button>
                </td>
              </tr>

              {/* Existing rows */}
              {localRows
                .filter((r) => r.print_id !== "default")
                .map((row) => {
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
                      <td className="px-6 py-4 text-sm">
                        {row.amount === 0 ? getDefaultPricing()?.amount : row.amount
                          ? `₱${row.amount.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {row.amount === 0 ? (
                          <button
                            aria-label="Set up pricing"
                            title="Set up pricing"
                            onClick={() => handleEdit(row)}
                            className="px-4 py-1 text-xs font-medium text-green-600 rounded-lg hover:bg-green-100 transition"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            title="Edit pricing"
                            aria-label="Edit pricing"
                            onClick={() => handleEdit(row)}
                            className="px-4 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          aria-label="Delete pricing"
                          title="Delete pricing"
                          onClick={() => handleDelete(row._id)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, print_id: e.target.value as Id<"prints"> | "default" }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select print type</option>
                  {printTypes.map((p) => (
                    <option key={String(p._id)} value={String(p._id)}>
                      {p.print_type ?? "Unnamed"}
                    </option>
                  ))}
                  <option value="default">Default</option>
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
                  required={form.print_id !== "default"}
                  disabled={form.print_id === "default"}
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, size: e.target.value as Id<"shirt_sizes"> }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required={form.print_id !== "default"}
                  disabled={form.print_id === "default" || !form.shirt_type || form.shirt_type === "default"}
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
