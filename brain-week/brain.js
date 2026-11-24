// 공용: Supabase 연결 + 머리/뇌 SVG 그리기
const SB_URL = 'https://aptvbydrycmfygdgqckk.supabase.co';
const SB_KEY = 'sb_publishable_MytsJtR1YYK2HHjk1dQ8Dg_ubPN-7tT';
const API = SB_URL + '/rest/v1/brain_entries';
const HEADERS = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };

// 슬라이드 속 5개 색 구역 (보라·하늘·연두·노랑·분홍)
const REGIONS = [
  { key: 'k1', name: '보라', fill: '#DDD3E8', ink: '#5B3F78', blobs: [[170, 152, 62, 56, 1.3]], tx: [170, 152], w: 108 },
  { key: 'k2', name: '하늘', fill: '#C6E4F3', ink: '#1F5E80', blobs: [[264, 106, 54, 38, 2.1]], tx: [264, 106], w: 92 },
  { key: 'k3', name: '연두', fill: '#D9E2BC', ink: '#55662A', blobs: [[330, 205, 24, 56, 0.4]], tx: [330, 205], w: 40, vertical: true },
  { key: 'k4', name: '노랑', fill: '#F2E0A6', ink: '#7A5A12', blobs: [[128, 225, 34, 20, 3.3]], tx: [128, 225], w: 58 },
  { key: 'k5', name: '분홍', fill: '#F5C0C3', ink: '#8A2E38', blobs: [[238, 252, 64, 40, 0.9], [294, 293, 32, 28, 2.6]], tx: [240, 252], w: 112 },
];

const HEAD = 'M330 470 C320 420 330 380 345 330 C370 262 378 170 332 100 C292 40 200 18 140 60 '
  + 'C96 90 80 140 82 190 C84 214 70 230 52 260 C45 272 55 280 70 282 C66 292 72 300 78 304 '
  + 'C70 312 74 322 84 326 C86 345 100 360 130 362 C150 364 160 380 158 470';

// 울퉁불퉁한 구름 모양 덩어리 경로
function blobPath(cx, cy, rx, ry, seed) {
  const n = 28, pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = 1 + 0.05 * Math.sin(t * 5 + seed) + 0.03 * Math.sin(t * 3 + seed * 2);
    pts.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

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
  const h = r.blobs[0][3] * 1.5;
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
function brainSVG(texts, opts = {}) {
  const maxSize = opts.maxSize || 24;
  const active = opts.active;
  let g = '';
  REGIONS.forEach(r => {
    const blobs = r.blobs.map(b => `<path d="${blobPath(b[0], b[1], b[2], b[3], b[4])}" fill="${r.fill}"${active === r.key ? ` stroke="${r.ink}" stroke-width="3"` : ''}/>`).join('');
    let v = texts ? texts[r.key] : null;
    const lines = Array.isArray(v) ? v : (v ? [v] : []);
    g += `<g class="region" data-key="${r.key}" style="cursor:${opts.clickable ? 'pointer' : 'default'}">${blobs}${regionText(r, lines, maxSize)}</g>`;
  });
  return `<svg viewBox="30 20 360 460" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, sans-serif">${g}<path d="${HEAD}" fill="none" stroke="#2f3a45" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function sbFetch(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
