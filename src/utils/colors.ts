const LIGHT_PALETTE = [
  "#3B6EA5",
  "#C9583A",
  "#4A8C6F",
  "#D4874A",
  "#6B5EA5",
  "#B85C7A",
  "#4A9E9E",
  "#8A7A5A",
];

const DARK_PALETTE = [
  "#5A8DC4",
  "#C55436",
  "#73B598",
  "#B5682B",
  "#675AA1",
  "#A34765",
  "#61B5B5",
  "#A59575",
];

let index = 0;

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
    case g: h = ((b - r) / d + 2) * 60; break;
    case b: h = ((r - g) / d + 4) * 60; break;
  }
  return { h, s: s * 100, l: l * 100 };
}

function HSLToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lightnessInverse(hex: string): string {
  const { h, s, l } = hexToHSL(hex);
  return HSLToHex(h, s, 100 - l);
}

export function colorForTheme(hex: string, isDark: boolean): string {
  if (!isDark) return hex;
  const i = LIGHT_PALETTE.indexOf(hex);
  if (i !== -1) return DARK_PALETTE[i];
  return lightnessInverse(hex);
}

export function nextColor(): string {
  const c = LIGHT_PALETTE[index % LIGHT_PALETTE.length];
  index++;
  return c;
}

export function resetColorIndex(): void {
  index = 0;
}
