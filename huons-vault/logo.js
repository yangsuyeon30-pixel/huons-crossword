// 휴온스 플랜 타이틀 로고 (금속 광택 글씨 + 보라 주사위 + 장식 부제) — <div class="huons-logo"></div>에 그려짐
(function(){
  const dice = (cls) => `<svg class="ld ${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient id="dT${cls}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9a4ff"/><stop offset="1" stop-color="#7a3df0"/></linearGradient>
      <linearGradient id="dL${cls}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a2fd6"/><stop offset="1" stop-color="#3b148c"/></linearGradient>
      <linearGradient id="dR${cls}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a4cf5"/><stop offset="1" stop-color="#4a1aa8"/></linearGradient>
    </defs>
    <path d="M50 8 L90 28 L50 48 L10 28Z" fill="url(#dT${cls})"/>
    <path d="M10 28 L50 48 L50 94 L10 72Z" fill="url(#dL${cls})"/>
    <path d="M90 28 L50 48 L50 94 L90 72Z" fill="url(#dR${cls})"/>
    <ellipse cx="50" cy="28" rx="7" ry="3.6" fill="#e9f7d6"/>
    <ellipse cx="22" cy="46" rx="4" ry="5" fill="#e9f7d6"/><ellipse cx="38" cy="74" rx="4" ry="5" fill="#e9f7d6"/>
    <ellipse cx="62" cy="58" rx="4" ry="5" fill="#e9f7d6"/><ellipse cx="70" cy="64" rx="4" ry="5" fill="#e9f7d6"/><ellipse cx="78" cy="70" rx="4" ry="5" fill="#e9f7d6"/>
    <path d="M50 8 L90 28 L50 48 L10 28Z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.5"/>
  </svg>`;
  const flourish = (flip) => `<svg class="lf ${flip ? 'flip' : ''}" viewBox="0 0 120 24" aria-hidden="true">
    <path d="M118 12 Q100 2 86 12 T56 12 Q44 20 34 12 Q26 6 18 12 L4 12" fill="none" stroke="url(#lfg)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M4 12 L10 8 L16 12 L10 16Z" fill="#cfd3da"/>
    <defs><linearGradient id="lfg" x1="0" x2="1"><stop offset="0" stop-color="#9aa0aa"/><stop offset=".5" stop-color="#f1f3f6"/><stop offset="1" stop-color="#6f7480"/></linearGradient></defs>
  </svg>`;
  function render(el){
    el.innerHTML = `<div class="lg-ring"></div>${dice('d1')}${dice('d2')}
      <div class="lg-title" data-t="휴온스 플랜">휴온스 플랜</div>
      <div class="lg-sub">${flourish(false)}<span>탈출룸</span>${flourish(true)}</div>`;
  }
  function init(){ document.querySelectorAll('.huons-logo').forEach(render); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
