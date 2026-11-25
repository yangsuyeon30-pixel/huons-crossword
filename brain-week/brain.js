// 공용: Supabase 연결 + 머리/뇌 SVG 그리기
const SB_URL = 'https://aptvbydrycmfygdgqckk.supabase.co';
const SB_KEY = 'sb_publishable_MytsJtR1YYK2HHjk1dQ8Dg_ubPN-7tT';
const API = SB_URL + '/rest/v1/brain_entries';
const HEADERS = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };

// 슬라이드 그림을 따라 그린 좌표 (viewBox 0~960 x 0~1040)
const S = 2.5; // 글자 크기 배율
const REGIONS = [
  { key: 'k1', name: '보라', fill: '#DDD3E8', ink: '#5B3F78', tx: [395, 275], w: 270, h: 190,
    pts: [[215, 200], [300, 150], [390, 140], [440, 180], [480, 235], [530, 258], [585, 272], [598, 330], [560, 385],
      [490, 398], [420, 392], [360, 372], [290, 368], [225, 378], [200, 320], [202, 255]] },
  { key: 'k2', name: '하늘', fill: '#C6E4F3', ink: '#1F5E80', tx: [610, 190], w: 220, h: 130,
    pts: [[430, 118], [520, 92], [630, 98], [720, 130], [775, 185], [772, 245], [725, 292], [660, 312], [610, 298],
      [585, 255], [525, 242], [478, 215], [440, 165]] },
  { key: 'k3', name: '연두', fill: '#D9E2BC', ink: '#55662A', tx: [776, 365], w: 66, h: 130,
    pts: [[700, 305], [748, 285], [785, 240], [815, 270], [835, 340], [838, 410], [822, 468], [780, 448],
      [742, 430], [722, 385], [702, 345]] },
  { key: 'k4', name: '노랑', fill: '#F2E0A6', ink: '#7A5A12', tx: [274, 458], w: 122, h: 72,
    pts: [[200, 420], [262, 404], [330, 408], [348, 445], [332, 505], [282, 512], [232, 486], [202, 448]] },
  { key: 'k5', name: '분홍', fill: '#F5C0C3', ink: '#8A2E38', tx: [520, 495], w: 300, h: 140,
    pts: [[368, 450], [410, 425], [470, 422], [525, 405], [590, 385], [625, 350], [680, 348], [722, 372], [736, 420],
      [780, 448], [805, 515], [775, 570], [722, 588], [688, 620], [692, 712], [640, 708], [596, 668], [572, 612],
      [520, 588], [455, 584], [398, 572], [368, 528]] },
];

const HEAD_PTS = [[352, 1005], [355, 930], [352, 890], [330, 864], [280, 856], [210, 855], [162, 852], [138, 830],
  [140, 790], [152, 762], [136, 735], [124, 706], [138, 676], [150, 648], [132, 626], [95, 612], [70, 596],
  [72, 568], [100, 528], [130, 482], [146, 430], [152, 370], [158, 300], [178, 238], [212, 180], [262, 128],
  [330, 86], [420, 56], [520, 46], [640, 64], [722, 100], [792, 152], [838, 215], [870, 300], [880, 390],
  [872, 470], [852, 550], [818, 630], [785, 700], [762, 770], [758, 850], [770, 930], [790, 995]];

// 점들을 지나는 매끈한 곡선 (Catmull-Rom → Bezier)
function smooth(pts, closed) {
  const n = pts.length, P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + (closed ? 'Z' : '');
}
const HEAD = smooth(HEAD_PTS, false);
REGIONS.forEach(r => r.d = smooth(r.pts, true));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 글자 폭 (한글 1, 영문·숫자 0.6)
const textW = s => [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 1 : c === ' ' ? 0.35 : 0.6), 0);

// 한 줄 최대 폭(limit)에 맞춰 줄바꿈: 띄어쓰기 우선, 너무 긴 단어는 글자 단위로 자름
function wrap(s, limit) {
  const lines = [];
  let cur = '';
  const push = () => { if (cur.trim()) lines.push(cur.trim()); cur = ''; };
  s.split(/\s+/).filter(Boolean).forEach(word => {
    const cand = cur ? cur + ' ' + word : word;
    if (textW(cand) <= limit) { cur = cand; return; }
    push();
    if (textW(word) <= limit) { cur = word; return; }
    for (const ch of word) {
      if (textW(cur + ch) > limit) push();
      cur += ch;
    }
  });
  push();
  return lines;
}

// 구역 상자(w×h)에 다 들어가도록 줄 수와 글자 크기를 자동으로 고름
function fitText(s, w, h, maxSize) {
  let best = { lines: [s], size: 0 };
  const total = Math.ceil(textW(s));
  for (let limit = Math.max(1, total); limit >= 1; limit--) {
    const lines = wrap(s, limit);
    const widest = Math.max(...lines.map(textW));
    const size = Math.min(maxSize, w / widest, h / (lines.length * 1.12));
    // 줄을 늘리는 건 글씨가 충분히(15%↑) 커질 때만 → '다이어/트' 같은 어색한 줄바꿈 방지
    if (size > best.size * 1.15) best = { lines, size };
  }
  return best;
}

// 구역 안에 들어갈 글자 (길면 자동 줄바꿈 + 작은 글씨)
function regionText(r, items, maxSize) {
  items = items.map(t => String(t).trim()).filter(Boolean);
  if (!items.length) return '';
  const [x, y] = r.tx;
  // 키워드 여러 개(관리자 모아보기)는 높이를 나눠 각각 맞춤
  const slot = r.h / items.length;
  const blocks = items.map(t => fitText(t, r.w, slot, maxSize));
  const lines = [];
  blocks.forEach(b => b.lines.forEach(l => lines.push({ t: l, size: b.size })));
  const lh = l => l.size * 1.12;
  const totalH = lines.reduce((a, l) => a + lh(l), 0);
  let yy = y - totalH / 2;
  let out = '';
  lines.forEach(l => {
    yy += lh(l) / 2;
    out += `<text x="${x}" y="${yy.toFixed(1)}" fill="${r.ink}" font-size="${l.size.toFixed(1)}" font-weight="800" text-anchor="middle" dominant-baseline="central">${esc(l.t)}</text>`;
    yy += lh(l) / 2;
  });
  return out;
}

// texts: { k1: ['키워드', ...] 또는 '키워드', ... }
function brainSVG(texts, opts = {}) {
  const maxSize = (opts.maxSize || 24) * S;
  const active = opts.active;
  let g = '';
  REGIONS.forEach(r => {
    const sel = active === r.key;
    // 흰 테두리로 구역 사이 틈을 만들고, 선택된 구역은 진한 테두리
    const shape = `<path d="${r.d}" fill="${r.fill}" stroke="${sel ? r.ink : '#fff'}" stroke-width="${sel ? 10 : 16}" stroke-linejoin="round" paint-order="stroke"/>`;
    let v = texts ? texts[r.key] : null;
    const lines = Array.isArray(v) ? v : (v ? [v] : []);
    g += `<g class="region" data-key="${r.key}" style="cursor:${opts.clickable ? 'pointer' : 'default'}">${shape}${regionText(r, lines, maxSize)}</g>`;
  });
  return `<svg viewBox="40 20 870 1000" xmlns="http://www.w3.org/2000/svg" font-family="Pretendard, sans-serif">${g}<path d="${HEAD}" fill="none" stroke="#2f3a45" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function sbFetch(path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
