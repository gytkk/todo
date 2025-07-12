/**
 * Converts hex color to rgba format with specified alpha
 * @param hex - Hex color string (e.g., '#3b82f6')
 * @param alpha - Alpha value between 0 and 1 (e.g., 0.1 for 10% opacity)
 * @returns rgba color string (e.g., 'rgba(59, 130, 246, 0.1)')
 */
export function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get category background color with light opacity for todo items
 * @param categoryColor - Category hex color
 * @param isCompleted - Whether the todo is completed
 * @returns rgba color string with appropriate opacity
 */
export function getCategoryBackgroundColor(categoryColor: string, isCompleted: boolean): string {
  const alpha = isCompleted ? 0.05 : 0.1; // Lighter for completed todos
  return hexToRgba(categoryColor, alpha);
}