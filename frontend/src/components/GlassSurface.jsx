import { useEffect, useRef, useState } from "react";

import "../lib/liquid-glass/glass.css";
import { cn, prefersReducedMotion, supportsWebGL } from "../lib/utils";

/**
 * A frosted "liquid glass" panel (built on the vendored liquid-glass-js
 * WebGL effect in ../lib/liquid-glass) with real content rendered on top.
 *
 * Falls back to a plain CSS `backdrop-blur` glass look - which reads
 * essentially the same to a caregiver at a glance - whenever the visitor
 * has asked for reduced motion, WebGL isn't available, or the effect fails
 * to initialize for any reason. Meant for a handful of signature surfaces
 * (a login card, a dashboard header), not for every panel in the app: each
 * instance holds its own WebGL context and render loop, and those aren't
 * free.
 */
export default function GlassSurface({
  as: Tag = "div",
  type = "rounded", // 'rounded' | 'circle' | 'pill'
  radius = 28,
  tintOpacity = 0.22,
  className,
  fallbackClassName,
  children,
  ...props
}) {
  const glassHostRef = useRef(null);
  const [canTryWebGL, setCanTryWebGL] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setCanTryWebGL(!prefersReducedMotion() && supportsWebGL());
  }, []);

  useEffect(() => {
    if (!canTryWebGL || !glassHostRef.current) {
      return undefined;
    }

    let cancelled = false;
    let instance = null;

    import("../lib/liquid-glass/container.js")
      .then(({ Container }) => {
        if (cancelled || !glassHostRef.current) {
          return;
        }
        instance = new Container({ type, borderRadius: radius, tintOpacity });
        instance.element.style.width = "100%";
        instance.element.style.height = "100%";
        glassHostRef.current.appendChild(instance.element);
        setActive(true);
      })
      .catch((error) => {
        console.warn("GlassSurface: falling back to CSS glass.", error);
      });

    return () => {
      cancelled = true;
      if (instance) {
        instance.destroy();
      }
      setActive(false);
    };
  }, [canTryWebGL, type, radius, tintOpacity]);

  return (
    <Tag
      className={cn("relative isolate overflow-hidden", className)}
      style={{ borderRadius: radius }}
      {...props}
    >
      {!active && (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-10 bg-white/35 backdrop-blur-xl border border-white/40",
            fallbackClassName
          )}
        />
      )}
      <div ref={glassHostRef} aria-hidden="true" className="absolute inset-0 -z-10" />
      <div className="relative z-10">{children}</div>
    </Tag>
  );
}
