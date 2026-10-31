import { SettingBlock } from "../controls";
import {
  COLOR_PRESETS,
  useColorStore,
  type SparkColorKey,
  type SparkColors,
} from "../../store/colorStore";

const FIELDS: { key: SparkColorKey; label: string; hint: string; fallback: string }[] = [
  { key: "accent", label: "Accent", hint: "Buttons, sliders, active items", fallback: "#f2f2f5" },
  { key: "accent2", label: "Accent 2", hint: "Second gradient colour (optional)", fallback: "#f2f2f5" },
  { key: "background", label: "Background", hint: "Window and page background", fallback: "#0b0b11" },
  { key: "panel", label: "Panels", hint: "Sidebar, cards, player bar", fallback: "#181822" },
  { key: "text", label: "Text", hint: "Main text colour", fallback: "#f6f6fb" },
];

function sameColors(a: SparkColors, b: SparkColors) {
  return (Object.keys(a) as SparkColorKey[]).every((k) => (a[k] || null) === (b[k] || null));
}

function PresetSwatch({ colors }: { colors: SparkColors }) {
  const bg = colors.background || "var(--bg-primary)";
  const panel = colors.panel || "var(--bg-elevated)";
  const a1 = colors.accent || "var(--text-primary)";
  const a2 = colors.accent2 || a1;
  return (
    <span
      className="relative block h-[44px] w-full overflow-hidden rounded-[12px] ring-1 ring-inset ring-border-alpha-14"
      style={{ background: bg }}
    >
      <span
        className="absolute bottom-[6px] left-[6px] top-[6px] w-[34%] rounded-[8px]"
        style={{ background: panel }}
      />
      <span
        className="absolute right-[8px] top-1/2 h-[14px] w-[38%] -translate-y-1/2 rounded-full"
        style={{ background: `linear-gradient(90deg, ${a1}, ${a2})` }}
      />
    </span>
  );
}

export function ColorsBlock({ searchQuery }: { searchQuery?: string }) {
  const colors = useColorStore((s) => s.colors);
  const setColor = useColorStore((s) => s.setColor);
  const applyPreset = useColorStore((s) => s.applyPreset);
  const resetColors = useColorStore((s) => s.resetColors);

  return (
    <SettingBlock
      title="Colors"
      description="Pick a preset or set every colour yourself. Changes apply instantly."
      searchQuery={searchQuery}
    >
      <div className="flex flex-col gap-[14px]">
        <div className="grid grid-cols-4 gap-[8px]">
          {COLOR_PRESETS.map((p) => {
            const active = sameColors(colors, p.colors);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.colors)}
                className={`flex cursor-pointer flex-col gap-[6px] rounded-[14px] border-0 bg-transparent p-[6px] text-left transition-colors ${
                  active ? "bg-bg-toolbox-active ring-1 ring-inset ring-text-tertiary" : "hover:bg-bg-toolbox"
                }`}
              >
                <PresetSwatch colors={p.colors} />
                <span className="px-[2px] text-[12px] font-[600] text-text-primary">{p.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-[4px] rounded-[14px] bg-bg-toolbox p-[6px]">
          {FIELDS.map((f) => {
            const value = colors[f.key];
            return (
              <div key={f.key} className="flex items-center gap-[12px] rounded-[10px] px-[8px] py-[6px]">
                <label className="relative h-[30px] w-[30px] shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-inset ring-border-alpha-33">
                  <span
                    className="absolute inset-0"
                    style={{
                      background: value || "transparent",
                      backgroundImage: value
                        ? undefined
                        : "repeating-conic-gradient(var(--border-white-alpha-33) 0 25%, transparent 0 50%)",
                      backgroundSize: value ? undefined : "10px 10px",
                    }}
                  />
                  <input
                    type="color"
                    value={value || f.fallback}
                    onChange={(e) => setColor(f.key, e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={f.label}
                  />
                </label>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-[600] text-text-primary">{f.label}</span>
                  <span className="truncate text-[11.5px] text-text-tertiary">{f.hint}</span>
                </div>
                <span className="font-mono text-[12px] uppercase text-text-secondary">
                  {value || "Auto"}
                </span>
                <button
                  type="button"
                  disabled={!value}
                  onClick={() => setColor(f.key, null)}
                  className="h-[28px] cursor-pointer rounded-[8px] border-0 bg-transparent px-[10px] text-[12px] font-[600] text-text-secondary hover:bg-bg-toolbox-active hover:text-text-primary disabled:cursor-default disabled:opacity-30"
                >
                  Reset
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetColors}
            className="h-[34px] cursor-pointer rounded-[10px] border-0 bg-bg-toolbox px-[14px] text-[12.5px] font-[600] text-text-primary hover:bg-bg-toolbox-active"
          >
            Reset all colours
          </button>
        </div>
      </div>
    </SettingBlock>
  );
}

export default ColorsBlock;
