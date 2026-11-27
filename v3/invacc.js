/* ============================================================
   invacc.js — الإكسسوارات ومجموعات الكابلات والشواحن (تصميم السطر الواحد المرن)
   يُحمَّل بعد invpochette.js.
   ============================================================ */
/* ============================ الإكسسوارات ============================ */
const DKC = { 'كابل': { conn: 1 }, 'شاحن': { conn: 1 } }, DK = { 'كابل': { g: 1, w: 0 }, 'شاحن': { g: 1, w: 1 }, 'رأس شاحن': { g: 1, w: 1 } };
const kc = k => ({ conn: 0, tier: 1, ...(DKC[k] || {}), ...((S.cfg.kc || {})[k] || {}) });
const gkc = k => ({ g: 0, w: 0, ...(DK[k] || {}), ...((S.cfg.gkc || {})[k] || {}) });
const fxIn = i => S.fields.filter(f => f.sec == 'acc').map(f => fxVal(i, f).join(' ')).filter(Boolean).join(' ');
const xSig = o => S.fields.filter(f => f.sec == 'acc').map(f => fxVal(o, f).slice().sort().join('+')).join('|');
const acName = i => [i.kind, i.conn, fxIn(i), i.name, i.pw, i.tier && 'فئة ' + i.tier, i.brand].filter(Boolean).join(' ');
const acTitle = i => [i.kind, i.conn, fxIn(i), i.name, i.brand].filter(Boolean).join(' ');
const acLim = i => i.lim ?? kc(i.kind).lim ?? lim('acl');
const acSt = i => typeof i.cnt == 'number' ? (i.cnt <= 0 ? 'r' : i.cnt <= acLim(i) ? 'y' : 'g') : i.st;
const ALB = { g: 'متوفر', y: 'قارب', r: 'نفد' };
/* تنبيه «زبون سأل عنها» يُؤجَّل إلى ما بعد إغلاق النافذة (reqChk يتجاهله والنافذة مفتوحة) */
const agTxt = d => [d.kind, d.conn, d.pw, d.tier, ...d.mem.map(i => [i.brand, fxIn(i), i.note].filter(Boolean).join(' '))].filter(Boolean).join(' ');
const acStale = t => !!t && Date.now() - t > lim('stale') * 864e5;
const acTierTxt = i => i.tier && String(i.price || '') !== String(i.tier) ? 'فئة ' + i.tier : '';
/* ---- خيارات القسم القابلة للتشغيل/الإيقاف من إعدادات المدير (صفحة st_acx) ---- */
const ACXD = { tr: 1, sb: 1, so: 1, gp: 1, oc: 1, dpb: 0 };
const acx = k => { const v = (S.cfg.acx || {})[k]; return v === undefined ? ACXD[k] : v; };
const AXL = [
  ['tr', 'الفئة إجبارية للكابل والشاحن عند الإضافة'],
  ['sb', 'تنبيه «⚠ غير مؤكد» على البطاقات'],
  ['so', 'ترتيب القائمة بالحالة أولاً (أحمر ← برتقالي ← أخضر)'],
  ['gp', 'أزرار −/+ على بطاقة المجموعة (عند وجود مجموع رقمي)'],
  ['oc', 'عدّاد «نفد X مرات هذا الشهر»'],
  ['dpb', 'منع الصنف المكرر بدل التنبيه']
];
function acxTog(k) { if (!isAdmin()) return toast('للمدير فقط'); upd(() => { S.cfg.acx = S.cfg.acx || {}; S.cfg.acx[k] = acx(k) ? 0 : 1; }); }
VW.st_acx = () => ({ t: 'خيارات الإكسسوارات', h: '<p class="m">اضغط على الخيار لتشغيله أو إيقافه.</p>' + AXL.map(([k, l]) => row(l, `acxTog('${k}')`, acx(k) ? 'مفعّل ✓' : 'متوقف')).join('') });
/* عدّاد مرات النفاد الشهري: [شهر, عدد, آخر وقت]؛ ضغطتان خلال 30 دقيقة تُحسبان مرة واحدة */
const mkey = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };
const ocBump = o => { const m = mkey(), now = Date.now(), same = o.oc && o.oc[0] == m; if (same && now - (o.oc[2] || 0) < 18e5) return; o.oc = [m, same ? o.oc[1] + 1 : 1, now]; };
const ocN = o => o && o.oc && o.oc[0] == mkey() ? o.oc[1] : 0;
const ocTxt = o => acx('oc') && ocN(o) ? 'نفد ' + ocN(o) + (ocN(o) == 1 ? ' مرة' : ' مرات') + ' هذا الشهر' : '';
let ACQ = '';
const acReq = (t, w) => { if (SH) ACQ = t; else reqChk(t, w); };
const acFlush = () => { if (ACQ) { const t = ACQ; ACQ = ''; reqChk(t, 1); } };
function acCard(i) {
  const s = acSt(i), cn = typeof i.cnt == 'number', cmp = isCmp('acc') && V.v == 'sec';
  const fxParts = S.fields.filter(f => f.sec == 'acc').map(f => fxVal(i, f).length ? f.name + ': ' + fxVal(i, f).join('، ') : '').filter(Boolean);
  const sub = [acTierTxt(i), i.pw, ...(cmp ? [] : fxParts), i.note, acx('sb') && acStale(cfTime(i)) && '⚠ غير مؤكد'].filter(Boolean).map(esc).join(' · ');
  const act = cn
    ? `<button class="btn s sm" onclick="acC('${i.id}',-1)">−</button><span class="cn" onclick="acCnt('${i.id}')">${i.cnt}</span><button class="btn sm" onclick="acC('${i.id}',1)">+</button>`
    : ['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" style="margin:0;padding:4px 8px;font-size:var(--t-xs)" onclick="acS('${i.id}','${x}')">${ALB[x]}</button>`).join('');
  return cardH(`<div class="row2" style="flex-wrap:wrap;gap:6px"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="acOpen('${i.id}')"><b><bdi>${esc(acTitle(i))}</bdi></b>${sub ? `<div class="m">${sub}</div>` : ''}</div>${prBadge(i.price)}<div class="row2" style="gap:4px">${act}</div></div>`, colOf(i), 'cmp');
}
/* نافذة الإجراءات السفلية للإكسسوار (تفتح عند الضغط على السطر) */
const acGo = (f, id) => { finish(null); setTimeout(() => window[f](id), 380); };
function acOpen(id) {
  const i = find(id); if (!i) return;
  acSheetR(id); sheetOpen(acFlush);
}
function acSheetR(id) {
  const i = find(id); if (!i) return;
  const s = acSt(i), cn = typeof i.cnt == 'number';
  const meta = [acTierTxt(i), i.pw, cn ? 'الحد ≤ ' + acLim(i) : '', cfTime(i) ? 'آخر تأكيد ' + agoTxt(cfTime(i)) : '', ocTxt(i)].filter(Boolean).join(' · ');
  const ctrl = cn
    ? `<div class="cs-vr"><b>العدد المتوفر</b><button class="btn s cs-sb" onclick="acC('${i.id}',-1);acSheetR('${i.id}')">−</button><span class="cn" onclick="acGo('acCnt','${i.id}')">${i.cnt}</span><button class="btn cs-sb" onclick="acC('${i.id}',1);acSheetR('${i.id}')">+</button></div>`
    : `<div class="row2" style="margin:8px 0">${['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" style="flex:1;margin:0;min-height:42px" onclick="acS('${i.id}','${x}');acSheetR('${i.id}')">${ALB[x]}</button>`).join('')}</div>`;
  $('sh').innerHTML = `<div class="bar"></div><div class="row2"><h3><bdi>${esc(acTitle(i))}</bdi></h3>${prBadge(i.price)}<span class="dotl" style="background:${DT[s]}"></span></div>`
    + (meta ? `<p class="m" style="margin:2px 0 6px">${esc(meta)}</p>` : '')
    + fxShow(i)
    + (i.note ? `<div class="m" style="margin:4px 0">ملاحظة: ${esc(i.note)}</div>` : '')
    + ctrl
    + `<div class="cs-acts">`
    + `<button class="btn s" onclick="acGo('acEd','${i.id}')">تعديل</button>`
    + `<button class="btn s" onclick="acGo('acDup','${i.id}')">+ سعة / فئة أخرى</button>`
    + `<button class="btn s" onclick="acGo('acNote','${i.id}')">ملاحظة</button>`
    + (cn ? '' : `<button class="btn s" onclick="acGo('acCnt','${i.id}')">تحويل لعدد رقمي</button>`)
    + ((i.log || []).length ? `<button class="btn s" onclick="acGo('lgOpen','${i.id}')">السجل</button>` : '')
    + (can('del') ? `<button class="btn s del" onclick="acGo('acDel','${i.id}')">حذف</button>` : '')
    + `</div><div class="acts"><button class="btn" onclick="finish(null)">تم</button></div>`;
}
function acDup(id) {
  const r = find(id); if (!r) return;
  $('sh').innerHTML = ''; sheetOpen(v => acDone(v, PR));
  acForm({ kind: r.kind, conn: r.conn || '', name: r.name || '', brand: r.brand || '', tier: r.tier || '', pw: r.pw || '', price: r.price || '', lim: r.lim });
}
function acView() {
  const j = V.kk, k = j == null ? null : S.tags.kind[j];
  const all = [...agList().map(d => ({ g: d, kind: d.kind })), ...S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g).map(i => ({ i, kind: i.kind }))];
  const stOf = x => x.g ? x.g.st : acSt(x.i), need = {};
  all.forEach(x => { if (stOf(x) != 'g') need[x.kind] = (need[x.kind] || 0) + 1; });
  const nAll = Object.values(need).reduce((a, b) => a + b, 0);
  /* الحالة أولاً (أحمر ← برتقالي ← أخضر) ثم ترتيب المستخدم (الاسم/الأحدث) داخل كل حالة */
  const rows = srt(all.filter(x => (k == null || x.kind == k) && (!V.kn || stOf(x) != 'g')), 'acc', x => x.g ? x.g.title : acName(x.i), x => AORD[stOf(x)], x => x.g ? x.g.at : x.i.at).sort((x, y) => acx('so') ? AORD[stOf(x)] - AORD[stOf(y)] : 0);
  const pg = pgSlice('ac', rows);
  const tagsHtml = `<button class="tag ${j == null ? 'on' : ''}" onclick="V.kk=null;render()">الكل</button>`
    + S.tags.kind.map((t, x) => `<button class="tag ${j == x ? 'on' : ''}" onclick="V.kk=${x};render()">${esc(t)}${need[t] ? ` <small>(${need[t]})</small>` : ''}</button>`).join('')
    + `<button class="tag ${V.kn ? 'on' : ''}" onclick="V.kn=!V.kn;render()">يحتاج شراء${nAll ? ' (' + nAll + ')' : ''}</button>`;
  return {
    t: 'الإكسسوارات',
    h: `<button class="btn" onclick="acAdd()">+ إضافة إكسسوار</button>`
      + secPanel('acc', tagsHtml)
      + (rows.length ? pg.items.map(x => x.g ? agCard(x.g) : acCard(x.i)).join('') + pg.more : V.kn ? emptyBox('لا يوجد شيء يحتاج شراء ✓') : all.length ? emptyBox('لا توجد نتائج لهذا النوع') : emptyBox('لا توجد إكسسوارات في هذا القسم بعد', 'اضغط على «+ إضافة إكسسوار» في الأعلى لإضافة أول قطعة'))
  };
}
function acC(id, d) {
  const i = find(id); if (!i) return;
  if (d < 0 && i.cnt <= 0) return toast('العدد 0 — إن كان غير محدَّث اضغط على الرقم لتصحيحه');
  commit(d < 0 ? 'بيع ' + acTitle(i) + ' (−1)' : 'إضافة ' + acTitle(i) + ' (+1)', () => { const w = i.cnt > 0; i.cnt = Math.max(0, i.cnt + d); if (w && i.cnt == 0) ocBump(i); touch(i); });
  if (d > 0) acReq(acName(i));
}
function acCnt(id) {
  const i = find(id); if (!i) return;
  ask('عدد القطع', [{ k: 'n', l: 'العدد الحالي', t: 'tel', v: typeof i.cnt == 'number' ? i.cnt : '' }]).then(v => {
    if (v && v.n.trim() !== '') { const n = ci(v.n); commit('تم تحديث العدد', () => { const was = acSt(i); i.cnt = n; touch(i, 1); if (n == 0 && was != 'r') ocBump(i); }); if (n > 0) reqChk(acName(i), 1); }
  });
}
function acS(id, s) { const i = find(id); if (!i) return; commit('تم: ' + ALB[s] + ' — ' + acTitle(i), () => { const was = acSt(i); i.st = s; touch(i, 1); if (s == 'r' && was != 'r') ocBump(i); }); if (s != 'r') acReq(acName(i)); }
function acNote(id) { const i = find(id); ask('ملاحظة للمشتري', [{ k: 'n', l: 'مثال: بقي 5 حبات', v: i.note || '' }]).then(v => { if (v) upd(() => { i.note = v.n.trim(); i.by = S.me; }); }); }
function acDel(id) { if (!can('del')) return toast('الحذف للمدير فقط'); const i = find(id); if (i) del('items', id, acName(i)); }
function acAdd() {
  PR = null; $('sh').innerHTML = `<div class="bar"></div><h3>إضافة إكسسوار</h3><label>ابحث أولاً (مثلاً: micro أو Sandisk)<input oninput="acF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(v => acDone(v, PR)); acF('');
}
function acF(q) {
  const n = nz(q), m = S.items.filter(i => i.sec == 'acc' && nzHit(nz(acName(i)), q, n)).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 6);
  $('pr').innerHTML = m.map(i => `<button class="card row2" onclick="acForm(find('${i.id}'))"><b>${esc(acName(i))}</b><span class="m">${esc(fmtPr(i.price))}</span></button>`).join('') + `<button class="btn" onclick="acForm({})">+ إكسسوار جديد</button>`;
}
function acEd(id) { const r = find(id); $('sh').innerHTML = ''; sheetOpen(v => acDone(v, r)); acForm(r); }
const acFxSync = () => { const g = !!gkc(FS.v.kind).g; ['acl_w', 'an_w'].forEach(x => { const el = $(x); if (el) el.style.display = g ? 'none' : ''; }); };
function acForm(rec) {
  PR = rec; const ed = !!rec.id;
  fsInit([['kind', 'النوع', () => { acFxSync(); return true; }], ['conn', 'الموصل', () => kc(FS.v.kind).conn && shown('acc', 'conn')], ['tier', 'الفئة (السعر)', () => kc(FS.v.kind).tier && shown('acc', 'tier')], ['pw', 'القدرة (واط)', () => gkc(FS.v.kind).w]],
    { kind: rec.kind || '', conn: rec.conn || '', tier: rec.tier || '', pw: rec.pw || '' }, 'acc', rec);
  $('sh').innerHTML = `<div class="bar"></div><h3>${ed ? 'تعديل' : 'إكسسوار جديد'}</h3><div id="cc"></div><div id="cc2"></div>`
    + `<div id="fx"></div>`
    + `<label style="margin-top:8px"${hh('acc', 'name')}>اسم / موديل (اختياري)<input id="anm" value="${esc(rec.name || '')}" placeholder="مثال: سماعة سلكية · M20"></label>`
    + `<div class="row2" style="gap:8px;align-items:flex-end"><label style="flex:1;margin-top:8px"${hh('acc', 'price')}>السعر (درهم)<input id="ap" type="tel" value="${esc(rec.price || '')}" placeholder="أو يُؤخذ من الفئة" ${ed && !can('price') ? 'disabled' : ''}></label><label style="flex:1;margin-top:8px"${hh('acc', 'cnt')}>العدد (اختياري)<input id="acn" type="tel" value="${esc(rec.cnt ?? '')}" placeholder="فارغ = متوفر/قارب"></label></div>`
    + `<div class="row2" style="gap:8px;align-items:flex-end"><label style="flex:1;margin-top:8px"${hh('acc', 'brand')}>الماركة (اختياري)<input id="ab" value="${esc(rec.brand || '')}"></label><label id="acl_w" style="flex:1;margin-top:8px"${hh('acc', 'lim')}>الحد: «قارب» عند (اختياري)<input id="acl" type="tel" value="${esc(rec.lim ?? '')}"></label></div>`
    + `<label id="an_w"${hh('acc', 'note')}>ملاحظة<textarea id="an">${esc(rec.note || '')}</textarea></label><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="acSave()">حفظ</button></div>`
    + (ed ? '' : `<button class="btn s" onclick="acSave(2)">حفظ وإضافة مثله (سعة أو فئة أخرى)</button>` + moreBtn('acSave'));
  chipsR();
}
function acSave(more) {
  const kind = FS.v.kind; if (!kind) return toast('اختر النوع');
  const k = kc(kind), c = $('acn').value.trim(), l = $('acl').value.trim();
  if (acx('tr') && gkc(kind).g && k.tier && shown('acc', 'tier') && !FS.v.tier && !(PR && PR.id && !PR.tier)) return toast('اختر الفئة (السعر) لهذا النوع');
  finish(fxAtt({ kind, conn: k.conn ? FS.v.conn || '' : '', tier: k.tier ? FS.v.tier || '' : '', pw: gkc(kind).w ? FS.v.pw || '' : '', name: $('anm').value.trim(), brand: $('ab').value.trim(), price: $('ap').value.trim() || (k.tier ? FS.v.tier || '' : ''), note: $('an').value.trim(), cnt: c === '' ? undefined : ci(c), lim: gkc(kind).g || l === '' ? undefined : ci(l), _more: more || 0 }));
}
function acDone(v, r) {
  if (!v) return; const more = v._more; delete v._more;
  if (r && r.id && S.items.includes(r)) {
    if (!can('price')) v.price = r.price;
    if (typeof r.cnt == 'number' && v.cnt === undefined) v.st = acSt(r); /* مسح العدد يُبقي الحالة التي كانت معروضة */
    const cntChg = r.cnt !== v.cnt;
    commit('تم التعديل', () => { Object.assign(r, v); if (cntChg) touch(r, 1); else r.by = S.me; });
    if (cntChg && v.cnt > 0) reqChk(acName(r), 1);
    return;
  }
  const d = S.items.find(i => i.sec == 'acc' && i.kind == v.kind && (i.conn || '') == v.conn && (i.tier || '') == v.tier && (i.brand || '') == v.brand && (i.pw || '') == v.pw && (i.name || '') == (v.name || '') && xSig(i) == xSig(v));
  if (d) return acx('dpb') ? toast('موجود مسبقاً: ' + acName(d)) : void setTimeout(() => acDupAsk(v, r, d, more), 350);
  acAddRec(v, r, more);
}
function acAddRec(v, r, more) {
  const o = { id: uid(), sec: 'acc', ...v, st: 'g' }; if (r && r.code) o.code = r.code; touch(o, 1);
  commit('تمت الإضافة', () => S.items.push(o));
  if (more == 2) setTimeout(() => { sheetOpen(x => acDone(x, PR)); acForm({ kind: v.kind, conn: v.conn, name: v.name, brand: v.brand, tier: v.tier, pw: v.pw, price: v.price, lim: v.lim }); }, 350);
  else if (more) setTimeout(acAdd, 350);
  else reqChk(acName(o), 1);
}
function acDupAsk(v, r, d, more) {
  $('sh').innerHTML = `<div class="bar"></div><h3>موجود مسبقاً</h3><p class="m"><b><bdi>${esc(acName(d))}</bdi></b>${d.price ? ' · ' + esc(fmtPr(d.price)) : ''}</p><div class="acts"><button class="btn s" onclick="finish('open')">فتح الموجود</button><button class="btn" onclick="finish('add')">إضافة على أي حال</button></div>`;
  sheetOpen(x => { if (x == 'add') acAddRec(v, r, more); else if (x == 'open') setTimeout(() => acOpen(d.id), 350); });
}
function buyA(id) {
  const i = find(id); if (!i) return;
  if (typeof i.cnt == 'number') return qty(acTitle(i) + ' (المتوفر: ' + i.cnt + ')', '', n => {
    i.cnt += n; touch(i, 1);
    if (typeof rcLogIn == 'function') rcLogIn('acc', i.id, i.id, acTitle(i), '+' + n);
    reqChk(acName(i), 1);
  });
  $('sh').innerHTML = `<div class="bar"></div><h3>وصول: ${esc(acTitle(i))}</h3>`
    + `<p class="m">حدّد الحالة الجديدة لهذا الإكسسوار:</p>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn s" onclick="finish('y')">قارب</button><button class="btn" onclick="finish('g')">متوفر الآن</button></div>`;
  sheetOpen(st => {
    if (!st) return;
    commit('تم تسجيل وصول ' + acTitle(i), () => {
      i.st = st; touch(i, 1);
      if (typeof rcLogIn == 'function') rcLogIn('acc', i.id, i.id, acTitle(i), ALB[st] || st);
    });
    reqChk(acName(i), 1);
  });
}
/* مجموعات الكابلات والشواحن: الحكم على المجموع (فئة + موصل + قدرة) — سطر واحد رشيق + نافذة تفاصيل */
const gkey = i => [i.kind, i.conn || '', i.tier || '', i.pw || ''].join('|').replace(/\//g, '-');
const AORD = { r: 0, y: 1, g: 2 }, ALB2 = { g: 'متوفر', y: 'قارب', r: 'نفد' };
function agList() {
  const m = {}, mk = (id, x) => m[id] = m[id] || { id, kind: x.kind, conn: x.conn || '', tier: x.tier || '', pw: x.pw || '', mem: [] };
  S.items.forEach(i => { if (i.sec == 'acc' && gkc(i.kind).g) mk(gkey(i), i).mem.push(i); });
  S.ag.forEach(r => { if (gkc(r.kind).g && (r.lv || typeof r.cnt == 'number' || r.lim != null)) mk(r.id, r); });
  return Object.values(m).map(d => {
    const g = S.ag.find(x => x.id == d.id), L = (g && g.lim) ?? gkc(d.kind).lim ?? lim('agl'), M = d.mem.filter(i => typeof i.cnt == 'number'), mt = M.reduce((a, i) => a + i.cnt, 0), mat = M.length ? Math.max(...M.map(i => i.at || 0)) : 0, ga = (g && g.at) || 0;
    /* حالة واحدة فقط: cnt مجموع تقديري يتبع تغيّر الماركات بالفرق · mem مجموع الماركات · lv مستوى يدوي */
    let tot = null, est = false, mode = 'lv';
    if (g && typeof g.cnt == 'number') {
      if (typeof g.base == 'number') { tot = Math.max(0, g.cnt + mt - g.base); est = true; mode = 'cnt'; }
      else if (M.length && mat > ga) { tot = mt; mode = 'mem'; }
      else { tot = g.cnt; est = true; mode = 'cnt'; }
    } else if (M.length && (mat > ga || !(g && g.lv))) { tot = mt; mode = 'mem'; }
    const st = tot !== null ? (tot <= 0 ? 'r' : tot <= L ? 'y' : 'g') : ((g && g.lv) || 'g');
    const at = Math.max(ga, ...d.mem.map(i => i.at || 0));
    const cf = Math.max(cfTime(g), ...d.mem.map(cfTime));
    return { ...d, g, lim: L, tot, est, mt, mode, st, at, cf, title: [d.kind, d.conn, d.pw, d.tier ? 'فئة ' + d.tier : (kc(d.kind).tier ? 'بلا فئة' : '')].filter(Boolean).join(' · ') };
  }).sort((a, b) => AORD[a.st] - AORD[b.st] || a.title.localeCompare(b.title));
}
const agItemCard = i => { const d = agList().find(x => x.id == gkey(i)); return d ? agCard(d) : acCard(i); };
const agD = e => agList().find(x => x.id == decodeURIComponent(e));
function agSet(d, fn, tch = true, cf = false, lb = 'تم التحديث') {
  commit(lb, () => {
    let g = S.ag.find(x => x.id == d.id);
    if (!g) { g = { id: d.id, kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw }; S.ag.push(g); }
    fn(g); g.by = S.me;
    if (tch) { if (!g.cf && g.at) g.cf = g.at; g.at = Date.now(); if (cf) g.cf = g.at; }
  });
}
function agCard(d) {
  const e = encodeURIComponent(d.id), cmp = isCmp('acc') && V.v == 'sec';
  const brs = !cmp && d.mem.length ? d.mem.map(i => (i.brand || 'عام') + (d.mode != 'lv' && typeof i.cnt == 'number' ? ' (' + i.cnt + ')' : '')).join('، ') : '';
  const sub = [d.tot !== null ? 'المجموع ' + (d.est ? '≈' : '') + d.tot : '', 'الحد ' + d.lim, brs, d.g && d.g.note, acx('sb') && acStale(d.cf) && '⚠ غير مؤكد'].filter(Boolean).join(' · ');
  return cardH(`<div class="row2" style="flex-wrap:wrap;gap:6px"><span class="dotl" style="background:${DT[d.st]}"></span><div class="cmp-main" onclick="agOpen('${e}')"><b><bdi>${esc(d.title)}</bdi></b>${sub ? `<div class="m">${esc(sub)}</div>` : ''}</div><div class="row2" style="gap:4px">${d.mode == 'cnt' && acx('gp') ? `<button class="btn sm" onclick="agC('${e}',-1)">−</button><span class="cn" onclick="agCnt('${e}')">${d.est ? '≈' : ''}${d.tot}</span><button class="btn sm" onclick="agC('${e}',1)">+</button>` : ['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" style="margin:0;padding:4px 8px;font-size:var(--t-xs)" onclick="agLv('${e}','${s}')">${ALB2[s]}</button>`).join('')}</div></div>`, '', 'cmp');
}
const agGo = (f, e) => { finish(null); setTimeout(() => window[f](e), 380); };
function agOpen(e) {
  const d = agD(e); if (!d) return;
  $('sh').innerHTML = `<div class="bar"></div><div class="row2"><h3>${esc(d.title)}</h3><span class="dotl" style="background:${DT[d.st]}"></span><span class="m">${ALB2[d.st]}</span></div>`
    + `<p class="m" style="margin:2px 0 8px">${d.tot !== null ? 'المجموع ' + (d.est ? '≈' : '') + d.tot + ' · ' : ''}«قارب النفاد» عند ${d.lim} فأقل${d.cf ? ' · آخر تأكيد ' + agoTxt(d.cf) : ''}${ocTxt(d.g) ? ' · ' + ocTxt(d.g) : ''}</p>`
    + (d.g && d.g.note ? `<div class="m" style="margin:4px 0">ملاحظة: ${esc(d.g.note)}</div>` : '')
    + `<div class="row2" style="margin:8px 0">${['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" style="flex:1;margin:0;min-height:42px" onclick="agLv('${e}','${s}');agOpen('${e}')">${ALB2[s]}</button>`).join('')}</div>`
    + (d.mem.length ? `<label>الماركات المسجلة في هذه المجموعة (اضغط للتعديل)</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px">${d.mem.map(i => `<button class="tag" style="margin:0" onclick="agGo('acEd','${i.id}')">${esc(i.brand || 'بدون ماركة')}${d.mode != 'lv' && typeof i.cnt == 'number' ? ' · ' + i.cnt : ''}</button>`).join('')}</div>` : '')
    + `<div class="cs-acts">`
    + `<button class="btn s" onclick="agGo('agCnt','${e}')">تحديد المجموع</button>`
    + `<button class="btn s" onclick="agGo('agNote','${e}')">ملاحظة للمعلم</button>`
    + `<button class="btn s" onclick="agGo('agLimEd','${e}')">تعديل الحد</button>`
    + `<button class="btn s" onclick="agGo('agAddB','${e}')">+ إضافة ماركة</button>`
    + (can('del') ? `<button class="btn s del" onclick="agGo('agDel','${e}')">حذف المجموعة</button>` : '')
    + `</div><div class="acts"><button class="btn" onclick="finish(null)">تم</button></div>`;
  if (!SH) sheetOpen(acFlush);
}
const agLv = (e, l) => {
  const d = agD(e); if (!d) return;
  const z = l == 'r' && d.mem.some(i => typeof i.cnt == 'number' && i.cnt > 0);
  agSet(d, g => { g.lv = l; delete g.cnt; delete g.base; if (l == 'r' && d.st != 'r') ocBump(g); if (l == 'r') d.mem.forEach(i => { if (typeof i.cnt == 'number') i.cnt = 0; }); }, true, true, z ? 'نفد — صُفِّرت أعداد الماركات' : 'تم التحديث');
  if (l != 'r') acReq(d.title);
};
/* وصول مجموعات الكابلات/الشواحن من التقرير (✓): إدخال الكمية الفعلية أو اختيار الحالة صراحة */
let AGB = { e: '', lv: '' };
function agBuyIn(src) {
  if (AGB.lv) {
    AGB.lv = '';
    if ($('agb_g')) $('agb_g').classList.remove('on');
    if ($('agb_y')) $('agb_y').classList.remove('on');
  }
  if (src == 'm' && $('agb_n')) $('agb_n').value = '';
  if (src == 'g') document.querySelectorAll('#sh .buy-inp[data-mid]').forEach(el => { el.value = ''; });
}
function agBuyLv(s) {
  AGB.lv = AGB.lv == s ? '' : s;
  if (AGB.lv) {
    if ($('agb_n')) $('agb_n').value = '';
    document.querySelectorAll('#sh .buy-inp[data-mid]').forEach(el => { el.value = ''; });
  }
  if ($('agb_g')) $('agb_g').classList.toggle('on', AGB.lv == 'g');
  if ($('agb_y')) $('agb_y').classList.toggle('on', AGB.lv == 'y');
}
function agBuySave() {
  const adds = [];
  document.querySelectorAll('#sh .buy-inp[data-mid]').forEach(el => {
    const n = ci(el.value); if (n > 0) adds.push({ mid: el.dataset.mid, n });
  });
  const genN = $('agb_n') ? ci($('agb_n').value) : 0;
  if (!adds.length && !genN && !AGB.lv) return toast('أدخل الكمية التي وصلت أو اختر الحالة');
  finish({ adds, genN, lv: AGB.lv });
}
function agBuy(e) {
  const d = agD(e); if (!d) return;
  AGB = { e, lv: '' };
  const M = d.mode == 'lv' ? [] : d.mem.filter(i => typeof i.cnt == 'number');
  const curTxt = d.tot !== null ? `المجموع الحالي: ${d.est ? '≈' : ''}${d.tot}` : `الحالة الحالية: ${ALB2[d.st]}`;
  const mRows = M.map(m => `<div class="buy-row"><div class="buy-info"><b>${esc(m.brand || 'عام')}</b><small class="m">المتوفر: ${m.cnt}</small></div><input type="tel" inputmode="numeric" class="buy-inp" data-mid="${m.id}" placeholder="0" oninput="agBuyIn('m')"></div>`).join('');
  $('sh').innerHTML = `<div class="bar"></div><h3>وصول: ${esc(d.title)}</h3>`
    + `<p class="m">${esc(curTxt)} · الحد «قارب» عند ${d.lim} فأقل.</p>`
    + (mRows ? `<label>الكمية التي وصلت حسب الماركة</label>${mRows}` : '')
    + `<label>${d.tot === null ? 'الكمية التي وصلت (تصبح هي المجموع التقريبي)' : M.length ? 'أو كمية وصلت للمجموع العام (تُضاف للمجموع الحالي)' : 'الكمية التي وصلت (تُضاف للمجموع الحالي)'}<input id="agb_n" type="tel" inputmode="numeric" placeholder="فارغ إن اخترت الحالة أدناه" oninput="agBuyIn('g')"></label>`
    + `<label>أو حدّد الحالة التقديرية بدون عدّ</label><div class="row2"><button type="button" id="agb_g" class="tag f1" onclick="agBuyLv('g')">متوفر الآن</button><button type="button" id="agb_y" class="tag f1" onclick="agBuyLv('y')">قارب</button></div>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="agBuySave()">حفظ الوصول</button></div>`;
  sheetOpen(v => {
    if (!v) return;
    const d2 = agD(e); if (!d2) return;
    if (v.adds.length) {
      commit('تم تسجيل وصول ' + d2.title, () => {
        const parts = [];
        v.adds.forEach(({ mid, n }) => { const it = find(mid); if (it) { it.cnt += n; touch(it, 1); parts.push((it.brand || 'عام') + ' +' + n); } });
        if (typeof rcLogIn == 'function' && parts.length) rcLogIn('ag', e, e, d2.title, parts.join('، '));
      });
    } else if (v.genN > 0) {
      agSet(d2, g => {
        g.cnt = (d2.tot || 0) + v.genN; g.base = d2.mt; delete g.lv;
        if (typeof rcLogIn == 'function') rcLogIn('ag', e, e, d2.title, '+' + v.genN);
      }, true, true);
    } else if (v.lv) {
      agSet(d2, g => {
        g.lv = v.lv; delete g.cnt; delete g.base;
        if (typeof rcLogIn == 'function') rcLogIn('ag', e, e, d2.title, ALB2[v.lv] || v.lv);
      }, true, true);
    }
    reqChk(d2.title, 1);
  });
}
function agC(e, dl) {
  const d = agD(e); if (!d || d.mode != 'cnt') return;
  if (dl < 0 && d.tot <= 0) return toast('المجموع 0 — إن كان غير محدَّث اضغط على الرقم لتصحيحه');
  agSet(d, g => { const n = Math.max(0, d.tot + dl); if (dl < 0 && n == 0) ocBump(g); g.cnt = n; g.base = d.mt; delete g.lv; }, true, false, dl < 0 ? 'بيع من ' + d.title + ' (−1)' : 'إضافة إلى ' + d.title + ' (+1)');
  if (dl > 0) acReq(d.title);
}
function agCnt(e) {
  const d = agD(e); if (!d) return;
  ask('المجموع التقريبي — ' + d.title, [{ k: 'n', l: 'العدد تقريباً', t: 'tel', v: d.tot ?? '' }]).then(v => {
    if (v && v.n.trim() !== '') {
      const d2 = agD(e) || d, n = ci(v.n);
      agSet(d2, g => { g.cnt = n; g.base = d2.mt; delete g.lv; }, true, true);
      if (n > 0) reqChk(d2.title, 1);
    }
  });
}
function agNote(e) {
  const d = agD(e); if (!d) return;
  ask('ملاحظة للمعلم — ' + d.title, [{ k: 'n', l: 'مثال: بقي 5 حبات', v: (d.g && d.g.note) || '' }]).then(v => {
    if (v) agSet(d, g => { const t = v.n.trim(); if (t) g.note = t; else delete g.note; }, false, false, 'تم حفظ الملاحظة');
  });
}
function agLimEd(e) {
  const d = agD(e); if (!d) return; if (!isAdmin()) return toast('للمدير فقط');
  ask('الحد — ' + d.title, [{ k: 'n', l: '«قارب النفاد» عند مجموع فأقل (فارغ = الحد العام)', t: 'tel', v: d.g && d.g.lim != null ? d.g.lim : '' }]).then(v => { if (v) agSet(d, g => { if (v.n.trim() === '') delete g.lim; else g.lim = ci(v.n); }, false); });
}
function agAddB(e) { const d = agD(e); if (!d) return; $('sh').innerHTML = ''; sheetOpen(v => acDone(v, PR)); acForm({ kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw }); }
function agDel(e) {
  if (!can('del')) return toast('الحذف للمدير فقط');
  const d = agD(e); if (!d) return;
  const msg = d.mem.length ? `حذف مجموعة «${d.title}» مع ${d.mem.length} عناصر تابعة لها؟` : `حذف مجموعة «${d.title}» ؟`;
  sure(msg).then(y => {
    if (!y) return;
    commit('تم حذف المجموعة', () => {
      S.ag = S.ag.filter(x => x.id != d.id);
      if (d.mem.length) {
        const ids = new Set(d.mem.map(m => m.id));
        d.mem.forEach(m => S.trash.push({ id: uid(), coll: 'items', obj: m, label: acName(m), t: Date.now() }));
        S.items = S.items.filter(i => !ids.has(i.id));
      }
    });
  });
}