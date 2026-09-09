import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names (clsx) and then resolve conflicting
 * Tailwind utility classes (tailwind-merge) so later classes win, e.g.
 * cn("px-4", condition && "px-6") -> "px-6".
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** True when the visitor's OS/browser has asked for reduced motion. */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True when WebGL is actually available in this browser/context. */
export function supportsWebGL() {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
