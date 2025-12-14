import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import CanvasSettings from "./designCanvasComponents/CanvasSettings";
import DesignDetails from "./designCanvasComponents/CanvasDesignDetails";
import { Save,Plus, Upload, Info, Wrench, ArrowLeft, ReceiptText, Image, MessageCircleMore, Notebook, Loader2, BadgeCheck, ImageDown, Eye, EyeOff, RotateCcw, RotateCw } from "lucide-react"; // added Back icon
import { useQuery } from "convex/react";
import toast from "react-hot-toast";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useMutation, useAction } from "convex/react";
import { useNavigate } from "react-router-dom";
import DesignerBillModal from "./DesignerBillModal";
import { addImageFromUrl } from "./designCanvasComponents/CanvasTools";
import CommentsModal from "./designCanvasComponents/CanvasComments";
import ReferencesGallery from "./designCanvasComponents/CanvasDesignReferences";
import CanvasSketch from "./designCanvasComponents/CanvasSketchModal";
import DesignerAddOnsModal from "./AddOnsDesignerModal";
import { motion } from "framer-motion";
// 🔹 Import guide overlay images
import TshirtGuide from "../images/Tshirt.png";
import PoloGuide from "../images/Polo.png";
import LongsleeveGuide from "../images/Longsleeve.png";
import JerseyGuide from "../images/Jersey.png";
import VneckGuide from "../images/Vneck.png";
// 🔹 Bigger canvas size
const CANVAS_WIDTH = 730;
const CANVAS_HEIGHT = 515;

interface FabricCanvasProps {
  designId: Id<"design">;
  initialCanvasJson?: string | null;
  onReady?: (canvasEl: HTMLCanvasElement) => void;
  onModified?: () => void;
  getThreeScreenshot?: () => string; // screenshot from 3D preview
}

