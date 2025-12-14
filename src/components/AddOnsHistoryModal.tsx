import { useState } from "react";
import { X, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

import AddOnsModal from "./AddOnsModal";

interface ShirtSize {
  _id: Id<"shirt_sizes">;
  size_label: string;
  type?: string;
}



interface Props {
  designId: Id<"design">;
  onClose: () => void;
  shirtSizes: ShirtSize[];
  currentShirtTypeId: string;
  currentDesignStatus: string;
}

// ... imports remain the same

export default function AddOnsHistoryModal({
  designId,
  onClose,
  shirtSizes,
  currentShirtTypeId,
  currentDesignStatus,
}: Props) {
  const { user } = useUser();

  const addOns = useQuery(api.addOns.listByDesign, { designId }) ?? [];
  const [cancelingId, setCancelingId] = useState<Id<"addOns"> | null>(null);
  const cancelAddOn = useMutation(api.addOns.cancelAddOn);

  const reviewer = useQuery(
    api.userQueries.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const updateDesignStatus = useMutation(api.designs.updateStatus);
  const submitAddOns = useMutation(api.addOns.submitAddOns);
  const uploadImageToStorage = useAction(api.files.uploadFileToStorage);

  const [_responseModal, setResponseModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [isAddOnsModalOpen, setIsAddOnsModalOpen] = useState(false);

  const handleCancel = async (addOnId: Id<"addOns">) => {
    if (!confirm("Are you sure you want to cancel this add-on?")) return;
    setCancelingId(addOnId);
    try {
      await cancelAddOn({ addOnsId: addOnId });
    } catch {
      alert("Failed to cancel add-on.");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        {/* Header with New Add-On button */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Add-Ons History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddOnsModalOpen(true)}
              className="px-3 py-1 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
            >
              New Add-On
            </button>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add-Ons List */}
        <div className="p-4 space-y-4">
          {addOns.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              No add-ons submitted yet.
            </p>
          )}

          {addOns.map((a) => (
            <AddOnItem
              key={a._id}
              addOn={a}
              cancelingId={cancelingId}
              handleCancel={handleCancel}
            />
          ))}
        </div>

        {/* AddOnsModal */}
        {isAddOnsModalOpen && reviewer?._id && (
          <AddOnsModal
            onClose={() => setIsAddOnsModalOpen(false)}
            shirtSizes={shirtSizes}
            currentShirtTypeId={currentShirtTypeId}
            currentDesignStatus={currentDesignStatus}
            onSubmit={async (payload) => {
              try {
                if (!payload.addOnType) {
                  throw new Error("Please select a valid add-on type.");
                }

                const imageStorageIds: Id<"_storage">[] = [];
                if (payload.images?.length) {
                  for (const img of payload.images) {
                    const base64Data = img.image.split(",")[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    const storageId = await uploadImageToStorage({
                      fileBytes: bytes.buffer,
                      fileName: `addon-${Date.now()}.jpg`,
                    });
                    imageStorageIds.push(storageId as Id<"_storage">);
                  }
                }

                await submitAddOns({
                  designId,
                  userId: reviewer._id,
                  addOnType: payload.addOnType as "design" | "quantity" | "both",
                  reason: payload.reason,
                  sizeUpdates: payload.sizeUpdates.map((s) => ({
                    sizeId: s.sizeId as Id<"shirt_sizes">,
                    quantity: s.quantity,
                  })),
                  imageStorageIds: imageStorageIds.length ? imageStorageIds : undefined,
                });

                if (payload.newStatus) {
                  await updateDesignStatus({
                    designId,
                    status: payload.newStatus as any,
                  });
                }

                setResponseModal({
                  isOpen: true,
                  type: "success",
                  title: "Success!",
                  message:
                    "Add-ons submitted successfully! The admin team has been notified.",
                });
                setIsAddOnsModalOpen(false);
              } catch (err) {
                console.error(err);
                setResponseModal({
                  isOpen: true,
                  type: "error",
                  title: "Error",
                  message:
                    err instanceof Error
                      ? err.message
                      : "Failed to submit add-ons. Please try again.",
                });
              }
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// Child component with improved Cancel button
function AddOnItem({
  addOn,
  cancelingId,
  handleCancel,
}: {
  addOn: any;
  cancelingId: Id<"addOns"> | null;
  handleCancel: (id: Id<"addOns">) => void;
}) {
  const imageIds = useQuery(api.addOns.getAddOnsImages, { addOnsId: addOn._id }) ?? [];
  const imageUrls = useQuery(api.getPreviewUrl.getPreviewUrls, { storageIds: imageIds }) ?? [];

  const displayedReason =
    addOn.status === "declined" ? addOn.adminNote ?? "No admin note provided." : addOn.reason ?? "—";

  return (
    <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold capitalize">{addOn.type.replace("And", " & ")}</span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            addOn.status === "approved"
              ? "bg-green-100 text-green-700"
              : addOn.status === "declined"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {addOn.status}
        </span>
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url, idx) => (
            <div
              key={idx}
              className="w-full h-20 rounded-lg border border-gray-200 overflow-hidden bg-white"
            >
              <img
                src={url || "https://placehold.co/400x300?text=No+Image"}
                alt="Add-on"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-700">
        <strong>Reason:</strong> {displayedReason}
      </p>
      {typeof addOn.fee === "number" && addOn.fee > 0 && (
        <p className="text-sm font-medium">Fee: ₱{addOn.fee.toFixed(2)}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock size={14} />
        {new Date(addOn.created_at).toLocaleString()}
      </div>

      {addOn.status === "pending" && (
        <div className="flex justify-end mt-2">
          <button
            onClick={() => handleCancel(addOn._id)}
            disabled={cancelingId === addOn._id}
            className="px-3 py-1 text-red-600 border border-red-400 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
          >
            {cancelingId === addOn._id ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      )}
    </div>
  );
}
