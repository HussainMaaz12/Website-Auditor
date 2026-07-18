function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrast(l1, l2) {
  const L1 = Math.max(l1, l2);
  const L2 = Math.min(l1, l2);
  return (L1 + 0.05) / (L2 + 0.05);
}

function mix(fg, bg, alpha) {
  return [
    Math.round(fg[0] * alpha + bg[0] * (1 - alpha)),
    Math.round(fg[1] * alpha + bg[1] * (1 - alpha)),
    Math.round(fg[2] * alpha + bg[2] * (1 - alpha))
  ];
}

const bg = [26, 32, 44]; // #1a202c
const bgL = getLuminance(bg[0], bg[1], bg[2]);

// Subtitle: rgba(255, 255, 255, 0.8) on bg
const subtitleColor = mix([255, 255, 255], bg, 0.8);
const subtitleL = getLuminance(subtitleColor[0], subtitleColor[1], subtitleColor[2]);
console.log('Subtitle Contrast:', getContrast(subtitleL, bgL).toFixed(2));

// Input group bg: background is bg + rgba(255, 255, 255, 0.05)
const inputBg = mix([255, 255, 255], bg, 0.05);
const inputBgL = getLuminance(inputBg[0], inputBg[1], inputBg[2]);

// Placeholder: rgba(255, 255, 255, 0.5) on inputBg
const placeholderColor = mix([255, 255, 255], inputBg, 0.5);
const placeholderL = getLuminance(placeholderColor[0], placeholderColor[1], placeholderColor[2]);
console.log('Placeholder Contrast:', getContrast(placeholderL, inputBgL).toFixed(2));
