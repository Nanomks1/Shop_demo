/* ============================================================
   extra.js — شراء المستعمل · الديون · الإحصائيات
   يُحمَّل بعد repair.js وقبل app.js. يسجّل نفسه في VW/HOME/MORE/SRCH/BCM.
   البيانات: S.used (شراء المستعمل) · S.debt (الديون) — وكلاهما يُزامَن ويُشفَّر مع بيانات الزبائن.
   ============================================================ */
Object.assign(IC, {
  wallet: '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 9v9M17 5v13"/>'
});
const xn = s => parseFloat(String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d.]/g, '')) || 0;
const xTel = t => t ? `<a href="tel:${esc(t)}">${esc(t)}</a>` : '';

/* ---------- شراء المستعمل ---------- */
function usDup(imei, selfId) {
  const n = nz(imei); if (n.length < 6) return '';
  if (S.items.some(i => i.imei && nz(i.imei).includes(n))) return 'المخزون';
  if (S.rp.some(r => r.imei && nz(r.imei).includes(n))) return 'الصيانة';
  if (S.used.some(u => u.id != selfId && u.imei && nz(u.imei).includes(n))) return 'سجل شراء المستعمل';
  return '';
}
function usForm(rec) {
  return ask(rec.id ? 'تعديل شراء مستعمل' : 'شراء هاتف مستعمل', [
    { k: 'dev', l: 'الجهاز / الموديل', v: rec.dev || '' },
    { k: 'name', l: 'اسم البائع', v: rec.name || '' },
    { k: 'tel', l: 'هاتف البائع', v: rec.tel || '' },
    { k: 'imei', l: 'IMEI (اختياري)', v: rec.imei || '' },
    { k: 'price', l: 'سعر الشراء', v: rec.price || '' },
    { k: 'note', l: 'ملاحظة (الحالة، الملحقات...)', t: 'area', v: rec.note || '' }
  ]);
}
async function usSave(rec, v) {
  if (!v) return;
  v = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x || '').trim()]));
  if (!v.dev || !v.name) { toast('اكتب الجهاز واسم البائع'); return usSave(rec, await usForm({ ...rec, ...v })); }
  const dup = v.imei ? usDup(v.imei, rec.id) : '';
  if (dup && !(await sure('رقم IMEI هذا موجود مسبقاً في ' + dup + '. هل تتابع الحفظ؟', 'متابعة', false))) return usSave(rec, await usForm({ ...rec, ...v }));
  if (rec.id) { Object.assign(rec, v, { lb: S.me }); save(); render(); toast('تم التعديل'); return; }
  const o = { id: uid(), ...v, by: S.me, at: Date.now() };
  S.used.push(o); save(); render();
  toast('تم تسجيل الشراء', () => { S.used = S.used.filter(x => x.id != o.id); });
}
const usAdd = () => usForm({}).then(v => usSave({}, v));
function usEd(id) { const u = S.used.find(x => x.id == id); if (u) usForm(u).then(v => usSave(u, v)); }
function usDel(id) { const u = S.used.find(x => x.id == id); if (u) del('used', id, 'شراء ' + u.dev); }
function usInv(id) {
  const u = S.used.find(x => x.id == id); if (!u) return;
  $('sh').innerHTML = '';
  sheetOpen(v => { phDone(v, PR); if (v && v.add === undefined) { u.inv = 1; save(); render(); } });
  phForm({ name: u.dev, imei: u.imei || '', cond: 'مستعمل', cnt: 1 });
}
const usedCard = u => `<div class="card"><div class="row2"><b style="flex:1">${esc(u.dev)}</b>${u.price ? `<span class="cmp-pr">${esc(u.price)}</span>` : ''}</div>`
  + `<div class="m">البائع: ${esc(u.name)}${u.tel ? ' · ' + xTel(u.tel) : ''}</div>`
  + (u.imei ? `<div class="m">IMEI: <bdi>${esc(u.imei)}</bdi></div>` : '') + (u.note ? `<div class="m">${esc(u.note)}</div>` : '')
  + `<div class="m">${fd(u.at)} · ${esc(u.by || '')}${u.inv ? ' · ' + I('check') + ' أُدخل للمخزون' : ''}</div>`
  + `<div class="sub">${u.inv ? '' : `<button class="btn s sm" onclick="usInv('${u.id}')">إدخال للمخزون</button>`}<button class="btn s sm" onclick="usEd('${u.id}')">تعديل</button><button class="btn s sm" onclick="usDel('${u.id}')">حذف</button></div></div>`;
