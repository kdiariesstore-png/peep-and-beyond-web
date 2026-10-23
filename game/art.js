/* Peep & Friends World — painted scenery, illustrated pieces, icons and small drawn helpers. */
(function () {
  const PW = window.PW;
  const W = PW.W, H = PW.H;

  // repeatable randomness so a scene looks the same on every visit
  PW.seeded = function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  /* shared gradients, defined once in the page */
  PW.defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c99464"/><stop offset="1" stop-color="#a06c43"/></linearGradient>
    <linearGradient id="gWoodD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a42"/><stop offset="1" stop-color="#6e4a2e"/></linearGradient>
    <linearGradient id="gBam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fbf5e"/><stop offset=".5" stop-color="#b6dc84"/><stop offset="1" stop-color="#77a64a"/></linearGradient>
    <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd4ec"/><stop offset="1" stop-color="#6fb3d6"/></linearGradient>
    <linearGradient id="gSoil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9b6b45"/><stop offset="1" stop-color="#7a5236"/></linearGradient>
    <radialGradient id="gGlow"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="gStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d3c7"/><stop offset="1" stop-color="#aaa294"/></linearGradient>
  </defs></svg>`;

  /* ---------- small building blocks ---------- */
  const tree = (x, y, s, c1, c2, sway) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-70" width="18" height="74" rx="7" fill="#7b5535"/><g${sway ? ' class="sway"' : ''}><circle cx="0" cy="-95" r="52" fill="${c1 || '#6f9d55'}"/><circle cx="-34" cy="-72" r="34" fill="${c1 || '#6f9d55'}"/><circle cx="34" cy="-70" r="36" fill="${c1 || '#6f9d55'}"/><circle cx="-14" cy="-112" r="26" fill="${c2 || '#8cb96b'}"/><circle cx="20" cy="-90" r="18" fill="${c2 || '#8cb96b'}"/></g></g>`;
  const pine = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-7" y="-22" width="14" height="26" fill="#6b4a2e"/><path d="M0 -150 L48 -60 L28 -62 L60 -18 L-60 -18 L-28 -62 L-48 -60Z" fill="${c || '#4f7a45'}"/><path d="M0 -150 L24 -104 L0 -96Z" fill="#6a9a58" opacity=".7"/></g>`;
  const bush = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-26" cy="-18" r="26" fill="${c || '#7fa563'}"/><circle cx="8" cy="-30" r="32" fill="${c || '#7fa563'}"/><circle cx="38" cy="-16" r="24" fill="${c || '#7fa563'}"/><rect x="-52" y="-18" width="114" height="18" rx="9" fill="${c || '#7fa563'}"/><circle cx="0" cy="-40" r="12" fill="#a3c787" opacity=".7"/></g>`;
  const flower = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-22" stroke="#5f8f4a" stroke-width="3"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-30" rx="5" ry="8" fill="${c}" transform="rotate(${a} 0 -22)"/>`).join('')}<circle cx="0" cy="-22" r="4.5" fill="#ffe08a"/></g>`;
  const tuft = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M-14 0 Q-12 -18 -6 -26 Q-6 -10 0 0 Q2 -22 8 -30 Q6 -10 12 0Z" fill="${c || '#6f9d55'}"/>`;
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fffaf0" opacity=".9"><ellipse cx="0" cy="0" rx="70" ry="26"/><circle cx="-26" cy="-14" r="28"/><circle cx="16" cy="-24" r="34"/></g>`;
  const FCOL = ['#f2a7c3', '#c6b3ec', '#ffd36a', '#ffffff', '#9fd3f0', '#f7b58f'];
  function meadow(rnd, n, y0, y1, x0, x1) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
      s += rnd() < 0.55 ? tuft(x, y, 0.8 + rnd() * 0.7) : flower(x, y, 0.7 + rnd() * 0.5, FCOL[Math.floor(rnd() * FCOL.length)]);
    }
    return s;
  }
  const wrap = (inner) => `<svg class="bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  PW.art = { tree, pine, bush, flower, tuft, cloud, meadow, wrap };

  /* ---------- scenery: painted backgrounds, 1600x900 ---------- */
  const img = (n) => `<img class="bg" src="assets/bg/${n}.webp" alt="" draggable="false">`;
  PW.bg = {};
  ['title', 'map', 'lulu', 'workshop', 'stream', 'garden', 'theater'].forEach((n) => { PW.bg[n] = () => img(n); });

  /* Coco's five exploration scenes; spots are where findable things may sit */
  PW.cocoScenes = [
    { id: 'picnic', spots: [[300, 470], [560, 430], [820, 520], [1080, 450], [1300, 540], [700, 650], [1000, 690], [300, 240], [940, 290], [560, 700]] },
    { id: 'room', spots: [[240, 380], [1100, 190], [1100, 290], [1350, 290], [760, 420], [500, 600], [850, 640], [1200, 600], [1440, 350], [880, 470]] },
    { id: 'lake', spots: [[200, 450], [1340, 450], [600, 420], [900, 560], [1150, 620], [500, 640], [760, 700], [1300, 170], [380, 330], [1500, 600]] },
    { id: 'camp', spots: [[480, 350], [160, 380], [1220, 360], [1480, 410], [600, 520], [880, 600], [1150, 560], [700, 720], [1000, 740], [400, 560]] },
    { id: 'autumn', spots: [[170, 410], [1300, 480], [450, 560], [700, 500], [950, 520], [1200, 560], [600, 680], [900, 700], [1150, 700], [720, 440]] },
  ];
  PW.cocoScenes.forEach((sc) => { sc.draw = () => img(sc.id); });

  /* ---------- UI icons ---------- */
  const st = 'fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"';
  Object.assign(PW.icon, {
    map: `<svg viewBox="0 0 100 100" ${st}><path d="M14 26 L38 16 L62 26 L86 16 V74 L62 84 L38 74 L14 84Z"/><path d="M38 16 V74 M62 26 V84"/></svg>`,
    back: `<svg viewBox="0 0 100 100" ${st}><path d="M58 20 L28 50 L58 80"/></svg>`,
    sound: `<svg viewBox="0 0 100 100" ${st}><path d="M16 40 H32 L52 22 V78 L32 60 H16Z" fill="currentColor"/><path d="M64 36 Q74 50 64 64 M74 26 Q92 50 74 74"/></svg>`,
    soundOff: `<svg viewBox="0 0 100 100" ${st}><path d="M16 40 H32 L52 22 V78 L32 60 H16Z" fill="currentColor"/><path d="M66 38 L88 62 M88 38 L66 62"/></svg>`,
    help: `<svg viewBox="0 0 100 100" ${st}><path d="M30 46 C30 20 70 20 70 42 C70 56 50 56 50 70"/><circle cx="50" cy="84" r="3" fill="currentColor"/></svg>`,
    play: `<svg viewBox="0 0 100 100"><path d="M34 20 L82 50 L34 80Z" fill="currentColor" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/></svg>`,
    pause: `<svg viewBox="0 0 100 100"><rect x="26" y="20" width="16" height="60" rx="5" fill="currentColor"/><rect x="58" y="20" width="16" height="60" rx="5" fill="currentColor"/></svg>`,
    prev: `<svg viewBox="0 0 100 100" ${st}><path d="M62 20 L32 50 L62 80"/></svg>`,
    next: `<svg viewBox="0 0 100 100" ${st}><path d="M38 20 L68 50 L38 80"/></svg>`,
    replay: `<svg viewBox="0 0 100 100" ${st}><path d="M24 50 A28 28 0 1 0 34 28"/><path d="M34 12 V30 H52"/></svg>`,
    house: `<svg viewBox="0 0 100 100" ${st}><path d="M16 48 L50 18 L84 48"/><path d="M26 42 V82 H74 V42"/><path d="M42 82 V60 H58 V82"/></svg>`,
    lock: `<svg viewBox="0 0 100 100"><rect x="22" y="44" width="56" height="44" rx="10" fill="#b8a6d9"/><path d="M34 44 V32 C34 14 66 14 66 32 V44" fill="none" stroke="#8f7cb8" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="64" r="6" fill="#fffaf0"/></svg>`,
    parent: `<svg viewBox="0 0 100 100" ${st}><rect x="24" y="44" width="52" height="40" rx="9"/><path d="M36 44 V32 C36 16 64 16 64 32 V44"/></svg>`,
    box: `<svg viewBox="0 0 100 100"><path d="M12 38 L50 24 L88 38 V78 L50 92 L12 78Z" fill="#c99464"/><path d="M12 38 L50 52 L88 38 M50 52 V92" stroke="#6e4a2e" stroke-width="5" fill="none"/><path d="M12 38 L50 24 L88 38 L50 52Z" fill="#e2b886"/><path d="M50 30 C40 10 24 18 36 30 M50 30 C60 10 76 18 64 30" stroke="#e9a3b3" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`,
    check: `<svg viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"><path d="M22 52 L42 72 L80 30"/></svg>`,
    puzzle: `<svg viewBox="0 0 100 100"><path d="M16 16 H44 C40 4 60 4 56 16 H84 V44 C96 40 96 60 84 56 V84 H56 C60 72 40 72 44 84 H16 V56 C28 60 28 40 16 44Z" fill="currentColor"/></svg>`,
    road: `<svg viewBox="0 0 100 100"><path d="M10 84 C30 40 70 60 90 16" stroke="currentColor" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M10 84 C30 40 70 60 90 16" stroke="#a7744a" stroke-width="4" stroke-dasharray="8 10" fill="none"/></svg>`,
    hammer: `<svg viewBox="0 0 100 100"><rect x="44" y="34" width="13" height="60" rx="6" fill="currentColor"/><path d="M22 18 H72 C80 18 84 26 84 34 H22Z" fill="currentColor"/></svg>`,
    story: `<svg viewBox="0 0 100 100" ${st}><path d="M50 28 C40 20 24 20 14 24 V80 C24 76 40 76 50 84 C60 76 76 76 86 80 V24 C76 20 60 20 50 28Z M50 28 V84"/></svg>`,
    close: `<svg viewBox="0 0 100 100" ${st}><path d="M28 28 L72 72 M72 28 L28 72"/></svg>`,
    film: `<svg viewBox="0 0 100 100" ${st}><rect x="14" y="24" width="72" height="52" rx="8"/><path d="M44 40 L60 50 L44 60Z" fill="currentColor"/></svg>`,
  });

  /* ---------- illustrated pieces (assets/pack, transparent WebP) ---------- */
  const pic = (path, w, h, extra) => `<img src="assets/pack/${path}.webp" alt="" draggable="false" style="width:${w}px;height:${h || w}px;object-fit:contain;display:block;${extra || ''}">`;
  PW.pic = pic;

  /* decor rewards: 18 pieces, 6 from each friend */
  PW.decor = {
    'pink-flower-pot': { src: 'lulu', ar: 'أصيص ورد', en: 'Flower pot', bloom: true },
    'sunflower-pot': { src: 'lulu', ar: 'أصيص دوّار الشمس', en: 'Sunflower pot', bloom: true },
    'little-tree': { src: 'lulu', ar: 'شجرة تفاح صغيرة', en: 'Little apple tree', bloom: true },
    'round-bush': { src: 'lulu', ar: 'شجيرة مستديرة', en: 'Round bush', bloom: true },
    'garden-arch': { src: 'lulu', ar: 'قوس الورد', en: 'Rose arch', bloom: true },
    'watering-can': { src: 'lulu', ar: 'إبريق سقي', en: 'Watering can' },
    'wooden-bench': { src: 'bamboo', ar: 'مقعد خشبي', en: 'Wooden bench', seat: true },
    'white-fence': { src: 'bamboo', ar: 'سور أبيض', en: 'White fence' },
    'bird-house': { src: 'bamboo', ar: 'بيت عصافير', en: 'Birdhouse', bird: true },
    'wooden-sign': { src: 'bamboo', ar: 'لافتة خشبية', en: 'Wooden sign' },
    'stone-path': { src: 'bamboo', ar: 'حجارة الممر', en: 'Stepping stones' },
    'pinwheel': { src: 'bamboo', ar: 'دوّامة الهواء', en: 'Pinwheel' },
    'garden-lantern': { src: 'coco', ar: 'فانوس الحديقة', en: 'Garden lantern' },
    'mushroom': { src: 'coco', ar: 'فطر كبير', en: 'Big mushroom' },
    'butterfly-statue': { src: 'coco', ar: 'تمثال الفراشة', en: 'Butterfly statue' },
    'fountain': { src: 'coco', ar: 'نافورة', en: 'Fountain', bird: true },
    'bird-bath': { src: 'coco', ar: 'حوض العصافير', en: 'Bird bath', bird: true },
    'cushion': { src: 'coco', ar: 'وسادة', en: 'Cushion', seat: true },
  };
  PW.decorSVG = (id, size) => pic('decorations/' + id, size || 120);

  /* findable objects for Coco */
  PW.objects = {
    'blue-cup': { ar: 'كوب', en: 'cup' }, 'blue-kite': { ar: 'طائرة ورقية', en: 'kite' }, 'brass-key': { ar: 'مفتاح', en: 'key' },
    'green-leaf': { ar: 'ورقة شجر', en: 'leaf' }, 'orange-carrot': { ar: 'جزرة', en: 'carrot' }, 'pink-sock': { ar: 'جورب', en: 'sock' },
    'purple-feather': { ar: 'ريشة', en: 'feather' }, 'red-apple': { ar: 'تفاحة', en: 'apple' }, 'red-ball': { ar: 'كرة', en: 'ball' },
    'shell': { ar: 'صَدَفة', en: 'shell' }, 'small-book': { ar: 'كتاب', en: 'book' }, 'teddy-bear': { ar: 'دبدوب', en: 'teddy bear' },
    'toy-car': { ar: 'سيارة لعبة', en: 'toy car' }, 'yellow-star': { ar: 'نجمة', en: 'star' },
  };
  PW.objSVG = (id, size) => pic('coco/' + id, size || 90);

  /* seeds and crops for Lulu; plant sprites share one 240px canvas anchored bottom-centre */
  PW.crops = {
    carrot: { ar: 'جزر', en: 'Carrot' }, strawberry: { ar: 'فراولة', en: 'Strawberry' }, tomato: { ar: 'طماطم', en: 'Tomato' },
    daisy: { ar: 'أقحوان', en: 'Daisy' }, sunflower: { ar: 'دوّار الشمس', en: 'Sunflower' },
  };
  PW.produceSVG = (id, size) => (id === 'carrot' ? pic('coco/orange-carrot', size) : pic(`lulu/${id}-stage-3`, size));
  PW.seedSVG = (id) => pic(`lulu/${id}-seed-bag`, 120, 140);
  PW.plantSVG = (id, stage) => `<img src="assets/pack/lulu/${id}-stage-${stage}.webp" alt="" draggable="false" style="position:absolute;width:270px;height:270px;left:50%;bottom:-18px;transform:translateX(-50%)">`;
  PW.canSVG = pic('decorations/watering-can', 170, 130);

  // older saves used my placeholder pieces; carry them over to the matching illustrated ones
  const OLD = { pot: 'pink-flower-pot', flowerbed: 'round-bush', fruittree: 'little-tree', planter: 'round-bush', sunflower: 'sunflower-pot', tulips: 'pink-flower-pot', bench: 'wooden-bench', fence: 'white-fence', birdhouse: 'bird-house', bridge: 'stone-path', signpost: 'wooden-sign', wagon: 'pinwheel', lantern: 'garden-lantern', bunting: 'pinwheel', stone: 'stone-path', owl: 'butterfly-statue', mushlamp: 'mushroom', tent: 'fountain' };
  (function migrate(S) {
    const fix = (id) => (PW.decor[id] ? id : OLD[id]);
    const inv = {}, given = {};
    Object.keys(S.inv || {}).forEach((k) => { const n = fix(k); if (n) inv[n] = (inv[n] || 0) + S.inv[k]; });
    Object.keys(S.given || {}).forEach((k) => { const n = fix(k); if (n) given[n] = (given[n] || 0) + S.given[k]; });
    S.inv = inv; S.given = given;
    S.garden = (S.garden || []).map((r) => ({ id: fix(r.id), x: r.x, y: r.y })).filter((r) => r.id);
    const c = S.act && S.act.coco;
    if (c && c.targets && c.targets.concat(c.decoys || []).some((o) => !PW.objects[o.id])) S.act.coco = null;
    const l = S.act && S.act.lulu;
    if (l && l.plots) l.plots.forEach((pl) => { if (pl.crop && !PW.crops[pl.crop]) pl.crop = 'sunflower'; });
  })(PW.S);
  PW.basketSVG = `<svg viewBox="0 0 200 150" width="220" height="165"><path d="M30 60 C30 0 170 0 170 60" stroke="#a06c43" stroke-width="12" fill="none"/><path d="M10 60 h180 l-20 80 h-140z" fill="#c99464"/>${[30, 60, 90].map((y) => `<path d="M16 ${60 + y * 0.8} h168" stroke="#a06c43" stroke-width="5"/>`).join('')}${[50, 80, 110, 140].map((x) => `<path d="M${x} 62 l-${x > 100 ? -6 : 6} 76" stroke="#a06c43" stroke-width="5"/>`).join('')}</svg>`;
})();
