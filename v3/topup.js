/* ============================================================
   topup.js — التعبئة الحسابية المبسّطة:
   بطاقات التعبئة (العدد × الفئة) + أرصدة الهواتف + رصيد صندوق التعبئة
   المجموع الكامل ومقارنته برأس المال المرجعي، والخصم من الصندوق أو التزويد الخارجي وحركة المعلم.
   يُحمَّل بعد core.js مباشرة.
   ============================================================ */
(() => {
  Object.assign(IC, { topup: '<path d="M5 20v-4M10 20v-8M15 20V8M20 20V4"/>' });
  const OPS = ['IAM', 'ORANGE', 'INWI'];
  const DEF_CARDS = [5, 10, 20, 50], PH = [1];
  const D0 = { bo: 30, br: 10, cl: { 5: 3, 10: 3, 20: 3, 50: 3 }, rh: 10, cap: 0, rm: 1 };
  const TPXD = { un: 1, sum: 1, dc: 1, tm: 1, jl: 1, rem: 1, ao: 1, by: 1, wu: 1 };
  const TPXL = [
    ['un', 'شريط «تراجع» بعد كل ضغطة − / + في البطاقات'],
    ['sum', 'إظهار بطاقة الحساب والمجموع الكامل في شاشة التعبئة'],
    ['dc', 'اعتبار التزويد مخصوماً من صندوق التعبئة افتراضياً'],
    ['tm', 'إظهار ساعة آخر تحديث بجانب رصيد كل هاتف وصندوق التعبئة'],
    ['jl', 'إدراج بطاقات التعبئة في الجولة اليومية (الجرد)'],
    ['rem', 'تسجيل الباقي تلقائياً كتزويد خارجي عند الخصم الجزئي من الصندوق'],
    ['ao', 'حذف حركات المعلم للمدير فقط'],
    ['by', 'إظهار اسم صاحب الحركة ووقتها في سطرها'],
    ['wu', 'تنبيه قبل تزويد فئة بطاقات «غير مسجّلة» (يُعتبر مخزونها السابق 0)']
  ];
  const T = () => (S.tp = S.tp || []);
  const rnd2 = x => Math.round((+x || 0) * 100) / 100;
  const cf = () => {
    const c = (S.cfg && S.cfg.tp) || {};
    return { ...D0, ...c, cl: { ...D0.cl, ...(c.cl || {}) }, off: c.off || {}, x: c.x || {} };
  };
  const tpx = k => { const v = cf().x[k]; return v === undefined ? TPXD[k] : v; };
  const cardsList = () => {
    const a = cf().cards;
    return Array.isArray(a) && a.length ? [...new Set(a.map(x => Math.round(+x)).filter(x => x > 0))].sort((x, y) => x - y) : DEF_CARDS;
  };
  const cardOn = (op, n) => !cf().off[op + '_' + n];
  const cardLim = n => { const l = cf().cl[n]; return l != null ? l : 3; };
  const okE = () => isAdmin() || !S.users.length;
  const rid = (op, k, n) => k == 'm' ? 'tp_cash_box' : k == 'n' ? 'tp_note' : k == 'a' ? 'tp_adj' : 'tp_' + op + '_' + k + n;
  const rec = (op, k, n) => T().find(r => r.id == rid(op, k, n));
  const recId = id => T().find(r => r.id == id);
  const val = (op, k, n) => { const r = rec(op, k, n); return r && r.val != null ? r.val : null; };
  const cashRec = () => recId('tp_cash_box');
  const cashVal = () => { const r = cashRec(); return r && r.val != null ? rnd2(r.val) : null; };
  const isToday = t => !!t && new Date(t).toDateString() == new Date().toDateString();
  const noteRec = () => { const r = recId('tp_note'); return r && r.val && isToday(r.at) ? r : null; };
  const adjRec = () => { const r = recId('tp_adj'); return r && Array.isArray(r.list) && isToday(r.at) ? r : null; };
  const adjList = () => (adjRec() || {}).list || [];
  const adjWho = m => tpx('by') ? [m.by, m.t ? hm(m.t) : ''].filter(Boolean).join(' · ') : '';
  const adjDelOk = () => !tpx('ao') || okE();
  const num = (s, isInt) => {
    s = dg(s).trim().replace(',', '.');
    if (!s) return null;
    if (isInt) { const d = s.replace(/\D/g, ''); return d ? parseInt(d, 10) : null; }
    let seen = 0, out = '';
    for (const ch of s) {
      if (ch >= '0' && ch <= '9') out += ch;
      else if (ch == '.' && !seen) { seen = 1; out += '.'; }
    }
    if (!out || out == '.') return null;
    const n = parseFloat(out);
    return isNaN(n) ? null : rnd2(n);
  };
  const dm = v => rnd2(v) + ' درهم';
  const pad = n => String(n).padStart(2, '0');
  const hm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const when = t => !t ? 'لم يُسجَّل بعد' : isToday(t) ? 'اليوم ' + hm(t) : fd(t);
  /* الحالة: u غير مسجَّل · g متوفر · y قارب · r نفد/منخفض */
  const stP = v => v == null ? 'u' : v <= cf().br ? 'r' : v <= cf().bo ? 'y' : 'g';
  const stC = (n, v) => v == null ? 'u' : v <= 0 ? 'r' : v <= cardLim(n) ? 'y' : 'g';
  const ST_LBL = { g: 'متوفر', y: 'قارب', r: 'نفد', u: 'غير مسجّل' };
  const each = fn => {
    const cs = cardsList();
    OPS.forEach(op => {
      PH.forEach(n => fn(op, 'p', n, stP(val(op, 'p', n))));
      cs.forEach(n => { if (cardOn(op, n)) fn(op, 'c', n, stC(n, val(op, 'c', n))); });
    });
  };
  const tally = () => { const t = { r: 0, y: 0, g: 0, u: 0 }; each((a, b, c, s) => t[s]++); return t; };
  const phDone = () => { let n = 0; OPS.forEach(op => PH.forEach(p => { const r = rec(op, 'p', p); if (r && r.val != null && isToday(r.at)) n++; })); return n; };
  const lastPh = () => T().filter(r => r.k == 'p' && r.at).sort((a, b) => b.at - a.at)[0];
  let svT = 0;
  function putRaw(id, op, k, n, v, now) {
    let r = recId(id);
    if (!r) { r = { id, op, k, n }; T().push(r); }
    r.val = v; delete r.est; r.at = r.cf = Date.now(); r.by = S.me || '';
    clearTimeout(svT);
    if (now) { svT = 0; save(); }
    else svT = setTimeout(() => { svT = 0; save(); }, 150);
  }
  const put = (op, k, n, v, now) => putRaw(rid(op, k, n), op, k, n, v, now);
  function putAdj(list, now = true) {
    let r = recId('tp_adj');
    if (!r) { r = { id: 'tp_adj', op: '', k: 'a', n: 0, list: [] }; T().push(r); }
    r.list = list; r.at = r.cf = Date.now(); r.by = S.me || '';
    clearTimeout(svT);
    if (now) { svT = 0; save(); }
    else svT = setTimeout(() => { svT = 0; save(); }, 150);
  }
  window.tpIsCardActive = (op, n) => cardsList().includes(+n) && cardOn(op, +n);
  window.tpJournOn = () => !!tpx('jl');
  /* الحساب الكامل: البطاقات + الهواتف + رصيد صندوق التعبئة + حركات اليوم */
  function calc() {
    const cs = cardsList(), byOp = {}, adjs = adjList();
    let cardsTot = 0, phonesTot = 0, missCards = 0, missPh = 0, oldPh = 0;
    OPS.forEach(op => {
      let cSum = 0, cm = 0;
      cs.forEach(n => {
        if (!cardOn(op, n)) return;
        const r = rec(op, 'c', n), v = r && r.val != null ? r.val : null;
        if (v == null) cm++;
        else cSum = rnd2(cSum + v * n);
      });
      const pr = rec(op, 'p', 1), pv = pr && pr.val != null ? rnd2(pr.val) : null;
      const pm = pv == null ? 1 : 0, po = pv != null && !isToday(pr.at) ? 1 : 0;
      byOp[op] = { cardsSum: cSum, phSum: pv || 0, phVal: pv, total: rnd2(cSum + (pv || 0)), cardsMiss: cm, phMiss: pm, phOld: po };
      cardsTot = rnd2(cardsTot + cSum); phonesTot = rnd2(phonesTot + (pv || 0));
      missCards += cm; missPh += pm; oldPh += po;
    });
    const cr = cashRec(), cv = cashVal(), cashTot = cv || 0;
    const cashMiss = cv == null ? 1 : 0, cashOld = cv != null && !isToday(cr.at) ? 1 : 0;
    const grand = rnd2(cardsTot + phonesTot + cashTot), cap = rnd2(cf().cap || 0);
    let extTot = 0, inTot = 0, outTot = 0;
    adjs.forEach(m => {
      const a = rnd2(m.amt || 0);
      if (m.kind == 'ext') extTot = rnd2(extTot + a);
      else if (m.kind == 'in') inTot = rnd2(inTot + a);
      else if (m.kind == 'out') outTot = rnd2(outTot + a);
    });
    const netAdj = rnd2(extTot + inTot - outTot);
    const expected = cap > 0 ? rnd2(cap + netAdj) : 0;
    const incomplete = (missCards + missPh + oldPh + cashMiss + cashOld) > 0;
    const diff = cap > 0 ? rnd2(grand - expected) : null;
    return {
      byOp, cardsTot, phonesTot, cashTot, cashVal: cv, cashMiss, cashOld, grand, cap,
      expected, netAdj, extTot, inTot, outTot, adjList: adjs, diff,
      missCards, missPh, oldPh, incomplete
    };
  }
  window.tpSummary = () => {
    const t = tally(), done = phDone(), tot = OPS.length * PH.length, c = calc(), nr = noteRec();
    return {
      u: t.u, done, tot, stalePh: done < tot,
      cardsTot: c.cardsTot, phonesTot: c.phonesTot, cashTot: c.cashTot,
      cashMiss: c.cashMiss, cashOld: c.cashOld, grand: c.grand,
      cap: c.cap, expected: c.expected, netAdj: c.netAdj,
      extTot: c.extTot, inTot: c.inTot, outTot: c.outTot, adjList: c.adjList,
      diff: c.diff, incomplete: c.incomplete,
      missCards: c.missCards, note: nr ? nr.val : ''
    };
  };
  /* ---------- أسطر نواقص التقرير: [القسم, النص, الحالة, دالة «تم»] ---------- */
  window.tpLines = () => {
    const L = [];
    each((op, k, n, s) => {
      if (s != 'r' && s != 'y') return;
      const v = val(op, 'c', n), vp = val(op, 'p', n), id = rid(op, k, n), r0 = rec(op, k, n);
      if (k == 'p') {
        const tmTxt = r0 && r0.at ? ' (' + (isToday(r0.at) ? 'اليوم ' + hm(r0.at) : agoTxt(r0.at)) + ')' : '';
        L.push(['التعبئة', op + ' — رصيد الهاتف ' + dm(vp) + tmTxt, s, `tpFix('${id}')`]);
      } else {
        L.push(['التعبئة', op + ' — بطاقة ' + n + ' — ' + (v <= 0 ? 'نفد' : 'باقي ' + v), s, `tpFix('${id}')`]);
      }
    });
    return L;
  };
  /* ---------- مزامنة وتفريغ مؤقتات الكتابة السريعة ---------- */
  const tm = {}, PEND = {};
  function flushOne(inpId) {
    if (tm[inpId]) { clearTimeout(tm[inpId]); delete tm[inpId]; }
    if (PEND[inpId]) { const fn = PEND[inpId]; delete PEND[inpId]; fn(); }
  }
  window.tpFlush = () => {
    Object.keys(tm).forEach(k => clearTimeout(tm[k]));
    Object.keys(PEND).forEach(k => { const fn = PEND[k]; delete PEND[k]; delete tm[k]; if (fn) fn(); });
    if (svT) { clearTimeout(svT); svT = 0; save(); }
  };
  addEventListener('visibilitychange', () => { if (document.hidden) window.tpFlush(); });
  /* ---------- الشراء / التزويد (من صندوق التعبئة أو من خارج الصندوق) ---------- */
  let TPB = { k: 'c', base: 0, src: 'box' };
  window.tpBuySrc = src => {
    TPB.src = src == 'ext' ? 'ext' : 'box';
    const b1 = $('tpb_sbox'), b2 = $('tpb_sext'), wrap = $('tpb_dwrap'), dEl = $('tpb_d');
    if (b1) b1.classList.toggle('on', TPB.src == 'box');
    if (b2) b2.classList.toggle('on', TPB.src == 'ext');
    if (wrap) wrap.hidden = TPB.src == 'ext';
    if (TPB.src == 'box' && dEl) window.tpBuySync(TPB.k, TPB.base);
    window.tpBuyWarn();
  };
  window.tpBuySync = (k, baseOrDenom) => {
    const qEl = $('tpb_q'), dEl = $('tpb_d'), cEl = $('tpb_calc');
    if (!qEl || !cEl) return;
    const q = num(qEl.value, k == 'c') || 0;
    if (k == 'c') {
      const cnt = Math.max(0, Math.round(q)), cost = rnd2(cnt * baseOrDenom);
      cEl.textContent = 'التكلفة الاسمية: ' + dm(cost);
      if (dEl) dEl.value = TPB.src == 'box' && cnt > 0 ? String(cost) : '';
    } else {
      const add = Math.max(0, q), tot = rnd2((baseOrDenom || 0) + add);
      cEl.textContent = 'الرصيد بعد التعبئة: ' + dm(tot);
      if (dEl) dEl.value = TPB.src == 'box' && add > 0 ? String(add) : '';
    }
    window.tpBuyWarn();
  };
  window.tpBuyWarn = () => {
    const dEl = $('tpb_d'), wEl = $('tpb_w'); if (!wEl) return;
    if (TPB.src == 'ext') { wEl.textContent = ''; return; }
    const d = dEl ? (num(dEl.value) || 0) : 0, c = cashVal();
    wEl.textContent = (c != null && d > c) ? 'تنبيه: المخصوم (' + dm(d) + ') أكبر من رصيد صندوق التعبئة المسجّل (' + dm(c) + ') — سيصبح رصيد الصندوق 0 درهم.' : '';
  };
  window.tpBuySub = k => {
    const qEl = $('tpb_q'), dEl = $('tpb_d'); if (!qEl) return;
    if (k == 'c') qEl.value = dg(qEl.value).replace(/\D/g, '');
    const q = num(qEl.value, k == 'c');
    if (!(q > 0)) return toast(k == 'c' ? 'اكتب عدد البطاقات التي وصلت' : 'اكتب المبلغ الذي تم تعبئته');
    const ded = TPB.src == 'ext' ? 0 : (dEl ? num(dEl.value) : 0);
    finish({ q: k == 'c' ? Math.round(q) : rnd2(q), ded: ded != null && ded >= 0 ? rnd2(ded) : 0, ext: TPB.src == 'ext' ? 1 : 0 });
  };
  function tpBuySheet(id) {
    window.tpFlush();
    const p = id.split('_'), op = p[1], k = p[2][0], n = +p[2].slice(1);
    const r0 = rec(op, k, n), curV = r0 && r0.val != null ? r0.val : null, curCash = cashVal();
    const snapTp = () => JSON.stringify(T()), snapRin = () => JSON.stringify(S.cfg.rin || []);
    TPB = { k, base: k == 'p' ? (curV || 0) : n, src: tpx('dc') ? 'box' : 'ext' };
    const title = k == 'p' ? 'تعبئة هاتف ' + op : 'شراء بطاقات ' + op + ' — فئة ' + n + ' درهم';
    const stalePhNote = k == 'p' && r0 && r0.at && !isToday(r0.at) ? ' (' + when(r0.at) + ' — تأكد من الرصيد الفعلي في الشريحة)' : '';
    const curTxt = k == 'p'
      ? ('الرصيد المسجل الآن: <b>' + (curV == null ? 'غير مسجّل' : esc(dm(curV))) + '</b>' + esc(stalePhNote))
      : ('المتوفر الآن: <b>' + (curV == null ? 'غير مسجّل' : curV + ' بطاقة') + '</b>');
    const cashTxt = curCash == null
      ? 'رصيد صندوق التعبئة غير مسجّل بعد (لن يُخصم منه تلقائياً حتى تسجّله)'
      : 'المتوفر في صندوق التعبئة حالياً: <b>' + esc(dm(curCash)) + '</b>';
    $('sh').innerHTML = `<div class="bar"></div><h3>${esc(title)}</h3><p class="m">${curTxt}</p>`
      + `<label>مصدر الدفع</label><div class="tp-src-grid"><button type="button" id="tpb_sbox" class="tag ${TPB.src == 'box' ? 'on' : ''}" onclick="tpBuySrc('box')">من صندوق التعبئة</button><button type="button" id="tpb_sext" class="tag ${TPB.src == 'ext' ? 'on' : ''}" onclick="tpBuySrc('ext')">من خارج الصندوق (المعلم)</button></div>`
      + `<label>${k == 'p' ? 'المبلغ المُعبَّأ / المُضاف (درهم)' : 'الكمية التي وصلت (عدد البطاقات)'}<input id="tpb_q" type="tel" inputmode="${k == 'p' ? 'decimal' : 'numeric'}" placeholder="${k == 'p' ? 'مثال: 500' : 'مثال: 10'}" oninput="tpBuySync('${k}',${TPB.base})"></label>`
      + `<div id="tpb_calc" class="m">${k == 'p' ? (curV != null ? 'الرصيد بعد التعبئة: ' + esc(dm(curV)) : '') : 'التكلفة الاسمية: 0 درهم'}</div>`
      + `<div id="tpb_dwrap" ${TPB.src == 'ext' ? 'hidden' : ''}><label>المبلغ المأخوذ من صندوق التعبئة (درهم)<input id="tpb_d" type="tel" inputmode="decimal" placeholder="0" oninput="tpBuyWarn()"><span class="m">يُحسب تلقائياً كاملاً؛ اجعله 0 إن دُفع جزء من خارج الصندوق.</span></label><div class="m">${cashTxt}</div></div>`
      + `<p class="m" ${TPB.src == 'ext' ? '' : 'hidden'} id="tpb_ext_hint"></p>`
      + `<div id="tpb_w" class="rs"></div>`
      + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="tpBuySub('${k}')">تأكيد</button></div>`;
    const apply = v => {
      const prev = snapTp(), prevRin = snapRin(), c0 = cashVal();
      const didDed = !v.ext && c0 != null && v.ded > 0;
      const extVal = k == 'p' ? v.q : rnd2(v.q * n);
      const actDed = didDed ? Math.min(v.ded, c0) : 0;
      const rem = v.ext ? extVal : (tpx('rem') && c0 != null ? Math.max(0, rnd2(extVal - actDed)) : 0);
      const extNote = (v.ext ? 'تزويد ' : 'جزء من خارج الصندوق — ');
      if (k == 'p') {
        const nv = rnd2((curV || 0) + v.q);
        put(op, 'p', n, nv, true);
        if (didDed) putRaw('tp_cash_box', '', 'm', 0, Math.max(0, rnd2(c0 - v.ded)), true);
        if (rem > 0) putAdj([...adjList(), { id: uid(), t: Date.now(), kind: 'ext', amt: rem, note: extNote + op + ' +' + dm(v.q), app: 0, by: S.me || '' }], true);
        if (typeof rcLogIn == 'function') rcLogIn('tp', id, '', 'تعبئة ' + op + ' — رصيد الهاتف', '+' + dm(v.q) + ' ← ' + dm(nv) + (v.ext ? ' · خارج الصندوق' : didDed ? ' · خُصم ' + dm(actDed) : ''));
        save(); render();
        toast('تمت تعبئة ' + op + (v.ext ? ' (تزويد خارج الصندوق)' : didDed ? ' وخُصم ' + dm(actDed) + ' من الصندوق' : '') + (!v.ext && rem > 0 ? ' · ' + dm(rem) + ' من خارجه' : ''), () => { S.tp = JSON.parse(prev); S.cfg.rin = JSON.parse(prevRin); });
      } else {
        const nv = (curV || 0) + v.q;
        put(op, 'c', n, nv, true);
        if (didDed) putRaw('tp_cash_box', '', 'm', 0, Math.max(0, rnd2(c0 - v.ded)), true);
        if (rem > 0) putAdj([...adjList(), { id: uid(), t: Date.now(), kind: 'ext', amt: rem, note: (v.ext ? '' : 'جزء من خارج الصندوق — ') + 'بطاقات ' + op + ' ' + n + ' (+' + v.q + ')', app: 0, by: S.me || '' }], true);
        if (typeof rcLogIn == 'function') rcLogIn('tp', id, '', 'تعبئة ' + op + ' — بطاقة ' + n, '+' + v.q + (v.ext ? ' · خارج الصندوق' : didDed ? ' · خُصم ' + dm(actDed) : ''));
        save(); render();
        toast('أُضيفت ' + v.q + ' بطاقة' + (v.ext ? ' (تزويد خارج الصندوق)' : didDed ? ' وخُصم ' + dm(actDed) + ' من الصندوق' : '') + (!v.ext && rem > 0 ? ' · ' + dm(rem) + ' من خارجه' : ''), () => { S.tp = JSON.parse(prev); S.cfg.rin = JSON.parse(prevRin); });
      }
    };
    sheetOpen(v => {
      if (!v) return;
      if (k == 'c' && curV == null && tpx('wu')) sure('فئة ' + n + ' درهم غير مسجّلة؛ سيُحسب المخزون بعد التزويد ' + v.q + ' بطاقة فقط. هل هذا صحيح؟', 'نعم، تابع', false).then(y => { if (y) apply(v); });
      else apply(v);
    });
    setTimeout(() => { const el = $('tpb_q'); if (el) el.focus(); }, 120);
  }
  window.tpFix = id => tpBuySheet(id);
  window.tpBuyOpen = (op, k, n) => tpBuySheet(rid(op, k, n));
  /* خيارات الفئة عند الضغط على شارتها (شراء من الصندوق أو تصفير) */
  window.tpCardAct = (op, n) => {
    window.tpFlush();
    const r0 = rec(op, 'c', n), v = r0 && r0.val != null ? r0.val : null;
    $('sh').innerHTML = `<div class="bar"></div><h3>بطاقة <span class="tp-op" data-op="${esc(op)}">${esc(op)}</span> — فئة ${n} درهم</h3>`
      + `<p class="m">المتوفر الآن: <b>${v == null ? 'غير مسجّل' : v + ' بطاقة (' + dm(v * n) + ')'}</b></p>`
      + `<button class="btn" onclick="finish('buy')">${I('plus')} تزويد بطاقات</button>`
      + `<button class="btn s del" onclick="finish('zero')">تصفير الفئة (نفد = 0)</button>`
      + `<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
    sheetOpen(w => {
      if (w == 'buy') setTimeout(() => tpBuySheet(rid(op, 'c', n)), 380);
      else if (w == 'zero') window.tpZero(op, n);
    });
  };
  /* نافذة اختيار موحّدة لتزويد رصيد الهاتف أو البطاقات */
  window.tpBuyMenu = () => {
    window.tpFlush();
    const cs = cardsList();
    $('sh').innerHTML = `<div class="bar"></div><h3>تزويد رصيد أو بطاقات</h3>`
      + `<label>تعبئة رصيد هاتف</label><div class="tp-menu-row">${OPS.map(op => `<button type="button" class="btn s sm tp-op" data-op="${op}" onclick="finish('${rid(op, 'p', 1)}')">${esc(op)}</button>`).join('')}</div>`
      + OPS.map(op => {
        const btns = cs.filter(n => cardOn(op, n)).map(n => `<button type="button" class="btn s sm" onclick="finish('${rid(op, 'c', n)}')">${n} درهم</button>`).join('');
        return btns ? `<label>بطاقات <b class="tp-op" data-op="${op}">${esc(op)}</b></label><div class="tp-menu-row">${btns}</div>` : '';
      }).join('')
      + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button></div>`;
    sheetOpen(id => { if (id) setTimeout(() => tpBuySheet(id), 380); });
  };
  /* ---------- حركة المعلم في الصندوق (سحب أو إضافة مال لليوم) ---------- */
  let TCM = { kind: 'out', app: 1 };
  window.tpCmKind = k => {
    TCM.kind = k == 'in' ? 'in' : 'out';
    if ($('tpcm_out')) $('tpcm_out').classList.toggle('on', TCM.kind == 'out');
    if ($('tpcm_in')) $('tpcm_in').classList.toggle('on', TCM.kind == 'in');
  };
  window.tpCmApp = () => {
    TCM.app = TCM.app ? 0 : 1;
    if ($('tpcm_app')) $('tpcm_app').classList.toggle('on', !!TCM.app);
  };
  window.tpCashSub = () => {
    const aEl = $('tpcm_a'), nEl = $('tpcm_n'); if (!aEl) return;
    const amt = num(aEl.value);
    if (!(amt > 0)) return toast('اكتب مبلغاً أكبر من صفر');
    finish({ kind: TCM.kind, amt, note: nEl ? nEl.value.trim() : '', app: TCM.app ? 1 : 0 });
  };
  window.tpCashMove = () => {
    window.tpFlush();
    const cv = cashVal();
    TCM = { kind: 'out', app: cv != null ? 1 : 0 };
    const snapTp = () => JSON.stringify(T());
    $('sh').innerHTML = `<div class="bar"></div><h3>حركة المعلم في صندوق التعبئة</h3>`
      + `<p class="m">سجّل هنا إذا أخذ المعلم مالاً من الصندوق أو أضاف مالاً له اليوم حتى يستقيم الحساب أمام الجميع.${cv != null ? ' الصندوق الآن: <b>' + esc(dm(cv)) + '</b>.' : ''}</p>`
      + `<label>نوع الحركة</label><div class="tp-src-grid"><button type="button" id="tpcm_out" class="tag on" onclick="tpCmKind('out')">سحب من الصندوق (−)</button><button type="button" id="tpcm_in" class="tag" onclick="tpCmKind('in')">إضافة للصندوق (+)</button></div>`
      + `<label>المبلغ (درهم)<input id="tpcm_a" type="tel" inputmode="decimal" placeholder="مثال: 500"></label>`
      + `<label>سبب / ملاحظة (اختياري)<input id="tpcm_n" placeholder="مثال: سحب المعلم"></label>`
      + (cv != null ? `<button type="button" id="tpcm_app" class="tag on" style="width:100%;justify-content:center;margin-top:6px" onclick="tpCmApp()">تعديل رقم «رصيد صندوق التعبئة» تلقائياً (أوقفه إن عددت الصندوق بعد الحركة)</button>` : '')
      + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="tpCashSub()">حفظ الحركة</button></div>`;
    sheetOpen(v => {
      if (!v) return;
      const prev = snapTp(), c0 = cashVal(), applyCash = !!(v.app && c0 != null);
      const item = { id: uid(), t: Date.now(), kind: v.kind, amt: v.amt, note: v.note, app: applyCash ? 1 : 0, by: S.me || '' };
      putAdj([...adjList(), item], true);
      if (applyCash) {
        const nv = v.kind == 'out' ? Math.max(0, rnd2(c0 - v.amt)) : rnd2(c0 + v.amt);
        putRaw('tp_cash_box', '', 'm', 0, nv, true);
      }
      render();
      toast((v.kind == 'out' ? 'سُجّل سحب ' : 'سُجّلت إضافة ') + dm(v.amt), () => { S.tp = JSON.parse(prev); });
    });
    setTimeout(() => { const el = $('tpcm_a'); if (el) el.focus(); }, 120);
  };
  window.tpAdjDel = id => {
    if (!adjDelOk()) return toast('حذف الحركة للمدير فقط');
    const L = adjList(), m = L.find(x => x.id == id); if (!m) return;
    sure('حذف حركة «' + (m.note || (m.kind == 'out' ? 'سحب من الصندوق' : m.kind == 'in' ? 'إضافة للصندوق' : 'تزويد خارجي')) + ' — ' + dm(m.amt) + '»؟', 'حذف').then(y => {
      if (!y) return;
      const prev = JSON.stringify(T());
      putAdj(L.filter(x => x.id != id), true);
      if (m.app && cashVal() != null) {
        const c0 = cashVal();
        const nv = m.kind == 'out' ? rnd2(c0 + m.amt) : Math.max(0, rnd2(c0 - m.amt));
        putRaw('tp_cash_box', '', 'm', 0, nv, true);
      }
      render();
      toast('تم حذف الحركة', () => { S.tp = JSON.parse(prev); });
    });
  };
  /* ---------- نافذة التوازن ورأس المال المرجعي ---------- */
  window.tpDiffAct = () => {
    window.tpFlush();
    const c = calc();
    const adjH = c.adjList.length ? `<div class="card">${c.adjList.map(m => `<div class="rrow"><span class="rt"><b>${m.kind == 'out' ? '−' : '+'} ${esc(dm(m.amt))}</b> · ${esc(m.note || (m.kind == 'out' ? 'سحب من الصندوق' : m.kind == 'in' ? 'إضافة للصندوق' : 'تزويد خارجي'))}${adjWho(m) ? ' <small class="m">(' + esc(adjWho(m)) + ')</small>' : ''}</span>${adjDelOk() ? `<button type="button" class="btn s sm del" onclick="finish(null);setTimeout(()=>tpAdjDel('${m.id}'),320)">حذف</button>` : ''}</div>`).join('')}</div>` : '';
    const admActs = okE()
      ? `<button class="btn" onclick="finish('cap')">تعديل رأس المال المرجعي يدوياً</button>`
        + (c.grand > 0 && c.grand != c.cap ? `<button class="btn s" onclick="finish('adopt')">اعتماد المجموع الحالي (${esc(dm(c.grand))}) كرأس مال مرجعي</button>` : '')
      : `<p class="m">تعديل رأس المال المرجعي للمدير فقط.</p>`;
    $('sh').innerHTML = `<div class="bar"></div><h3>تفصيل حساب التعبئة</h3>`
      + `<div class="card"><div class="row2"><span>مجموع البطاقات</span><b>${esc(dm(c.cardsTot))}</b></div><div class="row2" style="margin-top:4px"><span>مجموع أرصدة الهواتف</span><b>${esc(dm(c.phonesTot))}</b></div><div class="row2" style="margin-top:4px"><span>صندوق التعبئة</span><b>${c.cashVal == null ? 'غير مسجّل' : esc(dm(c.cashTot))}</b></div><div class="row2" style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--b)"><b>المجموع الكامل</b><b>${esc(dm(c.grand))}</b></div>`
      + (c.cap > 0 ? `<div class="row2" style="margin-top:4px"><span class="m">رأس المال المرجعي${c.netAdj ? ' (بعد حركات اليوم)' : ''}</span><b>${esc(dm(c.expected))}</b></div>` : '')
      + `</div>` + adjH + admActs + `<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
    sheetOpen(w => {
      if (w == 'cap') setTimeout(() => window.tpLim('cap'), 350);
      else if (w == 'adopt') {
        sure('اعتماد ' + dm(c.grand) + ' كرأس مال مرجعي جديد؟', 'اعتماد', false).then(y => {
          if (y) upd(() => { S.cfg.tp = { ...(S.cfg.tp || {}), cap: c.grand }; });
        });
      }
    });
  };
  /* ---------- التحديث في مكانه بلا إعادة رسم (حتى لا تُغلق لوحة المفاتيح) ---------- */
  const setT = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const lastLine = () => {
    const d = phDone(), l = lastPh();
    return d >= OPS.length * PH.length ? ['تم تحديث أرصدة الهواتف اليوم' + (l ? ' — ' + when(l.at) + (l.by ? ' — ' + l.by : '') : ''), 0] : ['أرصدة اليوم: ' + d + ' من ' + OPS.length * PH.length + ' (لم تكتمل)', 1];
  };
  function paint() {
    const c = calc(), nr = noteRec(), showTm = !!tpx('tm');
    each((op, k, n, s) => {
      const id = op + '_' + k + n, rec0 = rec(op, k, n);
      if (k == 'p') {
        const d = $('tpd_' + id); if (d) d.style.background = s == 'u' ? 'var(--m)' : DT[s];
        setT('tpt_' + id, s == 'r' ? 'منخفض' : s == 'y' ? 'قارب' : '');
        const tmEl = $('tptm_' + id);
        if (tmEl) { tmEl.hidden = !(showTm && rec0 && rec0.at && rec0.val != null); tmEl.textContent = rec0 && rec0.at ? when(rec0.at) : ''; }
        const cfB = $('tpcfm_' + id); if (cfB) cfB.hidden = !(rec0 && rec0.val != null && !isToday(rec0.at));
      } else {
        const v = rec0 && rec0.val != null ? rec0.val : null;
        const bd = $('tpd_' + id); if (bd) bd.className = 'tpd ' + s;
        const stEl = $('tpst_' + id); if (stEl) { stEl.className = 'tp-st ' + s; stEl.textContent = ST_LBL[s]; }
        const valEl = $('tpv_' + id); if (valEl) valEl.textContent = v == null ? '—' : dm(v * n);
      }
    });
    const t = tally(); setT('tps_r', t.r); setT('tps_y', t.y); setT('tps_u', t.u);
    const l = lastLine(), e = $('tpl'); if (e) { e.textContent = l[0]; e.className = 'rsent' + (l[1] ? ' w' : ''); }
    OPS.forEach(op => {
      const L = T().filter(r => r.op == op && r.at).sort((a, b) => b.at - a.at)[0];
      setT('tpu_' + op, L ? when(L.at) : 'لم يُسجَّل بعد');
      const o = c.byOp[op];
      setT('tpoh_' + op, 'بطاقات: ' + dm(o.cardsSum) + ' · الإجمالي: ' + dm(o.total));
    });
    const cr = cashRec(), cBtn = $('tpcfm_cash');
    if (cBtn) cBtn.hidden = !(c.cashVal != null && cr && !isToday(cr.at));
    setT('tpu_cash', cr && c.cashVal != null ? when(cr.at) : 'لم يُسجَّل بعد');
    const adjBox = $('tp_adj_box');
    if (adjBox) {
      adjBox.hidden = !c.adjList.length;
      adjBox.innerHTML = c.adjList.map(m => {
        const tag = m.kind == 'out' ? 'سحب المعلم −' : m.kind == 'in' ? 'إضافة المعلم +' : 'تزويد خارجي +';
        return `<div class="tp-adj-row"><span>${esc(tag)}<b>${esc(dm(m.amt))}</b>${m.note ? ' <small class="m">(' + esc(m.note) + ')</small>' : ''}${adjWho(m) ? ' <small class="m">· ' + esc(adjWho(m)) + '</small>' : ''}</span>${adjDelOk() ? `<button type="button" class="tp-adj-x" onclick="tpAdjDel('${m.id}')" aria-label="حذف">×</button>` : ''}</div>`;
      }).join('');
    }
    const sumCard = $('tp_sum_card');
    if (sumCard) sumCard.hidden = !tpx('sum');
    setT('tps_c', dm(c.cardsTot)); setT('tps_p', dm(c.phonesTot)); setT('tps_m', c.cashVal == null ? 'غير مسجّل' : dm(c.cashTot));
    setT('tps_tot', dm(c.grand));
    const dfEl = $('tps_diff'), alEl = $('tps_al');
    if (dfEl) {
      if (c.cap > 0) {
        dfEl.hidden = false;
        const refTxt = c.netAdj ? dm(c.expected) + ' (بعد الحركة)' : dm(c.cap);
        if (c.incomplete) { dfEl.className = 'tp-diff wn'; dfEl.textContent = 'المرجع ' + dm(c.expected) + ' · غير مكتمل'; }
        else if (c.diff === 0) { dfEl.className = 'tp-diff ok'; dfEl.textContent = 'متوازن ✓ (' + refTxt + ')'; }
        else if (c.diff < 0) { dfEl.className = 'tp-diff al'; dfEl.textContent = 'ناقص ' + dm(Math.abs(c.diff)) + ' من ' + dm(c.expected); }
        else { dfEl.className = 'tp-diff ok'; dfEl.textContent = 'زائد ' + dm(c.diff) + ' فوق ' + dm(c.expected); }
      } else {
        dfEl.hidden = !okE();
        if (okE()) { dfEl.className = 'tp-diff'; dfEl.textContent = 'تحديد رأس المال'; }
      }
    }
    if (alEl) {
      const msgs = [];
      if (c.missCards) msgs.push(arCnt(c.missCards, 'فئة غير مسجلة', 'فئتان غير مسجلتين', 'فئات غير مسجلة', 'فئة غير مسجلة'));
      if (c.missPh || c.oldPh) msgs.push('أرصدة الهواتف (' + phDone() + '/' + OPS.length + ')');
      if (c.cashMiss) msgs.push('صندوق التعبئة غير مسجّل');
      else if (c.cashOld) msgs.push('صندوق التعبئة لم يُؤكَّد اليوم');
      if (msgs.length) {
        alEl.hidden = false;
        alEl.className = 'tp-al wn';
        alEl.innerHTML = `${I('alert')} <span><b>الحساب غير مكتمل اليوم:</b> ${esc(msgs.join(' · '))}</span>`;
      } else if (c.cap > 0 && c.diff < 0) {
        alEl.hidden = false;
        alEl.className = 'tp-al al';
        alEl.innerHTML = `<div>${I('alert')} <b>ناقص ${esc(dm(Math.abs(c.diff)))} عن المرجع</b></div>`
          + `<div class="m">راجع: بطاقات أو تعبئة لم تُسجَّل، سحب للمعلم، أو تعبئة بالكريدي.</div>`
          + (nr ? `<div class="tp-note-show">${I('chat')} <b>ملاحظة اليوم:</b> ${esc(nr.val)}</div>` : '')
          + `<button type="button" class="btn s sm" onclick="tpNoteEd()">${nr ? 'تعديل ملاحظة الفرق' : '+ تدوين ملاحظة للفرق'}</button>`;
      } else if (nr) {
        alEl.hidden = false;
        alEl.className = 'tp-al';
        alEl.innerHTML = `<div class="tp-note-show">${I('chat')} <b>ملاحظة اليوم:</b> ${esc(nr.val)}</div><button type="button" class="btn s sm" onclick="tpNoteEd()">تعديل الملاحظة</button>`;
      } else {
        alEl.hidden = true;
      }
    }
  }
  function tpCommit(label, fn, alwaysUndo) {
    const prev = JSON.stringify(T());
    fn();
    paint();
    if (alwaysUndo || tpx('un')) toast(label, () => { clearTimeout(svT); svT = 0; S.tp = JSON.parse(prev); });
  }
  window.tpIn = (op, k, n, el, now) => {
    if (k == 'c') {
      const clean = dg(el.value).replace(/\D/g, '');
      if (clean !== el.value) el.value = clean;
    }
    if (tm[el.id]) { clearTimeout(tm[el.id]); delete tm[el.id]; }
    delete PEND[el.id];
    const raw = el.value.trim(), id = k == 'm' ? 'tp_cash_box' : rid(op, k, n);
    if (raw === '') {
      const goClr = () => {
        delete tm[el.id]; delete PEND[el.id];
        if (recId(id)) { putRaw(id, op, k, n, null, !!now); paint(); }
      };
      if (now) goClr();
      else { PEND[el.id] = goClr; tm[el.id] = setTimeout(goClr, 400); }
      return;
    }
    const x = num(raw, k == 'c'); if (x == null) return;
    const valSet = k == 'c' ? Math.max(0, Math.round(x)) : Math.max(0, x);
    const go1 = () => {
      delete tm[el.id]; delete PEND[el.id];
      putRaw(id, op, k, n, valSet, !!now);
      el.placeholder = '—'; paint();
    };
    if (now) go1();
    else { PEND[el.id] = go1; tm[el.id] = setTimeout(go1, 400); }
  };
  window.tpStep = (op, n, d) => {
    const inpId = 'tpi_' + op + '_c' + n;
    flushOne(inpId);
    const r = rec(op, 'c', n), cur = r && r.val != null ? Math.round(r.val) : 0;
    if (d < 0 && cur <= 0) return toast('العدد 0 بالفعل');
    const nv = Math.max(0, cur + d), el = $(inpId);
    tpCommit(`بطاقة ${op} ${n} (${d > 0 ? '+' + d : d}) ← ${nv}`, () => {
      put(op, 'c', n, nv, false);
      if (el) { el.value = String(nv); el.placeholder = '—'; }
    });
  };
  window.tpZero = (op, n) => {
    const inpId = 'tpi_' + op + '_c' + n;
    flushOne(inpId);
    const r = rec(op, 'c', n);
    if (r && r.val === 0) return toast('الفئة صفر بالفعل');
    const el = $(inpId);
    tpCommit(`تم تصفير بطاقة ${op} ${n} درهم`, () => {
      put(op, 'c', n, 0, false);
      if (el) { el.value = '0'; el.placeholder = '—'; }
    }, true);
  };
  window.tpCfm = id => {
    const r = recId(id); if (!r || r.val == null) return;
    flushOne(id == 'tp_cash_box' ? 'tpi_cash' : 'tpi_' + r.op + '_' + r.k + r.n);
    putRaw(r.id, r.op || '', r.k, r.n || 0, r.val, true);
    paint();
    toast('تم التأكيد لليوم ✓');
  };
  window.tpNoteEd = () => {
    window.tpFlush();
    const cur = (noteRec() || {}).val || '';
    ask('ملاحظة فرق حساب التعبئة لليوم', [{ k: 't', l: 'سبب النقص أو الزيادة (تُعرض في التقرير لليوم فقط)', v: cur }], 'حفظ').then(v => {
      if (!v) return;
      putRaw('tp_note', '', 'n', 0, v.t.trim(), true);
      render();
    });
  };
  /* ---------- الشاشة ---------- */
  const row1 = (op, k, n) => {
    const r = rec(op, k, n), v = val(op, k, n), id = op + '_' + k + n, ph = k == 'p';
    if (ph) return `<div class="tpr" id="tpr_${id}"><span class="dotl" id="tpd_${id}"></span><div class="tpn tp-tap" onclick="tpBuyOpen('${op}','p',${n})"><span>رصيد الهاتف</span><small class="tp-ph-tm m" id="tptm_${id}" hidden></small></div><span class="tpt" id="tpt_${id}"></span>`
      + `<button type="button" class="tp-cfm" id="tpcfm_${id}" hidden onclick="tpCfm('${rid(op, 'p', n)}')" title="تأكيد نفس الرصيد لليوم">${I('check')}</button>`
      + `<input class="tpi" id="tpi_${id}" inputmode="decimal" placeholder="—" value="${v == null ? '' : esc(v)}" oninput="tpIn('${op}','p',${n},this)" onchange="tpIn('${op}','p',${n},this,1)" onfocus="this.select()"><span class="m tpu">درهم</span></div>`;
    return `<div class="tpr c" id="tpr_${id}">`
      + `<div class="tp-left"><button type="button" class="tpd u" id="tpd_${id}" onclick="tpCardAct('${op}',${n})" title="تزويد أو تصفير">${n}<small>درهم</small></button>`
      + `<div class="tp-meta"><b class="tp-val" id="tpv_${id}"></b><span class="tp-st" id="tpst_${id}"></span></div></div>`
      + `<div class="tp-ctrl"><button type="button" class="tp-sb" onclick="tpStep('${op}',${n},-1)" aria-label="ناقص 1">−</button>`
      + `<input class="tpi" id="tpi_${id}" inputmode="numeric" pattern="[0-9]*" placeholder="—" value="${v == null ? '' : esc(v)}" oninput="tpIn('${op}','c',${n},this)" onchange="tpIn('${op}','c',${n},this,1)" onfocus="this.select()">`
      + `<button type="button" class="tp-sb" onclick="tpStep('${op}',${n},1)" aria-label="زائد 1">+</button></div></div>`;
  };
  VW.tp = () => {
    const t = tally(), l = lastLine(), cv = cashVal(), cs = cardsList();
    let h = `<div class="qbar rsum"><div class="qpill al"><div class="qn" id="tps_r">${t.r}</div><div class="ql">نافد / منخفض</div></div><div class="qpill wn"><div class="qn" id="tps_y">${t.y}</div><div class="ql">قارب النفاد</div></div><div class="qpill rp"><div class="qn" id="tps_u">${t.u}</div><div class="ql">غير مسجّل</div></div></div>`
      + `<div id="tpl" class="rsent ${l[1] ? 'w' : ''}">${esc(l[0])}</div>`;
    OPS.forEach(op => {
      const opCards = cs.filter(n => cardOn(op, n));
      h += `<div class="card tpop"><div class="tpoh"><b class="tp-op" data-op="${op}">${op}</b><span class="m" id="tpu_${op}"></span></div>`
        + `<div class="tp-subtot" id="tpoh_${op}"></div>`
        + PH.map(n => row1(op, 'p', n)).join('')
        + opCards.map(n => row1(op, 'c', n)).join('') + `</div>`;
    });
    h += `<div class="card"><div class="tp-cash-row">`
      + `<div class="tp-cash-info"><b>رصيد صندوق التعبئة</b><small class="m" id="tpu_cash"></small></div>`
      + `<div class="tp-ctrl"><button type="button" class="tp-cfm" id="tpcfm_cash" hidden onclick="tpCfm('tp_cash_box')" title="تأكيد نفس المبلغ لليوم">${I('check')}</button>`
      + `<input class="tpi tp-cash-inp" id="tpi_cash" inputmode="decimal" placeholder="0" value="${cv == null ? '' : esc(cv)}" oninput="tpIn('','m',0,this)" onchange="tpIn('','m',0,this,1)" onfocus="this.select()"><span class="m tpu">درهم</span></div>`
      + `</div><div class="tp-cash-acts"><button type="button" class="btn s sm" onclick="tpCashMove()">± حركة معلم (سحب / إضافة)</button></div><div id="tp_adj_box" class="tp-adj-box" hidden></div></div>`;
    h += `<div id="tp_sum_card" class="card tp-sum-card">`
      + `<div class="tp-sum-grid">`
      + `<div class="tp-sum-cell"><small>البطاقات</small><b id="tps_c">0 درهم</b></div>`
      + `<div class="tp-sum-cell"><small>الهواتف</small><b id="tps_p">0 درهم</b></div>`
      + `<div class="tp-sum-cell"><small>صندوق التعبئة</small><b id="tps_m">0 درهم</b></div>`
      + `</div>`
      + `<div class="tp-grand-bar"><div><small>المجموع الكامل</small><b id="tps_tot">0 درهم</b></div>`
      + `<button type="button" id="tps_diff" class="tp-diff" onclick="tpDiffAct()"></button></div>`
      + `<div id="tps_al" class="tp-al" hidden></div>`
      + `</div>`;
    h += `<div class="pair-grid"><button class="btn" onclick="tpBuyMenu()">${I('plus')} تزويد رصيد/بطاقات</button><button class="btn s" onclick="tpFlush();go('rep',{rf:'topup'})">عرض في التقرير</button></div>`;
    return { t: 'التعبئة', h, a: paint };
  };
  /* ---------- إعدادات المدير الكاملة لقسم التعبئة ---------- */
  const LB = { bo: 'رصيد الهاتف: «قارب» عند ≤ (درهم)', br: 'رصيد الهاتف: «منخفض» عند ≤ (درهم)', cap: 'رأس مال التعبئة المرجعي (درهم — 0 لإخفاء المقارنة)', rh: 'ساعة بدء تذكير الصباح (0 إلى 23)' };
  window.tpLim = k => {
    if (!okE()) return toast('للمدير فقط');
    const c = cf(), isC = k.startsWith('cl'), cur = isC ? cardLim(+k.slice(2)) : (c[k] ?? 0);
    ask('إعدادات التعبئة', [{ k: 'v', l: isC ? 'بطاقة ' + k.slice(2) + ' درهم: «قارب» عند عدد ≤' : LB[k], t: 'tel', v: String(cur) }]).then(v => {
      if (!v) return;
      const raw = v.v.trim();
      const x = raw === '' ? (k == 'cap' ? 0 : null) : num(raw, isC || k == 'rh');
      if (x == null) return toast('اكتب رقماً صحيحاً');
      if (k == 'rh' && (x < 0 || x > 23)) return toast('الساعة يجب أن تكون بين 0 و 23');
      if (k == 'br' && x >= c.bo) return toast('حد «منخفض» يجب أن يكون أصغر من حد «قارب» (' + c.bo + ')');
      if (k == 'bo' && x <= c.br) return toast('حد «قارب» يجب أن يكون أكبر من حد «منخفض» (' + c.br + ')');
      upd(() => {
        const o = { ...(S.cfg.tp || {}) };
        if (isC) o.cl = { ...(o.cl || {}), [k.slice(2)]: Math.max(0, Math.round(x)) };
        else o[k] = Math.max(0, x);
        S.cfg.tp = o;
      });
    });
  };
  window.tpCardTog = (op, n) => {
    if (!okE()) return toast('للمدير فقط');
    upd(() => {
      const o = { ...(S.cfg.tp || {}) }, off = { ...(o.off || {}) }, key = op + '_' + n;
      if (off[key]) delete off[key]; else off[key] = 1;
      o.off = off; S.cfg.tp = o;
    });
  };
  window.tpCardAdd = () => {
    if (!okE()) return toast('للمدير فقط');
    ask('إضافة فئة بطاقة تعبئة', [{ k: 'n', l: 'قيمة البطاقة بالدرهم (مثال: 100)', t: 'tel', v: '' }]).then(v => {
      if (!v) return;
      const n = num(v.n, true);
      if (!(n > 0)) return toast('اكتب رقماً صحيحاً أكبر من صفر');
      const L = cardsList();
      if (L.includes(n)) return toast('هذه الفئة موجودة بالفعل');
      upd(() => {
        const o = { ...(S.cfg.tp || {}) };
        o.cards = [...L, n].sort((a, b) => a - b);
        o.cl = { ...(o.cl || {}), [n]: o.cl && o.cl[n] != null ? o.cl[n] : 3 };
        S.cfg.tp = o;
      });
    });
  };
  window.tpCardDel = n => {
    if (!okE()) return toast('للمدير فقط');
    const L = cardsList();
    if (L.length <= 1) return toast('يجب بقاء فئة واحدة على الأقل');
    sure('إزالة فئة ' + n + ' درهم من البطاقات؟', 'إزالة').then(y => {
      if (!y) return;
      upd(() => {
        const o = { ...(S.cfg.tp || {}) };
        o.cards = L.filter(x => x != n);
        S.cfg.tp = o;
      });
    });
  };
  window.tpRmTog = () => {
    if (!okE()) return toast('للمدير فقط');
    const c = cf();
    upd(() => { S.cfg.tp = { ...(S.cfg.tp || {}), rm: c.rm ? 0 : 1 }; });
  };
  window.tpxTog = k => {
    if (!okE()) return toast('للمدير فقط');
    upd(() => {
      const o = { ...(S.cfg.tp || {}) }, x = { ...(o.x || {}) };
      x[k] = tpx(k) ? 0 : 1;
      o.x = x; S.cfg.tp = o;
    });
  };
  window.tpResetCfg = () => {
    if (!okE()) return toast('للمدير فقط');
    sure('إرجاع إعدادات وحدود التعبئة للوضع الافتراضي؟', 'إرجاع').then(y => {
      if (y) upd(() => { delete S.cfg.tp; });
    });
  };
  VW.st_tpx = () => ({
    t: 'خيارات التعبئة',
    h: '<p class="m">اضغط على الخيار لتشغيله أو إيقافه (ينطبق على كل الأجهزة).</p>'
      + TPXL.map(([k, l]) => swRow(l, `tpxTog('${k}')`, !!tpx(k))).join('')
  });
  VW.st_tp = () => {
    const c = cf(), od = offDays(), cs = cardsList(), xOn = TPXL.filter(([k]) => tpx(k)).length;
    return {
      t: 'حدود وإعدادات التعبئة',
      h: '<p class="m">يتحكم المدير هنا برأس المال المرجعي، والفئات المتوفرة للبيع، والحدود والتذكيرات دون الحاجة لتعديل الكود.</p>'
        + '<h3>حساب الصندوق ورأس المال</h3>'
        + row('رأس مال التعبئة المرجعي', "tpLim('cap')", c.cap > 0 ? dm(c.cap) : 'غير محدد')
        + '<h3>رصيد هاتف التعبئة (موحد للشركات)</h3>'
        + row(LB.bo, "tpLim('bo')", dm(c.bo)) + row(LB.br, "tpLim('br')", dm(c.br))
        + '<h3>الفئات المتوفرة للبيع</h3>'
        + '<p class="m">الأزرق = يبيعها المحل. عطّل أي فئة لا تبيعونها لشركة معينة حتى لا توقف شارة التوازن.</p>'
        + `<div class="card"><div>${cs.map(n => `<span class="tag on">${n} درهم${cs.length > 1 ? `<b onclick="tpCardDel(${n})">×</b>` : ''}</span>`).join('')}<button type="button" class="tag" onclick="tpCardAdd()">+ فئة جديدة</button></div>`
        + `<div class="tp-op-grid">${OPS.map(op => `<div class="tp-op-row"><b class="tp-op" data-op="${op}">${op}</b><div class="tp-op-chips">${cs.map(n => `<button type="button" class="tag ${cardOn(op, n) ? 'on' : ''}" onclick="tpCardTog('${op}',${n})">${n}</button>`).join('')}</div></div>`).join('')}</div></div>`
        + '<h3>حدود البطاقات (الأحمر عند 0 دائماً)</h3>'
        + cs.map(n => row('بطاقة ' + n + ' درهم — «قارب» عند ≤', "tpLim('cl" + n + "')", cardLim(n))).join('')
        + '<h3>التذكير وخيارات القسم</h3>'
        + swRow('تذكير أرصدة التعبئة الصباحي في الرئيسية', 'tpRmTog()', !!c.rm)
        + row(LB.rh, "tpLim('rh')", c.rh + ':00')
        + row('أيام عطلة المحل (بلا تذكير)', "go('st_shop')", od.length ? arCnt(od.length, 'يوم', 'يومان', 'أيام') : 'لا عطلة')
        + row('خيارات التعبئة (تشغيل وإيقاف)', "go('st_tpx')", xOn + ' / ' + TPXL.length)
        + '<div style="margin-top:14px"><button class="btn s" onclick="tpResetCfg()">إرجاع إعدادات التعبئة الافتراضية</button></div>'
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
    const d = new Date(), c = cf();
    if (!c.rm || (typeof noRem == 'function' && noRem()) || isOffDay(d) || d.getHours() < c.rh || phDone() >= OPS.length * PH.length || S.cfg.tx == d.toDateString()) return '';
    return `<div class="card row2">${I('alert')}<span style="flex:1">لم تُسجَّل أرصدة التعبئة اليوم</span><button class="btn sm" onclick="go('tp')">سجّل الآن</button><button class="btn s sm" aria-label="لا تسجيل اليوم" onclick="tpSkip()">✕</button></div>`;
  });
  MORE.push({ g: 'sec', o: 55, l: 'التعبئة', d: 'رأس مال التعبئة، الفئات المفعّلة، الحدود، التذكير وخيارات القسم', fn: "go('st_tp')" });
})();