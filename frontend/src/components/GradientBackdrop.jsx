import { Component, Suspense, lazy, useEffect, useState } from "react";

import { cn, prefersReducedMotion, supportsWebGL } from "../lib/utils";

// @react-three/fiber + three is a meaningfully large dependency, so it's
// code-split and only ever downloaded on the pages that actually render an
// animated backdrop.
const ShaderScene = lazy(() => import("./ShaderScene"));

/** Static, no-JS gradient used whenever the animated one can't or shouldn't run. */
function StaticGradient({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_15%,#e9a679_0%,#bd5b34_45%,#7a3a22_100%)]",
        className
      )}
    />
  );
}

class GradientErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // The animated backdrop is decorative only — never let it take the page
    // down. Fall back to a plain CSS gradient instead.
    console.warn("GradientBackdrop: falling back to static gradient.", error);
  }

  render() {
    if (this.state.failed) {
      return <StaticGradient className={this.props.className} />;
    }
    return this.props.children;
  }
}

/**
 * Full-bleed, warm animated gradient background built on ShaderGradient /
 * react-three-fiber. Meant to sit behind hero-style content:
 *
 *   <div className="relative overflow-hidden rounded-3xl">
 *     <GradientBackdrop />
 *     <div className="relative z-10">...content...</div>
 *   </div>
 *
 * Automatically falls back to a static CSS gradient when the visitor has
 * asked for reduced motion, or when WebGL isn't available - the animation is
 * purely decorative, so there is nothing lost by not rendering it.
 */
export default function GradientBackdrop({ className, tone = "warm" }) {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    setCanAnimate(!prefersReducedMotion() && supportsWebGL());
  }, []);

  if (!canAnimate) {
    return <StaticGradient className={className} />;
  }

  return (
    <GradientErrorBoundary className={className}>
      <Suspense fallback={<StaticGradient className={className} />}>
        <ShaderScene className={className} tone={tone} />
      </Suspense>
    </GradientErrorBoundary>
  );
}
