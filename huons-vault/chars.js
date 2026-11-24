// 사람 캐릭터 10종 (이름: 데블스 플랜 시즌3 출연자) (인라인 SVG) — 참가자/관리자 화면 공용
(function(){
  const SKIN = ['#f6d3b3', '#eec19b', '#e0a982', '#c98d65'];
  const C = [
    { name:'장동민', skin:0, hair:'short',   hc:'#1d1d22', coat:'#24324f', shirt:'#ffffff', tie:'#d4af37' },
    { name:'홍진호',   skin:1, hair:'short',    hc:'#3a2516', coat:'#f4f6fb', shirt:'#5b8def', glasses:true },
    { name:'하석진',     skin:2, hair:'short',   hc:'#5a3a22', coat:'#f4f6fb', shirt:'#7fd1c2', steth:true },
    { name:'유리사',     skin:0, hair:'long',    hc:'#24180f', coat:'#2fa58f', shirt:'#d7f5ee' },
    { name:'오현민',   skin:2, hair:'slick',   hc:'#141414', coat:'#6b7280', shirt:'#ffffff', tie:'#dc2626' },
    { name:'스텔라장', skin:1, hair:'bob',     hc:'#7a3b1d', coat:'#f2b705', shirt:'#2b2b2b', hat:'beret', hatc:'#c2185b' },
    { name:'정현규',   skin:3, hair:'messy',   hc:'#2a1a10', coat:'#3d4b63', shirt:'#3d4b63', phones:true },
    { name:'재재',   skin:0, hair:'wavy',    hc:'#a4572a', coat:'#e86a92', shirt:'#ffffff' },
    { name:'존박',     skin:1, hair:'slick',   hc:'#2a1c12', coat:'#6b4a2e', shirt:'#ffffff', tie:'#1e3a8a', glasses:true },
    { name:'넉살',     skin:2, hair:'short',   hc:'#2b2b2b', coat:'#b08d57', shirt:'#f1e4c8', hat:'fedora', hatc:'#3b3024' },
  ];

  function hairBack(c){
    switch(c.hair){
      case 'long': return `<path d="M25 52 Q22 104 32 110 L68 110 Q78 104 75 52 Q75 24 50 24 Q25 24 25 52Z" fill="${c.hc}"/>`;
      case 'wavy': return `<path d="M24 52 Q18 80 24 96 Q20 108 34 112 L66 112 Q80 108 76 96 Q82 80 76 52 Q76 22 50 22 Q24 22 24 52Z" fill="${c.hc}"/>`;
      case 'bob':  return `<path d="M25 52 Q23 78 30 82 L70 82 Q77 78 75 52 Q75 25 50 25 Q25 25 25 52Z" fill="${c.hc}"/>`;
      case 'pony': return `<ellipse cx="76" cy="44" rx="9" ry="14" fill="${c.hc}" transform="rotate(20 76 44)"/>`;
      default: return '';
    }
  }
  function hairFront(c){
    switch(c.hair){
      case 'short': return `<path d="M27 52 Q25 25 50 25 Q75 25 73 52 Q70 38 58 36 Q50 40 40 36 Q30 40 27 52Z" fill="${c.hc}"/>`;
      case 'pony':  return `<path d="M27 52 Q26 25 50 25 Q74 25 73 52 Q68 34 50 35 Q34 35 27 52Z" fill="${c.hc}"/>`;
      case 'long':
      case 'wavy':  return `<path d="M27 54 Q27 26 50 26 Q73 26 73 54 Q64 36 52 38 Q46 46 27 54Z" fill="${c.hc}"/>`;
      case 'bob':   return `<path d="M27 50 Q27 26 50 26 Q73 26 73 50 L73 46 Q50 38 27 46Z" fill="${c.hc}"/>`;
      case 'slick': return `<path d="M27 50 Q25 24 52 24 Q76 25 73 50 Q72 34 58 31 Q42 30 27 50Z" fill="${c.hc}"/><path d="M40 29 Q50 26 64 31" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>`;
      case 'messy': return `<path d="M26 52 L24 36 L32 40 L32 26 L40 34 L46 22 L52 32 L60 22 L62 34 L70 28 L70 40 L77 38 L74 52 Q68 38 50 38 Q32 38 26 52Z" fill="${c.hc}"/>`;
      case 'bald':  return `<ellipse cx="28" cy="48" rx="5" ry="8" fill="${c.hc}"/><ellipse cx="72" cy="48" rx="5" ry="8" fill="${c.hc}"/>`;
      default: return '';
    }
  }
  function hat(c){
    if(c.hat === 'fedora') return `<path d="M33 32 Q34 14 50 14 Q66 14 67 32Z" fill="${c.hatc}"/><rect x="33" y="27" width="34" height="5" fill="#111"/><ellipse cx="50" cy="33" rx="31" ry="6" fill="${c.hatc}"/>`;
    if(c.hat === 'beret') return `<ellipse cx="46" cy="29" rx="25" ry="10" fill="${c.hatc}" transform="rotate(-8 46 29)"/><circle cx="46" cy="19" r="3" fill="${c.hatc}"/>`;
    return '';
  }
  function avatar(i, cls){
    const c = C[((i % 10) + 10) % 10], s = SKIN[c.skin];
    const labcoat = c.coat === '#f4f6fb';
    return `<svg class="${cls||'avatar'}" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" aria-label="${c.name}">
      ${hairBack(c)}
      <path d="M14 130 Q14 94 50 88 Q86 94 86 130Z" fill="${c.coat}" ${labcoat ? 'stroke="#cfd6e4" stroke-width="1.5"' : ''}/>
      <path d="M40 89 L50 112 L60 89Z" fill="${c.shirt}"/>
      ${c.coat === c.shirt ? '<path d="M38 92 Q50 100 62 92" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none"/>' : ''}
      ${c.tie ? `<path d="M47 92 L53 92 L55 116 L50 122 L45 116Z" fill="${c.tie}"/>` : ''}
      ${labcoat ? '<path d="M40 89 L46 130 M60 89 L54 130" stroke="#cfd6e4" stroke-width="2"/>' : ''}
      <rect x="44" y="72" width="12" height="18" rx="4" fill="${s}"/>
      <circle cx="27" cy="55" r="5" fill="${s}"/><circle cx="73" cy="55" r="5" fill="${s}"/>
      <ellipse cx="50" cy="52" rx="23" ry="25" fill="${s}"/>
      ${hairFront(c)}
      <path d="M38 48 L45 47 M55 47 L62 48" stroke="#3b2a1a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="42" cy="55" r="2.8" fill="#1e1e24"/><circle cx="58" cy="55" r="2.8" fill="#1e1e24"/>
      <circle cx="43" cy="54" r=".9" fill="#fff"/><circle cx="59" cy="54" r=".9" fill="#fff"/>
      <ellipse cx="36" cy="63" rx="4" ry="2.4" fill="#ff8a8a" opacity=".35"/><ellipse cx="64" cy="63" rx="4" ry="2.4" fill="#ff8a8a" opacity=".35"/>
      ${c.stache ? '<path d="M41 65 Q50 60 59 65 Q50 63 41 65Z" fill="#6b6b6b" stroke="#6b6b6b" stroke-width="2"/>' : ''}
      <path d="M44 67 Q50 72 56 67" stroke="#8a3b2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      ${c.glasses ? '<g fill="none" stroke="#222" stroke-width="2"><circle cx="42" cy="55" r="7"/><circle cx="58" cy="55" r="7"/><path d="M49 55 L51 55 M35 54 L28 52 M65 54 L72 52"/></g>' : ''}
      ${c.steth ? '<path d="M38 90 Q36 108 48 110 Q60 108 62 90" stroke="#333" stroke-width="2.5" fill="none"/><circle cx="48" cy="111" r="4" fill="#9aa0a6" stroke="#333" stroke-width="1.5"/>' : ''}
      ${c.phones ? '<path d="M24 54 Q24 20 50 20 Q76 20 76 54" stroke="#111" stroke-width="5" fill="none"/><rect x="19" y="48" width="10" height="16" rx="4" fill="#ef4444"/><rect x="71" y="48" width="10" height="16" rx="4" fill="#ef4444"/>' : ''}
      ${hat(c)}
    </svg>`;
  }
  window.VAULT_CHARS = { list: C, avatar, name: i => (C[i] || {}).name || '' };
})();
