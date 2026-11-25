/* ============================================================
   invpochette.js — البوشيط: موديل = سطر واحد، واللون هو الهوية
   كل لون دائرة بعدده، وحدّها يلوَّن بالحالة (أحمر نفد / برتقالي قارب / متقطع موقوف).
   خيارات المدير: S.cfg.csx (حكم الحالة، بيع بنقرة، عدّاد نفد، نوع البوشيط...) وأنواع S.cfg.cst.
   يُحمَّل بعد invglass.js.
   ============================================================ */
/* ---------- ألوان الدوائر (الأسماء تُطابَق بعد التطبيع nz + تخصيصات المدير S.cfg.colHex) ---------- */
const CS_HEX = Object.fromEntries(Object.entries({
  'أسود': '#0a0a0a', 'black': '#0a0a0a', 'noir': '#0a0a0a',
  'أبيض': '#f8fafc', 'white': '#f8fafc', 'blanc': '#f8fafc',
  'فضي': '#cbd5e1', 'silver': '#cbd5e1', 'argent': '#cbd5e1',
  'رمادي': '#6b7280', 'gris': '#6b7280', 'gray': '#6b7280', 'grey': '#6b7280',
  'أزرق': '#2563eb', 'blue': '#2563eb', 'bleu': '#2563eb', 'كحلي': '#1e3a8a', 'سماوي': '#38bdf8',
  'تركوازي': '#14b8a6', 'تركواز': '#14b8a6',
  'أخضر': '#16a34a', 'green': '#16a34a', 'vert': '#16a34a',
  'أصفر': '#facc15', 'yellow': '#facc15', 'jaune': '#facc15',
  'ذهبي': '#d4a017', 'gold': '#d4a017',
  'برتقالي': '#f97316', 'orange': '#f97316',
  'أحمر': '#dc2626', 'red': '#dc2626', 'rouge': '#dc2626',
  'وردي': '#f472b6', 'pink': '#f472b6', 'rose': '#f472b6',
  'بنفسجي': '#7c3aed', 'violet': '#7c3aed', 'ليلكي': '#c4b5fd',
  'بني': '#92400e', 'brown': '#92400e', 'marron': '#92400e', 'بيج': '#e7d5b3', 'beige': '#e7d5b3',
  'شفاف': 'pat', 'transparent': 'pat'
}).map(([k, v]) => [nz(k), v]));
const CS_EMO = Object.fromEntries(Object.entries({
  'أسود': '⚫', 'black': '⚫', 'noir': '⚫', 'أبيض': '⚪', 'white': '⚪', 'blanc': '⚪', 'شفاف': '⚪', 'transparent': '⚪',
  'فضي': '🔘', 'رمادي': '🔘', 'silver': '🔘', 'gris': '🔘', 'gray': '🔘', 'grey': '🔘',
  'أزرق': '🔵', 'كحلي': '🔵', 'سماوي': '🔵', 'blue': '🔵', 'bleu': '🔵',
  'أخضر': '🟢', 'تركوازي': '🟢', 'تركواز': '🟢', 'green': '🟢', 'vert': '🟢',
  'أصفر': '🟡', 'ذهبي': '🟡', 'yellow': '🟡', 'jaune': '🟡', 'gold': '🟡', 'برتقالي': '🟠', 'orange': '🟠',
  'أحمر': '🔴', 'red': '🔴', 'rouge': '🔴', 'وردي': '💗', 'pink': '💗', 'rose': '💗',
  'بنفسجي': '🟣', 'ليلكي': '🟣', 'violet': '🟣', 'بني': '🟤', 'بيج': '🟤', 'brown': '🟤', 'marron': '🟤', 'beige': '🟤'
}).map(([k, v]) => [nz(k), v]));
const csHex = c => {
  const k = nz(c), u = typeof S != 'undefined' && S && S.cfg && S.cfg.colHex;
  return (u && (u[c] || u[k])) || CS_HEX[k] || '';
};
const csEmo = c => CS_EMO[nz(c)] || '🔹';
const csBg = c => { const h = csHex(c); return h == 'pat' ? 'repeating-conic-gradient(#cbd5e1 0 25%,#f8fafc 0 50%) 50%/12px 12px' : (h || '#64748b'); };
function csInk(c) {
  const h = csHex(c), m = /^#([0-9a-f]{6})$/i.exec(h);
  if (h == 'pat') return '#111827';
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150 ? '#111827' : '#fff';
}
/* ---------- خيارات البوشيط القابلة للضبط من إعدادات المدير (صفحة st_csx) ----------
   md: حكم حالة الموديل: 0 لكل لون (الأسوأ يحكم) · 1 بالمجموع · 2 بالألوان الأساسية ★ فقط */
