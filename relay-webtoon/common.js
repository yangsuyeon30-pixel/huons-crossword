/* 릴레이 웹툰 이어쓰기 — 공통 모듈 (Supabase 연결, 설정, 구간 계산, 렌더링 헬퍼)
 *
 * 기존 office-webtoon 앱과 Supabase 프로젝트/테이블을 공유하며, 아래 관례로 데이터를 분리한다 (DDL 없음).
 *   webtoon_config  id=3 → 팀 수 / id=4 → 사용 컷 수 / id=5 → 초기화 횟수(참가자 화면의 초기화 감지 신호)
 *   webtoon_bubbles team_no=0 → 릴레이 공용 캔버스
 *   webtoon_teams   team_no=900+컷번호, submitted=true → 그 컷 완료(잠금)
 * 구간 나누기: P컷을 N팀이 연속 구간으로 최대한 균등하게 나눈다 (앞 팀부터 한 컷씩 더 받음).
 */

/* ---------- Supabase ---------- */
const SB_URL = 'https://rbvhohhuqaryzuahskfe.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJidmhvaGh1cWFyeXp1YWhza2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNTIxNDYsImV4cCI6MjEwNzkyODE0Nn0.oIMmJjotxIGYBWcOkuLe56xae4ATnHTvvb87Jq03Yzc';
const H = { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' };

async function api(path, init) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({ headers: H }, init || {}));
  if (!r.ok) throw new Error('요청 실패 (' + r.status + ') ' + await r.text().catch(() => ''));
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

