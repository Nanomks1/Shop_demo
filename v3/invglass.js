/* ============================================================
   invglass.js — الأنتي كاس: مجموعات الموديلات ومستويات الزجاج (بتصميم متوازن)
   يُحمَّل بعد invphones.js.
   ============================================================ */
/* ============================ الأنتي كاس ============================ */
const gOf = (m, b) => S.gg.find(g => g.models.some(x => nz(x) == nz(m) && glBrOk(g, x, b)));   // الماركة المختلفة = موديل مختلف
/* توافق الماركة: إن غابت ماركة أحد الطرفين فلا يُرفض شيء */
function glBrOk(g, m, brand) {
  const b = (g.br || {})[m]; if (!b || !brand) return true;
  const x = nz(b), y = nz(brand); return x == y || x.includes(y) || y.includes(x);
}
/* مطابقة بكلمات كاملة: الموديل القصير (مثل A1 أو 13) لا يطابق داخل A15 أو 113 */
const gTok = s => String(s || '').split(/[\s\-_]+/).map(nz).filter(Boolean);
const gSeq = (h, n) => { if (!n.length) return false; for (let a = 0; a + n.length <= h.length; a++) if (n.every((x, k) => h[a + k] == x)) return true; return false; };
function gDevHit(dev, m) {
  const nd = nz(dev), nm = nz(m); if (!nd || !nm) return false;
  if (nd.length <= 3 || nm.length <= 3) return gSeq(gTok(dev), gTok(m)) || gSeq(gTok(m), gTok(dev));
  return nd.includes(nm) || nm.includes(nd);
}
/* الماركة المكتوبة في اسم الجهاز لا تناقض ماركة الزجاج */
function glBrDev(g, m, dev) {
  const b = nz((g.br || {})[m] || ''); if (!b) return true;
  const d = nz(dev); if (d.includes(b)) return true;
  const known = new Set([...glBrands(), ...S.items.filter(i => i.sec == 'phones').map(i => i.brand)].map(nz).filter(x => x && x.length >= 3));
  return ![...known].some(k => k != b && d.includes(k));
}
/* نص البحث لموديل: كلمات القسم + أنواعه + ماركته + اسمه (فيعمل «زجاج a15» و«privacy a15») */
const glMH = (g, m) => nz('زجاج انتي كاس glass ' + S.tags.glass.filter(t => gHas(g, m, t)).join(' ') + ' ' + ((g.br || {})[m] || '') + ' ' + m);
const glHit = (g, q, n) => g.models.some(m => nzHit(glMH(g, m), q, n));
const gitem = (gid, ty) => S.items.find(i => i.sec == 'glass' && i.gid == gid && i.ty == ty);
const GT = () => ({ a: lim('gA'), b: lim('gB'), c: lim('gC'), y: lim('gY') });
/* خيارات القسم من إعدادات المدير (st_glx): un تراجع، gs بحث وماركات، rp تفصيل الموديلات في التقرير، ng حالة محايدة لنوع بلا سجل */
const GLXD = { un: 1, gs: 1, rp: 1, ng: 1, nf: 1, sp: 1 };
const glx = k => { const v = (S.cfg.glx || {})[k]; return v === undefined ? GLXD[k] : v; };
const GXL = [['un', 'شريط «تراجع» بعد كل ضغطة (±، مستوى، عدد)'], ['gs', 'بحث وفلتر ماركات داخل القسم'], ['rp', 'تقرير المعلم: ذكر الموديل الناقص داخل المجموعة'], ['ng', 'نوع زجاج بلا سجل يظهر رمادياً «لم يُدخل» بدل الأحمر'], ['nf', 'زر «يحتاج شراء» داخل القسم'], ['sp', 'خيار «إيقاف شراء» لنوع الزجاج في المجموعة (يخرج من التقرير)']];
function glxTog(k) { if (!isAdmin()) return toast('للمدير فقط'); upd(() => { S.cfg.glx = S.cfg.glx || {}; S.cfg.glx[k] = glx(k) ? 0 : 1; }); }
VW.st_glx = () => ({ t: 'خيارات الأنتي كاس', h: '<p class="m">اضغط على الخيار لتشغيله أو إيقافه.</p>' + GXL.map(([k, l]) => row(l, `glxTog('${k}')`, glx(k) ? 'مفعّل ✓' : 'متوقف')).join('') });
DT.n = 'var(--m)'; TX.n = 'لم يُدخل';
const glDo = (label, fn) => glx('un') ? commit(label, fn) : upd(fn);
/* سعر افتراضي لكل نوع زجاج (S.cfg.gpr) يُستعمل حين لا يكون للمجموعة سعر خاص */
const gPr = (i, ty) => (i && i.price) || (S.cfg.gpr || {})[ty || (i && i.ty)] || '';
function glPrEd(j) {
  if (!isAdmin()) return toast('للمدير فقط'); const t = S.tags.glass[j], c = (S.cfg.gpr || {})[t] || '';
  ask('سعر زجاج ' + t, [{ k: 'p', l: 'السعر الافتراضي (درهم). فارغ = بلا سعر افتراضي', t: 'tel', v: c }]).then(v => {
    if (!v) return; const p = dg(v.p).trim();
    upd(() => { S.cfg.gpr = S.cfg.gpr || {}; if (p === '') delete S.cfg.gpr[t]; else S.cfg.gpr[t] = p; });
  });
}
VW.st_glp = () => ({ t: 'أسعار الأنتي كاس', h: '<p class="m">سعر افتراضي لكل نوع زجاج يظهر على كل مجموعة. أي مجموعة لها سعر خاص (زر «الحد والسعر») تبقى بسعرها.</p>' + S.tags.glass.map((t, j) => row(t, `glPrEd(${j})`, (S.cfg.gpr || {})[t] ? fmtPr((S.cfg.gpr || {})[t]) : 'بلا')).join('') });
const lvN = l => l == 'r' ? 0 : (GT()[l] || 0);
const mval = (i, m) => { const l = (i.lv || {})[m]; return l !== undefined ? lvN(l) : ((i.stock || {})[m] || 0); };
/* أنواع الزجاج لكل موديل: g.ty[موديل] = [أنواع]. غير موجود = يُباع بكل الأنواع (بيانات قديمة) */
const gHas = (g, m, ty) => { const a = g.ty && g.ty[m]; return !ty || !a || a.includes(ty); };
const gMods = (g, ty) => g.models.filter(m => gHas(g, m, ty));
const glModsH = ms => ms.map(m => `<bdi>${esc(m)}</bdi>`).join(' / ');
const gShow = (g, ty) => gMods(g, ty).length > 0;
const gFirstTy = g => S.tags.glass.find(t => gShow(g, t)) || S.tags.glass[0];
const gTot = (i, g) => gMods(g, i && i.ty).reduce((a, m) => a + mval(i || {}, m), 0);
const gEst = (i, g) => !!i && gMods(g, i.ty).some(m => (i.lv || {})[m] !== undefined);
function glTySet(g, m, tys) {   // يحفظ أنواع الموديل؛ كل الأنواع = بلا قائمة (يدخل أي نوع جديد لاحقاً)
  const all = S.tags.glass.every(t => tys.includes(t));
  g.ty = g.ty || {};
  if (all) delete g.ty[m]; else g.ty[m] = S.tags.glass.filter(t => tys.includes(t));
  if (!Object.keys(g.ty).length) delete g.ty;
}
const gTyLim = ty => (S.cfg.gtl || {})[ty] ?? lim('gmin');   // مخزَّن بصيغة (أقل من) ويُعرض ناقص 1 ليصبح (فأقل)
const gLim = (i, ty) => (i && i.min) ?? gTyLim(ty || (i && i.ty));
const gSt = (i, g, ty) => { const t = gTot(i, g), m = gLim(i, ty); return t <= 0 ? 'r' : t < m ? 'y' : 'g'; };
const gStop = (i, g) => !!i && !!i.stp && gTot(i, g) <= (+i.stpN || 0);   // موقوف الشراء ما دام المجموع لم يزد
function glGet(gid, ty) { let i = gitem(gid, ty); if (!i) { const now = Date.now(); i = { id: uid(), sec: 'glass', gid, ty, stock: {}, lv: {}, by: S.me, at: now, cf: now }; S.items.push(i); } i.stock = i.stock || {}; return i; }
/* دمج أي سجلات أنتي كاس مكررة لنفس المجموعة والنوع (من المزامنة) وتهيئة السجل الأساسي */
function glDedup() {
  const map = {};
  S.items = S.items.filter(i => {
    if (i.sec != 'glass' || !i.gid || !i.ty) return true;
    const k = i.gid + '|' + i.ty, ex = map[k];
    if (!ex) { map[k] = i; return true; }
    ex.stock = ex.stock || {};
    for (const m in (i.stock || {})) ex.stock[m] = Math.max(ex.stock[m] || 0, i.stock[m]);
    if (i.lv) { ex.lv = ex.lv || {}; Object.assign(ex.lv, i.lv); }
    if (ex.min == null && i.min != null) ex.min = i.min;
    if (!ex.price && i.price) ex.price = i.price;
    ex.at = Math.max(ex.at || 0, i.at || 0);
    ex.cf = Math.max(cfTime(ex), cfTime(i));
    return false;
  });
  if (S.tags && S.tags.glass && S.tags.glass[0]) {
    (S.gg || []).forEach(g => {
      if (g && g.id && !S.tags.glass.some(t => gitem(g.id, t))) glGet(g.id, gFirstTy(g));
    });
  }
}
HK.save.push(glDedup);
glDedup();
const glBrands = () => [...new Set(S.gg.flatMap(g => Object.values(g.br || {})).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const glFlt = g => { const q = V.sq || '', n = nz(q); return !q || glHit(g, q, n); };
const glNeed = (g, ty) => { const i = gitem(g.id, ty); if (gStop(i, g)) return false; const s = i ? gSt(i, g, ty) : (glx('ng') ? 'n' : 'r'); return s == 'r' || s == 'y'; };
function glList(j) {
  const ty = S.tags.glass[j], it = g => gitem(g.id, ty);
  let a = srt(S.gg.filter(g => gShow(g, ty) && glFlt(g)), 'glass', g => gMods(g, ty)[0] || '', g => { const i = it(g); return i ? gTot(i, g) : 0; }, g => { const i = it(g); return i ? i.at : 0; });
  if (V.gf && glx('nf')) a = a.filter(g => glNeed(g, ty));
  const pg = pgSlice('gl' + j, a, 30), f = V.sq || (V.gf && glx('nf'));
  return pg.items.map(g => glCard(g, j)).join('') + pg.more || emptyBox(f ? 'لا نتائج' : 'لا توجد مجموعات أنتي كاس بعد', f ? 'جرّب كلمة أخرى أو ألغِ الفلتر' : 'اضغط على زر «+» في الأعلى لبدء أول مجموعة');
}
function glView() {
  const j = V.ty || 0, ty = S.tags.glass[j];
  const nfN = glx('nf') ? S.gg.filter(g => gShow(g, ty) && glNeed(g, ty)).length : 0;
  const tagsHtml = S.tags.glass.map((t, k) => `<button class="tag ${k == j ? 'on' : ''}" onclick="V.ty=${k};render()">${esc(t)}</button>`).join('')
    + (glx('nf') ? `<button class="tag ${V.gf ? 'on' : ''}" onclick="V.gf=V.gf?0:1;render()">يحتاج شراء (${nfN})</button>` : '');
  return {
    t: 'الأنتي كاس',
    h: secAdd('glAdd()', 'موديل') + secPanel('glass', tagsHtml) + `<div id="slist">${glList(j)}</div>`
  };
}
function glRow(g, i, j, k, m, single) {
  const lv = (i.lv || {})[m], ex = lv === undefined && (i.stock || {})[m] !== undefined, T = GT(), br = (g.br || {})[m];
  const dots = [['a', `<bdi class="ltr">${T.a}+</bdi>`], ['b', `<bdi class="ltr">${T.b}+</bdi>`], ['c', `<bdi class="ltr">${T.c}+</bdi>`], ['y', 'قليل'], ['r', 'نفد']].map(([l, t]) => `<button class="lvb lv-${l} ${lv == l ? 'on' : ''}" onclick="glLv('${g.id}',${j},${k},'${l}')">${t}</button>`).join('');
  const hd2 = ex
    ? `<div class="row2 gl-cnt"><button class="btn s sm" onclick="glC('${g.id}',${j},${k},-1)">−</button><span class="cn">${i.stock[m]}</span><button class="btn sm" onclick="glC('${g.id}',${j},${k},1)">+</button></div>`
    : `<button class="gm-cnt-btn" onclick="glEx('${g.id}',${j},${k})">${lv !== undefined && lv != 'r' && !single ? `<bdi class="ltr">≈${lvN(lv)}</bdi> · ` : ''}أدخل العدد</button>`;
  if (single && !ex) {
    return `<div class="lvs gl-single">${dots}<button class="lvb gl-hash" onclick="glEx('${g.id}',${j},${k})">#</button></div>`;
  }
  return `<div class="gm"><div class="gm-head"><span><b><bdi>${esc(m)}</bdi></b>${br ? ` <span class="m">· <bdi>${esc(br)}</bdi></span>` : ''}</span>${hd2}</div><div class="lvs">${dots}</div></div>`;
}
function glCard(g, j) {
  const ty = S.tags.glass[j], i0 = gitem(g.id, ty), i = i0 || { stock: {}, ty }, none = !i0 && glx('ng'), s = none ? 'n' : gSt(i, g, ty), min = gLim(i, ty);
  const L = g.models.map((m, k) => [m, k]).filter(x => gHas(g, x[0], ty));
  const ex = EXP['g_' + g.id], limM = !ex && L.length > 4 ? L.slice(0, 3) : L;
  const more = L.length > 4 ? `<button class="tag gl-moreb" onclick="toggleExp('g_${g.id}')">${ex ? 'طيّ القائمة ▴' : 'عرض باقي الموديلات (+' + (L.length - 3) + ') ▾'}</button>` : '';
  const single = L.length === 1, br0 = single ? (g.br || {})[L[0][0]] : '';
  return cardH(
    `<div class="gl-head"><div class="gl-title" onclick="glOpen('${g.id}',${j})"><b>${glModsH(L.map(x => x[0]))}${br0 ? ` <span class="m gl-br">· <bdi>${esc(br0)}</bdi></span>` : ''}</b><div class="gl-meta"><span class="dotl" style="background:${DT[s]}"></span><span>${gStop(i0, g) ? '<span class="phk c">متوقف</span> ' : ''}${none ? 'لم يُدخل بعد — اختر مستوى أو عدداً' : `المجموع <bdi class="ltr">${gEst(i, g) ? '≈' : ''}${gTot(i, g)}</bdi> · الحد: <bdi class="ltr">${min - 1}</bdi>${i.min != null ? ' (خاص)' : ''}`}</span></div></div><div class="row2" style="gap:6px">${gPr(i, ty) ? prBadge(gPr(i, ty)) : ''}<button class="gl-more" onclick="glOpen('${g.id}',${j})" aria-label="خيارات المجموعة">⋯</button></div></div>`
    + limM.map(([m, k]) => glRow(g, i, j, k, m, single)).join('') + more,
    colG(g), 'cmp'
  );
}
/* نافذة خيارات مجموعة الأنتي كاس */
function glOpen(gid, j) {
  const g = S.gg.find(x => x.id == gid); if (!g) return;
  const ty = S.tags.glass[j], i = gitem(gid, ty) || {}, min = gLim(i, ty), vm = gMods(g, ty);
  const goAct = fn => { finish(null); setTimeout(fn, 380); };
  $('sh').innerHTML = `<div class="bar"></div><h3>${glModsH(vm)}</h3>`
    + `<p class="m">نوع الزجاج: ${esc(ty)}${gPr(i, ty) ? ' · السعر: ' + esc(fmtPr(gPr(i, ty))) : ''} · «قارب» عند ${min - 1} فأقل</p>`
    + `<div class="cs-acts">`
    + `<button class="btn s" onclick="finish(1)">+ موديل مطابق</button>`
    + `<button class="btn s" onclick="finish(2)">الحد والسعر</button>`
    + `<button class="btn s" onclick="finish(7)">تعديل الاسم / الماركة</button>`
    + (vm.length === 1 ? `<button class="btn s" onclick="finish(3)">إدخال عدد دقيق</button>` : '')
    + (S.tags.glass.length > 1 ? `<button class="btn s" onclick="finish(5)">أنواع الزجاج للموديلات</button>` : '')
    + (glx('sp') ? `<button class="btn s" onclick="finish(6)">${gStop(i, g) ? 'إعادة النوع للشراء' : 'إيقاف شراء هذا النوع'}</button>` : '')
    + (can('del') ? `<button class="btn s del" onclick="finish(4)">حذف موديل من المجموعة</button>` : '')
    + `</div><div class="acts"><button class="btn" onclick="finish(null)">إغلاق</button></div>`;
  sheetOpen(w => {
    if (w == 1) goAct(() => glM(gid));
    else if (w == 2) goAct(() => glMin(gid, j));
    else if (w == 3) goAct(() => glEx(gid, j, g.models.indexOf(vm[0])));
    else if (w == 5) goAct(() => glTyEdit(gid));
    else if (w == 6) goAct(() => glStp(gid, j));
    else if (w == 7) goAct(() => glEd(gid, j));
    else if (w == 4) goAct(() => glRm(gid));
  });
}
function glGoS(gid, j, k) { const g = S.gg.find(x => x.id == gid), m = g && g.models[k]; go('sec', { k: 'glass', ty: j, ...(glx('gs') && m ? { sq: m } : {}) }); }
function glB(g) {   // بطاقة نتيجة البحث: كل أنواع الزجاج للمجموعة مع السعر الواضح؛ الضغط يفتح القسم على الموديل
  const q = typeof Q == 'string' ? Q : '', n = nz(q), k0 = Math.max(0, q ? g.models.findIndex(m => nzHit(glMH(g, m), q, n)) : 0), tys = S.tags.glass.filter(t => gShow(g, t));
  return cardH(`<div onclick="glGoS('${g.id}',${Math.max(0, S.tags.glass.indexOf(tys[0]))},${k0})"><b>زجاج يطابق: ${glModsH(g.models)}</b>` + tys.map(t => {
    const j = S.tags.glass.indexOf(t), i = gitem(g.id, t), s = i ? gSt(i, g, t) : glx('ng') ? 'n' : 'r', pr = gPr(i, t) ? prBadge(gPr(i, t)) : '';
    return `<div class="row2 gl-trow" onclick="event.stopPropagation();glGoS('${g.id}',${j},${k0})"><span class="dotl" style="background:${DT[s]}"></span><span class="f1">${esc(t)}</span>${pr}<span class="m"><bdi class="ltr">${i ? (gEst(i, g) ? '≈' : '') + gTot(i, g) : '—'}</bdi></span></div>`;
  }).join('') + '</div>', colG(g));
}
const glReqT = (g, m) => 'أنتي كاس ' + (((g.br || {})[m]) ? g.br[m] + ' ' : '') + m;   // اسم السلعة لتنبيه طلب الزبون مع الماركة
function glC(gid, j, k, d) { const m = S.gg.find(x => x.id == gid).models[k], ty = S.tags.glass[j]; if (d < 0) { const it0 = gitem(gid, ty); if (!(it0 && it0.stock && it0.stock[m] > 0)) return toast('العدد 0 بالفعل'); } glDo((d < 0 ? 'بيع ' : 'إضافة ') + m + (d < 0 ? ' (−1)' : ' (+1)'), () => { const i = glGet(gid, ty); i.stock[m] = Math.max(0, (i.stock[m] || 0) + d); touch(i, jlAutoCf()); }); if (d > 0) reqChk(glReqT(S.gg.find(x => x.id == gid), m)); }
function glLv(gid, j, k, l) { const m = S.gg.find(x => x.id == gid).models[k], ty = S.tags.glass[j]; glDo('تم: ' + (l == 'r' ? 'نفد' : l == 'y' ? 'قليل' : lvN(l) + '+') + ' — ' + m, () => { const i = glGet(gid, ty); i.lv = i.lv || {}; i.lv[m] = l; delete i.stock[m]; touch(i, 1); }); if (l != 'r') reqChk(glReqT(S.gg.find(x => x.id == gid), m)); }
function glEx(gid, j, k) {
  const m = S.gg.find(x => x.id == gid).models[k], i0 = gitem(gid, S.tags.glass[j]) || {};
  ask('عدد دقيق — ' + m, [{ k: 'n', l: 'العدد', t: 'tel', v: mval(i0, m) }]).then(v => { if (!v || v.n.trim() === '') return; glDo('تم تحديث العدد — ' + m, () => { const i = glGet(gid, S.tags.glass[j]); i.stock[m] = ci(v.n); if (i.lv) delete i.lv[m]; touch(i, 1); }); });
}
/* تعديل اسم الموديل أو ماركته مع نقل مخزونه ومستوياته وأنواعه */
function glRename(g, m, n, b) {
  const k = g.models.indexOf(m); if (k < 0) return;
  g.models[k] = n;
  if (n != m) {
    if (g.br && m in g.br) { g.br[n] = g.br[m]; delete g.br[m]; }
    if (g.ty && g.ty[m]) { g.ty[n] = g.ty[m]; delete g.ty[m]; }
    S.items.filter(i => i.sec == 'glass' && i.gid == g.id).forEach(i => {
      if (i.stock && m in i.stock) { i.stock[n] = i.stock[m]; delete i.stock[m]; }
      if (i.lv && m in i.lv) { i.lv[n] = i.lv[m]; delete i.lv[m]; }
      touch(i);
    });
  }
  g.br = g.br || {}; if (b) g.br[n] = b; else delete g.br[n];
  if (!Object.keys(g.br).length) delete g.br;
}
function glEd(gid, j) {
  const g = S.gg.find(x => x.id == gid); if (!g) return;
  const pick = g.models.length > 1 ? ask('تعديل موديل', [{ k: 'm', l: 'أي موديل؟', t: 'sel', o: g.models, v: gMods(g, S.tags.glass[j])[0] || g.models[0] }], 'التالي') : Promise.resolve({ m: g.models[0] });
  pick.then(p => {
    if (!p) return; const m = p.m;
    ask('تعديل «' + m + '»', [{ k: 'n', l: 'اسم الموديل', v: m }, { k: 'b', l: 'الماركة (فارغ = بدون ماركة)', v: (g.br || {})[m] || '' }]).then(v => {
      if (!v) return; const n = v.n.trim(), b = v.b.trim();
      if (!n) return toast('اكتب اسم الموديل');
      const o = gOf(n, b); if (o && !(o.id == gid && nz(n) == nz(m))) return toast('يوجد موديل بهذا الاسم والماركة');
      glDo('تم تعديل «' + m + '»', () => glRename(g, m, n, b));
    });
  });
}
function glStp(gid, j) {
  const g = S.gg.find(x => x.id == gid), ty = S.tags.glass[j]; if (!g || !ty) return;
  const i0 = gitem(gid, ty), on = !gStop(i0, g), n = i0 ? gTot(i0, g) : 0;
  glDo(on ? 'أُوقف شراء ' + ty + ' (يخرج من التقرير)' : 'أُعيد ' + ty + ' للشراء', () => { const i = glGet(gid, ty); if (on) { i.stp = 1; i.stpN = n; } else { delete i.stp; delete i.stpN; } touch(i); });
}
function glMin(gid, j) {
  const ty = S.tags.glass[j], i = gitem(gid, ty) || {};
  ask('الحد والسعر — ' + ty, [{ k: 'p', l: 'سعر البيع (درهم)' + ((S.cfg.gpr || {})[ty] ? ' — فارغ = سعر النوع ' + (S.cfg.gpr || {})[ty] : ''), t: 'tel', v: i.price || '' }, { k: 'm', l: `حد خاص بهذه المجموعة: «قارب النفاد» عند مجموع فأقل (فارغ = حد ${ty}: ${gTyLim(ty) - 1}). اكتب 0 إن كانت نادرة`, t: 'tel', v: i.min != null ? i.min - 1 : '' }]).then(v => {
    if (!v) return; const r = glGet(gid, ty), m = v.m.trim();
    glDo('تم حفظ الحد والسعر', () => { if (m === '') delete r.min; else r.min = ci(m) + 1; if (can('price')) r.price = v.p.trim(); r.by = S.me; });
  });
}
const clrM = (n, gid) => S.items.forEach(i => { if (i.sec == 'glass' && i.gid == gid && i.lv) delete i.lv[n]; });   // داخل المجموعة فقط: الاسم نفسه بماركة أخرى لا يُمسّ
let GS = {};
const glBrHid = b => !!(S.cfg.nsb || {})[b];   // ماركات أخفاها المدير من قائمة الأنتي كاس (هواتف صغيرة غير ذكية)
function glTyR() {
  const b = $('gty'); if (!b) return;
  b.innerHTML = S.tags.glass.length < 2 ? '' : `<label>أنواع الزجاج لهذا الموديل</label><div>${S.tags.glass.map((t, k) => `<button type="button" class="tag ${GS.t.includes(t) ? 'on' : ''}" onclick="glTyT(${k})">${esc(t)}</button>`).join('')}</div>`;
}
function glTyT(k) { const t = S.tags.glass[k]; GS.t = GS.t.includes(t) ? GS.t.filter(x => x != t) : [...GS.t, t]; glTyR(); }
const glTyNow = () => [S.tags.glass[V.ty || 0] || S.tags.glass[0]].filter(Boolean);
function glAdd() {
  GS = { t: glTyNow() }; fsInit([['brand', 'الماركة']], {}); FS.hid = { brand: glBrHid };
  $('sh').innerHTML = `<div class="bar"></div><h3>موديل جديد</h3>${invModelDatalist()}<div id="cc"></div><label>اسم الموديل<input id="gn" data-sug="mn" placeholder="مثال: A15"></label><div id="gty"></div><button class="btn" onclick="glNext()">التالي</button>`;
  sheetOpen(() => { }); chipsR(); glTyR();
}
function glNext() {
  const n = $('gn').value.trim(); if (!n) return; if (!GS.t.length) return toast('اختر نوع زجاج واحداً على الأقل');
  const o = gOf(n, FS.v.brand || '');
  if (o) {   // الموديل مسجل: إن كان ينقصه النوع المختار نعرض تفعيله بدل الرفض
    const mm = o.models.find(x => nz(x) == nz(n)), miss = GS.t.filter(x => !gHas(o, mm, x));
    if (!miss.length) return toast('هذا الموديل مسجل بهذه الأنواع');
    return sure('«' + mm + '» مسجل لكنه غير مفعّل لنوع: ' + miss.join('، ') + '. تفعيله الآن؟', 'تفعيل', false).then(y => {
      if (!y) return;
      glDo('تم تفعيل ' + miss.join('، ') + ' للموديل ' + mm, () => { glTySet(o, mm, [...S.tags.glass.filter(x => gHas(o, mm, x)), ...miss]); glGet(o.id, miss[0]); });
      finish(null);
    });
  }
  GS.n = n; GS.b = FS.v.brand || '';
  $('sh').innerHTML = `<div class="bar"></div><h3>«${esc(n)}» يطابق أي موديل؟</h3><label>ابحث بين الموديلات<input oninput="glS(this.value)"></label><div id="gl"></div><button class="btn s" onclick="glNew()">لا يطابق شيئاً (مجموعة جديدة)</button>`; glS('');
}
function glS(q) {
  const k = nz(q);
  $('gl').innerHTML = S.gg.flatMap(g => g.models.map(m => ({ g, m }))).filter(x => !k || nzHit(nz(x.m), q, k)).slice(0, 8).map(x => `<button class="card row2" onclick="glJoin('${x.g.id}')"><b>${esc(x.m)}</b><span class="m">${x.g.models.length} موديلات</span></button>`).join('');
}
function glJoin(gid) { const g = S.gg.find(x => x.id == gid); glDo('تم ضم «' + GS.n + '» للمجموعة', () => { clrM(GS.n, gid); g.models.push(GS.n); glTySet(g, GS.n, GS.t); if (GS.b) { g.br = g.br || {}; g.br[GS.n] = GS.b; } }); finish(null); reqChk(glReqT({ br: { [GS.n]: GS.b } }, GS.n), 1); }
function glNew() {
  glDo('تمت إضافة «' + GS.n + '»', () => {
    const g = { id: uid(), models: [GS.n] };
    if (GS.b) g.br = { [GS.n]: GS.b };
    glTySet(g, GS.n, GS.t);
    S.gg.push(g);
    const ty = GS.t[0] || gFirstTy(g);
    if (ty) glGet(g.id, ty);
  });
  finish(null); reqChk(glReqT({ br: { [GS.n]: GS.b } }, GS.n), 1);
}
function glM(gid) {
  const g = S.gg.find(x => x.id == gid); GS = { t: glTyNow() }; fsInit([['brand', 'الماركة (اختياري)']], {}); FS.hid = { brand: glBrHid };
  $('sh').innerHTML = `<div class="bar"></div><h3>موديل مطابق</h3>${invModelDatalist()}<div id="cc"></div><label>الاسم<input id="gmn" data-sug="mn"></label><div id="gty"></div><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="glMOk()">حفظ</button></div>`;
  sheetOpen(v => {
    if (!v || !v.n) return; const n = v.n, o = gOf(n, v.b); if (o && o.id == gid) return toast('موجود في المجموعة');
    const add = () => { clrM(n, gid); g.models.push(n); glTySet(g, n, v.t || S.tags.glass); if (v.b) { g.br = g.br || {}; g.br[n] = v.b; } };
    if (!o) { glDo('تمت إضافة «' + n + '» للمجموعة', add); reqChk(glReqT({ br: { [n]: v.b } }, n), 1); return; }
    sure('«' + n + '» في مجموعة أخرى. دمج المجموعتين؟', 'دمج', false).then(y => { if (y) glDo('تم دمج المجموعتين', () => glMerge(g, o)); });
  });
  chipsR(); glTyR();
}
function glMOk() {
  if (!GS.t.length) return toast('اختر نوع زجاج واحداً على الأقل');
  finish({ n: $('gmn').value.trim(), b: FS.v.brand || '', t: GS.t.slice() });
}
function glMerge(a, b) {   // دمج المجموعة b في a: الأعداد تُجمع، والمستويات والحد والسعر لا تضيع
  S.items = S.items.filter(i => {
    if (i.sec != 'glass' || i.gid != b.id) return true;
    const t = gitem(a.id, i.ty); if (!t) { i.gid = a.id; return true; }
    t.stock = t.stock || {}; for (const m in (i.stock || {})) t.stock[m] = (t.stock[m] || 0) + i.stock[m];
    if (i.lv) { t.lv = t.lv || {}; Object.assign(t.lv, i.lv); }
    if (t.min == null && i.min != null) t.min = i.min; if (!t.price && i.price) t.price = i.price; return false;
  });
  b.models.forEach(m => a.models.push(m)); if (b.br) a.br = Object.assign(a.br || {}, b.br); if (b.ty) a.ty = Object.assign(a.ty || {}, b.ty);
  S.gg = S.gg.filter(x => x != b);
}
function glRm(gid) {
  if (!can('del')) return toast('الحذف للمدير فقط');
  const g = S.gg.find(x => x.id == gid);
  ask('حذف موديل من المجموعة', [{ k: 'm', l: 'الموديل', t: 'sel', o: g.models, v: g.models[0] }], 'حذف', true).then(v => {
    if (!v) return; if (!can('del')) return toast('الحذف للمدير فقط');
    sure('حذف «' + v.m + '» ؟').then(y => {
      if (!y) return;
      commit('تم حذف الموديل', () => {
        const oldItems = S.items.filter(i => i.sec == 'glass' && i.gid == gid).map(i => JSON.parse(JSON.stringify(i))), tyM = g.ty && g.ty[v.m], brM = g.br && g.br[v.m];
        g.models = g.models.filter(m => m != v.m); if (g.br) delete g.br[v.m]; if (g.ty) { delete g.ty[v.m]; if (!Object.keys(g.ty).length) delete g.ty; }
        S.items.filter(i => i.sec == 'glass' && i.gid == gid).forEach(i => { delete (i.stock || {})[v.m]; if (i.lv) delete i.lv[v.m]; });
        const now = Date.now(), last = !g.models.length, nid = last ? gid : uid();
        const its = last ? oldItems : oldItems.map(it => ({ ...it, id: uid(), gid: nid, stock: it.stock && it.stock[v.m] !== undefined ? { [v.m]: it.stock[v.m] } : {}, lv: it.lv && it.lv[v.m] ? { [v.m]: it.lv[v.m] } : undefined })).filter(it => Object.keys(it.stock).length || it.lv);
        S.trash.push({ id: uid(), coll: 'gg', obj: { ...g, id: nid, models: [v.m], br: brM ? { [v.m]: brM } : undefined, ty: tyM ? { [v.m]: tyM } : undefined, _it: its }, label: 'أنتي كاس: ' + v.m + (last ? ' (مع مخزونه)' : ' (من مجموعة)'), t: now });
        if (last) { S.gg = S.gg.filter(x => x != g); S.items = S.items.filter(i => !(i.sec == 'glass' && i.gid == gid)); }
      });
    });
  });
}
const gl2 = i => { const g = S.gg.find(x => x.id == i.gid); return g ? `<div class="card"><b>زجاج <bdi>${esc(i.ty)}</bdi>: ${glModsH(gMods(g, i.ty))}</b><div class="m">المجموع <bdi class="ltr">${gEst(i, g) ? '≈' : ''}${gTot(i, g)}</bdi> · آخر تأكيد ${agoTxt(cfTime(i))}</div></div>` : ''; };
/* وصول الأنتي كاس من التقرير (✓): كمية أو مستوى لكل موديل دون مسح بقية الموديلات */
let GLB = { gid: '', ty: '', ms: [], lv: {} };
function glBuyIn(k) {
  if (GLB.lv[k]) {
    GLB.lv[k] = '';
    document.querySelectorAll(`#sh .lvb[data-gk="${k}"]`).forEach(b => b.classList.remove('on'));
  }
}
function glBuyLv(k, l) {
  GLB.lv[k] = GLB.lv[k] == l ? '' : l;
  const inp = document.querySelector(`#sh .buy-inp[data-gk="${k}"]`);
  if (GLB.lv[k] && inp) inp.value = '';
  document.querySelectorAll(`#sh .lvb[data-gk="${k}"]`).forEach(b => b.classList.toggle('on', b.dataset.lv == GLB.lv[k]));
}
function glBuySave() {
  const chg = [];
  GLB.ms.forEach((m, k) => {
    const inp = document.querySelector(`#sh .buy-inp[data-gk="${k}"]`), n = inp ? ci(inp.value) : 0, l = GLB.lv[k] || '';
    if (n > 0) chg.push({ m, n });
    else if (l) chg.push({ m, l });
  });
  if (!chg.length) return toast('أدخل كمية وصلت أو اختر مستوى لموديل واحد على الأقل');
  finish(chg);
}
function buyG(id, j) {
  const i0 = find(id), g = i0 ? S.gg.find(x => x.id == i0.gid) : S.gg.find(x => x.id == id);
  if (!g) return;
  const ty = i0 ? i0.ty : ((j != null && S.tags.glass[j]) || gFirstTy(g) || 'عادي'), cur = i0 || { stock: {}, lv: {}, ty }, ms = gMods(g, ty), T = GT();
  GLB = { gid: g.id, ty, ms, lv: {} };
  const rows = ms.map((m, k) => {
    const lv0 = (cur.lv || {})[m], curN = mval(cur, m);
    const curTxt = lv0 !== undefined ? (lv0 == 'r' ? 'نفد' : '≈' + curN) : String(curN);
    const lvs = [['a', `<bdi class="ltr">${T.a}+</bdi>`], ['b', `<bdi class="ltr">${T.b}+</bdi>`], ['c', `<bdi class="ltr">${T.c}+</bdi>`], ['y', 'قليل']].map(([l, lb]) => `<button type="button" class="lvb lv-${l}" data-gk="${k}" data-lv="${l}" onclick="glBuyLv(${k},'${l}')">${lb}</button>`).join('');
    return `<div class="gm"><div class="buy-row"><div class="buy-info"><b><bdi>${esc(m)}</bdi></b><small class="m">الحالي: <bdi class="ltr">${curTxt}</bdi></small></div><input type="tel" inputmode="numeric" class="buy-inp" data-gk="${k}" placeholder="كمية وصلت" oninput="glBuyIn(${k})"></div><div class="lvs">${lvs}</div></div>`;
  }).join('');
  $('sh').innerHTML = `<div class="bar"></div><h3>وصول أنتي كاس (${esc(ty)})</h3>`
    + `<p class="m">اكتب الكمية التي وصلت (تُضاف للمتوفر) أو اختر المستوى الجديد للموديل الذي وصل فقط — بقية الموديلات لا تتغير.</p>`
    + rows
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="glBuySave()">حفظ الوصول</button></div>`;
  sheetOpen(chg => {
    if (!chg || !chg.length) return;
    const lvLbl = { a: T.a + '+', b: T.b + '+', c: T.c + '+', y: 'قليل' };
    commit('تم تسجيل وصول أنتي كاس ' + ty, () => {
      const r = glGet(g.id, ty), parts = [];
      r.stock = r.stock || {}; r.lv = r.lv || {};
      chg.forEach(x => {
        if (x.n > 0) { r.stock[x.m] = mval(r, x.m) + x.n; delete r.lv[x.m]; parts.push(x.m + ' +' + x.n); }
        else if (x.l) { r.lv[x.m] = x.l; delete r.stock[x.m]; parts.push(x.m + ' ← ' + (lvLbl[x.l] || x.l)); }
      });
      touch(r, 1);
      if (typeof rcLogIn == 'function' && parts.length) rcLogIn('glass', g.id + '|' + ty, g.id + '|' + ty, 'أنتي كاس ' + ty + ': ' + ms.join(' / '), parts.join('، '));
    });
    reqChk(ms.join(' '), 1);
  });
}
/* نافذة أنواع الزجاج لكل موديل داخل المجموعة */
let GE = null;
function glTyEdit(gid) {
  const g = S.gg.find(x => x.id == gid); if (!g) return;
  GE = { gid, m: Object.fromEntries(g.models.map(m => [m, S.tags.glass.filter(t => gHas(g, m, t))])) };
  $('sh').innerHTML = `<div class="bar"></div><h3>أنواع الزجاج لكل موديل</h3><p class="m">الأزرق = يُباع بهذا النوع. الموديل لا يظهر إلا في الأنواع المختارة.</p>`
    + g.models.map((m, a) => `<label><bdi>${esc(m)}</bdi></label><div>${S.tags.glass.map((t, k) => `<button type="button" class="tag ${GE.m[m].includes(t) ? 'on' : ''}" onclick="glTyEdT(this,${a},${k})">${esc(t)}</button>`).join('')}</div>`).join('')
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="glTyEdOk()">حفظ</button></div>`;
  sheetOpen(glTyEdDone);
}
function glTyEdT(el, a, k) {
  const g = S.gg.find(x => x.id == GE.gid), m = g.models[a], t = S.tags.glass[k];
  GE.m[m] = GE.m[m].includes(t) ? GE.m[m].filter(x => x != t) : [...GE.m[m], t];
  el.classList.toggle('on', GE.m[m].includes(t));
}
function glTyEdOk() {
  if (Object.values(GE.m).some(a => !a.length)) return toast('كل موديل يحتاج نوع زجاج واحداً على الأقل');
  finish(GE.m);
}
function glTyEdDone(m) {
  if (!m) return; const g = S.gg.find(x => x.id == GE.gid); if (!g) return;
  const lost = [];   // أنواع أُزيلت من موديل وفيها مخزون
  g.models.forEach(x => S.tags.glass.forEach(t => {
    if (gHas(g, x, t) && !(m[x] || []).includes(t)) { const i = gitem(g.id, t); if (i && mval(i, x) > 0) lost.push(x + ' (' + t + ')'); }
  }));
  const apply = () => glDo('تم تحديث أنواع الزجاج', () => {
    g.models.forEach(x => {
      glTySet(g, x, m[x] || S.tags.glass);
      S.tags.glass.forEach(t => { if ((m[x] || []).includes(t)) return; const i = gitem(g.id, t); if (i) { if (i.stock) delete i.stock[x]; if (i.lv) delete i.lv[x]; } });
    });
  });
  if (lost.length) sure('سيُحذف مخزون: ' + lost.join('، ') + ' — متابعة؟', 'حفظ', true).then(y => { if (y) apply(); }); else apply();
}
/* تفصيل الموديلات الناقصة داخل المجموعة لسطر تقرير المعلم */
function glBrk(i, g, ty) {
  const ms = gMods(g, ty); if (ms.length < 2) return '';
  const out = ms.filter(m => mval(i, m) <= 0), low = ms.filter(m => mval(i, m) > 0 && mval(i, m) <= lim('gY'));
  const p = []; if (out.length) p.push('نفد: ' + out.join('، ')); if (low.length) p.push('قليل: ' + low.join('، '));
  return p.length ? ' (' + p.join(' · ') + ')' : '';
}