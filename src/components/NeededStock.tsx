import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Trash2, Plus } from "lucide-react";

interface NeededStockModalProps {
  onClose: () => void;
  designId: Id<"design">;
  userId: Id<"users">;
  onSubmitSuccess: () => void;
}

interface NeededItem {
  itemId: Id<"inventory_items">;
  quantity: number;
  itemName?: string;
}

const NeededStockModal: React.FC<NeededStockModalProps> = ({
  onClose,
  designId,
  userId,
  onSubmitSuccess,
}) => {
  const inventory = useQuery(api.inventory.getInventoryItems);
  const updateStock = useMutation(api.inventory.updateStockForNeededItem);
  const markInProduction = useMutation(api.designs.markAsInProduction);

  // Fetch design with full details including request and fabric
  const design = useQuery(api.designs.getById, { designId });
  const designRequest = useQuery(
    api.design_requests.getFullRequestDetails,
    design?.request_id ? { requestId: design.request_id } : "skip"
  );
  const shirtSizes = useQuery(api.shirt_sizes.getAll);

  const [neededItems, setNeededItems] = useState<NeededItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // -------------------------------------------------------
  // AUTO CALCULATE NEEDED FABRIC BASED ON SHIRT SIZES
  // -------------------------------------------------------
  const autoYards = useMemo(() => {
    if (!designRequest?.sizes || !shirtSizes) return 0;

    let total = 0;
    for (const sizeInfo of designRequest.sizes) {
      if (!sizeInfo.size_label) continue;

      // Yard per size lookup
      const yardPerSize: Record<string, number> = {
        XS: 0.8,
        S: 1.0,
        M: 1.2,
        L: 1.4,
        XL: 1.6,
        XXL: 1.8,
      };

      const yardsPerShirt = yardPerSize[sizeInfo.size_label] ?? 1.2;
      total += yardsPerShirt * sizeInfo.quantity;
    }

    return Number(total.toFixed(2));
  }, [designRequest?.sizes, shirtSizes]);

  // -------------------------------------------------------
  // PREFILL NEEDED ITEMS BASED ON DESIGN'S FABRIC
  // -------------------------------------------------------
  useEffect(() => {
    if (!inventory || isInitialized || !designRequest?.fabric) return;

    // Find the inventory item that matches the design's fabric
    const fabricItem = inventory.find(
      (item) => item._id === designRequest.fabric?._id
    );

    if (!fabricItem) return;

    setNeededItems([
      {
        itemId: fabricItem._id,
        quantity: autoYards,
        itemName: fabricItem.name,
      },
    ]);
    setIsInitialized(true);
  }, [inventory, autoYards, isInitialized, designRequest?.fabric]);

  // -------------------------------------------------------
  // HANDLE ITEM CHANGES
  // -------------------------------------------------------
  const handleAddItem = () => {
    if (!inventory || inventory.length === 0) return;

    const firstItem = inventory[0];
    setNeededItems([
      ...neededItems,
      {
        itemId: firstItem._id,
        quantity: 1,
        itemName: firstItem.name,
      },
    ]);
  };

  const handleUpdateItem = (
    index: number,
    field: "itemId" | "quantity",
    value: any
  ) => {
    const updated = [...neededItems];
    if (field === "itemId") {
      const selectedItem = inventory?.find((item) => item._id === value);
      updated[index] = {
        ...updated[index],
        itemId: value,
        itemName: selectedItem?.name,
      };
    } else {
      updated[index] = {
        ...updated[index],
        quantity: value,
      };
    }
    setNeededItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    setNeededItems(neededItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    for (const item of neededItems) {
      await updateStock({
        itemId: item.itemId,
        neededQty: item.quantity,
      });
    }

    await markInProduction({ designId, userId });
    onSubmitSuccess();
    onClose();
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Required Materials for Production
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {designRequest?.fabric?.name && (
            <>
              Primary Fabric: <span className="font-semibold">{designRequest.fabric.name}</span>
              {autoYards > 0 && (
                <span className="ml-2 text-teal-600">
                  (Auto-calculated: {autoYards} {designRequest.fabric.unit})
                </span>
              )}
            </>
          )}
        </p>

        {/* Items List */}
        <div className="space-y-3 mb-6">
          {neededItems.map((entry, idx) => {
            const selectedItem = inventory?.find((item) => item._id === entry.itemId);
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <select
                  aria-label="Select an item"
                  value={entry.itemId}
                  onChange={(e) =>
                    handleUpdateItem(
                      idx,
                      "itemId",
                      e.target.value as Id<"inventory_items">
                    )
                  }
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  {inventory?.map((inv) => (
                    <option key={inv._id} value={inv._id}>
                      {inv.name} ({inv.unit})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={0}
                    step={0.1}
                    value={entry.quantity}
                    onChange={(e) =>
                      handleUpdateItem(idx, "quantity", Number(e.target.value))
                    }
                    className="w-24 border border-gray-300 rounded-md px-2 py-2 text-center"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {selectedItem?.unit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md transition"
                  title="Delete item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Item Button */}
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium mb-6"
        >
          <Plus size={16} />
          Add another item
        </button>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={neededItems.length === 0}
            className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white font-medium transition"
          >
            Submit & Start Production
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeededStockModal;
