/* repairguide.js — الصيانة (3/3): دليل أسعار الإصلاح، طلبات الزبائن، الأرشفة، وإعدادات الصيانة. يُحمَّل بعد repairform.js وقبل report.js */
const gdCard = g => `<div class="card cmp"><div class="ph-top"><b class="ph-nm"><bdi>${esc(g.m)}</bdi></b><div class="ph-pr-wrap">${prBadge(g.p)}${g.p2 ? `<span class="m">أصلي:</span>${prBadge(g.p2)}` : ''}</div></div><div class="row2" style="margin-top:4px;flex-wrap:wrap"><span class="m f1">${esc(g.f)}${g.n ? ' · ' + esc(g.n) : ''}</span>${can('price') ? `<button class="btn s sm" onclick="gdEd('${g.id}')">تعديل</button><button class="btn s sm del" onclick="gdDel('${g.id}')">حذف</button>` : ''}</div></div>`;
const gdList = (q, flt) => {
  const n = nz(q || ''), fn = nz(flt || '');
  return S.guide.filter(g => (!fn || nz(g.f).includes(fn)) && (!n || nzHit(nz(g.m + ' ' + g.f + ' ' + (g.n || '')), q, n))).sort((a, b) => a.m.localeCompare(b.m)).map(gdCard).join('') || emptyBox('لا توجد تسعيرات مطابقة', can('price') ? 'اضغط على «+ إضافة تسعيرة» في الأعلى لإضافة سعر إصلاح جديد' : '');
};
VW.gd = () => {
  const gf = V.gf || '';
  return {
    t: 'دليل أسعار الإصلاح',
    h: (can('price') ? '<button class="btn" onclick="gdEd(null)">+ إضافة تسعيرة</button>' : '')
      + `<div class="sec-panel">`
      + `<div class="sec-tags">${[`<button class="tag ${!gf ? 'on' : ''}" onclick="V.gf='';render()">الكل (${S.guide.length})</button>`, ...S.tags.fault.map(f => `<button class="tag ${gf == f ? 'on' : ''}" onclick="V.gf=${esc(JSON.stringify(f))};render()">${esc(f)}</button>`)].join('')}</div>`
      + `<input class="rp-srch" placeholder="ابحث: موديل الهاتف أو الماركة أو العطل..." value="${esc(V.q || '')}" oninput="V.q=this.value;$('gdl').innerHTML=gdList(V.q,V.gf)">`
      + `</div><div id="gdl">${gdList(V.q, gf)}</div>`
  };
};
window.pickGdBrand = j => {
  const b = S.tags.brand[j], el = $('gd_m'); if (!el) return; let cur = el.value.trim();
  const o = S.tags.brand.find(x => x && cur.toLowerCase().startsWith(String(x).toLowerCase()));
  if (o && o.toLowerCase() === b.toLowerCase()) el.value = cur.slice(o.length).trim();
  else { if (o) cur = cur.slice(o.length).trim(); el.value = b + (cur ? ' ' + cur : ' '); }
  el.focus();
};
window.pickGdFault = j => { const el = $('gd_f'); if (el) el.value = S.tags.fault[j]; };
function gdEd(id) {
  if (!can('price')) return toast('للمدير فقط');
  const g = id ? S.guide.find(x => x.id == id) : {};
  $('sh').innerHTML = `<div class="bar"></div><h3>${id ? 'تعديل تسعيرة' : 'تسعيرة جديدة'}</h3>`
    + `<label>الموديل (اختر الماركة أو اكتب الموديل)<input id="gd_m" data-sug="rd" value="${esc(g.m || '')}" placeholder="مثال: Samsung A15"></label>`
    + `<div class="rp-chip-box">${S.tags.brand.map((b, j) => `<button type="button" class="tag" onclick="pickGdBrand(${j})">${esc(b)}</button>`).join('')}</div>`
    + `<label>العطل (اختر من الأسفل أو اكتب)<input id="gd_f" value="${esc(g.f || 'تغيير شاشة')}"></label>`
    + `<div class="rp-chip-box">${S.tags.fault.map((x, j) => `<button type="button" class="tag" onclick="pickGdFault(${j})">${esc(x)}</button>`).join('')}</div>`
    + `<div class="row2"><label class="f1">السعر العادي (درهم)<input id="gd_p" type="tel" value="${esc(g.p || '')}"></label><label class="f1">سعر الأصلي / فئة 2 (اختياري)<input id="gd_p2" type="tel" value="${esc(g.p2 || '')}"></label></div>`
    + `<label>ملاحظة (اختياري)<input id="gd_n" value="${esc(g.n || '')}"></label>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="gdSave()">حفظ</button></div>`;
  sheetOpen(v => {
    if (!v) return;
    upd(() => { if (id) Object.assign(g, v); else S.guide.push({ id: uid(), ...v }); });
  });
}
window.gdSave = () => {
  const m = $('gd_m').value.trim(), f = $('gd_f').value.trim(), p = $('gd_p').value.trim(), p2 = $('gd_p2').value.trim(), n = $('gd_n').value.trim();
  if (!m || !f || !p) return toast('الموديل والعطل والسعر مطلوبة');
  finish({ m, f, p, p2, n });
};
function gdDel(id) { const g = S.guide.find(x => x.id == id); if (g) del('guide', id, g.m + ' ' + g.f); }
function rq() {
  ask('تسجيل طلب زبون (سأل ولم نجد)', [
    { k: 't', l: 'السلعة أو الموديل المطلوب (مثال: بوشيط A54 / شاشة iPhone 13)', v: '' },
    { k: 'p', l: 'اسم الزبون ورقم هاتفه (اختياري — لإبلاغه بالواتساب فور توفرها)', v: '' }
  ]).then(v => {
    if (!v) return;
    const item = v.t.trim(), ph = (v.p || '').trim();
    if (!item) return toast('اكتب اسم السلعة المطلوبة');
    commit('تم تسجيل الطلب', () => S.req.push({ id: uid(), t: ph ? item + ' — ' + ph : item, by: S.me, at: Date.now() }));
  });
}
function rqEd(id) {
  const q = S.req.find(x => x.id == id); if (!q) return;
  ask('تعديل طلب الزبون', [{ k: 't', l: 'الطلب (مع رقم الهاتف إن وجد)', t: 'area', v: q.t }]).then(v => {
    const t = v && v.t.trim(); if (!t) return;
    commit('تم تعديل الطلب', () => { q.t = t; });
  });
}
function rqD(id) {
  commit('تم مسح الطلب', () => { S.req = S.req.filter(r => r.id != id); });
  if (SH && $('sh') && !$('sh').querySelector('[id^="rqa_"]')) setTimeout(() => { if (SH) finish(null); }, 60);
}
function rqTel(txt) {
  const s = String(txt || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const m = s.match(/(?:\+?212|0)[\s\-.]*[567](?:[\s\-.]*\d){8}/);
  return m ? m[0].replace(/\D/g, '') : '';
}
function rqWA(id) {
  const q = S.req.find(x => x.id == id); if (!q) return;
  const ph = rqTel(q.t); if (!ph) return toast('لا يوجد رقم هاتف في هذا الطلب');
  const clean = q.t.replace(/(?:\+?212|0)[\s\-.]*[567](?:[\s\-.]*\d){8}/, '').replace(/[-–—:،.]/g, ' ').trim();
  const msg = typeof waMsg == 'function'
    ? waMsg('req', { الطلب: clean || 'السلعة المطلوبة' })
    : `مرحباً، بخصوص طلبك (${clean || 'السلعة المطلوبة'}) فقد توفرت لدينا في ${shopName()}. مرحباً بك!`;
  location.href = 'https://wa.me/' + rnum(ph) + '?text=' + encodeURIComponent(msg);
}
function rqCard(q) {
  const ph = rqTel(q.t);
  return `<div class="card"><div class="row2"><b class="f1">${esc(q.t)}</b></div>`
    + `<div class="m"><bdi>${fd(q.at)}</bdi>${q.by ? ' · ' + esc(q.by) : ''}${ph ? ` · هاتف: <bdi>${esc(ph)}</bdi>` : ''}</div>`
    + `<div class="sub">${ph ? `<a href="tel:${esc(ph)}" class="btn s sm rp-icb">${I('phone')} اتصال</a><button class="btn sm" onclick="rqWA('${q.id}')">${I('send')} إبلاغ واتساب</button>` : ''}<button class="btn s sm" onclick="rqEd('${q.id}')">تعديل</button><button class="btn s sm del" onclick="rqD('${q.id}')">مسح</button></div></div>`;
}
function rqList() {
  const n = nz(V.q || '');
  const L = (S.req || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(q => !n || nzHit(nz(q.t), V.q, n));
  return L.map(rqCard).join('') || emptyBox('لا توجد طلبات زبائن مسجلة حالياً', 'اضغط على «+ تسجيل طلب زبون» لتدوين أي سلعة سأل عنها زبون ولم يجدها');
}
VW.req = () => ({
  t: 'طلبات الزبائن',
  h: `<button class="btn" onclick="rq()">+ تسجيل طلب زبون (سأل ولم نجد)</button>`
    + `<div class="sec-panel">`
    + `<div class="m" style="margin-bottom:4px">إجمالي الطلبات: <b>${(S.req || []).length}</b> · تظهر أيضاً في التقرير اليومي</div>`
    + `<input class="rp-srch" placeholder="ابحث في الطلبات: موديل، سلعة، أو رقم..." value="${esc(V.q || '')}" oninput="V.q=this.value;$('rql').innerHTML=rqList()">`
    + `</div><div id="rql">${rqList()}</div>`
});
function bcNewRp() { $('sh').innerHTML = ''; const rec = { imei: BCODE }; sheetOpen(v => rDone(v, rec)); rForm(rec); }
BCX.push(() => `<button class="btn s sm" onclick="bcNewRp()">${I('tool')} + استلام صيانة</button>`);
BCM.push(c => { const nc = nz(c); return S.rp.filter(r => r.imei && nz(r.imei).includes(nc)).map(r => rc(r)).join(''); });
const rpArchDays = () => +(S.cfg && S.cfg.rpArchD) || 365;
const rpArchLbl = () => (RP_ARCH_O.find(x => x[0] == rpArchDays()) || [0, rpArchDays() + ' يوم'])[1];
function rpArchEd() {
  if (!isAdmin()) return toast('للمدير فقط');
  ask('مدة أرشفة الصيانات المسلّمة', [{ k: 'd', l: 'أرشفة الصيانات الأقدم من', t: 'sel', o: RP_ARCH_O.map(x => x[1]), v: rpArchLbl() }]).then(v => {
    const o = v && RP_ARCH_O.find(x => x[1] == v.d);
    if (o) upd(() => { S.cfg.rpArchD = o[0]; });
  });
}
const rpOld = () => { const n = Date.now(), base = rpArchDays(); return S.rp.filter(r => r.st == 'dn' && r.t2 && n - r.t2 > Math.max(base, (+r.war || 0) + 30) * 864e5); };
function rpArch() {
  if (!isAdmin()) return toast('للمدير فقط');
  const a = rpOld(), lb = rpArchLbl(); if (!a.length) return toast('لا توجد صيانات مسلّمة أقدم من ' + lb);
  sure('حذف ' + a.length + ' صيانة مسلّمة منذ أكثر من ' + lb + ' (انتهى ضمانها) من كل الأجهزة؟ يُفضّل أخذ ملف نسخة احتياطية قبل ذلك. تُحفظ نسخة تلقائية داخل الهاتف أولاً.', 'أرشفة').then(y => {
    if (!y) return;
    snapPre().then(() => { const ids = new Set(a.map(x => x.id)); S.rp = S.rp.filter(x => !ids.has(x.id)); save(); render(); toast('تمت أرشفة ' + a.length + ' صيانة'); });
  });
}
CATS.rp = ['الصيانة', [
  tg('أعطال الصيانة', 'fault'),
  tg('حالة الاستلام والأمانات', 'rpchk'),
  ['دليل أسعار الإصلاح', "go('gd')"],
  ['مدة الضمان الافتراضية', "limEd('rpWar')", () => lim('rpWar') ? lim('rpWar') + ' يوم' : 'بدون ضمان'],
  ['تنبيه «متأخر في المحل» بعد', "limEd('rpSlow')", () => lim('rpSlow') + ' أيام'],
  ['تنبيه «منسي في الجاهز» بعد', "limEd('rpLate')", () => lim('rpLate') + ' يوم'],
  ['مدة حفظ الصورة والرمز بعد التسليم', "limEd('rpKeep')", () => lim('rpKeep') + ' يوم'],
  ['مدة أرشفة الصيانات القديمة', 'rpArchEd()', () => rpArchLbl()],
  ['أرشفة الصيانات المسلّمة القديمة الآن', 'rpArch()', () => rpOld().length + ' صيانة']
], 'rp'];
MORE.push({ g: 'sec', o: 50, l: 'الصيانة', d: 'الأعطال، الأمانات، الضمان الافتراضي، حدود التأخير، حفظ الصور والأرشفة', fn: "go('st_c',{c:'rp'})" });
