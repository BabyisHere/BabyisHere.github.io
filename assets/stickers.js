// Arcade stickers: each rotating line gets a set of icons matching its topic. First matching rule wins.
const CIGAR = '<svg viewBox="0 0 64 22" aria-hidden="true"><path d="M10 13c-4-3 0-6-3-9" fill="none" stroke="#C9CBD1" stroke-width="2" stroke-linecap="round"/><rect x="6" y="12" width="9" height="8" rx="2" fill="#B9B4AA"/><rect x="14" y="12" width="46" height="8" rx="4" fill="#7A4A26"/><rect x="40" y="12" width="7" height="8" fill="#FFC933"/><circle cx="14" cy="16" r="2" fill="#FF4B2B"/></svg>';
const PERFUME = '<svg viewBox="0 0 40 52" aria-hidden="true"><rect x="16" y="2" width="8" height="8" rx="2" fill="#FFC933"/><rect x="18" y="10" width="4" height="6" fill="#C9A13B"/><rect x="6" y="16" width="28" height="32" rx="8" fill="#F7B6C8" stroke="#14161A" stroke-width="2.5"/><rect x="11" y="24" width="18" height="12" rx="3" fill="#fff" opacity=".85"/><path d="M28 5c3-2 6-2 8 0" fill="none" stroke="#4FD1B5" stroke-width="2" stroke-linecap="round"/></svg>';

const STICKERS = [
  [/perfume|smelling|scent|fragrance|bottle to the|top notes|both wrists|what are you wearing/i, [PERFUME, '✨', '🌸', PERFUME]],
  [/cigar/i, [CIGAR, '💨', '🔥']],
  [/miniature|bottles are so small|smallest bar|too small|tiny bottle/i, ['🍾', '🥃', '🍸', '🥂']],
  [/bracelet|band|wrist/i, ['📿', '⌚', '💎']],
  [/jacket/i, ['🧥', '❄️', '🔥']],
  [/nerf|foam|blaster|ambush/i, ['🔫', '🎯', '💥']],
  [/gta|vice city|heist/i, ['🎮', '🌴', '🚗', '💰']],
  [/ronaldo|siuuu|number 7|messi|bicycle kick/i, ['⚽', '🐐', '7️⃣', '🏆']],
  [/cricket|batting|test match|a six/i, ['🏏', '🏆', '🔥']],
  [/football|referee/i, ['⚽', '🥅', '📣']],
  [/game|voice chat|queue|rage-quit|play to win|playing to win/i, ['🎮', '🕹️', '🏆']],
  [/dubai|karak|skyline/i, ['🏙️', '☕', '🌇']],
  [/country|somewhere new|trip|window seat|passport|city|flight|airport/i, ['✈️', '🌍', '🧳']],
  [/baby talks back|talking back|video|episode|filming/i, ['🎙️', '🎬', '📱']],
  [/shawarma|biryani|burger|dessert|bite|table|food/i, ['🌯', '🍔', '🍛', '🍰']],
  [/handsome|best-looking|reflection|mirror|fairest|selfie|average|effort|compliment|photo|posing|humble/i, ['😎', '🪞', '👑', '✨']],
];
const stickersFor = line => (STICKERS.find(([re]) => re.test(line)) || [, ['✨', '🎟️', '😎']])[1];
