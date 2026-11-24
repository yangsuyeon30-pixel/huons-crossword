// 공용: Supabase 연결 + 머리/뇌 SVG 그리기
const SB_URL = 'https://aptvbydrycmfygdgqckk.supabase.co';
const SB_KEY = 'sb_publishable_MytsJtR1YYK2HHjk1dQ8Dg_ubPN-7tT';
const API = SB_URL + '/rest/v1/brain_entries';
const HEADERS = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };

// 슬라이드 속 5개 색 구역 (보라·하늘·연두·노랑·분홍) — 둥근 원을 겹친 구름 모양
const REGIONS = [
  { key: 'k1', name: '보라', fill: '#DDD3E8', ink: '#5B3F78', tx: [170, 156], w: 112, h: 80,
    circles: [[150, 150, 40], [192, 126, 38], [206, 166, 34], [164, 188, 28], [128, 180, 24]] },
  { key: 'k2', name: '하늘', fill: '#C6E4F3', ink: '#1F5E80', tx: [276, 104], w: 84, h: 56,
    circles: [[250, 98, 28], [282, 90, 30], [304, 116, 22], [270, 122, 24]] },
  { key: 'k3', name: '연두', fill: '#D9E2BC', ink: '#55662A', tx: [330, 206], w: 40, vertical: true,
    circles: [[329, 172, 20], [334, 206, 22], [328, 240, 19]] },
  { key: 'k4', name: '노랑', fill: '#F2E0A6', ink: '#7A5A12', tx: [132, 234], w: 58, h: 30,
    circles: [[118, 234, 19], [146, 236, 18]] },
  { key: 'k5', name: '분홍', fill: '#F5C0C3', ink: '#8A2E38', tx: [250, 252], w: 112, h: 66,
    circles: [[226, 238, 32], [266, 226, 30], [292, 254, 26], [254, 270, 30], [212, 266, 22], [288, 292, 22]] },
];

// 매끈한 옆모습 (왼쪽을 보는 얼굴)
const HEAD = 'M322 470 C316 424 322 388 340 348 C374 280 382 182 344 114 C306 48 214 30 156 62 '
  + 'C108 90 90 140 94 188 C96 208 86 226 70 250 C62 262 66 272 82 274 '
  + 'C84 280 86 286 87 290 C81 295 80 302 87 306 C82 311 83 318 89 322 '
  + 'C90 336 100 348 122 350 C142 354 152 380 150 470';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 구역 안에 들어갈 글자 (여러 줄, 크기 자동)
function regionText(r, lines, maxSize) {
  lines = lines.filter(Boolean);
  if (!lines.length) return '';
  const [x, y] = r.tx;
  if (r.vertical) {
    // 좁은 뒤통수 구역: 세로쓰기
    // 여러 키워드면 세로 줄을 나란히
    const cols = lines.slice(0, 1);
    const longest = Math.max(...cols.map(s => [...s].length));
    const size = Math.min(maxSize * 0.8, 100 / Math.max(1, longest), cols.length > 1 ? 15 : 20);
    let out = '';
    cols.forEach((s, ci) => {
      const chars = [...s];
      const cx = x + (ci - (cols.length - 1) / 2) * size * 1.05;
      chars.forEach((c, i) => {
        const yy = y + (i - (chars.length - 1) / 2) * size * 1.02;
        out += `<text x="${cx.toFixed(1)}" y="${yy.toFixed(1)}" fill="${r.ink}" font-size="${size.toFixed(1)}" font-weight="800" text-anchor="middle" dominant-baseline="central">${esc(c)}</text>`;
      });
    });
    return out;
  }
  const h = r.h;
  const per = Math.min(maxSize, h / lines.length);
  let out = '';
  lines.forEach((s, i) => {
    const len = [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 1 : 0.6), 0);
    const size = Math.max(7, Math.min(per * 0.95, r.w / Math.max(1, len)));
    const yy = y + (i - (lines.length - 1) / 2) * per;
    out += `<text x="${x}" y="${yy.toFixed(1)}" fill="${r.ink}" font-size="${size.toFixed(1)}" font-weight="800" text-anchor="middle" dominant-baseline="central">${esc(s)}</text>`;
  });
  return out;
}

// texts: { k1: ['키워드', ...] 또는 '키워드', ... }
let _gooN = 0;
function brainSVG(texts, opts = {}) {
  const gid = 'goo' + (++_gooN);
  const maxSize = opts.maxSize || 24;
  const active = opts.active;
  let g = '';
  REGIONS.forEach(r => {
    const sel = active === r.key;
    const circ = (color, grow) => r.circles.map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2] + grow}" fill="${color}"/>`).join('');
    // 원들을 부드럽게 녹여 붙인 구름 모양 (goo 필터)
    const blobs = (sel ? `<g filter="url(#${gid})">${circ(r.ink, 4)}</g>` : '') + `<g filter="url(#${gid})">${circ(r.fill, 0)}</g>`;
    let v = texts ? texts[r.key] : null;
    const lines = Array.isArray(v) ? v : (v ? [v] : []);
    g += `<g class="region" data-key="${r.key}" style="cursor:${opts.clickable ? 'pointer' : 'default'}">${blobs}${regionText(r, lines, maxSize)}</g>`;
  });
  return `<svg viewBox="30 20 360 460" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, sans-serif"><defs><filter id="${gid}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"/></filter></defs>${g}<path d="${HEAD}" fill="none" stroke="#2f3a45" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function sbFetch(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