const CSXD = { s1: 0, oc: 1, dc: 1, ty: 0, ge: 0, md: 0 };
const csx = k => { const v = (S.cfg.csx || {})[k]; return v === undefined ? CSXD[k] : v; };
const CSXL = [
  ['s1', 'بيع بنقرة واحدة على دائرة اللون (مع تراجع؛ الإضافة من الشريط أو النافذة)'],
  ['oc', 'عدّاد «نفد X مرات هذا الشهر» لكل موديل ولون'],
  ['dc', 'السماح لكل الموظفين بحذف لون عدده 0 (مع تراجع)'],
  ['ty', 'تفعيل «نوع البوشيط» (سيليكون، شفاف، كتاب...) عند إضافة موديل'],
  ['ge', 'السماح بإضافة لون بلا اسم («عام»)']
];
const CSMD = ['لكل لون (أي لون ينفد يحمّر الموديل)', 'بمجموع الألوان', 'بالألوان الأساسية ★ فقط'];
const CST0 = ['سيليكون', 'شفاف', 'كتاب', 'مقوّى'];
const csTypes = () => Array.isArray(S.cfg.cst) ? S.cfg.cst : CST0;
Object.assign(DL0, { ctl: 4 });
LM.push(['ctl', 'بوشيط (وضع المجموع): «قارب النفاد» عند مجموع فأقل']);
function csxTog(k) { if (!isAdmin()) return toast('للمدير فقط'); upd(() => { S.cfg.csx = S.cfg.csx || {}; S.cfg.csx[k] = csx(k) ? 0 : 1; }); }
function csxMode() { if (!isAdmin()) return toast('للمدير فقط'); upd(() => { S.cfg.csx = S.cfg.csx || {}; S.cfg.csx.md = (csx('md') + 1) % 3; }); }
VW.st_csx = () => ({
  t: 'خيارات البوشيط',
  h: '<p class="m">اضغط على الخيار لتشغيله أو إيقافه.</p>'
    + row('حكم حالة الموديل', 'csxMode()', CSMD[csx('md')])
    + '<p class="m">لكل لون: أي لون ينفد يجعل الموديل أحمر. بالمجموع: يُحكم بمجموع قطع الموديل. الأساسية: تُحكم الألوان المعلَّمة ★ فقط (من ⋯ بجانب اللون).</p>'
    + CSXL.map(([k, l]) => row(l, `csxTog('${k}')`, csx(k) ? 'مفعّل ✓' : 'متوقف')).join('')
});
VW.st_cst = () => ({
  t: 'أنواع البوشيط',
  h: '<p class="m">تظهر عند إضافة موديل جديد إن فُعّل «نوع البوشيط».</p><div>'
    + csTypes().map((t, i) => `<span class="tag">${esc(t)}<b onclick="csTyDel(${i})">×</b></span>`).join('')
    + '</div><button class="btn" onclick="csTyAdd()">+ إضافة نوع</button>'
});
function csTyAdd() {
  if (!isAdmin()) return toast('للمدير فقط');
  ask('نوع بوشيط جديد', [{ k: 'n', l: 'الاسم', v: '' }]).then(v => {
    const n = v && v.n.trim(); if (!n) return;
    const a = csTypes(); if (a.some(x => nz(x) == nz(n))) return toast('موجود بالفعل');
    upd(() => { S.cfg.cst = [...a, n]; });
  });
}
function csTyDel(i) {
  if (!isAdmin()) return toast('للمدير فقط');
  const a = csTypes();
  sure('حذف النوع «' + a[i] + '» من القائمة؟ (الموديلات المسجلة به تحتفظ باسمه)', 'حذف').then(y => { if (y) upd(() => { S.cfg.cst = a.filter((_, k) => k != i); }); });
}
/* ---------- البيانات: كل نوع = لون واحد {id, g:'', c, n, mn?, stp?, stpN?, ot?} ----------
   csN: تحويل رجالي/نسائي القديم + دمج الألوان المكررة (بعد دمج/تسمية وسم لون). */
