/* Peep & Friends World — title, map, Peep's garden, gifts, Fifi's theatre, rest reminder. */
(function () {
  const PW = window.PW;
  const W = PW.W, H = PW.H;

  PW.addText({
    gameName: 'عالم بيب وأصدقائه', gameSub: 'Peep & Friends World',
    map: 'الخريطة', back: 'رجوع', sound: 'الصوت', help: 'أعِد التعليمات', play: 'العب', parents: 'للأهل',
    placeHome: 'حديقة بيب', placeLulu: 'حديقة لولو', placeBamboo: 'ورشة بامبو', placeCoco: 'مغامرات كوكو', placeFifi: 'مسرح فيفي',
    peepHello: 'مرحبًا! أين نذهب اليوم؟',
    giftPick: 'اختر هديتك!', giftNext: 'هديتك في الصندوق!',
    gardenHello: 'هذه حديقتي! زيّنها كما تحب.', gardenEmpty: 'العب مع أصدقائي لتحصل على زينة جميلة!', gardenBox: 'اسحب الزينة إلى الحديقة.',
    fifiHello: 'أهلًا بك في مسرحي! اختر قصة.', fifiIntro: 'هذه قصة بيب وقفزة السعادة. لنستمع معًا!', fifiEnd: 'انتهت القصة. هل نعيدها؟',
    listenRead: 'اسمع واقرأ', soon: 'قريبًا',
    restTitle: 'حان وقت الاستراحة', restLine: 'لعبنا كثيرًا اليوم! لنرتح قليلًا.',
  }, {
    gameName: 'Peep & Friends World', gameSub: 'عالم بيب وأصدقائه',
    map: 'Map', back: 'Back', sound: 'Sound', help: 'Hear it again', play: 'Play', parents: 'Parents',
    placeHome: "Peep's Garden", placeLulu: "Lulu's Garden", placeBamboo: "Bamboo's Workshop", placeCoco: "Coco's Adventures", placeFifi: "Fifi's Theatre",
    peepHello: 'Hello! Where shall we go today?',
    giftPick: 'Pick your present!', giftNext: 'Your present is in the box!',
    gardenHello: 'This is my garden! Decorate it any way you like.', gardenEmpty: 'Play with my friends to get pretty decorations!', gardenBox: 'Drag a decoration into the garden.',
    fifiHello: 'Welcome to my theatre! Pick a story.', fifiIntro: "This is Peep's story, A Leap of Joy. Let's listen together!", fifiEnd: 'The story is over. Shall we hear it again?',
    listenRead: 'Listen & read', soon: 'Coming soon',
    restTitle: 'Time for a rest', restLine: "We played so much today! Let's rest for a little while.",
  });

  /* ---------- title ---------- */
  PW.scenes.title = {
    hud: [],
    enter(root) {
      root.innerHTML = PW.bg.title();
      PW.fireflies(root, 22, [260, 120, 1340, 700]);
      const t1 = PW.el(`<div class="title-word" style="top:70px;font-size:${PW.S.lang === 'ar' ? 108 : 100}px">${PW.t('gameName')}</div>`);
      const t2 = PW.el(`<div class="title-word" style="top:200px;font-size:40px;font-weight:700;text-shadow:0 3px 8px rgba(0,0,0,.5)">${PW.t('gameSub')}</div>`);
      root.append(t1, t2);
      const peep = PW.char('peep-run', 620, 870, 380);
      root.appendChild(peep);
      const play = PW.btn('big pulse', 'play', PW.t('play'), async () => {
        play.disabled = true;
        peep.anim('hop', 520);
        for (let i = 0; i < 6; i++) PW.later(() => PW.bloomAt(PW.rand(480, 820), PW.rand(780, 860)), i * 90);
        PW.Snd.play('chime');
        await PW.wait(650);
        PW.go('map');
      }, 1080, 600);
      root.appendChild(play);
      // small, quiet entrance for grown-ups
      const p = PW.btn('sm', 'parent', PW.t('parents'), () => PW.parentGate());
      p.id = 'hud-parent';
      PW.$('#ui').appendChild(p);
      PW.later(() => { if (PW.cur.name === 'title') peep.anim('hop', 520); }, 1500);
    },
  };

  /* ---------- map ---------- */
  const PLACES = [
    { id: 'home', scene: 'garden', ch: 'peep', tag: 'placeHome', px: 800, py: 190, hit: [830, 380, 300, 230], stand: [800, 505] },
    { id: 'lulu', scene: 'lulu', ch: 'lulu', tag: 'placeLulu', px: 470, py: 90, hit: [450, 190, 380, 200], stand: [520, 300] },
    { id: 'bamboo', scene: 'workshop', ch: 'bamboo', tag: 'placeBamboo', px: 1250, py: 90, hit: [1260, 215, 320, 200], stand: [1150, 315] },
    { id: 'coco', scene: 'coco', ch: 'coco', tag: 'placeCoco', px: 420, py: 420, hit: [330, 590, 420, 260], stand: [580, 535] },
    { id: 'fifi', scene: 'theater', ch: 'fifi', tag: 'placeFifi', px: 1170, py: 350, hit: [1320, 560, 360, 270], stand: [1080, 565] },
  ];
  let greetedThisSession = false;
  // crop each original drawing so the face sits in the round badge
  const FACE = { peep: ['peep-wave', 175, 0.889, 0.58, 0.38], lulu: ['lulu', 170, 1.642, 0.58, 0.45], bamboo: ['bamboo', 160, 1.497, 0.49, 0.25], coco: ['coco', 135, 1.229, 0.66, 0.26], fifi: ['fifi', 210, 1.215, 0.74, 0.27] };
  PW.portraitImg = function (ch, size) {
    size = size || 112;
    const [f, w0, a, fx, fy] = FACE[ch], w = w0 * size / 112;
    return `<img src="assets/chars/${f}.webp" alt="" style="position:absolute;width:${w}px;height:auto;max-width:none;left:${size / 2 - fx * w}px;top:${size / 2 - fy * w * a}px">`;
  };
  PW.scenes.map = {
    hud: ['sound'],
    enter(root) {
      root.innerHTML = PW.bg.map();
      PW.butterflies(root, 4, [500, 120, 1100, 700]);
      const at = PLACES.find((p) => p.id === (PW.S.mapAt || 'home')) || PLACES[0];
      const peep = PW.char('peep', at.stand[0], at.stand[1], 125);
      let busy = false;
      PLACES.forEach((p) => {
        const hit = PW.el(`<div class="place" style="left:${p.hit[0]}px;top:${p.hit[1]}px;width:${p.hit[2]}px;height:${p.hit[3]}px" role="button" aria-label="${PW.t(p.tag)}"></div>`);
        const badge = PW.el(`<div class="place" style="left:${p.px}px;top:${p.py}px;width:112px;height:112px" role="button" aria-label="${PW.t(p.tag)}">
          <div class="portrait" style="left:0;top:0">${PW.portraitImg(p.ch)}</div>
          <div class="tag" style="top:-46px">${PW.t(p.tag)}</div></div>`);
        const goThere = async () => {
          if (busy) return; busy = true;
          PW.Snd.init(); PW.Snd.play('pop'); PW.clearBubble(); PW.hush();
          badge.querySelector('.portrait').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 400 });
          const from = PLACES.find((q) => q.id === (PW.S.mapAt || 'home')) || PLACES[0];
          if (from.id !== p.id) await PW.walkTo(peep, 800, 515, { bloom: true }); // every path meets below Peep's house
          await PW.walkTo(peep, p.stand[0], p.stand[1], { bloom: true });
          PW.S.mapAt = p.id; PW.save();
          PW.go(p.scene);
        };
        hit.addEventListener('click', goThere); badge.addEventListener('click', goThere);
        root.append(hit, badge);
      });
      root.appendChild(peep);
      if (!greetedThisSession) {
        greetedThisSession = true;
        PW.later(() => { peep.anim('hop', 520); PW.bloomAt(at.stand[0] - 30, at.stand[1]); PW.bloomAt(at.stand[0] + 30, at.stand[1] - 6); PW.say('peep', 'peepHello', { anchor: peep }); }, 500);
      }
      PW.onIdle(() => { const p = PW.pick(PLACES.filter((q) => q.id !== PW.S.mapAt)); const b = PW.centerOf(root.querySelectorAll('.place')[PLACES.indexOf(p) * 2 + 1]); PW.showHand(b.x + 20, b.y + 20); }, 14000);
    },
    help() { PW.say('peep', 'peepHello', { anchor: PW.$('#scene .ch') }); },
  };

  /* ---------- celebration & gifts ---------- */
  PW.celebrate = function (chars) {
    PW.Snd.play('tada');
    PW.petals(30);
    (chars || []).forEach((c, i) => PW.later(() => {
      if (c.base) { c.pose(c.base.startsWith('peep') ? 'peep-run' : c.base + '-happy'); setTimeout(() => c.pose(), 2300); }
      c.anim('cheer', 2200);
    }, i * 150));
    return PW.wait(2300);
  };

  // two decor choices from the friend's set; pieces the child hasn't received come first
  PW.giftChoices = function (src) {
    const ids = Object.keys(PW.decor).filter((k) => PW.decor[k].src === src);
    const fresh = PW.shuffle(ids.filter((k) => !PW.S.given[k]));
    const old = PW.shuffle(ids.filter((k) => PW.S.given[k]));
    return fresh.concat(old).slice(0, 2);
  };
  PW.reward = function (src, onReplay) {
    const opts = PW.giftChoices(src);
    const card = PW.el(`<div class="card" style="width:860px;text-align:center">
      <div style="font-size:40px;font-weight:800;margin-bottom:24px">${PW.t('giftPick')}</div>
      <div class="gift-opts">${opts.map((id) => `<button class="gift shimmer" data-id="${id}" aria-label="${PW.decor[id][PW.S.lang]}">${PW.decorSVG(id, 190)}</button>`).join('')}</div>
    </div>`);
    PW.openModal(card);
    PW.say(src, 'giftPick', { y: 160 });
    card.querySelectorAll('.gift').forEach((g) => g.addEventListener('click', async () => {
      const id = g.dataset.id;
      PW.S.inv[id] = (PW.S.inv[id] || 0) + 1;
      PW.S.given[id] = (PW.S.given[id] || 0) + 1;
      PW.save();
      PW.Snd.play('chime');
      card.querySelectorAll('.gift').forEach((o) => { o.disabled = true; if (o !== g) o.style.opacity = '.25'; });
      g.classList.remove('shimmer');
      g.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(.2) translateY(400px)', opacity: 0 }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
      await PW.wait(800);
      const c = PW.centerOf(g); PW.sparkle(c.x, c.y + 200, 12);
      card.innerHTML = `<div style="display:grid;justify-items:center;gap:20px"><div style="width:180px;height:180px">${PW.icon.box.replace('<svg', '<svg width="180" height="180"')}</div>
        <div style="font-size:36px;font-weight:800">${PW.t('giftNext')}</div>
        <div class="row" style="margin-top:20px"></div></div>`;
      PW.say('peep', 'giftNext', { y: 140 });
      const row = card.querySelector('.row');
      row.append(
        PW.btn('leaf lbl-on', 'house', PW.t('placeHome'), () => { PW.closeModal(); PW.S.mapAt = 'home'; PW.save(); PW.go('garden'); }),
        PW.btn('big lbl-on', 'replay', PW.t('play'), () => { PW.closeModal(); onReplay(); }),
        PW.btn('lbl-on', 'map', PW.t('map'), () => { PW.closeModal(); PW.go('map'); }),
      );
      row.style.paddingBottom = '40px';
    }));
  };

  /* ---------- Peep's own garden ---------- */
  const GROUND = { x0: 90, x1: 1510, y0: 500, y1: 740 };
  PW.scenes.garden = {
    hud: ['map', 'sound', 'help'],
    enter(root) {
      root.innerHTML = PW.bg.garden();
      PW.butterflies(root, 3, [400, 150, 1300, 450]);
      const layer = PW.el('<div class="abs" style="inset:0"></div>');
      root.appendChild(layer);
      const peep = PW.char('peep', 760, 640, 190);
      layer.appendChild(peep);
      this.peep = peep; this.layer = layer;

      // the decoration box
      const tray = PW.el(`<div class="tray" style="left:110px;right:110px;top:790px;height:104px;border-radius:30px 30px 0 0"></div>`);
      const boxIcon = PW.el(`<div class="abs" style="left:24px;top:776px;width:130px;height:130px">${PW.icon.box}</div>`);
      root.append(tray, boxIcon);
      this.tray = tray;

      const placed = [];
      const zFor = (y) => Math.round(y / 10);
      const makePlaced = (rec) => {
        const n = PW.el(`<div style="z-index:${zFor(rec.y)}"><div>${PW.decorSVG(rec.id, 190)}</div></div>`);
        PW.place(n, rec.x, rec.y); layer.appendChild(n);
        n._rec = rec;
        PW.draggable(n, {
          drop: (x, y) => {
            if (y > 770) { // back into the box
              PW.S.garden.splice(PW.S.garden.indexOf(rec), 1);
              PW.S.inv[rec.id] = (PW.S.inv[rec.id] || 0) + 1;
              PW.save(); n.remove(); placed.splice(placed.indexOf(n), 1); PW.Snd.play('drop'); fillTray();
              return true;
            }
            const p = snap(x, y);
            rec.x = p.x; rec.y = p.y; PW.save();
            PW.place(n, p.x, p.y); n._home = p; n.style.zIndex = zFor(p.y); PW.Snd.play('drop');
            return true;
          },
        });
        placed.push(n);
        return n;
      };
      const snap = (x, y) => ({ x: Math.round(Math.max(GROUND.x0, Math.min(GROUND.x1, x)) / 20) * 20, y: Math.round(Math.max(GROUND.y0, Math.min(GROUND.y1, y)) / 20) * 20 });
      PW.S.garden.forEach(makePlaced);

      const trayItems = PW.el('<div class="abs" style="inset:0;pointer-events:none;z-index:90"></div>');
      root.appendChild(trayItems);
      const fillTray = () => {
        tray.innerHTML = ''; trayItems.innerHTML = '';
        const ids = Object.keys(PW.S.inv).filter((k) => PW.S.inv[k] > 0);
        const slots = ids.slice(0, 10);
        slots.forEach((id, i) => {
          const x = 200 + i * 135, y = 842;
          const n = PW.el(`<div style="pointer-events:auto"><div>${PW.decorSVG(id, 100)}</div>${PW.S.inv[id] > 1 ? `<span style="position:absolute;right:-6px;top:-8px;background:#fffaf0;border-radius:20px;padding:0 10px;font-weight:800;font-size:22px">×${PW.S.inv[id]}</span>` : ''}</div>`);
          PW.place(n, x, y); trayItems.appendChild(n);
          PW.draggable(n, {
            drop: (dx, dy, node, p, tapped) => {
              const pos = tapped ? p : { x: dx, y: dy };
              if (pos.y > 770) { fillTray(); return true; }
              const s = snap(pos.x, pos.y);
              PW.S.inv[id]--; const rec = { id, x: s.x, y: s.y }; PW.S.garden.push(rec); PW.save();
              n.remove(); makePlaced(rec); PW.Snd.play('drop'); PW.sparkle(s.x, s.y, 8); fillTray();
              PW.later(() => react(rec), 600);
              return true;
            },
          });
        });
        if (!ids.length) tray.innerHTML = `<div style="display:grid;place-items:center;height:100%;color:#fbf0d8;font-size:30px;font-weight:700">${PW.t('gardenEmpty')}</div>`;
      };
      fillTray();

      // Peep visits decorations now and then
      const react = async (rec) => {
        if (!rec || this.busy) return;
        this.busy = true;
        const side = rec.x > 800 ? -110 : 110;
        await PW.walkTo(peep, rec.x + side, Math.min(GROUND.y1 + 30, rec.y + 40), { bloom: true });
        if (PW.cur.name !== 'garden') return;
        const kind = PW.decor[rec.id] || {};
        if (kind.seat) {
          await PW.walkTo(peep, rec.x, rec.y + 20); peep.pose('peep-sit'); peep.style.zIndex = Math.round(rec.y / 10) + 1;
          PW.later(() => peep.pose(), 3000);
        } else if (kind.bloom) {
          peep.anim('hop', 520); PW.bloomAt(rec.x, rec.y - 60); PW.later(() => PW.bloomAt(rec.x + 30, rec.y - 90), 300);
        } else if (kind.bird) { PW.Snd.play('bird'); PW.later(() => PW.Snd.play('bird'), 500); peep.anim('cheer', 1400); }
        else { peep.anim('hop', 520); PW.sparkle(rec.x, rec.y - 40, 8); }
        await PW.wait(1500);
        this.busy = false;
      };
      const wander = () => {
        if (PW.cur.name !== 'garden') return;
        if (!this.busy && PW.S.garden.length && Math.random() < 0.7) react(PW.pick(PW.S.garden));
        else if (!this.busy) { this.busy = true; PW.walkTo(peep, PW.rand(300, 1300), PW.rand(560, 740), { bloom: true }).then(() => { this.busy = false; }); }
        PW.later(wander, PW.rand(6000, 9000));
      };
      this.busy = false;
      PW.later(wander, 5000);
      PW.later(() => this.help(), 500);
    },
    help() {
      const hasBox = Object.values(PW.S.inv).some((v) => v > 0);
      PW.say('peep', hasBox ? 'gardenBox' : (PW.S.garden.length ? 'gardenHello' : 'gardenEmpty'), { anchor: this.peep });
      if (hasBox) { const first = this.tray.querySelector('.drag'); if (first) { const c = PW.centerOf(first); PW.showHand(c.x, c.y, 800, 600); } }
    },
  };

  /* ---------- Fifi's theatre ---------- */
  PW.stories = [
    { id: 'peep1', ready: true, inSub: true, pages: 13, title: { ar: 'الديناصور بيب — قفزة السعادة', en: 'Peep the Dinosaur — A Leap of Joy' },
      text: {
        ar: [
          'الديناصور بيب. قفزة السعادة. تأليف ورسوم خديجة عبدالرسول.',
          'مرحبًا، أنا الديناصور بيب! اسمي بيب، ولوني أصفر ذهبي، تزيّن جسمي نقوش ذهبية لامعة. أحب اللعب، والقفز، والمرح، ومساعدة أصدقائي. أشعر بالسعادة عندما أرى الابتسامة على وجوههم. هيا، انضم إليّ لنكتشف كيف نشرتُ الفرح في الغابة السحرية!',
          'الاكتشاف المذهل. خرج الديناصور بيب الصغير ليلعب كعادته، يقفز مرحًا مبتسمًا للجميع. وبينما ظل يقفز ويلعب بعيدًا عن منزله، وجد نفسه فجأةً أمام غابةٍ سحريةٍ مذهلة لم يرها من قبل.',
          'سحر الخطوات الأولى. دخل بيب الغابة مدفوعًا بالفضول والقلق في خطواته الأولى، حتى شعر بالذهول من جمالها ومظهرها الساحر. بدأ يقفز في الأرجاء ضاحكًا بذهول، فما كان منه إلا أن يرى تحت قدميه تتفتح الأزهار الجميلة المضيئة، وتنشر رائحة زكية تجعل كل من حوله يشعر بالسعادة.',
          'الحزن فوق التل. بينما كان بيب يقفز في الأرجاء بسعادة، كان هناك فوق التل مجموعةٌ من الأصدقاء: لولو، وبامبو، وكوكو، وفيفي، يشعرون بالحزن على غابتهم التي فقدت مرحها ولونها.',
          'شعاع الأمل الأصفر. فجأةً، سمع الأصدقاء صوت ضحكات عالية تملأ المكان. قال كوكو: انظروا إلى الأسفل، هناك ديناصورًا أصفرًا في وادي الغابة، يقفز مرحًا. قالت لولو: انظروا إلى أسفل قدميه، تتفتح الزهور مع كل قفزة.',
          'لقاء الأصدقاء. تجمّع الأصدقاء جميعًا فوق التل، ونظروا إلى بيب بإعجاب وفرح شديد. استعدوا جميعًا للنزول والذهاب خلف هذا الديناصور العجيب، مشاركين إياه قفزاته ليستعيدوا طاقتهم وحيويتهم للعب من جديد.',
          'تعرُّف الأصدقاء. مرحبًا، أنا بيب، أحب اللعب والمرح، أتيت من بعيد، من أنتم؟ مرحبًا، أنا بامبو، أنا مهندس الغابة، وأحب أشجار الخيزران.',
          'مرحبًا، أنا كوكو، أحب المغامرة والاكتشاف، وأخرج دائمًا في مغامراتٍ شيقة. مرحبًا، أنا لولو، أحب الطبيعة والاستماع إلى أصوات الغابة وكائناتها.',
          'مرحبًا، أنا فيفي، أنا أحب الاستماع وكتابة كل مغامرة جميلة تحدث في غابتنا السحرية.',
          'صديق الغابة السحرية. عادت الضحكات للجميع، وعادت الشمس مشرقة، والغابة مزهرة ممتلئة بالسحر الخلّاب بسبب مرح بيب. ومنذ ذلك اليوم، تعلّم الجميع أن الفرح الصادق ينتشر مثل الزهور، وأن ابتسامة صغيرة قد تجعل العالم أجمل.',
          'خريطة الغابة السحرية.',
          'شكرًا لك. شكرًا لقراءتك قصة الديناصور بيب. ابتسم... فقد تجعل يوم شخصٍ ما أجمل. هل استمتعت بمغامرة بيب؟ ترقّبوا مغامراتٍ جديدة مع الديناصور بيب.',
        ],
        en: [
          'Peep the Dinosaur. A Leap of Joy. Written and illustrated by Khadija Abdulrasool.',
          "Hello, I'm Peep the Dinosaur! My name is Peep. I'm a little golden-yellow dinosaur with shiny golden patterns. I love to run, jump, play, and help my friends. Nothing makes me happier than seeing smiles on their faces. Come along and discover how I filled the magical forest with joy!",
          'The Amazing Discovery. Peep, the cheerful little yellow dinosaur, loved to run, jump, and explore. One sunny day, he bounced farther from home than ever before and discovered a magical forest filled with wonder.',
          'The Magic of the First Steps. Curious but a little nervous, Peep stepped into the magical forest. Its breathtaking beauty filled him with wonder. He happily jumped around, and with every leap, glowing colorful flowers bloomed beneath his tiny feet. Their sweet fragrance filled the air, bringing joy to everyone nearby.',
          'Sadness on the Hill. While Peep happily hopped through the forest, four friends, Lulu, Bamboo, Coco, and Fifi, watched from the top of the hill. They felt a little sad because their magical forest had lost its sparkle.',
          'A Bright Ray of Hope. Suddenly, the friends heard joyful laughter echoing through the forest. "Look down there!" Coco exclaimed. "It\'s a bright yellow dinosaur happily bouncing through the forest!" "Look at his feet!" Lulu said. "Beautiful flowers bloom with every jump!"',
          'New Friends. The friends smiled as they watched Peep from the top of the hill. Excited, they hurried down to join the cheerful little dinosaur. Together, they laughed, jumped, and played, filling the magical forest with joy once again.',
          'Friends meeting. "Hi! I\'m Peep! I love to play, jump, and have fun. I came from far away. Who are you?" "Hi! I\'m Bamboo! I\'m the forest engineer. I love building and taking care of bamboo trees."',
          '"Hi! I\'m Coco! I love adventures and discovering new things. Every day is a new adventure for me!" "Hi! I\'m Lulu! I love nature. My favourite thing is listening to the sounds of the magical forest."',
          '"Hi! I\'m Fifi! I love writing, listening to all the stories, and keeping memories."',
          "The Forest's Happiest Friend. Laughter filled the forest once again. The sun shone brightly, and colourful flowers bloomed everywhere thanks to Peep's joyful spirit. From that day on, everyone knew that true happiness spreads like flowers and that even the smallest smile can make the world a brighter place.",
          'The magical forest map.',
          "Thank you for joining Peep the Baby Dinosaur on his magical adventure! Smile... you might brighten someone's day. Did you enjoy Peep's adventure? Stay tuned for more exciting adventures with Peep the Baby Dinosaur!",
        ],
      } },
    { id: 'lulu1', ready: false, who: 'lulu' },
    { id: 'bamboo1', ready: false, who: 'bamboo' },
    { id: 'coco1', ready: false, who: 'coco' },
  ];
  PW.hasStory = function (id) {
    const s = PW.stories.find((x) => x.id === id);
    if (!s || !s.ready) return false;
    if (PW.S.stories.includes(id)) return true;
    return !!(PW.S.sub && PW.S.sub.until > Date.now() && s.inSub);
  };

  PW.scenes.theater = {
    hud: ['map', 'sound', 'help'],
    enter(root) {
      root.innerHTML = PW.bg.theater();
      const fifi = PW.char('fifi', 360, 690, 320);
      const peep = PW.char('peep-sit', 1400, 895, 190, true);
      root.append(fifi, peep);
      this.fifi = fifi;
      const shelf = [[530, 250], [800, 250], [1070, 250], [800, 392]];
      PW.stories.forEach((s, i) => {
        const [x, y] = shelf[i];
        if (!s.ready) {
          const b = PW.el(`<div class="cover-btn soon" aria-label="${PW.t('soon')}"><div class="img" style="background-image:url(assets/chars/${s.who}.webp);background-size:auto 80%;background-position:center 70%;background-repeat:no-repeat;opacity:.55"></div><span class="badge" style="background:#e6d8bb;color:#6e4a2e">${PW.t('soon')}</span></div>`);
          PW.place(b, x, y); root.appendChild(b);
          return;
        }
        const owned = PW.hasStory(s.id);
        const b = PW.el(`<button class="cover-btn${owned ? '' : ' locked'}" aria-label="${s.title[PW.S.lang]}"><div class="img" style="background-image:url(assets/story/cover-${PW.S.lang}.webp)"></div>${owned ? `<span class="badge">${PW.t('listenRead')}</span>` : `<span class="lock">${PW.icon.lock}</span>`}</button>`);
        PW.place(b, x, y); root.appendChild(b);
        b.addEventListener('click', () => {
          PW.Snd.init();
          if (!PW.hasStory(s.id)) { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); PW.Snd.play('soft'); return; } // quiet lock, no sales pitch to the child
          PW.Snd.play('pop');
          fifi.anim('hop', 520);
          PW.say('fifi', 'fifiIntro', { anchor: fifi });
          PW.later(() => this.read(s), 2600);
        });
      });
      PW.later(() => this.help(), 500);
    },
    help() { PW.say('fifi', 'fifiHello', { anchor: this.fifi }); },
    read(s) {
      PW.clearBubble(); PW.hush();
      const lang = PW.S.lang;
      let page = Math.min(PW.S.storyPos[s.id] || 0, s.pages - 1);
      let playing = true, token = 0;
      const r = PW.el(`<div class="reader"><img class="page" alt=""><div class="dots">${Array.from({ length: s.pages }, () => '<i></i>').join('')}</div><div class="bar"></div></div>`);
      PW.$('#scene').appendChild(r);
      PW.$('#ui').innerHTML = '';
      const img = r.querySelector('.page'), bar = r.querySelector('.bar');
      const bPlay = PW.btn('big', 'pause', '', () => { playing = !playing; bPlay.innerHTML = PW.icon[playing ? 'pause' : 'play']; if (playing) show(page); else { token++; PW.hush(); } });
      const bPrev = PW.btn('', 'prev', '', () => { if (page > 0) show(page - 1); });
      const bNext = PW.btn('', 'next', '', () => { if (page < s.pages - 1) show(page + 1); else end(); });
      const bLib = PW.btn('sm', 'close', PW.t('back'), () => { token++; PW.hush(); PW.go('theater'); });
      bLib.style.cssText = 'top:22px;inset-inline-start:22px';
      bar.append(bPrev, bPlay, bNext); // the row runs right-to-left in Arabic, so "next" lands on the left
      if (lang === 'ar') { bNext.innerHTML = PW.icon.prev; bPrev.innerHTML = PW.icon.next; }
      r.appendChild(bLib);
      const show = (i) => {
        page = i; PW.S.storyPos[s.id] = i; PW.save();
        const my = ++token;
        img.style.opacity = 0;
        PW.later(() => { img.src = `assets/story/${lang}/${String(i + 1).padStart(2, '0')}.webp`; img.onload = () => { img.style.opacity = 1; }; }, 200);
        r.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
        PW.Snd.play('whoosh');
        if (!playing) return;
        PW.later(() => {
          if (my !== token) return;
          PW.speak(s.text[lang][i], 'fifi', () => {
            if (my !== token || !playing) return;
            PW.later(() => { if (my !== token || !playing) return; if (page < s.pages - 1) show(page + 1); else end(); }, 1300);
          });
        }, 700);
      };
      const end = () => {
        token++; PW.hush();
        PW.S.storyPos[s.id] = 0; PW.save();
        r.innerHTML = '';
        r.style.background = '#4a2f3a';
        const f = PW.char('fifi', 560, 780, 360); r.appendChild(f);
        const card = PW.el(`<div class="abs" style="left:780px;top:300px;display:flex;gap:60px"></div>`);
        card.append(PW.btn('big', 'replay', '', () => { r.remove(); this.read(s); }), PW.btn('leaf', 'story', '', () => PW.go('theater')));
        card.querySelectorAll('.wbtn').forEach((b) => (b.style.position = 'relative'));
        r.appendChild(card);
        PW.say('fifi', 'fifiEnd', { x: 800, y: 260 });
      };
      show(page);
    },
  };

  /* ---------- gentle play-time reminder ---------- */
  PW.restReminder = function () {
    PW.hush();
    const card = PW.el(`<div class="card" style="width:760px;text-align:center;display:grid;justify-items:center;gap:16px">
      <img src="assets/chars/peep-wave.webp" alt="" style="height:240px">
      <div style="font-size:44px;font-weight:800">${PW.t('restTitle')}</div>
      <div class="row" style="margin-top:6px"></div></div>`);
    PW.openModal(card);
    PW.say('peep', 'restLine', { y: 120 });
    card.querySelector('.row').appendChild(PW.btn('leaf', 'check', '', () => { PW.closeModal(); PW.resetPlayClock(); PW.go('title'); }));
  };
})();
