/**
 * Inline SVG images — no CDN, no CORS, always works!
 * Professional product illustrations with icons.
 */

interface ColorScheme { bg: string; accent: string; text: string }

const BRAND_COLORS: Record<string, ColorScheme> = {
  samsung:  { bg: '#1428A0', accent: '#1a34c0', text: '#ffffff' },
  apple:    { bg: '#1d1d1f', accent: '#2d2d2f', text: '#ffffff' },
  xiaomi:   { bg: '#FF6900', accent: '#e55a00', text: '#ffffff' },
  infinix:  { bg: '#0a7c3e', accent: '#0d9448', text: '#ffffff' },
  hp:       { bg: '#0096D6', accent: '#007ab8', text: '#ffffff' },
  dell:     { bg: '#007DB8', accent: '#0069a0', text: '#ffffff' },
  lenovo:   { bg: '#E2231A', accent: '#c41c13', text: '#ffffff' },
  haier:    { bg: '#003087', accent: '#004ab3', text: '#ffffff' },
  dawlance: { bg: '#00529B', accent: '#006dc8', text: '#ffffff' },
  honda:    { bg: '#CC0000', accent: '#aa0000', text: '#ffffff' },
  default:  { bg: '#2346A0', accent: '#17307A', text: '#ffffff' },
};

const CAT_CONFIG: Record<string, { emoji: string; label: string; bg: string }> = {
  mobiles:           { emoji: '📱', label: 'Mobiles',          bg: '#1428A0' },
  laptops:           { emoji: '💻', label: 'Laptops',          bg: '#1a1a2e' },
  leds:              { emoji: '📺', label: 'LED TVs',          bg: '#0f3460' },
  refrigerators:     { emoji: '🧊', label: 'Refrigerators',    bg: '#164e63' },
  acs:               { emoji: '❄️', label: 'Air Conditioners', bg: '#0369a1' },
  'washing-machines':{ emoji: '🫧', label: 'Washing Machines', bg: '#1e40af' },
  microwaves:        { emoji: '♨️', label: 'Microwaves',       bg: '#92400e' },
  bikes:             { emoji: '🏍️', label: 'Bikes',            bg: '#991b1b' },
};

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function getProductSvg(name: string, brandSlug: string, catSlug: string): string {
  const c = BRAND_COLORS[brandSlug] ?? BRAND_COLORS['default'];
  const cat = CAT_CONFIG[catSlug];
  const icon = cat?.emoji ?? '📦';
  const words = name.split(' ');
  const line1 = words.slice(0, 3).join(' ');
  const line2 = words.slice(3, 6).join(' ');
  const brand = brandSlug.charAt(0).toUpperCase() + brandSlug.slice(1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${c.bg}"/>
  <rect x="0" y="0" width="400" height="8" fill="${c.accent}"/>
  <rect x="0" y="392" width="400" height="8" fill="${c.accent}"/>
  <text x="200" y="145" font-size="90" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <text x="200" y="222" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="bold" text-anchor="middle" fill="${c.text}" dominant-baseline="middle">${esc(line1)}</text>
  ${line2 ? `<text x="200" y="256" font-family="Arial,Helvetica,sans-serif" font-size="20" text-anchor="middle" fill="${c.text}cc" dominant-baseline="middle">${esc(line2)}</text>` : ''}
  <rect x="140" y="290" width="120" height="2" fill="${c.text}33"/>
  <text x="200" y="320" font-family="Arial,Helvetica,sans-serif" font-size="14" text-anchor="middle" fill="${c.text}99" letter-spacing="3">${esc(brand.toUpperCase())}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function getCategorySvg(name: string, slug: string): string {
  const cfg = CAT_CONFIG[slug] ?? { emoji: '🛍️', label: name, bg: '#2346A0' };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${cfg.bg}" rx="16"/>
  <rect x="0" y="0" width="200" height="4" fill="rgba(255,255,255,0.3)" rx="2"/>
  <text x="100" y="90" font-size="72" text-anchor="middle" dominant-baseline="middle">${cfg.emoji}</text>
  <text x="100" y="152" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="bold" text-anchor="middle" fill="white">${esc(cfg.label)}</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