VW.usd = () => {
  const L = S.used.slice().sort((a, b) => b.at - a.at), n = nz(V.q || '');
  const F = n ? L.filter(u => nz([u.dev, u.name, u.tel, u.imei, u.note].join(' ')).includes(n)) : L;
  return {
    t: 'شراء المستعمل',
    h: `<button class="btn" onclick="usAdd()">+ تسجيل شراء هاتف مستعمل</button>`
      + `<input placeholder="ابحث بالاسم أو IMEI أو الموديل" value="${esc(V.q || '')}" oninput="V.q=this.value;usF()">`
      + `<div id="usl">${F.slice(0, 60).map(usedCard).join('') || '<p class="m">لا توجد سجلات</p>'}</div>`
  };
};
function usF() {
  const n = nz(V.q || ''), L = S.used.slice().sort((a, b) => b.at - a.at).filter(u => !n || nz([u.dev, u.name, u.tel, u.imei, u.note].join(' ')).includes(n));
  $('usl').innerHTML = L.slice(0, 60).map(usedCard).join('') || '<p class="m">لا توجد سجلات</p>';
}

/* ---------- الديون ---------- */
const dRem = d => Math.max(0, xn(d.amt) - (d.pays || []).reduce((a, p) => a + xn(p[1]), 0));
function dbtForm(rec) {
  return ask('دين جديد', [
    { k: 'name', l: 'اسم الزبون', v: rec.name || '' },
    { k: 'tel', l: 'الهاتف (اختياري)', v: rec.tel || '' },
    { k: 'amt', l: 'المبلغ', v: rec.amt || '' },
    { k: 'why', l: 'السبب', t: 'area', v: rec.why || '' }
  ]);
}
async function dbtSave(rec, v) {
  if (!v) return;
  v = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x || '').trim()]));
  if (!v.name || xn(v.amt) <= 0) { toast('اكتب الاسم ومبلغاً أكبر من صفر'); return dbtSave(rec, await dbtForm({ ...rec, ...v })); }
  const o = { id: uid(), ...v, amt: String(xn(v.amt)), pays: [], by: S.me, at: Date.now(), ...(rec.rp ? { rp: rec.rp } : {}) };
  S.debt.push(o);
  if (rec.rp) { const r = S.rp.find(x => x.id == rec.rp); if (r) r.debt = o.id; }
  save(); render(); toast('تم تسجيل الدين', () => { S.debt = S.debt.filter(x => x.id != o.id); if (rec.rp) { const r = S.rp.find(x => x.id == rec.rp); if (r) delete r.debt; } });
}
const dbtAdd = () => dbtForm({}).then(v => dbtSave({}, v));
function dbtFromRp(id) {
  const r = S.rp.find(x => x.id == id); if (!r) return;
  const rest = Math.max(0, xn(r.cap) - xn(r.paid));
  const rec = { name: r.name, tel: r.tel, amt: rest ? String(rest) : '', why: 'باقي إصلاح ' + (r.dev || ''), rp: r.id };
  dbtForm(rec).then(v => dbtSave(rec, v));
}
const dbtRp = r => {
  if (r.st != 'dn') return '';
  if (r.debt) return `<div class="m" style="color:#d97706;font-weight:700">${I('wallet')} سُجّل الباقي كدين</div>`;
  return xn(r.cap) > xn(r.paid) ? `<div class="sub"><button class="btn s sm" onclick="dbtFromRp('${r.id}')">${I('wallet')} تسجيل الباقي كدين</button></div>` : '';
};
function dbtPay(id) {
  const d = S.debt.find(x => x.id == id); if (!d) return;
  const rem = dRem(d);
  ask('دفعة من ' + d.name, [{ k: 'a', l: 'المبلغ المدفوع (الباقي ' + rem + ')', v: String(rem) }], 'تسجيل').then(v => {
    const a = v && xn(v.a); if (!a) return;
    const b = JSON.stringify(d);
    d.pays = [...(d.pays || []), [Date.now(), a, S.me]];
    if (dRem(d) <= 0) d.paid = Date.now();
    save(); render();
    toast(dRem(d) <= 0 ? 'سُدِّد الدين كاملاً' : 'بقي ' + dRem(d), () => { Object.assign(d, JSON.parse(b)); if (!JSON.parse(b).paid) delete d.paid; });
  });
}
function dbtDel(id) { const d = S.debt.find(x => x.id == id); if (d) del('debt', id, 'دين ' + d.name); }
const dbtCard = d => {
  const rem = dRem(d), open = !d.paid;
  return `<div class="card ${open ? '' : 'rp-ok'}"><div class="row2"><b style="flex:1">${esc(d.name)}</b><span class="cmp-pr">${open ? rem : '✓'}</span></div>`
    + (d.tel ? `<div class="m">${xTel(d.tel)}</div>` : '') + (d.why ? `<div class="m">${esc(d.why)}</div>` : '')
    + `<div class="m">${fd(d.at)} · ${esc(d.by || '')}${(d.pays || []).length ? ' · دفعات: ' + d.pays.length : ''}${open && rem < xn(d.amt) ? ' · من أصل ' + esc(d.amt) : ''}${d.paid ? ' · سُدِّد ' + fd(d.paid) : ''}</div>`
    + `<div class="sub">${open ? `<button class="btn sm" onclick="dbtPay('${d.id}')">تسجيل دفعة</button>` : ''}<button class="btn s sm" onclick="dbtDel('${d.id}')">حذف</button></div></div>`;
};
VW.dbt = () => {
  const tab = V.tab || 'o', O = S.debt.filter(d => !d.paid).sort((a, b) => b.at - a.at), P = S.debt.filter(d => d.paid).sort((a, b) => b.paid - a.paid).slice(0, 30);
  return {
    t: 'الديون',
    h: `<button class="btn" onclick="dbtAdd()">+ دين جديد</button>`
      + `<div><button class="tag ${tab == 'o' ? 'on' : ''}" onclick="V.tab='o';render()">مفتوحة (${O.length})</button><button class="tag ${tab == 'p' ? 'on' : ''}" onclick="V.tab='p';render()">المسدَّدة</button></div>`
      + ((tab == 'o' ? O : P).map(dbtCard).join('') || '<p class="m">لا توجد ديون</p>')
  };
};

