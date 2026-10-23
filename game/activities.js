/* Peep & Friends World — Lulu's garden, Bamboo's workshop, Coco's adventures. Same gentle difficulty every time. */
(function () {
  const PW = window.PW;

  PW.addText({
    luluHello: 'لنزرع هذه البذرة!', luluCover: 'غطِّها بالتراب.', luluWater: 'حان وقت السقي!', luluLook: 'انظر إلى محصولنا!', luluPick: 'اجمع المحصول في السلة.', luluDone: 'سلة مليئة! شكرًا يا بيب!', luluSeedFirst: 'اختر بذرة أولًا.',
    bambooHello: 'أهلًا بيب! ماذا نصنع اليوم؟', bambooPick: 'اختر واحدة.', puzzleGo: 'ضع كل قطعة في مكانها.', roadGo: 'لنصلِ الطريق!', buildGo: 'لنبنِ معًا!', bambooDone: 'رائع! عمل جميل!',
    puzzle: 'بازل', road: 'طرق', build: 'بناء',
    cocoHello: 'لنبحث معًا! هل تجد هذه الأشياء؟', cocoHint: 'انظر هنا!', cocoDone: 'وجدناها كلها! مغامرة رائعة!', hint: 'تلميح',
  }, {
    luluHello: "Let's plant this seed!", luluCover: 'Cover it with soil.', luluWater: 'Time to water!', luluLook: 'Look at our harvest!', luluPick: 'Put the harvest in the basket.', luluDone: 'A full basket! Thank you, Peep!', luluSeedFirst: 'Pick a seed first.',
    bambooHello: 'Hello Peep! What shall we make today?', bambooPick: 'Pick one.', puzzleGo: 'Put each piece in its place.', roadGo: "Let's join the road!", buildGo: "Let's build together!", bambooDone: 'Wonderful! Great work!',
    puzzle: 'Puzzle', road: 'Roads', build: 'Build',
    cocoHello: "Let's search together! Can you find these things?", cocoHint: 'Look here!', cocoDone: 'We found them all! What an adventure!', hint: 'Hint',
  });

  const act = (k) => (PW.S.act[k] = PW.S.act[k] || {});

  /* ================= Lulu's garden ================= */
  const PLOTS = [[560, 455], [900, 455], [1240, 455]];
  const SEEDS = ['carrot', 'strawberry', 'tomato', 'daisy', 'sunflower'];
  PW.scenes.lulu = {
    hud: ['map', 'sound', 'help'],
    enter(root) {
      root.innerHTML = PW.bg.lulu();
      PW.butterflies(root, 3, [500, 200, 1300, 420]);
      const st = act('lulu');
      if (!st.plots) { st.plots = PLOTS.map(() => ({ stage: 'empty' })); st.harvested = 0; }
      st.plots.forEach((p) => { if (p.stage === 'growing') p.stage = 'ripe'; });
      this.st = st;
      const lulu = PW.char('lulu', 190, 865, 330);
      const peep = PW.char('peep', 1500, 880, 210, true);
      root.append(lulu, peep);
      this.lulu = lulu; this.peep = peep;

      const basket = PW.el(`<div class="c" style="left:470px;top:790px;z-index:80">${PW.basketSVG}<div class="abs" style="left:30px;top:20px;width:160px;height:60px"></div></div>`);
      root.appendChild(basket);
      this.basket = basket;
      this.basketFill = basket.querySelector('div');
      for (let i = 0; i < st.harvested; i++) this.addToBasket(PW.pick(SEEDS), false);

      // plots
      this.plotNodes = PLOTS.map(([x, y], i) => {
        const n = PW.el(`<div class="c" style="left:${x}px;top:${y}px;width:200px;height:240px;z-index:30;cursor:pointer" role="button">
          <svg class="abs" viewBox="0 0 200 80" width="200" height="80" style="left:0;bottom:0"><ellipse cx="100" cy="46" rx="88" ry="28" fill="#5b3c25"/><ellipse cx="100" cy="40" rx="80" ry="22" fill="#4a3020"/></svg>
          <div class="abs plant" style="left:20px;bottom:24px;width:160px;height:200px"></div></div>`);
        n.addEventListener('click', () => this.tapPlot(i));
        root.appendChild(n);
        return n;
      });
      this.plotNodes.forEach((_, i) => this.drawPlot(i));

      // seed shelf
      root.appendChild(PW.el('<div class="tray" style="left:520px;top:70px;width:740px;height:190px"></div>'));
      this.seedNodes = SEEDS.map((id, i) => {
        const n = PW.el(`<div style="z-index:35"><div>${PW.seedSVG(id)}</div></div>`);
        PW.place(n, 600 + i * 145, 165); root.appendChild(n);
        PW.draggable(n, {
          glow: () => this.plotNodes.filter((_, k) => this.st.plots[k].stage === 'empty'),
          drop: (x, y) => this.dropSeed(id, x, y),
        });
        return n;
      });

      // watering can
      const can = PW.el(`<div style="z-index:36"><div>${PW.canSVG}</div></div>`);
      PW.place(can, 1020, 790); root.appendChild(can);
      this.can = can;
      PW.draggable(can, {
        glow: () => this.plotNodes.filter((_, k) => ['seeded', 'covered'].includes(this.st.plots[k].stage)),
        drop: (x, y) => this.dropCan(x, y),
      });

      PW.later(() => PW.say('lulu', 'luluHello', { anchor: lulu }), 500);
      PW.onIdle(() => this.help(true), 10000);
    },
    nearest(x, y, stages) {
      let best = -1, bd = 170;
      PLOTS.forEach(([px, py], i) => { const d = PW.dist(x, y, px, py - 40); if (d < bd && stages.includes(this.st.plots[i].stage)) { bd = d; best = i; } });
      return best;
    },
    drawPlot(i) {
      const p = this.st.plots[i], host = this.plotNodes[i].querySelector('.plant');
      if (p.stage === 'empty') host.innerHTML = '';
      else if (p.stage === 'seeded') host.innerHTML = `<svg viewBox="0 0 160 200" width="160" height="200"><g fill="#e8d3a8">${[[64, 176], [80, 182], [96, 175], [72, 186], [90, 188]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.5"/>`).join('')}</g></svg>`;
      else if (p.stage === 'covered') host.innerHTML = `<svg viewBox="0 0 160 200" width="160" height="200"><path d="M24 196 C40 160 120 160 136 196Z" fill="#8a5d3b"/><path d="M50 182 q10 -6 20 0 M86 178 q10 -6 20 0" stroke="#6e4a2e" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
      else if (p.stage === 'ripe') host.innerHTML = PW.plantSVG(p.crop, 3);
    },
    dropSeed(id, x, y) {
      const i = this.nearest(x, y, ['empty']);
      if (i < 0) return false;
      const p = this.st.plots[i];
      p.stage = 'seeded'; p.crop = id; PW.save();
      PW.Snd.play('drop'); this.drawPlot(i);
      PW.goHome(this.seedNodes[SEEDS.indexOf(id)]);
      PW.say('lulu', 'luluCover', { anchor: this.lulu });
      return true;
    },
    tapPlot(i) {
      if (Date.now() - (PW.tapConsumed || 0) < 300) return;
      const p = this.st.plots[i];
      if (p.stage === 'seeded') {
        p.stage = 'covered'; PW.save(); PW.Snd.play('dig'); this.drawPlot(i);
        const [x, y] = PLOTS[i]; PW.sparkle(x, y + 60, 6);
        PW.say('lulu', 'luluWater', { anchor: this.lulu });
      } else if (p.stage === 'ripe') this.harvest(i);
      else if (p.stage === 'empty') { PW.say('lulu', 'luluSeedFirst', { anchor: this.lulu }); }
    },
    async dropCan(x, y) {
      const i = this.nearest(x, y, ['seeded', 'covered']);
      if (i < 0) return false;
      const p = this.st.plots[i], [px, py] = PLOTS[i];
      if (p.stage === 'seeded') { p.stage = 'covered'; this.drawPlot(i); } // no wrong order: watering covers it too
      p.stage = 'growing'; PW.save();
      const can = this.can; can._locked = true;
      PW.place(can, px + 120, py - 150);
      can.firstElementChild.style.transition = 'transform .3s'; can.firstElementChild.style.transform = 'rotate(-28deg)';
      PW.Snd.play('water');
      for (let k = 0; k < 12; k++) PW.later(() => {
        const d = PW.el(`<svg class="abs" viewBox="0 0 10 14" width="14" height="20" style="z-index:60"><path d="M5 0 C9 6 10 10 5 14 C0 10 1 6 5 0Z" fill="#9fd3f0"/></svg>`);
        PW.place(d, px + PW.rand(-30, 40), py - 120); PW.$('#fx').appendChild(d);
        d.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(110px)', opacity: 0.2 }], { duration: 600, easing: 'ease-in' });
        PW.later(() => d.remove(), 620);
      }, k * 90);
      await PW.wait(1200);
      can.firstElementChild.style.transform = ''; can._locked = false; PW.goHome(can);
      const host = this.plotNodes[i].querySelector('.plant');
      for (const s of [1, 2, 3]) {
        host.innerHTML = PW.plantSVG(p.crop, s);
        host.animate([{ transform: 'scale(.85)', transformOrigin: '50% 100%' }, { transform: 'scale(1.05)', transformOrigin: '50% 100%' }, { transform: 'scale(1)', transformOrigin: '50% 100%' }], { duration: 500, easing: 'ease-out' });
        PW.Snd.play(s === 3 ? 'grow' : 'pop');
        await PW.wait(900);
      }
      if (PW.cur.name !== 'lulu') return true;
      p.stage = 'ripe'; PW.save();
      PW.sparkle(px, py - 80, 12);
      this.lulu.anim('hop', 520);
      PW.say('lulu', 'luluLook', { anchor: this.lulu });
      return true;
    },
    addToBasket(crop, animate) {
      const n = PW.el(`<div class="abs" style="left:${PW.rand(0, 110)}px;top:${PW.rand(-14, 14)}px">${PW.produceSVG(crop, 64)}</div>`);
      this.basketFill.appendChild(n);
      if (animate) n.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 400 });
    },
    async harvest(i) {
      const p = this.st.plots[i], [px, py] = PLOTS[i];
      const crop = p.crop;
      p.stage = 'empty'; delete p.crop;
      this.st.harvested++; PW.save();
      this.drawPlot(i);
      const fly = PW.el(`<div class="c flying" style="z-index:66">${PW.produceSVG(crop, 110)}</div>`);
      PW.place(fly, px, py - 90); PW.$('#fx').appendChild(fly);
      PW.Snd.play('pop');
      requestAnimationFrame(() => requestAnimationFrame(() => { PW.place(fly, 470, 770); fly.style.transform = 'translate(-50%,-50%) scale(.55)'; }));
      await PW.wait(780);
      fly.remove(); this.addToBasket(crop, true); PW.Snd.play('drop'); PW.sparkle(470, 760, 8);
      if (this.st.harvested >= 3) {
        PW.onIdle(null);
        PW.say('lulu', 'luluDone', { anchor: this.lulu });
        await PW.celebrate([this.lulu, this.peep]);
        PW.S.act.lulu = null; PW.save();
        PW.reward('lulu', () => PW.go('lulu'));
      } else PW.say('lulu', 'luluHello', { anchor: this.lulu });
    },
    help(idle) {
      const ps = this.st.plots;
      const find = (s) => ps.findIndex((p) => p.stage === s);
      let i;
      if ((i = find('ripe')) >= 0) { PW.say('lulu', 'luluPick', { anchor: this.lulu }); PW.showHand(PLOTS[i][0], PLOTS[i][1] - 80); }
      else if ((i = find('covered')) >= 0) { PW.say('lulu', 'luluWater', { anchor: this.lulu }); const c = PW.centerOf(this.can); PW.showHand(c.x, c.y, PLOTS[i][0], PLOTS[i][1] - 40); }
      else if ((i = find('seeded')) >= 0) { PW.say('lulu', 'luluCover', { anchor: this.lulu }); PW.showHand(PLOTS[i][0], PLOTS[i][1] - 20); }
      else if ((i = find('empty')) >= 0) { PW.say('lulu', 'luluHello', { anchor: this.lulu }); const c = PW.centerOf(PW.pick(this.seedNodes)); PW.showHand(c.x, c.y, PLOTS[i][0], PLOTS[i][1] - 20); }
    },
  };

  /* ================= Bamboo's workshop ================= */
  const PUZZLES = [{ id: 'cover', img: 'assets/puzzle/cover.webp', c: 2, r: 2 }, { id: 'hill', img: 'assets/puzzle/hill.webp', c: 3, r: 2 }, { id: 'friends', img: 'assets/puzzle/friends.webp', c: 3, r: 2 }];
  const ROADS = [
    { id: 'r1', from: 'house', to: 'flower', cells: [[0, 1], [1, 1], [2, 1], [2, 2], [3, 2], [4, 2], [5, 2], [5, 1], [6, 1], [7, 1]], slots: [2, 4, 6, 8] },
    { id: 'r2', from: 'saw', to: 'tent', cells: [[0, 3], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [5, 2], [6, 2], [7, 2]], slots: [2, 4, 7, 9] },
    { id: 'r3', from: 'house', to: 'star', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [4, 2], [5, 2], [6, 2], [6, 3], [7, 3]], slots: [3, 5, 7, 9] },
  ];
  // a building part: one or more copies of an illustrated block stretched to the part's size
  const part = (w, h, img, n, col) => `<div style="display:flex;${col ? 'flex-direction:column;' : ''}width:${w}px;height:${h}px">${Array.from({ length: n || 1 }, () => `<img src="assets/pack/bamboo/${img}.webp" alt="" draggable="false" style="flex:1 1 0;${col ? 'width:100%;min-height:0' : 'height:100%;min-width:0'};object-fit:fill;display:block">`).join('')}</div>`;
  const BUILDS = [
    { id: 'bridge', thumb: PW.pic('bamboo/bridge-rail', 190, 120), parts: [
      { id: 'postL', w: 60, h: 190, x: 520, y: 610, svg: part(60, 190, 'bridge-post', 2, true) },
      { id: 'postR', w: 60, h: 190, x: 1200, y: 610, svg: part(60, 190, 'bridge-post', 2, true) },
      { id: 'deck', w: 740, h: 50, x: 860, y: 520, svg: part(740, 50, 'bridge-plank', 5) },
      { id: 'rail', w: 740, h: 110, x: 860, y: 440, svg: part(740, 110, 'bridge-rail', 3) },
    ] },
    { id: 'birdhouse', thumb: PW.decorSVG('bird-house', 170), parts: [
      { id: 'pole', w: 70, h: 240, x: 330, y: 620, svg: part(70, 240, 'wood-cylinder', 3, true) },
      { id: 'body', w: 190, h: 185, x: 330, y: 405, svg: part(190, 185, 'wood-cube') },
      { id: 'roof', w: 250, h: 160, x: 330, y: 255, svg: part(250, 160, 'wood-roof') },
    ] },
    { id: 'bench', thumb: PW.decorSVG('wooden-bench', 170), parts: [
      { id: 'legL', w: 70, h: 80, x: 1120, y: 660, svg: part(70, 80, 'wood-cylinder') },
      { id: 'legR', w: 70, h: 80, x: 1360, y: 660, svg: part(70, 80, 'wood-cylinder') },
      { id: 'seat', w: 340, h: 80, x: 1240, y: 590, svg: part(340, 80, 'wood-long-block', 2) },
      { id: 'back', w: 340, h: 80, x: 1240, y: 505, svg: part(340, 80, 'wood-long-block', 2) },
    ] },
  ];

  PW.scenes.workshop = {
    hud: ['map', 'sound', 'help'],
    enter(root, arg) {
      root.innerHTML = PW.bg.workshop();
      this.help = () => PW.say('bamboo', 'bambooHello', { anchor: this.bamboo });
      if (arg && arg.kind) return this.start(root, arg.kind, arg.idx);
      const bamboo = PW.char('bamboo', 290, 850, 380);
      const peep = PW.char('peep', 520, 860, 200, true);
      root.append(bamboo, peep);
      this.bamboo = bamboo;
      this.showKinds(root);
      PW.later(() => PW.say('bamboo', 'bambooHello', { anchor: bamboo }), 500);
    },
    showKinds(root) {
      root.querySelectorAll('.pick').forEach((n) => n.remove());
      [['puzzle', 'puzzle'], ['road', 'road'], ['build', 'hammer']].forEach(([k, ic], i) => {
        const b = PW.btn('big pick lbl-on', ic, PW.t(k), () => this.showVariants(root, k), 780 + i * 300, 420);
        b.style.width = b.style.height = '220px';
        root.appendChild(b);
      });
    },
    showVariants(root, kind) {
      root.querySelectorAll('.pick').forEach((n) => n.remove());
      PW.say('bamboo', 'bambooPick', { anchor: this.bamboo });
      const list = kind === 'puzzle' ? PUZZLES : kind === 'road' ? ROADS : BUILDS;
      list.forEach((v, i) => {
        let inner;
        if (kind === 'puzzle') inner = `<div style="position:absolute;inset:14px;border-radius:20px;background:url(${v.img}) center/cover"></div>`;
        else if (kind === 'road') inner = `<svg viewBox="0 0 160 80" style="position:absolute;inset:30px 20px">${this.roadMini(v)}</svg>`;
        else inner = `<div style="position:absolute;inset:20px;display:grid;place-items:center">${v.thumb}</div>`;
        const b = PW.el(`<button class="gift pick" style="position:absolute;left:${780 + i * 300}px;top:420px;transform:translate(-50%,-50%);width:250px;height:250px" aria-label="${PW.t(kind)} ${i + 1}">${inner}</button>`);
        b.addEventListener('click', () => { PW.Snd.init(); PW.Snd.play('pop'); PW.go('workshop', { kind, idx: i }); });
        root.appendChild(b);
      });
      const back = PW.btn('sm pick', 'back', PW.t('back'), () => this.showKinds(root), 1080, 690);
      root.appendChild(back);
    },
    roadMini(v) {
      return `<rect width="160" height="80" rx="8" fill="#a9d08a"/><polyline points="${v.cells.map(([c, r]) => `${c * 20 + 10},${r * 20 + 10}`).join(' ')}" fill="none" stroke="#ecd6a4" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>`;
    },
    start(root, kind, idx) {
      this.kind = kind; this.idx = idx;
      this.back = () => PW.go('workshop');
      this.hudOverride = ['back', 'sound', 'help'];
      if (kind === 'puzzle') this.puzzle(root, PUZZLES[idx]);
      if (kind === 'road') this.road(root, ROADS[idx]);
      if (kind === 'build') this.build(root, BUILDS[idx]);
    },
    finish: async function (chars) {
      PW.onIdle(null);
      PW.say('bamboo', 'bambooDone', { anchor: this.bamboo });
      await PW.celebrate(chars);
      const kind = this.kind, idx = this.idx;
      PW.S.act['bamboo-' + kind + idx] = null; PW.save();
      PW.reward('bamboo', () => PW.go('workshop', { kind, idx: (idx + 1) % 3 }));
    },

    /* --- picture puzzle --- */
    puzzle(root, pz) {
      const size = 600, bx = 590, by = 460, x0 = bx - size / 2, y0 = by - size / 2;
      const pw = size / pz.c, ph = size / pz.r;
      const board = PW.el(`<div class="pz-board" style="left:${x0}px;top:${y0}px;width:${size}px;height:${size}px"><div class="ghost" style="background-image:url(${pz.img})"></div></div>`);
      root.appendChild(board);
      root.appendChild(PW.el('<div class="tray" style="left:1000px;top:120px;width:540px;height:700px;opacity:.9"></div>'));
      const bamboo = PW.char('bamboo', 150, 880, 260); root.appendChild(bamboo); this.bamboo = bamboo;
      const peep = PW.char('peep', 1520, 890, 150, true); root.appendChild(peep);
      const st = act('bamboo-puzzle' + this.idx); st.done = st.done || [];
      const cells = [];
      for (let r = 0; r < pz.r; r++) for (let c = 0; c < pz.c; c++) cells.push({ c, r, x: x0 + c * pw + pw / 2, y: y0 + r * ph + ph / 2 });
      cells.forEach((cl) => board.appendChild(PW.el(`<div class="pz-cell" style="left:${cl.c * pw}px;top:${cl.r * ph}px;width:${pw}px;height:${ph}px"></div>`)));
      const k = 0.62, cols = 2, rows = Math.ceil(cells.length / cols);
      const spots = PW.shuffle(cells.map((_, i) => ({ x: 1140 + (i % cols) * 260, y: 120 + (700 / rows) * (Math.floor(i / cols) + 0.5) })));
      let placed = st.done.length;
      this.pieces = [];
      cells.forEach((cl, i) => {
        const n = PW.el(`<div style="width:${pw}px;height:${ph}px;z-index:30;pointer-events:none"><div class="pz-piece" style="pointer-events:auto;position:absolute;inset:0;background-image:url(${pz.img});background-size:${size}px ${size}px;background-position:-${cl.c * pw}px -${cl.r * ph}px;transform:scale(${k});transition:transform .25s"></div></div>`);
        root.appendChild(n);
        if (st.done.includes(i)) { PW.place(n, cl.x, cl.y); n.firstElementChild.style.transform = 'scale(1)'; n.firstElementChild.style.boxShadow = 'none'; n.style.pointerEvents = 'none'; n.classList.add('drag'); return; }
        PW.place(n, spots[i].x, spots[i].y);
        this.pieces.push({ n, cl, i });
        PW.draggable(n, {
          onPick: () => { n.firstElementChild.style.transform = 'scale(1)'; },
          drop: (x, y, node, p, tapped) => {
            const near = tapped ? PW.dist(p.x, p.y, cl.x, cl.y) < Math.max(pw, ph) / 2 : PW.dist(x, y, cl.x, cl.y) < 120;
            if (!near) return false;
            PW.place(n, cl.x, cl.y); n._home = { x: cl.x, y: cl.y }; n.firstElementChild.style.transform = 'scale(1)'; n.firstElementChild.style.boxShadow = 'none';
            n.style.pointerEvents = 'none'; n.style.zIndex = 25;
            PW.Snd.play('snap'); PW.sparkle(cl.x, cl.y, 8);
            st.done.push(i); PW.save();
            this.pieces = this.pieces.filter((q) => q.n !== n);
            if (++placed === cells.length) this.puzzleDone(root, board, pz, [bamboo, peep]);
            return true;
          },
        });
        n._onHome = () => { n.firstElementChild.style.transform = `scale(${k})`; };
      });
      if (placed === cells.length) { st.done = []; PW.save(); }
      PW.later(() => PW.say('bamboo', 'puzzleGo', { anchor: bamboo }), 500);
      this.help = () => { const q = this.pieces[0]; PW.say('bamboo', 'puzzleGo', { anchor: bamboo }); if (q) { const c = PW.centerOf(q.n); PW.showHand(c.x, c.y, q.cl.x, q.cl.y); } };
      PW.onIdle(() => this.help(), 11000);
    },
    async puzzleDone(root, board, pz, chars) {
      await PW.wait(400);
      root.querySelectorAll('.drag').forEach((n) => n.remove());
      board.innerHTML = `<div class="pz-done" style="position:absolute;inset:0;background:url(${pz.img}) center/cover"></div>`;
      PW.butterflies(board, 3, [40, 40, 400, 400]);
      PW.sparkle(590, 460, 16);
      this.finish(chars);
    },

    /* --- road joining --- */
    road(root, rd) {
      const cs = 150, ox = 200, oy = 150;
      root.appendChild(PW.el(`<svg class="abs" viewBox="0 0 1220 620" width="1220" height="620" style="left:${ox - 10}px;top:${oy - 10}px"><rect x="0" y="0" width="1220" height="620" rx="34" fill="#a9d08a" stroke="#8f633f" stroke-width="12"/></svg>`));
      const onPath = new Set(rd.cells.map(([c, r]) => c + ',' + r));
      const deco = [];
      const rnd = PW.seeded(rd.id.charCodeAt(1) * 97);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) if (!onPath.has(c + ',' + r) && rnd() < 0.55) deco.push(`<div class="c" style="left:${ox + c * cs + 75}px;top:${oy + r * cs + 70}px">${PW.decorSVG(PW.pick(['little-tree', 'round-bush', 'pink-flower-pot', 'round-bush']), 110)}</div>`);
      root.appendChild(PW.el(`<div class="abs" style="inset:0;pointer-events:none">${deco.join('')}</div>`));
      const dirOf = (a, b) => (b[0] > a[0] ? 'E' : b[0] < a[0] ? 'W' : b[1] > a[1] ? 'S' : 'N');
      const tile = (i) => {
        const cell = rd.cells[i];
        const ends = [];
        if (i > 0) ends.push(dirOf(cell, rd.cells[i - 1]));
        if (i < rd.cells.length - 1) ends.push(dirOf(cell, rd.cells[i + 1]));
        if (i === 0) ends.push(ends[0] === 'E' ? 'W' : 'E');
        if (i === rd.cells.length - 1) ends.push(ends[0] === 'W' ? 'E' : 'W');
        // the curve artwork joins north and east; rotate it (and the straight) to fit
        const [img, rot] = { NS: ['road-straight', 0], EW: ['road-straight', 90], EN: ['road-curve', 0], ES: ['road-curve', 90], SW: ['road-curve', 180], NW: ['road-curve', 270] }[ends.slice().sort().join('')];
        return `<img src="assets/pack/bamboo/${img}.webp" alt="" draggable="false" style="width:150px;height:150px;display:block;transform:rotate(${rot}deg)">`;
      };
      const center = (i) => ({ x: ox + rd.cells[i][0] * cs + 75, y: oy + rd.cells[i][1] * cs + 75 });
      const st = act('bamboo-road' + this.idx); st.done = st.done || [];
      const tileLayer = PW.el('<div class="abs" style="inset:0;pointer-events:none"></div>'); root.appendChild(tileLayer);
      const putTile = (i) => { const c = center(i); const t = PW.el(`<div class="c">${tile(i)}</div>`); PW.place(t, c.x, c.y); tileLayer.appendChild(t); return t; };
      const slotNodes = {};
      rd.cells.forEach((_, i) => {
        if (!rd.slots.includes(i) || st.done.includes(i)) putTile(i);
        else { const c = center(i); const s = PW.el(`<div class="slot-outline" style="width:136px;height:136px"></div>`); PW.place(s, c.x, c.y); root.appendChild(s); slotNodes[i] = s; }
      });
      // start and finish signs
      const sign = { house: PW.decorSVG('wooden-sign', 120), flower: PW.decorSVG('pink-flower-pot', 120), saw: PW.decorSVG('pinwheel', 120), tent: PW.decorSVG('mushroom', 120), star: PW.decorSVG('garden-lantern', 130) };
      const s0 = center(0), s1 = center(rd.cells.length - 1);
      root.appendChild(PW.place(PW.el(`<div class="c" style="z-index:12">${sign[rd.from] || sign.house}</div>`), s0.x - 70, s0.y - 60));
      root.appendChild(PW.place(PW.el(`<div class="c" style="z-index:12">${sign[rd.to]}</div>`), s1.x + 60, s1.y - 60));
      const bamboo = PW.char('bamboo', 1510, 790, 230, true); root.appendChild(bamboo); this.bamboo = bamboo;
      const peep = PW.char('peep', s0.x, s0.y + 40, 120); root.appendChild(peep);
      root.appendChild(PW.el('<div class="tray" style="left:380px;top:790px;width:840px;height:104px;border-radius:30px 30px 0 0"></div>'));
      let left = rd.slots.filter((i) => !st.done.includes(i));
      const piece = PW.pic('bamboo/road-straight', 104, 104, 'transform:rotate(90deg)');
      this.roadPieces = left.map((_, k) => {
        const n = PW.el(`<div style="z-index:30"><div>${piece}</div></div>`);
        PW.place(n, 500 + k * 200, 842); root.appendChild(n);
        PW.draggable(n, {
          glow: () => Object.values(slotNodes),
          drop: (x, y, node, p, tapped) => {
            const pt = tapped ? p : { x, y };
            let best = -1, bd = tapped ? 100 : 130;
            left.forEach((i) => { const c = center(i); const d = PW.dist(pt.x, pt.y, c.x, c.y); if (d < bd) { bd = d; best = i; } });
            if (best < 0) return false;
            n.remove(); this.roadPieces = this.roadPieces.filter((q) => q !== n);
            slotNodes[best].remove();
            const t = putTile(best); t.animate([{ transform: 'translate(-50%,-50%) scale(.6)' }, { transform: 'translate(-50%,-50%) scale(1.08)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 350 });
            PW.Snd.play('snap'); const c = center(best); PW.sparkle(c.x, c.y, 8);
            left = left.filter((i) => i !== best); st.done.push(best); PW.save();
            if (!left.length) this.roadDone(rd, center, peep, bamboo);
            return true;
          },
        });
        return n;
      });
      if (!left.length) { st.done = []; PW.save(); }
      PW.later(() => PW.say('bamboo', 'roadGo', { anchor: bamboo }), 500);
      this.help = () => { PW.say('bamboo', 'roadGo', { anchor: bamboo }); const n = this.roadPieces[0]; if (n && left.length) { const a = PW.centerOf(n), c = center(left[0]); PW.showHand(a.x, a.y, c.x, c.y); } };
      PW.onIdle(() => this.help(), 11000);
    },
    async roadDone(rd, center, peep, bamboo) {
      PW.onIdle(null);
      await PW.wait(400);
      PW.Snd.play('chime');
      for (let i = 0; i < rd.cells.length; i++) {
        const c = center(i);
        await PW.walkTo(peep, c.x, c.y + 40, { bloom: true, dur: 380 });
      }
      this.finish([bamboo, peep]);
    },

    /* --- building --- */
    build(root, bp) {
      root.innerHTML = PW.bg.stream();
      const spot = { bridge: { b: [1460, 860, true], p: [250, 760] }, birdhouse: { b: [1460, 860, true], p: [760, 740] }, bench: { b: [190, 860, false], p: [640, 740] } }[bp.id];
      const bamboo = PW.char('bamboo', spot.b[0], spot.b[1], 300, spot.b[2]); root.appendChild(bamboo); this.bamboo = bamboo;
      const peep = PW.char('peep', spot.p[0], spot.p[1], 170); root.appendChild(peep);
      const st = act('bamboo-build' + this.idx); st.done = st.done || [];
      const outlines = {};
      bp.parts.forEach((pt, i) => {
        const o = PW.el(`<div class="slot-outline" style="width:${pt.w + 12}px;height:${pt.h + 12}px;z-index:${10 + i}"></div>`);
        PW.place(o, pt.x, pt.y); root.appendChild(o); outlines[pt.id] = o;
      });
      root.appendChild(PW.el('<div class="tray" style="left:120px;top:752px;width:1360px;height:148px;border-radius:30px 30px 0 0"></div>'));
      let left = bp.parts.filter((p) => !st.done.includes(p.id));
      const putPart = (pt, i) => { const n = PW.el(`<div class="c" style="z-index:${20 + i}">${pt.svg}</div>`); PW.place(n, pt.x, pt.y); root.appendChild(n); outlines[pt.id].remove(); return n; };
      bp.parts.forEach((pt, i) => { if (st.done.includes(pt.id)) putPart(pt, i); });
      const trayX = PW.shuffle(left.map((_, k) => 300 + k * (1000 / Math.max(1, left.length - 1))));
      this.parts = left.map((pt, k) => {
        const i = bp.parts.indexOf(pt);
        const sc = Math.min(0.85, 120 / pt.h, 280 / pt.w);
        // only the visible (scaled) piece takes touches, so wide parts don't cover their neighbours
        const n = PW.el(`<div style="width:${pt.w}px;height:${pt.h}px;z-index:40;pointer-events:none"><div style="transform:scale(${sc});transition:transform .25s;pointer-events:auto">${pt.svg}</div></div>`);
        PW.place(n, left.length === 1 ? 800 : trayX[k], 826); root.appendChild(n);
        PW.draggable(n, {
          glow: () => [outlines[pt.id]],
          onPick: () => { n.firstElementChild.style.transform = 'scale(1)'; },
          drop: (x, y, node, p, tapped) => {
            const near = tapped ? PW.dist(p.x, p.y, pt.x, pt.y) < Math.max(110, Math.min(pt.w, pt.h)) : PW.dist(x, y, pt.x, pt.y) < 150;
            if (!near) return false;
            n.remove(); this.parts = this.parts.filter((q) => q.n !== n);
            const placed = putPart(pt, i);
            placed.animate([{ transform: 'translate(-50%,-50%) scale(1.1)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 300 });
            PW.Snd.play('snap'); PW.sparkle(pt.x, pt.y, 8);
            left = left.filter((q) => q !== pt); st.done.push(pt.id); PW.save();
            if (!left.length) this.buildDone(bp, peep, bamboo);
            return true;
          },
        });
        n._onHome = () => { n.firstElementChild.style.transform = `scale(${sc})`; };
        return { n, pt };
      });
      if (!left.length) { st.done = []; PW.save(); }
      PW.later(() => PW.say('bamboo', 'buildGo', { anchor: bamboo }), 500);
      this.help = () => { PW.say('bamboo', 'buildGo', { anchor: bamboo }); const q = this.parts[0]; if (q) { const a = PW.centerOf(q.n); PW.showHand(a.x, a.y, q.pt.x, q.pt.y); outlines[q.pt.id].classList.add('hint'); } };
      PW.onIdle(() => this.help(), 11000);
    },
    async buildDone(bp, peep, bamboo) {
      PW.onIdle(null);
      await PW.wait(400);
      if (bp.id === 'bridge') {
        await PW.walkTo(peep, 380, 525, { bloom: true }); peep.style.zIndex = 60;
        await PW.walkTo(peep, 1340, 525, { bloom: true });
      } else if (bp.id === 'birdhouse') {
        const bird = PW.el(`<svg class="c" viewBox="0 0 60 50" width="90" height="75" style="z-index:70"><ellipse cx="30" cy="30" rx="20" ry="15" fill="#9fd3f0"/><circle cx="44" cy="18" r="11" fill="#9fd3f0"/><circle cx="47" cy="16" r="2.5" fill="#3a2c1f"/><path d="M54 18 l8 3 l-8 3z" fill="#f2b632"/><path d="M14 26 q-10 -18 10 -14" fill="#7aa0c8"/></svg>`);
        PW.place(bird, 1500, 120); PW.$('#fx').appendChild(bird);
        bird.style.transition = 'left 1.6s ease-in-out, top 1.6s ease-in-out';
        requestAnimationFrame(() => requestAnimationFrame(() => PW.place(bird, 330, 150)));
        PW.Snd.play('bird'); await PW.wait(1700); PW.Snd.play('bird');
        await PW.walkTo(peep, 520, 700, { bloom: true });
      } else {
        await PW.walkTo(peep, 1240, 610, { bloom: true });
        peep.pose('peep-sit'); peep.style.zIndex = 60;
      }
      this.finish([bamboo, peep]);
    },
  };

  /* ================= Coco's adventures ================= */
  PW.scenes.coco = {
    hud: ['map', 'sound', 'help'],
    enter(root) {
      let st = act('coco');
      if (st.scene == null || !st.targets || st.found.length >= st.targets.length) {
        const idx = ((PW.S.rotate.coco || 0)) % PW.cocoScenes.length;
        PW.S.rotate.coco = idx + 1;
        const sc = PW.cocoScenes[idx];
        const spots = PW.shuffle(sc.spots.filter(([x, y]) => y <= 770 && !(x < 440 && y > 640)));
        const n = Math.random() < 0.5 ? 4 : 5;
        const ids = PW.shuffle(Object.keys(PW.objects));
        const targets = ids.slice(0, n).map((id, k) => ({ id, x: spots[k][0], y: spots[k][1], rot: Math.round(PW.rand(-18, 18)), s: Math.round(PW.rand(100, 114)) }));
        const decoys = ids.slice(n, n + Math.min(3, spots.length - n)).map((id, k) => ({ id, x: spots[n + k][0], y: spots[n + k][1], rot: Math.round(PW.rand(-18, 18)), s: 98 }));
        st = PW.S.act.coco = { scene: idx, targets, decoys, found: [] };
        PW.save();
      }
      this.st = st;
      root.innerHTML = PW.cocoScenes[st.scene].draw();
      if (st.scene !== 1) PW.butterflies(root, 2, [400, 150, 1200, 400]);
      st.decoys.forEach((o) => { const n = PW.el(`<div class="hobj" style="transform:translate(-50%,-50%) rotate(${o.rot}deg)">${PW.objSVG(o.id, o.s)}</div>`); PW.place(n, o.x, o.y); root.appendChild(n); });
      root.appendChild(PW.el('<div class="tray" style="left:400px;top:770px;width:960px;height:130px;border-radius:34px 34px 0 0"></div>'));
      const coco = PW.char('coco', 150, 900, 250); const peep = PW.char('peep', 1480, 900, 170, true);
      root.append(coco, peep);
      this.coco = coco; this.peep = peep;
      const sx = (k) => 880 - ((st.targets.length - 1) * 150) / 2 + k * 150;
      this.slots = st.targets.map((o, k) => {
        const s = PW.el(`<div class="strip-slot" role="button" aria-label="${PW.objects[o.id][PW.S.lang]}">${PW.objSVG(o.id, 90)}</div>`);
        PW.place(s, sx(k), 836); s.style.zIndex = 95; root.appendChild(s);
        s.addEventListener('click', (e) => { e.stopPropagation(); PW.Snd.init(); PW.Snd.play('tap'); PW.say('coco', null, { raw: PW.objects[o.id][PW.S.lang], anchor: s, ms: 1600 }); });
        if (st.found.includes(o.id)) this.markFound(s);
        return s;
      });
      this.nodes = {};
      st.targets.forEach((o, k) => {
        if (st.found.includes(o.id)) return;
        const n = PW.el(`<div class="hobj" style="transform:translate(-50%,-50%) rotate(${o.rot}deg)">${PW.objSVG(o.id, o.s)}</div>`);
        PW.place(n, o.x, o.y); root.appendChild(n);
        this.nodes[o.id] = n;
        n.addEventListener('click', (e) => { e.stopPropagation(); this.find(o, k, n); });
      });
      const hintBtn = PW.btn('leaf', 'help', PW.t('hint'), () => this.hint(), 1290, 836);
      hintBtn.innerHTML = `<svg viewBox="0 0 100 100" width="56" height="56"><circle cx="44" cy="44" r="24" fill="none" stroke="#fffaf0" stroke-width="9"/><path d="M62 62 L82 82" stroke="#fffaf0" stroke-width="11" stroke-linecap="round"/><path d="M44 30 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3z" fill="#ffe17a"/></svg>`;
      hintBtn.style.zIndex = 96; hintBtn.style.width = hintBtn.style.height = '96px';
      root.appendChild(hintBtn);
      PW.later(() => PW.say('coco', 'cocoHello', { anchor: coco }), 500);
      PW.onIdle(() => { PW.say('coco', 'cocoHint', { anchor: this.coco }); this.hint(true); }, 13000);
    },
    markFound(s) { s.classList.add('found'); if (!s.querySelector('.tick')) s.appendChild(PW.el(`<span class="tick">${PW.icon.check}</span>`)); },
    async find(o, k, n) {
      if (n._gone) return; n._gone = true;
      PW.Snd.init(); PW.Snd.play('found');
      PW.sparkle(o.x, o.y, 10);
      const slot = this.slots[k], c = PW.centerOf(slot);
      n.classList.add('flying');
      requestAnimationFrame(() => requestAnimationFrame(() => { PW.place(n, c.x, c.y); n.style.transform = 'translate(-50%,-50%) scale(.7)'; }));
      this.st.found.push(o.id); PW.save();
      PW.say('coco', null, { raw: PW.objects[o.id][PW.S.lang], anchor: this.coco, ms: 1500 });
      await PW.wait(780);
      n.remove(); this.markFound(slot); PW.Snd.play('drop');
      this.coco.anim('hop', 520);
      if (this.st.found.length === this.st.targets.length) {
        PW.onIdle(null);
        await PW.wait(500);
        PW.say('coco', 'cocoDone', { anchor: this.coco });
        await PW.celebrate([this.coco, this.peep]);
        PW.reward('coco', () => PW.go('coco'));
      }
    },
    hint(quiet) {
      const left = this.st.targets.filter((o) => !this.st.found.includes(o.id));
      if (!left.length) return;
      const o = PW.pick(left), n = this.nodes[o.id];
      if (!n) return;
      if (!quiet) PW.Snd.play('chime');
      n.classList.remove('shine'); void n.offsetWidth; n.classList.add('shine');
      n.style.setProperty('transform', `translate(-50%,-50%) rotate(${o.rot}deg)`);
      PW.later(() => n.classList.remove('shine'), 4300);
    },
    help() { PW.say('coco', 'cocoHello', { anchor: this.coco }); },
  };
})();
