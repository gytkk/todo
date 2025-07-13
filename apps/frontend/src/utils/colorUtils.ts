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

/**
 * Converts hex color to HSL values
 * @param hex - Hex color string (e.g., '#3b82f6')
 * @returns HSL object with hue (0-360), saturation (0-100), lightness (0-100)
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Sorts colors by hue, saturation, and lightness for better visual organization
 * @param colors - Array of hex color strings
 * @returns Sorted array of colors
 */
export function sortColorsByHue(colors: string[]): string[] {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a);
    const hslB = hexToHsl(b);
    
    // Primary sort by hue (0-360)
    if (hslA.h !== hslB.h) {
      return hslA.h - hslB.h;
    }
    
    // Secondary sort by saturation (more vibrant first)
    if (hslA.s !== hslB.s) {
      return hslB.s - hslA.s;
    }
    
    // Tertiary sort by lightness (darker first)
    return hslA.l - hslB.l;
  });
}