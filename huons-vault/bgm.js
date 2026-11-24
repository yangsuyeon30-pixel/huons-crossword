// 긴장감 있는 배경음악 — 음원 파일 없이 Web Audio로 실시간 생성
// level 0: 대기(저음 드론 + 심장박동) / 1: 게임 중(베이스·초침·고음 추가) / 2: 막판(템포 업)
window.VaultBGM = (function(){
  let ctx = null, master = null, noiseBuf = null, drone = null, timer = null;
  let next = 0, step = 0, level = 0, playing = false, vol = .32;

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // A단조 베이스 패턴 (16스텝, 0 = 쉼)
  const BASS = [33,0,33,36, 33,0,40,39, 33,0,33,36, 31,0,32,0];
  const PAD  = [76, 77, 76, 72];   // E5 F5 E5 C5 — 반음 충돌로 불안감

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
    const g = ctx.createGain(); g.gain.value = .07;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 6;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .07; lfoG.gain.value = 90;
    lfo.connect(lfoG).connect(lp.frequency);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = o2.type = 'sawtooth'; o1.frequency.value = 55; o2.frequency.value = 55.35;
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

  function play(s, t, dur){
    // 심장 박동 (쿵-쿵)
    if(s % 8 === 0) kick(t, level >= 2 ? .55 : .42);
    if(s % 8 === 1) kick(t, level >= 2 ? .35 : .25);
    if(level < 1) return;
    // 초침
    tick(t, s % 2 === 0 ? .05 : .025);
    if(level >= 2) tick(t + dur / 2, .03);
    // 베이스
    const m = BASS[s % 16];
    if(m) bass(t, m, dur * 1.6);
    if(m && level >= 2) bass(t, m + 12, dur * .8);
    // 섬뜩한 고음
    if(s % 16 === 0) pad(t, PAD[(s / 16) % PAD.length], dur * 14);
  }

  function scheduler(){
    const bpm = level >= 2 ? 132 : level >= 1 ? 104 : 72;
    const dur = 60 / bpm / 2;   // 8분음표
    while(next < ctx.currentTime + .15){
      play(step, next, dur);
      next += dur; step = (step + 1) % 64;
    }
  }

  function start(){
    if(!ensure()) return;
    if(ctx.state === 'suspended') ctx.resume();
    if(playing) return;
    playing = true; startDrone();
    next = ctx.currentTime + .05; step = 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);
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
    setLevel(l){ level = l; },
    setVolume(v){ vol = v; if(ctx && playing) master.gain.setTargetAtTime(v, ctx.currentTime, .3); },
    get playing(){ return playing; },
  };
})();
