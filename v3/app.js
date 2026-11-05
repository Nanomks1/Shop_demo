/* ============================================================
   app.js — الهيكل: الرئيسية، البحث وكاشف الأثمنة، المزيد، المستخدمون،
   القفل، النسخ الاحتياطي، الإعدادات العامة، الأيقونة العائمة، والإقلاع.
   يُحمَّل آخر ملف (بعد ملفات الأقسام).
   ============================================================ */

/* ---------- الأقسام (مع إجمالي القطع الفعلية للجرد بالعين) ---------- */
const SECS = [['phones', 'الهواتف', 'cphone'], ['glass', 'الأنتي كاس', 'cglass'], ['case', 'البوشيط', 'ccase'], ['acc', 'الإكسسوارات', 'cacc']];
function secSub(k) {
  if (k == 'glass') return S.gg.length + ' مجموعة';
  const L = S.items.filter(i => i.sec == k);
  if (k == 'phones') { const pcs = L.reduce((a, i) => a + (+i.cnt || 0), 0); return L.length + ' صنف · ' + pcs + ' قطعة'; }
  if (k == 'case') { const pcs = L.reduce((a, i) => a + (typeof csTot == 'function' ? csTot(i) : 0), 0); return L.length + ' موديل · ' + pcs + ' قطعة'; }
  return L.length + ' صنف';
}

/* ---------- البحث الموحّد + بطاقة كاشف الأثمنة الفوري (بدون تكرار) ---------- */
let SC = '';   // نطاق البحث الحالي
const scopeChips = () => [['', 'الكل'], ...SRCH.map(p => [p.k, p.l])].map(([k, l]) => `<button class="tag ${SC == k ? 'on' : ''}" onclick="scSet('${k}')">${l}</button>`).join('');
/* مصادر بحث إضافية: الصيانة، طلبات الزبائن، دليل أسعار الإصلاح */
SRCH.push(
  { k: 'rp', l: 'صيانة', run: n => S.rp.filter(r => nzOf(r, rpText).includes(n)).sort((x, y) => (y.t0 || 0) - (x.t0 || 0)).slice(0, 20).map(rc) },
  { k: 'req', l: 'طلبات الزبائن', run: n => S.req.filter(q => nz(q.t).includes(n)).slice(0, 20).map(q => `<div class="card"><div class="m">${fd(q.at)} · ${esc(q.by || '')}</div><div>${esc(q.t)}</div><div class="sub">${rqTel(q.t) ? `<button class="btn s sm" onclick="rqWA('${q.id}')">واتساب</button>` : ''}<button class="btn s sm" onclick="rqD('${q.id}')">مسح</button></div></div>`) },
  { k: 'gd', l: 'أسعار الإصلاح', run: n => S.guide.filter(g => nz(g.m + ' ' + g.f + ' ' + (g.n || '')).includes(n)).slice(0, 20).map(gdCard) }
);
function scSet(k) { SC = k; const b = $('sc'); if (b) b.innerHTML = scopeChips(); sq(Q); }

function srch(q) {
  const n = nz(q); if (!n) return '';
  const o = [];
  if (!SC && n.length >= 2 && typeof window.priceLookupHtml == 'function') {
    const topCard = window.priceLookupHtml(n);
    if (topCard) o.push(topCard);
  }
  SRCH.forEach(p => {
    if (SC ? SC != p.k : p.k == 'prc') return;
    const r = p.run(n);
    if (r.length) o.push((SC ? '' : `<h3>${p.l} <span class="m">(${r.length})</span></h3>`) + r.join(''));
  });
  return o.join('') || emptyBox('لا توجد نتائج مطابقة لبحثك');
}
function sq(q) {
  if (q && !QP) { QP = 1; history.pushState({ V, q: 1 }, ''); }
  Q = q;
  const hasQ = !!(q && String(q).trim());
  const cBtn = $('q_clr'); if (cBtn) cBtn.hidden = !hasQ;
  const r = $('res'); if (r) r.innerHTML = hasQ ? srch(q) : '';
  const hm = $('hm'); if (hm) hm.hidden = hasQ;
}
function qClear() {
  const i = $('q_inp'); if (i) { i.value = ''; i.focus(); }
  sq('');
}
function goSearch() { go('home'); setTimeout(() => { const i = $('q_inp') || document.querySelector('main input'); if (i) i.focus(); }, 60); }

/* ---------- شريط النظرة السريعة في الرئيسية ---------- */
function homeQuickBar() {
  const rpIn = S.rp.filter(r => r.st == 'in').length;
  const rpRd = S.rp.filter(r => r.st == 'rd').length, rpOk = S.rp.filter(r => r.st == 'rd' && r.res != 'fail' && r.res != 'ref').length;
  const need = typeof invLines == 'function' ? invLines(false).length : 0;
  const rq = (S.req || []).length;
  const P = (cls, on, icn, n, l, sub) => `<button class="qpill ${cls}" onclick="${on}"><div class="qic">${ic(icn)}</div><div class="qn">${n}</div><div class="ql">${l}</div>${sub ? `<div class="qs">${sub}</div>` : ''}</button>`;
  return `<div class="qbar cmp">`
    + P('rp', `go('rp',{tab:'${rpOk ? 'rd' : rpRd ? 'nf' : 'in'}'})`, 'tool', rpIn + rpRd, 'في الصيانة', rpRd ? rpRd + ' جاهز للتسليم' : '')
    + P(need ? 'al' : 'ok', "go('rep')", need ? 'alert' : 'check', need, 'نواقص المخزون', need ? '' : 'مكتمل')
    + P(rq ? 'rp' : 'ok', "go('rep')", 'chat', rq, 'طلبات الزبائن', '')
    + `</div>`
    + todayLine();
}
function todayLine() {
  if (!S.rp.length) return '';
  const day = new Date(); day.setHours(0, 0, 0, 0); const t = day.getTime();
  const a = S.rp.filter(r => r.t0 >= t).length, b = S.rp.filter(r => r.st == 'dn' && r.t2 >= t).length;
  return `<div class="m" style="text-align:center;margin:-2px 0 8px">اليوم: استلمنا <b>${a}</b> · سلّمنا <b>${b}</b></div>`;
}
(() => {
  const s = document.createElement('style');
  s.textContent = `.qbar.cmp{gap:6px;margin:8px 0}.qbar.cmp .qic{display:none}.qbar.cmp .qpill{padding:7px 4px;gap:1px}.qbar.cmp .qn{font-size:1.4rem}
.grid .card.cs2{flex-direction:row;align-items:center;gap:10px;padding:10px 12px}.cs2 .ic{width:2.3rem;height:2.3rem;padding:.5rem;margin:0;flex:none}.cs2 .ct{display:flex;flex-direction:column;min-width:0}.cs2 .ct b{font-size:.95rem}
.q-wrap{position:relative}.q-wrap input{padding-inline-end:40px;margin:0}.q-clr{position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:var(--bg);color:var(--m);font:inherit;font-size:.95rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
#sc.sec-tags{border-bottom:0;padding:8px 0 0}`;
  document.head.appendChild(s);
})();

