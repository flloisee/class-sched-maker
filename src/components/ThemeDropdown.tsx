import { useState, useRef, useEffect, useCallback } from "react";
import "./ThemeDropdown.css";

export const THEMES = {
  default: { light: "default-light", dark: "default-dark" },
  ayu: { light: "ayu-light", dark: "ayu-dark" },
  github: { light: "github-light", dark: "github-dark" },
  dracula: { light: "dracula-light", dark: "dracula-dark" },
  catppuccin: { light: "catppuccin-latte", dark: "catppuccin-mocha" },
  nord: { light: "nord-light", dark: "nord-dark" },
  solarized: { light: "solarized-light", dark: "solarized-dark" },
  one: { light: "one-light", dark: "one-dark" },
  tokyo: { light: "tokyo-light", dark: "tokyo-night" },
  gruvbox: { light: "gruvbox-light", dark: "gruvbox-dark" },
  rosepine: { light: "rose-pine-dawn", dark: "rose-pine" },
  monokai: { light: "monokai-light", dark: "monokai-dark" },
  everforest: { light: "everforest-light", dark: "everforest-dark" },
  nightowl: { light: "light-owl", dark: "night-owl" },
  material: { light: "material-lighter", dark: "material-palenight" },
} as const;

export type ThemeFamily = keyof typeof THEMES;
export type ThemeMode = keyof typeof THEMES["default"];

export const THEME_DISPLAY: Record<ThemeFamily, string> = {
  default: "Default",
  ayu: "Ayu",
  github: "GitHub",
  dracula: "Dracula",
  catppuccin: "Catppuccin",
  nord: "Nord",
  solarized: "Solarized",
  one: "Atom One",
  tokyo: "Tokyo Night",
  gruvbox: "Gruvbox",
  rosepine: "Rosé Pine",
  monokai: "Monokai",
  everforest: "Everforest",
  nightowl: "Night Owl",
  material: "Material",
};

interface Props {
  themeFamily: ThemeFamily;
  themeMode: ThemeMode;
  onThemeChange: (family: ThemeFamily, mode: ThemeMode) => void;
}

export default function ThemeDropdown({ themeFamily, themeMode, onThemeChange }: Props) {
  const [open, setOpen] = useState(false);
  const [previewFamily, setPreviewFamily] = useState<ThemeFamily | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const activeFamily = previewFamily ?? themeFamily;

  const availableFamilies = (Object.keys(THEMES) as ThemeFamily[]).filter(
    (f) => themeMode in THEMES[f]
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, close]);

  function select(f: ThemeFamily) {
    onThemeChange(f, themeMode);
    close();
  }

  return (
    <div className="theme-dd" ref={ref}>
      <button
        type="button"
        className="theme-dd-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="theme-dd-label">{THEME_DISPLAY[themeFamily]}</span>
        <svg className="theme-dd-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <ul className="theme-dd-menu" role="listbox" aria-label="Select theme">
          {availableFamilies.map((f) => (
            <li
              key={f}
              role="option"
              aria-selected={f === activeFamily}
              className={`theme-dd-option${f === activeFamily ? " selected" : ""}`}
              onClick={() => select(f)}
              onMouseEnter={() => {
                setPreviewFamily(f);
                document.documentElement.dataset.theme = THEMES[f][themeMode] ?? "";
              }}
              onMouseLeave={() => {
                setPreviewFamily(null);
                document.documentElement.dataset.theme = THEMES[themeFamily][themeMode] ?? "";
              }}
            >
              <span>{THEME_DISPLAY[f]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
