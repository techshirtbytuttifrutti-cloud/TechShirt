import { useState } from "react";
import { X, AlertCircle, ChevronLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AddOnItem {
  _id: Id<"addOns">;
  type: "design" | "quantity" | "designAndQuantity";
  reason: string;
  status: "pending" | "approved" | "declined";
  price: number;
  created_at: number;
}

interface ShirtSize {
  _id: Id<"shirt_sizes">;
  size_label: string;
}



interface AdminAddOnsModalProps {
  addOn: AddOnItem;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export default function AdminAddOnsModal({
  addOn,
  onClose,
  onStatusUpdated,
}: AdminAddOnsModalProps) {
  const { user: clerkUser } = useUser();
  const [action, setAction] = useState<"view" | "approve" | "decline">("view");
  const [declineReason, setDeclineReason] = useState("");
  const [addOnsFee, setAddOnsFee] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const addOnSizes = useQuery(api.designs.getAddOnsSizes, { addOnsId: addOn._id }) ?? [];
  const shirtSizes = useQuery(api.shirt_sizes.getAll) ?? [];
  const printPricing = useQuery(api.print_pricing.getAll) ?? [];
  // Get storage IDs
  const addOnImageIds =
  useQuery(api.addOns.getAddOnsImages, { addOnsId: addOn._id }) ?? [];

// Convert storage IDs → URLs (same as ProgressTrackingStep)
  const addOnImageUrls =
  useQuery(api.getPreviewUrl.getPreviewUrls, {
    storageIds: addOnImageIds,
  }) ?? [];
  const adminUser = useQuery(
    api.userQueries.getUserByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  const updateAddOnsStatus = useMutation(api.addOns.updateAddOnsStatus);

  /** MAP: sizeId → size_label */
  const sizeMap: Record<string, string> = {};
  shirtSizes.forEach((s: ShirtSize) => (sizeMap[s._id] = s.size_label));

  /** MAP: sizeId → unit price */
  const priceMap: Record<string, number> = {};
  printPricing.forEach((p) => {
    priceMap[p.size] = p.amount; // assuming p.size is _id
  });

  /** FINAL PRICE CALCULATION (PHP) */
  const quantityPriceTotal =
    addOn.type === "quantity" || addOn.type === "designAndQuantity"
      ? addOnSizes.reduce((total, s) => {
          const unitPrice = priceMap[s.sizeId] || 0;
          return total + unitPrice * s.quantity;
        }, 0)
      : 0;

  const handleApprove = async () => {
    if (!adminUser?._id) return alert("Admin user not found");

    setIsLoading(true);
    try {
      await updateAddOnsStatus({
        addOnsId: addOn._id,
        status: "approved",
        fee: addOnsFee,
        adminId: adminUser._id,
      });
      onStatusUpdated();
      onClose();
    } catch {
      alert("Failed to approve add-ons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return alert("Please provide a reason");
    if (!adminUser?._id) return alert("Admin user not found");

    setIsLoading(true);
    try {
      await updateAddOnsStatus({
        addOnsId: addOn._id,
        status: "declined",
        fee: 0,
        adminReason: declineReason,
        adminId: adminUser._id,
      });
      onStatusUpdated();
      onClose();
    } catch {
      alert("Failed to decline add-ons");
    } finally {
      setIsLoading(false);
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-2 px-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {action !== "view" && (
              <button
                aria-label="Back"
                onClick={() => setAction("view")}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-800">
              {action === "view"
                ? "Add-Ons Request"
                : action === "approve"
                ? "Approve Add-Ons"
                : "Decline Add-Ons"}
            </h2>
          </div>

          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5 text-gray-700">
          {/* View Mode */}
          {action === "view" && (
            <>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border text-gray-600 border-gray-200">
                <Clock size={20} />
                <span className="text-sm font-semibold">
                  Status:
                  {addOn.status === "pending"
                    ? " Pending Review"
                    : addOn.status === "approved"
                    ? " Approved"
                    : " Declined"}
                </span>
              </div>

              {/* Add-On Images */}
              {addOnImageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {addOnImageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="w-full h-20 rounded-lg border border-gray-200 overflow-hidden bg-white"
                  >
                    <img
                      src={url|| "https://placehold.co/400x300?text=No+Image"}
                      alt="Add-on"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}


              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">Submitted</span>
                  <span className="text-sm text-gray-600">
                    {new Date(addOn.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Reason:
                </p>
                <p className="text-sm font-semibold text-gray-600">
                  {addOn.reason}
                </p>
              </div>

              {(addOn.type === "quantity" ||
                addOn.type === "designAndQuantity") &&
                addOnSizes.length > 0 && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                    <p className="text-sm font-semibold">Size Breakdown</p>

                    {addOnSizes.map((s) => {
                      const sizeLabel = sizeMap[s.sizeId];
                      const unitPrice = priceMap[s.sizeId] || 0;

                      return (
                        <div key={s._id} className="flex justify-between">
                          <span>
                            {sizeLabel}: {s.quantity} × ₱{unitPrice.toFixed(2)}
                          </span>
                          <span>₱{(unitPrice * s.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}

                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>₱{quantityPriceTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

              {addOn.status === "pending" && (
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => setAction("approve")}
                    className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setAction("decline")}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Decline
                  </button>
                </div>
              )}
            </>
          )}

          {/* Approve Mode */}
          {action === "approve" && (
            <div className="space-y-4">
              {(addOn.type === "quantity" ||
                addOn.type === "designAndQuantity") && (
                <p className="text-gray-800 font-medium">
                  Quantity Total: ₱{quantityPriceTotal.toFixed(2)}
                </p>
              )}

              <div className="space-y-1">
                <label className="font-medium text-gray-700">
                  Add-Ons Fee {addOn.type === "design" && "(Required)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={addOnsFee}
                  onChange={(e) => setAddOnsFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total Price:</span>
                <span>₱{(quantityPriceTotal + addOnsFee).toFixed(2)}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAction("view")}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoading || (addOn.type === "design" && addOnsFee === 0)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Approving..." : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Decline Mode */}
          {action === "decline" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className=" text-red-600" />
                <p className="text-sm font-semibold text-red-600">Please state a reason for declining this add-ons request.</p>
              </div>

              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
                placeholder="Reason for decline..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAction("view")}
                  className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!declineReason.trim() || isLoading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? "Declining..." : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
