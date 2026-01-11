type RGB = { r: number; g: number; b: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  const intValue = parseInt(value, 16);

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function mixHexColors(colorA: string, colorB: string, weight: number): string {
  const mix = clamp(weight, 0, 1);
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  const r = Math.round(a.r + (b.r - a.r) * mix);
  const g = Math.round(a.g + (b.g - a.g) * mix);
  const bVal = Math.round(a.b + (b.b - a.b) * mix);

  return rgbToHex({ r, g, b: bVal });
}
