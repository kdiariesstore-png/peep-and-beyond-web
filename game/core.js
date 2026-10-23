/* Peep & Friends World — core: save data, language, sound, voice, stage, drag, effects. */
(function () {
  const PW = (window.PW = {});
  const W = 1600, H = 900;
  PW.W = W; PW.H = H;

  /* ---------- save data (kept on this device) ---------- */
  const KEY = 'peepworld.v1';
  const DEFAULTS = {
    lang: 'ar',
    vol: { music: 0.45, sfx: 0.8, voice: 1 },
    calm: false,
    inv: {},          // decor id -> count waiting in the box
    garden: [],       // [{id, x, y}]
    given: {},        // decor id -> times received (for "unowned first")
    greeted: false,
    stories: [],      // single-purchase story ids (simulated)
    sub: null,        // {plan, until} simulated subscription
    storyPos: {},     // story id -> page index
    playLimit: 0,     // minutes, 0 = off
    act: {},          // in-progress activity state
    rotate: {},       // which scene/variant to show next per activity
    downloaded: { peep1: true },
  };
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return Object.assign({}, DEFAULTS, d, { vol: Object.assign({}, DEFAULTS.vol, d.vol || {}) });
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  PW.S = load();
  PW.save = function () { try { localStorage.setItem(KEY, JSON.stringify(PW.S)); } catch (e) {} };
  PW.resetAll = function () { const lang = PW.S.lang; PW.S = JSON.parse(JSON.stringify(DEFAULTS)); PW.S.lang = lang; PW.save(); };

  /* ---------- language ---------- */
  PW.T = { ar: {}, en: {} };
  PW.addText = function (ar, en) { Object.assign(PW.T.ar, ar); Object.assign(PW.T.en, en); };
  PW.t = function (k) { const v = PW.T[PW.S.lang][k]; return v == null ? (PW.T.en[k] || k) : v; };
  PW.applyLang = function () {
    const ar = PW.S.lang === 'ar';
    document.documentElement.lang = PW.S.lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  };

  /* ---------- helpers ---------- */
  PW.$ = (s, r) => (r || document).querySelector(s);
  PW.el = function (html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  PW.rand = (a, b) => a + Math.random() * (b - a);
  PW.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  PW.shuffle = function (a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  PW.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  PW.place = function (node, x, y) { node.style.left = x + 'px'; node.style.top = y + 'px'; return node; };
  PW.dist = (a, b, c, d) => Math.hypot(a - c, b - d);

  /* ---------- stage scaling ---------- */
  let scale = 1;
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / W, vh / H);
    const st = PW.$('#stage');
    st.style.transform = `translate(${(vw - W * scale) / 2}px, ${(vh - H * scale) / 2}px) scale(${scale})`;
  }
  PW.toStage = function (cx, cy) {
    const r = PW.$('#stage').getBoundingClientRect();
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
  };
  PW.centerOf = function (node) {
    const r = node.getBoundingClientRect(), s = PW.$('#stage').getBoundingClientRect();
    return { x: (r.left + r.width / 2 - s.left) / scale, y: (r.top + r.height / 2 - s.top) / scale };
  };

  /* ---------- sound (synthesised, no files needed) ---------- */
  const Snd = (PW.Snd = { ctx: null });
  Snd.init = function () {
    if (Snd.ctx) { if (Snd.ctx.state === 'suspended') Snd.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (Snd.ctx = new AC());
    Snd.master = ctx.createGain(); Snd.master.connect(ctx.destination);
    Snd.musicGain = ctx.createGain(); Snd.musicGain.connect(Snd.master);
    Snd.sfxGain = ctx.createGain(); Snd.sfxGain.connect(Snd.master);
    Snd.levels();
    const len = ctx.sampleRate * 1.5;
    Snd.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = Snd.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Snd.startMusic();
  };
  Snd.levels = function () {
    if (!Snd.ctx) return;
    const v = PW.S.vol, t = Snd.ctx.currentTime;
    Snd.musicGain.gain.setTargetAtTime(v.music * 0.32, t, 0.2);
    Snd.sfxGain.gain.setTargetAtTime(v.sfx * 0.7, t, 0.05);
  };
  function tone(f, dur, opt) {
    const ctx = Snd.ctx; if (!ctx) return;
    opt = opt || {};
    const t = ctx.currentTime + (opt.at || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
    const v = opt.vol == null ? 0.3 : opt.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (opt.attack || 0.015));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(opt.dest || Snd.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, opt) {
    const ctx = Snd.ctx; if (!ctx) return;
    opt = opt || {};
    const t = ctx.currentTime + (opt.at || 0);
    const s = ctx.createBufferSource(); s.buffer = Snd.noise; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = opt.ftype || 'bandpass'; f.frequency.value = opt.freq || 1200; f.Q.value = opt.q || 1;
    const g = ctx.createGain(); const v = opt.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (opt.attack || 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(opt.dest || Snd.sfxGain);
    s.start(t); s.stop(t + dur + 0.1);
  }
  Snd.play = function (name) {
    if (!Snd.ctx) return;
    switch (name) {
      case 'tap': tone(660, 0.12, { type: 'triangle', vol: 0.18, to: 880 }); break;
      case 'pop': tone(420, 0.16, { type: 'sine', vol: 0.3, to: 900 }); break;
      case 'drop': tone(520, 0.1, { type: 'triangle', vol: 0.22 }); tone(780, 0.18, { type: 'sine', vol: 0.18, at: 0.07 }); break;
      case 'back': tone(380, 0.22, { type: 'sine', vol: 0.12, to: 300 }); break;
      case 'whoosh': noise(0.4, { freq: 900, q: 0.7, vol: 0.12, attack: 0.15 }); break;
      case 'water': for (let i = 0; i < 9; i++) tone(PW.rand(900, 1600), 0.08, { type: 'sine', vol: 0.08, at: i * 0.11, to: PW.rand(400, 700) }); noise(1.1, { freq: 2500, q: 0.6, vol: 0.05, attack: 0.2 }); break;
      case 'dig': noise(0.18, { freq: 300, q: 0.8, vol: 0.3, ftype: 'lowpass' }); noise(0.18, { freq: 260, q: 0.8, vol: 0.25, ftype: 'lowpass', at: 0.16 }); break;
      case 'grow': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.12, at: i * 0.16 })); break;
      case 'chime': [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.6, { type: 'sine', vol: 0.14, at: i * 0.09 })); break;
      case 'found': tone(880, 0.2, { type: 'sine', vol: 0.2 }); tone(1320, 0.4, { type: 'sine', vol: 0.16, at: 0.1 }); break;
      case 'snap': tone(300, 0.07, { type: 'square', vol: 0.06 }); tone(640, 0.15, { type: 'triangle', vol: 0.2, at: 0.04 }); break;
      case 'tada': [523, 659, 784].forEach((f) => tone(f, 1.1, { type: 'triangle', vol: 0.1, attack: 0.03 })); [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.5, { type: 'sine', vol: 0.1, at: 0.25 + i * 0.1 })); break;
      case 'step': noise(0.07, { freq: 500, q: 1.2, vol: 0.08, ftype: 'lowpass' }); break;
      case 'bird': { const b = PW.rand(2200, 3200); for (let i = 0; i < 3; i++) tone(b, 0.09, { type: 'sine', vol: 0.05, at: i * 0.13, to: b * 1.3 }); break; }
      case 'bloom': tone(1200, 0.25, { type: 'sine', vol: 0.06, to: 1800 }); break;
      case 'soft': tone(500, 0.1, { type: 'sine', vol: 0.06 }); break;
    }
  };
  // gentle pentatonic music box + birds; never loops loudly
  Snd.startMusic = function () {
    const ctx = Snd.ctx; if (!ctx || Snd.musicTimer) return;
    const scaleHz = [392, 440, 523.25, 587.33, 659.25, 784, 880];
    const chords = [[196, 293.66], [174.61, 261.63], [220, 329.63], [164.81, 246.94]];
    let beat = 0, next = ctx.currentTime + 0.3;
    Snd.musicTimer = setInterval(() => {
      if (document.hidden) return;
      while (next < ctx.currentTime + 0.6) {
        const at = next - ctx.currentTime;
        if (beat % 8 === 0) chords[(beat / 8) % 4].forEach((f) => tone(f, 3.6, { type: 'sine', vol: 0.09, attack: 0.6, at, dest: Snd.musicGain }));
        if (Math.random() < 0.55) tone(PW.pick(scaleHz), 1.3, { type: 'triangle', vol: 0.07, attack: 0.02, at, dest: Snd.musicGain });
        if (Math.random() < 0.03) { const b = PW.rand(2400, 3400); for (let i = 0; i < 3; i++) tone(b, 0.08, { type: 'sine', vol: 0.025, at: at + i * 0.12, to: b * 1.25, dest: Snd.musicGain }); }
        beat = (beat + 1) % 32; next += 0.46;
      }
    }, 150);
  };

  /* ---------- voice (temporary: device text-to-speech until the cast is recorded) ---------- */
  const VOICES = { peep: { pitch: 1.55, rate: 1.02 }, lulu: { pitch: 1.75, rate: 0.98 }, bamboo: { pitch: 0.85, rate: 0.92 }, coco: { pitch: 1.3, rate: 1.08 }, fifi: { pitch: 1.12, rate: 0.9 } };
  PW.speak = function (text, who, onend) {
    const ss = window.speechSynthesis;
    if (!ss || PW.S.vol.voice <= 0.01) { if (onend) setTimeout(onend, 600 + text.length * 55); return; }
    try {
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const lang = PW.S.lang === 'ar' ? 'ar' : 'en';
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      const vs = ss.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
      if (vs.length) u.voice = vs.find((v) => /female|zira|samantha|hoda|laila|salma/i.test(v.name)) || vs[0];
      const p = VOICES[who] || VOICES.peep;
      u.pitch = p.pitch; u.rate = p.rate; u.volume = PW.S.vol.voice;
      let done = false; const fin = () => { if (!done) { done = true; if (onend) onend(); } };
      u.onend = fin; u.onerror = fin;
      ss.speak(u);
      if (onend) setTimeout(fin, 2500 + text.length * 120);
    } catch (e) { if (onend) setTimeout(onend, 1500); }
  };
  PW.hush = function () { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} };

  // speech bubble + voice; never stacks: a new line replaces the old one
  let bubbleNode = null, bubbleTimer = 0;
  PW.say = function (who, key, opts) {
    opts = opts || {};
    const text = opts.raw || PW.t(key);
    if (bubbleNode) bubbleNode.remove();
    endTalk();
    clearTimeout(bubbleTimer);
    const b = PW.el(`<div class="bubble"><span class="who" style="background-image:url(assets/chars/${who === 'peep' ? 'peep' : who}.webp)"></span>${text}</div>`);
    let x = opts.x, y = opts.y;
    if (x == null && opts.anchor) { const c = PW.centerOf(opts.anchor); const r = opts.anchor.getBoundingClientRect(); x = c.x; y = c.y - (r.height / 2) / (scale || 1) - 10; }
    if (x == null) { x = W / 2; y = 200; }
    x = Math.max(300, Math.min(W - 300, x)); y = Math.max(150, y);
    PW.place(b, x, y);
    PW.$('#fx').appendChild(b);
    bubbleNode = b;
    PW.lastLine = { who, key, opts };
    PW.speak(text, who);
    const speaker = [...document.querySelectorAll('#scene .ch')].find((c) => c.base === who && !who.startsWith('peep'));
    if (speaker) { speaker.pose(who + '-talking'); talking = speaker; }
    bubbleTimer = setTimeout(() => { if (bubbleNode === b) { b.remove(); bubbleNode = null; endTalk(); } }, opts.ms || 3200 + text.length * 45);
  };
  PW.clearBubble = function () { if (bubbleNode) bubbleNode.remove(); bubbleNode = null; endTalk(); };
  let talking = null;
  function endTalk() { if (talking) { talking.pose(); talking = null; } }

  /* ---------- characters ---------- */
  const CH_FILE = { peep: 'peep', 'peep-run': 'peep-run', 'peep-wave': 'peep-wave', 'peep-sit': 'peep-sit', 'peep-walk': 'peep-walk', 'peep-jump': 'peep-jump', lulu: 'lulu', bamboo: 'bamboo', coco: 'coco', fifi: 'fifi' };
  ['lulu', 'bamboo', 'coco', 'fifi'].forEach((f) => { CH_FILE[f + '-happy'] = f + '-happy'; CH_FILE[f + '-talking'] = f + '-talking'; });
  // sitting poses are drawn at a different size than standing; keep each friend's head the same size across poses
  const POSE_SCALE = { 'bamboo-happy': 0.84, 'bamboo-talking': 0.84, 'coco-happy': 1.2, 'coco-talking': 1.2, 'fifi-happy': 1.04, 'fifi-talking': 1.04 };
  PW.char = function (name, x, y, h, flip) {
    const n = PW.el(`<div class="ch${flip ? ' flip' : ''}" style="height:${h}px"><div class="flipwrap"><div class="bob"><img src="assets/chars/${CH_FILE[name]}.webp" alt=""></div></div></div>`);
    PW.place(n, x, y);
    n.style.zIndex = Math.round(y / 10);
    n.base = name;
    n.pose = function (p) {
      const f = CH_FILE[p || n.base], img = n.querySelector('img');
      img.src = `assets/chars/${f}.webp`;
      img.style.height = (POSE_SCALE[f] || 1) * 100 + '%';
    };
    n.anim = function (cls, ms) {
      n.classList.remove('hop', 'cheer'); void n.offsetWidth; n.classList.add(cls);
      const leap = cls === 'hop' && n.base === 'peep';
      if (leap) n.pose('peep-jump');
      setTimeout(() => { n.classList.remove(cls); if (leap) n.pose(); }, ms || 700);
    };
    return n;
  };
  // walk a character to a point; flowers may bloom on the way (Peep's magic)
  PW.walkTo = function (node, x, y, opts) {
    opts = opts || {};
    return new Promise((res) => {
      const sx = parseFloat(node.style.left), sy = parseFloat(node.style.top);
      const d = PW.dist(sx, sy, x, y);
      if (d < 4) return res();
      const dur = opts.dur || Math.max(500, d * 2.4);
      if (Math.abs(x - sx) > 10) node.classList.toggle('flip', x < sx);
      node.classList.add('walk');
      const t0 = performance.now(); let lastBloom = 0, lastStep = 0, step = false;
      const frames = node.base === 'peep'; // Peep alternates his standing and stepping poses
      (function f(now) {
        const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const cx = sx + (x - sx) * e, cy = sy + (y - sy) * e;
        PW.place(node, cx, cy); node.style.zIndex = Math.round(cy / 10);
        if (opts.bloom && now - lastBloom > 260) { lastBloom = now; PW.bloomAt(cx + PW.rand(-30, 30), cy - PW.rand(0, 10)); }
        if (now - lastStep > 190) { lastStep = now; step = !step; if (frames) node.pose(step ? 'peep-walk' : 'peep'); if (step) PW.Snd.play('step'); }
        if (k < 1) requestAnimationFrame(f); else { node.classList.remove('walk'); if (frames) node.pose(); res(); }
      })(t0);
    });
  };

  /* ---------- effects ---------- */
  const FLOWER_COLORS = ['#f2a7c3', '#c6b3ec', '#ffd36a', '#9fd3f0', '#f7b58f'];
  PW.flowerSVG = function (c) {
    c = c || PW.pick(FLOWER_COLORS);
    return `<svg viewBox="0 0 40 40"><g fill="${c}">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="10" rx="7" ry="10" transform="rotate(${a} 20 20)"/>`).join('')}</g><circle cx="20" cy="20" r="6" fill="#ffe9a8"/><circle cx="20" cy="20" r="3" fill="#f3b63a"/></svg>`;
  };
  PW.bloomAt = function (x, y) {
    if (PW.S.calm) return;
    const b = PW.el(`<div class="bloom">${PW.flowerSVG()}</div>`);
    PW.place(b, x, y); PW.$('#fx').appendChild(b);
    PW.Snd.play('bloom');
    setTimeout(() => b.remove(), 2700);
  };
  PW.sparkle = function (x, y, n) {
    n = n || 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = PW.rand(60, 130);
      const s = PW.el(`<svg class="spark" viewBox="0 0 20 20" style="--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px"><path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5Z" fill="${i % 2 ? '#ffe17a' : '#fff6cf'}"/></svg>`);
      PW.place(s, x, y); PW.$('#fx').appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  };
  PW.petals = function (n) {
    if (PW.S.calm) n = Math.min(n || 26, 8);
    for (let i = 0; i < (n || 26); i++) {
      const p = PW.el(`<div class="petal" style="--t:${PW.rand(3, 5.5)}s;--sx:${PW.rand(-160, 160)}px;--r:${PW.rand(-300, 300)}deg;animation-delay:${PW.rand(0, 1.4)}s">${PW.flowerSVG()}</div>`);
      p.style.left = PW.rand(40, W - 40) + 'px';
      PW.$('#fx').appendChild(p);
      setTimeout(() => p.remove(), 7200);
    }
  };
  PW.fireflies = function (host, n, box) {
    box = box || [0, 0, W, H];
    for (let i = 0; i < n; i++) {
      const f = PW.el(`<div class="firefly" style="--t:${PW.rand(3, 7)}s;--dx:${PW.rand(-80, 80)}px;--dy:${PW.rand(-60, 60)}px;animation-delay:-${PW.rand(0, 6)}s"></div>`);
      PW.place(f, PW.rand(box[0], box[2]), PW.rand(box[1], box[3]));
      host.appendChild(f);
    }
  };
  PW.butterflies = function (host, n, box) {
    box = box || [100, 120, W - 300, 500];
    const cols = ['#c6b3ec', '#f2a7c3', '#ffd36a', '#9fd3f0'];
    for (let i = 0; i < n; i++) {
      const c = cols[i % cols.length];
      const f = PW.el(`<div class="bfly" style="--t:${PW.rand(9, 15)}s;--dx:${PW.rand(120, 260)}px;--dy:${PW.rand(30, 80)}px;animation-delay:-${PW.rand(0, 8)}s"><svg viewBox="0 0 40 40"><ellipse cx="13" cy="16" rx="10" ry="12" fill="${c}"/><ellipse cx="27" cy="16" rx="10" ry="12" fill="${c}"/><ellipse cx="14" cy="29" rx="7" ry="7" fill="${c}" opacity=".85"/><ellipse cx="26" cy="29" rx="7" ry="7" fill="${c}" opacity=".85"/><rect x="18.8" y="10" width="2.4" height="24" rx="1.2" fill="#5b4433"/></svg></div>`);
      PW.place(f, PW.rand(box[0], box[2]), PW.rand(box[1], box[3]));
      host.appendChild(f);
    }
  };

  /* pointing hand for idle hints (moves from a to b when given two points) */
  PW.handSVG = `<svg viewBox="0 0 100 100"><path d="M38 12c5 0 8 4 8 9v28l3-1c4-1 8 0 9 4l1 2 2-1c4-1 8 1 9 5l1 2c4-1 8 1 9 5l4 17c2 9-4 18-13 19l-22 1c-6 0-11-3-14-8L22 66c-2-4 0-8 4-9 3-1 6 0 8 3l-4-1V21c0-5 3-9 8-9z" fill="#fff6e6" stroke="#6e4a2e" stroke-width="4" stroke-linejoin="round"/></svg>`;
  let handNode = null;
  PW.showHand = function (x, y, x2, y2) {
    PW.hideHand();
    const hnd = PW.el(`<div class="hand">${PW.handSVG}</div>`);
    PW.place(hnd, x, y); PW.$('#fx').appendChild(hnd); handNode = hnd;
    if (x2 != null) {
      hnd.classList.add('move');
      const loop = () => { if (handNode !== hnd) return; PW.place(hnd, x, y); setTimeout(() => { if (handNode === hnd) PW.place(hnd, x2, y2); }, 350); setTimeout(loop, 2400); };
      loop();
    }
    setTimeout(() => { if (handNode === hnd) PW.hideHand(); }, 6000);
  };
  PW.hideHand = function () { if (handNode) handNode.remove(); handNode = null; };

  /* idle helper: calls fn after a quiet period; any touch restarts the clock */
  let idleTimer = 0, idleFn = null, idleMs = 9000;
  PW.onIdle = function (fn, ms) { idleFn = fn; idleMs = ms || 9000; PW.poke(); };
  PW.poke = function () { clearTimeout(idleTimer); if (idleFn) idleTimer = setTimeout(() => { if (idleFn) idleFn(); PW.poke(); }, idleMs); };

  /* ---------- drag, with "tap item, then tap where it goes" as an alternative ---------- */
  let selected = null;
  PW.clearSelection = function () { if (selected) selected.node.classList.remove('selected'); selected = null; PW.$('#stage').querySelectorAll('.target-glow').forEach((n) => n.classList.remove('target-glow')); };
  // opts.drop(x, y, node) -> true if accepted. opts.home {x,y}. opts.onPick(), opts.glow -> nodes to highlight when selected
  PW.draggable = function (node, opts) {
    node.classList.add('drag');
    node._home = opts.home || { x: parseFloat(node.style.left), y: parseFloat(node.style.top) };
    let start = null, moved = false, off = { x: 0, y: 0 }, pid = null;
    node.addEventListener('pointerdown', (e) => {
      if (node._locked) return;
      e.preventDefault(); e.stopPropagation(); PW.poke(); PW.hideHand();
      pid = e.pointerId; try { node.setPointerCapture(pid); } catch (er) {}
      const p = PW.toStage(e.clientX, e.clientY);
      start = p; moved = false;
      off = { x: parseFloat(node.style.left) - p.x, y: parseFloat(node.style.top) - p.y };
    });
    node.addEventListener('pointermove', (e) => {
      if (!start || e.pointerId !== pid) return;
      const p = PW.toStage(e.clientX, e.clientY);
      if (!moved && PW.dist(p.x, p.y, start.x, start.y) > 12) {
        moved = true; PW.clearSelection(); node.classList.add('dragging');
        if (opts.onPick) opts.onPick(node); PW.Snd.play('tap');
      }
      if (moved) PW.place(node, p.x + off.x, p.y + off.y);
    });
    const end = (e) => {
      if (!start || e.pointerId !== pid) return;
      const p = PW.toStage(e.clientX, e.clientY);
      start = null;
      if (moved) {
        node.classList.remove('dragging');
        const x = parseFloat(node.style.left), y = parseFloat(node.style.top);
        if (!opts.drop(x, y, node, p)) PW.goHome(node);
      } else {
        // tap: select for tap-to-place
        if (selected && selected.node === node) { PW.clearSelection(); return; }
        PW.clearSelection();
        selected = { node, opts };
        node.classList.add('selected'); PW.Snd.play('tap');
        if (opts.glow) opts.glow().forEach((n) => n && n.classList.add('target-glow'));
        if (opts.onSelect) opts.onSelect(node);
      }
    };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', (e) => { if (start) { start = null; node.classList.remove('dragging'); PW.goHome(node); } });
    return node;
  };
  PW.goHome = function (node) { PW.Snd.play('back'); PW.place(node, node._home.x, node._home.y); if (node._onHome) node._onHome(node); };
  // a tap anywhere on the stage completes a pending tap-to-place
  function stageTap(e) {
    PW.poke();
    if (!selected) return;
    if (e.target.closest('.drag') || e.target.closest('.wbtn')) return;
    const p = PW.toStage(e.clientX, e.clientY);
    const s = selected; PW.clearSelection(); PW.tapConsumed = Date.now();
    const node = s.node;
    const ok = s.opts.drop(p.x, p.y, node, p, true);
    if (!ok) PW.Snd.play('soft');
  }

  /* ---------- scenes & HUD ---------- */
  PW.scenes = {};
  PW.cur = null;
  let leaving = false;
  PW.go = async function (name, arg) {
    if (leaving) return;
    leaving = true;
    const curtain = PW.$('#curtain');
    curtain.classList.add('on');
    await PW.wait(330);
    PW.hush(); PW.clearBubble(); PW.hideHand(); PW.clearSelection(); PW.onIdle(null);
    if (PW.cur && PW.cur.leave) PW.cur.leave();
    PW.timers.forEach(clearTimeout); PW.timers = [];
    PW.$('#scene').innerHTML = ''; PW.$('#fx').innerHTML = ''; PW.$('#ui').innerHTML = ''; PW.closeModal();
    const sc = PW.scenes[name];
    sc.name = name; sc.hudOverride = null;
    PW.cur = sc;
    PW.curArg = arg;
    sc.enter(PW.$('#scene'), arg);
    PW.hud(sc.hudOverride || sc.hud || []);
    curtain.classList.remove('on');
    leaving = false;
  };
  PW.timers = [];
  PW.later = function (fn, ms) { const id = setTimeout(fn, ms); PW.timers.push(id); return id; };

  PW.icon = {};
  PW.btn = function (cls, iconName, label, onClick, x, y) {
    const b = PW.el(`<button class="wbtn ${cls || ''}" aria-label="${label || ''}">${PW.icon[iconName] || ''}${label && cls.includes('lbl-on') ? `<span class="lbl">${label}</span>` : ''}</button>`);
    if (x != null) { b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.transform = 'translate(-50%,-50%)'; }
    b.addEventListener('click', (e) => { e.stopPropagation(); PW.Snd.init(); PW.Snd.play('pop'); PW.poke(); onClick(e); });
    return b;
  };
  PW.hud = function (items) {
    const ui = PW.$('#ui');
    if (items.includes('map')) { const b = PW.btn('', 'map', PW.t('map'), () => PW.go('map')); b.id = 'hud-map'; ui.appendChild(b); }
    if (items.includes('back')) { const b = PW.btn('', 'back', PW.t('back'), () => PW.cur.back()); b.id = 'hud-map'; ui.appendChild(b); }
    if (items.includes('sound')) {
      const b = PW.btn('', PW.muted() ? 'soundOff' : 'sound', PW.t('sound'), () => {
        const m = !PW.muted();
        if (m) { PW.S.vol._prev = { m: PW.S.vol.music, s: PW.S.vol.sfx, v: PW.S.vol.voice }; PW.S.vol.music = PW.S.vol.sfx = PW.S.vol.voice = 0; PW.hush(); }
        else { const p = PW.S.vol._prev || { m: 0.45, s: 0.8, v: 1 }; PW.S.vol.music = p.m; PW.S.vol.sfx = p.s; PW.S.vol.voice = p.v; }
        PW.save(); PW.Snd.levels();
        b.innerHTML = PW.icon[PW.muted() ? 'soundOff' : 'sound'];
      });
      b.id = 'hud-sound'; ui.appendChild(b);
    }
    if (items.includes('help')) {
      const b = PW.btn('', 'help', PW.t('help'), () => { if (PW.cur && PW.cur.help) PW.cur.help(); else if (PW.lastLine) PW.say(PW.lastLine.who, PW.lastLine.key, PW.lastLine.opts); });
      b.id = 'hud-help'; ui.appendChild(b);
    }
  };
  PW.muted = () => PW.S.vol.music + PW.S.vol.sfx + PW.S.vol.voice < 0.01;

  /* ---------- modal ---------- */
  PW.openModal = function (inner) {
    const m = PW.$('#modal');
    m.innerHTML = ''; m.classList.add('open');
    m.appendChild(PW.el('<div class="scrim"></div>'));
    if (inner) m.appendChild(inner);
    return m;
  };
  PW.closeModal = function () { const m = PW.$('#modal'); m.innerHTML = ''; m.classList.remove('open'); };

  /* ---------- play-time reminder ---------- */
  let playStart = Date.now(), reminded = false;
  PW.resetPlayClock = function () { playStart = Date.now(); reminded = false; };
  setInterval(() => {
    if (!PW.S.playLimit || reminded || !PW.cur || PW.cur.name === 'parents') return;
    if (Date.now() - playStart > PW.S.playLimit * 60000) { reminded = true; PW.restReminder && PW.restReminder(); }
  }, 5000);

  /* ---------- boot ---------- */
  PW.boot = function () {
    document.body.insertAdjacentHTML('beforeend', PW.defs);
    ['peep', 'peep-walk', 'peep-jump', 'peep-run', 'peep-sit', 'peep-wave'].forEach((f) => { new Image().src = `assets/chars/${f}.webp`; });
    PW.applyLang();
    document.body.classList.toggle('calm', !!PW.S.calm);
    fit();
    window.addEventListener('resize', fit);
    PW.$('#stage').addEventListener('pointerup', stageTap);
    PW.$('#stage').addEventListener('pointerdown', () => PW.Snd.init(), { once: false });
    document.addEventListener('visibilitychange', () => { if (PW.Snd.ctx) { if (document.hidden) PW.Snd.ctx.suspend(); else PW.Snd.ctx.resume(); } });
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
    const start = () => PW.go('title');
    if (window.claude && window.claude.hot) {
      window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ scene: PW.cur && PW.cur.name }));
      window.claude.hot.ready ? window.claude.hot.ready(start) : start();
    } else start();
  };
})();
