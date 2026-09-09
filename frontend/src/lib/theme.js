// Shared "favorite color" theming logic.
//
// This is used both on app load (App.jsx, applying the currently saved
// patient preference) and live while editing patient preferences
// (PatientProfile.jsx, previewing as the caregiver types). Keeping the
// logic in one place means both call sites always agree on what a given
// color name resolves to.

// Curated, hand-tuned themes for common color names. These take priority
// over the generic HSL-derived fallback below because they're tuned to
// look good together (soft backgrounds, borders, shadows) rather than
// mechanically generated.
const NAMED_THEMES = {
  blue: {
    primary: "#3f6f93",
    primaryDark: "#325a78",
    secondary: "#2f4a3d",
    soft: "#e9f0f6",
    softBorder: "#cfe0ea",
    softText: "#325a78",
    logoBg: "#dbe8f0",
    shadow: "rgba(63, 111, 147, 0.24)",
  },

  green: {
    primary: "#3f8f5e",
    primaryDark: "#32744c",
    secondary: "#2f4a3d",
    soft: "#e8f3ec",
    softBorder: "#cde6d7",
    softText: "#32744c",
    logoBg: "#d9ecdf",
    shadow: "rgba(63, 143, 94, 0.24)",
  },

  purple: {
    primary: "#7a5a8f",
    primaryDark: "#63477a",
    secondary: "#2f4a3d",
    soft: "#f1ebf5",
    softBorder: "#ddccea",
    softText: "#63477a",
    logoBg: "#e6dced",
    shadow: "rgba(122, 90, 143, 0.24)",
  },

  pink: {
    primary: "#b5605f",
    primaryDark: "#954b4a",
    secondary: "#2f4a3d",
    soft: "#f8e9e8",
    softBorder: "#ecd2d1",
    softText: "#954b4a",
    logoBg: "#f0dad9",
    shadow: "rgba(181, 96, 95, 0.24)",
  },

  orange: {
    primary: "#c17a2e",
    primaryDark: "#9c6224",
    secondary: "#2f4a3d",
    soft: "#faeedd",
    softBorder: "#eeddbc",
    softText: "#9c6224",
    logoBg: "#f4e2c4",
    shadow: "rgba(193, 122, 46, 0.26)",
  },

  yellow: {
    primary: "#a8873c",
    primaryDark: "#8d712f",
    secondary: "#2f4a3d",
    soft: "#f8f2df",
    softBorder: "#eadfbd",
    softText: "#8d712f",
    logoBg: "#f1e8c9",
    shadow: "rgba(168, 135, 60, 0.24)",
  },

  red: {
    primary: "#af4a34",
    primaryDark: "#8e3a28",
    secondary: "#2f4a3d",
    soft: "#f8e6e1",
    softBorder: "#eccec5",
    softText: "#8e3a28",
    logoBg: "#f1d8cf",
    shadow: "rgba(175, 74, 52, 0.26)",
  },

  teal: {
    primary: "#3f7a70",
    primaryDark: "#33625a",
    secondary: "#2f4a3d",
    soft: "#e7f2ef",
    softBorder: "#cde3dd",
    softText: "#33625a",
    logoBg: "#d9ece7",
    shadow: "rgba(63, 122, 112, 0.24)",
  },

  brown: {
    primary: "#826b58",
    primaryDark: "#6c5747",
    secondary: "#2f4a3d",
    soft: "#f4efe9",
    softBorder: "#e4dacf",
    softText: "#6c5747",
    logoBg: "#e9dfd3",
    shadow: "rgba(130, 107, 88, 0.24)",
  },
};

const DEFAULT_THEME_KEY = "green";

const CSS_VARIABLES = [
  ["primary", "--brand-primary"],
  ["primaryDark", "--brand-primary-dark"],
  ["secondary", "--brand-secondary"],
  ["soft", "--brand-soft"],
  ["softBorder", "--brand-soft-border"],
  ["softText", "--brand-soft-text"],
  ["logoBg", "--logo-bg"],
  ["shadow", "--shadow-button"],
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  const delta = max - min;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta) % 6;
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  const sNorm = clamp(s, 0, 100) / 100;
  const lNorm = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h >= 120 && h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  const toHex = (value) => {
    const channel = Math.round((value + m) * 255);
    return clamp(channel, 0, 255).toString(16).padStart(2, "0");
  };

  return `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`;
}

// Parses any string the browser's CSS engine understands as a color
// ("blue", "#3355ff", "rgb(10, 20, 30)", "cornflowerblue", etc.) by
// letting the browser itself normalize it, rather than hand-rolling a
// CSS color parser. Returns null if the input isn't a valid CSS color.
function parseCssColor(input) {
  if (typeof document === "undefined") {
    return null;
  }

  const probe = document.createElement("span");
  probe.style.color = "";
  probe.style.color = input;

  if (!probe.style.color) {
    return null;
  }

  // Reading the normalized value back out gives us an rgb()/rgba() string
  // regardless of what format was typed in, without ever attaching the
  // element to the document.
  const normalized = probe.style.color;
  const match = normalized.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/
  );

  if (!match) {
    return null;
  }

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
}

// Derives a full theme (matching the shape of NAMED_THEMES) from an
// arbitrary RGB color by adjusting lightness for the softer supporting
// colors. Used as a fallback for colors typed in that aren't one of the
// curated named keys above (e.g. "maroon", "#5588cc", "turquoise").
function deriveThemeFromRgb({ r, g, b }) {
  const { h, s } = rgbToHsl(r, g, b);

  // Keep saturation in a pleasant, readable range regardless of what was
  // typed, and derive every supporting color from the same hue.
  const saturation = clamp(s, 35, 65);

  const primary = hslToHex(h, saturation, 42);
  const primaryDark = hslToHex(h, saturation, 32);
  const soft = hslToHex(h, Math.min(saturation, 45), 94);
  const softBorder = hslToHex(h, Math.min(saturation, 45), 86);
  const logoBg = hslToHex(h, Math.min(saturation, 45), 88);

  return {
    primary,
    primaryDark,
    secondary: "#2f4a3d",
    soft,
    softBorder,
    softText: primaryDark,
    logoBg,
    shadow: `rgba(${r}, ${g}, ${b}, 0.24)`,
  };
}

// Resolves a raw "favorite color" string (as typed by a caregiver) into a
// full theme object. Curated names win when they match; anything else
// that's a valid CSS color gets a generated theme; anything unrecognized
// (empty, gibberish) falls back to the default theme.
export function resolveTheme(favoriteColorInput) {
  const normalized = String(favoriteColorInput || "")
    .trim()
    .toLowerCase();

  if (NAMED_THEMES[normalized]) {
    return NAMED_THEMES[normalized];
  }

  if (normalized) {
    const rgb = parseCssColor(normalized);

    if (rgb) {
      return deriveThemeFromRgb(rgb);
    }
  }

  return NAMED_THEMES[DEFAULT_THEME_KEY];
}

// Applies a "favorite color" input directly to the document's CSS custom
// properties, so the whole app re-themes immediately. Safe to call
// repeatedly (e.g. on every keystroke for a live preview).
export function applyPatientTheme(favoriteColorInput) {
  if (typeof document === "undefined") {
    return;
  }

  const theme = resolveTheme(favoriteColorInput);
  const root = document.documentElement;

  CSS_VARIABLES.forEach(([themeKey, cssVariable]) => {
    root.style.setProperty(cssVariable, theme[themeKey]);
  });
}
