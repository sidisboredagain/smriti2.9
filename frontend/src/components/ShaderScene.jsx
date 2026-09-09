import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

import { cn } from "../lib/utils";

const TONES = {
  // Deep terracotta -> warm amber -> soft peach: matches the app's brand palette.
  warm: {
    color1: "#7a3a22",
    color2: "#bd5b34",
    color3: "#f3c98f",
  },
};

/**
 * Renders the actual WebGL gradient. Kept in its own module (rather than
 * inlined in GradientBackdrop) so the react-three-fiber/three bundle is only
 * ever fetched via the lazy() import in GradientBackdrop.
 */
export default function ShaderScene({ className, tone = "warm" }) {
  const colors = TONES[tone] || TONES.warm;

  return (
    <ShaderGradientCanvas
      className={cn("absolute inset-0", className)}
      style={{ pointerEvents: "none" }}
      pixelDensity={1}
      fov={45}
    >
      <ShaderGradient
        type="waterPlane"
        animate="on"
        control="props"
        uSpeed={0.12}
        uStrength={2.6}
        uDensity={1.3}
        uFrequency={5.5}
        uAmplitude={1.4}
        color1={colors.color1}
        color2={colors.color2}
        color3={colors.color3}
        lightType="3d"
        brightness={1.1}
        reflection={0.1}
        grain="off"
        cDistance={3.6}
        cAzimuthAngle={0}
        cPolarAngle={90}
        cameraZoom={1}
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={0}
        rotationY={0}
        rotationZ={50}
      />
    </ShaderGradientCanvas>
  );
}
