// 긴장감 있는 배경음악 — 음원 파일 없이 Web Audio로 실시간 생성
// level 0: 대기(저음 드론 + 심장박동) / 1: 게임 중(베이스·초침·고음 추가) / 2: 막판(템포 업)
window.VaultBGM = (function(){
  let ctx = null, master = null, noiseBuf = null, drone = null, timer = null;
  let next = 0, step = 0, level = 0, playing = false, vol = .6, mode = 'tense';

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // A단조 베이스 패턴 (16스텝, 0 = 쉼)
  const BASS = [33,0,33,36, 33,0,40,39, 33,0,33,36, 31,0,32,0];
  // 긴장감 아르페지오 (16분음표, Am – F – G – E 진행, 휴대폰 스피커가 잘 내는 중음역)
  const ARP = [
    [57,60,64,69, 72,69,64,60], [53,57,60,65, 69,65,60,57],
    [55,59,62,67, 71,67,62,59], [52,56,59,64, 68,64,59,56]];
  const ROOT = [45, 41, 43, 40];
  const PAD  = [76, 77, 76, 72];   // E5 F5 E5 C5 — 반음 충돌로 불안감
  // 승리 음악: C장조 I–V–vi–IV, 8분음표 32스텝 (0 = 쉼)
  const WIN_BASS = [36,36,48,36, 43,43,55,43, 45,45,57,45, 41,41,53,43];
  const WIN_LEAD = [72,76,79,84, 83,79,74,79, 81,76,72,76, 77,81,84,83,
                    84,0,84,83, 79,0,79,81, 76,0,76,77, 79,77,76,74];

  function ensure(){
    if(ctx) return true;
    try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return false; }
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function startDrone(){
    if(drone) return;
    const g = ctx.createGain(); g.gain.value = .035;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 6;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .07; lfoG.gain.value = 90;
    lfo.connect(lfoG).connect(lp.frequency);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = o2.type = 'sawtooth'; o1.frequency.value = 110; o2.frequency.value = 110.6;
    o1.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
    [o1, o2, lfo].forEach(o => o.start());
    drone = { stop(t){ [o1, o2, lfo].forEach(o => { try{ o.stop(t); }catch(e){} }); } };
  }

  function kick(t, v){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + .18);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .28);
    o.connect(g).connect(master); o.start(t); o.stop(t + .3);
  }
  function tick(t, v){
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .04);
    s.connect(hp).connect(g).connect(master); s.start(t); s.stop(t + .05);
  }
  function bass(t, m, len){
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = hz(m);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(160, t + len);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + len);
    o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + len + .02);
  }
  function pad(t, m, len){
    const o = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(m);
    vib.frequency.value = 5.5; vg.gain.value = 4; vib.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.045, t + len * .4); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g).connect(master); o.start(t); vib.start(t); o.stop(t + len); vib.stop(t + len);
  }

  function lead(t, m, len, v = .07){
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o2.type = 'triangle'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2.003;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + len);
    o.connect(g); o2.connect(g); g.connect(master); o.start(t); o2.start(t); o.stop(t + len + .02); o2.stop(t + len + .02);
  }
  function snare(t, v){
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .8;
    const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .15);
    s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + .18);
  }
  function chord(t, ms, len, v){ ms.forEach(m => lead(t, m, len, v)); }
  // 팡파레 (빠바밤!)
  function fanfareAt(t){
    [[60,64,67],[60,64,67],[65,69,72],[67,71,74,79]].forEach((c, i) => {
      const at = t + [0, .16, .32, .6][i];
      chord(at, c, i === 3 ? 1.3 : .14, .05);
    });
    kick(t, .6); kick(t + .6, .7); snare(t + .6, .4);
  }
  function playWin(s, t, dur){
    if(s % 4 === 0) kick(t, .55);
    if(s % 4 === 2) snare(t, .32);
    tick(t, s % 2 ? .03 : .06);
    const b = WIN_BASS[s % 16]; if(b) bass(t, b, dur * .9);
    const m = WIN_LEAD[s % 32]; if(m) lead(t, m, dur * .9);
  }

  function pluck(t, m, len, v){
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = hz(m);
    lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + len);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.001, t + len);
    o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + len + .02);
  }
  function punch(t, v){ kick(t, v); tick(t, v * .25); }   // 쿵 + 딱 (작은 스피커에서도 들리게)

  function play(s, t, dur){
    if(mode === 'win') return playWin(s, t, dur);
    const bar = Math.floor(s / 16) % 4, i = s % 16;
    // 킥: 대기 중엔 심장박동, 게임 중엔 4박
    if(level < 1){ if(i === 0) punch(t, .6); if(i === 2) punch(t, .4); }
    else { if(i % 4 === 0) punch(t, level >= 2 ? .75 : .6); if(level >= 2 && i === 14) punch(t, .45); }
    // 아르페지오 (대기 중엔 작게, 게임 중엔 또렷하게)
    const m = ARP[bar][i % 8];
    pluck(t, m + (level >= 2 && i >= 8 ? 12 : 0), dur * 1.4, level < 1 ? .05 : .09);
    if(level < 1) return;
    // 중음역 베이스 (110Hz대 — 휴대폰에서도 들림)
    if(i % 2 === 0) bass(t, ROOT[bar], dur * 1.8);
    // 초침
    tick(t, i % 2 === 0 ? .09 : .05);
    if(level >= 2) tick(t + dur / 2, .05);
    // 마디 첫 박 스트링 스탭
    if(i === 0) [ROOT[bar] + 24, ROOT[bar] + 31].forEach(n => pluck(t, n, dur * 6, .05));
    // 섬뜩한 고음
    if(i === 8 && bar % 2 === 1) pad(t, PAD[bar], dur * 10);
  }

  function scheduler(){
    const bpm = mode === 'win' ? 150 : level >= 2 ? 138 : level >= 1 ? 116 : 90;
    const dur = mode === 'win' ? 60 / bpm / 2 : 60 / bpm / 4;   // 승리=8분음표, 긴장=16분음표
    while(next < ctx.currentTime + .15){
      play(step, next, dur);
      next += dur; step = (step + 1) % 64;
    }
  }

  function start(){
    if(!ensure()) return;
    if(ctx.state === 'suspended') ctx.resume();
    if(playing) return;
    playing = true; if(mode !== 'win') startDrone();
    next = ctx.currentTime + .05; step = 0;
    if(mode === 'win'){ fanfareAt(ctx.currentTime + .05); next = ctx.currentTime + 1.9; }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(vol, ctx.currentTime + .3);
    timer = setInterval(scheduler, 25);
  }
  function stop(fade = 1.5){
    if(!ctx || !playing) return;
    playing = false;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => { if(!playing){ clearInterval(timer); timer = null; if(drone){ drone.stop(); drone = null; } } }, fade * 1000 + 100);
  }
  return {
    start, stop,
    // 'tense' | 'win' — win으로 바뀌면 팡파레 후 승리 음악
    setMode(m){
      if(m === mode) return; mode = m;
      if(ctx && playing && m === 'win'){ if(drone){ drone.stop(); drone = null; } fanfareAt(ctx.currentTime + .05); next = ctx.currentTime + 1.9; step = 0; }
      if(ctx && playing && m === 'tense') startDrone();
    },
    fanfare(){ if(!ensure()) return; if(ctx.state === 'suspended') ctx.resume();
      const was = master.gain.value; if(!playing){ master.gain.setValueAtTime(vol, ctx.currentTime); setTimeout(() => { if(!playing) master.gain.setValueAtTime(0, ctx.currentTime); }, 2200); }
      fanfareAt(ctx.currentTime + .05); },
    setLevel(l){ level = 1; },   // 참가자·관리자 모두 같은 템포 (빨라지지 않음)
    setVolume(v){ vol = v; if(ctx && playing) master.gain.setTargetAtTime(v, ctx.currentTime, .3); },
    get playing(){ return playing; },
  };
})();
