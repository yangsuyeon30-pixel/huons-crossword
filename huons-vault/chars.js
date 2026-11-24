// 사람 캐릭터 12종 (이름: 데블스 플랜 시즌3 출연자) — 인라인 SVG 일러스트, 참가자/관리자 화면 공용
// v2: 서바이벌 게임쇼 '참가자' 룩 — 플랫 벡터, 검은 참가자 재킷 + 금색 번호 배지,
//     인물별 대표 특징(헤어·안경·모자·헤드폰·이너 컬러)만 살린 캐리커처. API(avatar(i, cls), list, name)는 그대로.
(function(){
  // 피부: [기본, 그림자, 볼/코]
  const SKIN = [
    ['#f6d5bd', '#e4b596', '#e7a48c'],
    ['#efc6a5', '#d9a47f', '#dc9677'],
    ['#e3b08a', '#c98f68', '#c97f60'],
    ['#c99169', '#ab734d', '#a8664a'],
  ];
  // hair: 헤어 모양, hc: 머리색, inner: 재킷 속 이너 색, acc: 포인트(넥타이/스카프 등)
  const C = [
    { name:'장동민',   skin:1, hair:'side',  hc:'#1b1a1f', inner:'#f4f4f6', acc:'#c9a24a', brow:'sharp', look:'smirk' },
    { name:'홍진호',   skin:0, hair:'short', hc:'#2c2119', inner:'#e9eef8', acc:'#5b8def', glasses:'round', look:'smile' },
    { name:'하석진',   skin:1, hair:'quiff', hc:'#16110e', inner:'#ffffff', acc:'#7fd1c2', brow:'sharp', handsome:true, look:'smile' },
    { name:'유리사',   skin:0, hair:'long',  hc:'#22160f', inner:'#e6faf4', acc:'#2fa58f', f:true, look:'smile' },
    { name:'오현민',   skin:2, hair:'bangs', hc:'#121214', inner:'#ffffff', acc:'#c0392b', brow:'sharp', look:'calm' },
    { name:'스텔라장', skin:0, hair:'bob',   hc:'#6b3219', inner:'#2b2b2b', acc:'#f2b705', hat:'beret', hatc:'#c2185b', f:true, look:'smile' },
    { name:'정현규',   skin:1, hair:'swept', hc:'#1a1310', inner:'#3d4b63', acc:'#ef4444', brow:'sharp', handsome:true, look:'calm' },
    { name:'재재',     skin:0, hair:'crop',  hc:'#17120f', inner:'#ffffff', acc:'#e86a92', nobrow:true, glasses:'wire', look:'grin' },
    { name:'존박',     skin:1, hair:'slick', hc:'#24180f', inner:'#ffffff', acc:'#1e3a8a', face:'long', look:'smile' },
    { name:'넉살',     skin:2, hair:'manbob', hc:'#1c1a1a', inner:'#f1e4c8', acc:'#b08d57', look:'smirk' },
    { name:'현경렬',   skin:1, hair:'side',  hc:'#2a1c13', inner:'#d8c39a', acc:'#d8c39a', brow:'soft', look:'smile' },
    { name:'서출구',   skin:2, hair:'spiky', hc:'#121212', inner:'#1f2430', acc:'#1e6bff', look:'grin' },
  ];
  const GOLD = '#e9c46a', GOLD_D = '#a87a24', JACKET = '#16161d', JACKET_HI = '#24242e', LINE = '#0b0b10';
  let uid = 0;

  function shade(hex, amt){
    const n = parseInt(hex.slice(1).padEnd(6, hex.slice(1)), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ---------- 헤어 ----------
  function hairBack(c){
    const f = `fill="${c.hc}"`;
    switch(c.hair){
      case 'long': return `<path d="M22 50 Q17 98 27 116 Q50 124 73 116 Q83 98 78 50 Q78 19 50 19 Q22 19 22 50Z" ${f}/>`;
      case 'wavy': return `<path d="M21 50 Q13 72 20 88 Q13 106 27 116 Q50 126 73 116 Q87 106 80 88 Q87 72 79 50 Q79 17 50 17 Q21 17 21 50Z" ${f}/>`;
      case 'bob':  return `<path d="M21 52 Q19 82 28 88 Q50 94 72 88 Q81 82 79 52 Q79 21 50 21 Q21 21 21 52Z" ${f}/>`;
      // 남자 단발: 턱선까지 내려오는 옆·뒷머리
      case 'manbob': return `<path d="M19 50 Q17 84 25 91 Q50 95 75 91 Q83 84 81 50 Q81 17 50 17 Q19 17 19 50Z" ${f}/>`;
      default: return '';
    }
  }
  function hairFront(c){
    const f = `fill="${c.hc}"`, hi = shade(c.hc, .28);
    const shine = d => `<path d="${d}" stroke="${hi}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>`;
    switch(c.hair){
      case 'short': return `<path d="M24 52 Q19 20 50 18 Q81 20 76 52 Q74 39 66 33 Q57 39 48 35 Q38 39 32 35 Q26 41 24 52Z" ${f}/>${shine('M36 27 Q46 22 58 24')}`;
      case 'side':  return `<path d="M24 55 Q18 20 52 18 Q82 20 76 52 Q72 35 60 31 Q44 33 33 45 Q27 47 24 55Z" ${f}/>${shine('M38 26 Q50 21 64 25')}`;
      case 'slick': return `<path d="M24 50 Q21 18 52 17 Q81 18 76 50 Q74 31 60 27 Q42 26 30 37 Q26 41 24 50Z" ${f}/>${shine('M34 27 Q48 21 66 26')}<path d="M38 32 Q52 26 68 31" stroke="${hi}" stroke-width="1.2" fill="none" opacity=".6"/>`;
      case 'curly': return `<g ${f}>${[[30,34,9.5],[40,24,10.5],[52,21,10.5],[63,24,10.5],[71,34,9.5],[25,46,7.5],[76,46,7.5],[46,31,8],[58,31,8]].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>${[[38,21],[52,17],[62,21]].map(([x,y]) => `<path d="M${x-3} ${y+1} Q${x} ${y-2} ${x+3} ${y+1}" stroke="${hi}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join('')}`;
      case 'long':
      case 'wavy':  return `<path d="M24 57 Q21 20 50 20 Q79 20 76 57 Q70 37 56 31 Q49 42 35 46 Q28 49 24 57Z" ${f}/>${shine('M36 27 Q46 22 58 24')}`;
      case 'bob':   return `<path d="M23 53 Q23 21 50 21 Q77 21 77 53 L77 46 Q63 39 50 39 Q37 39 23 46Z" ${f}/>${shine('M34 28 Q46 23 60 25')}`;
      // 일자 앞머리(남자): 눈썹 위까지 내려오는 뱅
      case 'bangs': return `<path d="M24 54 Q19 19 50 18 Q81 19 76 54 Q75 45 72 42 L68 43.5 L64 40.5 L58 43 L52 40 L46 43 L40 40.5 L35 43.5 L30 42 Q26 45 24 54Z" ${f}/>${shine('M34 27 Q46 21 62 24')}<path d="M44 30 L42 40 M54 30 L55 40" stroke="${shade(c.hc, -.4)}" stroke-width="1" opacity=".7"/>`;
      // 옆으로 흘러내린 앞머리(댄디컷)
      case 'swept': return `<path d="M24 54 Q18 19 52 17 Q82 19 76 54 Q75 42 70 37 Q64 36 58 38 Q50 41 42 44 Q35 46 30 44 Q26 47 24 54Z" ${f}/><path d="M60 22 Q50 30 40 43" stroke="${shade(c.hc, -.45)}" stroke-width="1.2" fill="none"/>${shine('M36 26 Q48 20 64 23')}${shine('M58 30 Q52 34 46 39')}`;
      // 위로 넘긴 옆가르마(포마드 느낌) — 이마가 드러남
      case 'quiff': return `<path d="M24 53 Q19 24 40 17 Q58 10 72 19 Q81 27 76 53 Q75 41 71 35 Q64 30 56 31 Q46 32 39 36 Q31 40 27 47 Q25 49 24 53Z" ${f}/><path d="M33 23 Q44 15 58 15 Q68 16 72 22" stroke="${hi}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M38 21 Q50 18 62 21" stroke="${shade(c.hc, -.4)}" stroke-width="1" fill="none"/>`;
      // 짧은 커트 + 눈썹을 덮는 짧은 앞머리
      case 'crop': return `<path d="M25 54 Q21 20 50 19 Q79 20 75 54 Q74 47 71 45 L66 46 L61 44 L55 46 L49 44 L43 46 L37 44 L32 46 L28 45 Q26 47 25 54Z" ${f}/>${shine('M34 27 Q46 21 62 24')}<path d="M42 33 L40 43 M52 32 L52 43 M61 33 L63 43" stroke="${shade(c.hc, -.35)}" stroke-width="1" opacity=".6"/>`;
      // 남자 단발, 앞머리 없이 가운데 가르마로 넘김 — 이마가 드러남
      case 'manbob': return `<path d="M50 19 Q29 19 23 40 Q20 63 23 87 Q29 91 35 86 Q31 63 34 45 Q38 30 50 27Z" ${f}/><path d="M50 19 Q71 19 77 40 Q80 63 77 87 Q71 91 65 86 Q69 63 66 45 Q62 30 50 27Z" ${f}/><path d="M50 19 L50 27" stroke="${shade(c.hc, -.4)}" stroke-width="1.2"/>${shine('M30 30 Q26 45 26 62')}${shine('M44 22 Q36 24 32 30')}`;
      // 까치머리: 위로 뻗친 삐죽머리
      case 'spiky': return `<path d="M24 52 Q20 28 28 23 L24 10 L36 18 L38 4 L48 15 L55 2 L60 15 L70 6 L69 20 L80 16 Q80 30 76 52 Q73 36 61 32 Q50 37 38 33 Q28 38 24 52Z" ${f}/>${shine('M40 13 L46 20 M56 9 L58 18')}`;
      // 스포츠머리: 두피에 붙는 짧은 머리
      case 'buzz': return `<path d="M24.5 54 Q22 19 50 18.5 Q78 19 75.5 54 L74 54 Q74 41 70 37.5 Q60 34.5 50 34.5 Q40 34.5 30 37.5 Q26 41 26 54Z" ${f}/><path d="M25 49 Q23 21 50 20 Q77 21 75 49" fill="none" stroke="${shade(c.hc, .2)}" stroke-width="1" stroke-dasharray="1 2.4" opacity=".7"/>`;
      default: return '';
    }
  }
  function hat(c){
    if(!c.hat) return '';
    const d = shade(c.hatc, -.3), l = shade(c.hatc, .2);
    if(c.hat === 'fedora') return `<path d="M30 30 Q29 8 50 8 Q71 8 70 30Z" fill="${c.hatc}"/><path d="M40 12 Q50 17 60 12" stroke="${d}" stroke-width="2" fill="none"/><rect x="30" y="24.5" width="40" height="5.5" fill="${GOLD_D}"/><ellipse cx="50" cy="31" rx="35" ry="6.5" fill="${c.hatc}"/><path d="M17 30 Q50 25 83 30" stroke="${l}" stroke-width="1.4" fill="none"/>`;
    if(c.hat === 'beret') return `<ellipse cx="46" cy="24" rx="29" ry="11.5" fill="${c.hatc}" transform="rotate(-10 46 24)"/><path d="M24 27 Q44 16 68 18" stroke="${l}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="46" cy="13" r="3" fill="${d}"/>`;
    if(c.hat === 'cap') return `<path d="M25 40 Q25 15 50 15 Q75 15 75 40Z" fill="${c.hatc}"/><path d="M50 15 L50 40" stroke="${d}" stroke-width="1.2"/><path d="M34 21 Q50 16 64 20" stroke="${l}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 40 Q52 33 89 42 Q91 47 84 48 Q52 41 24 45Z" fill="${d}"/><circle cx="50" cy="16" r="2.4" fill="${d}"/>`;
    return '';
  }

  // ---------- 의상: 검은 참가자 재킷 + 금색 칼라 라인 + 번호 배지 ----------
  function outfit(c, i){
    const no = String(i + 1).padStart(2, '0');
    return `
      <path d="M8 132 Q9 100 30 92 Q40 88 50 88 Q60 88 70 92 Q91 100 92 132Z" fill="${JACKET}"/>
      <path d="M13 120 Q15 101 30 94" stroke="${JACKET_HI}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M39 89 L50 108 L61 89 Q55 86 50 86 Q45 86 39 89Z" fill="${c.inner}"/>
      <path d="M46.5 92 L53.5 92 L52.5 108 L50 112 L47.5 108Z" fill="${c.acc}"/>
      <path d="M38 89 L47 113 L35 101 L30 93Z M62 89 L53 113 L65 101 L70 93Z" fill="${JACKET_HI}"/>
      <path d="M38 89 L47 113 M62 89 L53 113" stroke="${GOLD}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <g transform="translate(71 112)">
        <circle r="7.5" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.2"/>
        <circle r="5.6" fill="none" stroke="${GOLD_D}" stroke-width=".6" opacity=".7"/>
        <text y="2.6" text-anchor="middle" font-family="'Black Han Sans','Noto Sans KR',sans-serif" font-size="7.4" fill="#2a1d05">${no}</text>
      </g>`;
  }

  // ---------- 얼굴 파츠 ----------
  function eyes(c, sk){
    const one = (x, dir) => `
      <path d="M${x-4.6} 55.6 Q${x} 50.4 ${x+4.6} 55.6 Q${x} 58.6 ${x-4.6} 55.6Z" fill="#fff"/>
      <ellipse cx="${x + dir*.4}" cy="55.2" rx="2.7" ry="2.9" fill="#1a120d"/>
      <circle cx="${x + dir*.4 + 1}" cy="54.1" r=".95" fill="#fff"/>
      <path d="M${x-5} 55.4 Q${x} 50 ${x+5} 55.4" stroke="#1a120d" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      ${c.f ? `<path d="M${x + dir*5} 55.2 l${dir*2.2} -1.6" stroke="#1a120d" stroke-width="1.4" stroke-linecap="round"/>` : ''}`;
    return one(41, -1) + one(59, 1);
  }
  function brows(c){
    if(c.nobrow) return '';
    const col = shade(c.hc, -.1);
    if(c.brow === 'sharp') return `<path d="M35 46.5 L46.5 44" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/><path d="M53.5 44 L65 46.5" stroke="${col}" stroke-width="2.6" stroke-linecap="round"/>`;
    if(c.f) return `<path d="M35.5 46 Q41 43.4 46.2 45" stroke="${col}" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="M53.8 45 Q59 43.4 64.5 46" stroke="${col}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    return `<path d="M35 46.4 Q41 43 46.6 45.2" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M53.4 45.2 Q59 43 65 46.4" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  function mouth(c){
    switch(c.look){
      case 'smirk': return `<path d="M44.5 70 Q51 72.6 56.5 68.4" stroke="#6b2a2a" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
      case 'grin':  return `<path d="M43.5 68.5 Q50 76.5 56.5 68.5Z" fill="#7a2b2f"/><path d="M45 69.2 Q50 71 55 69.2 L54.4 70.4 Q50 71.8 45.6 70.4Z" fill="#fff"/>`;
      case 'calm':  return `<path d="M45.5 70 Q50 71.4 54.5 70" stroke="#6b2a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      default:      return `<path d="M44.5 69 Q50 74 55.5 69" stroke="#6b2a2a" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    }
  }
  function glasses(c){
    if(!c.glasses) return '';
    const r = c.glasses === 'square' ? 2.6 : 6.4, col = c.glasses === 'wire' ? '#b8a27a' : '#1c1c22';
    return `<g fill="rgba(210,230,255,.12)" stroke="${col}" stroke-width="${c.glasses === 'wire' ? 1.1 : 1.9}"><rect x="33.4" y="48.8" width="14.8" height="12.2" rx="${r}"/><rect x="51.8" y="48.8" width="14.8" height="12.2" rx="${r}"/></g>
      <path d="M48.2 54 Q50 52.4 51.8 54 M33.4 53 L27 51 M66.6 53 L73 51" stroke="${col}" stroke-width="1.7" fill="none"/>
      <path d="M36 51.4 L39.5 50.6 M54.4 51.4 L57.9 50.6" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>`;
  }
  function phones(c){
    if(!c.phones) return '';
    return `<path d="M21 56 Q19 14 50 14 Q81 14 79 56" stroke="#1d1d22" stroke-width="5" fill="none"/>
      <rect x="15" y="48" width="12" height="18" rx="5.5" fill="${c.acc}"/><rect x="73" y="48" width="12" height="18" rx="5.5" fill="${c.acc}"/>
      <rect x="17.5" y="51" width="2.6" height="11" rx="1.3" fill="#fff" opacity=".45"/>`;
  }

  function avatar(i, cls){
    const idx = ((i % C.length) + C.length) % C.length, c = C[idx], sk = SKIN[c.skin], id = ++uid;
    // 얼굴형: 기본 / long(긴 얼굴, 코·입이 4px 아래) / handsome(갸름한 V라인)
    const FACES = {
      base: 'M26 52 Q25 25 50 24 Q75 25 74 52 Q74 70 62 78 Q56 82 50 82 Q44 82 38 78 Q26 70 26 52Z',
      long: 'M27 50 Q26 22 50 21 Q74 22 73 50 Q73 75 62 83 Q56 87 50 87 Q44 87 38 83 Q27 75 27 50Z',
      handsome: 'M26 52 Q25 25 50 24 Q75 25 74 52 Q73 68 60 79 Q55 83 50 83 Q45 83 40 79 Q27 68 26 52Z',
    };
    const FACE = FACES[c.face] || (c.handsome ? FACES.handsome : FACES.base);
    const low = c.face === 'long' ? 4 : 0;
    return `<svg class="${cls || 'avatar'}" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}">
      <defs><clipPath id="cf${id}"><path d="${FACE}"/></clipPath></defs>
      ${hairBack(c)}
      ${outfit(c, idx)}
      <path d="M43 72 L57 72 L57 89 Q50 93 43 89Z" fill="${sk[1]}"/>
      <ellipse cx="25.5" cy="57" rx="4.6" ry="6" fill="${sk[0]}"/><ellipse cx="74.5" cy="57" rx="4.6" ry="6" fill="${sk[1]}"/>
      <path d="${FACE}" fill="${sk[0]}"/>
      <g clip-path="url(#cf${id})">
        <path d="M64 24 Q80 52 60 84 L80 84 L80 24Z" fill="${sk[1]}" opacity=".55"/>
        <ellipse cx="50" cy="28" rx="30" ry="6" fill="${sk[1]}" opacity=".5"/>
      </g>
      ${hairFront(c)}
      ${brows(c)}
      ${eyes(c, sk)}
      <g transform="translate(0 ${low})">
      <path d="M50.4 58.6 Q48.6 63.6 51.6 64.2" stroke="${sk[1]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${c.f ? `<ellipse cx="34" cy="65" rx="4.4" ry="2.4" fill="${sk[2]}" opacity=".45"/><ellipse cx="66" cy="65" rx="4.4" ry="2.4" fill="${sk[2]}" opacity=".45"/>` : ''}
      ${mouth(c)}
      </g>
      ${c.earring ? `<circle cx="24.5" cy="64.5" r="1.8" fill="${GOLD}"/><circle cx="75.5" cy="64.5" r="1.8" fill="${GOLD}"/>` : ''}
      ${glasses(c)}
      ${phones(c)}
      ${hat(c)}
    </svg>`;
  }
  window.VAULT_CHARS = { list: C, avatar, name: i => (C[i] || {}).name || '' };
})();
