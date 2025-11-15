/**
 * Predefined color palette for user cursors and pointers
 * Using vibrant, distinct colors that work well on light backgrounds
 */
const USER_COLOR_PALETTE = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Coral
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
  "#E76F51", // Burnt Orange
  "#8338EC", // Violet
] as const;

/**
 * Get a random color from the predefined palette
 * @returns A hex color string
 */
export function getRandomUserColor(): string {
  const randomIndex = Math.floor(Math.random() * USER_COLOR_PALETTE.length);
  return USER_COLOR_PALETTE[randomIndex]!;
}

/**
 * Get a specific color from the palette by index
 * Useful for deterministic color assignment
 */
export function getUserColorByIndex(index: number): string {
  return USER_COLOR_PALETTE[index % USER_COLOR_PALETTE.length]!;
}