const FabricCanvas: React.FC<FabricCanvasProps> = ({
  designId,
  initialCanvasJson,
  onReady,
  onModified,
  getThreeScreenshot,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const notifyTimeoutRef = useRef<number | null>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const navigate = useNavigate();
  const notifyClientUpdate = useMutation(api.design_notifications.notifyClientDesignUpdate);

  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  // 🔹 Download canvas with guide overlay if enabled
  const handleDownloadCanvas = () => {
    if (!canvas) return;

    // Create a temporary canvas to merge the design canvas with the guide overlay
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Draw the fabric canvas first
    const fabricDataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    const fabricImg = document.createElement("img");
    fabricImg.onload = () => {
      ctx.drawImage(fabricImg, 0, 0);

      // If guide overlay is enabled, draw it on top
      if (showGuideOverlay) {
        const guideImagePath = getGuideImagePath(designRequest?.tshirt_type);
        const guideImg = document.createElement("img");
        guideImg.crossOrigin = "anonymous";
        guideImg.onload = () => {
          ctx.drawImage(guideImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          downloadImage();
        };
        guideImg.onerror = () => {
          // If guide image fails to load, just download without it
          downloadImage();
        };
        guideImg.src = guideImagePath;
      } else {
        downloadImage();
      }
    };

    const downloadImage = () => {
      const finalDataURL = tempCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = finalDataURL;
      link.download = `design_${designId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    fabricImg.src = fabricDataURL;
  };


  

  const [showReferences, setShowReferences] = useState(false);
  // 🔹 Guide overlay state - toggles the longsleeve guide image overlay on/off
  const [showGuideOverlay, setShowGuideOverlay] = useState(false);

  // 🔹 Floating panel state
  const [activeTab, setActiveTab] = useState<"none" | "details" | "tools"| "references"| "comments"| "sketch">(
    "none"
  );

  const saveCanvas = useMutation(api.fabric_canvases.saveCanvas);
  const savePreview = useAction(api.design_preview.savePreview);
  const designDoc = useQuery(api.designs.getById, { designId });
  const isDisabled = designDoc?.status === "approved" || designDoc?.status === "completed";
  const requestId = designDoc?.request_id;
  const [showAddOns, setShowAddOns] = useState(false);
  const addOns = useQuery(api.addOns.listByDesign, { designId });


  // 🔹 Fetch design request to get shirt type
  const designRequest = useQuery(
    api.design_requests.getById,
    designDoc?.request_id ? { requestId: designDoc.request_id } : "skip"
  );

  // 🔹 Function to get guide image based on shirt type
  const getGuideImagePath = (shirtType?: string): string => {
    if (!shirtType) return TshirtGuide;

    const normalized = shirtType.toLowerCase().trim();
    const guideMap: Record<string, string> = {
      "round neck": TshirtGuide,
      "round_neck": TshirtGuide,
      "v-neck": VneckGuide,
      "vneck": VneckGuide,
      "v neck": VneckGuide,
      "V Neck": VneckGuide,
      "Vneck": VneckGuide,
      "polo": PoloGuide,
      "polo shirt": PoloGuide,
      "long sleeves": LongsleeveGuide,
      "long_sleeves": LongsleeveGuide,
      "longsleeve": LongsleeveGuide,
      "jersey": JerseyGuide,
    };

    return guideMap[normalized] || TshirtGuide;
  };

  const [showComments, setShowComments] = useState(false);
  const previewDoc = useQuery(api.design_preview.getLatestByDesign, { designId });
  const comments = useQuery(
    api.comments.listByPreview,
    previewDoc?._id ? { preview_id: previewDoc._id } : "skip"
  );
  const [showSketch, setShowSketch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  

  const notifyParent = (c?: fabric.Canvas) => {
    if (notifyTimeoutRef.current) {
      window.clearTimeout(notifyTimeoutRef.current);
      notifyTimeoutRef.current = null;
    }
    notifyTimeoutRef.current = window.setTimeout(() => {
      try {
        const current = c || fabricRef.current || canvas;
        if (!current) return;
        current.renderAll();
        if (onModified) onModified();
        if (onReady && current.lowerCanvasEl) onReady(current.lowerCanvasEl);
      } catch {}
    }, 60);
  };

  // Save canvas state to history
  const saveToHistory = (c?: fabric.Canvas) => {
    const current = c || fabricRef.current || canvas;
    if (!current) return;

    const json = JSON.stringify(current.toJSON());
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(json);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Undo function
  const handleUndo = () => {
    if (historyStep <= 0) return;
    const current = fabricRef.current || canvas;
    if (!current) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);
    current.loadFromJSON(history[newStep], () => {
      current.renderAll();
      notifyParent(current);
    });
  };

  // Redo function
  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    const current = fabricRef.current || canvas;
    if (!current) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);
    current.loadFromJSON(history[newStep], () => {
      current.renderAll();
      notifyParent(current);
    });
  };

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const c = new fabric.Canvas(canvasElRef.current, {
      height: CANVAS_HEIGHT,
      width: CANVAS_WIDTH,
      backgroundColor: "#f5f5f5",
      preserveObjectStacking: true,
    });

    fabricRef.current = c;
    setCanvas(c);
    if (onReady && c.lowerCanvasEl) onReady(c.lowerCanvasEl);

    const eventTypes = [
      "object:added",
      "object:modified",
      "object:removed",
      "path:created",
      "after:render",
      "selection:cleared",
    ];
    const handler = () => notifyParent(c);
    eventTypes.forEach((ev) => c.on(ev as any, handler));

    return () => {
      eventTypes.forEach((ev) => c.off(ev as any, handler));
      try {
        c.dispose && c.dispose();
      } catch {}
      fabricRef.current = null;
      setCanvas(null);
      if (notifyTimeoutRef.current) window.clearTimeout(notifyTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady, onModified]);

  // Load initial JSON
  useEffect(() => {
    if (!canvas) return;
    if (initialCanvasJson) {
      try {
        const parsed =
          typeof initialCanvasJson === "string"
            ? JSON.parse(initialCanvasJson)
            : initialCanvasJson;
          canvas.loadFromJSON(parsed, () => {
          canvas.backgroundColor = "#f5f5f5";
          canvas.selection = false;
          canvas.skipTargetFind = true;

          canvas.renderAll();

          // Save initial state to history
          const json = JSON.stringify(canvas.toJSON());
          setHistory([json]);
          setHistoryStep(0);

          notifyParent(canvas);
        });
      } catch {
        canvas.clear();
        canvas.backgroundColor = "#f5f5f5";
        canvas.renderAll();

        // Save initial state to history
        const json = JSON.stringify(canvas.toJSON());
        setHistory([json]);
        setHistoryStep(0);

        notifyParent(canvas);
      }
    } else {
      canvas.clear();
      canvas.backgroundColor = "#f5f5f5";
      canvas.renderAll();
      notifyParent(canvas);
    }
  }, [canvas, initialCanvasJson]);

  // Add history tracking for canvas modifications
  useEffect(() => {
    if (!canvas) return;

    const historyHandler = () => {
      saveToHistory(canvas);
    };

    const historyEvents = ["object:added", "object:modified", "object:removed", "path:created"];
    historyEvents.forEach((ev) => canvas.on(ev as any, historyHandler));

    return () => {
      historyEvents.forEach((ev) => canvas.off(ev as any, historyHandler));
    };
  }, [canvas, history, historyStep]);

  // 🔹 Save only JSON
  const handleSave = async () => {
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
     setIsSaving(true);
    try {
      await saveCanvas({ designId, canvasJson: json, thumbnail: undefined });
      setIsSaving(false);
      notifyParent(canvas);
      toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        }  text-green-700 px-8 py-2 flex items-center`}
          >
            <BadgeCheck className="mr-2" size={20} />
            <span>Design Sucessfully saved!</span>
          </div>
              
          ));
    } catch (err) {
      console.error("Failed to save canvas", err);
     toast.error("Error saving canvas");
    }
  };
 const updateDesignStatus = useMutation(api.designs.updateStatus);
  // 🔹 Save only Preview Image
  const handlePostUpdate = async () => {
  if (!getThreeScreenshot) {
    alert("3D preview screenshot function not provided.");
    return;
  }
     setIsPosting(true);
    try {
      const dataUrl = getThreeScreenshot();
      const blob = await (await fetch(dataUrl)).blob();
      const previewBuffer = await blob.arrayBuffer();

      // 1️⃣ Save the preview
      await savePreview({ designId, previewImage: previewBuffer });
      await updateDesignStatus({ designId, status: "in_progress" });

      // 2️⃣ Notify the client & update status
      await notifyClientUpdate({ designId });
      toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        }  text-green-700 px-8 py-2 flex items-center`}
          >
            <BadgeCheck className="mr-2" size={20} />
            <span>Update sucessfully posted!</span>
          </div>
              
      ));
      setIsPosting(false);
    } catch (err) {
      console.error("Failed to post update", err);
    toast.error("Error posting update");
    }
  };
  const billingDoc = useQuery(api.billing.getBillingByDesign, { designId });
  const [isDesignerBillOpen, setIsDesignerBillOpen] = useState(false);

  

  return (
    <div className="p-2 relative">
      {/* Top row: Controls */}
      <div className="flex items-center mb-4 gap-2 flex-wrap justify-end">
        {/* Right-side controls: Details, Tools, Save, Post */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* See Bill button – only show if billing exists */}
          {billingDoc && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsDesignerBillOpen(true)}
              className="p-2 rounded bg-zinc-500 hover:bg-zinc-600 text-white"
              title="See Bill"
            >
              <ReceiptText size={18} />
            </motion.button>
          )}

          {/* Back button - before sketch on mobile, visible on desktop */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-300"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

         

          {/*See Sketch*/}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowSketch(true)}
            className={`p-2 rounded ${
              showSketch ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="Sketch"
          >
          <Notebook size={18} />

          </motion.button>
           <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowAddOns(true)}
            className="p-2 rounded bg-indigo-500 hover:bg-indigo-600 text-white"
            title="View Add-Ons"
          >
            <Plus size={18} />
          </motion.button>
          {/* Comments button – only show if there are comments */}
          {comments && comments.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setShowComments(true)}
              className={`p-2 rounded ${
                showComments ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
              title="Comments"
            >
              <MessageCircleMore size={18} />
            </motion.button>
          )}
          {/* References button */}
           <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowReferences(true)}
            className={`p-2 rounded ${
              showReferences ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="See References"
          >
            <Image size={18} />
          </motion.button>

          {/* Use Guide button - always visible */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowGuideOverlay(!showGuideOverlay)}
            className={`p-2 rounded ${
              showGuideOverlay ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="Toggle Guide Overlay"
          >
            {showGuideOverlay ? <Eye size={18} /> : <EyeOff size={18} />}
          </motion.button>

          {/* Details button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() =>
              setActiveTab(activeTab === "details" ? "none" : "details")
            }
            className={`p-2 rounded ${
              activeTab === "details" ? "bg-cyan-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
            title="Details"
          >
            <Info size={18} />
          </motion.button>

          {/* Tools button */}
          {!isDisabled &&  (
             <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() =>
                setActiveTab(activeTab === "tools" ? "none" : "tools")
              }
              className={`p-2 rounded ${
                activeTab === "tools" ? "bg-cyan-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
              title="Tools"
            >
              <Wrench size={18} />
            </motion.button>
          )}

          {/* Undo button */}
          {!isDisabled && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              disabled={historyStep <= 0}
              onClick={handleUndo}
              className={`p-2 rounded ${
                historyStep <= 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Undo"
            >
              <RotateCcw size={18} />
            </motion.button>
          )}

          {/* Redo button */}
          {!isDisabled && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              disabled={historyStep >= history.length - 1}
              onClick={handleRedo}
              className={`p-2 rounded ${
                historyStep >= history.length - 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Redo"
            >
              <RotateCw size={18} />
            </motion.button>
          )}
          

          {/* Save button */}
          {/* Save button */}
          {!isDisabled && (
            <motion.button
              whileHover={!isSaving ? { scale: 1.1 } : {}}
              whileTap={!isSaving ? { scale: 0.95 } : {}}
              type="button"
              disabled={isSaving}
              title="Save design"
              className={`flex items-center gap-2 px-3 py-2 rounded text-white transition-all ${
                isSaving ? "bg-green-400 opacity-70 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
              }`}
              onClick={handleSave}
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                  </motion.div>
                  <span className="text-sm font-medium">Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span className="text-sm font-medium">Save</span>
                </>
              )}
            </motion.button>
          )}

          {/* Post Update button */}
          {!isDisabled && (
            <motion.button
              whileHover={!isPosting ? { scale: 1.1 } : {}}
              whileTap={!isPosting ? { scale: 0.95 } : {}}
              type="button"
              disabled={isPosting}
              title="Post update"
              className={`flex items-center gap-2 px-3 py-2 rounded text-white transition-all ${
                isPosting ? "bg-teal-400 opacity-70 cursor-not-allowed" : "bg-teal-500 hover:bg-teal-600"
              }`}
              onClick={handlePostUpdate}
            >
              {isPosting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                  </motion.div>
                  <span className="text-sm font-medium">Posting...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span className="text-sm font-medium">Post</span>
                </>
              )}
            </motion.button>
          )}
          <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleDownloadCanvas}
          className="flex items-center gap-2 px-3 py-2 rounded bg-slate-300 hover:bg-slate-500 text-white"
          title="Download Canvas"
        >
          <ImageDown size={18} />
        </motion.button>

        </div>
      </div>

      {/* Canvas Container with Guide Overlay */}
      <div className="relative" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
        {/* Fabric Canvas */}
        <canvas
          ref={canvasElRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute top-0 left-0 z-[1] border border-gray-300 rounded"
        />

        {/* Guide Overlay Image */}
        {showGuideOverlay && (
          <img
            src={getGuideImagePath(designRequest?.tshirt_type)}
            alt="Guide Overlay"
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-[2] rounded"
          />
        )}
      </div>


      {/* Floating container for details/tools */}
        {activeTab !== "none" && (
          <div className="absolute top-16 right-2 max-w-[100vw] sm:max-w-sm p-4 bg-white shadow-lg border border-gray-300 rounded-xl z-10 overflow-y-auto max-h-[80vh]">
            {activeTab === "details" && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Design Details</h3>
                <DesignDetails designId={designId} />
              </div>
            )}

            {activeTab === "tools" && (
              <div className="w-full">
                <CanvasSettings canvas={canvas} />
              </div>
            )}
          </div>
        )}
        {billingDoc && isDesignerBillOpen && (
          <DesignerBillModal
            designId={designId} // pass the designId

            onClose={() => setIsDesignerBillOpen(false)}
          />
        )}
        {showComments && previewDoc?._id && (
        <CommentsModal
          previewId={previewDoc._id}
          onClose={() => setShowComments(false)}
          onSelectImage={async (url) => {
            if (canvas) {
              await addImageFromUrl(canvas, url);
              setShowComments(false);
            }
          }}
        />
      )}


        {showReferences && requestId && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Design References</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <ReferencesGallery
                requestId={requestId}
                onSelectImage={async (url) => {
                  if (canvas) {
                    await addImageFromUrl(canvas, url);
                    setShowReferences(false);
                    setActiveTab("none");
                  }
                }}
              />
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReferences(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSketch && requestId && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-4">
                <h2 className="text-lg font-semibold mb-3">Request Sketch</h2>
                <CanvasSketch requestId={requestId} />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowSketch(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAddOns && addOns && (
          <DesignerAddOnsModal
            designId={designId}
            addOns={addOns}
            onClose={() => setShowAddOns(false)}
            onSelectImage={async (url: string) => {
              if (canvas) {
                await addImageFromUrl(canvas, url); // Add image to Fabric canvas
                setShowAddOns(false); // Close modal after adding
                setActiveTab("none"); // Optional: hide floating panels
              }
            }}
          />
        )}



        

    </div>
  );
};

export default FabricCanvas;
