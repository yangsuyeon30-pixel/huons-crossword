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
      <div class="work fit"><span class="k">MY WORK</span>${c.work?esc(c.work):'<span style="opacity:.5">내 업무 소개</span>'}</div>
    </div>
    <div class="right">
      <div class="row"><div class="ic">⚡</div><div class="body">
        <div class="k2">오늘의 바이오리듬</div>
        ${score!==null?`<div class="gauge"><div class="bar"><i style="width:${score}%"></i></div><span class="score">${score}점</span></div>`:''}
        ${memo?`<div class="memo fit">${esc(memo)}</div>`:''}
      </div></div>
      <div class="row"><div class="ic">💎</div><div class="body">
        <div class="k2">나의 소중한 보물</div>
        <div class="chips fit">${chips}</div>
      </div></div>
      <div class="row"><div class="ic">🎯</div><div class="body">
        <div class="k2">교육에서 기대하는 점</div>
        <div class="quote fit${c.expect?' has':''}">${c.expect?esc(c.expect):'<span class="empty">-</span>'}</div>
      </div></div>
    </div>
  </div></div>`;
}

// 칸이 넘치면 가장 큰 글씨부터 조금씩 줄여서 전부 보이게 함
function overflows(col){
  const r=col.getBoundingClientRect(), cs=getComputedStyle(col);
  const top=r.top+parseFloat(cs.paddingTop)-1, bottom=r.bottom-parseFloat(cs.paddingBottom)+1;
  return [...col.children].some(ch=>{ const b=ch.getBoundingClientRect(); return b.top<top||b.bottom>bottom; });
}
function fitCard(root){
  (root||document).querySelectorAll('.card').forEach(card=>{
    if(!card.clientWidth) return;
    card.querySelectorAll('.left,.right').forEach(col=>{
      const els=[...col.querySelectorAll('.fit')];
      els.forEach(e=>{ e._k=1; e.style.setProperty('--k',1); });
      for(let g=0; g<300 && overflows(col); g++){
        const c=els.filter(e=>e._k>0.2).sort((a,b)=>b.offsetHeight*b._k-a.offsetHeight*a._k)[0];
        if(!c) break;
        c._k=Math.max(0.2,c._k*0.93); c.style.setProperty('--k',c._k);
      }
    });
  });
}
if(document.fonts) document.fonts.ready.then(()=>fitCard(document));
// 명함이 새로 그려지거나 보이게 될 때·창 크기가 바뀔 때 자동으로 맞춤
let _fitQ=false;
function fitSoon(){ if(_fitQ) return; _fitQ=true; requestAnimationFrame(()=>{ _fitQ=false; fitCard(document); }); }
addEventListener('resize',fitSoon);
addEventListener('DOMContentLoaded',()=>{
  new MutationObserver(ms=>{ if(ms.some(m=>!(m.target.closest&&m.target.closest('.card')))) fitSoon(); })
    .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
  fitSoon();
});
