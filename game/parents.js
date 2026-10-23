/* Peep & Friends World — grown-ups' gate and settings. Purchases here are a simulation until a real store is connected. */
(function () {
  const PW = window.PW;
  const NUM = {
    ar: ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'],
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
  };
  PW.addText({
    gateAsk: 'للأهل فقط: اضغط الأرقام', gateClose: 'إغلاق',
    pTitle: 'قسم الأهل', pBack: 'العودة إلى اللعبة',
    tLang: 'اللغة', tSound: 'الصوت والحركة', tStories: 'القصص والاشتراك', tDown: 'التنزيلات', tTime: 'مدة اللعب', tPrivacy: 'الخصوصية والمساعدة', tReset: 'إعادة الضبط',
    langNote: 'تتغيّر لغة الأصوات والكلمات واتجاه الشاشة.',
    music: 'الموسيقى', sfx: 'المؤثرات', voices: 'أصوات الشخصيات', calm: 'تقليل الحركة', calmOn: 'حركة هادئة', calmOff: 'حركة عادية',
    voiceNote: 'الأصوات الحالية مؤقتة من صوت الجهاز، وستُستبدل بأصوات الشخصيات المسجّلة.',
    simNote: 'نسخة تجريبية: الشراء والاشتراك هنا محاكاة، ولا يتم أي دفع حقيقي.',
    subTitle: 'اشتراك بريميوم', subBody: 'يفتح كل القصص المشمولة طوال مدة الاشتراك.', subMonthly: 'شهري', subYearly: 'سنوي', priceLater: 'يُحدَّد السعر عند ربط المتجر',
    subscribe: 'اشترك (محاكاة)', subActive: 'الاشتراك فعّال حتى', subNone: 'لا يوجد اشتراك', endSub: 'إنهاء الاشتراك (محاكاة)',
    singleTitle: 'شراء قصة منفردة', singleBody: 'تبقى القصة المشتراة متاحة حتى بعد انتهاء الاشتراك.', buy: 'اشترِ القصة (محاكاة)', owned: 'مملوكة', viaSub: 'متاحة بالاشتراك', locked: 'مقفلة',
    restore: 'استعادة المشتريات', restored: 'تمت استعادة المشتريات المحفوظة على هذا الجهاز.',
    filmPending: 'فيلم القصة قيد الإنتاج. المتاح الآن: «اسمع واقرأ» بصفحات الكتاب الأصلية.',
    downTitle: 'الملفات على هذا الجهاز', downPages: 'صفحات قصة بيب (العربية والإنجليزية) — نحو ٢ ميغابايت', downFilm: 'فيلم القصة', notYet: 'غير متوفر بعد', onDevice: 'على الجهاز', notOnDevice: 'غير منزّلة',
    delDown: 'حذف التنزيلات', getDown: 'تنزيل', downNote: 'في التطبيق النهائي تُنزَّل الأفلام عند الطلب لتبقى مساحة التطبيق صغيرة.',
    timeBody: 'عند انتهاء المدة يظهر تنبيه هادئ من بيب، دون أصوات مزعجة.', off: 'بلا حد', min: 'دقيقة',
    privacy: ['لا إعلانات ولا دردشة ولا تواصل مع غرباء.', 'لا نطلب الموقع أو الكاميرا أو الميكروفون.', 'لا حاجة لحساب لبدء اللعب. التقدّم محفوظ على هذا الجهاز فقط.', 'في التطبيق النهائي: يُستخدم حساب الأهل فقط لربط المشتريات ومزامنتها بين الأجهزة.', 'الألعاب تعمل دون اتصال. الشراء والاستعادة والتحقق من الاشتراك تحتاج اتصالًا.'],
    help1: 'كل الأنشطة تعمل باللمس أو السحب. يمكن أيضًا لمس العنصر ثم لمس مكانه.', help2: 'زر علامة الاستفهام يعيد التعليمات، وزر الخريطة يعيد الطفل إلى الخريطة.',
    resetBody: 'يحذف الزينة وترتيب الحديقة وتقدّم الأنشطة من هذا الجهاز. لا يحذف القصص المشتراة.', resetBtn: 'إعادة ضبط التقدّم', resetSure: 'هل أنت متأكد؟ لا يمكن التراجع.', yesReset: 'نعم، احذف التقدّم', cancel: 'إلغاء', resetDone: 'تمت إعادة الضبط.',
  }, {
    gateAsk: 'Grown-ups only: tap the numbers', gateClose: 'Close',
    pTitle: 'For parents', pBack: 'Back to the game',
    tLang: 'Language', tSound: 'Sound & motion', tStories: 'Stories & subscription', tDown: 'Downloads', tTime: 'Play time', tPrivacy: 'Privacy & help', tReset: 'Reset',
    langNote: 'Changes the voices, words and screen direction.',
    music: 'Music', sfx: 'Sound effects', voices: 'Character voices', calm: 'Reduce motion', calmOn: 'Calm motion', calmOff: 'Normal motion',
    voiceNote: "Voices are temporary device speech for now and will be replaced by the characters' recorded voices.",
    simNote: 'Prototype: buying and subscribing here are simulated. No real payment happens.',
    subTitle: 'Premium subscription', subBody: 'Unlocks every included story for as long as the subscription lasts.', subMonthly: 'Monthly', subYearly: 'Yearly', priceLater: 'Price set when the store is connected',
    subscribe: 'Subscribe (simulated)', subActive: 'Subscription active until', subNone: 'No subscription', endSub: 'End subscription (simulated)',
    singleTitle: 'Buy a single story', singleBody: 'A story bought on its own stays available after a subscription ends.', buy: 'Buy story (simulated)', owned: 'Owned', viaSub: 'Included in subscription', locked: 'Locked',
    restore: 'Restore purchases', restored: 'Purchases saved on this device were restored.',
    filmPending: "The story film is in production. Available now: 'Listen & read' with the original book pages.",
    downTitle: 'Files on this device', downPages: "Peep's story pages (Arabic and English), about 2 MB", downFilm: 'Story film', notYet: 'Not available yet', onDevice: 'On device', notOnDevice: 'Not downloaded',
    delDown: 'Delete downloads', getDown: 'Download', downNote: 'In the finished app, films download on request so the app stays small.',
    timeBody: 'When time is up, Peep shows a calm reminder with no loud sounds.', off: 'No limit', min: 'min',
    privacy: ['No ads, no chat, no contact with strangers.', 'No location, camera or microphone requests.', 'No account needed to play. Progress is saved on this device only.', "In the finished app, a parent's account is used only to link purchases and sync them across devices.", 'Games work offline. Buying, restoring and checking a subscription need a connection.'],
    help1: 'Every activity works by tapping or dragging. A child can also tap an item, then tap where it goes.', help2: 'The question-mark button repeats instructions; the map button returns to the map.',
    resetBody: 'Deletes decorations, garden layout and activity progress from this device. Bought stories are kept.', resetBtn: 'Reset progress', resetSure: 'Are you sure? This cannot be undone.', yesReset: 'Yes, delete progress', cancel: 'Cancel', resetDone: 'Progress has been reset.',
  });

  /* ---------- gate: three number words to tap in order ---------- */
  PW.parentGate = function () {
    const code = [0, 0, 0].map(() => 1 + Math.floor(Math.random() * 9));
    let typed = [];
    const card = PW.el(`<div class="card gate" style="width:820px">
      <div class="ask">${PW.t('gateAsk')}</div>
      <div class="ask" style="font-size:44px;margin-top:8px;color:#6e4a2e">${code.map((n) => NUM[PW.S.lang][n]).join(PW.S.lang === 'ar' ? '، ' : ', ')}</div>
      <div class="typed"></div>
      <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join('')}<button data-n="x" aria-label="${PW.t('gateClose')}" style="background:#eadcc0">✕</button></div>
    </div>`);
    PW.openModal(card);
    const out = card.querySelector('.typed');
    card.querySelectorAll('.keys button').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.n === 'x') { PW.closeModal(); return; }
      typed.push(+b.dataset.n); out.textContent = '•'.repeat(typed.length);
      if (typed.length === 3) {
        if (typed.join() === code.join()) { PW.closeModal(); PW.go('parents'); }
        else { typed = []; setTimeout(() => { out.textContent = ''; }, 300); }
      }
    }));
  };

  /* ---------- parents' area ---------- */
  const TABS = ['tLang', 'tSound', 'tStories', 'tDown', 'tTime', 'tPrivacy', 'tReset'];
  let tab = 'tLang';
  PW.scenes.parents = {
    hud: [],
    enter(root) {
      PW.hush();
      const wrap = PW.el(`<div class="parents"><nav><h2>${PW.t('pTitle')}</h2></nav><section></section></div>`);
      root.appendChild(wrap);
      const nav = wrap.querySelector('nav'), sec = wrap.querySelector('section');
      TABS.forEach((k) => {
        const b = PW.el(`<button class="${k === tab ? 'on' : ''}">${PW.t(k)}</button>`);
        b.addEventListener('click', () => { tab = k; nav.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); this.render(sec); });
        nav.appendChild(b);
      });
      const back = PW.el(`<button class="pbtn" style="margin-top:auto">${PW.t('pBack')}</button>`);
      back.addEventListener('click', () => PW.go('title'));
      nav.appendChild(back);
      this.render(sec);
    },
    render(sec) {
      const t = PW.t, S = PW.S;
      const chips = (opts, cur, fn) => { const d = PW.el('<div class="opts"></div>'); opts.forEach(([v, l]) => { const c = PW.el(`<button class="chip${v === cur ? ' on' : ''}">${l}</button>`); c.addEventListener('click', () => { fn(v); this.render(sec); }); d.appendChild(c); }); return d; };
      const btn = (cls, label, fn) => { const b = PW.el(`<button class="pbtn ${cls}">${label}</button>`); b.addEventListener('click', fn); return b; };
      sec.innerHTML = `<h3>${t(tab)}</h3>`;
      if (tab === 'tLang') {
        sec.appendChild(PW.el(`<p>${t('langNote')}</p>`));
        sec.appendChild(chips([['ar', 'العربية'], ['en', 'English']], S.lang, (v) => { S.lang = v; PW.save(); PW.applyLang(); PW.go('parents'); }));
      }
      if (tab === 'tSound') {
        [['music', 'music'], ['sfx', 'sfx'], ['voice', 'voices']].forEach(([k, l]) => {
          const row = PW.el(`<label class="slider"><span>${t(l)}</span><input id="vol-${k}" type="range" min="0" max="100" value="${Math.round(S.vol[k] * 100)}"><b>${Math.round(S.vol[k] * 100)}</b></label>`);
          const inp = row.querySelector('input');
          inp.addEventListener('input', () => { S.vol[k] = inp.value / 100; row.querySelector('b').textContent = inp.value; PW.Snd.init(); PW.Snd.levels(); PW.save(); });
          inp.addEventListener('change', () => { if (k === 'voice') PW.speak(PW.t('peepHello'), 'peep'); else PW.Snd.play('chime'); });
          sec.appendChild(row);
        });
        sec.appendChild(PW.el(`<p style="margin-top:22px"><b>${t('calm')}</b></p>`));
        sec.appendChild(chips([[false, t('calmOff')], [true, t('calmOn')]], !!S.calm, (v) => { S.calm = v; PW.save(); document.body.classList.toggle('calm', v); }));
        sec.appendChild(PW.el(`<p class="note">${t('voiceNote')}</p>`));
      }
      if (tab === 'tStories') {
        sec.appendChild(PW.el(`<p class="note">${t('simNote')}</p>`));
        const active = S.sub && S.sub.until > Date.now();
        sec.appendChild(PW.el(`<h3 style="font-size:30px;margin-top:18px">${t('subTitle')}</h3>`));
        sec.appendChild(PW.el(`<p>${t('subBody')} <span class="status${active ? ' ok' : ''}">${active ? `${t('subActive')} ${new Date(S.sub.until).toLocaleDateString(S.lang === 'ar' ? 'ar' : 'en-GB')}` : t('subNone')}</span></p>`));
        const plans = PW.el('<div class="plan"></div>');
        [['monthly', 'subMonthly', 30], ['yearly', 'subYearly', 365]].forEach(([id, l, days]) => {
          const d = PW.el(`<div><b>${t(l)}</b><div style="font-size:21px;margin:6px 0 14px;opacity:.75">${t('priceLater')}</div></div>`);
          d.appendChild(btn('', t('subscribe'), () => { S.sub = { plan: id, until: Date.now() + days * 864e5 }; PW.save(); this.render(sec); }));
          plans.appendChild(d);
        });
        sec.appendChild(plans);
        if (active) sec.appendChild(btn('alt', t('endSub'), () => { S.sub = null; PW.save(); this.render(sec); }));
        sec.appendChild(PW.el(`<h3 style="font-size:30px;margin-top:30px">${t('singleTitle')}</h3>`));
        sec.appendChild(PW.el(`<p>${t('singleBody')}</p>`));
        PW.stories.filter((s) => s.ready).forEach((s) => {
          const own = S.stories.includes(s.id);
          const status = own ? t('owned') : PW.hasStory(s.id) ? t('viaSub') : t('locked');
          const row = PW.el(`<div style="display:flex;gap:22px;align-items:center;margin:8px 0 18px"><img src="assets/story/cover-${S.lang}.webp" alt="" style="width:110px;height:110px;border-radius:14px"><div><b>${s.title[S.lang]}</b><br><span class="status${PW.hasStory(s.id) ? ' ok' : ''}">${status}</span></div></div>`);
          if (!own) row.appendChild(btn('', t('buy'), () => { S.stories.push(s.id); S.receipts = (S.receipts || []).concat([{ id: s.id, at: Date.now() }]); PW.save(); this.render(sec); }));
          sec.appendChild(row);
        });
        sec.appendChild(PW.el(`<p class="note">${t('filmPending')}</p>`));
        const rs = btn('alt', t('restore'), () => { (S.receipts || []).forEach((r) => { if (!S.stories.includes(r.id)) S.stories.push(r.id); }); PW.save(); this.render(sec); sec.appendChild(PW.el(`<p class="status ok" style="margin-top:14px">${t('restored')}</p>`)); });
        rs.style.marginTop = '20px';
        sec.appendChild(rs);
      }
      if (tab === 'tDown') {
        const on = S.downloaded.peep1;
        sec.appendChild(PW.el(`<p><b>${t('downTitle')}</b></p>`));
        const r1 = PW.el(`<div style="display:flex;gap:20px;align-items:center;margin-bottom:16px"><span>${t('downPages')}</span><span class="status${on ? ' ok' : ''}">${on ? t('onDevice') : t('notOnDevice')}</span></div>`);
        sec.appendChild(r1);
        sec.appendChild(PW.el(`<div style="display:flex;gap:20px;align-items:center;margin-bottom:24px"><span>${t('downFilm')}</span><span class="status">${t('notYet')}</span></div>`));
        sec.appendChild(on ? btn('alt', t('delDown'), () => { S.downloaded.peep1 = false; PW.save(); this.render(sec); }) : btn('', t('getDown'), () => { S.downloaded.peep1 = true; PW.save(); this.render(sec); }));
        sec.appendChild(PW.el(`<p class="note" style="margin-top:24px">${t('downNote')}</p>`));
      }
      if (tab === 'tTime') {
        sec.appendChild(PW.el(`<p>${t('timeBody')}</p>`));
        sec.appendChild(chips([[0, t('off')], [15, `15 ${t('min')}`], [30, `30 ${t('min')}`], [45, `45 ${t('min')}`], [60, `60 ${t('min')}`]], S.playLimit, (v) => { S.playLimit = v; PW.save(); PW.resetPlayClock(); }));
      }
      if (tab === 'tPrivacy') {
        sec.appendChild(PW.el(`<ul style="line-height:1.6;max-width:62ch;padding-inline-start:28px">${t('privacy').map((x) => `<li>${x}</li>`).join('')}</ul>`));
        sec.appendChild(PW.el(`<p>${t('help1')}</p>`));
        sec.appendChild(PW.el(`<p>${t('help2')}</p>`));
      }
      if (tab === 'tReset') {
        sec.appendChild(PW.el(`<p>${t('resetBody')}</p>`));
        const area = PW.el('<div></div>');
        const ask = () => {
          area.innerHTML = `<p><b>${t('resetSure')}</b></p>`;
          const row = PW.el('<div style="display:flex;gap:16px"></div>');
          row.append(btn('danger', t('yesReset'), () => {
            const keep = { stories: S.stories, receipts: S.receipts, sub: S.sub, vol: S.vol, playLimit: S.playLimit, calm: S.calm };
            PW.resetAll(); Object.assign(PW.S, keep); PW.save();
            area.innerHTML = `<p class="status ok">${t('resetDone')}</p>`;
          }), btn('alt', t('cancel'), () => { area.innerHTML = ''; area.appendChild(btn('danger', t('resetBtn'), ask)); }));
          area.appendChild(row);
        };
        area.appendChild(btn('danger', t('resetBtn'), ask));
        sec.appendChild(area);
      }
    },
  };
})();
