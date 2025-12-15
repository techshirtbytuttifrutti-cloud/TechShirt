import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface DesignerBillModalProps {
  designId: Id<"design">;
  onClose: () => void;
}

const DesignerBillModal: React.FC<DesignerBillModalProps> = ({
  designId,
  onClose,
}) => {
  const billingDoc = useQuery(api.billing.getBillingByDesign, { designId });
  const clientInfo = useQuery(api.billing.getClientInfoByDesign, { designId });

  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");

  if (!billingDoc) return null;

  const breakdown = billingDoc.breakdown;

  // Starting amount (base + add-ons)
  const startingAmount =
    (billingDoc.starting_amount ?? breakdown.total);


  // Final amount saved in billing (fallback to starting)
  const finalAmountValue =
    billingDoc.final_amount && billingDoc.final_amount > 0
      ? billingDoc.final_amount
      : startingAmount;

  // Client discount = starting - final (only if > 0)
  const clientDiscount =
    startingAmount > finalAmountValue
      ? startingAmount - finalAmountValue
      : 0;

  const saveFinalAmount = useMutation(api.billing.UpdateFinalAmount);
  const shirtSizes = useQuery(api.shirt_sizes.getAll); // or getByIds with all size_ids

  const handleSaveFinalAmount = async () => {
    if (!billingDoc?._id || !finalAmount) return;

    try {
      await saveFinalAmount({
        billingId: billingDoc._id,
        finalAmount: Number(finalAmount),
      });
      setIsNegotiationOpen(false);
    } catch (err) {
      console.error("Error saving final amount:", err);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Invoice</h3>
              <p className="text-sm text-gray-500">Invoice No. #{billingDoc._id}</p>
              <p className="text-sm text-gray-500">
                {new Date(billingDoc._creationTime).toLocaleDateString()}
              </p>
            </div>
            <button
              aria-label="close"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Client Info */}
          <div className="mb-6 text-gray-700 text-sm">
            <h4 className="font-bold mb-1">Client Info</h4>
            <p>
              {clientInfo
                ? `${clientInfo.firstName} ${clientInfo.lastName}`
                : "Client Name"}
            </p>
            <p>{clientInfo?.phone || "No contact number"}</p>
            <p>{clientInfo?.address || "No address"}</p>
          </div>

          {/* Billing Table Scrollable */}
          <div className="mb-6 border border-gray-300 max-h-64 overflow-y-auto">
            <table className="w-full text-sm text-left ">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-center">Quantity</th>
                  <th className="px-3 py-2 text-center">Unit Price</th>
                  <th className="px-3 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.shirts?.map((shirt, index) => {
                  const sizeLabel =
                    shirtSizes?.find((s) => s._id === shirt.size_id)?.size_label ??
                    shirt.size_id; // fallback to ID if not found
                  return (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2">{sizeLabel}</td>
                      <td className="text-center">{shirt.quantity}</td>
                      <td className="text-center">
                        ₱{shirt.unit_price.toLocaleString()}
                      </td>
                      <td className="text-center">
                        ₱{shirt.total_price.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {breakdown.revisionFee > 0 && (
                  <tr className="border-t">
                    <td className="px-3 py-2">Revision Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">₱{breakdown.revisionFee}</td>
                    <td className="text-center">₱{breakdown.revisionFee}</td>
                  </tr>
                )}

                {breakdown.designerFee > 0 && (
                  <tr className="border-t">
                    <td className="px-3 py-2">Designer Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">₱{breakdown.designerFee}</td>
                    <td className="text-center">₱{breakdown.designerFee}</td>
                  </tr>
                )}

                {(billingDoc.addons_shirt_price ?? 0) > 0 && (
                  <tr className="border-t bg-blue-50">
                    <td className="px-3 py-2 font-semibold text-blue-900">
                      Add-Ons (Shirt/Design)
                    </td>
                    <td className="text-center">-</td>
                    <td className="text-center">-</td>
                    <td className="text-center font-semibold text-blue-900">
                      ₱{(billingDoc.addons_shirt_price ?? 0).toLocaleString()}
                    </td>
                  </tr>
                )}

                {(billingDoc.addons_fee ?? 0) > 0 && (
                  <tr className="border-t bg-blue-50">
                    <td className="px-3 py-2 font-semibold text-blue-900">Add-Ons Fee</td>
                    <td className="text-center">-</td>
                    <td className="text-center">
                      ₱{(billingDoc.addons_fee ?? 0).toLocaleString()}
                    </td>
                    <td className="text-center font-semibold text-blue-900">
                      ₱{(billingDoc.addons_fee ?? 0).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-1/3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>₱{startingAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tax/VAT (12%):</span>
                <span>
                  ₱
                  {(startingAmount * 0.12).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total:</span>
                <span>₱{startingAmount.toLocaleString()}</span>
              </div>

              {clientDiscount > 0 &&
                billingDoc.status?.toLowerCase() === "approved" && (
                  <div className="flex justify-between text-green-600">
                    <span>Client Discount:</span>
                    <span>
                      -₱
                      {clientDiscount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}

              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Final Price:</span>
                <span>
                  ₱
                  {finalAmountValue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Bill Status */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border text-sm text-gray-700 flex justify-between items-center">
            <div>
              <span className="font-medium">Bill Status:</span>{" "}
              <span className="text-blue-600 font-semibold">
                {billingDoc.status || "Pending"}
              </span>
            </div>

            {(!billingDoc.status ||
              billingDoc.status.toLowerCase() === "pending") && (
              <button
                onClick={() => setIsNegotiationOpen(true)}
                className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Manage Negotiation
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Negotiation Modal */}
      {isNegotiationOpen && (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Negotiation Details
              </h3>
              <button
                aria-label="Close"
                onClick={() => setIsNegotiationOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm mb-4">
              <span className="font-semibold">Starting Amount:</span> ₱
              {startingAmount.toLocaleString()}
            </p>

            <input
              type="number"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              placeholder="Enter final amount"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />

            <button
              onClick={handleSaveFinalAmount}
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Submit Final Amount
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default DesignerBillModal;