/* ---------- الرئيسية ---------- */
const bkHide = () => { try { localStorage.setItem('bkHide', Date.now()); } catch (e) { } render(); };
VW.home = () => {
  const old = isAdmin() && (S.items.length || S.rp.length) && Date.now() - (S.cfg.lb || 0) > 7 * 864e5;
  let hid = 0; try { hid = Date.now() - (+localStorage.getItem('bkHide') || 0) < 864e5; } catch (e) { }
  const bk = old && !hid ? `<div class="bkb">${I('alert')}<span>لم تُحفظ نسخة خارجية منذ أسبوع</span><button class="btn sm" onclick="BKP()">حفظ</button><button class="bkx" onclick="bkHide()" aria-label="إغلاق">✕</button></div>` : '';
  const call = L => L.map(f => f()).join('');
  const T = HOME.tools.map(f => f()), A = HOME.after.map(f => f());
  const scan = T.filter(h => h.includes('bcHome()')).join('').replace('بيع سريع −1', 'بيع سريع (خصم 1)');
  const topup = A.filter(h => h.includes('tph')).join('');
  const more = T.filter(h => !h.includes('bcHome()')).join('') + A.filter(h => !h.includes('tph')).join('');
  return {
    t: 'محل عزيز',
    h: bk + call(HOME.top)
      + `<div class="sec-panel" style="margin-top:4px"><div class="q-wrap"><input id="q_inp" placeholder="ابحث عن ثمن أو سلعة: هاتف، زجاج، تذكرة، زبون…" value="${esc(Q)}" oninput="sq(this.value)"><button id="q_clr" type="button" class="q-clr" ${Q ? '' : 'hidden'} onclick="qClear()" aria-label="مسح البحث">✕</button></div>`
      + `<div id="sc" class="sec-tags">${scopeChips()}</div></div><div id="res"></div>`
      + '<div id="hm">' + homeQuickBar() + scan + topup
      + '<h3>الأقسام</h3>'
      + `<div class="grid">${SECS.map(([k, n, i]) => `<button class="card sc cs2" onclick="go('sec',{k:'${k}'})">${ic(i)}<span class="ct"><b>${n}</b><span class="m">${secSub(k)}</span></span></button>`).join('')}</div>`
      + more + '</div>',
    a: () => sq(Q)
  };
};

/* ---------- المزيد (منظم بأقسام مستقلة وبطاقات مدمجة الوصف) ---------- */
const MG = [
  ['shop', 'المحل', 'كل ما يخص الأقسام: الهواتف والأنتي كاس والبوشيط والإكسسوارات والصيانة والتعبئة والتقرير. لكل قسم صفحة واحدة تجمع وسومه وحدوده.', 'grid'],
  ['dev', 'المظهر والقفل', 'الثيم وحجم الخط والزر العائم، ورمز القفل السريع والقفل التلقائي.', 'palette'],
  ['adm', 'الإدارة والبيانات', 'المستخدمون والصلاحيات، المزامنة بين الأجهزة، النسخ الاحتياطي، وسلة المحذوفات.', 'users']
];
const STX = [
  ['الشراء السريع بضغطة واحدة في التقرير (✓)', "go('st_rep')", 'التقرير اليومي', 'تأشير صح كمية افتراضية'],
  ['ساعة تذكير التقرير', "go('st_rep')", 'التقرير اليومي', 'موعد تنبيه إرسال'],
  ['أيام بلا تذكير', "go('st_rep')", 'التقرير اليومي', 'عطلة'],
  ['عنوان التقرير وعبارة الختام', "go('st_rep')", 'التقرير اليومي', 'توقيع'],
  ['ما يظهر في التقرير', "go('st_rep')", 'التقرير اليومي', 'أسعار طلبات ديون'],
  ['الثيم (فاتح / ليلي)', "go('st_look')", 'المظهر والقفل', 'لون داكن ليل'],
  ['حجم الخط', "go('st_look')", 'المظهر والقفل', 'كبير صغير'],
  ['الزر العائم (+)', "go('st_look')", 'المظهر والقفل', 'أيقونة إضافة'],
  ['حد «متوفر» و«قارب» لبطاقات التعبئة', "go('st_tp')", 'التعبئة', '5 10 20 50 درهم'],
  ['حدود رصيد هاتف التعبئة', "go('st_tp')", 'التعبئة', 'منخفض نافد'],
  ['ساعة تذكير التعبئة', "go('st_tp')", 'التعبئة', 'صباح'],
  ['الجولة: يُعتبر الصنف غير مؤكد بعد (أيام)', "go('st_rep')", 'التقرير اليومي', 'جولة تأكيد مخزون']
];
const stItems = () => {
  const o = [];
  MG.forEach(([k, t]) => MORE.filter(x => x.g == k).forEach(x => o.push({ l: x.l, fn: x.fn, p: t, kw: x.d || '' })));
  Object.values(CATS).forEach(c => c[1].forEach(([l, fn]) => o.push({ l, fn, p: c[0], kw: '' })));
  STX.forEach(([l, fn, p, kw]) => o.push({ l, fn, p, kw }));
  return o;
};
function stQ(q) {
  const n = nz(q), g = $('stg'), r = $('str'); if (!g || !r) return;
  g.style.display = n ? 'none' : '';
  if (!n) { r.innerHTML = ''; return; }
  const seen = {}, L = stItems().filter(x => { const k = x.l + x.fn; if (seen[k]) return false; seen[k] = 1; return nz(x.l + ' ' + x.kw + ' ' + x.p).includes(n); });
  r.innerHTML = L.map(x => `<button class="card row2" onclick="${x.fn}"><b>${esc(x.l)}</b><span class="m">${esc(x.p)}</span></button>`).join('') || '<p class="m">لا نتائج</p>';
}
VW.st = () => ({
  t: 'المزيد',
  h: `<input placeholder="ابحث في الإعدادات: حد، لون، قفل، تقرير..." oninput="stQ(this.value)"><div id="str"></div><div id="stg">`
    + MG.map(([k, t, d, icon]) => `<button class="card st-card" onclick="go('st_grp',{g:'${k}'})"><div class="st-ic">${ic(icon)}</div><div class="st-txt"><b>${t}</b><div class="m">${d}</div></div><span class="st-arr">${ic('back')}</span></button>`).join('')
    + '</div>'
});
VW.st_grp = () => {
  const g = V.g || 'shop', info = MG.find(x => x[0] == g) || MG[0];
  const L = MORE.filter(x => x.g == g).sort((a, b) => (a.o || 50) - (b.o || 50));
  const R = x => {
    const sub = x.n ? x.n() : '';
    return `<button class="card st-card" onclick="${x.fn}"><div class="st-txt"><b>${esc(x.l)}</b>${x.d ? `<div class="m">${esc(x.d)}</div>` : ''}</div>${sub ? `<span class="m" style="white-space:nowrap">${esc(sub)}</span>` : ''}<span class="st-arr">${ic('back')}</span></button>`;
  };
  const A = L.filter(x => x.adv), B = L.filter(x => !x.adv);
  return {
    t: info[1],
    h: `<p class="m">${info[2]}</p>` + B.map(R).join('')
      + (A.length ? `<details class="card" style="margin-top:12px"><summary><b>خيارات متقدمة</b> <span class="m">(${A.length}) — نادراً ما تحتاجها</span></summary><div style="margin-top:8px">${A.map(R).join('')}</div></details>` : '')
  };
};
MORE.push(
  { g: 'look', o: 10, l: 'الثيم وحجم الخط والأيقونة العائمة', d: 'ألوان التطبيق وحجم الخط والزر العائم (لهذا الجهاز)', fn: "go('st_look')" },
  { g: 'usr', o: 10, l: 'المستخدمون والصلاحيات', d: 'إضافة موظفين وتحديد ما يستطيعون فعله', fn: "go('st_users')" },
  { g: 'usr', o: 20, l: 'رمز القفل السريع', d: 'رمز قصير لفتح التطبيق بسرعة', fn: 'lkSet()', n: () => S.cfg.lk ? 'مُعيَّن' : 'غير مُعيَّن' },
  { g: 'usr', o: 30, l: 'القفل التلقائي', d: 'يقفل التطبيق والمدير بعد مدة بلا استعمال', fn: "limEd('alk')", n: () => (S.cfg.alk ?? DL0.alk) + ' دقيقة' },
  { g: 'data', o: 20, l: 'النسخ الاحتياطي والاستعادة', d: 'حفظ نسخة من البيانات أو استعادتها', fn: "go('st_bk')" },
  { g: 'sec', o: 60, l: 'كل الوسوم (قائمة كاملة)', d: 'كل القوائم (ماركات، ألوان، سعات...) في مكان واحد', fn: "go('st_tags')" }
);

