import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import * as fabric from "fabric";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import type { Id } from "../../convex/_generated/dataModel";
import Step1 from "./form/Step1";
import Step2 from "./form/Step2";
import Step3 from "./form/Step3";
import toast from "react-hot-toast";
import { BadgeCheck } from "lucide-react";
import ResponseModal from "./ResponseModal";

interface ShirtDesignFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ShirtDesignForm: React.FC<ShirtDesignFormProps> = ({ onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    title: "",
    message: "",
  });

  const [shirtType, setShirtType] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState<any>(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState("unisex");

  const [sizes, setSizes] = useState<{ sizeId: string; quantity: number }[]>([]);
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>([]);
  const [printType, setPrintType] = useState<"Sublimation" | "Dtf" | undefined>(undefined);

  const [textileId, setTextileId] = useState<string | null>(null);
  const [preferredDesignerId, setPreferredDesignerId] = useState<string | null>(null);
  const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null);
  const [preferredDate, setPreferredDate] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const saveDesignSketchAction = useAction(api.designSketch.saveDesignSketch);

  const canvasRef = useRef<fabric.Canvas | null>(null);

  const { user: clerkUser } = useUser();
  const user = useQuery(api.userQueries.getUserByClerkId, {
    clerkId: clerkUser ? clerkUser.id : ("skip" as any),
  });

  useEffect(() => {
    setShirtType(null);
    setStep(1);
    setCanvasState(null);
    setProjectName("");
    setDescription("");
    setGender("unisex");
    setSizes([]);
    setReferenceImages([]);
    setNewPaletteColors([]);
    setPrintType(undefined);
    setTextileId(null);
    setPreferredDesignerId(null);
    setCanvasSnapshot(null);
    setPreferredDate(null);
    setDateError(null);
  }, []);

  const createNewRequestMutation = useMutation(api.design_requests.createRequest);
  const saveSelectedColorsMutation = useMutation(api.colors.saveSelectedColors);
  const saveDesignReferencesAction = useAction(api.designReferences.saveDesignReferences);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const saveDesign = async () => {
    if (!projectName.trim()) {
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Please enter a project name",
      });
      return;
    }
    if (!sizes || sizes.length === 0) {
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Please add at least one shirt size with quantity",
      });
      return;
    }
    if (!printType) {
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Please select a print type",
      });
      return;
    }

    setIsSubmitting(true);

    if (!user) {
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Please sign in to save your design",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const canvasDataURL =
        canvasSnapshot || canvasRef.current?.toDataURL() || "";

      const requestPayload: any = {
        clientId: user._id,
        sizes: sizes as any,
        textileId: textileId as any,
        requestTitle: projectName,
        tshirtType: shirtType || "",
        gender: gender || "",
        description: description || "",
        printType: printType || undefined,
        preferredDate: preferredDate || undefined,
      };

      if (preferredDesignerId) {
        requestPayload.preferredDesignerId = preferredDesignerId;
      }
      if (preferredDate) {
        requestPayload.preferredDate = preferredDate;
      }

      const requestId = await createNewRequestMutation(requestPayload);

      if (!requestId) {
        throw new Error("Failed to create design request");
      }

      if (canvasDataURL) {
        await saveCanvasSketchToDatabase(requestId as Id<"design_requests">, canvasDataURL);
      }

      if (referenceImages.length > 0) {
        for (const ref of referenceImages) {
          const res = await fetch(ref.image);
          const buffer = await res.arrayBuffer();

          await saveDesignReferencesAction({
            requestId,
            fileBytes: buffer,
            description: ref.description || "",
          });
        }
      }

      if (newPaletteColors.length > 0) {
        await Promise.all(
          newPaletteColors.map(async (color) => {
            let hex = color;
            if (!hex.startsWith("#")) hex = "#" + hex;
            if (!/^#[0-9A-F]{6}$/i.test(hex)) hex = "#000000";

            return saveSelectedColorsMutation({
              requestId,
              hex,
              createdAt: Date.now(),
            });
          })
        );
      }

      onSubmit({
        request_title: projectName,
        tshirt_type: shirtType || "",
        gender: gender || "",
        description: description || "",
        design_image: canvasDataURL,
        requestId,
        preferredDate,
      });
    } catch (error) {
      console.error("Error saving design:", error);
      setResponseModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to save design: " + (error as Error).message,
      });
    } finally {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } bg-green-100/40 text-green-700 px-6 py-3 rounded-lg shadow-lg flex items-center`}
          >
            <BadgeCheck className="mr-2" size={20} />
            <span>Canvas successfully saved!</span>
          </div>
        ),
        {
          duration: 1000,
          position: "top-center",
        }
      );
      setIsSubmitting(false);
    }
  };

  const saveCanvasSketchToDatabase = async (
    requestId: Id<"design_requests">,
    canvasDataURL: string
  ) => {
    if (!canvasDataURL) return;

    try {
      const response = await fetch(canvasDataURL);
      const arrayBuffer = await response.arrayBuffer();

      await saveDesignSketchAction({
        requestId,
        fileBytes: arrayBuffer,
      });
    } catch (error) {
      console.error("❌ Failed to save canvas sketch:", error);
    }
  };

  const shirtSizes = useQuery(api.shirt_sizes.getAll) || [];

  // -------------------------------------------------------
  // ✅ FIXED — REAL FABRIC YARD CALCULATION FROM DB SIZES
  // -------------------------------------------------------

  const calculateTotalYards = (): number => {
    if (!sizes || sizes.length === 0 || !textileId) return 0;

    let totalYards = 0;

    for (const s of sizes) {
      const sizeInfo = shirtSizes.find((sz: any) => sz._id === s.sizeId);
      if (!sizeInfo) continue;

      const w = sizeInfo.w ?? 0;
      const h = sizeInfo.h ?? 0;
      const sw = sizeInfo.sleeves_w ?? 0;
      const sh = sizeInfo.sleeves_h ?? 0;

      const bodyArea = w * h * 2;
      const sleeveArea = sw * sh * 2;

      const totalArea = bodyArea + sleeveArea;

      const yardsPerShirt = totalArea / 2160;

      totalYards += yardsPerShirt * s.quantity;
    }

    return Number(totalYards.toFixed(2));
  };

  const textileInventory = useQuery(api.inventory.getTextileItems) || [];
  const [showStockModal, setShowStockModal] = useState(false);

  const checkFabricStock = (): boolean => {
    if (!sizes || sizes.length === 0 || !textileId) return true;

    const needed = calculateTotalYards();
    const textile = textileInventory.find((t: any) => t._id === textileId);
    const available = textile?.stock ?? 0;

    if (needed > available) {
      setShowStockModal(true);
      return false;
    }

    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="  w-[95%]
  sm:w-[90%]
  md:w-full
  max-w-md
  md:max-w-3xl
  lg:max-w-4xl
  p-4 sm:p-6
  bg-white
  rounded-lg
  shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">
            Customize Your Shirt
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 transition hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-center my-4 space-x-8">
          {["Shirt Type", "Design", "Colors & Details"].map((label, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shadow-lg ${
                  step === index + 1 ? "bg-teal-500 scale-110" : "bg-gray-300"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm mt-1 ${
                  step === index + 1
                    ? "text-teal-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {step === 1 && (
            <Step1 shirtType={shirtType} setShirtType={setShirtType} />
          )}
          {step === 2 && (
            <Step2
              canvasRef={canvasRef}
              canvasState={canvasState}
              setCanvasState={setCanvasState}
              shirtType={shirtType}
              onSaveSnapshot={setCanvasSnapshot}
            />
          )}
          {step === 3 && (
            <Step3
              projectName={projectName}
              setProjectName={setProjectName}
              description={description}
              setDescription={setDescription}
              gender={gender}
              setGender={setGender}
              sizes={sizes}
              setSizes={setSizes}
              shirtType={shirtType}
              referenceImages={referenceImages}
              setReferenceImages={setReferenceImages}
              newPaletteColors={newPaletteColors}
              setNewPaletteColors={setNewPaletteColors}
              textileId={textileId}
              setTextileId={setTextileId}
              preferredDesignerId={preferredDesignerId}
              setPreferredDesignerId={setPreferredDesignerId}
              printType={printType}
              setPrintType={setPrintType}
              preferredDate={preferredDate}
              setPreferredDate={setPreferredDate}
              dateError={dateError}
              setDateError={setDateError}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            className={`px-8 py-1 text-gray-700 transition border rounded-md hover:bg-gray-100 ${
              step === 1 ? "invisible" : ""
            }`}
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-8 py-1 text-white bg-teal-500 rounded-lg shadow-md hover:bg-teal-600"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                if (checkFabricStock()) {
                  saveDesign();
                }
              }}
              disabled={!projectName.trim() || sizes.length === 0 || !printType || isSubmitting}
              className="px-8 py-1 text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                "Save Design"
              )}
            </button>
          )}
        </div>

        {/* Stock Warning Modal */}
        {showStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md p-6 bg-white rounded-lg shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Warning: Insufficient stock
              </h3>

              <p className="mb-4">
                The selected fabric does not have enough stock to fulfill your order.
              </p>

              <p className="mb-4">
                Required: <strong>{calculateTotalYards()} yards</strong>
              </p>

              <p className="mb-6 text-red-600">
                If you proceed, the order may be delayed by at least 7 days.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowStockModal(false);
                    saveDesign();
                  }}
                  className="px-4 py-2 text-white bg-teal-600 rounded-md hover:bg-green-700"
                >
                  Proceed Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      <ResponseModal
        isOpen={responseModal.isOpen}
        type={responseModal.type}
        title={responseModal.title}
        message={responseModal.message}
        onClose={() => setResponseModal({ ...responseModal, isOpen: false })}
      />
    </div>
  );
};

export default ShirtDesignForm;
