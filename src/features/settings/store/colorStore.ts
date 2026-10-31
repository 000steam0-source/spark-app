import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * User colour overrides. `null` means "use the theme default" (light/dark aware).
 * Applied as inline CSS custom properties on <html>, which beat the stylesheet defaults.
 */
export interface SparkColors {
  accent: string | null;
  accent2: string | null;
  background: string | null;
  panel: string | null;
  text: string | null;
}

export type SparkColorKey = keyof SparkColors;

export const EMPTY_COLORS: SparkColors = {
  accent: null,
  accent2: null,
  background: null,
  panel: null,
  text: null,
};

export interface ColorPreset {
  id: string;
  name: string;
  colors: SparkColors;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "default", name: "Default", colors: EMPTY_COLORS },
  {
    id: "graphite",
    name: "Graphite",
    colors: { accent: "#e6e6ea", accent2: null, background: "#0e0e10", panel: "#1a1a1e", text: "#f2f2f4" },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: { accent: "#38bdf8", accent2: "#2563eb", background: "#07111d", panel: "#0f1d2e", text: "#e8f3ff" },
  },
  {
    id: "forest",
    name: "Forest",
    colors: { accent: "#4ade80", accent2: "#14b8a6", background: "#08120d", panel: "#122018", text: "#e9f7ee" },
  },
  {
    id: "rose",
    name: "Rose",
    colors: { accent: "#fb7185", accent2: "#f472b6", background: "#140a0e", panel: "#22131a", text: "#fdeef2" },
  },
  {
    id: "crimson",
    name: "Crimson",
    colors: { accent: "#ef4444", accent2: null, background: "#0d0a0a", panel: "#1c1414", text: "#f7eded" },
  },
  {
    id: "paper",
    name: "Paper",
    colors: { accent: "#1f1f24", accent2: null, background: "#f4f2ee", panel: "#e8e5df", text: "#1b1b1f" },
  },
];

interface ColorState {
  colors: SparkColors;
  setColor: (key: SparkColorKey, value: string | null) => void;
  applyPreset: (colors: SparkColors) => void;
  resetColors: () => void;
}

export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      colors: EMPTY_COLORS,
      setColor: (key, value) =>
        set((s) => ({ colors: { ...s.colors, [key]: value } })),
      applyPreset: (colors) => set({ colors: { ...EMPTY_COLORS, ...colors } }),
      resetColors: () => set({ colors: EMPTY_COLORS }),
    }),
    {
      name: "spark_colors_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ colors: s.colors }),
    },
  ),
);

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** readable text colour to put on top of `hex` */
export function onColor(hex: string): string {
  return luminance(hex) > 0.42 ? "#0b0b11" : "#ffffff";
}

const MANAGED_PROPS = [
  "--u-accent",
  "--u-accent2",
  "--u-accent-mid",
  "--u-on",
  "--bg-canvas",
  "--bg-surface",
  "--bg-primary",
  "--bg-overlay",
  "--bg-elevated",
  "--bg-panel",
  "--bg-glass",
  "--bg-toolbox",
  "--bg-toolbox-active",
  "--border-primary",
  "--border-secondary",
  "--text-primary",
  "--text-secondary",
  "--text-tertiary",
  "--btn-primary-bg",
  "--btn-primary-text",
];

export function applyColors(colors: SparkColors, root: HTMLElement = document.documentElement) {
  for (const p of MANAGED_PROPS) root.style.removeProperty(p);
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  const { accent, background, panel, text } = colors;
  const accent2 = colors.accent2 || accent;

  if (accent) {
    set("--u-accent", accent);
    set("--u-accent2", accent2!);
    set("--u-accent-mid", `color-mix(in srgb, ${accent} 50%, ${accent2})`);
    set("--u-on", onColor(accent));
    set("--btn-primary-bg", accent);
    set("--btn-primary-text", onColor(accent));
  }

  if (text) {
    set("--text-primary", text);
    set("--text-secondary", `color-mix(in srgb, ${text} 68%, transparent)`);
    set("--text-tertiary", `color-mix(in srgb, ${text} 44%, transparent)`);
  }

  const ink = text || "var(--text-primary)";
  if (background) {
    set("--bg-canvas", `color-mix(in srgb, ${background} 82%, #000)`);
    set("--bg-surface", background);
    set("--bg-primary", background);
    set("--bg-overlay", `color-mix(in srgb, ${background} 96%, transparent)`);
    set("--border-primary", `color-mix(in srgb, ${background} 88%, ${ink})`);
    set("--border-secondary", `color-mix(in srgb, ${background} 84%, ${ink})`);
    if (!panel) {
      set("--bg-elevated", `color-mix(in srgb, ${background} 94%, ${ink})`);
      set("--bg-panel", `color-mix(in srgb, ${background} 91%, ${ink})`);
    }
  }

  if (panel) {
    set("--bg-elevated", panel);
    set("--bg-panel", `color-mix(in srgb, ${panel} 92%, ${ink})`);
    set("--bg-glass", `color-mix(in srgb, ${panel} 72%, transparent)`);
    set("--bg-toolbox", `color-mix(in srgb, ${ink} 6%, transparent)`);
    set("--bg-toolbox-active", `color-mix(in srgb, ${ink} 11%, transparent)`);
  }
}

/** keeps <html> in sync with the saved colours */
export function useColorSync() {
  const colors = useColorStore((s) => s.colors);
  useEffect(() => {
    applyColors(colors);
  }, [colors]);
}