(() => {
  MORE.push({ g: 'adm', o: 40, l: 'سلة المحذوفات', d: 'استرجاع ما حُذف خلال آخر 30 يوماً', fn: "go('st_trash')", n: () => S.trash.length || '' });
  const P = {
    'الهواتف': ['shop', 10], 'الأنتي كاس': ['shop', 20], 'البوشيط': ['shop', 30], 'الإكسسوارات': ['shop', 40], 'الصيانة': ['shop', 50],
    'حدود التعبئة': ['shop', 60, 0, 'التعبئة'], 'إعدادات التقرير': ['shop', 70, 0, 'التقرير اليومي'],
    'إحصائيات: الأعطال وطلبات الزبائن': ['shop', 80],
    'كل الوسوم (قائمة كاملة)': ['shop', 90, 1], 'الحقول في النماذج': ['shop', 91, 1], 'الخانات المخصصة': ['shop', 92, 1], 'تلوين البطاقات': ['shop', 93, 1], 'حدود النفاد': ['shop', 94, 1, 'حدود النفاد العامة'],
    'الثيم وحجم الخط والأيقونة العائمة': ['dev', 10], 'رمز القفل السريع': ['dev', 20], 'القفل التلقائي': ['dev', 30],
    'المستخدمون والصلاحيات': ['adm', 10], 'المزامنة بين الأجهزة': ['adm', 20], 'النسخ الاحتياطي والاستعادة': ['adm', 30]
  };
  const D = {
    'الهواتف': 'الماركات والألوان والسعات وألوان الماركات وحدود النفاد', 'الأنتي كاس': 'أنواع الزجاج والمستويات والحدود',
    'البوشيط': 'الجنس والألوان وحدود النفاد (رجالي ونسائي)', 'الإكسسوارات': 'الأنواع والموصلات والفئات وحدود كل نوع',
    'الصيانة': 'أعطال الصيانة، دليل الأسعار، مدة حفظ الصور، والأرشفة', 'تلوين البطاقات': 'ألوان خفيفة للتمييز بين الماركات والأقسام',
    'الحقول في النماذج': 'اختر الحقول التي تظهر عند إضافة هاتف أو غيره', 'الخانات المخصصة': 'أضف خانة خاصة بك (مثل: الضمان) لأي قسم',
    'المزامنة بين الأجهزة': 'ربط هاتفين أو أكثر ليتطابقوا في البيانات',
    'إحصائيات: الأعطال وطلبات الزبائن': 'أكثر الأعطال تكراراً وما يطلبه الزبائن ولا نملكه'
  };
  MORE.forEach(x => {
    const p = P[x.l];
    if (D[x.l] && !x.d) x.d = D[x.l];
    if (p) { x.g = p[0]; x.o = p[1]; x.adv = p[2] || 0; if (p[3]) x.l = p[3]; }
    else if (!MG.some(m => m[0] == x.g)) { x.g = 'shop'; x.o = 99; x.adv = 1; }
  });
})();

