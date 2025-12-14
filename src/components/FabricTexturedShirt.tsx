import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import ThreeScreenshotHelper from "./ThreeScreenshotHelper";

interface Props {
  fabricCanvas?: HTMLCanvasElement;
  canvasModifiedKey: number;
  shirtType?: string;
  onScreenshotReady?: (fn: () => string) => void;
}

const shirtModels: Record<string, string> = {
  vneck: "/assets/formModels/vneck.glb",
  round_neck: "/assets/formModels/tshirt.glb",
  long_sleeve: "/assets/formModels/long_sleeve.glb",
  polo: "/assets/formModels/polo.glb",
  jersey: "/assets/formModels/jersey_uv.glb",
};

const shirtRotations: Record<string, [number, number, number]> = {
  vneck: [0, 0, 0],
  round_neck: [0, 0, 0],
  long_sleeve: [0, 0, 0],
  polo: [0, 0, 0],
  hoodie: [0, 0, 0],
  jersey: [0, 0, 0],
};

const shirtPositions: Record<string, [number, number, number]> = {
  vneck: [0, -1.2, 0],
  round_neck: [0, -1.2, 0],
  long_sleeve: [0, -1.2, 0],
  polo: [0, -1.2, 0],
  hoodie: [0, -1.2, 0],
  jersey: [0, -1.2, 0],
};

/**
 * Texture alignment config per shirt type
 * repeat.x / repeat.y = scale (smaller = zoom in)
 * offset.x / offset.y = shift of texture
 */
const shirtTextureAlignments: Record<
  string,
  { repeat: [number, number]; offset: [number, number] }
> = {
  vneck: { repeat: [0.6, 0.88], offset: [0.013, 0.012] },
  round_neck: { repeat: [0.6, 0.88], offset: [0.05, 0.03] },
  long_sleeve: { repeat: [0.99, 1.2], offset: [0.13, 0.17] },
  polo: { repeat: [0.9, 0.9], offset: [-0.08, 0.1] },
  jersey: { repeat: [0.5, 0.65], offset: [-0.23, 0.6] },
};

const FabricTexturedTShirt: React.FC<Props> = ({
  fabricCanvas,
  canvasModifiedKey,
  shirtType = "round_neck",
  onScreenshotReady,
}) => {
  const modelPath = shirtModels[shirtType] || shirtModels["round_neck"];
  const { scene: loadedScene } = useGLTF(modelPath);
  const scene = useMemo(() => loadedScene.clone(), [loadedScene]);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Flip the canvas horizontally for tshirt and jersey only, NOT for long_sleeve or polo
    const shouldFlip = !["long_sleeve", "polo","jersey","vneck"].includes(shirtType);
    const flippedCanvas = document.createElement("canvas");
    flippedCanvas.width = fabricCanvas.width;
    flippedCanvas.height = fabricCanvas.height;
    const ctx = flippedCanvas.getContext("2d");

    if (ctx) {
      if (shouldFlip) {
        ctx.translate(fabricCanvas.width, 0);
        ctx.scale(-1, 1);
      }

      if (shirtType === "vneck") {
        ctx.translate(0, fabricCanvas.height);
        ctx.scale(1, -1);
      }
      ctx.drawImage(fabricCanvas, 0, 0);
    }

    // Create texture
    const tex = new THREE.CanvasTexture(flippedCanvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.flipY = false;

    // 🎯 Apply per-shirt-type alignment
    const align = shirtTextureAlignments[shirtType] || shirtTextureAlignments["tshirt"];
    tex.center.set(0.5, 0.5);
    tex.repeat.set(...align.repeat);
    tex.offset.set(...align.offset);

    tex.anisotropy = 8;
    tex.needsUpdate = true;
   

    // Apply texture to all meshes
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        mat.map = tex;
        mat.needsUpdate = true;
        mat.transparent = false;
        mat.opacity = 1;
        mat.alphaTest = 0;
        mat.depthWrite = true;
        mat.depthTest = true;
      }
    });
  }, [scene, fabricCanvas, canvasModifiedKey, shirtType]);

  const rotation = shirtRotations[shirtType] || [0, 0, 0];
  const position = shirtPositions[shirtType] || [0, -1.2, 0];

  return (
    <>
      <primitive object={scene} rotation={rotation} position={position} />
      <ThreeScreenshotHelper onReady={onScreenshotReady ?? (() => {})} />
    </>
  );
};

export default FabricTexturedTShirt;
