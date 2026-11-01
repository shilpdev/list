#!/usr/bin/env node
// Convert hex colors (with optional alpha) to oklch or hsl.
//
// Single:  node convert-colors.js <oklch|hsl> <#rrggbb|#rrggbbaa>
//          → prints the converted value
// Batch:   node convert-colors.js <oklch|hsl> --batch <file.json>
//          file.json: {"name": "#rrggbb[aa]", ...}
//          → prints {"name": "oklch(...)", ...}

function parseHex(hex) {
  const h = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(h)) {
    throw new Error(`Invalid hex color: ${hex} (expected #rrggbb or #rrggbbaa)`);
  }
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

function alphaSuffix(a) {
  if (a >= 1) return "";
  // Round to whole percent when close (Figma stores 10% as 0x1a = 10.2%)
  const pct = a * 100;
  const rounded = Math.round(pct);
  const shown = Math.abs(pct - rounded) < 0.5 ? rounded : pct.toFixed(1);
  return ` / ${shown}%`;
}

function toOklch({ r, g, b, a }) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  // Achromatic colors: hue is meaningless noise — emit 0 like shadcn's own themes.
  if (C < 0.0001) return `oklch(${L.toFixed(3)} 0 0${alphaSuffix(a)})`;
  // 4 decimals on L/C: 3 rounds saturated colors by up to ±2/255 per channel.
  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${H.toFixed(3)}${alphaSuffix(a)})`;
}

function toHsl({ r, g, b, a }) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%${alphaSuffix(a)})`;
}

const [, , format, arg1, arg2] = process.argv;
const convert = format === "oklch" ? toOklch : format === "hsl" ? toHsl : null;
if (!convert || !arg1) {
  console.error("Usage: node convert-colors.js <oklch|hsl> <#rrggbb[aa]>");
  console.error("       node convert-colors.js <oklch|hsl> --batch <file.json>");
  process.exit(1);
}

try {
  if (arg1 === "--batch") {
    const input = JSON.parse(require("fs").readFileSync(arg2, "utf8"));
    const out = {};
    for (const [name, hex] of Object.entries(input)) out[name] = convert(parseHex(hex));
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(convert(parseHex(arg1)));
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