/* ---------- المظهر والأيقونة العائمة ---------- */
const THA = [['b', 'أزرق', '#2563eb'], ['g', 'أخضر', '#059669'], ['v', 'بنفسجي', '#7c3aed'], ['o', 'برتقالي', '#ea580c']], THMD = [['a', 'تلقائي'], ['l', 'نهاري'], ['d', 'ليلي']];
VW.st_look = () => {
  const fabOn = S.cfg.fab !== 0, [ac, md] = thGet(), fs = FS_OLD[S.cfg.fs] || S.cfg.fs || 18;
  return {
    t: 'المظهر والعرض',
    h: '<h3>الأيقونة العائمة السريعة (لهذا الجهاز)</h3>'
      + `<button class="card row2" onclick="fabReset();upd(()=>S.cfg.fab=${fabOn ? 0 : 1})"><b>زر عائم للإضافة السريعة في الرئيسية</b><span class="m">${fabOn ? 'مُفعَّل' : 'مُعطَّل'}</span></button>`
      + (fabOn ? `<button class="card row2" onclick="fabLockToggle()"><b>تثبيت الزر العائم في مكانه (منع السحب)</b><span class="m">${fabLocked() ? 'مُثبَّت' : 'قابل للسحب'}</span></button>` : '')
      + '<h3>الوضع (لهذا الجهاز فقط)</h3>' + THMD.map(([k, n]) => `<button class="tag ${md == k ? 'on' : ''}" onclick="upd(()=>S.cfg.th='${ac}-${k}')">${n}</button>`).join('')
      + '<p class="m">«تلقائي» يتبع وضع الهاتف: نهاري في النهار وليلي في الليل.</p>'
      + '<h3>اللون</h3>' + THA.map(([k, n, c]) => `<button class="tag ${ac == k ? 'on' : ''}" onclick="upd(()=>S.cfg.th='${k}-${md}')"><i style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};border:2px solid #fff"></i>${n}</button>`).join('')
      + '<h3>حجم الخط</h3>' + [[16, 'صغير'], [18, 'عادي'], [20, 'كبير'], [22, 'أكبر']].map(([v, l]) => `<button class="tag ${fs == v ? 'on' : ''}" onclick="upd(()=>S.cfg.fs=${v})">${l}</button>`).join('')
  };
};

