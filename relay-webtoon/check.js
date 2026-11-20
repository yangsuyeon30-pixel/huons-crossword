// 문법 + 구간 나누기 검사.  실행: node relay-webtoon/check.js
const fs = require('fs');
const vm = require('vm');
const dir = __dirname;

function assert(cond, msg) { if (!cond) throw new Error('ASSERT FAILED: ' + msg); }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const common = fs.readFileSync(dir + '/common.js', 'utf8');
const ctx = vm.createContext({});
vm.runInContext(common + '\n;globalThis.t = { teamChunk, chunkOwner, chunkLabel, webtoonHTML, stateSig, PANELS, BUBBLES_PER_PANEL };', ctx, { filename: 'common.js' });
const t = ctx.t;
console.log('common.js OK');

for (const page of ['index.html', 'write.html', 'result.html', 'admin.html']) {
  const html = fs.readFileSync(dir + '/' + page, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((s, i) => new vm.Script(s, { filename: page + '#' + i }));
  console.log(page + ' ' + scripts.length + ' inline script(s) OK');
}

for (const p of t.PANELS) assert(fs.existsSync(dir + '/' + p.img), 'missing image ' + p.img);
assert(t.PANELS.length === 15 && t.BUBBLES_PER_PANEL === 2, 'panel constants');

// 15컷 / 8팀 → 1~7팀 2컷, 8팀 1컷
assert(eq(Array.from({ length: 15 }, (_, p) => t.chunkOwner(p, 8, 15)), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8]), 'owner 15/8');
assert(eq(t.teamChunk(8, 8, 15), { start: 14, end: 14, size: 1 }), 'chunk 8/8/15');
assert(eq(t.teamChunk(6, 9, 15), { start: 10, end: 11, size: 2 }), 'chunk 6/9/15');
assert(t.chunkLabel(1, 8, 15) === '1~2컷' && t.chunkLabel(8, 8, 15) === '15컷', 'labels');

// 모든 컷이 정확히 한 팀에, 연속 구간으로
for (const [n, pc] of [[8, 15], [9, 15], [2, 5], [6, 15], [15, 15], [3, 10], [20, 15], [1, 1]]) {
  for (let team = 1; team <= n; team++) {
    const ch = t.teamChunk(team, n, pc);
    if (team > pc) { assert(ch === null, 'no chunk ' + team + ' ' + n + '/' + pc); continue; }
    for (let p = ch.start; p <= ch.end; p++) assert(t.chunkOwner(p, n, pc) === team, 'owner ' + n + '/' + pc);
  }
  const covered = Array.from({ length: pc }, (_, p) => t.chunkOwner(p, n, pc));
  assert(covered.every((o, i) => i === 0 || o === covered[i - 1] || o === covered[i - 1] + 1), 'contiguous ' + n + '/' + pc);
}

// 렌더링: 내 차례 구간은 입력칸, 미래 구간은 잠금
const st = { n: 8, pc: 15, done: [true, true].concat(Array(13).fill(false)), currentPanel: 2, complete: false,
  currentTeam: 2, currentChunk: t.teamChunk(2, 8, 15), doneCount: 2 };
const mine = t.webtoonHTML(st, { '0_0': '<b>', '2_0': 'hi' }, 2);
assert((mine.match(/<textarea/g) || []).length === 4, '4 textareas for team 2');
assert(mine.includes('&lt;b&gt;'), 'escaped');
assert((t.webtoonHTML(st, {}, 3).match(/<textarea/g) || []).length === 0, 'no textareas for others');
assert((mine.match(/bubble locked/g) || []).length === 22, '11 locked panels');
console.log('ALL TESTS PASS');
