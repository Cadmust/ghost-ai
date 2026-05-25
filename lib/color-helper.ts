const PALETTE = [
  '#00c8d4', // cyan (brand)
  '#a78bfa', // violet
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#fb923c', // orange
  '#60a5fa', // blue
  '#e879f9', // fuchsia
  '#2dd4bf', // teal
  '#f87171', // red
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash * 31 + chr) | 0;
  }
  return Math.abs(hash);
}

export function userIdToColor(userId: string): string {
  const index = hashCode(userId) % PALETTE.length;
  return PALETTE[index];
}

export const CURSOR_COLORS = PALETTE;