/* ---------- الأيقونة العائمة الذكية (FAB — في الرئيسية فقط) ---------- */
function fabAct() {
  $('sh').innerHTML = `<div class="bar"></div><h3>إجراء سريع</h3>`
    + `<button class="btn" onclick="finish(1)">${I('mobile')} + إضافة هاتف</button>`
    + `<button class="btn s" onclick="finish(2)">${I('tool')} + استلام صيانة</button>`
    + `<button class="btn s" onclick="finish(3)">${I('scan')} مسح باركود أو IMEI</button>`
    + `<button class="btn s" onclick="finish(4)">${I('chat')} تسجيل طلب زبون</button>`
    + `<button class="btn s" onclick="finish(5)">${I('check')} الجرد والجولة اليومية</button>`
    + `<button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(w => {
    if (w == 1) phAdd();
    else if (w == 2) rEd(null);
    else if (w == 3) bcHome();
    else if (w == 4) rq();
    else if (w == 5) go('jl');
  });
}
const FABK = 'fabPos', FABL = 'fabLk'; let FABM = 0;
const fabLocked = () => { try { return localStorage.getItem(FABL) == '1'; } catch (e) { return false; } };
function fabLockToggle() { try { fabLocked() ? localStorage.removeItem(FABL) : localStorage.setItem(FABL, '1'); } catch (e) { } render(); }
function fabPlace() {
  const el = $('fab'); if (!el) return;
  let p = null; try { p = JSON.parse(localStorage.getItem(FABK) || 'null'); } catch (e) { }
  if (!p || (p.s != 'l' && p.s != 'r')) { el.style.left = el.style.top = el.style.bottom = el.style.right = ''; return; }
  const w = el.offsetWidth || 50, h = el.offsetHeight || 50;
  const x = p.s == 'l' ? 14 : innerWidth - w - 14, y = Math.min(Math.max(70, (+p.y || 0) * innerHeight), innerHeight - h - 4);
  Object.assign(el.style, { left: x + 'px', top: y + 'px', bottom: 'auto', right: 'auto' });
}
function fabReset() { try { localStorage.removeItem(FABK); } catch (e) { } fabPlace(); }
function fabBind(el) {
  let st = null;
  const mv = e => {
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.m && Math.hypot(dx, dy) < 8) return;
    st.m = true;
    const w = el.offsetWidth || 50, h = el.offsetHeight || 50;
    Object.assign(el.style, { left: Math.min(Math.max(4, st.l + dx), innerWidth - w - 4) + 'px', top: Math.min(Math.max(70, st.t + dy), innerHeight - h - 4) + 'px', bottom: 'auto', right: 'auto' });
  };
  const up = () => {
    removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
    if (st && st.m) {
      const r = el.getBoundingClientRect();
      try { localStorage.setItem(FABK, JSON.stringify({ s: r.left + r.width / 2 < innerWidth / 2 ? 'l' : 'r', y: +(r.top / innerHeight).toFixed(4) })); } catch (e) { }
      FABM = Date.now(); fabPlace();
    }
    st = null;
  };
  el.addEventListener('pointerdown', e => {
    if (fabLocked()) return;
    const r = el.getBoundingClientRect();
    st = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, m: false };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  el.addEventListener('click', e => { if (Date.now() - FABM < 400) { e.stopPropagation(); e.preventDefault(); } }, true);
}
function fabUpd() {
  let el = $('fab');
  if (!el) {
    document.body.insertAdjacentHTML('beforeend', '<div id="fab" hidden></div>');
    el = $('fab'); fabBind(el);
  }
  const show = S.cfg.fab !== 0 && V.v == 'home';
  el.hidden = !show;
  if (!show) return;
  el.innerHTML = `<button class="fab-b" onclick="fabAct()" aria-label="إضافة">${ic('plus')}</button>`;
  fabPlace();
}
addEventListener('resize', fabPlace);
HK.render.push(fabUpd);

HK.render.push(() => {
  document.querySelectorAll('.rtabs, #sc').forEach(c => {
    const t = c.querySelector('.tag.on'); if (!t || c.scrollWidth <= c.clientWidth + 2) return;
    const x = c.getBoundingClientRect(), y = t.getBoundingClientRect();
    c.scrollBy({ left: (y.left + y.width / 2) - (x.left + x.width / 2), top: 0 });
  });
});

/* ---------- الحدود ---------- */
VW.st_lim = () => VW.st();
const LMIN1 = ['alk', 'stale'];
const limShow = k => k == 'gmin' ? lim(k) - 1 : lim(k);
function limEd(k) {
  if (!isAdmin()) return toast('للمدير فقط');
  const L = (LM.find(x => x[0] == k) || [])[1] || 'تعديل القيمة';
  ask(L, [{ k: 'v', l: 'القيمة', t: 'tel', v: limShow(k) }]).then(v => {
    if (!v || v.v.trim() === '') return;
    const n = parseInt(dg(v.v), 10);
    if (isNaN(n) || n < (LMIN1.includes(k) ? 1 : 0)) return toast('اكتب رقماً صحيحاً');
    upd(() => S.cfg[k] = k == 'gmin' ? n + 1 : n);
  });
}

/* ---------- الوسوم ---------- */
VW.st_tags = () => ({ t: 'الوسوم', h: Object.keys(TG).map(g => row(TG[g], `go('st_tg',{g:'${g}'})`, S.tags[g].length)).join('') });
function tgAdd(g) {
  if (!can('tags')) return toast('للمدير فقط');
  ask('وسم جديد: ' + TG[g], [{ k: 't', l: 'الاسم' }]).then(v => {
    const t = v && v.t.trim();
    if (t && !S.tags[g].includes(t)) upd(() => { S.tags[g].push(t); if (g == 'brand' && typeof autoBc == 'function') autoBc(t); });
  });
}

/* ---------- المحذوفات ---------- */
VW.st_trash = () => ({
  t: 'المحذوفات (30 يوماً)',
  h: S.trash.map(t => `<div class="card row2"><div style="flex:1"><b>${esc(t.label)}</b><div class="m"><bdi>${fd(t.t)}</bdi></div></div><button class="btn s sm" onclick="restore('${t.id}')">استرجاع</button></div>`).join('') || emptyBox('سلة المحذوفات فارغة')
});

/* ---------- المستخدمون والصلاحيات ---------- */
VW.st_users = () => {
  const a = isAdmin();
  return {
    t: 'المستخدمون',
    h: S.users.map((u, i) => `<div class="card row2"><b>${esc(u.name)}</b><span class="m">${u.admin ? 'مدير' : 'موظف' + (u.pin ? '' : ' · بلا رمز')}${u.nr ? ' · بلا تنبيهات' : ''}</span>${a ? `<button class="btn s sm" onclick="uEd(${i})">تعديل</button>` : ''}</div>`).join('')
      + (a ? '<button class="btn" onclick="uAdd()">+ مستخدم</button><button class="btn s" onclick="pinCh()">تغيير رمز المدير</button><h3>الصلاحيات</h3>'
        + Object.keys(PL).map(k => `<div class="card row2"><b>${PL[k]}</b><button class="btn s sm" onclick="pTog('${k}')">${S.perm[k] == 'a' ? 'المدير فقط' : 'الجميع'}</button></div>`).join('')
        : '<p class="m">التعديل للمدير فقط.</p>')
  };
};
const adm = () => S.users.filter(u => u.admin).length;
const noRem = () => !!(S.users.find(u => u.name == S.me) || {}).nr;
const uAdd = needAdm(function () {
  ask('مستخدم جديد', [{ k: 'n', l: 'الاسم' }, { k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: 'موظف' }, { k: 'p', l: 'رمز الموظف بالأرقام (إجباري للموظف، 4 على الأقل)', t: 'password' }]).then(v => {
    if (!v || !v.n.trim()) return;
    const isA = v.r == 'مدير';
    if (!isA && !(v.p && v.p.length >= 4)) return toast('رمز الموظف إجباري (4 أرقام على الأقل)');
    upd(() => { const u = { name: v.n.trim(), admin: isA }; if (!isA) u.pin = hs(v.p); S.users.push(u); });
  });
});
const uEd = needAdm(function (i) {
  const u = S.users[i];
  const F = [{ k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: u.admin ? 'مدير' : 'موظف' }, { k: 'p', l: 'رمز جديد للموظف (فارغ = بلا تغيير)' + (u.pin ? ' — له رمز حالياً' : ''), t: 'password' }];
  F.push({ k: 'n', l: 'التنبيهات اليومية في الرئيسية (التقرير والتعبئة)', t: 'sel', o: ['تظهر', 'مخفية'], v: u.nr ? 'مخفية' : 'تظهر' });
  F.push({ k: 'x', l: 'حذف المستخدم؟', t: 'sel', o: ['لا', 'نعم'], v: 'لا' });
  ask(u.name, F).then(v => {
    if (!v) return;
    if ((v.x == 'نعم' || v.r == 'موظف') && u.admin && adm() < 2) return toast('يجب أن يبقى مدير واحد على الأقل');
    if (v.x != 'نعم' && v.r == 'موظف' && v.p && v.p.length < 4) return toast('الرمز 4 أرقام على الأقل');
    if (v.x != 'نعم' && v.r == 'موظف' && !u.pin && !v.p) return toast('رمز الموظف إجباري: اكتب رمزاً جديداً للموظف');
    upd(() => {
      if (v.x == 'نعم') S.users.splice(i, 1);
      else { u.admin = v.r == 'مدير'; if (u.admin) delete u.pin; else if (v.p) u.pin = hs(v.p); if (v.n == 'مخفية') u.nr = 1; else delete u.nr; }
    });
  });
});
const pinCh = needAdm(function () { ask('رمز المدير الجديد', [{ k: 'p', l: 'الرمز الجديد', t: 'password' }]).then(v => { if (v && v.p) upd(() => S.pin = hs(v.p)); }); });
function pTog(k) { if (isAdmin()) upd(() => S.perm[k] = S.perm[k] == 'a' ? 'e' : 'a'); }

function who() {
  ask('من أنت؟', [{ k: 'u', l: 'المستخدم', t: 'sel', o: S.users.map(u => u.name), v: S.me }], 'اختيار').then(v => {
    if (!v) return;
    const u = S.users.find(x => x.name == v.u); if (!u) return;
    if (!u.admin) {
      const go2 = () => { admSet(false); upd(() => { S.me = u.name; }); };
      if (u.name == S.me) return;
      if (u.pin) return ask('رمز الموظف: ' + u.name, [{ k: 'p', l: 'الرمز السري', t: 'password' }], 'دخول').then(p => { if (p) (hv(p.p, u.pin) || hv(p.p, S.pin)) ? go2() : toast('الرمز خاطئ'); });
      return go2();
    }
    if (u.name == S.me && admOk()) return;
    ask('رمز المدير', [{ k: 'p', l: 'الرمز', t: 'password' }], 'دخول').then(p => { if (p) hv(p.p, S.pin) ? (admSet(true), upd(() => { S.me = u.name; })) : toast('الرمز خاطئ'); });
  });
}
function setup() {
  ask('مرحباً في محل عزيز! إعداد المدير', [{ k: 'n', l: 'اسمك' }, { k: 'p', l: 'رمز المدير (لحماية الصلاحيات)', t: 'password' }], 'ابدأ').then(v => {
    if (!v || !v.n.trim() || !v.p) return setup();
    S.users = [{ name: v.n.trim(), admin: true }]; S.me = v.n.trim(); S.pin = hs(v.p); admSet(true); save(); render();
  });
}

/* ---------- القفل: تسجيل الدخول (#lg) والقفل السريع (#lk) ---------- */
let LAST = Date.now(), HID_AT = 0;
['touchstart', 'click', 'keydown'].forEach(e => addEventListener(e, () => { LAST = Date.now(); }, true));
const TRIES = {};
function tryBlocked(k, m, pad) { const t = TRIES[k] || (TRIES[k] = { n: 0, until: 0 }); if (Date.now() < t.until) { if (m) m.textContent = 'انتظر 10 ثوانٍ ثم أعد المحاولة'; pkTap(pad, 'C'); return true; } return false; }
function tryFail(k, m, pad, txt) { const t = TRIES[k]; t.n++; pkTap(pad, 'C'); if (t.n >= 5) { t.n = 0; t.until = Date.now() + 10000; if (m) m.textContent = 'محاولات كثيرة! انتظر 10 ثوانٍ'; } else if (m) m.textContent = txt; }

function lgShow() {
  if ($('lg')) return;
  admSet(false);
  const emp = S.users.filter(u => !u.admin), ads = S.users.filter(u => u.admin);
  document.body.insertAdjacentHTML('beforeend', `<div id="lg" class="lockscr"><div class="lockbox"><h2>${I('lock')} تسجيل الدخول — محل عزيز</h2>`
    + (emp.length ? '<p class="m c">دخول كموظف</p>' + emp.map((u, i) => `<button class="btn s" onclick="lgEmp(${i})">${esc(u.name)}${u.pin ? ' ' + I('lock') : ''}</button>`).join('') : '')
    + `<p class="m c">دخول كمدير</p><select id="lga">${ads.map(u => `<option>${esc(u.name)}</option>`).join('')}</select><div id="lgm" class="m c"></div>${pinPadHtml('lgp', 'رمز المدير', 'lgAdm()')}<button class="btn" onclick="lgAdm()">دخول المدير</button></div></div>`);
}
function lgEmp(i) {
  const u = S.users.filter(x => !x.admin)[i], done = () => { upd(() => { S.me = u.name; }); $('lg').remove(); };
  if (!u.pin) return done();
  ask('رمز ' + u.name, [{ k: 'p', l: 'الرمز بالأرقام', t: 'password' }], 'دخول').then(p => { if (p) hv(p.p, u.pin) ? done() : toast('الرمز خاطئ'); });
}
function lgAdm() {
  const p = $('lgp'), m = $('lgm');
  if (tryBlocked('lg', m, 'lgp')) return;
  if (p && hv(p.value, S.pin)) { TRIES.lg = null; admSet(true); LAST = Date.now(); const n = $('lga').value; upd(() => { S.me = n; }); $('lg').remove(); }
  else tryFail('lg', m, 'lgp', 'رمز خاطئ');
}
function lkShow() {
  if ($('lk')) return;
  document.body.insertAdjacentHTML('beforeend', `<div id="lk" class="lockscr"><div class="lockbox"><h2>${I('lock')} محل عزيز مقفل</h2><p id="lkm" class="m c">أدخل رمز القفل السريع أو رمز المدير</p>${pinPadHtml('lki', 'رمز الفتح', 'lkTry()')}<button class="btn" onclick="lkTry()">فتح التطبيق</button></div></div>`);
}
function lkTry() {
  const m = $('lkm'), el = $('lki');
  if (tryBlocked('lk', m, 'lki')) return;
  const c = el ? el.value : '', u = S.users.find(x => x.name == S.me);
  if (c && (hv(c, S.cfg.lk) || hv(c, S.pin) || (u && u.pin && hv(c, u.pin)))) { TRIES.lk = null; localStorage.removeItem('shopLock'); $('lk').remove(); LAST = Date.now(); }
  else tryFail('lk', m, 'lki', 'الرمز خاطئ، حاول مرة أخرى');
}
function lkSet(go2) {
  if (!isAdmin()) return toast('للمدير فقط');
  ask('رمز القفل السريع', [{ k: 'p', l: 'اختر رمزاً لقفل وفتح التطبيق بسرعة', t: 'password' }]).then(v => { if (v && v.p) { upd(() => S.cfg.lk = hs(v.p)); if (go2 === true) lockNow(); } });
}
function lockNow() {
  if (!S.cfg.lk && !S.pin) return isAdmin() ? lkSet(true) : toast('المدير يعيّن رمز القفل من المزيد');
  try { localStorage.setItem('shopLock', '1'); } catch (e) { }
  lkShow();
}
addEventListener('visibilitychange', () => {
  if (document.hidden) HID_AT = Date.now();
  else if (HID_AT && Date.now() - HID_AT > 90000 && S.users.length && (S.cfg.lk || S.pin)) lockNow();
});
setInterval(() => {
  const idle = (S.cfg.alk ?? DL0.alk) * 60000;
  if (S.users.length && S.pin && Date.now() - LAST > idle) {
    if (isAdmin() && !$('lg')) lgShow();
    else if ((S.cfg.lk || S.pin) && !$('lk') && !$('lg')) lockNow();
  }
}, 15000);

/* ---------- النسخ الاحتياطي ---------- */
async function bkKey(pin) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode('aziz-bk-v1'), iterations: 150000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function bkEncObj(obj, pin) {
  const key = await bkKey(pin), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  let s = ''; for (let i = 0; i < out.length; i += 8192)s += String.fromCharCode.apply(null, out.subarray(i, i + 8192));
  return btoa(s);
}
async function bkDecObj(b64, pin) {
  const key = await bkKey(pin), u = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12) }, key, u.subarray(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function makeSafeBackupJson(pinOrHash) {
  const copy = bkCopy();
  const resMap = {}, upins = {};
  (copy.items || []).forEach(i => { if (i.res) { resMap[i.id] = i.res; delete i.res; } });
  (copy.users || []).forEach(u => { if (u.pin) { upins[u.name] = u.pin; delete u.pin; } });
  const CC = ['rp', 'used', 'debt'];
  const custData = { rp: copy.rp || [], req: copy.req || [], used: copy.used || [], debt: copy.debt || [], res: resMap, upins, trash: (copy.trash || []).filter(t => CC.includes(t.coll)) };
  copy._encCust = await bkEncObj(custData, pinOrHash);
  copy.rp = []; copy.req = []; copy.used = []; copy.debt = []; copy.trash = (copy.trash || []).filter(t => !CC.includes(t.coll));
  delete copy.pin; if (copy.cfg) delete copy.cfg.lk;
  return JSON.stringify(copy);
}

let AB_T = 0, AB_FH = null;
function bkCopy() { return JSON.parse(JSON.stringify(S, function (k, v) { return (k === 'img' && typeof v === 'string' && v.startsWith('data:') && this.id) ? 'idb:' + this.id : v; })); }
const bkSize = d => (d.items || []).length + (d.rp || []).length + (d.gg || []).length + (d.tp || []).length + (d.used || []).length + (d.debt || []).length;
function bkPrune(pre, n) { AUTOBK.all().then(all => Object.keys(all).filter(k => k.startsWith(pre)).sort().reverse().slice(n).forEach(k => AUTOBK.del(k))).catch(() => { }); }
function snapPre() {
  if (!S.users.length) return Promise.resolve();
  return AUTOBK.put('pre:' + Date.now(), { at: Date.now(), data: bkCopy() }).then(() => bkPrune('pre:', 3)).catch(() => { });
}
function schedAutoBk() {
  clearTimeout(AB_T);
  AB_T = setTimeout(async () => {
    try {
      if (!S.users.length) return;
      const rec = { at: Date.now(), data: bkCopy() }, d = new Date(), p = n => String(n).padStart(2, '0');
      await AUTOBK.put('latest', rec);
      const k = 'd:' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      if (!(await AUTOBK.get(k))) { await AUTOBK.put(k, rec); bkPrune('d:', 7); }
      if (AB_FH && S.pin) { const w = await AB_FH.createWritable(); await w.write(await makeSafeBackupJson(S.pin)); await w.close(); }
    } catch (e) { errLog('نسخة تلقائية: ' + (e && e.message || e)); }
  }, 5000);
}
HK.saved.push(schedAutoBk);
async function linkAutoFile() {
  if (!isAdmin()) return toast('للمدير فقط');
  if (!window.showSaveFilePicker) return toast('متصفحك يعتمد الحفظ التلقائي الداخلي');
  try {
    AB_FH = await window.showSaveFilePicker({ suggestedName: 'aziz-shop-auto-backup.json', types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
    AUTOBK.put('fh', AB_FH).catch(() => {});
    schedAutoBk(); render(); toast('تم ربط ملف الحفظ التلقائي بنجاح');
  } catch (e) { }
}
AUTOBK.get('fh').then(async h => {
  if (h && h.queryPermission && (await h.queryPermission({ mode: 'readwrite' })) === 'granted') AB_FH = h;
}).catch(() => {});

function restSnap(key) {
  if (!isAdmin()) return toast('للمدير فقط');
  AUTOBK.get(key).then(rec => {
    if (!rec || !rec.data) return toast('لا توجد هذه النسخة');
    sure('استعادة نسخة ' + fd(rec.at) + ' (' + bkSize(rec.data) + ' سجلاً)؟ يُحفظ وضعك الحالي أولاً كنسخة «قبل استعادة».', 'استعادة').then(y => {
      if (y) snapPre().then(() => { LOAD_BAD = 0; S = { ...load(), ...rec.data }; save(); location.reload(); });
    });
  }).catch(() => toast('تعذر قراءة النسخة'));
}
VW.st_snap = () => ({ t: 'النسخ التلقائية', h: '<p class="m">نسخ داخل الهاتف تُحفظ تلقائياً. الصور لا تدخل فيها. لا تغني عن ملف النسخة الأسبوعي.</p><div id="snl" class="m">جارٍ التحميل…</div>', a: snapList });
function snapList() {
  AUTOBK.all().then(all => {
    const L = Object.keys(all).filter(k => all[k] && all[k].data).sort((x, y) => all[y].at - all[x].at);
    const nm = k => k == 'latest' ? 'آخر حفظ' : k.startsWith('d:') ? 'يومية' : 'قبل استعادة';
    const el = $('snl'); if (!el) return;
    el.innerHTML = L.map(k => { const r = all[k]; return `<div class="card row2"><div style="flex:1"><b>${nm(k)}</b><div class="m"><bdi>${fd(r.at)}</bdi> · ${bkSize(r.data)} سجلاً</div></div><button class="btn s sm" onclick="restSnap('${k}')">استعادة</button></div>`; }).join('') || 'لا توجد نسخ بعد';
  }).catch(() => { const el = $('snl'); if (el) el.textContent = 'تعذر قراءة النسخ'; });
}
function BKP() {
  if (!isAdmin()) return toast('النسخ الاحتياطي للمدير فقط');
  ask('تأكيد رمز المدير لتشفير بيانات الزبائن', [{ k: 'p', l: 'رمز المدير (سيُستخدم لتشفير بيانات الزبائن في النسخة)', t: 'password' }], 'حفظ النسخة').then(async v => {
    if (!v || !v.p) return;
    if (!hv(v.p, S.pin)) return toast('رمز المدير خاطئ');
    try {
      const js = await makeSafeBackupJson(v.p), a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([js], { type: 'application/json' }));
      a.download = 'aziz-shop-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click(); S.cfg.lb = Date.now(); save(); render();
    } catch (e) { toast('تعذر إنشاء النسخة'); }
  });
}
function RST(f) {
  if (!f) return;
  if (!isAdmin()) return toast('الاستعادة للمدير فقط');
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result); if (!d.users) throw 0;
      sure('استبدال كل البيانات الحالية بالنسخة؟', 'استعادة').then(y => {
        if (!y) return;
        const pre = snapPre();
        if (!d._encCust) { pre.then(() => { S = { ...load(), ...d }; save(); location.reload(); }); return; }
        ask('فك تشفير بيانات الزبائن', [{ k: 'p', l: 'أدخل رمز المدير الذي حُفظت به النسخة', t: 'password' }], 'فك التشفير والاستعادة').then(async v => {
          if (!v || !v.p) return;
          try {
            let cust;
            try { cust = await bkDecObj(d._encCust, v.p); } catch (e1) { try { cust = await bkDecObj(d._encCust, hs(v.p)); } catch (e2) { cust = await bkDecObj(d._encCust, hsL(v.p)); } }
            delete d._encCust;
            d.rp = cust.rp || []; d.req = cust.req || []; d.used = cust.used || []; d.debt = cust.debt || [];
            (d.items || []).forEach(i => { if (cust.res && cust.res[i.id]) i.res = cust.res[i.id]; });
            if (cust.upins) (d.users || []).forEach(u => { if (cust.upins[u.name]) u.pin = cust.upins[u.name]; });
            d.trash = [...(d.trash || []), ...(cust.trash || [])];
            d.pin = d.pin || S.pin;
            if (S.cfg && S.cfg.lk) d.cfg = { ...(d.cfg || {}), lk: S.cfg.lk };
            await pre; S = { ...load(), ...d }; save(); location.reload();
          } catch (e) { toast('الرمز خاطئ، تعذر فك تشفير بيانات الزبائن'); }
        });
      });
    } catch (e) { toast('ملف غير صالح'); }
  };
  r.readAsText(f);
}
function abStatus() {
  AUTOBK.get('latest').then(r => {
    const el = $('st_ab'); if (!el) return;
    const old = !r || Date.now() - r.at > 2 * 864e5;
    el.innerHTML = r ? (old ? I('alert') + ' آخر نسخة تلقائية قديمة: <bdi>' + fd(r.at) + '</bdi>' : I('check') + ' آخر نسخة تلقائية: <bdi>' + fd(r.at) + '</bdi>') : I('alert') + ' لا توجد نسخة تلقائية بعد';
    if (old) el.style.color = '#dc2626';
  }).catch(() => { const el = $('st_ab'); if (el) { el.innerHTML = I('alert') + ' تعذر قراءة النسخ التلقائية'; el.style.color = '#dc2626'; } });
}
VW.st_bk = () => {
  const n = (localStorage.getItem('shop3') || '').length, p = Math.round(n / 5e4), er = JSON.parse(localStorage.getItem('shopErr') || '[]');
  return {
    t: 'النسخ الاحتياطي',
    h: '<p class="m">يتم تشفير بيانات الزبائن الحساسة (الصيانة، الطلبات، الحجوزات، ورموز الموظفين) داخل ملف النسخة الاحتياطية لحمايتها من التسريب.</p>'
      + '<button class="btn" onclick="BKP()">حفظ ملف النسخة في الهاتف (محمي)</button>'
      + (window.showSaveFilePicker ? `<button class="btn s" onclick="linkAutoFile()">${AB_FH ? I('check') + ' مرتبط بملف تلقائي (اضغط لتغييره)' : 'ربط ملف حفظ تلقائي مباشر بالهاتف'}</button>` : '')
      + '<button class="btn s" onclick="go(\'st_snap\')">النسخ التلقائية الداخلية (آخر 7 أيام)</button>'
      + '<label>استعادة من ملف خارجي<input type="file" accept=".json" onchange="RST(this.files[0])"></label>'
      + `<h3>المساحة المستعملة</h3><div class="card"><div class="row2"><b>${p}%</b><span class="m">${(n / 1e6).toFixed(1)} مليون حرف من نحو 5</span></div><div class="meter"><div style="width:${Math.min(100, p)}%;background:${p > 70 ? '#dc2626' : 'var(--p)'}"></div></div>${p > 70 ? '<p class="m">اقتربت المساحة من الامتلاء. خذ نسخة احتياطية الآن.</p>' : ''}</div>`
      + `<div class="card"><b>خزنة الصور (IndexedDB)</b><div class="m">صور الصيانة والمستعمل المحفوظة خارج ذاكرة المتصفح الضيقة: <b>${Object.keys(IMG).length}</b> (لا تستهلك من حد الـ 5 ميجابايت).</div></div>`
      + '<div id="st_ab" class="m" style="margin:8px 0"></div>'
      + (er.length ? '<h3>آخر الأخطاء (للتشخيص)</h3>' + er.map(x => `<div class="m">${esc(x)}</div>`).join('') : '')
    , a: abStatus
  };
};

/* ---------- الإقلاع ---------- */
$('bk').innerHTML = ic('back'); $('srb').innerHTML = ic('search'); $('lkb').innerHTML = I('lock'); $('syb').innerHTML = I('cloud');
S.trash = S.trash.filter(t => Date.now() - t.t < 2592e6);
try { navigator.storage.persist(); } catch (e) { }
startHistory();
render();
function boot2() {
  if (!S.users.length) { admSet(true); setup(); }
  else if (S.pin && ((isAdmin() && !admOk()) || !S.users.some(u => u.name == S.me))) lgShow();
  try { if (localStorage.getItem('shopLock') == '1' && (S.cfg.lk || S.pin)) lkShow(); } catch (e) { }
}
function bkBest() {
  return AUTOBK.all().then(all => {
    let b = null;
    Object.keys(all).forEach(k => { const r = all[k]; if (r && r.data && (r.data.users || []).length) { const z = bkSize(r.data); if (!b || z > b.z || (z == b.z && r.at > b.rec.at)) b = { k, rec: r, z }; } });
    return b;
  });
}
function bootRescue() {
  const go2 = () => { LOAD_BAD = 0; boot2(); };
  if (!(LOAD_BAD || !S.users.length)) return boot2();
  bkBest().then(b => {
    if (!b) return go2();
    sure('لا توجد بيانات سليمة على هذا الجهاز، لكن وُجدت نسخة تلقائية بتاريخ ' + fd(b.rec.at) + ' فيها ' + b.z + ' سجلاً. استعادتها؟', 'استعادة', false).then(y => {
      if (!y) return go2();
      LOAD_BAD = 0; S = { ...load(), ...b.rec.data }; save(); location.reload();
    });
  }).catch(go2);
}
bootRescue();
imgInit();
