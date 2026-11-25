const SB_URL = 'https://rbvhohhuqaryzuahskfe.supabase.co';
const SB_KEY = 'sb_publishable_sLQbHvn1wX5vdmvdraHDsg_wV7bU-hy';
const SB_HEADERS = { apikey: SB_KEY, 'Content-Type': 'application/json' };

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function cardHTML(c){
  const bio = String(c.biorhythm||'');
  const m = bio.match(/^(\d+)\s*점\s*(?:–\s*)?(.*)$/);
  const score = m ? Math.max(0,Math.min(100,+m[1])) : null;
  const memo = m ? m[2] : bio;
  const name = c.name || '이름';
  const L=[...name].length, nmCls = L<=3?'':L===4?'l4':L===5?'l5':'l6';
  const chips = [c.treasure1, c.treasure2].filter(Boolean).map(t=>`<span class="chip">${esc(t)}</span>`).join('')
    || '<span class="v empty">-</span>';
  return `<div class="card-wrap"><div class="card">
    <div class="left">
      <div class="tag">HUONS <b>·</b> 2026 입문교육</div>
      <div class="namebox"><span class="paren">(</span><span class="nm ${nmCls}">${esc(name)}</span><span class="paren">)</span></div>
      <div class="work"><span class="k">MY WORK</span>${c.work?esc(c.work):'<span style="opacity:.5">내 업무 소개</span>'}</div>
    </div>
    <div class="right">
      <div class="row"><div class="ic">⚡</div><div class="body">
        <div class="k2">오늘의 바이오리듬</div>
        ${score!==null?`<div class="gauge"><div class="bar"><i style="width:${score}%"></i></div><span class="score">${score}점</span></div>`:''}
        ${memo?`<div class="memo">${esc(memo)}</div>`:''}
      </div></div>
      <div class="row"><div class="ic">💎</div><div class="body">
        <div class="k2">나의 소중한 보물</div>
        <div class="chips">${chips}</div>
      </div></div>
      <div class="row"><div class="ic">🎯</div><div class="body">
        <div class="k2">교육에서 기대하는 점</div>
        <div class="quote${c.expect?' has':''}">${c.expect?esc(c.expect):'<span class="empty">-</span>'}</div>
      </div></div>
    </div>
  </div></div>`;
}
