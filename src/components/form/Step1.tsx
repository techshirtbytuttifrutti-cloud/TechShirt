import React from "react";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls } from "@react-three/drei";

function TShirtModel({ shirtType }: { shirtType: string }) {
  let modelPath = "/assets/tshirt.glb";
  if (shirtType === "Polo") modelPath = "/assets/polo.glb";
  else if (shirtType === "Long Sleeves") modelPath = "/assets/long_sleeve.glb";
  else if (shirtType === "Jersey") modelPath = "/assets/jersey_uv.glb";
  else if (shirtType === "V Neck") modelPath = "/assets/vneck.glb";

  const { scene } = useGLTF(modelPath);
  return <primitive object={scene} scale={1.2} />;
}

interface Step1Props {
  shirtType: string | null;
  setShirtType: (type: string) => void;
}

const shirtOptions = [
  { label: "Round Neck tshirt", value: "Round Neck" },
  { label: "V-neck", value: "V Neck" },
  { label: "Long Sleeves", value: "Long Sleeves" },
  { label: "Polo Shirt", value: "Polo" },
  { label: "Jersey", value: "Jersey" },
];

const Step1: React.FC<Step1Props> = ({ shirtType, setShirtType }) => {
  return (
    <div
      className="
        grid 
        grid-cols-1 
        md:grid-cols-2   /* desktop remains 2 columns */
        gap-6
      "
    >
      {/* 3D Preview */}
      <div
        className="
          flex items-center justify-center bg-gray-100 rounded-lg shadow-md 
          h-64 md:h-80     /* mobile shorter height */
          w-full
        "
      >
        {shirtType ? (
          <ThreeCanvas
            key={shirtType || "empty"}
            camera={{ position: [0, 1, 2.5], fov: 45 }}
            className="w-full h-full"
          >
            <color attach="background" args={["#F8F9FA"]} />
            <PresentationControls>
              <Stage>
                {shirtType && <TShirtModel shirtType={shirtType} />}
              </Stage>
            </PresentationControls>
          </ThreeCanvas>
        ) : (
          <p className="text-gray-500 text-center px-2">
            Select a shirt type to see the preview
          </p>
        )}
      </div>

      {/* Shirt Type Selector */}
      <div className="px-1 md:px-0">
        <h3 className="text-lg font-semibold text-gray-700">Select Shirt Type</h3>

        <div className="mt-4 space-y-3 text-gray-700">
          {shirtOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setShirtType(opt.value)}
              className={`
                w-full p-3 border rounded-lg transition duration-200
                text-sm md:text-base    /* slightly smaller mobile buttons */
                ${
                  shirtType === opt.value
                    ? "border-teal-500 bg-teal-100 text-teal-700 font-medium"
                    : "border-gray-300 hover:bg-gray-100"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step1;
