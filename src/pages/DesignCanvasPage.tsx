import React, { useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import FabricCanvas from "../components/FabricCanvas";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { PresentationControls, Stage } from "@react-three/drei";
import FabricTexturedTShirt from "../components/FabricTexturedShirt";
import ThreeScreenshotHelper from "../components/ThreeScreenshotHelper";
import type { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


interface DesignRequest {
  _id: Id<"design_requests">;
  designId: Id<"design">;
  tshirt_type?: string;
  [key: string]: any;
}

type FabricCanvasRecord = {
  _id: Id<"fabric_canvases">;
  canvas_json?: string;
  design_id: Id<"design">;
  created_at: number;
  updated_at: number;
  version?: string;
  thumbnail?: string;
};

const DesignerCanvasPage: React.FC = () => {

  const location = useLocation();
  const request: DesignRequest | undefined = location.state?.request;

  const [fabricCanvas, setFabricCanvas] = useState<HTMLCanvasElement | undefined>(undefined);
  const [canvasModifiedKey, setCanvasModifiedKey] = useState(0);

  const handleCanvasModified = useCallback(() => {
    setCanvasModifiedKey((prev) => prev + 1);
  }, []);
   // Determine shirt type: prefer request.tshirt_type, fallback to 'tshirt'

  // Map shirt type names to model keys
  const normalizeShirtType = (type: string | undefined): string => {
    if (!type) return "tshirt";
    const normalized = type.toLowerCase().replace(/\s+/g, "_");
    const typeMap: Record<string, string> = {
      "round_neck": "round_neck",
      "round neck": "round_neck",
      "v-neck": "vneck",
      "vneck": "vneck",
      "v_neck": "vneck",
      "polo": "polo",
      "jersey": "jersey",
      "long_sleeves": "long_sleeve",
      "long sleeves": "long_sleeve",
    };
    return typeMap[normalized] || normalized;
  };

  const screenshotRef = useRef<() => string>(() => "");

  // Fetch the single canvas for this design
  const canvasDoc = useQuery(
    api.fabric_canvases.getByDesign,
    request?.designId ? { designId: request.designId } : "skip"
  ) as FabricCanvasRecord | undefined;

  const shirtType = normalizeShirtType(request?.tshirt_type);


  // Left panel content
  let canvasContent;
  if (!request) {
    canvasContent = <p className="text-gray-600">No design request provided</p>;
  } else if (!request.designId) {
    canvasContent = <p className="text-gray-500">No design available yet.</p>;
  } else if (!canvasDoc) {
    canvasContent = <p className="text-gray-400 text-center">Loading canvas...</p>;
  } else {
    canvasContent = (
      <FabricCanvas
        designId={request.designId}
        initialCanvasJson={canvasDoc?.canvas_json ?? undefined}
        onReady={setFabricCanvas}
        onModified={handleCanvasModified}
        getThreeScreenshot={() => screenshotRef.current()}
      />
    );
  }

return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
    className="relative p-4 flex flex-col md:flex-row gap-4 md:max-h-[80vh]"
  >
    {/* MOBILE SCROLL AREA FOR CANVAS */}
    <motion.div
      className="
        border border-gray-400 rounded-lg p-2 shadow-sm bg-white
        flex items-center justify-center

        w-full md:w-auto        /* full width on mobile */
        h-[150vw]              /* keep exact size */

        md:basis-4/7           /* desktop sizing */
        md:h-[43.6vw]

        overflow-x-auto md:overflow-visible  /* scroll only on mobile */
        scrollbar-thin scrollbar-thumb-gray-400
      "
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      {canvasContent}
    </motion.div>

    {/* 3D PREVIEW — BELOW CANVAS ON MOBILE */}
    <motion.div
      className="
        border border-gray-400 rounded-lg p-2 shadow-sm bg-white 
        
        w-full
        h-[60vw]            /* Mobile: give more height */
        
        md:basis-3/7        /* Desktop: side-by-side */
        md:h-[43.5vw]
      "
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <ThreeCanvas
        camera={{ position: [0, 1, 2.5], fov: 45 }}
        className="r3f-canvas w-full h-full rounded-lg"
      >
        <color attach="background" args={["#F8F9FA"]} />
        <PresentationControls>
          <Stage>
            <FabricTexturedTShirt
              fabricCanvas={fabricCanvas}
              canvasModifiedKey={canvasModifiedKey}
              shirtType={shirtType}
            />
          </Stage>
        </PresentationControls>

        <ThreeScreenshotHelper onReady={(fn) => (screenshotRef.current = fn)} />
      </ThreeCanvas>
    </motion.div>
  </motion.div>
);
};

export default DesignerCanvasPage;