function upsert(table, row) {
  return api(table, {
    method: 'POST',
    headers: Object.assign({}, H, { Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(row)
  });
}

/* ---------- 상수 ---------- */
const PANELS = [
  { img: 'img/panel-01.png', title: '1컷 · 아침 9시', cap: '햇살 가득한 사무실로 출근하는 두 사람' },
  { img: 'img/panel-02.png', title: '2컷 · 팀 회의', cap: '화이트보드 앞에서 발표하는 팀장' },
  { img: 'img/panel-03.png', title: '3컷 · 바쁜 오전', cap: '커피 한 잔의 여유와 서류 더미' },
  { img: 'img/panel-04.png', title: '4컷 · 점심시간', cap: '함께 먹는 점심, 웃음 가득' },
  { img: 'img/panel-05.png', title: '5컷 · 나른한 오후', cap: '책상에 엎드린 동료와 깨우는 손길' },
  { img: 'img/panel-06.png', title: '6컷 · 긴급 상황!', cap: '모니터 속 빨간 오류 화면' },
  { img: 'img/panel-07.png', title: '7컷 · 힘을 합쳐', cap: '머리를 맞댄 여섯 사람' },
  { img: 'img/panel-08.png', title: '8컷 · 야근하는 밤', cap: '창밖 도시 불빛과 따뜻한 조명' },
  { img: 'img/panel-09.png', title: '9컷 · 성공!', cap: '하이파이브와 흩날리는 색종이' },
  { img: 'img/panel-10.png', title: '10컷 · 퇴근길', cap: '함께 나서는 밤거리' },
  { img: 'img/panel-11.png', title: '11컷 · 퇴근 후 회식', cap: '치킨집에서 건배하는 동료들' },
  { img: 'img/panel-12.png', title: '12컷 · 웃음꽃', cap: '이야기꽃이 핀 회식 자리' },
  { img: 'img/panel-13.png', title: '13컷 · 집으로 가는 길', cap: '가로등 아래 함께 걷는 밤거리' },
  { img: 'img/panel-14.png', title: '14컷 · 하루 마무리', cap: '집에서 조용히 하루를 돌아보는 시간' },
  { img: 'img/panel-15.png', title: '15컷 · 다음날 아침', cap: '햇살과 함께 다시 시작하는 출근길' },
];
const BUBBLES_PER_PANEL = 2;
const BUBBLE_LABEL = ['말풍선 ①', '말풍선 ②'];
const RELAY_TEAM = 0;
const MARKER_BASE = 900;
const CONFIG_ID = 3;
const PANEL_CONFIG_ID = 4;
const RESET_CONFIG_ID = 5;
const DEFAULT_TEAMS = 8;
const MAX_TEAMS = 60;

/* ---------- 설정 ---------- */
async function readConfig(id) {
  const rows = await api('webtoon_config?select=team_count&id=eq.' + id);
  return rows && rows[0] ? rows[0].team_count : null;
}
function writeConfig(id, value) { return upsert('webtoon_config', { id: id, team_count: value }); }

async function getTeamCount() {
  try { const n = await readConfig(CONFIG_ID); return n > 0 ? n : DEFAULT_TEAMS; }
  catch (e) { return DEFAULT_TEAMS; }
}
async function getPanelCount() {
  try { const n = await readConfig(PANEL_CONFIG_ID); if (n > 0) return Math.min(n, PANELS.length); }
  catch (e) { /* 없으면 그림 총수 */ }
  return PANELS.length;
}
/* 읽기 실패 시 null → 호출하는 쪽은 이번 확인을 건너뛴다 */
async function getResetEpoch() {
  try { return (await readConfig(RESET_CONFIG_ID)) || 0; } catch (e) { return null; }
}
async function getSettings() {
  const r = await Promise.all([getTeamCount(), getPanelCount()]);
  return { n: r[0], pc: r[1] };
}

/* ---------- 구간 나누기 ---------- */
function chunkOwner(p, n, pc) {
  const base = Math.floor(pc / n), rem = pc % n, boundary = rem * (base + 1);
  return p < boundary ? Math.floor(p / (base + 1)) + 1 : rem + Math.floor((p - boundary) / base) + 1;
}
function teamChunk(team, n, pc) {
  const base = Math.floor(pc / n), rem = pc % n;
  const size = team <= rem ? base + 1 : base;
  if (size <= 0 || team < 1 || team > n) return null;
  const start = team <= rem ? (team - 1) * (base + 1) : rem * (base + 1) + (team - 1 - rem) * base;
  return { start: start, end: start + size - 1, size: size };
}
function chunkLabel(team, n, pc) {
  const c = teamChunk(team, n, pc);
  if (!c) return '맡은 구간 없음';
  return c.size === 1 ? (c.start + 1) + '컷' : (c.start + 1) + '~' + (c.end + 1) + '컷';
}
function inChunk(chunk, p) { return !!chunk && p >= chunk.start && p <= chunk.end; }

/* ---------- 릴레이 상태 ---------- */
async function getRelayState(n, pc) {
  const done = new Array(pc).fill(false);
  try {
    const markers = await api('webtoon_teams?select=team_no,submitted&team_no=gte.' + MARKER_BASE);
    markers.forEach(m => {
      const p = m.team_no - MARKER_BASE;
      if (p >= 0 && p < pc && m.submitted) done[p] = true;
    });
  } catch (e) { /* 못 읽으면 전부 미완료로 */ }
  const current = done.indexOf(false);
  const currentTeam = current === -1 ? null : chunkOwner(current, n, pc);
  return {
    n: n, pc: pc, done: done,
    currentPanel: current,
    complete: current === -1,
    currentTeam: currentTeam,
    currentChunk: currentTeam ? teamChunk(currentTeam, n, pc) : null,
    doneCount: done.filter(Boolean).length
  };
}
function stateSig(st) { return st.n + '|' + st.pc + '|' + st.done.map(Number).join('') + '|' + st.currentPanel; }

async function getRelayBubbles() {
  const map = {};
  try {
    const rows = await api('webtoon_bubbles?select=panel_idx,bubble_idx,text&team_no=eq.' + RELAY_TEAM);
    rows.forEach(r => { map[r.panel_idx + '_' + r.bubble_idx] = r.text || ''; });
  } catch (e) { /* 첫 작성 */ }
  return map;
}
function saveBubble(p, b, text) {
  return upsert('webtoon_bubbles', { team_no: RELAY_TEAM, panel_idx: p, bubble_idx: b, text: text });
}

/* 컷 완료 표시 / 해제 (start~end 포함) */
function range(start, end) { return Array.from({ length: end - start + 1 }, (_, i) => start + i); }
function markPanels(start, end) {
  return Promise.all(range(start, end).map(p => upsert('webtoon_teams', { team_no: MARKER_BASE + p, submitted: true })));
}
function unmarkPanels(start, end) {
  return Promise.all(range(start, end).map(p => api('webtoon_teams?team_no=eq.' + (MARKER_BASE + p), { method: 'DELETE' })));
}

/* 관리자가 초기화하면 onReset 호출 (열어둔 읽기 전용 화면 새로고침용) */
function watchReset(onReset, ms) {
  let epoch = null;
  setInterval(async () => {
    const ep = await getResetEpoch();
    if (ep === null) return;
    if (epoch !== null && ep !== epoch) onReset();
    epoch = ep;
  }, ms || 5000);
}

/* ---------- 렌더링 ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function statusLine(st) {
  return st.complete
    ? '🎉 릴레이 완성! ' + st.pc + '컷 모두 이어졌어요.'
    : '🏃 지금 차례: <b>' + st.currentTeam + '팀</b> · ' + chunkLabel(st.currentTeam, st.n, st.pc)
      + ' 작성 중 (' + st.doneCount + '/' + st.pc + '컷 완성)';
}
function bannerHTML(cls, html) { return '<div class="turn-banner ' + cls + '">' + html + '</div>'; }

function bubbleHTML(text, mode, p, b) {
  const side = b === 0 ? 'left' : 'right';
  if (mode === 'edit') {
    return '<div class="bubble edit ' + side + '"><textarea rows="2" maxlength="120" placeholder="대사를 입력하세요" data-p="'
      + p + '" data-b="' + b + '">' + esc(text) + '</textarea></div>';
  }
  if (mode === 'locked') return '<div class="bubble locked ' + side + '">🔒 차례가 오면 열려요</div>';
  const t = (text || '').trim();
  return t
    ? '<div class="bubble ' + side + '">' + esc(t).replace(/\n/g, '<br>') + '</div>'
    : '<div class="bubble empty ' + side + '"><span class="ph">…</span></div>';
}

/* 웹툰 전체를 HTML로. myTeam을 주면 그 팀 차례일 때 현재 구간이 입력칸이 된다. */
function webtoonHTML(st, bubbles, myTeam) {
  const myTurn = !!myTeam && !st.complete && st.currentTeam === myTeam;
  let html = '';
  for (let p = 0; p < st.pc; p++) {
    const author = chunkOwner(p, st.n, st.pc);
    const cur = inChunk(st.currentChunk, p);
    const mode = myTurn && cur ? 'edit' : (!st.done[p] && !cur ? 'locked' : 'view');
    const badge = st.done[p] ? '✍️ ' + author + '팀'
      : cur ? (myTurn ? '✍️ 우리 팀 작성 중' : '✍️ ' + author + '팀 작성 중…')
      : author + '팀 차례 대기';
    const meta = PANELS[p];
    html += '<figure class="panel' + (cur ? ' now' : '') + '" id="panel-' + p + '">'
      + '<div class="art"><img src="' + meta.img + '" alt="' + esc(meta.title) + '" loading="lazy">';
    for (let b = 0; b < BUBBLES_PER_PANEL; b++) html += bubbleHTML(bubbles[p + '_' + b] || '', mode, p, b);
    html += '</div><figcaption><strong>' + esc(meta.title) + '</strong><span class="figbadge">' + badge + '</span></figcaption></figure>';
  }
  return html;
}