/* ---------- الإحصائيات (بدون أي حسابات مالية) ---------- */
const stCnt = (arr, f) => { const m = {}; arr.forEach(x => { const k = f(x); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
const stBars = (L, none) => { const mx = Math.max(1, ...L.map(x => x[1])); return L.length ? L.map(([l, n]) => `<div class="brow"><span class="bl">${esc(l)}</span><div class="bt"><i style="width:${Math.round(n / mx * 100)}%"></i></div><b>${n}</b></div>`).join('') : `<p class="m">${none}</p>`; };
VW.stat = () => {
  const p = V.p ?? 30, since = p ? Date.now() - p * 864e5 : 0, rp = S.rp.filter(r => (r.t0 || 0) >= since);
  const F = stCnt(rp, r => String(r.fault || '').trim()).slice(0, 8);
  const Rq = {}; S.req.forEach(q => { const t = String(q.t || '').replace(/(?:\+?212|0)[\s\-]*[567](?:[\s\-]*\d){8}/g, '').replace(/[-–—:،.]/g, ' ').replace(/\s+/g, ' ').trim(), k = nz(t); if (k) { Rq[k] = Rq[k] || [t, 0]; Rq[k][1]++; } });
  const R = Object.values(Rq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 6 + i); return d; });
  const dk = t => new Date(t).toDateString(), nm = d => d.toLocaleDateString('ar-MA', { weekday: 'short' });
  const In = days.map(d => [nm(d), S.rp.filter(r => r.t0 && dk(r.t0) == d.toDateString()).length]), Out = days.map(d => [nm(d), S.rp.filter(r => r.t2 && dk(r.t2) == d.toDateString()).length]);
  return {
    t: 'إحصائيات',
    h: `<div>${[[7, 'أسبوع'], [30, 'شهر'], [90, '3 أشهر'], [0, 'الكل']].map(([v, l]) => `<button class="tag ${p == v ? 'on' : ''}" onclick="V.p=${v};render()">${l}</button>`).join('')}</div>`
      + `<h3>أكثر الأعطال تكراراً</h3><div class="card">${stBars(F, 'لا توجد صيانات في هذه المدة')}</div>`
      + `<h3>أكثر ما يطلبه الزبائن ولا نملكه</h3><div class="card">${stBars(R, 'لا توجد طلبات حالياً')}</div>`
      + `<h3>الصيانات المستلمة آخر 7 أيام</h3><div class="card">${stBars(In, '')}</div>`
      + `<h3>الصيانات المسلَّمة آخر 7 أيام</h3><div class="card">${stBars(Out, '')}</div>`
  };
};

/* ---------- التسجيل في الرئيسية والمزيد والبحث ---------- */
HOME.tools.push(() => `<div class="row2" style="margin:8px 0"><button class="btn s" style="flex:1;margin:0" onclick="go('usd')">${I('mobile')} شراء مستعمل</button><button class="btn s" style="flex:1;margin:0" onclick="go('dbt')">${I('wallet')} الديون${S.debt.filter(d => !d.paid).length ? ' (' + S.debt.filter(d => !d.paid).length + ')' : ''}</button></div>`);
MORE.push({ g: 'rep', o: 60, l: 'إحصائيات: الأعطال وطلبات الزبائن', fn: "go('stat')" });
SRCH.push(
  { k: 'used', l: 'مستعمل', run: n => S.used.filter(u => nz([u.dev, u.name, u.tel, u.imei, u.note].join(' ')).includes(n)).slice(0, 20).map(usedCard) },
  { k: 'debt', l: 'ديون', run: n => S.debt.filter(d => nz([d.name, d.tel, d.why].join(' ')).includes(n)).slice(0, 20).map(dbtCard) }
);
BCM.push(c => { const n = nz(c); return S.used.filter(u => u.imei && nz(u.imei).includes(n)).map(usedCard).join(''); });
