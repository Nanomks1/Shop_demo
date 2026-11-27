/* ============================================================
   topup.js — التعبئة الحسابية:
   (001) بطاقات التعبئة × الفئة · (002) أرصدة الهواتف · (003) مال الرف
   المجموع الكامل = (001) + (002) + (003) ومقارنته برأس المال المرجعي،
   والخصم التلقائي من مال الرف عند الشراء أو تعبئة الهاتف.
   يُحمَّل بعد core.js مباشرة.
   ============================================================ */
(() => {
  Object.assign(IC, { topup: '<path d="M5 20v-4M10 20v-8M15 20V8M20 20V4"/>' });
  const OPS = [['IAM', '#2563eb'], ['ORANGE', '#ea580c'], ['INWI', '#9333ea']];
  const CARDS = [5, 10, 20, 50], PH = [1];
  const D0 = { gv: 15, bo: 30, br: 10, cl: { 5: 3, 10: 3, 20: 3, 50: 3 }, rh: 10, cap: 0 };
  const GREY = '#94a3b8', DC = { 5: '#0d9488', 10: '#2563eb', 20: '#7c3aed', 50: '#db2777' };
  const T = () => (S.tp = S.tp || []);
  const rnd2 = x => Math.round((+x || 0) * 100) / 100;
  const cf = () => {
    const c = (S.cfg && S.cfg.tp) || {};
    const o = { ...D0, ...c, cl: { ...D0.cl, ...(c.cl || {}) } };
    o.gm = {}; CARDS.forEach(n => { o.gm[n] = (c.gm && c.gm[n] != null) ? c.gm[n] : o.gv; });
    return o;
  };
  const okE = () => isAdmin() || !S.users.length;
  const rid = (op, k, n) => k == 'm' ? 'tp_cash_box' : k == 'n' ? 'tp_note' : 'tp_' + op + '_' + k + n;
  const rec = (op, k, n) => T().find(r => r.id == rid(op, k, n));
  const recId = id => T().find(r => r.id == id);
  const val = (op, k, n) => { const r = rec(op, k, n); return r && r.val != null ? r.val : null; };
  const cashRec = () => recId('tp_cash_box');
  const cashVal = () => { const r = cashRec(); return r && r.val != null ? rnd2(r.val) : null; };
  const isToday = t => !!t && new Date(t).toDateString() == new Date().toDateString();
  const noteRec = () => { const r = recId('tp_note'); return r && r.val && isToday(r.at) ? r : null; };
  const num = s => { s = dg(s).replace(',', '.').replace(/[^\d.]/g, ''); if (!s) return null; const n = parseFloat(s); return isNaN(n) ? null : rnd2(n); };
  const dm = v => rnd2(v) + ' درهم';
  const pad = n => String(n).padStart(2, '0');
  const when = t => { if (!t) return 'لم يُسجَّل بعد'; const d = new Date(t); return isToday(t) ? 'اليوم ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : fd(t); };
  /* الحالة: u غير مسجَّل · g متوفر · y قارب · r نافد/منخفض */
  const stP = v => v == null ? 'u' : v <= cf().br ? 'r' : v <= cf().bo ? 'y' : 'g';
  const stC = (n, v) => v == null ? 'u' : v <= 0 ? 'r' : v <= cf().cl[n] ? 'y' : 'g';
  const ST_LBL = { g: 'متوفر', y: 'قارب', r: 'نفد', u: 'غير مسجّل' };
  const each = fn => OPS.forEach(([op]) => { PH.forEach(n => fn(op, 'p', n, stP(val(op, 'p', n)))); CARDS.forEach(n => fn(op, 'c', n, stC(n, val(op, 'c', n)))); });
  const tally = () => { const t = { r: 0, y: 0, g: 0, u: 0 }; each((a, b, c, s) => t[s]++); return t; };
  const phDone = () => { let n = 0; OPS.forEach(([op]) => PH.forEach(p => { const r = rec(op, 'p', p); if (r && r.val != null && isToday(r.at)) n++; })); return n; };
  const lastPh = () => T().filter(r => r.k == 'p' && r.at).sort((a, b) => b.at - a.at)[0];
  let svT = 0;
  function putRaw(id, op, k, n, v, est, now) {
    let r = recId(id);
    if (!r) { r = { id, op, k, n }; T().push(r); }
    r.val = v; r.est = est ? 1 : 0; r.at = r.cf = Date.now(); r.by = S.me || '';
    clearTimeout(svT);
    if (now) save();
    else svT = setTimeout(save, 150);   // الحفظ بعد الرسم حتى لا يتأخر الضغط ولا تُغلق لوحة المفاتيح
  }
  const put = (op, k, n, v, est, now) => putRaw(rid(op, k, n), op, k, n, v, est, now);
  /* الحساب الكامل: (001) البطاقات + (002) الهواتف + (003) مال الرف */
  function calc() {
    const byOp = {};
    let cardsTot = 0, phonesTot = 0, missCards = 0, estCards = 0, missPh = 0, oldPh = 0;
    OPS.forEach(([op]) => {
      let cs = 0, cm = 0, ce = 0;
      CARDS.forEach(n => {
        const r = rec(op, 'c', n), v = r && r.val != null ? r.val : null;
        if (v == null) cm++;
        else { cs = rnd2(cs + v * n); if (r.est) ce++; }
      });
      const pr = rec(op, 'p', 1), pv = pr && pr.val != null ? rnd2(pr.val) : null;
      const pm = pv == null ? 1 : 0, po = pv != null && !isToday(pr.at) ? 1 : 0;
      byOp[op] = { cardsSum: cs, phSum: pv || 0, phVal: pv, total: rnd2(cs + (pv || 0)), cardsMiss: cm, cardsEst: ce, phMiss: pm, phOld: po };
      cardsTot = rnd2(cardsTot + cs); phonesTot = rnd2(phonesTot + (pv || 0));
      missCards += cm; estCards += ce; missPh += pm; oldPh += po;
    });
    const cr = cashRec(), cv = cashVal(), cashTot = cv || 0;
    const cashMiss = cv == null ? 1 : 0, cashOld = cv != null && !isToday(cr.at) ? 1 : 0;
    const grand = rnd2(cardsTot + phonesTot + cashTot), cap = rnd2(cf().cap || 0);
    const incomplete = (missCards + estCards + missPh + oldPh + cashMiss + cashOld) > 0;
    const diff = cap > 0 ? rnd2(grand - cap) : null;
    return { byOp, cardsTot, phonesTot, cashTot, cashVal: cv, cashMiss, cashOld, grand, cap, diff, missCards, estCards, missPh, oldPh, incomplete };
  }
  /* ملخص حالة التعبئة للتقرير */
  window.tpSummary = () => {
    const t = tally(), done = phDone(), tot = OPS.length * PH.length, c = calc(), nr = noteRec();
    return {
      u: t.u, done, tot, stalePh: done < tot,
      cardsTot: c.cardsTot, phonesTot: c.phonesTot, cashTot: c.cashTot,
      cashMiss: c.cashMiss, cashOld: c.cashOld, grand: c.grand,
      cap: c.cap, diff: c.diff, incomplete: c.incomplete,
      estCards: c.estCards, missCards: c.missCards, note: nr ? nr.val : ''
    };
  };
  /* ---------- أسطر نواقص التقرير: [القسم, النص, الحالة, دالة «تم»] ---------- */
  window.tpLines = () => {
    const L = [];
    each((op, k, n, s) => {
      if (s != 'r' && s != 'y') return;
      const v = val(op, 'c', n), vp = val(op, 'p', n), id = rid(op, k, n), r0 = rec(op, k, n);
      if (k == 'p') {
        const tm = r0 && r0.at ? ' (' + (isToday(r0.at) ? 'اليوم ' + pad(new Date(r0.at).getHours()) + ':' + pad(new Date(r0.at).getMinutes()) : agoTxt(r0.at)) + ')' : '';
        L.push(['التعبئة', op + ' — رصيد الهاتف ' + dm(vp) + tm, s, `tpFix('${id}')`]);
      } else {
        L.push(['التعبئة', op + ' — بطاقة ' + n + ' — ' + (v <= 0 ? 'نفد' : (r0 || {}).est ? 'قارب النفاد' : 'باقي ' + v), s, `tpFix('${id}')`]);
      }
    });
    return L;
  };
  /* ---------- الشراء / التعبئة من مال الرف (من التقرير ✓ أو من شاشة التعبئة +) ---------- */
  window.tpBuySync = (k, baseOrDenom) => {
    const qEl = $('tpb_q'), dEl = $('tpb_d'), cEl = $('tpb_calc');
    if (!qEl || !dEl || !cEl) return;
    const q = num(qEl.value) || 0;
    if (k == 'c') {
      const cnt = Math.max(0, Math.round(q)), cost = rnd2(cnt * baseOrDenom);
      cEl.textContent = 'التكلفة الاسمية: ' + dm(cost);
      dEl.value = cnt > 0 ? String(cost) : '';
    } else {
      const add = Math.max(0, q), tot = rnd2((baseOrDenom || 0) + add);
      cEl.textContent = 'الرصيد بعد التعبئة: ' + dm(tot);
      dEl.value = add > 0 ? String(add) : '';
    }
    tpBuyWarn();
  };
  window.tpBuyWarn = () => {
    const dEl = $('tpb_d'), wEl = $('tpb_w'); if (!dEl || !wEl) return;
    const d = num(dEl.value) || 0, c = cashVal();
    wEl.textContent = (c != null && d > c) ? 'تنبيه: المخصوم (' + dm(d) + ') أكبر من مال الرف المسجّل (' + dm(c) + ') — سيصبح مال الرف 0 درهم.' : '';
  };
  window.tpBuySub = k => {
    const qEl = $('tpb_q'), dEl = $('tpb_d'); if (!qEl || !dEl) return;
    const q = num(qEl.value);
    if (!(q > 0)) return toast(k == 'c' ? 'اكتب عدد البطاقات التي وصلت' : 'اكتب المبلغ الذي تم تعبئته');
    const ded = num(dEl.value);
    finish({ q: k == 'c' ? Math.round(q) : rnd2(q), ded: ded != null && ded >= 0 ? rnd2(ded) : 0 });
  };
  function tpBuySheet(id) {
    const p = id.split('_'), op = p[1], k = p[2][0], n = +p[2].slice(1);
    const r0 = rec(op, k, n), curV = r0 && r0.val != null ? r0.val : null, curCash = cashVal();
    const snapTp = () => JSON.stringify(T()), snapRin = () => JSON.stringify(S.cfg.rin || []);
    const title = k == 'p' ? 'تعبئة هاتف ' + op : 'شراء بطاقات ' + op + ' — فئة ' + n + ' درهم';
    const curTxt = k == 'p'
      ? ('الرصيد المسجل الآن: <b>' + (curV == null ? 'غير مسجّل' : esc(dm(curV))) + '</b>')
      : ('المتوفر الآن: <b>' + (curV == null ? 'غير مسجّل' : (r0 && r0.est ? '≈' : '') + curV + ' بطاقة') + '</b>');
    const cashTxt = curCash == null
      ? 'مال الرف (003) غير مسجّل بعد (لن يُخصم منه تلقائياً حتى تسجّل مبلغ الرف)'
      : 'المتوفر في مال الرف (003) حالياً: <b>' + esc(dm(curCash)) + '</b>';
    $('sh').innerHTML = `<div class="bar"></div><h3>${esc(title)}</h3><p class="m">${curTxt}</p>`
      + `<label>${k == 'p' ? 'المبلغ المُعبَّأ / المُضاف (درهم)' : 'الكمية التي وصلت (عدد البطاقات)'}<input id="tpb_q" type="tel" inputmode="${k == 'p' ? 'decimal' : 'numeric'}" placeholder="${k == 'p' ? 'مثال: 500' : 'مثال: 10'}" oninput="tpBuySync('${k}',${k == 'p' ? (curV || 0) : n})"></label>`
      + `<div id="tpb_calc" class="m" style="margin:2px 0 6px">${k == 'p' ? (curV != null ? 'الرصيد بعد التعبئة: ' + esc(dm(curV)) : '') : 'التكلفة الاسمية: 0 درهم'}</div>`
      + `<label>المبلغ المأخوذ من مال الرف (003) — درهم<input id="tpb_d" type="tel" inputmode="decimal" placeholder="0" oninput="tpBuyWarn()"><span class="m" style="font-weight:400;display:block;margin-top:3px">يُحسب تلقائياً كاملاً؛ اجعله 0 إن دُفع من خارج درج التعبئة.</span></label>`
      + `<div class="m" style="margin-top:6px">${cashTxt}</div><div id="tpb_w" class="rs" style="margin-top:4px"></div>`
      + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="tpBuySub('${k}')">تأكيد</button></div>`;
    sheetOpen(v => {
      if (!v) return;
      const prev = snapTp(), prevRin = snapRin(), c0 = cashVal();
      const didDed = c0 != null && v.ded > 0;
      if (k == 'p') {
        const nv = rnd2((curV || 0) + v.q);
        put(op, 'p', n, nv, 0, true);
        if (didDed) putRaw('tp_cash_box', '', 'm', 0, Math.max(0, rnd2(c0 - v.ded)), 0, true);
        if (typeof rcLogIn == 'function') rcLogIn('tp', id, '', 'تعبئة ' + op + ' — رصيد الهاتف', '+' + dm(v.q) + ' ← ' + dm(nv) + (didDed ? ' · خُصم ' + dm(v.ded) : ''));
        save(); render();
        toast('تمت تعبئة ' + op + (didDed ? ' وخُصم ' + dm(v.ded) + ' من الرف' : ''), () => { S.tp = JSON.parse(prev); S.cfg.rin = JSON.parse(prevRin); });
      } else {
        const nv = (curV || 0) + v.q;
        put(op, 'c', n, nv, 0, true);
        if (didDed) putRaw('tp_cash_box', '', 'm', 0, Math.max(0, rnd2(c0 - v.ded)), 0, true);
        if (typeof rcLogIn == 'function') rcLogIn('tp', id, '', 'تعبئة ' + op + ' — بطاقة ' + n, '+' + v.q + (didDed ? ' · خُصم ' + dm(v.ded) + ' من الرف' : ''));
        save(); render();
        toast('أُضيفت ' + v.q + ' بطاقة' + (didDed ? ' وخُصم ' + dm(v.ded) + ' من الرف' : ''), () => { S.tp = JSON.parse(prev); S.cfg.rin = JSON.parse(prevRin); });
      }
    });
    setTimeout(() => { const el = $('tpb_q'); if (el) el.focus(); }, 120);
  }
  window.tpFix = id => tpBuySheet(id);
  window.tpBuyOpen = (op, k, n) => tpBuySheet(rid(op, k, n));
  /* ---------- التحديث في مكانه بلا إعادة رسم (حتى لا تُغلق لوحة المفاتيح) ---------- */
  const setT = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const lastLine = () => {
    const d = phDone(), l = lastPh();
    return d >= OPS.length * PH.length ? ['تم تحديث أرصدة الهواتف اليوم' + (l ? ' — ' + when(l.at) + (l.by ? ' — ' + l.by : '') : ''), 0] : ['أرصدة اليوم: ' + d + ' من ' + OPS.length * PH.length + ' (لم تكتمل)', 1];
  };
  function paint() {
    const c = calc(), nr = noteRec();
    each((op, k, n, s) => {
      const id = op + '_' + k + n, r = $('tpr_' + id), rec0 = rec(op, k, n); if (!r) return;
      r.className = 'tpr' + (k == 'c' ? ' c' : '') + (s == 'r' || s == 'y' ? ' ' + s : '');
      if (k == 'p') {
        const d = $('tpd_' + id); if (d) d.style.background = s == 'u' ? GREY : DT[s];
        setT('tpt_' + id, s == 'r' ? 'منخفض' : s == 'y' ? 'قارب' : '');
        const cfB = $('tpcfm_' + id); if (cfB) cfB.hidden = !(rec0 && rec0.val != null && !isToday(rec0.at));
      } else {
        const est = !!(rec0 && rec0.est && rec0.val != null), v = rec0 && rec0.val != null ? rec0.val : null;
        const stEl = $('tpst_' + id);
        if (stEl) { stEl.className = 'tp-st ' + s; stEl.textContent = est ? ST_LBL[s] + ' (تقديري)' : ST_LBL[s]; }
        const valEl = $('tpv_' + id);
        if (valEl) valEl.textContent = v == null ? '—' : (est ? '≈' : '= ') + dm(v * n);
        const zEl = $('tpz_' + id);
        if (zEl) zEl.classList.toggle('on', v === 0 && !est);
      }
    });
    const t = tally(); setT('tps_r', t.r); setT('tps_y', t.y); setT('tps_u', t.u + c.estCards);
    const l = lastLine(), e = $('tpl'); if (e) { e.textContent = l[0]; e.className = 'rsent' + (l[1] ? ' w' : ''); }
    OPS.forEach(([op]) => {
      const L = T().filter(r => r.op == op && r.at).sort((a, b) => b.at - a.at)[0];
      setT('tpu_' + op, L ? when(L.at) : 'لم يُسجَّل بعد');
      const o = c.byOp[op];
      setT('tpoh_' + op, 'بطاقات: ' + dm(o.cardsSum) + ' · الإجمالي: ' + dm(o.total));
    });
    const cr = cashRec(), cBtn = $('tpcfm_cash');
    if (cBtn) cBtn.hidden = !(c.cashVal != null && cr && !isToday(cr.at));
    setT('tpu_cash', cr && c.cashVal != null ? when(cr.at) : 'لم يُسجَّل بعد');
    setT('tps_c', dm(c.cardsTot)); setT('tps_p', dm(c.phonesTot)); setT('tps_m', c.cashVal == null ? 'غير مسجّل' : dm(c.cashTot));
    setT('tps_tot', dm(c.grand));
    const dfEl = $('tps_diff'), alEl = $('tps_al');
    if (dfEl) {
      if (c.cap > 0) {
        if (c.incomplete) { dfEl.className = 'tp-diff wn'; dfEl.textContent = 'رأس المال ' + dm(c.cap) + ' · الجرد غير مكتمل'; }
        else if (c.diff === 0) { dfEl.className = 'tp-diff ok'; dfEl.textContent = 'متوازن ✓ (' + dm(c.cap) + ')'; }
        else if (c.diff < 0) { dfEl.className = 'tp-diff al'; dfEl.textContent = 'ناقص ' + dm(Math.abs(c.diff)) + ' من ' + dm(c.cap); }
        else { dfEl.className = 'tp-diff ok'; dfEl.textContent = 'زائد ' + dm(c.diff) + ' فوق ' + dm(c.cap); }
      } else {
        dfEl.className = 'tp-diff'; dfEl.textContent = okE() ? 'اضغط لتحديد رأس المال المرجعي' : 'رأس المال غير محدد';
      }
    }
    if (alEl) {
      const msgs = [];
      if (c.missCards) msgs.push(arCnt(c.missCards, 'فئة بطاقات غير مسجلة', 'فئتا بطاقات غير مسجلتين', 'فئات بطاقات غير مسجلة', 'فئة بطاقات غير مسجلة'));
      if (c.estCards) msgs.push(arCnt(c.estCards, 'فئة تقديرية تحتاج عداً فعلياً', 'فئتان تقديريتان', 'فئات تقديرية تحتاج عداً فعلياً', 'فئة تقديرية'));
      if (c.missPh || c.oldPh) msgs.push('أرصدة الهواتف غير مكتملة اليوم (' + phDone() + '/' + OPS.length + ')');
      if (c.cashMiss) msgs.push('مال الرف (003) غير مسجّل');
      else if (c.cashOld) msgs.push('مال الرف لم يُؤكَّد اليوم');
      if (msgs.length) {
        alEl.hidden = false;
        alEl.className = 'tp-al wn';
        alEl.innerHTML = `<b>${I('alert')} الحساب غير مكتمل اليوم:</b> ${esc(msgs.join(' · '))}`;
      } else if (c.cap > 0 && c.diff < 0) {
        alEl.hidden = false;
        alEl.className = 'tp-al al';
        alEl.innerHTML = `<b>${I('alert')} ناقص ${esc(dm(Math.abs(c.diff)))} عن رأس المال — راجع سريعاً:</b>`
          + `<div class="m">1) هل اشتُريت بطاقات أو تعبئة دون تسجيلها؟ 2) هل بيع رصيد بالكريدي دون تسجيله في الديون؟ 3) هل أُخذ مبلغ من مال الرف؟</div>`
          + (nr ? `<div class="tp-note-show">${I('chat')} <b>ملاحظة اليوم:</b> ${esc(nr.val)}</div>` : '')
          + `<button type="button" class="btn s sm" style="margin-top:6px" onclick="tpNoteEd()">${nr ? 'تعديل ملاحظة الفرق' : '+ تدوين ملاحظة لسبب الفرق'}</button>`;
      } else if (nr) {
        alEl.hidden = false;
        alEl.className = 'tp-al';
        alEl.innerHTML = `<div class="tp-note-show">${I('chat')} <b>ملاحظة اليوم:</b> ${esc(nr.val)}</div><button type="button" class="btn s sm" style="margin-top:6px" onclick="tpNoteEd()">تعديل الملاحظة</button>`;
      } else {
        alEl.hidden = true;
      }
    }
  }
  const tm = {};
  window.tpIn = (op, k, n, el, now) => {
    clearTimeout(tm[el.id]);
    const raw = el.value.trim();
    if (raw === '') {
      const goClr = () => {
        const id = k == 'm' ? 'tp_cash_box' : rid(op, k, n);
        if (recId(id)) putRaw(id, op, k, n, null, 0, !!now);
        el.placeholder = '—'; paint();
      };
      now ? goClr() : (tm[el.id] = setTimeout(goClr, 600));
      return;
    }
    const x = num(raw); if (x == null) return;
    const go1 = () => {
      const id = k == 'm' ? 'tp_cash_box' : rid(op, k, n);
      putRaw(id, op, k, n, k == 'c' ? Math.max(0, Math.round(x)) : Math.max(0, x), 0, !!now);
      el.placeholder = '—'; paint();
    };
    now ? go1() : (tm[el.id] = setTimeout(go1, 600));
  };
  window.tpStep = (op, n, d) => {
    const r = rec(op, 'c', n), cur = r && r.val != null ? Math.round(r.val) : 0;
    if (d < 0 && cur <= 0) return toast('العدد 0 بالفعل');
    const nv = Math.max(0, cur + d), el = $('tpi_' + op + '_c' + n);
    put(op, 'c', n, nv, 0, false);
    if (el) { el.value = String(nv); el.placeholder = '—'; }
    paint();
  };
  window.tpZero = (op, n) => {
    const el = $('tpi_' + op + '_c' + n);
    put(op, 'c', n, 0, 0, false);
    if (el) { el.value = '0'; el.placeholder = '—'; }
    paint();
  };
  window.tpCfm = id => {
    const r = recId(id); if (!r || r.val == null) return;
    putRaw(r.id, r.op || '', r.k, r.n || 0, r.val, 0, true);
    paint();
    toast('تم التأكيد لليوم ✓');
  };
  window.tpNoteEd = () => {
    const cur = (noteRec() || {}).val || '';
    ask('ملاحظة فرق حساب التعبئة لليوم', [{ k: 't', l: 'سبب النقص أو الزيادة (تُعرض في التقرير لليوم فقط)', v: cur }], 'حفظ').then(v => {
      if (!v) return;
      const t = v.t.trim();
      putRaw('tp_note', '', 'n', 0, t, 0, true);
      render();
    });
  };
  /* ---------- الشاشة ---------- */
  const row1 = (op, k, n) => {
    const r = rec(op, k, n), v = val(op, k, n), id = op + '_' + k + n, ph = k == 'p', est = !!(r && r.est);
    if (ph) return `<div class="tpr" id="tpr_${id}"><span class="dotl" id="tpd_${id}"></span><span class="tpn">رصيد الهاتف</span><span class="tpt" id="tpt_${id}"></span>`
      + `<button type="button" class="tp-cfm" id="tpcfm_${id}" hidden onclick="tpCfm('${rid(op, 'p', n)}')" title="تأكيد نفس الرصيد لليوم">${I('check')}</button>`
      + `<input class="tpi" id="tpi_${id}" inputmode="decimal" placeholder="—" value="${v == null ? '' : esc(v)}" oninput="tpIn('${op}','p',${n},this)" onchange="tpIn('${op}','p',${n},this,1)" onfocus="this.select()"><span class="m tpu">درهم</span>`
      + `<button type="button" class="tp-buy" onclick="tpBuyOpen('${op}','p',${n})" title="تعبئة الهاتف من مال الرف">${I('plus')}</button></div>`;
    return `<div class="tpr c" id="tpr_${id}" style="--dc:${DC[n]}">`
      + `<div class="tp-left"><span class="tpd">${n}<small>درهم</small></span><div class="tp-meta"><span class="tp-st" id="tpst_${id}"></span><b class="tp-val" id="tpv_${id}"></b></div></div>`
      + `<div class="tp-ctrl">`
      + `<button type="button" class="tp-sb" onclick="tpStep('${op}',${n},-1)" aria-label="ناقص 1">−</button>`
      + `<input class="tpi" id="tpi_${id}" inputmode="numeric" placeholder="${est && v != null ? '≈' + v : '—'}" value="${v == null || est ? '' : esc(v)}" oninput="tpIn('${op}','c',${n},this)" onchange="tpIn('${op}','c',${n},this,1)" onfocus="this.select()">`
      + `<button type="button" class="tp-sb" onclick="tpStep('${op}',${n},1)" aria-label="زائد 1">+</button>`
      + `<button type="button" class="tp-z" id="tpz_${id}" onclick="tpZero('${op}',${n})" title="نفد (0)">0</button>`
      + `<button type="button" class="tp-buy" onclick="tpBuyOpen('${op}','c',${n})" title="شراء بطاقات من مال الرف">${I('plus')}</button>`
      + `</div></div>`;
  };
  VW.tp = () => {
    const t = tally(), l = lastLine(), cv = cashVal();
    let h = `<div class="qbar rsum"><div class="qpill al"><div class="qn" id="tps_r">${t.r}</div><div class="ql">نافد / منخفض</div></div><div class="qpill wn"><div class="qn" id="tps_y">${t.y}</div><div class="ql">قارب النفاد</div></div><div class="qpill rp"><div class="qn" id="tps_u">${t.u}</div><div class="ql">غير مسجّل</div></div></div>`
      + `<div id="tpl" class="rsent ${l[1] ? 'w' : ''}">${esc(l[0])}</div>`;
    OPS.forEach(([op, col]) => {
      h += `<div class="card tpop" style="--oc:${col}"><div class="tpoh"><b>${op}</b><span class="m" id="tpu_${op}"></span></div>`
        + `<div class="tp-subtot m" id="tpoh_${op}"></div>`
        + '<div class="tpl">هاتف التعبئة</div>' + PH.map(n => row1(op, 'p', n)).join('')
        + '<div class="tpl">بطاقات التعبئة (العدد × الفئة)</div>' + CARDS.map(n => row1(op, 'c', n)).join('') + '</div>';
    });
    h += `<div class="card tp-cash-card"><div class="tpoh"><b>(003) مال رف التعبئة</b><span class="m" id="tpu_cash"></span></div>`
      + `<div class="row2" style="flex-wrap:wrap;margin-top:6px"><span class="m f1">المبلغ النقدي الموجود في درج/رف التعبئة</span>`
      + `<button type="button" class="btn s sm" id="tpcfm_cash" hidden onclick="tpCfm('tp_cash_box')">${I('check')} نفس المبلغ اليوم</button>`
      + `<input class="tpi tp-cash-inp" id="tpi_cash" inputmode="decimal" placeholder="0" value="${cv == null ? '' : esc(cv)}" oninput="tpIn('','m',0,this)" onchange="tpIn('','m',0,this,1)" onfocus="this.select()"><span class="m tpu">درهم</span></div></div>`;
    h += `<div class="card tp-sum-card">`
      + `<div class="tp-sum-grid">`
      + `<div class="tp-sum-cell"><small>(001) البطاقات</small><b id="tps_c">0 درهم</b></div>`
      + `<div class="tp-sum-cell"><small>(002) الهواتف</small><b id="tps_p">0 درهم</b></div>`
      + `<div class="tp-sum-cell"><small>(003) مال الرف</small><b id="tps_m">0 درهم</b></div>`
      + `</div>`
      + `<div class="tp-grand-bar"><div><small>المجموع الكامل (001 + 002 + 003)</small><b id="tps_tot">0 درهم</b></div>`
      + `<button type="button" id="tps_diff" class="tp-diff" onclick="if(okTpE())tpLim('cap')"></button></div>`
      + `<div id="tps_al" class="tp-al" hidden></div>`
      + `</div>`;
    h += `<div class="row2" style="margin-top:10px"><button class="btn s" onclick="go('rep',{rf:'topup'})">عرض في التقرير</button></div>`;
    return { t: 'التعبئة', h, a: paint };
  };
  /* ---------- الحدود ورأس المال المرجعي ---------- */
  const LB = { bo: 'رصيد الهاتف: «قارب» عند ≤ (درهم)', br: 'رصيد الهاتف: «منخفض» عند ≤ (درهم)', cap: 'رأس مال التعبئة المرجعي (درهم — 0 لإخفاء المقارنة)', rh: 'ساعة بدء تذكير الصباح (0 إلى 23)' };
  window.tpLim = k => {
    if (!okE()) return toast('للمدير فقط');
    const c = cf(), isC = k.startsWith('cl'), isG = k.startsWith('gm'), cur = isC ? c.cl[k.slice(2)] : isG ? c.gm[k.slice(2)] : (c[k] ?? 0);
    ask('إعدادات التعبئة', [{ k: 'v', l: isC ? 'بطاقة ' + k.slice(2) + ': «قارب» عند عدد ≤' : LB[k], t: 'tel', v: String(cur) }]).then(v => {
      if (!v) return;
      const raw = v.v.trim();
      const x = raw === '' ? (k == 'cap' ? 0 : null) : num(raw);
      if (x == null || (k == 'rh' && x > 23)) return;
      upd(() => {
        const o = { ...(S.cfg.tp || {}) };
        if (isC) o.cl = { ...(o.cl || {}), [k.slice(2)]: Math.round(x) };
        else if (isG) o.gm = { ...(o.gm || {}), [k.slice(2)]: Math.round(x) };
        else o[k] = x;
        S.cfg.tp = o;
      });
    });
  };
  VW.st_tp = () => {
    const c = cf(), od = offDays();
    return {
      t: 'حدود وحساب التعبئة',
      h: '<p class="m">تحدد متى يصير اللون برتقالياً أو أحمر، والمبلغ المرجعي لمقارنة حساب التعبئة اليومي.</p>'
        + '<h3>حساب الصندوق ورأس المال</h3>'
        + row('رأس مال التعبئة المرجعي', "tpLim('cap')", c.cap > 0 ? dm(c.cap) : 'غير محدد')
        + '<h3>رصيد هاتف التعبئة</h3>'
        + row(LB.bo, "tpLim('bo')", c.bo) + row(LB.br, "tpLim('br')", c.br)
        + '<h3>بطاقات التعبئة (الأحمر عند 0 دائماً)</h3><p class="m">تُحسب الحالة تلقائياً من العدد المسجل لكل فئة.</p>'
        + CARDS.map(n => row('بطاقة ' + n + ' درهم — «قارب» عند ≤', "tpLim('cl" + n + "')", c.cl[n])).join('')
        + '<h3>التذكير</h3>' + row(LB.rh, "tpLim('rh')", c.rh + ':00')
        + row('أيام عطلة المحل (بلا تذكير)', "go('st_shop')", od.length ? arCnt(od.length, 'يوم', 'يومان', 'أيام') : 'لا عطلة')
        + '<div style="margin-top:14px"><button class="btn s" onclick="if(okTpE())upd(()=>{delete S.cfg.tp})">إرجاع الحدود الافتراضية</button></div>'
    };
  };
  window.okTpE = () => okE() || (toast('للمدير فقط'), false);
  /* ---------- الرئيسية والمزيد ---------- */
  window.tpSkip = () => sure('لن تُسجَّل أرصدة التعبئة اليوم؟ سيختفي التذكير حتى الغد.', 'نعم، لا تسجيل اليوم', false).then(ok => {
    if (!ok) return;
    S.cfg.tx = new Date().toDateString(); save(); render();
    toast('أُلغي تذكير التعبئة لليوم', () => { delete S.cfg.tx; });
  });
  HOME.top.push(() => {
    const d = new Date();
    if ((typeof noRem == 'function' && noRem()) || isOffDay(d) || d.getHours() < cf().rh || phDone() >= OPS.length * PH.length || S.cfg.tx == d.toDateString()) return '';
    return `<div class="card row2">${I('alert')}<span style="flex:1">لم تُسجَّل أرصدة التعبئة اليوم</span><button class="btn sm" onclick="go('tp')">سجّل الآن</button><button class="btn s sm" aria-label="لا تسجيل اليوم" onclick="tpSkip()">✕</button></div>`;
  });
  MORE.push({ g: 'sec', o: 55, l: 'التعبئة', d: 'رأس مال التعبئة، حدود الأرصدة والبطاقات وتذكير الصباح', fn: "go('st_tp')" });
})();