function csN(i) {
  let V0 = i.v;
  if (!V0) return i;
  if (V0.some(x => x.g)) {
    const out = [];
    V0.forEach(x => {
      const c = x.c || '', y = out.find(z => z.c == c);
      if (y) y.n += x.n; else out.push({ id: x.id, g: '', c, n: x.n });
    });
    i.v = V0 = out;
  }
  if (i.glim) delete i.glim;
  if (V0.length > 1) {
    const k = x => nz(x.c || '');
    if (new Set(V0.map(k)).size < V0.length) {
      const out = [];
      V0.forEach(x => {
        const y = out.find(z => k(z) == k(x));
        if (y) { y.n += x.n; if (x.mn) y.mn = 1; if (!x.stp) { delete y.stp; delete y.stpN; } } else out.push(x);
      });
      i.v = out;
    }
  }
  return i;
}
const csNm = i => i.name + (i.ty ? ' · ' + i.ty : '');
const csTot = i => (csN(i).v || []).reduce((a, x) => a + x.n, 0);
const csIsP = x => !!x.stp && x.n <= (x.stpN || 0);   // لون موقوف: يعود تلقائياً إذا زاد عدده
const csHasMain = i => (i.v || []).some(x => x.mn);
const csLim = i => i.lim ?? lim(csx('md') == 1 ? 'ctl' : 'cl');
/* حالة اللون: r نفد · y قارب · g متوفر · z صفر غير منبِّه · p موقوف */
const csVSt = (i, x) => {
  if (csIsP(x)) return 'p';
  const md = csx('md');
  if (md == 1 || (md == 2 && !x.mn && csHasMain(i))) return x.n <= 0 ? 'z' : 'g';
  return x.n <= 0 ? 'r' : x.n <= csLim(i) ? 'y' : 'g';
};
const csSt = i => {
  const V0 = csN(i).v || [];
  if (!V0.length) return 'r';
  const act = V0.filter(x => !csIsP(x));
  let s = 'g';
  if (act.length) {
    if (csx('md') == 1) { const t = act.reduce((a, x) => a + x.n, 0); s = t <= 0 ? 'r' : t <= csLim(i) ? 'y' : 'g'; }
    else { const ss = act.map(x => csVSt(i, x)); s = ss.includes('r') ? 'r' : ss.includes('y') ? 'y' : 'g'; }
  }
  if (s == 'g' && i.need && i.need.trim()) s = 'y';
  return s;
};
const csChipCls = (i, x) => { const s = csVSt(i, x); return s == 'r' ? 'low' : s == 'y' ? 'warn' : ''; };
const csGSummaryTxt = i => (csN(i).v || []).map(x => `${x.c || 'عام'} ${x.n}`).join(' · ') || 'لا ألوان';
/* ---------- عدّاد «نفد» الشهري (مرة واحدة لكل لون خلال 30 دقيقة) ---------- */
const csYm = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1); };
const csOcN = i => i.oc && i.oc.m == csYm() ? i.oc.n : 0;
function csOut(i, x, was) {
  if (!csx('oc') || was <= 0 || x.n > 0) return;
  const now = Date.now();
  if (x.ot && now - x.ot < 18e5) return;
  if (!i.oc || i.oc.m != csYm()) i.oc = { m: csYm(), n: 0, c: {} };
  const k = x.c || 'عام';
  i.oc.n++; i.oc.c[k] = (i.oc.c[k] || 0) + 1; x.ot = now;
}
/* ---------- العرض: دوائر الألوان (اضغط الدائرة ثم − بيع / + إضافة · ضغطة مطولة = تصحيح العدد) ---------- */
let CSSEL = '', CSLT = 0, CSLF = 0;
function csLPs(id, vid) { CSLF = 0; clearTimeout(CSLT); CSLT = setTimeout(() => { CSLF = 1; if (navigator.vibrate) navigator.vibrate(20); csCnt(id, vid); }, 550); }
function csLPe() { clearTimeout(CSLT); }
function csTap(id, vid) {
  if (CSLF) { CSLF = 0; return; }
  const i = find(id), x = i && (i.v || []).find(y => y.id == vid); if (!x) return;
  if (csx('s1') && x.n > 0) return csC(id, vid, -1);
  CSSEL = CSSEL == vid ? '' : vid; render();
}
function csDot(x, st, txt, ia) {
  const ring = st == 'r' ? `;box-shadow:0 0 0 2px var(--c),0 0 0 4.5px ${DT.r}` : st == 'y' ? `;box-shadow:0 0 0 2px var(--c),0 0 0 4.5px ${DT.y}` : '';
  const cls = 'csd' + (ia ? ' pc' : '') + (ia && CSSEL == x.id ? ' sel' : '') + (st == 'z' || st == 'p' ? ' z' : '') + (st == 'p' ? ' pz' : '');
  const ev = ia ? ` onpointerdown="csLPs('${ia}','${x.id}')" onpointerup="csLPe()" onpointerleave="csLPe()" onpointercancel="csLPe()" oncontextmenu="return false" onclick="csTap('${ia}','${x.id}')"` : '';
  return `<span class="${cls}" style="background:${csBg(x.c)};color:${csInk(x.c)}${ring}"${ev}>${txt}</span>`;
}
/* شريط الدوائر. cmp = بدون أسماء للألوان المعروفة · ia = بطاقة تفاعلية (اختيار الدائرة) وإلا الضغط يفتح النافذة */
function csChipsHtml(i, cmp, ia) {
  const V0 = csN(i).v || [];
  if (!V0.length) return `<div class="cs-sws" onclick="csOpen('${i.id}')"><span class="m">لا ألوان — اضغط للإضافة</span></div>`;
  return `<div class="cs-sws"${ia ? '' : ` onclick="csOpen('${i.id}')"`}>` + V0.map(x => `<span class="csw">${csDot(x, csVSt(i, x), x.n, ia ? i.id : '')}${!cmp || !csHex(x.c) ? `<small class="m">${esc(x.c || 'عام')}</small>` : ''}</span>`).join('') + `</div>`;
}
function csCard(i) {
  const s = csSt(i), cmp = isCmp('case') && V.v == 'sec', sel = (csN(i).v || []).find(x => x.id == CSSEL), oc = csOcN(i);
  const pr = i.price ? `<span class="cmp-pr">${esc(fmtPr(i.price))}</span>` : '';
  const nt = (i.need ? `<div class="cs-nt" style="color:${DT.r}">خاصنا: ${esc(i.need)}</div>` : '') + (i.rem ? `<div class="cs-nt m">باقي: ${esc(i.rem)}</div>` : '')
    + (csx('oc') && oc >= 2 ? `<div class="cs-nt m">نفد ${oc} مرات هذا الشهر</div>` : '');
  const bar = sel ? `<div class="phsel"><span class="csd" style="background:${csBg(sel.c)};color:${csInk(sel.c)}"></span><b class="f1">${esc(sel.c || 'عام')}</b><button class="btn s sm sell" onclick="csC('${i.id}','${sel.id}',-1)">− بيع</button><span class="cn">${sel.n}</span><button class="btn sm" onclick="csC('${i.id}','${sel.id}',1)">+ إضافة</button><button class="tag" onclick="csVMenu('${i.id}','${sel.id}')">⋯</button></div>` : '';
  return cardH(`<div class="row2" style="gap:8px;flex-wrap:wrap"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="csOpen('${i.id}')"><b>${esc(i.name)}</b>${i.ty ? ` <span class="phk c">${esc(i.ty)}</span>` : ''}${nt}</div>${pr}${csChipsHtml(i, cmp, 1)}</div>${bar}${cmp ? '' : fxShow(i)}`, colOf(i), 'cmp');
}
function csView() {
  const allCs = S.items.filter(i => i.sec == 'case'), totPcs = allCs.reduce((s, i) => s + csTot(i), 0), lowCnt = allCs.filter(i => csSt(i) != 'g').length;
  let a = srt(allCs, 'case', i => i.name, csTot, i => i.at);
  if (V.cf) a = a.filter(i => csSt(i) != 'g');
  const pg = pgSlice('cs', a);
  const tagsHtml = `<button class="tag ${!V.cf ? 'on' : ''}" onclick="V.cf=0;render()">الكل (${allCs.length} · ${arCnt(totPcs, 'قطعة', 'قطعتان', 'قطع')})</button>`
    + `<button class="tag ${V.cf ? 'on' : ''}" onclick="V.cf=1;render()">يحتاج شراء (${lowCnt})</button>`;
  return {
    t: 'البوشيط',
    h: `<button class="btn" onclick="csAdd()">+ إضافة موديل بوشيط</button>`
      + secPanel('case', tagsHtml)
      + (pg.items.map(csCard).join('') + pg.more || emptyBox('لا توجد موديلات بوشيط في هذا الفلتر', 'اضغط على «+ إضافة موديل بوشيط» في الأعلى لإضافة أول موديل'))
  };
}
/* ---------- تعديل مع «تراجع» (يُحدّث نافذة الموديل إن كانت مفتوحة) ---------- */
function csDo(id, label, fn) {
  const i = find(id); if (!i) return;
  const b = JSON.stringify(i);
  fn(i); save(); render();
  toast(label, () => {
    const j = find(id); if (!j) return;
    const o = JSON.parse(b);
    Object.keys(j).forEach(k => delete j[k]); Object.assign(j, o);
    csShR(id);
  });
}
const csShR = id => { if (SH && $('sh') && $('sh').querySelector(`h3[data-cs="${id}"]`)) csSheetR(id); };
/* ---------- نافذة الموديل: − / + لكل لون ---------- */
let CQ = '', CSCODE = '', CSD = {}, CSUP = 0, CSVMC = 0;   // CSUP = موديل زادت كميته أثناء النافذة (لفحص طلبات الزبائن عند الإغلاق)
function csClosed() { const id = CSUP; CSUP = 0; const i = id && find(id); if (i) reqChk('بوشيط ' + i.name, 1); }
const csGo = (f, id) => { finish(null); setTimeout(() => window[f](id), 450); };
const csGoV = (f, id, vid) => { finish(null); setTimeout(() => window[f](id, vid), 450); };
function csOpen(id) { if (!find(id)) return; CSUP = 0; csSheetR(id); sheetOpen(csClosed); }
function csSheetR(id) {
  const i = find(id); if (!i) return;
  const V0 = csN(i).v || [], md = csx('md'), oc = csOcN(i);
  const rows = V0.map(x => `<div class="cs-vr">${csDot(x, csVSt(i, x), '')}<b>${esc(x.c || 'عام')}${csIsP(x) ? ' <small class="m">متوقف</small>' : ''}${x.mn && md == 2 ? ' ★' : ''}</b>`
    + `<button class="btn s cs-sb" onclick="csS('${i.id}','${x.id}',-1)">−</button><span class="cn">${x.n}</span><button class="btn cs-sb" onclick="csS('${i.id}','${x.id}',1)">+</button><button class="tag" onclick="csVMenu('${i.id}','${x.id}')">⋯</button></div>`).join('')
    || '<p class="m">لا توجد ألوان بعد: اضغط «+ لون».</p>';
  const lt = md == 1 ? `«قارب» عند مجموع ${csLim(i)} فأقل` : md == 2 ? `«قارب» عند ${csLim(i)} فأقل للألوان الأساسية ★ فقط${csHasMain(i) ? '' : ' (لم تُحدَّد: تُحسب كل الألوان)'}` : `«قارب» عند ${csLim(i)} فأقل لكل لون`;
  $('sh').innerHTML = `<div class="bar"></div><h3 data-cs="${i.id}">${esc(csNm(i))}</h3>`
    + `<p class="m">${lt}${i.price ? ' · ' + esc(fmtPr(i.price)) : ''}</p>`
    + (csx('oc') && oc ? `<p class="m">نفد هذا الشهر ${oc} مرات (${Object.entries(i.oc.c).map(([k, n]) => esc(k) + ' ' + n).join('، ')})</p>` : '')
    + rows
    + (i.need ? `<div class="rs row2" style="margin-top:8px;gap:6px"><span class="dotl" style="background:${DT.r}"></span><span style="flex:1">خاصنا: ${esc(i.need)}</span><button class="tag" style="margin:0;color:${DT.r}" onclick="csClrNeed('${i.id}');csSheetR('${i.id}')">× مسح</button></div>` : '')
    + (i.rem ? `<div class="m" style="margin-top:6px"><span class="dotl" style="background:${DT.g}"></span> باقي: ${esc(i.rem)}</div>` : '')
    + `<div class="cs-acts"><button class="btn s" onclick="csAddView('${i.id}')">+ لون</button><button class="btn s" onclick="csGo('csLimEd','${i.id}')">الحد والسعر</button><button class="btn s" onclick="csGo('csQuickNote','${i.id}')">باقي / خاصنا</button><button class="btn s" onclick="csGo('csRen','${i.id}')">تعديل الاسم</button>`
    + (csx('ty') || i.ty ? `<button class="btn s" onclick="csGo('csTypeEd','${i.id}')">النوع${i.ty ? ': ' + esc(i.ty) : ''}</button>` : '')
    + (S.fields.some(f => f.sec == 'case') ? `<button class="btn s" onclick="csGo('csFx','${i.id}')">خانات</button>` : '')
    + `<button class="btn s del" onclick="csGo('csDel','${i.id}')">حذف الموديل</button></div>`
    + `<div class="acts"><button class="btn" onclick="finish(null)">تم</button></div>`;
}
function csC(id, vid, d) {
  const it = find(id), x = it && (it.v || []).find(y => y.id == vid); if (!x) return;
  if (d < 0 && x.n <= 0) return toast('العدد 0 بالفعل');
  csDo(id, (d < 0 ? 'بيع ' : 'إضافة ') + csNm(it) + ' (' + (x.c || 'عام') + ') ' + (d < 0 ? '−1' : '+1'), r => {
    const y = r.v.find(z => z.id == vid), was = y.n;
    y.n = Math.max(0, y.n + d); if (d < 0) csOut(r, y, was); touch(r);
  });
  if (d > 0) reqChk('بوشيط ' + it.name);
  csShR(id);
}
function csS(id, vid, d) { if (d > 0) CSUP = id; csC(id, vid, d); }
/* قائمة اللون ⋯ : إيقاف · أساسي · تصحيح العدد · حذف */
function csVMenu(id, vid) {
  const i = find(id), x = i && (i.v || []).find(y => y.id == vid); if (!x) return;
  CSVMC = SH ? 0 : 1;
  if (!SH) sheetOpen(csClosed);
  const canDel = x.n <= 0 && (can('del') || csx('dc'));
  $('sh').innerHTML = `<div class="bar"></div><h3 data-csm="${i.id}">${esc(csNm(i))} — ${esc(x.c || 'عام')}</h3><p class="m">العدد الآن ${x.n}${csIsP(x) ? ' · موقوف' : ''}</p>`
    + `<button class="btn s" onclick="csStp('${i.id}','${x.id}')">${csIsP(x) ? 'إعادة اللون للشراء' : 'إيقاف شراء هذا اللون (يخرج من التقرير)'}</button>`
    + (csx('md') == 2 ? `<button class="btn s" onclick="csMain('${i.id}','${x.id}')">${x.mn ? 'ليس لوناً أساسياً' : '★ لون أساسي'}</button>` : '')
    + `<button class="btn s" onclick="csGoV('csCnt','${i.id}','${x.id}')">تصحيح العدد</button>`
    + (canDel ? `<button class="btn s del" onclick="csX('${i.id}','${x.id}')">× حذف اللون</button>` : '')
    + `<button class="btn" onclick="csVBack('${i.id}')">رجوع</button>`;
}
const csVBack = id => { if (CSVMC) finish(null); else csSheetR(id); };
function csStp(id, vid) {
  const i = find(id), x = i && (i.v || []).find(y => y.id == vid); if (!x) return;
  const on = !csIsP(x);
  csDo(id, on ? 'أُوقف اللون (يخرج من التقرير ويعود إذا زاد عدده)' : 'أُعيد اللون للشراء', r => {
    const y = r.v.find(z => z.id == vid);
    if (on) { y.stp = 1; y.stpN = y.n; } else { delete y.stp; delete y.stpN; }
    touch(r);
  });
  csVBack(id);
}
function csMain(id, vid) {
  csDo(id, 'تم تحديث اللون الأساسي', r => { const y = r.v.find(z => z.id == vid); if (y.mn) delete y.mn; else y.mn = 1; touch(r); });
  csVBack(id);
}
function csCnt(id, vid) {
  const i = find(id), x = i && (i.v || []).find(y => y.id == vid); if (!x) return;
  ask('تصحيح العدد: ' + csNm(i) + ' — ' + (x.c || 'عام'), [{ k: 'n', l: 'العدد الفعلي الآن (بدل ' + x.n + ')', t: 'number', v: x.n }], 'تصحيح').then(v => {
    if (!v || String(v.n).trim() === '') return;
    const n = ci(v.n), old = x.n; if (n === old) return;
    csDo(id, 'تصحيح العدد: ' + csNm(i) + ' (' + (x.c || 'عام') + ') ← ' + n, r => { const y = r.v.find(z => z.id == vid); y.n = n; csOut(r, y, old); touch(r, 1); });
    if (n > old) reqChk('بوشيط ' + i.name, 1);
  });
}
function csX(id, vid) {
  const r = find(id), x = r && (r.v || []).find(y => y.id == vid); if (!x) return;
  if (!(can('del') || csx('dc'))) return toast('الحذف للمدير فقط');
  if (x.n > 0) return toast('اجعل العدد 0 أولاً');
  csDo(id, 'تم حذف اللون ' + (x.c || 'عام'), r2 => { r2.v = r2.v.filter(y => y.id != vid); touch(r2); });
  csVBack(id);
}
function csDel(id) { const i = find(id); if (i) del('items', id, csNm(i)); }
function csClrNeed(id) {
  const i = find(id); if (!i || !i.need) return;
  commit('تم مسح تنبيه «خاصنا»', () => { i.need = ''; i.by = S.me; });
}
/* ---------- تعديل الاسم (ودمج موديلين مكررين) والنوع ---------- */
function csRen(id) {
  const i = find(id); if (!i) return;
  ask('تعديل اسم الموديل', [{ k: 'n', l: 'اسم الموديل', v: i.name }]).then(v => {
    if (!v) return;
    const n = v.n.trim(); if (!n || n == i.name) return;
    const o = S.items.find(x => x !== i && x.sec == 'case' && nz(x.name) == nz(n) && (x.ty || '') == (i.ty || ''));
    if (!o) return commit('تم تعديل الاسم', () => { i.name = n; touch(i); });
    setTimeout(() => sure('يوجد بوشيط «' + csNm(o) + '» بالفعل. دمجهما في سطر واحد؟ (تُجمع أعداد الألوان)', 'دمج', false).then(y => { if (y) csMergeInto(i.id, o.id); }), 450);
  });
}
function csMergeInto(srcId, dstId) {
  const s = find(srcId), d = find(dstId); if (!s || !d || s === d) return;
  const bd = JSON.stringify(d);
  csN(s); csN(d); d.v = d.v || [];
  (s.v || []).forEach(x => { const y = d.v.find(z => nz(z.c || '') == nz(x.c || '')); if (y) y.n += x.n; else d.v.push({ ...x }); });
  if (!d.price && s.price) d.price = s.price;
  if (!d.code && s.code) d.code = s.code;
  if (!d.need && s.need) d.need = s.need;
  if (!d.rem && s.rem) d.rem = s.rem;
  touch(d, 1);
  const o = S.items.splice(S.items.indexOf(s), 1)[0], t = { id: uid(), coll: 'items', obj: o, label: csNm(o), t: Date.now() };
  S.trash.push(t); save(); render();
  toast('تم الدمج في «' + csNm(d) + '»', () => {
    const dd = find(dstId); if (dd) { Object.keys(dd).forEach(k => delete dd[k]); Object.assign(dd, JSON.parse(bd)); }
    restore(t.id, 1);
  });
}
function csTypeEd(id) {
  const i = find(id); if (!i) return; const T = csTypes();
  $('sh').innerHTML = `<div class="bar"></div><h3>نوع: ${esc(i.name)}</h3>`
    + T.map((t, k) => `<button class="btn s" onclick="csSetTy('${i.id}',${k})">${esc(t)}${i.ty == t ? ' ✓' : ''}</button>`).join('')
    + `<button class="btn s" onclick="csSetTy('${i.id}',-1)">بدون نوع</button><button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(csClosed);
}
function csSetTy(id, k) {
  const i = find(id); if (!i) return; const ty = k < 0 ? '' : csTypes()[k] || '';
  if (S.items.some(x => x !== i && x.sec == 'case' && nz(x.name) == nz(i.name) && (x.ty || '') == ty)) return toast('يوجد موديل بنفس الاسم والنوع');
  finish(null);
  commit('تم تغيير النوع', () => { if (ty) i.ty = ty; else delete i.ty; touch(i); });
}
/* ---------- الإضافة: ابحث أولاً، ثم (النوع) واللون والعدد ---------- */
function csAdd() {
  CQ = ''; CSD = {};
  $('sh').innerHTML = `<div class="bar"></div><h3>إضافة بوشيط</h3><label>ابحث أولاً: موديل الهاتف<input data-sug="mn" oninput="csF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(csClosed); csF('');
}
function csF(q) {
  CQ = q.trim(); const n = nz(q), m = S.items.filter(i => i.sec == 'case' && (!n || nzHit(nz(i.name + ' ' + (i.ty || '')), q, n))).sort((a, b) => b.at - a.at).slice(0, 6);
  $('pr').innerHTML = m.map(i => `<button class="card row2" onclick="csPick('${i.id}')"><b>${esc(csNm(i))}</b><span class="m">${esc(csGSummaryTxt(i))}</span></button>`).join('') + `<button class="btn" onclick="csNew()">+ موديل جديد${CQ ? ' «' + esc(CQ) + '»' : ''}</button>`;
}
function csPick(id) { CSD = { id }; csAddView(id); }
function csNew() {
  if (!CQ) return toast('اكتب اسم الموديل');
  const T = csTypes();
  if (csx('ty') && T.length) {
    $('sh').innerHTML = `<div class="bar"></div><h3>نوع البوشيط — ${esc(CQ)}</h3>`
      + T.map((t, k) => `<button class="btn s" onclick="csNew2(${k})">${esc(t)}</button>`).join('')
      + `<button class="btn s" onclick="csNew2(-1)">بدون نوع</button><button class="btn s" onclick="finish(null)">إلغاء</button>`;
    return;
  }
  csNew2(-1);
}
function csNew2(k) {
  const ty = k < 0 ? '' : csTypes()[k] || '';
  const d = S.items.find(i => i.sec == 'case' && nz(i.name) == nz(CQ) && (i.ty || '') == ty); if (d) return csPick(d.id);
  CSD = { name: CQ, ty }; csAddView(null);
}
function csAddView(id) {
  const i = id ? find(id) : null, nm = i ? csNm(i) : CSD.name + (CSD.ty ? ' · ' + CSD.ty : ''); if (!nm) return;
  fsInit([['color', 'اللون']], {}); FS.sugC = () => colSugCs(id);
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(nm)} — إضافة لون</h3><div id="cc"></div>`
    + `<div class="row2" style="gap:8px"><label style="flex:1">العدد<input id="cq" type="number" value="${i ? 1 : lim('csBuy')}"></label>${i ? '' : `<label style="flex:1">السعر (اختياري)<input id="cpr" type="tel" placeholder="مثال: 30"></label>`}</div>`
    + `<div class="acts"><button class="btn s" onclick="${i ? `csSheetR('${i.id}')` : 'finish(null)'}">${i ? 'رجوع' : 'إلغاء'}</button><button class="btn s" onclick="csAddOk(1)">+ لون آخر</button><button class="btn" onclick="csAddOk(0)">حفظ</button></div>`;
  chipsR();
}
function csAddOk(more) {
  const c = FS.v.color || '', n = ci($('cq').value), pr = $('cpr') ? $('cpr').value.trim() : '';
  let i = CSD.id ? find(CSD.id) : null;
  if (!i && !CSD.name) return;
  if (!c && !csx('ge')) return toast('اختر اللون أولاً');
  if (i && !n) return toast('اكتب عدداً أكبر من 0');
  upd(() => {
    if (!i) {
      const now = Date.now();
      i = { id: uid(), sec: 'case', name: CSD.name, v: [], by: S.me, at: now, cf: now };
      if (CSD.ty) i.ty = CSD.ty;
      if (CSCODE) { i.code = CSCODE; CSCODE = ''; }
      S.items.push(i); CSD = { id: i.id };
    }
    if (pr && can('price')) i.price = pr;
    csN(i); i.v = i.v || [];
    const x = i.v.find(y => nz(y.c || '') == nz(c));
    if (x) x.n += n; else i.v.push({ id: uid(), g: '', c, n });
    touch(i, 1);
  });
  if (n > 0) CSUP = i.id;
  toast('تمت الإضافة');
  if (more) csAddView(i.id); else finish(null);
}
/* ---------- الحد والسعر والملاحظات والخانات ---------- */
function csFx(id) {
  const i = find(id); fsInit([], {}, 'case', i);
  $('sh').innerHTML = '<div class="bar"></div><h3>خانات: ' + esc(i.name) + '</h3><div id="fx"></div><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="finish({})">حفظ</button></div>';
  sheetOpen(v => { if (v) upd(() => { i.x = { ...FS.fx }; i.by = S.me; }); }); fxR();
}
function csLimEd(id) {
  const i = find(id);
  ask('الحد والسعر — بوشيط ' + csNm(i), [
    { k: 'p', l: 'سعر البيع (درهم — اختياري)', t: 'tel', v: i.price || '' },
    { k: 'n', l: `«قارب النفاد» عند عدد فأقل ${csx('md') == 1 ? 'للمجموع' : 'لكل لون'} (فارغ = الحد العام ${lim(csx('md') == 1 ? 'ctl' : 'cl')})`, t: 'tel', v: i.lim ?? '' }
  ]).then(v => {
    if (!v) return; const n = v.n.trim();
    upd(() => {
      if (n === '') delete i.lim; else i.lim = ci(n);
      if (can('price')) i.price = (v.p || '').trim();
      i.by = S.me;
    });
  });
}
function csQuickNote(id) {
  const i = find(id);
  ask('بوشيط ' + csNm(i), [{ k: 'rem', l: 'شنو باقي عندنا فالمحل؟ (مثال: غير الأسود)', v: i.rem || '' }, { k: 'need', l: 'شنو خاص يجيب المعلم؟ (مثال: فضي / كحلي)', v: i.need || '' }]).then(v => { if (v) commit('تم التحديث', () => { i.rem = v.rem.trim(); i.need = v.need.trim(); i.by = S.me; }); });
}
/* ---------- وصول البضاعة من التقرير (✓): خانة رقم لكل لون بلا تخمين ولا إعادة رسم ---------- */
let CSB = { id: '', clN: 0, clR: 0 };
function csBuyTog(w) {
  if (w == 'n') { CSB.clN = CSB.clN ? 0 : 1; const b = $('csb_fn'); if (b) b.classList.toggle('on', !!CSB.clN); }
  else { CSB.clR = CSB.clR ? 0 : 1; const b = $('csb_fr'); if (b) b.classList.toggle('on', !!CSB.clR); }
}
function csBuyAddRow() {
  const box = $('csb_ex'), it = find(CSB.id); if (!box || !it) return;
  const used = new Set((csN(it).v || []).map(x => x.c || ''));
  box.querySelectorAll('.buy-sel').forEach(s => used.add(s.value));
  const cols = [...S.tags.color.filter(c => !used.has(c)), ...S.tags.color.filter(c => used.has(c))];
  const opts = cols.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('') + '<option value="">عام</option>';
  box.insertAdjacentHTML('beforeend', `<div class="buy-row"><select class="buy-sel">${opts}</select><input type="tel" inputmode="numeric" class="buy-inp buy-ninp" placeholder="0"><button type="button" class="rp-xbtn" onclick="this.parentElement.remove()" aria-label="إزالة">${I('close')}</button></div>`);
}
function csBuySave() {
  const adds = [], news = [];
  document.querySelectorAll('#sh .buy-inp[data-vid]').forEach(el => {
    const n = ci(el.value); if (n > 0) adds.push({ vid: el.dataset.vid, n });
  });
  document.querySelectorAll('#csb_ex .buy-row').forEach(r => {
    const sel = r.querySelector('.buy-sel'), inp = r.querySelector('.buy-ninp');
    const n = inp ? ci(inp.value) : 0;
    if (n > 0) news.push({ c: sel ? sel.value : '', n });
  });
  if (!adds.length && !news.length && !CSB.clN && !CSB.clR) return toast('أدخل الكمية التي وصلت للون واحد على الأقل');
  finish({ adds, news, clN: CSB.clN, clR: CSB.clR });
}
function buyC(id) {
  const i = find(id); if (!i) return;
  csN(i);
  const V0 = i.v || [];
  CSB = { id: i.id, clN: 0, clR: 0 };
  const rows = V0.map(x => `<div class="buy-row">${csDot(x, csVSt(i, x), x.n)}<div class="buy-info"><b>${esc(x.c || 'عام')}</b><small class="m">المتوفر: ${x.n}</small></div><input type="tel" inputmode="numeric" class="buy-inp" data-vid="${x.id}" placeholder="0"></div>`).join('')
    || '<p class="m">لا توجد ألوان مسجّلة بعد — اضغط «+ إضافة لون جديد وصل» أدناه.</p>';
  const flags = (i.need || i.rem)
    ? `<div class="buy-flags">`
      + (i.need ? `<button type="button" id="csb_fn" class="tag" onclick="csBuyTog('n')">وصل المطلوب — مسح «خاصنا: ${esc(i.need)}»</button>` : '')
      + (i.rem ? `<button type="button" id="csb_fr" class="tag" onclick="csBuyTog('r')">مسح ملاحظة «باقي: ${esc(i.rem)}»</button>` : '')
      + `</div>`
    : '';
  $('sh').innerHTML = `<div class="bar"></div><h3>وصول بوشيط: ${esc(csNm(i))}</h3>`
    + `<p class="m">اكتب الكمية التي وصلت لكل لون (اترك ما لم يصل فارغاً).</p>`
    + rows + `<div id="csb_ex"></div>`
    + `<button type="button" class="btn s sm" style="margin-top:8px" onclick="csBuyAddRow()">+ إضافة لون جديد وصل</button>`
    + flags
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="csBuySave()">حفظ الوصول</button></div>`;
  sheetOpen(v => {
    if (!v) return;
    const it = find(id); if (!it) return;
    const hadAdd = v.adds.length || v.news.length;
    commit('تم تسجيل وصول بوشيط ' + it.name, () => {
      csN(it); it.v = it.v || [];
      const parts = [];
      v.adds.forEach(({ vid, n }) => { const x = it.v.find(y => y.id == vid); if (x) { x.n += n; parts.push('+' + n + ' ' + (x.c || 'عام')); } });
      v.news.forEach(({ c, n }) => { const x = it.v.find(y => y.c == c); if (x) x.n += n; else it.v.push({ id: uid(), g: '', c, n }); parts.push('+' + n + ' ' + (c || 'عام')); });
      if (v.clN) { it.need = ''; if (!parts.length) parts.push('مسح تنبيه «خاصنا»'); }
      if (v.clR) { it.rem = ''; if (!parts.length) parts.push('مسح ملاحظة «باقي»'); }
      touch(it, 1);
      if (typeof rcLogIn == 'function' && parts.length) rcLogIn('case', it.id, it.id, 'بوشيط ' + it.name, parts.join('، '));
    });
    if (hadAdd) reqChk('بوشيط ' + it.name, 1);
  });
}
/* تحويل البيانات القديمة عند الإقلاع (يُحفظ مع أول حفظ عادي) */
S.items.forEach(i => { if (i.sec == 'case') csN(i); });