// DesignerAddOnsModal.tsx
import React from "react";
import { motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AddOn {
  _id: Id<"addOns">;
  reason?: string;
  price?: number;
  status?: "approved" | "declined" | "pending" | "cancelled";
  created_at?: number | string;
  type?: string;
  adminNote?: string;
  fee?: number;
}

interface DesignerAddOnsModalProps {
  designId: Id<"design">;
  addOns: AddOn[];
  onClose: () => void;
  onSelectImage?: (url: string) => void; // callback to load image to canvas
}

const DesignerAddOnsModal: React.FC<DesignerAddOnsModalProps> = ({
  addOns,
  onClose,
  onSelectImage,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Designer Add-Ons</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add-Ons List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {addOns.length === 0 && (
            <p className="text-gray-500 text-center">No add-ons for this design.</p>
          )}

          {addOns.map((addOn) => (
            <AddOnItem key={addOn._id} addOn={addOn} onSelectImage={onSelectImage} />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Child component for each add-on
function AddOnItem({
  addOn,
  onSelectImage,
}: {
  addOn: AddOn;
  onSelectImage?: (url: string) => void;
}) {
  // Get add-on images
  const imageIds = useQuery(api.addOns.getAddOnsImages, { addOnsId: addOn._id }) ?? [];
  const imageUrls = useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds: imageIds }) ?? [];

  const displayedReason =
    addOn.status === "declined" ? addOn.adminNote ?? "No admin note provided." : addOn.reason ?? "—";

  return (
    <div className="border border-gray-300 rounded-xl p-4 bg-gray-50 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold capitalize">
          {addOn.type?.replace("And", " & ") ?? "Add-On"}
        </span>
        {addOn.status && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              addOn.status === "approved"
                ? "bg-green-100 text-green-700"
                : addOn.status === "declined"
                ? "bg-red-100 text-red-700"
                : addOn.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {addOn.status}
          </span>
        )}
      </div>

      {/* Images */}
      {/* Images */}
        {imageUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((url, idx) => (
            <div
                key={idx}
                className="w-30 h-30 rounded-lg border border-gray-200 overflow-hidden bg-white cursor-pointer"
                onClick={() => url && onSelectImage?.(url)}
            >
                <img
                src={url || "https://placehold.co/400x300?text=No+Image"}
                alt="Add-on"
                className="w-full h-full object-contain bg-white"
                style={{ imageRendering: "auto" }} // keeps PNG quality
                crossOrigin="anonymous" // ensure canvas loading works
                />
            </div>
            ))}
        </div>
        )}

      {/* Reason and fee */}
      <p className="text-sm text-gray-700">
        <strong>Reason:</strong> {displayedReason}
      </p>
      {typeof addOn.fee === "number" && addOn.fee > 0 && (
        <p className="text-sm font-medium">Fee: ₱{addOn.fee.toFixed(2)}</p>
      )}

      {/* Timestamp */}
      {addOn.created_at && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={14} />
          {new Date(typeof addOn.created_at === "number" ? addOn.created_at : new Date(addOn.created_at).getTime()).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default DesignerAddOnsModal;
