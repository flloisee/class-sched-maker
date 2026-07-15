const PALETTE = [
  "#3B6EA5",
  "#C9583A",
  "#4A8C6F",
  "#D4874A",
  "#6B5EA5",
  "#B85C7A",
  "#4A9E9E",
  "#8A7A5A",
];

let index = 0;

export function nextColor(): string {
  const c = PALETTE[index % PALETTE.length];
  index++;
  return c;
}

export function resetColorIndex(): void {
  index = 0;
}
