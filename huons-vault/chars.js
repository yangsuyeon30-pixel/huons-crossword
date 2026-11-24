// 사람 캐릭터 12종 (이름: 데블스 플랜 시즌3 출연자) — 인라인 SVG 일러스트, 참가자/관리자 화면 공용
(function(){
  // 피부: [밝은면, 기본, 그림자]
  const SKIN = [
    ['#ffe6d2', '#f8d2b4', '#e9b08f'],
    ['#fbdcc2', '#f0c29f', '#d99d79'],
    ['#efc6a2', '#e1a980', '#c4875f'],
    ['#d9a47c', '#c78d63', '#a66d47'],
  ];
  const C = [
    { name:'장동민',   skin:0, hair:'side',  hc:'#1f1b1e', eye:'#3b2a20', coat:'#22335c', shirt:'#ffffff', tie:'#d4af37', suit:true },
    { name:'홍진호',   skin:1, hair:'short', hc:'#3a2516', eye:'#4a3020', coat:'#f5f7fc', shirt:'#5b8def', glasses:'#2a2a2a', lab:true },
    { name:'하석진',   skin:2, hair:'side',  hc:'#4a2f1c', eye:'#3a2618', coat:'#f5f7fc', shirt:'#7fd1c2', steth:true, lab:true },
    { name:'유리사',   skin:0, hair:'long',  hc:'#2a1a12', eye:'#4a2c1a', coat:'#2fa58f', shirt:'#e6faf4', f:true },
    { name:'오현민',   skin:2, hair:'slick', hc:'#151515', eye:'#2e2018', coat:'#5f6878', shirt:'#ffffff', tie:'#c0392b', suit:true },
    { name:'스텔라장', skin:1, hair:'bob',   hc:'#7a3b1d', eye:'#5a3218', coat:'#f2b705', shirt:'#2b2b2b', hat:'beret', hatc:'#c2185b', f:true },
    { name:'정현규',   skin:3, hair:'curly', hc:'#24170f', eye:'#2a1a10', coat:'#3d4b63', shirt:'#3d4b63', phones:true, hoodie:true },
    { name:'재재',     skin:0, hair:'wavy',  hc:'#9c4f24', eye:'#5a3218', coat:'#e86a92', shirt:'#ffffff', f:true },
    { name:'존박',     skin:1, hair:'slick', hc:'#2a1c12', eye:'#3a2618', coat:'#6b4a2e', shirt:'#ffffff', tie:'#1e3a8a', glasses:'#5a3a1a', suit:true },
    { name:'넉살',     skin:2, hair:'short', hc:'#2b2b2b', eye:'#2e2018', coat:'#b08d57', shirt:'#f1e4c8', hat:'fedora', hatc:'#3b3024', suit:true },
    { name:'현경렬',   skin:1, hair:'side',  hc:'#2b1d14', eye:'#3a2618', coat:'#d8c39a', shirt:'#d8c39a', knit:true },
    { name:'서출구',   skin:2, hair:'short', hc:'#141414', eye:'#2a1a10', coat:'#1f2430', shirt:'#1f2430', hat:'cap', hatc:'#1e6bff', hoodie:true },
  ];
  let uid = 0;

  // 색 밝기 조절 (amt > 0 밝게, < 0 어둡게)
  function shade(hex, amt){
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function hairBack(c, g){
    switch(c.hair){
      case 'long': return `<path d="M22 50 Q18 96 26 114 Q38 120 50 118 Q62 120 74 114 Q82 96 78 50 Q78 20 50 20 Q22 20 22 50Z" fill="url(#${g})"/>`;
      case 'wavy': return `<path d="M21 50 Q14 72 20 88 Q14 104 26 114 Q38 122 50 118 Q62 122 74 114 Q86 104 80 88 Q86 72 79 50 Q79 18 50 18 Q21 18 21 50Z" fill="url(#${g})"/>`;
      case 'bob':  return `<path d="M22 52 Q20 80 28 86 Q50 92 72 86 Q80 80 78 52 Q78 22 50 22 Q22 22 22 52Z" fill="url(#${g})"/>`;
      default: return '';
    }
  }
  function hairFront(c, g){
    const hl = `<path d="M34 30 Q46 22 60 26" stroke="rgba(255,255,255,.35)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    switch(c.hair){
      case 'short': return `<path d="M24 52 Q20 22 50 20 Q80 22 76 52 Q74 40 66 34 Q58 40 48 36 Q38 40 32 36 Q26 42 24 52Z" fill="url(#${g})"/>${hl}`;
      case 'side':  return `<path d="M24 54 Q20 22 52 20 Q80 22 76 52 Q72 36 60 32 Q44 34 34 44 Q28 46 24 54Z" fill="url(#${g})"/><path d="M58 22 Q52 30 50 36" stroke="rgba(0,0,0,.25)" stroke-width="1.5" fill="none"/>${hl}`;
      case 'slick': return `<path d="M24 50 Q22 20 52 19 Q80 20 76 50 Q74 32 60 28 Q42 27 30 38 Q26 42 24 50Z" fill="url(#${g})"/><path d="M34 28 Q48 22 66 27" stroke="rgba(255,255,255,.4)" stroke-width="2" fill="none"/><path d="M38 33 Q52 27 68 32" stroke="rgba(255,255,255,.2)" stroke-width="1.5" fill="none"/>`;
      case 'curly': return `<g fill="url(#${g})">${[[30,34,9],[40,25,10],[52,22,10],[63,25,10],[71,35,9],[25,46,7],[76,46,7],[46,32,8],[58,32,8]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
      case 'long':
      case 'wavy':  return `<path d="M24 56 Q22 22 50 21 Q78 22 76 56 Q70 38 56 32 Q50 42 36 46 Q28 48 24 56Z" fill="url(#${g})"/>${hl}`;
      case 'bob':   return `<path d="M24 52 Q24 22 50 22 Q76 22 76 52 L76 46 Q62 40 50 40 Q38 40 24 46Z" fill="url(#${g})"/>${hl}`;
      default: return '';
    }
  }
  function hat(c){
    if(!c.hat) return '';
    const d = shade(c.hatc, -.3);
    if(c.hat === 'fedora') return `<path d="M30 30 Q30 10 50 10 Q70 10 70 30Z" fill="${c.hatc}"/><path d="M38 14 Q50 18 62 14" stroke="${d}" stroke-width="2" fill="none"/><rect x="30" y="25" width="40" height="5" fill="${d}"/><ellipse cx="50" cy="31" rx="34" ry="6.5" fill="${c.hatc}"/><ellipse cx="50" cy="30" rx="34" ry="3" fill="rgba(255,255,255,.12)"/>`;
    if(c.hat === 'beret') return `<ellipse cx="46" cy="25" rx="28" ry="11" fill="${c.hatc}" transform="rotate(-10 46 25)"/><ellipse cx="42" cy="21" rx="14" ry="4" fill="rgba(255,255,255,.2)" transform="rotate(-10 42 21)"/><circle cx="46" cy="14" r="3" fill="${d}"/>`;
    if(c.hat === 'cap') return `<path d="M25 40 Q25 16 50 16 Q75 16 75 40Z" fill="${c.hatc}"/><path d="M36 20 Q50 16 64 20" stroke="rgba(255,255,255,.3)" stroke-width="2" fill="none"/><path d="M24 40 Q52 33 88 42 Q90 47 83 48 Q52 41 24 45Z" fill="${d}"/><circle cx="50" cy="17" r="2.5" fill="${d}"/>`;
    return '';
  }

  function outfit(c, id){
    const top = shade(c.coat, .12), bot = shade(c.coat, -.22), line = shade(c.coat, -.35);
    let s = `<defs><linearGradient id="co${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs>
      <path d="M10 132 Q10 100 30 93 Q40 89 50 89 Q60 89 70 93 Q90 100 90 132Z" fill="url(#co${id})" ${c.lab ? 'stroke="#d6dce8" stroke-width="1.2"' : ''}/>`;
    if(c.hoodie){
      s += `<path d="M30 93 Q50 106 70 93 Q64 100 50 102 Q36 100 30 93Z" fill="${line}"/><path d="M44 102 L43 116 M56 102 L57 116" stroke="#e5e7eb" stroke-width="1.8" stroke-linecap="round"/>`;
    }else if(c.knit){
      s += `<path d="M38 90 Q50 98 62 90" stroke="${line}" stroke-width="5" fill="none" stroke-linecap="round"/>${[0,1,2,3].map(k => `<path d="M${24 + k*15} 110 l3 5 l3 -5" stroke="${line}" stroke-width="1.4" fill="none"/>`).join('')}`;
    }else{
      s += `<path d="M40 90 L50 114 L60 90Z" fill="${c.shirt}"/>`;
      if(c.tie) s += `<path d="M47.5 93 L52.5 93 L54.5 116 L50 122 L45.5 116Z" fill="${c.tie}"/><path d="M47.5 93 L52.5 93 L51.5 97 L48.5 97Z" fill="${shade(c.tie, -.25)}"/>`;
      if(c.suit || c.lab) s += `<path d="M40 90 L46 112 L38 100 L34 94Z M60 90 L54 112 L62 100 L66 94Z" fill="${c.lab ? '#e6ebf3' : line}"/>`;
      if(c.lab) s += `<rect x="62" y="108" width="12" height="9" rx="2" fill="none" stroke="#cfd6e4" stroke-width="1.2"/><path d="M66 106 L66 110" stroke="#1e6bff" stroke-width="1.6"/>`;
      if(!c.suit && !c.lab) s += `<path d="M40 90 Q50 100 60 90" stroke="${line}" stroke-width="1.6" fill="none"/>`;
    }
    if(c.steth) s += `<path d="M38 92 Q34 112 48 114 Q60 112 62 92" stroke="#3b4252" stroke-width="2.4" fill="none"/><circle cx="48" cy="115" r="4" fill="#b8c0cc" stroke="#3b4252" stroke-width="1.4"/>`;
    return s;
  }

  function avatar(i, cls){
    const c = C[((i % C.length) + C.length) % C.length], sk = SKIN[c.skin], id = ++uid;
    const gH = 'h' + id, gS = 's' + id;
    const lash = c.f ? `<path d="M36.5 52.5 L34 50.5 M37.5 50.8 L35.6 48.3 M63.5 52.5 L66 50.5 M62.5 50.8 L64.4 48.3" stroke="#1f1612" stroke-width="1.3" stroke-linecap="round"/>` : '';
    const eye = x => `<ellipse cx="${x}" cy="55" rx="4.6" ry="5.4" fill="#fff"/><ellipse cx="${x}" cy="55.6" rx="3.5" ry="4.3" fill="${c.eye}"/><ellipse cx="${x}" cy="56.2" rx="1.9" ry="2.4" fill="#120c08"/><circle cx="${x + 1.3}" cy="53.4" r="1.4" fill="#fff"/><circle cx="${x - 1.2}" cy="57.6" r=".7" fill="#fff" opacity=".8"/><path d="M${x - 4.8} 52.2 Q${x} 48.6 ${x + 4.8} 52.2" stroke="#1f1612" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    return `<svg class="${cls || 'avatar'}" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" aria-label="${c.name}">
      <defs>
        <linearGradient id="${gH}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c.hc, .3)}"/><stop offset="1" stop-color="${c.hc}"/></linearGradient>
        <radialGradient id="${gS}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="${sk[0]}"/><stop offset=".7" stop-color="${sk[1]}"/><stop offset="1" stop-color="${sk[2]}"/></radialGradient>
      </defs>
      ${hairBack(c, gH)}
      ${outfit(c, id)}
      <path d="M43 72 L57 72 L57 88 Q50 93 43 88Z" fill="${sk[1]}"/>
      <path d="M43 80 Q50 86 57 80 L57 74 L43 74Z" fill="${sk[2]}" opacity=".6"/>
      <ellipse cx="25.5" cy="57" rx="4.6" ry="6" fill="${sk[1]}"/><ellipse cx="74.5" cy="57" rx="4.6" ry="6" fill="${sk[1]}"/>
      <ellipse cx="26" cy="57" rx="2" ry="3" fill="${sk[2]}" opacity=".6"/><ellipse cx="74" cy="57" rx="2" ry="3" fill="${sk[2]}" opacity=".6"/>
      <path d="M26 52 Q25 26 50 25 Q75 26 74 52 Q74 70 62 78 Q56 82 50 82 Q44 82 38 78 Q26 70 26 52Z" fill="url(#${gS})"/>
      ${hairFront(c, gH)}
      <path d="M36 45.5 Q41 43 46 45" stroke="${shade(c.hc, -.1)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M54 45 Q59 43 64 45.5" stroke="${shade(c.hc, -.1)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      ${eye(41)}${eye(59)}${lash}
      <path d="M49 61 Q50 64 51.5 63.5" stroke="${sk[2]}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="34.5" cy="65" rx="5" ry="3" fill="#ff8f8f" opacity=".38"/><ellipse cx="65.5" cy="65" rx="5" ry="3" fill="#ff8f8f" opacity=".38"/>
      <path d="M44.5 68 Q50 74.5 55.5 68 Q50 70.2 44.5 68Z" fill="#b84a4f"/><path d="M47 71.2 Q50 72.6 53 71.2" stroke="#ff9aa0" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      ${c.glasses ? `<g fill="rgba(255,255,255,.12)" stroke="${c.glasses}" stroke-width="1.8"><rect x="34" y="49" width="14" height="12" rx="5"/><rect x="52" y="49" width="14" height="12" rx="5"/></g><path d="M48 54 Q50 52.5 52 54 M34 53 L27 51 M66 53 L73 51" stroke="${c.glasses}" stroke-width="1.6" fill="none"/>` : ''}
      ${c.phones ? `<path d="M22 56 Q20 16 50 16 Q80 16 78 56" stroke="#1d1d22" stroke-width="5" fill="none"/><rect x="16" y="49" width="11" height="17" rx="5" fill="#ef4444"/><rect x="73" y="49" width="11" height="17" rx="5" fill="#ef4444"/><rect x="18" y="52" width="3" height="10" rx="1.5" fill="rgba(255,255,255,.35)"/>` : ''}
      ${hat(c)}
    </svg>`;
  }
  window.VAULT_CHARS = { list: C, avatar, name: i => (C[i] || {}).name || '' };
})();
