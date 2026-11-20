/* ============================================================
   home.js — الرئيسية، البحث الموحّد، المزيد والإعدادات، الأيقونة العائمة
   يُحمَّل بعد extra.js وقبل users.js.
   ============================================================ */
/* ---------- الأقسام الـ 8 ---------- */
const SECS = [
  ['phones', 'الهواتف', 'cphone'],
  ['glass', 'الأنتي كاس', 'cglass'],
  ['case', 'البوشيط', 'ccase'],
  ['acc', 'الإكسسوارات', 'cacc'],
  ['tp', 'التعبئة', 'ctopup'],
  ['req', 'طلبات الزبائن', 'creq'],
  ['usd', 'شراء مستعمل', 'cused'],
  ['dbt', 'الديون', 'cdebt']
];
const secGo = k => ['tp', 'req', 'usd', 'dbt'].includes(k) ? `go('${k}')` : `go('sec',{k:'${k}'})`;
/* ---------- البحث الموحّد + بطاقة كاشف الأثمنة الفوري (بدون تكرار) ---------- */
let SC = '', SQ_T = 0;   // نطاق البحث الحالي + مؤقت تهدئة الكتابة
const scopeChips = () => [['', 'الكل'], ...SRCH.map(p => [p.k, p.l])].map(([k, l]) => `<button class="tag ${SC == k ? 'on' : ''}" onclick="scSet('${k}')">${l}</button>`).join('');
/* مصادر بحث إضافية: الصيانة، طلبات الزبائن، دليل أسعار الإصلاح */
SRCH.push(
  { k: 'rp', l: 'صيانة', run: n => S.rp.filter(r => nzOf(r, rpText).includes(n)).sort((x, y) => (y.t0 || 0) - (x.t0 || 0)).slice(0, 20).map(rc) },
  { k: 'req', l: 'طلبات الزبائن', run: n => S.req.filter(q => nz(q.t).includes(n)).slice(0, 20).map(q => typeof rqCard == 'function' ? rqCard(q) : `<div class="card"><div class="m">${fd(q.at)} · ${esc(q.by || '')}</div><div>${esc(q.t)}</div><div class="sub">${rqTel(q.t) ? `<button class="btn s sm" onclick="rqWA('${q.id}')">واتساب</button>` : ''}<button class="btn s sm" onclick="rqD('${q.id}')">مسح</button></div></div>`) },
  { k: 'gd', l: 'أسعار الإصلاح', run: n => S.guide.filter(g => nz(g.m + ' ' + g.f + ' ' + (g.n || '')).includes(n)).slice(0, 20).map(gdCard) }
);
function scSet(k) { SC = k; const b = $('sc'); if (b) b.innerHTML = scopeChips(); sq(Q, 1); }
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
function sq(q, now) {
  if (q && !QP) { QP = 1; history.pushState({ V, q: 1 }, ''); }
  Q = q;
  const hasQ = !!(q && String(q).trim());
  const cBtn = $('q_clr'); if (cBtn) cBtn.hidden = !hasQ;
  const hm = $('hm'); if (hm) hm.hidden = hasQ;
  clearTimeout(SQ_T);
  const run = () => { const r = $('res'); if (r) r.innerHTML = hasQ ? srch(q) : ''; };
  if (!hasQ || now) run();
  else SQ_T = setTimeout(run, 90);
}
function qClear() {
  const i = $('q_inp'); if (i) { i.value = ''; i.focus(); }
  sq('', 1);
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
    + P(rq ? 'rp' : 'ok', "go('req')", 'chat', rq, 'طلبات الزبائن', '')
    + `</div>`
    + todayLine();
}
function todayLine() {
  if (!S.rp.length) return '';
  const day = new Date(); day.setHours(0, 0, 0, 0); const t = day.getTime();
  const a = S.rp.filter(r => r.t0 >= t).length, b = S.rp.filter(r => r.st == 'dn' && r.t2 >= t).length;
  return `<div class="m" style="text-align:center;margin:-2px 0 8px">اليوم: استلمنا <b>${a}</b> · سلّمنا <b>${b}</b></div>`;
}
/* ---------- الرئيسية ---------- */
const bkHide = () => { try { localStorage.setItem('bkHide', Date.now()); } catch (e) { } render(); };
VW.home = () => {
  const old = isAdmin() && (S.items.length || S.rp.length) && Date.now() - (S.cfg.lb || 0) > 7 * 864e5;
  let hid = 0; try { hid = Date.now() - (+localStorage.getItem('bkHide') || 0) < 864e5; } catch (e) { }
  const bk = old && !hid ? `<div class="bkb">${I('alert')}<span>لم تُحفظ نسخة خارجية منذ أسبوع</span><button class="btn sm" onclick="BKP()">حفظ</button><button class="bkx" onclick="bkHide()" aria-label="إغلاق">✕</button></div>` : '';
  const call = L => L.map(f => f()).join('');
  const T = HOME.tools.map(f => f()), A = HOME.after.map(f => f());
  const scan = T.filter(h => h.includes('bcHome()')).join('');
  const more = T.filter(h => !h.includes('bcHome()')).join('') + A.join('');
  return {
    t: 'محل عزيز',
    h: bk + call(HOME.top)
      + `<div class="sec-panel" style="margin-top:4px"><div class="q-wrap"><input id="q_inp" placeholder="ابحث: هاتف، زجاج، بوشيط، تذكرة، زبون…" value="${esc(Q)}" oninput="sq(this.value)"><button id="q_clr" type="button" class="q-clr" ${Q ? '' : 'hidden'} onclick="qClear()" aria-label="مسح البحث">✕</button></div>`
      + `<div id="sc" class="sec-tags nowrap">${scopeChips()}</div></div><div id="res"></div>`
      + '<div id="hm">' + homeQuickBar() + scan
      + '<h3>الأقسام</h3>'
      + (S.cfg.hl == 'grid'
        ? `<div class="grid">${SECS.map(([k, n, i]) => `<button class="card sc cs2" onclick="${secGo(k)}">${ic(i)}<span class="ct"><b>${n}</b></span></button>`).join('')}</div>`
        : `<div class="hl">${SECS.map(([k, n, i]) => `<button class="hr" onclick="${secGo(k)}">${ic(i)}<span class="ct"><b>${n}</b></span></button>`).join('')}</div>`)
      + more + '</div>',
    a: () => sq(Q, 1)
  };
};
/* ---------- المزيد (منظم بأقسام مستقلة وبطاقات مدمجة الوصف) ---------- */
const MG = [
  ['shop', 'المحل', 'كل ما يخص الأقسام: الهواتف والأنتي كاس والبوشيط والإكسسوارات والصيانة والتعبئة والتقرير. لكل قسم صفحة واحدة تجمع وسومه وحدوده.', 'grid'],
  ['dev', 'المظهر والقفل', 'الثيم وحجم الخط وحجم العرض والزر العائم، والقفل التلقائي.', 'palette'],
  ['adm', 'الإدارة والبيانات', 'المستخدمون والصلاحيات، المزامنة بين الأجهزة، النسخ الاحتياطي، وسلة المحذوفات.', 'users']
];
const STX = [
  ['الشراء السريع بضغطة واحدة في التقرير (✓)', "go('st_rep')", 'التقرير اليومي', 'تأشير صح كمية افتراضية'],
  ['ساعة تذكير التقرير', "go('st_rep')", 'التقرير اليومي', 'موعد تنبيه إرسال'],
  ['أيام بلا تذكير', "go('st_rep')", 'التقرير اليومي', 'عطلة'],
  ['عنوان التقرير وعبارة الختام', "go('st_rep')", 'التقرير اليومي', 'توقيع'],
  ['ما يظهر في التقرير', "go('st_rep')", 'التقرير اليومي', 'أسعار طلبات ديون'],
  ['الثيم (فاتح / ليلي / AMOLED)', "go('st_look')", 'المظهر والقفل', 'لون داكن ليل نهار اموليد'],
  ['حجم الخط وحجم العرض (تكبير العناصر)', "go('st_look')", 'المظهر والقفل', 'كبير صغير تكبير العناصر ازرار شاشة'],
  ['الزر العائم (+)', "go('st_look')", 'المظهر والقفل', 'أيقونة إضافة'],
  ['حد «متوفر» و«قارب» لبطاقات التعبئة', "go('st_tp')", 'التعبئة', '5 10 20 50 درهم'],
  ['حدود رصيد هاتف التعبئة', "go('st_tp')", 'التعبئة', 'منخفض نافد'],
  ['ساعة تذكير التعبئة', "go('st_tp')", 'التعبئة', 'صباح'],
  ['الجولة: يُعتبر الصنف غير مؤكد بعد (أيام)', "go('st_rep')", 'التقرير اليومي', 'جولة تأكيد مخزون']
];
const stItems = () => {
  const o = [];
  MG.forEach(([k, t]) => MORE.filter(x => x.g == k && (!x.ao || isAdmin())).forEach(x => o.push({ l: x.l, fn: x.fn, p: t, kw: x.d || '' })));
  Object.values(CATS).forEach(c => c[1].forEach(([l, fn]) => o.push({ l, fn, p: c[0], kw: '' })));
  STX.forEach(([l, fn, p, kw]) => o.push({ l, fn, p, kw }));
  return o;
};
function stQ(q) {
  const n = nz(q), g = $('stg'), r = $('str'); if (!g || !r) return;
  g.style.display = n ? 'none' : '';
  if (!n) { r.innerHTML = ''; return; }
  const seen = {}, L = stItems().filter(x => { const k = x.l + x.fn; if (seen[k]) return false; seen[k] = 1; return nz(x.l + ' ' + x.kw + ' ' + x.p).includes(n); });
  r.innerHTML = L.map(x => `<button class="card row2 st-row" onclick="${x.fn}"><b class="st-lbl">${esc(x.l)}</b><span class="m st-val">${esc(x.p)}</span></button>`).join('') || '<p class="m">لا نتائج</p>';
}
VW.st = () => ({
  t: 'المزيد',
  h: `<input placeholder="ابحث في الإعدادات: حد، لون، خط، قفل..." oninput="stQ(this.value)"><div id="str"></div><div id="stg">`
    + MG.map(([k, t, d, icon]) => `<button class="card st-card" onclick="go('st_grp',{g:'${k}'})"><div class="st-ic">${ic(icon)}</div><div class="st-txt"><b>${t}</b><div class="m">${d}</div></div><span class="st-arr">${ic('back')}</span></button>`).join('')
    + '</div>'
});
VW.st_grp = () => {
  const g = V.g || 'shop', info = MG.find(x => x[0] == g) || MG[0];
  const L = MORE.filter(x => x.g == g && (!x.ao || isAdmin())).sort((a, b) => (a.o || 50) - (b.o || 50));
  const R = x => {
    const sub = x.n ? x.n() : '';
    return `<button class="card st-card" onclick="${x.fn}"><div class="st-txt"><b>${esc(x.l)}</b>${x.d ? `<div class="m">${esc(x.d)}</div>` : ''}</div>${sub ? `<span class="m st-val">${esc(sub)}</span>` : ''}<span class="st-arr">${ic('back')}</span></button>`;
  };
  const A = L.filter(x => x.adv), B = L.filter(x => !x.adv);
  return {
    t: info[1],
    h: `<p class="m">${info[2]}</p>` + B.map(R).join('')
      + (A.length ? `<details class="card" style="margin-top:12px"><summary><b>خيارات متقدمة</b> <span class="m">(${A.length}) — نادراً ما تحتاجها</span></summary><div style="margin-top:8px">${A.map(R).join('')}</div></details>` : '')
  };
};
MORE.push(
  { g: 'look', o: 5, l: 'المظهر والعرض', d: 'الثيم (النهار والليل)، الخطوط، تدريج الخط والعرض، والزر العائم (لهذا الجهاز)', fn: "go('st_look')", n: () => {
    const c = thCfg(), fs = FS_OLD[S.cfg.fs] || +S.cfg.fs || 18;
    return ({ ibm: 'IBM Plex', rubik: 'Rubik', baloo: 'Baloo 2', sys: 'النظام' }[c.fn] || 'IBM Plex') + ' · ' + fs + 'px · ' + c.ds + '%';
  } },
  { g: 'usr', o: 10, l: 'المستخدمون والصلاحيات', d: 'إضافة موظفين وتحديد ما يستطيعون فعله', fn: "go('st_users')" },
  { g: 'usr', o: 30, l: 'القفل التلقائي', d: 'يقفل التطبيق بعد مدة بلا استعمال أو عند الخروج منه (لهذا الجهاز)', fn: 'lkEd()', n: () => lkTxt(lkSecs()) },
  { g: 'data', o: 20, l: 'النسخ الاحتياطي والاستعادة', d: 'حفظ نسخة من البيانات أو استعادتها', fn: "go('st_bk')", ao: 1 },
  { g: 'sec', o: 60, l: 'كل الوسوم (قائمة كاملة)', d: 'كل القوائم (ماركات، ألوان، سعات...) في مكان واحد', fn: "go('st_tags')" }
);
(() => {
  MORE.push({ g: 'adm', o: 40, l: 'سلة المحذوفات', d: 'استرجاع ما حُذف خلال آخر 30 يوماً', fn: "go('st_trash')", n: () => S.trash.length || '' });
  const P = {
    'الهواتف': ['shop', 10], 'الأنتي كاس': ['shop', 20], 'البوشيط': ['shop', 30], 'الإكسسوارات': ['shop', 40], 'الصيانة': ['shop', 50],
    'حدود التعبئة': ['shop', 60, 0, 'التعبئة'], 'إعدادات التقرير': ['shop', 70, 0, 'التقرير اليومي'],
    'إحصائيات: الأعطال وطلبات الزبائن': ['shop', 80],
    'كل الوسوم (قائمة كاملة)': ['shop', 90, 1], 'الحقول في النماذج': ['shop', 91, 1], 'الخانات المخصصة': ['shop', 92, 1], 'تلوين البطاقات': ['shop', 93, 1], 'حدود النفاد': ['shop', 94, 1, 'حدود النفاد العامة'],
    'المظهر والعرض': ['dev', 5],
    'القفل التلقائي': ['dev', 30],
    'المستخدمون والصلاحيات': ['adm', 10], 'المزامنة بين الأجهزة': ['adm', 20], 'النسخ الاحتياطي والاستعادة': ['adm', 30]
  };
  const D = {
    'الهواتف': 'الماركات والألوان والسعات وألوان الماركات وحدود النفاد', 'الأنتي كاس': 'أنواع الزجاج والمستويات والحدود',
    'البوشيط': 'الألوان وحدود النفاد', 'الإكسسوارات': 'الأنواع والموصلات والفئات وحدود كل نوع',
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
/* ---------- المظهر: 4 ثيمات متقنة، 3 خطوط عربية، تدريج ناعم للخط (0.5px) والعرض (2.5%) مع معاينة حية ---------- */
const THMD = [['a', 'تلقائي (يتبع الهاتف)'], ['l', 'نهاري دائماً'], ['d', 'ليلي دائماً']];
const TH_LB_L = [
  ['warm', 'نهاري هادئ (دافئ)', 'عاجي مريح للعين مع أخضر زمردي', '#0d7a5f'],
  ['light', 'نهاري بارز (ناصع)', 'أبيض نقي عالي التباين مع أزرق رسمي', '#1d5bd6']
];
const TH_LB_D = [
  ['lcd', 'ليلي شاشات LCD', 'كحلي داكن متوازن يمنع البهتان مع زمردي مشرق', '#10b981'],
  ['amoled', 'ليلي AMOLED احترافي', 'أسود 100% لتوفير البطارية مع أزرق سماوي', '#3b82f6']
];
const TH_FN_OPTS = [
  ['ibm', 'IBM Plex Sans', 'متوازن ودقيق للأرقام والعربية'],
  ['rubik', 'Rubik', 'عصري عريض وواضح جداً'],
  ['baloo', 'Baloo Bhaijaan 2', 'حروف ناعمة وعناوين بارزة'],
  ['sys', 'خط الهاتف الأصلي', 'الخط الافتراضي للنظام']
];
const FS_STEPS = [
  [15.5, '15.5'], [16, '16'], [16.5, '16.5'], [17, '17'], [17.5, '17.5'],
  [18, '18 (افتراضي)'], [18.5, '18.5'], [19, '19'], [19.5, '19.5'], [20, '20'], [20.5, '20.5']
];
const DS_STEPS = [
  [90, '90%'], [92.5, '92.5%'], [95, '95%'], [97.5, '97.5%'],
  [100, '100% (افتراضي)'], [102.5, '102.5%'], [105, '105%'], [107.5, '107.5%'], [110, '110%']
];
function szSliderHtml(title, sub, steps, curVal, onPick) {
  let idx = steps.findIndex(s => s[0] == curVal);
  if (idx < 0) idx = steps.reduce((best, s, i) => Math.abs(s[0] - curVal) < Math.abs(steps[best][0] - curVal) ? i : best, 0);
  const prev = idx > 0 ? steps[idx - 1][0] : null;
  const next = idx < steps.length - 1 ? steps[idx + 1][0] : null;
  return `<div class="sz-card"><div class="sz-head"><b>${title}</b><span>${steps[idx][1]}</span></div><div class="sz-sub">${sub}</div>`
    + `<div class="sz-ctrl">`
    + `<button type="button" class="sz-step" ${prev === null ? 'disabled' : `onclick="${onPick(prev)}"`} aria-label="تصغير">−</button>`
    + `<div class="sz-track">${steps.map(([v, l], i) => `<button type="button" class="sz-seg ${i <= idx ? 'fill' : ''} ${i === idx ? 'cur' : ''}" onclick="${onPick(v)}" title="${l}"><i></i></button>`).join('')}</div>`
    + `<button type="button" class="sz-step" ${next === null ? 'disabled' : `onclick="${onPick(next)}"`} aria-label="تكبير">+</button>`
    + `</div></div>`;
}
VW.st_look = () => {
  const fabOn = S.cfg.fab !== 0, c = thCfg(), fs = FS_OLD[S.cfg.fs] || +S.cfg.fs || 18;
  const miniPv = `<div class="card cmp pv-mini"><div class="ph-top"><b class="ph-nm"><bdi>Samsung A07</bdi></b><div class="ph-pr-wrap">${prBadge('1500')}<span class="dotl" style="background:${DT.y}"></span></div></div><div class="ph-bot"><div class="ph-specs">${memBadge('4GB', '64GB')}<span class="tot-b">المجموع <b>2</b></span></div><div class="cs-sws"><span class="csw"><span class="csd" style="background:#0a0a0a;color:#fff">1</span><small class="m">أسود</small></span><span class="csw"><span class="csd" style="background:#f8fafc;color:#111827">1</span><small class="m">أبيض</small></span></div></div></div>`;
  return {
    t: 'المظهر والعرض',
    h: '<p class="m">تُطبَّق إعدادات المظهر والخط وحجم العرض على هذا الجهاز فقط.</p>'
      + '<h3>نوع الخط</h3>'
      + `<div class="th-grid two">${TH_FN_OPTS.map(([k, n, d]) => `<button type="button" class="ac-btn col ${c.fn == k ? 'on' : ''}" onclick="thSet({fn:'${k}'})"><b>${n}</b><small class="m">${d}</small></button>`).join('')}</div>`
      + '<h3>الوضع والثيمات الأربع</h3>'
      + `<div class="sec-tags">${THMD.map(([k, n]) => `<button class="tag ${c.md == k ? 'on' : ''}" onclick="thSet({md:'${k}'})">${n}</button>`).join('')}</div>`
      + (c.md != 'd' ? `<h3>ثيم النهار ${c.md == 'a' ? '(يُفعَّل نهاراً)' : ''}</h3><div class="th-grid two">${TH_LB_L.map(([k, n, d, col]) => `<button type="button" class="ac-btn col ${c.lt == k ? 'on' : ''}" onclick="thSet({lt:'${k}'})"><div class="row2" style="width:100%"><span class="ac-dot" style="background:${col}"></span><b>${n}</b></div><small class="m">${d}</small></button>`).join('')}</div>` : '')
      + (c.md != 'l' ? `<h3>ثيم الليل ${c.md == 'a' ? '(يُفعَّل ليلاً)' : ''}</h3><div class="th-grid two">${TH_LB_D.map(([k, n, d, col]) => `<button type="button" class="ac-btn col ${c.dt == k ? 'on' : ''}" onclick="thSet({dt:'${k}'})"><div class="row2" style="width:100%"><span class="ac-dot" style="background:${col}"></span><b>${n}</b></div><small class="m">${d}</small></button>`).join('')}</div>` : '')
      + '<h3>حجم الخط وحجم العرض (معاينة حية)</h3>'
      + miniPv
      + szSliderHtml('حجم الخط (قفزة دقيقة 0.5px)', 'تدرّج ناعم جداً لإيجاد المقاس المناسب تماماً لعينك', FS_STEPS, fs, v => `upd(()=>S.cfg.fs=${v})`)
      + szSliderHtml('كثافة وحجم العرض (قفزة 2.5%)', 'ضبط المسافات وارتفاع الأزرار والبطاقات', DS_STEPS, c.ds, v => `thSet({ds:${v}})`)
      + ((fs != 18 || c.ds != 100) ? `<button class="btn s sm" style="width:100%;margin-bottom:6px" onclick="S.cfg.fs=18;thSet({ds:100})">إرجاع الحجم الافتراضي (18px · 100%)</button>` : '')
      + '<h3>عرض الأقسام في الرئيسية</h3>'
      + `<div class="sec-tags">${[['list', 'قائمة'], ['grid', 'شبكة']].map(([k, n]) => `<button class="tag ${(S.cfg.hl == 'grid' ? 'grid' : 'list') == k ? 'on' : ''}" onclick="upd(()=>S.cfg.hl='${k}')">${n}</button>`).join('')}</div>`
      + '<h3>الأيقونة العائمة السريعة</h3>'
      + swRow('زر عائم للإضافة السريعة في الرئيسية', `fabReset();upd(()=>S.cfg.fab=${fabOn ? 0 : 1})`, fabOn)
      + (fabOn ? swRow('تثبيت الزر العائم في مكانه (منع السحب)', 'fabLockToggle()', fabLocked()) : '')
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
  document.querySelectorAll('.rtabs, .sec-tags, #sc').forEach(c => {
    const t = c.querySelector('.tag.on'); if (!t || c.scrollWidth <= c.clientWidth + 2) return;
    const x = c.getBoundingClientRect(), y = t.getBoundingClientRect();
    c.scrollBy({ left: (y.left + y.width / 2) - (x.left + x.width / 2), top: 0 });
  });
});
/* ---------- الحدود ---------- */
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
    if (t && !S.tags[g].includes(t)) upd(() => { S.tags[g].push(t); if (typeof tagSort == 'function') tagSort(S.tags[g], g); if (g == 'brand' && typeof autoBc == 'function') autoBc(t); });
  });
}
/* ---------- المحذوفات ---------- */
VW.st_trash = () => ({
  t: 'المحذوفات (30 يوماً)',
  h: S.trash.map(t => `<div class="card row2"><div class="f1"><b>${esc(t.label)}</b><div class="m"><bdi>${fd(t.t)}</bdi></div></div><button class="btn s sm" onclick="restore('${t.id}')">استرجاع</button></div>`).join('') || emptyBox('سلة المحذوفات فارغة')
});