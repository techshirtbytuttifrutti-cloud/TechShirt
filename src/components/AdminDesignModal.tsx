import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

// Steps
import ProgressTrackingStep from "./adminDesignSteps/ProgressTrackingStep";
import SeeDesignStep from "./adminDesignSteps/SeeDesignStep";
import FinalizeDesignStep from "./adminDesignSteps/FinalizeStep";
import NeededStockModal from "./NeededStock";
// Modal header
import DesignHeader from "./designDetailsModal/DesignHeader";

interface UserDesignModalProps {
  requestId: Id<"design_requests">;
  onClose: () => void;
}

const UserDesignModal: React.FC<UserDesignModalProps> = ({ requestId, onClose }) => {
  const [step, setStep] = useState(1);
  const { user } = useUser();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const convexUser = useQuery(api.userQueries.getUserByClerkId, user ? { clerkId: user.id } : "skip");
  const design = useQuery(api.designs.getDesignByRequestId, { requestId });
  const markCompleted = useMutation(api.designs.markAsCompleted);
  const markPendingPickup = useMutation(api.designs.pendingPickup);

  // Inside the component, after fetching `design`:

// ✅ Only fetch billing if design exists

  const [showNeededStockModal, setShowNeededStockModal] = useState(false);

  const totalSteps = 3;
  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  // Wait until design is loaded
  if (!design ) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="p-4 text-sm sm:p-6 sm:text-base">Loading design...</div>
      </div>
    );
  }

  const renderActionButton = () => {
    // Only show Start Production if design exists and bill is approved
 if (design.status === "approved") {
      return (
        <button
          type="button"
          onClick={() => {
            if (!convexUser?._id) return;
            setShowNeededStockModal(true);
          }}
          className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
        >
          Start Production
        </button>
      );
    }

    if (design.status === "in_production") {
      return (
        <button
          type="button"
          onClick={async () => {
            if (!convexUser?._id) return;
            try {
              await markPendingPickup({ designId: design._id, userId: convexUser._id });
              setSuccessMessage("Design marked as Pending Pickup!");
              setShowSuccessModal(true);
            } catch (error) {
              console.error("Error updating status:", error);
            }
          }}
          className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
        >
          Mark as Ready for Pickup
        </button>
      );
    }

    if (design.status === "pending_pickup") {
      return (
        <button
          type="button"
          onClick={async () => {
            if (!convexUser?._id) return;
            try {
              await markCompleted({ designId: design._id, userId: convexUser._id });
              setSuccessMessage("Design marked as Completed!");
              setShowSuccessModal(true);
            } catch (error) {
              console.error("Error updating status:", error);
            }
          }}
          className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600"
        >
          Mark as Completed
        </button>
      );
    }

    return (
      <button
        onClick={onClose}
        className="px-4 sm:px-6 md:px-8 py-2 text-xs sm:text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        Close
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-3 sm:p-6 bg-white rounded-lg shadow-2xl h-[70vh] sm:h-[75vh] md:h-[90vh] flex flex-col"
      >
        {/* Scrollable content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <DesignHeader onClose={onClose} designId={design._id} />

          {/* Stepper */}
          <div className="flex justify-center my-2 sm:my-3 space-x-2 sm:space-x-4 md:space-x-6">
            {["Order Details", "Design Progress", "Summary"].map((label, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-white text-xs sm:text-sm font-bold shadow-lg ${
                    step === index + 1 ? "bg-teal-500 scale-110" : "bg-gray-300"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-[9px] sm:text-xs md:text-sm mt-0.5 text-center max-w-[55px] sm:max-w-none ${
                    step === index + 1 ? "text-teal-600 font-medium" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="mt-1 sm:mt-2 flex-1">
            {step === 1 && <SeeDesignStep designId={design._id} />}
            {step === 2 && <ProgressTrackingStep designId={design._id} />}
            {step === 3 && convexUser && <FinalizeDesignStep design={design} />}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-2 mt-2 sm:mt-3">
          <button
            onClick={handleBack}
            className={`px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 transition border rounded-md hover:bg-gray-100 ${
              step === 1 ? "invisible" : ""
            }`}
          >
            Back
          </button>

          {step === totalSteps ? renderActionButton() : (
            <button
              onClick={handleNext}
              className="px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
            >
              Next
            </button>
          )}
        </div>
      </motion.div>

      {showNeededStockModal && convexUser && (
        <NeededStockModal
          onClose={() => setShowNeededStockModal(false)}
          designId={design._id}
          userId={convexUser._id}
          onSubmitSuccess={() => {
            setShowNeededStockModal(false);
            setSuccessMessage("Design moved to Production!");
            setShowSuccessModal(true);
          }}
        />
      )}

      {showSuccessModal && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
              }}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default UserDesignModal;
