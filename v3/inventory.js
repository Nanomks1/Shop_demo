/* ============================================================
   inventory.js — المخزون: الهواتف، الأنتي كاس، البوشيط، الإكسسوارات
   (+ العرض المضغوط، كبسولات البوشيط وطيّ القوائم، الحجز، البيع السريع بالباركود، الجولة اليومية)
   يُحمَّل بعد core.js وقبل app.js. يسجّل نفسه في VW/HK/HOME/MORE/SRCH/LM.
   ============================================================ */

/* ---------- أيقونات إضافية للعرض المضغوط والبيع السريع ---------- */
Object.assign(IC, {
  rows: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  cards: '<rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
});

/* ---------- مساعدات ---------- */
const find = id => S.items.find(i => i.id == id);
const ph = () => S.items.filter(i => i.sec == 'phones');
const lim = k => S.cfg[k] ?? DL0[k];
const ci = v => Math.max(0, Math.floor(+v || 0));
const touch = i => { i.by = S.me; i.at = Date.now(); };
const sumv = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
S.fields = S.fields || []; S.gg = S.gg || []; S.ag = S.ag || [];
Object.assign(DL0, { gA: 30, gB: 20, gC: 10, gY: 5, acl: 3, agl: 10 });
LM.push(
  ['gA', 'أنتي كاس: أخضر غامق = أكثر من'], ['gB', 'أنتي كاس: أخضر = أكثر من'], ['gC', 'أنتي كاس: أخضر فاتح = أكثر من'],
  ['gY', 'أنتي كاس: «قليل» يُحسب كـ'], ['acl', 'إكسسوار بعدد: «قليل» عند عدد ≤'],
  ['agl', 'مجموعة إكسسوار (كابل/شاحن): «قارب النفاد» عند مجموع ≤']
);

/* ---------- طيّ القوائم الطويلة + وضع العرض المضغوط ---------- */
const EXP = {};   // حفظ حالة فتح القوائم المطوية أثناء الجلسة
function toggleExp(id) { EXP[id] = !EXP[id]; render(); }
/* البيع السريع: لهذا الجهاز فقط، وينطفئ وحده بعد 15 دقيقة بلا مسح */
const bcQ = () => !!S.cfg.bcQuick && Date.now() - S.cfg.bcQuick < 9e5;
const isCmp = s => !!((S.cfg.cmp || {})[s]);
function cmpTog(s) { upd(() => { S.cfg.cmp = S.cfg.cmp || {}; S.cfg.cmp[s] = S.cfg.cmp[s] ? 0 : 1; }); }

/* ---------- الحجز (بعدد): المحجوز يُخصم من المتاح ---------- */
const rsL = i => Array.isArray(i.res) ? i.res : (i.res && i.res.n ? [{ n: i.res.n, d: i.res.d || '', q: 1 }] : []);
const rsQ = i => rsL(i).reduce((a, r) => a + (+r.q || 1), 0);
const av = i => Math.max(0, (+i.cnt || 0) - rsQ(i));
const rsHtml = i => {
  const L = rsL(i); if (!L.length) return '';
  return `<div class="rs">محجوز ${rsQ(i)} من ${i.cnt}: ${L.map(r => esc(r.n) + ((+r.q || 1) > 1 ? ' ×' + r.q : '') + (r.d ? ' · عربون ' + esc(r.d) : '')).join('، ')}${av(i) <= 0 ? ' — كل القطع محجوزة' : ''}</div>`;
};

/* ---------- الألوان والترتيب ---------- */
const PAL = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#ef4444', '#64748b', '#84cc16'];
const DBC = { Samsung: '#3b82f6', Redmi: '#f97316', Xiaomi: '#eab308', Realme: '#facc15', Oppo: '#22c55e', Vivo: '#a855f7', Tecno: '#06b6d4', Infinix: '#84cc16', iPhone: '#64748b', Itel: '#ef4444' };
const DSC = { glass: '#06b6d4', case: '#a855f7', acc: '#84cc16' }, DCM = { phones: 'b', glass: 's', case: 's', acc: 's' };
const SN3 = { phones: 'الهواتف', glass: 'الأنتي كاس', case: 'البوشيط', acc: 'الإكسسوارات' }, MN = { b: 'حسب الماركة', s: 'لون واحد للقسم', o: 'بدون' };
const BC = b => b ? ((S.cfg.bcol || {})[b] ?? DBC[b] ?? '') : '';
const SCOL = s => (S.cfg.scol || {})[s] ?? DSC[s] ?? '';
const CM = s => (S.cfg.cm || {})[s] ?? DCM[s];
const brOfName = n => { const z = nz(n); return [...S.tags.brand].sort((a, b) => b.length - a.length).find(t => z.includes(nz(t))) || ''; };
const colOf = i => { const s = i.sec; if (!s || s == 'glass') return ''; const m = CM(s); if (m == 'o') return ''; if (m == 's') return SCOL(s); return BC(s == 'phones' ? i.brand : s == 'case' ? brOfName(i.name) : ''); };
const colG = g => { const m = CM('glass'); if (m == 'o') return ''; if (m == 's') return SCOL('glass'); return BC(Object.values(g.br || {})[0]); };
const cardH = (h, c, cls = '') => `<div class="card${cls ? ' ' + cls : ''}"${c ? ` style="background:color-mix(in srgb,${c} 15%,var(--c))"` : ''}>${h}</div>`;

const SOL = { phones: [['n', 'الماركة'], ['d', 'الأحدث'], ['l', 'الأقل']] };
['glass', 'case', 'acc'].forEach(s => SOL[s] = [['n', 'الاسم'], ['d', 'الأحدث'], ['l', 'الأقل']]);
const SO = s => (S.cfg.so || {})[s] || 'n';
const sortBar = s => {
  const canCmp = s != 'glass', cm = isCmp(s);
  return `<div class="stk-bar"><div class="row2" style="flex-wrap:wrap;gap:4px"><span class="m" style="font-size:.82rem;margin-inline-end:4px">ترتيب:</span>`
    + SOL[s].map(([k, l]) => `<button class="tag ${SO(s) == k ? 'on' : ''}" style="margin:0;padding:5px 11px;font-size:.84rem" onclick="soSet('${s}','${k}')">${l}</button>`).join('')
    + (canCmp ? `<button class="tag ${cm ? 'on' : ''}" style="margin:0;margin-inline-start:auto;padding:5px 11px;font-size:.84rem" onclick="cmpTog('${s}')">${I(cm ? 'cards' : 'rows')} ${cm ? 'مفصل' : 'مضغوط'}</button>` : '')
    + `</div></div>`;
};
function soSet(s, k) { upd(() => { S.cfg.so = S.cfg.so || {}; S.cfg.so[s] = k; }); }
const srt = (a, s, nm, lo, at) => { const k = SO(s); return [...a].sort((x, y) => k == 'd' ? (at(y) || 0) - (at(x) || 0) : k == 'l' ? (lo(x) - lo(y)) || String(nm(x)).localeCompare(String(nm(y))) : String(nm(x)).localeCompare(String(nm(y)))); };

/* ---------- إظهار/إخفاء الحقول في النماذج (يضبطه المدير) ---------- */
const FLD = {
  phones: [['color', 'اللون'], ['ram', 'RAM'], ['cap', 'السعة'], ['cond', 'الحالة'], ['price', 'السعر'], ['imei', 'IMEI'], ['note', 'الملاحظة'], ['res', 'زر الحجز']],
  acc: [['conn', 'الموصل'], ['tier', 'الفئة'], ['brand', 'الماركة'], ['price', 'السعر'], ['cnt', 'العدد'], ['lim', 'الحد'], ['note', 'الملاحظة']]
};
const FLDN = { phones: 'الهواتف', acc: 'الإكسسوارات' };   // ملف الصيانة يضيف FLD.rp و FLDN.rp
const hd = (s, k) => ((S.cfg.hide || {})[s] || {})[k];
const shown = (s, k) => !hd(s, k);
const hh = (s, k) => hd(s, k) ? ' hidden' : '';
function fTog(s, k) { if (!can('fields')) return toast('للمدير فقط'); upd(() => { S.cfg.hide = S.cfg.hide || {}; const h = S.cfg.hide[s] = S.cfg.hide[s] || {}; h[k] = h[k] ? 0 : 1; }); }
VW.st_fld = () => ({
  t: 'الحقول في النماذج',
  h: (can('fields') ? '<p class="m">الأزرق = ظاهر. اضغط لإخفاء الحقل أو إظهاره.</p>' : '<p class="m">التعديل للمدير فقط.</p>')
    + Object.keys(FLD).map(s => `<h3>${FLDN[s] || s}</h3><div>${FLD[s].map(([k, l]) => `<button class="tag ${hd(s, k) ? '' : 'on'}" onclick="fTog('${s}','${k}')">${l}</button>`).join('')}</div>`).join('')
});

/* ---------- الخانات المخصصة (حقول إضافية بخيارات لكل قسم) ---------- */
const SECN = { phones: 'الهواتف', acc: 'الإكسسوارات', case: 'البوشيط', rp: 'الصيانة' };
const fxList = (sec, key) => S.fields.filter(f => f.sec == sec && (!f.kinds || !f.kinds.length || f.kinds.includes(key)));
const fxVal = (i, f) => [].concat((i.x || {})[f.id] || []).filter(Boolean);
const fxTxt = i => S.fields.map(f => fxVal(i, f).length ? f.name + ' ' + fxVal(i, f).join(' ') : '').join(' ');
const fxShow = i => { const p = S.fields.map(f => fxVal(i, f).length ? f.name + ': ' + fxVal(i, f).join('، ') : '').filter(Boolean); return p.length ? `<div class="m">${I('tag')} ${esc(p.join(' · '))}</div>` : ''; };

/* ---------- حالة النموذج المفتوح + أزرار الوسوم (مشتركة بين كل النماذج) ---------- */
let FS = { v: {}, add: '', defs: [], fx: {}, fxA: '', fxSec: '', cond: 0 }, PR = null;
function fsInit(defs, v, sec, rec, cond) { FS = { v: { ...v }, add: '', defs, fx: { ...((rec && rec.x) || {}) }, fxA: '', fxSec: sec || '', cond: cond ? 1 : 0 }; }
function chipsR() {
  const b = $('cc'); if (!b) return;
  b.innerHTML = FS.defs.filter(d => !d[2] || d[2]()).map(([g, l]) => `<label>${l}</label><div>${S.tags[g].map((t, j) => `<button type="button" class="tag ${FS.v[g] == t ? 'on' : ''}" onclick="chPick('${g}',${j})">${esc(t)}</button>`).join('')}${FS.add == g ? `<span class="row2"><input id="chn" placeholder="الاسم الجديد"><button type="button" class="btn sm" onclick="chOk('${g}')">إضافة</button></span>` : `<button type="button" class="tag" onclick="FS.add='${g}';chipsR()">+ جديد</button>`}</div>`).join('')
    + (FS.cond ? `<label>الحالة</label><div>${['جديد', 'مستعمل'].map(c => `<button type="button" class="tag ${FS.v.cond == c ? 'on' : ''}" onclick="FS.v.cond='${c}';chipsR()">${c}</button>`).join('')}</div>` : '');
  fxR();
}
function chPick(g, j) { const v = S.tags[g][j]; FS.v[g] = FS.v[g] == v ? '' : v; chipsR(); }
function chOk(g) { const t = ($('chn').value || '').trim(); if (t) { if (!S.tags[g].includes(t)) S.tags[g].push(t); FS.v[g] = t; save(); } FS.add = ''; chipsR(); }
const fxKey = () => FS.fxSec == 'acc' ? FS.v.kind : FS.fxSec == 'phones' ? FS.v.brand : '';
function fxR() {
  const b = $('fx'); if (!b) return;
  b.innerHTML = fxList(FS.fxSec, fxKey()).map(f => { const v = [].concat(FS.fx[f.id] || []); return `<label>${esc(f.name)}</label><div>${f.opts.map((o, j) => `<button type="button" class="tag ${v.includes(o) ? 'on' : ''}" onclick="fxT('${f.id}',${j})">${esc(o)}</button>`).join('')}${FS.fxA == f.id ? `<span class="row2"><input id="fxn" placeholder="خيار جديد"><button type="button" class="btn sm" onclick="fxN('${f.id}')">إضافة</button></span>` : `<button type="button" class="tag" onclick="FS.fxA='${f.id}';fxR()">+ جديد</button>`}</div>`; }).join('');
}
function fxT(id, j) { const f = S.fields.find(x => x.id == id), o = f.opts[j], a = [].concat(FS.fx[id] || []); FS.fx[id] = f.multi ? (a.includes(o) ? a.filter(x => x != o) : [...a, o]) : (a[0] == o ? '' : o); fxR(); }
function fxN(id) { const f = S.fields.find(x => x.id == id), v = ($('fxn').value || '').trim(); FS.fxA = ''; if (v && !f.opts.includes(v)) { f.opts.push(v); save(); } if (v) { const a = [].concat(FS.fx[id] || []); FS.fx[id] = f.multi ? [...a, v] : v; } fxR(); }
function fxOpen(sec, rec) {   // يُستعمل أيضاً من نموذج الصيانة
  const a = $('sh').querySelector('.acts'); if (!a || !S.fields.some(f => f.sec == sec)) return;
  FS.fxSec = sec; FS.fx = { ...((rec && rec.x) || {}) }; FS.fxA = '';
  if (!$('fx')) a.insertAdjacentHTML('beforebegin', '<div id="fx"></div>');
  fxR();
}
const fxAtt = v => { if (FS.fxSec && v && typeof v == 'object') v.x = { ...FS.fx }; return v; };
const moreBtn = fn => `<button class="btn s" onclick="${fn}(1)">حفظ وإضافة آخر</button>`;
const nzText = i => hay(i) + ' ' + fxTxt(i) + ' ' + (i.imei || '') + ' ' + (i.code || '') + ' ' + (i.pw || '');
const hay = i => [i.brand, i.name, i.color, i.ram, i.cap, i.note, i.kind, i.conn, i.tier, (i.v || []).map(x => x.g + x.c).join(' ')].join(' ');

/* ============================ الهواتف ============================ */
const phLim = i => (S.cfg.bl || {})[i.brand] ?? lim('low');
const phSt = i => { const c = av(i); return c <= 0 ? 'r' : c <= phLim(i) ? 'y' : 'g'; };
const stkL = () => ph().filter(i => i.cnt > 0).sort((a, b) => (a.brand + a.name).localeCompare(b.brand + b.name));
const stkN = i => [i.brand, i.name, i.color, i.ram, i.cap].filter(Boolean).join(' ');
function phCard(i) {
  const s = phSt(i), t = [i.color, i.ram, i.cap, i.cond && i.cond != 'جديد' && i.cond].filter(Boolean).map(esc).join(' · ');
  if (isCmp('phones') && V.v == 'sec') {
    return cardH(`<div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="phEd('${i.id}')"><b>${esc(i.brand + ' ' + i.name)}</b>${t ? `<div class="m">${t}${rsQ(i) ? ' · محجوز ' + rsQ(i) : ''}</div>` : ''}</div>${i.price ? `<span class="cmp-pr">${esc(i.price)}</span>` : ''}<button class="btn s sm" onclick="phC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="phC('${i.id}',1)">+</button></div>`, colOf(i), 'cmp');
  }
  return cardH(`<div class="row2"><b>${esc(i.brand + ' ' + i.name)}</b><span class="dotl" style="background:${DT[s]}"></span><span class="m">${TX[s]}</span></div>${t ? `<div class="m">${t}</div>` : ''}${i.imei ? `<div class="m">IMEI: <bdi>${esc(i.imei)}</bdi></div>` : ''}${rsHtml(i)}${fxShow(i)}${i.note ? `<div class="m">${esc(i.note)}</div>` : ''}`
    + `<div class="row2" style="margin-top:8px"><b>${esc(i.price)}</b><button class="btn s sm" onclick="phC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="phC('${i.id}',1)">+</button></div>`
    + `<div class="sub"><button class="btn s sm" onclick="phEd('${i.id}')">تعديل</button>${shown('phones', 'res') ? `<button class="btn s sm" onclick="phRs('${i.id}')">حجز${rsQ(i) ? ' (' + rsQ(i) + ')' : ''}</button>` : ''}${(i.log || []).length ? `<button class="btn s sm" onclick="lgOpen('${i.id}')">السجل</button>` : ''}</div>`, colOf(i));
}
function phView() {
  let a = srt(ph(), 'phones', i => i.brand + ' ' + i.name, i => i.cnt, i => i.at); if (V.f) a = a.filter(i => phSt(i) != 'g');
  return { t: 'الهواتف', h: `<button class="btn" onclick="phAdd()">+ إضافة هاتف</button><div><button class="tag ${V.f ? '' : 'on'}" onclick="V.f=0;render()">الكل (${ph().length})</button><button class="tag ${V.f ? 'on' : ''}" onclick="V.f=1;render()">يحتاج شراء</button></div>` + sortBar('phones') + (a.map(phCard).join('') || '<p class="m">لا شيء بعد</p>') };
}
function phC(id, d) {
  const i = find(id);
  if (d < 0 && rsQ(i) > 0 && av(i) <= 0) return toast('كل القطع محجوزة: سلّم الحجز أو ألغِه أولاً');
  upd(() => { i.cnt = Math.max(0, i.cnt + d); touch(i); });
}
/* الإضافة: ابحث أولاً، فإن وُجد الهاتف أضف الكمية بدل إعادة الكتابة */
let PQ = '';
function phAdd() {
  PR = null; $('sh').innerHTML = `<div class="bar"></div><h3>إضافة هاتف</h3><label>ابحث أولاً: ماركة أو موديل<input id="pf" oninput="phF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(v => phDone(v, PR)); phF('');
}
function phF(q) {
  PQ = q.trim(); const n = nz(q), m = ph().filter(i => !n || nz(i.brand + i.name + i.color).includes(n)).sort((a, b) => b.at - a.at).slice(0, 6);
  $('pr').innerHTML = m.map(i => `<button class="card row2" onclick="phPick('${i.id}')"><b>${esc(i.brand + ' ' + i.name)}</b><span class="m">${esc([i.color, i.cap].filter(Boolean).join(' · '))} · ${i.cnt}</span></button>`).join('') + `<button class="btn" onclick="phForm({name:PQ})">+ هاتف جديد${PQ ? ' «' + esc(PQ) + '»' : ''}</button>`;
}
function phPick(id) {
  const i = find(id); PR = i;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(i.brand + ' ' + i.name)}</h3><p class="m">${esc([i.color, i.ram, i.cap].filter(Boolean).join(' · '))} — الكمية الحالية ${i.cnt}</p><label>كم قطعة وصلت؟<input id="pa" type="number" value="1"></label><div class="acts"><button class="btn s" onclick="phForm(find('${id}'))">تعديل التفاصيل</button><button class="btn" onclick="phAddQty()">إضافة الكمية</button></div>`;
}
function phAddQty() { const n = ci($('pa').value); if (!n) return toast('اكتب عدداً أكبر من صفر'); finish({ add: n }); }
function phEd(id) { const r = find(id); $('sh').innerHTML = ''; sheetOpen(v => phDone(v, r)); phForm(r); }
function phForm(rec) {
  PR = rec; const ed = !!rec.id;
  fsInit([['brand', 'الماركة'], ['color', 'اللون', () => shown('phones', 'color')], ['ram', 'RAM', () => shown('phones', 'ram')], ['cap', 'السعة', () => shown('phones', 'cap')]],
    { brand: rec.brand || '', color: rec.color || '', ram: rec.ram || '', cap: rec.cap || '', cond: rec.cond || 'جديد' }, 'phones', rec, shown('phones', 'cond'));
  $('sh').innerHTML = `<div class="bar"></div><h3>${ed ? 'تعديل هاتف' : 'هاتف جديد'}</h3><div id="cc"></div><label>الموديل<input id="pm" value="${esc(rec.name || '')}" placeholder="مثال: A07"></label>`
    + `<label${hh('phones', 'price')}>السعر<input id="pp" type="tel" value="${esc(rec.price || '')}" ${ed && !can('price') ? 'disabled' : ''}></label><label>العدد<input id="pcnt" type="number" value="${rec.cnt ?? 1}"></label>`
    + `<label${hh('phones', 'imei')}>IMEI / الرقم التسلسلي (اختياري)<div class="row2" style="margin-top:4px"><input id="pimei" value="${esc(rec.imei || '')}" placeholder="امسح الباركود أو اكتب الرقم" style="flex:1"><button type="button" class="btn s sm" onclick="scanIntoInput('pimei')">${I('scan')} مسح</button></div></label>`
    + `<div id="fx"></div><label${hh('phones', 'note')}>ملاحظة<textarea id="pt">${esc(rec.note || '')}</textarea></label>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="phSave()">حفظ</button></div>`
    + (ed ? '' : moreBtn('phSave')) + (ed && S.items.includes(rec) && can('del') ? `<button class="btn s" style="color:#dc2626;margin-top:10px" onclick="phDelF('${rec.id}')">حذف هذا الهاتف</button>` : '');
  chipsR();
}
function phSave(more) {
  const n = $('pm').value.trim(), b = FS.v.brand; if (!b || !n) return toast('اختر الماركة واكتب الموديل');
  const c = ci($('pcnt').value), q = PR && PR.id ? rsQ(PR) : 0; if (c < q) return toast('العدد أقل من المحجوز (' + q + ')');
  finish(fxAtt({ brand: b, name: n, color: FS.v.color || '', ram: FS.v.ram || '', cap: FS.v.cap || '', cond: FS.v.cond || 'جديد', price: $('pp').value.trim(), cnt: c, note: $('pt').value.trim(), imei: $('pimei').value.trim(), _more: more ? 1 : 0 }));
}
function phDone(v, r) {
  if (!v) return; const more = v._more; delete v._more;
  if (v.add !== undefined) { commit('أُضيفت الكمية', () => { r.cnt += v.add; touch(r); }); return; }
  if (r && r.id && S.items.includes(r)) { commit('تم التعديل', () => { Object.assign(r, v); touch(r); }); return; }
  const code = r && r.code || '', d = ph().find(i => i.brand == v.brand && nz(i.name) == nz(v.name) && i.color == v.color && i.ram == v.ram && i.cap == v.cap && i.cond == v.cond);
  commit(d ? 'أُضيفت الكمية للموجود' : 'تمت الإضافة', () => {
    if (d) { d.cnt += v.cnt; if (v.price) d.price = v.price; if (v.imei) d.imei = d.imei ? (d.imei.includes(v.imei) ? d.imei : d.imei + ' · ' + v.imei) : v.imei; if (code && !d.code) d.code = code; if (v.x) d.x = { ...(d.x || {}), ...v.x }; touch(d); }
    else { const o = { id: uid(), sec: 'phones', ...v }; if (code) o.code = code; touch(o); S.items.push(o); }
  });
  if (more) setTimeout(phAdd, 350);
}
function phDelF(id) { finish(null); setTimeout(() => { const i = find(id); if (i) del('items', id, i.brand + ' ' + i.name); }, 450); }

/* الحجز: قائمة الحجوزات + حجز جديد + تسليم/إلغاء */
function phRs(id) { sheetOpen(rsCb); rsList(id); }
function rsList(id) {
  const i = find(id), L = rsL(i);
  $('sh').innerHTML = `<div class="bar"></div><h3>حجوزات ${esc(i.brand + ' ' + i.name)}</h3><p class="m">العدد ${i.cnt} · محجوز ${rsQ(i)} · متاح ${av(i)}</p>`
    + (L.length ? L.map((r, k) => `<div class="card"><b>${esc(r.n)} × ${+r.q || 1}${r.d ? ' · عربون ' + esc(r.d) : ''}</b><div class="sub"><button class="btn sm" onclick="finish({id:'${id}',k:${k},sold:1})">سُلِّم للزبون</button><button class="btn s sm" onclick="finish({id:'${id}',k:${k}})">إلغاء الحجز</button></div></div>`).join('') : '<p class="m">لا حجوزات</p>')
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button>${av(i) > 0 ? `<button class="btn" onclick="rsForm('${id}')">+ حجز جديد</button>` : ''}</div>`;
}
function rsForm(id) {
  const i = find(id);
  $('sh').innerHTML = `<div class="bar"></div><h3>حجز جديد — ${esc(i.brand + ' ' + i.name)}</h3><p class="m">المتاح للحجز: ${av(i)}</p><label>اسم الزبون<input id="rn"></label><label>عدد القطع<input id="rq" type="number" value="1"></label><label>العربون (اختياري)<input id="rd" type="tel"></label><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="rsSave('${id}')">حفظ الحجز</button></div>`;
}
function rsSave(id) {
  const i = find(id), n = $('rn').value.trim(), q = ci($('rq').value), d = $('rd').value.trim();
  if (!n) return toast('اكتب اسم الزبون'); if (!q) return toast('اكتب عدداً أكبر من صفر'); if (q > av(i)) return toast('المتاح للحجز ' + av(i) + ' فقط');
  finish({ id, add: { n, q, d } });
}
function rsCb(v) {
  if (!v) return; const i = find(v.id); if (!i) return;
  if (v.add) return commit('تم الحجز', () => { i.res = [...rsL(i), v.add]; });
  const L = rsL(i), r = L[v.k]; if (!r) return;
  commit(v.sold ? 'سُلِّم الحجز' : 'أُلغي الحجز', () => { const R = L.filter((_, k) => k != v.k); i.res = R.length ? R : null; if (v.sold) { i.cnt = Math.max(0, i.cnt - (+r.q || 1)); touch(i); } });
}

/* سجل الحركات (آخر 20 حركة للهواتف والإكسسوارات ذات العدد) + دمج الوسوم المكررة — يعملان قبل كل حفظ */
const LGB = {}; let LGI = 0;
function lgScan() {
  S.items.forEach(i => {
    if (i.sec != 'phones' && i.sec != 'acc') return; const t = typeof i.cnt == 'number' ? i.cnt : null; if (t === null) return;
    if (!(i.id in LGB)) { LGB[i.id] = t; if (LGI && t > 0 && !(i.log && i.log.length)) i.log = [[i.at || Date.now(), i.by || S.me || '', t, t]]; return; }
    if (LGB[i.id] === t) return;
    const last = (i.log || []).slice(-1)[0];
    if (!last || last[3] !== t) i.log = [...(i.log || []), [i.at || Date.now(), i.by || S.me || '', t - LGB[i.id], t]].slice(-20);
    LGB[i.id] = t;
  });
}
function lgOpen(id) {
  const i = find(id); if (!i) return; const nm = i.sec == 'phones' ? i.brand + ' ' + i.name : acName(i), L = (i.log || []).slice().reverse();
  $('sh').innerHTML = `<div class="bar"></div><h3>سجل ${esc(nm)}</h3>` + (L.map(([t, u, d, c]) => `<div class="card"><b>${d > 0 ? '+' + d : d}</b> ← العدد ${c}<div class="m">${esc(u || '—')} · ${fd(t)}</div></div>`).join('') || '<p class="m">لا حركات بعد</p>') + '<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>';
  sheetOpen(() => { });
}
const TKEY = x => String(x ?? '').toLowerCase().replace(/[\s\-_.]/g, '');
function tagFix() {
  ['brand', 'color', 'cap', 'ram'].forEach(g => {
    const a = S.tags && S.tags[g]; if (!Array.isArray(a)) return;
    const keep = {}, out = [], map = {};
    a.forEach(x => { const k = TKEY(x); if (!k) return; if (keep[k] === undefined) { keep[k] = x; out.push(x); } else if (keep[k] !== x) map[x] = keep[k]; });
    if (out.length === a.length) return; S.tags[g] = out;
    S.items.forEach(i => { if (map[i[g]] !== undefined) i[g] = map[i[g]]; if (g == 'color' && Array.isArray(i.v)) i.v.forEach(x => { if (map[x.c] !== undefined) x.c = map[x.c]; }); });
    if (g == 'brand') ['bcol', 'bl'].forEach(c => { const o = S.cfg && S.cfg[c]; if (!o) return; Object.keys(map).forEach(x => { if (o[x] !== undefined) { if (o[map[x]] === undefined) o[map[x]] = o[x]; delete o[x]; } }); });
  });
}
HK.save.push(() => { tagFix(); lgScan(); S.items.forEach(i => { delete i._nz; delete i._nzV; }); });
lgScan(); LGI = 1;

/* ============================ الأنتي كاس ============================ */
const gOf = m => S.gg.find(g => g.models.some(x => nz(x) == nz(m)));
const gitem = (gid, ty) => S.items.find(i => i.sec == 'glass' && i.gid == gid && i.ty == ty);
const GT = () => ({ a: lim('gA'), b: lim('gB'), c: lim('gC'), y: lim('gY') });
const LC = { a: '#15803d', b: '#22c55e', c: '#86efac', y: '#d97706', r: '#dc2626' };
const lvN = l => l == 'r' ? 0 : (GT()[l] || 0);
const mval = (i, m) => { const l = (i.lv || {})[m]; return l !== undefined ? lvN(l) : ((i.stock || {})[m] || 0); };
const gTot = (i, g) => g.models.reduce((a, m) => a + mval(i || {}, m), 0);
const gEst = (i, g) => !!i && g.models.some(m => (i.lv || {})[m] !== undefined);
const gSt = (i, g) => { const t = gTot(i, g), m = (i && i.min) ?? lim('gmin'); return t <= 0 ? 'r' : t < m ? 'y' : 'g'; };
function glGet(gid, ty) { let i = gitem(gid, ty); if (!i) { i = { id: uid(), sec: 'glass', gid, ty, stock: {}, lv: {}, by: S.me, at: Date.now() }; S.items.push(i); } i.stock = i.stock || {}; return i; }
function glView() {
  const j = V.ty || 0, ty = S.tags.glass[j], it = g => gitem(g.id, ty);
  const a = srt(S.gg, 'glass', g => g.models[0] || '', g => { const i = it(g); return i ? gTot(i, g) : 0; }, g => { const i = it(g); return i ? i.at : 0; });
  return { t: 'الأنتي كاس', h: `<button class="btn" onclick="glAdd()">+ إضافة موديل</button><div>${S.tags.glass.map((t, k) => `<button class="tag ${k == j ? 'on' : ''}" onclick="V.ty=${k};render()">${esc(t)}</button>`).join('')}</div>` + sortBar('glass') + (a.map(g => glCard(g, j)).join('') || '<p class="m">أضف أول موديل لتبدأ المجموعات.</p>') };
}
function glRow(g, i, j, k, m) {
  const lv = (i.lv || {})[m], ex = lv === undefined && (i.stock || {})[m] !== undefined, T = GT(), br = (g.br || {})[m];
  const dots = [['a', T.a + '+'], ['b', T.b + '+'], ['c', T.c + '+'], ['y', 'قليل'], ['r', 'نفد']].map(([l, t]) => `<button class="lvb ${lv == l ? 'on' : ''}" style="--lc:${LC[l]};--lt:${l == 'c' ? '#14532d' : '#fff'}" onclick="glLv('${g.id}',${j},${k},'${l}')">${t}</button>`).join('');
  const hd2 = ex ? `<button class="btn s sm" onclick="glC('${g.id}',${j},${k},-1)">−</button><span class="cn">${i.stock[m]}</span><button class="btn sm" onclick="glC('${g.id}',${j},${k},1)">+</button>` : `<span class="m">${lv !== undefined ? '≈' + lvN(lv) : ''}</span><button class="btn s sm" onclick="glEx('${g.id}',${j},${k})">عدد دقيق</button>`;
  return `<div class="gm"><div class="row2"><span style="flex:1">${esc(m)}${br ? ` <span class="m">· ${esc(br)}</span>` : ''}</span>${hd2}</div><div class="lvs">${dots}</div></div>`;
}
function glCard(g, j) {
  const ty = S.tags.glass[j], i = gitem(g.id, ty) || { stock: {} }, s = gSt(i, g), min = i.min ?? lim('gmin');
  const ex = EXP['g_' + g.id], limM = !ex && g.models.length > 4 ? g.models.slice(0, 3) : g.models;
  const more = g.models.length > 4 ? `<button class="tag" style="width:100%;justify-content:center;margin-top:6px" onclick="toggleExp('g_${g.id}')">${ex ? 'طيّ القائمة ▴' : 'عرض باقي الموديلات (+' + (g.models.length - 3) + ') ▾'}</button>` : '';
  return cardH(`<b>${esc(g.models.join(' / '))}</b><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><span class="m">${TX[s]} · المجموع ${gEst(i, g) ? '≈' : ''}${gTot(i, g)} · الحد ${min}${i.price ? ' · ' + esc(i.price) : ''}</span></div>`
    + limM.map((m, k) => glRow(g, i, j, k, m)).join('') + more
    + `<div class="sub"><button class="btn s sm" onclick="glM('${g.id}')">+ موديل مطابق</button><button class="btn s sm" onclick="glMin('${g.id}',${j})">الحد والسعر</button><button class="btn s sm" onclick="glRm('${g.id}')">حذف موديل</button></div>`, colG(g));
}
function glB(g) {   // بطاقة نتيجة البحث: كل أنواع الزجاج للمجموعة
  return cardH(`<b>زجاج يطابق: ${esc(g.models.join(' / '))}</b>` + S.tags.glass.map(t => { const i = gitem(g.id, t), s = i ? gSt(i, g) : 'r'; return `<div class="row2"><span class="dotl" style="background:${DT[s]}"></span><span style="flex:1">${esc(t)}</span><span class="m">${i ? (gEst(i, g) ? '≈' : '') + gTot(i, g) : 0}</span></div>`; }).join(''), colG(g));
}
function glC(gid, j, k, d) { const m = S.gg.find(x => x.id == gid).models[k], i = glGet(gid, S.tags.glass[j]); upd(() => { i.stock[m] = Math.max(0, (i.stock[m] || 0) + d); touch(i); }); }
function glLv(gid, j, k, l) { const m = S.gg.find(x => x.id == gid).models[k], i = glGet(gid, S.tags.glass[j]); upd(() => { i.lv = i.lv || {}; i.lv[m] = l; delete i.stock[m]; touch(i); }); }
function glEx(gid, j, k) {
  const m = S.gg.find(x => x.id == gid).models[k], i0 = gitem(gid, S.tags.glass[j]) || {};
  ask('عدد دقيق — ' + m, [{ k: 'n', l: 'العدد', t: 'tel', v: mval(i0, m) }]).then(v => { if (!v || v.n.trim() === '') return; const i = glGet(gid, S.tags.glass[j]); upd(() => { i.stock[m] = ci(v.n); if (i.lv) delete i.lv[m]; touch(i); }); });
}
function glMin(gid, j) {
  const ty = S.tags.glass[j], i = gitem(gid, ty) || {};
  ask('الحد والسعر — ' + ty, [{ k: 'm', l: 'الحد الأدنى للمجموعة', t: 'tel', v: i.min ?? lim('gmin') }, { k: 'p', l: 'السعر', t: 'tel', v: i.price || '' }]).then(v => { if (!v) return; const r = glGet(gid, ty); upd(() => { r.min = ci(v.m); if (can('price')) r.price = v.p; }); });
}
const clrM = n => S.items.forEach(i => { if (i.sec == 'glass' && i.lv) delete i.lv[n]; });
let GS = {};
function glAdd() {
  GS = {}; fsInit([['brand', 'الماركة']], {});
  $('sh').innerHTML = `<div class="bar"></div><h3>موديل جديد</h3><label>اسم الموديل<input id="gn"></label><div id="cc"></div><button class="btn" onclick="glNext()">التالي</button>`;
  sheetOpen(() => { }); chipsR();
}
function glNext() {
  const n = $('gn').value.trim(); if (!n) return; if (gOf(n)) return toast('هذا الموديل مسجل');
  GS.n = n; GS.b = FS.v.brand || '';
  $('sh').innerHTML = `<div class="bar"></div><h3>«${esc(n)}» يطابق أي موديل؟</h3><label>ابحث بين الموديلات<input oninput="glS(this.value)"></label><div id="gl"></div><button class="btn s" onclick="glNew()">لا يطابق شيئاً (مجموعة جديدة)</button>`; glS('');
}
function glS(q) {
  const k = nz(q);
  $('gl').innerHTML = S.gg.flatMap(g => g.models.map(m => ({ g, m }))).filter(x => !k || nz(x.m).includes(k)).slice(0, 8).map(x => `<button class="card row2" onclick="glJoin('${x.g.id}')"><b>${esc(x.m)}</b><span class="m">${x.g.models.length} موديلات</span></button>`).join('');
}
function glJoin(gid) { const g = S.gg.find(x => x.id == gid); upd(() => { clrM(GS.n); g.models.push(GS.n); if (GS.b) { g.br = g.br || {}; g.br[GS.n] = GS.b; } }); finish(null); }
function glNew() { upd(() => { clrM(GS.n); const g = { id: uid(), models: [GS.n] }; if (GS.b) g.br = { [GS.n]: GS.b }; S.gg.push(g); }); finish(null); }
function glM(gid) {
  const g = S.gg.find(x => x.id == gid); fsInit([['brand', 'الماركة (اختياري)']], {});
  $('sh').innerHTML = `<div class="bar"></div><h3>موديل مطابق</h3><label>الاسم<input id="gmn"></label><div id="cc"></div><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="finish({n:$('gmn').value.trim(),b:FS.v.brand||''})">حفظ</button></div>`;
  sheetOpen(v => {
    if (!v || !v.n) return; const n = v.n, o = gOf(n); if (o && o.id == gid) return toast('موجود في المجموعة');
    const add = () => { clrM(n); g.models.push(n); if (v.b) { g.br = g.br || {}; g.br[n] = v.b; } };
    if (!o) return upd(add);
    sure('«' + n + '» في مجموعة أخرى. دمج المجموعتين؟', 'دمج', false).then(y => { if (y) upd(() => glMerge(g, o)); });
  });
  chipsR();
}
function glMerge(a, b) {   // دمج المجموعة b في a: الأعداد تُجمع، والمستويات والحد والسعر لا تضيع
  S.items = S.items.filter(i => {
    if (i.sec != 'glass' || i.gid != b.id) return true;
    const t = gitem(a.id, i.ty); if (!t) { i.gid = a.id; return true; }
    t.stock = t.stock || {}; for (const m in (i.stock || {})) t.stock[m] = (t.stock[m] || 0) + i.stock[m];
    if (i.lv) { t.lv = t.lv || {}; Object.assign(t.lv, i.lv); }
    if (t.min == null && i.min != null) t.min = i.min; if (!t.price && i.price) t.price = i.price; return false;
  });
  b.models.forEach(m => a.models.push(m)); if (b.br) a.br = Object.assign(a.br || {}, b.br);
  S.gg = S.gg.filter(x => x != b);
}
function glRm(gid) {
  const g = S.gg.find(x => x.id == gid);
  ask('حذف موديل من المجموعة', [{ k: 'm', l: 'الموديل', t: 'sel', o: g.models, v: g.models[0] }], 'حذف', true).then(v => {
    if (!v) return; if (!can('del')) return toast('الحذف للمدير فقط');
    sure('حذف «' + v.m + '» ؟').then(y => {
      if (!y) return;
      commit('تم حذف الموديل', () => {
        g.models = g.models.filter(m => m != v.m); if (g.br) delete g.br[v.m];
        S.items.filter(i => i.sec == 'glass' && i.gid == gid).forEach(i => { delete (i.stock || {})[v.m]; if (i.lv) delete i.lv[v.m]; });
        if (!g.models.length) { S.trash.push({ id: uid(), coll: 'gg', obj: { ...g, models: [v.m] }, label: 'أنتي كاس: ' + v.m, t: Date.now() }); S.gg = S.gg.filter(x => x != g); S.items = S.items.filter(i => !(i.sec == 'glass' && i.gid == gid)); }
      });
    });
  });
}
const gl2 = i => { const g = S.gg.find(x => x.id == i.gid); return g ? `<div class="card"><b>زجاج ${esc(i.ty)}: ${esc(g.models.join(' / '))}</b><div class="m">المجموع ${gEst(i, g) ? '≈' : ''}${gTot(i, g)} · آخر تأكيد قبل ${Math.floor((Date.now() - i.at) / 864e5)} يوم</div></div>` : ''; };
function buyG(id) {
  const i = find(id), g = S.gg.find(x => x.id == i.gid);
  commit('تم الشراء', () => { i.lv = i.lv || {}; i.stock = i.stock || {}; for (const l of ['c', 'b', 'a']) { g.models.forEach(m => { if (mval(i, m) < lvN(l)) { i.lv[m] = l; delete i.stock[m]; } }); if (gSt(i, g) == 'g') break; } touch(i); });
}

/* ============================ البوشيط ============================ */
const csTot = i => (i.v || []).reduce((a, x) => a + x.n, 0);
const csSt = i => { const t = csTot(i); return t <= 0 ? 'r' : ((i.v || []).some(x => x.n <= 0) || t <= lim('cl')) ? 'y' : 'g'; };
function csCard(i) {
  const s = csSt(i), V0 = i.v || [], ex = EXP['c_' + i.id], cmp = isCmp('case') && V.v == 'sec';
  const limV = !ex && V0.length > (cmp ? 3 : 4) ? V0.slice(0, cmp ? 2 : 4) : V0;
  const chips = `<div class="cs-chips">` + limV.map(x => `<div class="cs-chip ${x.n <= 0 ? 'low' : ''}"><span>${esc([x.g, x.c].filter(Boolean).join('·') || 'عام')}</span><button onclick="csC('${i.id}','${x.id}',-1)">−</button><b>${x.n}</b><button onclick="csC('${i.id}','${x.id}',1)">+</button>${x.n <= 0 ? `<button onclick="csX('${i.id}','${x.id}')" style="color:#dc2626">×</button>` : ''}</div>`).join('')
    + (V0.length > limV.length || ex ? `<button class="tag" style="margin:0;padding:4px 10px;font-size:.8rem" onclick="toggleExp('c_${i.id}')">${ex ? 'طيّ ▴' : '+' + (V0.length - limV.length) + ' أخرى ▾'}</button>` : '') + `</div>`;
  if (cmp) {
    return cardH(`<div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="csQuickNote('${i.id}')"><b>${esc(i.name)}</b></div><span class="m">المجموع ${csTot(i)}</span><button class="btn s sm" onclick="csVar('${i.id}')">+ نوع</button></div>` + chips, colOf(i), 'cmp');
  }
  return cardH(`<div class="row2"><b>${esc(i.name)}</b><span class="dotl" style="background:${DT[s]}"></span><span class="m">${TX[s]} · ${csTot(i)}</span></div>`
    + chips
    + fxShow(i) + (i.rem ? `<div class="m" style="margin-top:6px"><span class="dotl" style="background:${DT.g}"></span> باقي: ${esc(i.rem)}</div>` : '') + (i.need ? `<div class="rs" style="margin-top:4px"><span class="dotl" style="background:${DT.r}"></span> خاصنا: ${esc(i.need)}</div>` : '')
    + `<div class="sub"><button class="btn s sm" onclick="csQuickNote('${i.id}')">باقي / خاصنا</button><button class="btn s sm" onclick="csVar('${i.id}')">+ نوع</button>${S.fields.some(f => f.sec == 'case') ? `<button class="btn s sm" onclick="csFx('${i.id}')">خانات</button>` : ''}<button class="btn s sm" onclick="csDel('${i.id}')">حذف</button></div>`, colOf(i));
}
function csView() { const a = srt(S.items.filter(i => i.sec == 'case'), 'case', i => i.name, csTot, i => i.at); return { t: 'البوشيط', h: `<button class="btn" onclick="csAdd()">+ إضافة موديل</button>` + sortBar('case') + (a.map(csCard).join('') || '<p class="m">لا شيء بعد</p>') }; }
function csC(id, vid, d) { const x = find(id).v.find(y => y.id == vid); upd(() => { x.n = Math.max(0, x.n + d); touch(find(id)); }); }
function csX(id, vid) { const r = find(id); sure('حذف هذا النوع؟').then(y => { if (y) commit('تم الحذف', () => { r.v = r.v.filter(x => x.id != vid); }); }); }
function csDel(id) { del('items', id, find(id).name); }
let CQ = '', CSCODE = '';
function csAdd() {
  CQ = ''; PR = null; $('sh').innerHTML = `<div class="bar"></div><h3>إضافة بوشيط</h3><label>ابحث أولاً: موديل الهاتف<input oninput="csF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(v => csDone(v, PR)); csF('');
}
function csF(q) {
  CQ = q.trim(); const n = nz(q), m = S.items.filter(i => i.sec == 'case' && (!n || nz(i.name).includes(n))).sort((a, b) => b.at - a.at).slice(0, 6);
  $('pr').innerHTML = m.map(i => `<button class="card row2" onclick="csPick('${i.id}')"><b>${esc(i.name)}</b><span class="m">${csTot(i)}</span></button>`).join('') + `<button class="btn" onclick="csNew()">+ موديل جديد${CQ ? ' «' + esc(CQ) + '»' : ''}</button>`;
}
function csPick(id) { PR = find(id); csVarForm(); }
function csNew() {
  if (!CQ) return toast('اكتب اسم الموديل'); const d = S.items.find(i => i.sec == 'case' && nz(i.name) == nz(CQ)); if (d) return csPick(d.id);
  PR = { id: uid(), sec: 'case', name: CQ, v: [], by: S.me, at: Date.now() }; if (CSCODE) { PR.code = CSCODE; CSCODE = ''; } csVarForm();
}
function csVar(id) { PR = find(id); $('sh').innerHTML = ''; sheetOpen(v => csDone(v, PR)); csVarForm(); }
function csVarForm() {
  fsInit([['gender', 'الجنس'], ['color', 'اللون']], {});
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(PR.name)} — نوع جديد</h3><div id="cc"></div><label>العدد<input id="cq" type="number" value="1"></label><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="finish({g:FS.v.gender||'',c:FS.v.color||'',n:ci($('cq').value)})">حفظ</button></div>`; chipsR();
}
function csDone(v, r) {
  if (!v || !r) return;
  commit('تمت الإضافة', () => { if (!S.items.includes(r)) S.items.push(r); const x = r.v.find(y => y.g == v.g && y.c == v.c); if (x) x.n += v.n; else r.v.push({ id: uid(), ...v }); touch(r); });
}
function csFx(id) {
  const i = find(id); fsInit([], {}, 'case', i);
  $('sh').innerHTML = '<div class="bar"></div><h3>خانات: ' + esc(i.name) + '</h3><div id="fx"></div><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="finish({})">حفظ</button></div>';
  sheetOpen(v => { if (v) upd(() => { i.x = { ...FS.fx }; }); }); fxR();
}
function csQuickNote(id) {
  const i = find(id);
  ask('بوشيط ' + i.name, [{ k: 'rem', l: 'شنو باقي عندنا فالمحل؟ (مثال: غير النسائي)', v: i.rem || '' }, { k: 'need', l: 'شنو خاص يجيب المعلم؟ (مثال: ألوان رجالية / كحل)', v: i.need || '' }]).then(v => { if (v) commit('تم التحديث', () => { i.rem = v.rem.trim(); i.need = v.need.trim(); touch(i); }); });
}
function buyC(id) { const i = find(id); qty(i.name + ' — لكل نوع', 3, n => { const z = i.v.filter(x => x.n <= 0), t = z.length ? z : i.v; t.forEach(x => x.n += n); touch(i); }); }

/* ============================ الإكسسوارات ============================ */
const DKC = { 'كابل': { conn: 1 }, 'شاحن': { conn: 1 } }, DK = { 'كابل': { g: 1, w: 0 }, 'شاحن': { g: 1, w: 1 }, 'رأس شاحن': { g: 1, w: 1 } };
const kc = k => ({ conn: 0, tier: 1, ...(DKC[k] || {}), ...((S.cfg.kc || {})[k] || {}) });
const gkc = k => ({ g: 0, w: 0, ...(DK[k] || {}), ...((S.cfg.gkc || {})[k] || {}) });
const acName = i => [i.kind, i.conn, i.tier && 'فئة ' + i.tier, i.brand].filter(Boolean).join(' ');
const acTitle = i => [i.kind, i.conn, i.brand].filter(Boolean).join(' ');
const acLim = i => i.lim ?? kc(i.kind).lim ?? lim('acl');
const acSt = i => typeof i.cnt == 'number' ? (i.cnt <= 0 ? 'r' : i.cnt <= acLim(i) ? 'y' : 'g') : i.st;
const ALB = { g: 'متوفر', y: 'قليل', r: 'نفد' };
function acCard(i) {
  const s = acSt(i), cn = typeof i.cnt == 'number', sub = [i.tier && 'فئة ' + i.tier, i.pw, i.note].filter(Boolean).map(esc).join(' · ');
  if (isCmp('acc') && V.v == 'sec') {
    const act = cn ? `<button class="btn s sm" onclick="acC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="acC('${i.id}',1)">+</button>`
      : ['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" style="margin:0;padding:4px 8px;font-size:.76rem" onclick="acS('${i.id}','${x}')">${ALB[x]}</button>`).join('');
    return cardH(`<div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="acEd('${i.id}')"><b>${esc(acTitle(i))}</b>${sub ? `<div class="m">${sub}</div>` : ''}</div>${i.price ? `<span class="cmp-pr">${esc(i.price)}</span>` : ''}${act}</div>`, colOf(i), 'cmp');
  }
  return cardH(`<div class="row2"><b>${esc(acTitle(i))}</b><span class="dotl" style="background:${DT[s]}"></span><span class="m">${ALB[s]}</span></div>`
    + `<div class="kvs"><div class="kv"><small>السعر</small><b>${esc(i.price || '—')}</b></div>${i.tier ? `<div class="kv"><small>الفئة</small><b>${esc(i.tier)}</b></div>` : ''}${i.pw ? `<div class="kv"><small>القدرة</small><b>${esc(i.pw)}</b></div>` : ''}${cn ? `<div class="kv"><small>العدد</small><b>${i.cnt}</b></div>` : ''}</div>`
    + fxShow(i) + (i.note ? `<div class="m">${esc(i.note)}</div>` : '')
    + (cn ? `<div class="row2"><button class="btn s sm" onclick="acC('${i.id}',-1)">−</button><button class="btn sm" onclick="acC('${i.id}',1)">+</button><span class="m" style="flex:1;text-align:end">الحد ${acLim(i)}</span></div>` : `<div>${['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" onclick="acS('${i.id}','${x}')">${ALB[x]}</button>`).join('')}</div>`)
    + `<div class="sub"><button class="btn s sm" onclick="acNote('${i.id}')">ملاحظة</button><button class="btn s sm" onclick="acEd('${i.id}')">تعديل</button>${cn ? '' : `<button class="btn s sm" onclick="acCnt('${i.id}')">+ عدد</button>`}${(i.log || []).length ? `<button class="btn s sm" onclick="lgOpen('${i.id}')">السجل</button>` : ''}<button class="btn s sm" onclick="acDel('${i.id}')">حذف</button></div>`, colOf(i));
}
function acView() {
  const j = V.kk, k = j == null ? null : S.tags.kind[j];
  const a = srt(S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g && (k == null || i.kind == k)), 'acc', acName, i => ({ r: 0, y: 1, g: 2 })[acSt(i)], i => i.at);
  const G = agList().filter(d => k == null || d.kind == k).map(agCard).join('');
  return { t: 'الإكسسوارات', h: `<button class="btn" onclick="acAdd()">+ إضافة إكسسوار</button><div><button class="tag ${j == null ? 'on' : ''}" onclick="V.kk=null;render()">الكل</button>${S.tags.kind.map((t, x) => `<button class="tag ${j == x ? 'on' : ''}" onclick="V.kk=${x};render()">${esc(t)}</button>`).join('')}</div>` + sortBar('acc') + G + (a.map(acCard).join('') || (G ? '' : '<p class="m">لا شيء بعد</p>')) };
}
function acC(id, d) { const i = find(id); upd(() => { i.cnt = Math.max(0, i.cnt + d); touch(i); }); }
function acCnt(id) { const i = find(id); ask('عدد القطع', [{ k: 'n', l: 'العدد الحالي', t: 'tel', v: '' }]).then(v => { if (v && v.n.trim() !== '') upd(() => { i.cnt = ci(v.n); touch(i); }); }); }
function acS(id, s) { const i = find(id); upd(() => { i.st = s; touch(i); }); }
function acNote(id) { const i = find(id); ask('ملاحظة للمشتري', [{ k: 'n', l: 'مثال: بقي 5 حبات', v: i.note || '' }]).then(v => { if (v) upd(() => { i.note = v.n.trim(); touch(i); }); }); }
function acDel(id) { del('items', id, acName(find(id))); }
let ACCODE = '';
function acAdd() {
  PR = null; $('sh').innerHTML = `<div class="bar"></div><h3>إضافة إكسسوار</h3><label>ابحث أولاً (مثلاً: micro)<input oninput="acF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(v => acDone(v, PR)); acF('');
}
function acF(q) {
  const n = nz(q), m = S.items.filter(i => i.sec == 'acc' && nz(acName(i)).includes(n)).slice(0, 6);
  $('pr').innerHTML = m.map(i => `<button class="card row2" onclick="acForm(find('${i.id}'))"><b>${esc(acName(i))}</b><span class="m">${esc(i.price)}</span></button>`).join('') + `<button class="btn" onclick="acForm({})">+ إكسسوار جديد</button>`;
}
function acEd(id) { const r = find(id); $('sh').innerHTML = ''; sheetOpen(v => acDone(v, r)); acForm(r); }
function acForm(rec) {
  PR = rec;
  fsInit([['kind', 'النوع'], ['conn', 'الموصل', () => kc(FS.v.kind).conn && shown('acc', 'conn')], ['tier', 'الفئة (السعر)', () => kc(FS.v.kind).tier && shown('acc', 'tier')], ['pw', 'القدرة (واط)', () => gkc(FS.v.kind).w]],
    { kind: rec.kind || '', conn: rec.conn || '', tier: rec.tier || '', pw: rec.pw || '' }, 'acc', rec);
  $('sh').innerHTML = `<div class="bar"></div><h3>${rec.id ? 'تعديل' : 'إكسسوار جديد'}</h3><div id="cc"></div>`
    + `<label${hh('acc', 'brand')}>الماركة (اختياري)<input id="ab" value="${esc(rec.brand || '')}"></label><label${hh('acc', 'price')}>السعر<input id="ap" type="tel" value="${esc(rec.price || '')}"></label>`
    + `<label${hh('acc', 'cnt')}>العدد (اختياري — فارغ = متوفر/قليل/نفد)<input id="acn" type="tel" value="${esc(rec.cnt ?? '')}"></label><label${hh('acc', 'lim')}>الحد: «قليل» عند عدد ≤ (اختياري)<input id="acl" type="tel" value="${esc(rec.lim ?? '')}"></label>`
    + `<div id="fx"></div><label${hh('acc', 'note')}>ملاحظة<textarea id="an">${esc(rec.note || '')}</textarea></label><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="acSave()">حفظ</button></div>` + (rec.id ? '' : moreBtn('acSave'));
  chipsR();
}
function acSave(more) {
  const kind = FS.v.kind; if (!kind) return toast('اختر النوع');
  const k = kc(kind), c = $('acn').value.trim(), l = $('acl').value.trim();
  finish(fxAtt({ kind, conn: k.conn ? FS.v.conn || '' : '', tier: k.tier ? FS.v.tier || '' : '', pw: gkc(kind).w ? FS.v.pw || '' : '', brand: $('ab').value.trim(), price: $('ap').value.trim() || (k.tier ? FS.v.tier || '' : ''), note: $('an').value.trim(), cnt: c === '' ? undefined : ci(c), lim: l === '' ? undefined : ci(l), _more: more ? 1 : 0 }));
}
function acDone(v, r) {
  if (!v) return; const more = v._more; delete v._more;
  if (r && r.id && S.items.includes(r)) return commit('تم التعديل', () => { Object.assign(r, v); touch(r); });
  const d = S.items.find(i => i.sec == 'acc' && i.kind == v.kind && (i.conn || '') == v.conn && (i.tier || '') == v.tier && (i.brand || '') == v.brand && (i.pw || '') == v.pw);
  if (d) return toast('موجود مسبقاً: ' + acName(d));
  const o = { id: uid(), sec: 'acc', ...v, st: 'g' }; if (r && r.code) o.code = r.code; touch(o);
  commit('تمت الإضافة', () => S.items.push(o)); if (more) setTimeout(acAdd, 350);
}
function buyA(id) { const i = find(id); if (typeof i.cnt == 'number') return qty(acTitle(i), acLim(i) + 3, n => { i.cnt += n; touch(i); }); commit('تم الشراء', () => { i.st = 'g'; touch(i); }); }

/* مجموعات الكابلات والشواحن: الحكم على المجموع (فئة + موصل + قدرة) */
const gkey = i => [i.kind, i.conn || '', i.tier || '', i.pw || ''].join('|').replace(/\//g, '-');
const AORD = { r: 0, y: 1, g: 2 }, ALB2 = { g: 'متوفر', y: 'قارب النفاد', r: 'نفد' };
function agList() {
  const m = {}, mk = (id, x) => m[id] = m[id] || { id, kind: x.kind, conn: x.conn || '', tier: x.tier || '', pw: x.pw || '', mem: [] };
  S.items.forEach(i => { if (i.sec == 'acc' && gkc(i.kind).g) mk(gkey(i), i).mem.push(i); });
  S.ag.forEach(r => { if (gkc(r.kind).g) mk(r.id, r); });
  return Object.values(m).map(d => {
    const g = S.ag.find(x => x.id == d.id), L = (g && g.lim) ?? gkc(d.kind).lim ?? lim('agl'), M = d.mem.filter(i => typeof i.cnt == 'number'), mt = M.reduce((a, i) => a + i.cnt, 0), mat = M.length ? Math.max(...M.map(i => i.at || 0)) : 0;
    let tot = null, est = false; if (M.length && mat > ((g && g.at) || 0)) tot = mt; else if (g && typeof g.cnt == 'number') { tot = g.cnt; est = true; }
    const st = tot !== null ? (tot <= 0 ? 'r' : tot <= L ? 'y' : 'g') : ((g && g.lv) || 'g');
    return { ...d, g, lim: L, tot, est, st, title: [d.kind, d.conn, d.pw, d.tier && 'فئة ' + d.tier].filter(Boolean).join(' · ') };
  }).sort((a, b) => AORD[a.st] - AORD[b.st] || a.title.localeCompare(b.title));
}
const agD = e => agList().find(x => x.id == decodeURIComponent(e));
function agSet(d, fn, tch = true) {
  commit('تم التحديث', () => { let g = S.ag.find(x => x.id == d.id); if (!g) { g = { id: d.id, kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw }; S.ag.push(g); } fn(g); g.by = S.me; if (tch) g.at = Date.now(); });
}
function agCard(d) {
  const e = encodeURIComponent(d.id), sub = d.tot !== null ? 'المجموع ' + (d.est ? '≈' : '') + d.tot + ' · الحد ' + d.lim : (d.st == 'y' ? 'أقل من ' + d.lim : d.st == 'r' ? 'لا يوجد' : '');
  if (isCmp('acc') && V.v == 'sec') {
    return cardH(`<div class="row2"><span class="dotl" style="background:${DT[d.st]}"></span><div class="cmp-main" onclick="agCnt('${e}')"><b>${esc(d.title)}</b>${sub ? `<div class="m">${sub}</div>` : ''}</div>${['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" style="margin:0;padding:4px 8px;font-size:.76rem" onclick="agLv('${e}','${s}')">${ALB2[s]}</button>`).join('')}</div>`, '', 'cmp');
  }
  return `<div class="card"><div class="row2"><b>${esc(d.title)}</b><span class="dotl" style="background:${DT[d.st]}"></span><span class="m">${ALB2[d.st]}</span></div>${sub ? `<div class="m">${sub}</div>` : ''}${d.mem.length ? `<div>${d.mem.map(i => `<button class="tag" onclick="acEd('${i.id}')">${esc(i.brand || 'بدون ماركة')}${typeof i.cnt == 'number' ? ' · ' + i.cnt : ''}</button>`).join('')}</div>` : ''}<div>${['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" onclick="agLv('${e}','${s}')">${ALB2[s]}</button>`).join('')}</div><div class="sub"><button class="btn s sm" onclick="agCnt('${e}')">المجموع</button><button class="btn s sm" onclick="agLimEd('${e}')">الحد</button><button class="btn s sm" onclick="agAddB('${e}')">+ ماركة</button></div></div>`;
}
const agLv = (e, l) => { const d = agD(e); if (d) agSet(d, g => { g.lv = l; delete g.cnt; }); };
const agBuy = e => { const d = agD(e); if (d) agSet(d, g => { g.lv = 'g'; delete g.cnt; }); };
function agCnt(e) { const d = agD(e); if (d) ask('المجموع التقريبي — ' + d.title, [{ k: 'n', l: 'العدد تقريباً', t: 'tel', v: d.tot ?? '' }]).then(v => { if (v && v.n.trim() !== '') agSet(d, g => { g.cnt = ci(v.n); delete g.lv; }); }); }
function agLimEd(e) {
  const d = agD(e); if (!d) return; if (!isAdmin()) return toast('للمدير فقط');
  ask('الحد — ' + d.title, [{ k: 'n', l: '«قارب النفاد» عند مجموع ≤ (فارغ = الحد العام)', t: 'tel', v: d.g && d.g.lim != null ? d.g.lim : '' }]).then(v => { if (v) agSet(d, g => { if (v.n.trim() === '') delete g.lim; else g.lim = ci(v.n); }, false); });
}
function agAddB(e) { const d = agD(e); if (!d) return; $('sh').innerHTML = ''; sheetOpen(v => acDone(v, PR)); acForm({ kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw }); }

/* ============================ الشراء والتقرير ============================ */
function qty(t, d, fn) { ask(t, [{ k: 'n', l: 'الكمية التي وصلت', t: 'tel', v: d }], 'تم الشراء').then(v => { if (v && +v.n > 0) commit('تم الشراء', () => fn(ci(v.n))); }); }
function buyP(id) { const i = find(id); qty(i.brand + ' ' + i.name, 1, n => { i.cnt += n; touch(i); }); }
/* كل سطر: [القسم, النص, الحالة r/y, دالة «تم الشراء»] */
function invLines(notes = true) {
  const L = [];
  ph().filter(i => phSt(i) != 'g').forEach(i => L.push(['الهواتف الناقصة', [i.brand, i.name, i.color, i.cap].filter(Boolean).join(' ') + ' — ' + av(i) + (rsQ(i) ? ' (محجوز ' + rsQ(i) + ')' : ''), phSt(i), `buyP('${i.id}')`]));
  S.gg.forEach(g => S.tags.glass.forEach(t => { const i = gitem(g.id, t); if (i && gSt(i, g) != 'g') L.push(['الأنتي كاس', t + ': ' + g.models.join(' / ') + ' — المجموع ' + (gEst(i, g) ? '≈' : '') + gTot(i, g), gSt(i, g), `buyG('${i.id}')`]); }));
  S.items.filter(i => i.sec == 'case' && csSt(i) != 'g').forEach(i => { const z = i.v.filter(x => x.n <= 0).map(x => [x.g, x.c].filter(Boolean).join(' ')); L.push(['البوشيط', i.name + (z.length ? ' — ناقص: ' + z.join('، ') : '') + ' — المتوفر ' + csTot(i) + (notes && i.rem ? ' — باقي: ' + i.rem : '') + (notes && i.need ? ' — خاصنا: ' + i.need : ''), csSt(i), `buyC('${i.id}')`]); });
  S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g && acSt(i) != 'g').forEach(i => L.push(['الإكسسوارات', acName(i) + (typeof i.cnt == 'number' ? ' — العدد ' + i.cnt : '') + (i.note ? ' — ' + i.note : ''), acSt(i), `buyA('${i.id}')`]));
  agList().filter(d => d.st != 'g').forEach(d => L.push(['الإكسسوارات', d.title + (d.tot !== null ? ' — المجموع ' + (d.est ? '≈' : '') + d.tot : d.st == 'r' ? ' — نفد' : ' — قارب النفاد'), d.st, `agBuy('${encodeURIComponent(d.id)}')`]));
  return L;
}

/* ============================ الجولة اليومية ============================ */
const rnd = () => S.items.filter(i => i.at && Date.now() - i.at > lim('stale') * 864e5).sort((a, b) => a.at - b.at);
const itemCard = i => i.sec == 'phones' ? phCard(i) : i.sec == 'case' ? csCard(i) : i.sec == 'acc' ? acCard(i) : i.sec == 'glass' ? gl2(i) : '';
function rCf(id) { const i = find(id); upd(() => touch(i)); }
VW.jl = () => { const a = rnd().slice(0, 30); return { t: 'الجولة اليومية', h: '<p class="m">أكّد ما لم يتغير وعدّل ما تغيّر. الأقدم أولاً.</p>' + (a.map(i => `<div>${itemCard(i)}<button class="btn s" onclick="rCf('${i.id}')">تأكيد: كما هو</button></div>`).join('') || '<p class="m">كل شيء مؤكد حديثاً.</p>') }; };
HOME.after.push(() => { const n = rnd().length; return n ? `<button class="btn s" onclick="go('jl')">الجولة اليومية (${n})</button>` : ''; });

/* ============================ الباركود و IMEI والبيع السريع ============================ */
let BS = null, BI = 0, BCODE = '', BDP = null;
const BCX = [], BCM = [];   // ملف الصيانة يضيف أزرارا (BCX) ونتائج مطابقة (BCM)
function bcStop() { clearInterval(BI); if (BS) { BS.getTracks().forEach(t => t.stop()); BS = null; } }
function ensureBD() {   // آيفون: تحميل ماسح بديل عند الحاجة
  if ('BarcodeDetector' in window) return Promise.resolve(true);
  if (BDP) return BDP;
  return BDP = new Promise(res => {
    const s = document.createElement('script'); s.src = 'https://fastly.jsdelivr.net/npm/barcode-detector@2.3.1/dist/iife/pure.min.js';
    s.onload = () => { if (window.BarcodeDetectorPolyfill && !('BarcodeDetector' in window)) window.BarcodeDetector = window.BarcodeDetectorPolyfill; res('BarcodeDetector' in window); };
    s.onerror = () => res(false); document.head.appendChild(s);
  });
}
async function bcScan(cb) {
  if (!('BarcodeDetector' in window)) { toast('جارٍ تجهيز ماسح الباركود...'); await ensureBD(); }
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices) return toast('هذا المتصفح لا يدعم المسح بالكاميرا');
  $('sh').innerHTML = '<div class="bar"></div><h3>وجّه الكاميرا نحو الباركود</h3><video id="bcv" autoplay playsinline muted style="width:100%;border-radius:14px"></video><button class="btn s" onclick="finish(null)">إلغاء</button>';
  sheetOpen(v => { bcStop(); if (v) cb(v); }); const d = new BarcodeDetector();
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
    if (!SH) { s.getTracks().forEach(t => t.stop()); return; } BS = s; const v = $('bcv'); v.srcObject = s;
    BI = setInterval(() => { d.detect(v).then(r => { if (r[0] && BS) { const c = String(r[0].rawValue || '').trim(); bcStop(); finish(c); } }).catch(() => { }); }, 400);
  }).catch(() => { toast('تعذر فتح الكاميرا'); if (SH) finish(null); });
}
let INL = null, INT = 0;
function stopInlineScan() { clearInterval(INT); if (INL) { INL.getTracks().forEach(t => t.stop()); INL = null; } const b = $('inline_bc_box'); if (b) b.remove(); }
async function scanIntoInput(inputId) {   // مسح داخل نموذج مفتوح (حقل IMEI)
  if ($('inline_bc_box')) return stopInlineScan(); const inp = $(inputId); if (!inp) return;
  if (!(await ensureBD()) || !navigator.mediaDevices) return toast('هذا المتصفح لا يدعم المسح بالكاميرا');
  (inp.closest('label') || inp.parentElement).insertAdjacentHTML('afterend', '<div id="inline_bc_box" class="card" style="margin:8px 0;padding:10px;text-align:center"><div class="m" style="margin-bottom:6px">وجّه الكاميرا نحو باركود IMEI على العلبة أو الشاشة (*#06#)</div><video id="inline_bcv" autoplay playsinline muted style="width:100%;max-height:190px;object-fit:cover;border-radius:10px"></video><button type="button" class="btn s sm" style="margin-top:8px;width:100%" onclick="stopInlineScan()">إلغاء المسح</button></div>');
  const det = new BarcodeDetector();
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(st => {
    const v = $('inline_bcv'); if (!v) { st.getTracks().forEach(t => t.stop()); return; } INL = st; v.srcObject = st;
    INT = setInterval(() => { det.detect(v).then(c => { if (c && c[0] && INL) { const val = String(c[0].rawValue || '').trim(); if (val) { const cur = inp.value.trim(); inp.value = cur && !cur.includes(val) ? cur + ' · ' + val : val; stopInlineScan(); toast('تم التقاط الرمز: ' + val); } } }).catch(() => { }); }, 350);
  }).catch(() => { stopInlineScan(); toast('تعذر فتح الكاميرا'); });
}
HK.hide.push(() => { stopInlineScan(); });
const bcLbl = i => i.sec == 'phones' ? i.brand + ' ' + i.name : i.sec == 'case' ? i.name : acName(i);
const isImei = c => /^\d{14,17}$/.test(c);

/* تنفيذ البيع السريع (-1) عند مسح باركود صنف واحد موجود */
function bcQuickSell(it) {
  if (it.sec == 'phones') {
    if (av(it) <= 0) return !toast('لا توجد قطع متاحة للبيع من ' + bcLbl(it));
    commit('بيع سريع (−1): ' + bcLbl(it) + ' ← بقي ' + (it.cnt - 1), () => { it.cnt = Math.max(0, it.cnt - 1); touch(it); });
    return true;
  } else if (it.sec == 'acc') {
    if (typeof it.cnt == 'number') {
      if (it.cnt <= 0) return !toast('العدد 0 بالفعل في ' + bcLbl(it));
      commit('بيع سريع (−1): ' + bcLbl(it) + ' ← بقي ' + (it.cnt - 1), () => { it.cnt = Math.max(0, it.cnt - 1); touch(it); });
      return true;
    } else {
      toast('هذا الإكسسوار بدون عدد رقمي — حُدِّثت البطاقة أمامك');
    }
  } else if (it.sec == 'case' && (it.v || []).length) {
    const v = it.v.find(x => x.n > 0) || it.v[0];
    if (v.n <= 0) return !toast('نفد هذا البوشيط بالفعل');
    commit('بيع سريع (−1): بوشيط ' + it.name, () => { v.n = Math.max(0, v.n - 1); touch(it); });
    return true;
  }
  return false;
}

function bcHome() {
  bcScan(c => {
    BCODE = String(c || '').trim(); const nc = nz(BCODE), r = $('res'); if (!r) return;
    const m = S.items.filter(i => i.sec != 'glass' && (i.code == BCODE || (i.imei && nz(i.imei).includes(nc)))), x = BCM.map(f => f(BCODE)).join('');
    if (m.length || x) {
      let sold = false;
      if (bcQ() && m.length == 1 && !x && bcQuickSell(m[0])) { sold = true; S.cfg.bcQuick = Date.now(); }
      const r2 = $('res') || r;   // الرسم بعد البيع يستبدل الشاشة، فنجلب المنطقة من جديد
      r2.innerHTML = (sold ? `<div class="card row2">${I('zap')}<span style="flex:1">تم خصم قطعة واحدة (التراجع من الشريط أسفل الشاشة)</span></div>` : '') + m.map(itemCard).join('') + x;
      return;
    }
    const im = isImei(BCODE), B = (fn, ic2, l, p) => `<button class="btn ${p ? '' : 's'} sm" onclick="${fn}()">${I(ic2)} ${l}</button>`;
    r.innerHTML = `<div class="card"><div class="m">${im ? 'رقم IMEI غير مسجل' : 'باركود غير مسجل'}: <bdi><b>${esc(BCODE)}</b></bdi></div><div class="m" style="margin-top:4px">اختر ما تريد فعله بهذا الرمز:</div><div class="sub" style="margin-top:8px">`
      + (im ? B('bcNewPh', 'mobile', '+ هاتف جديد', 1) + B('bcNewAcc', 'plug', '+ إكسسوار') + B('bcNewCs', 'box', '+ بوشيط') : B('bcNewAcc', 'plug', '+ إكسسوار جديد', 1) + B('bcNewCs', 'box', '+ بوشيط جديد', 1) + B('bcNewPh', 'mobile', '+ هاتف جديد'))
      + BCX.map(f => f(BCODE, im)).join('') + `</div><button class="btn s sm" style="width:100%;margin-top:8px" onclick="bcLink()">ربطه بصنف موجود في المخزون</button></div>`;
  });
}
function bcNewPh() { $('sh').innerHTML = ''; sheetOpen(v => phDone(v, PR)); phForm({ imei: isImei(BCODE) ? BCODE : '', code: BCODE, cnt: 1 }); }
function bcNewAcc() { $('sh').innerHTML = ''; sheetOpen(v => acDone(v, PR)); acForm({ code: BCODE }); }
function bcNewCs() { CSCODE = BCODE; csAdd(); }
function bcLink() { $('sh').innerHTML = '<div class="bar"></div><h3>ربط الرمز بعنصر</h3><label>ابحث عن العنصر<input oninput="bcF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>'; sheetOpen(() => { }); bcF(''); }
function bcF(q) { const n = nz(q); $('pr').innerHTML = S.items.filter(i => i.sec != 'glass' && n && nz(hay(i)).includes(n)).slice(0, 8).map(i => `<button class="card row2" onclick="bcSet('${i.id}')"><b>${esc(bcLbl(i))}</b></button>`).join(''); }
function bcSet(id) {
  const i = find(id); if (!i) return;
  upd(() => { if (i.sec == 'phones' && isImei(BCODE)) i.imei = i.imei ? (i.imei.includes(BCODE) ? i.imei : i.imei + ' · ' + BCODE) : BCODE; i.code = i.code || BCODE; touch(i); });
  finish(null); toast('تم ربط الباركود بنجاح');
}
HOME.tools.push(() => `<div class="row2" style="margin:8px 0"><button class="btn s" style="flex:1;margin:0" onclick="bcHome()">${I('scan')} مسح باركود</button><button class="btn ${bcQ() ? '' : 's'} sm" style="min-height:50px" onclick="upd(()=>S.cfg.bcQuick=bcQ()?0:Date.now())" title="خصم قطعة تلقائياً عند المسح (15 دقيقة)">${I('zap')} ${bcQ() ? 'البيع السريع مفعّل' : 'بيع سريع −1'}</button></div>`);

/* ============================ البحث الموحّد ============================ */
SRCH.push(
  { k: 'phones', l: 'هواتف', run: n => S.items.filter(i => i.sec == 'phones' && nzOf(i, nzText).includes(n)).slice(0, 30).map(phCard) },
  { k: 'glass', l: 'أنتي كاس', run: n => S.gg.filter(g => g.models.some(m => nz(((g.br || {})[m] || '') + m).includes(n))).slice(0, 15).map(glB) },
  { k: 'case', l: 'بوشيط', run: n => S.items.filter(i => i.sec == 'case' && nzOf(i, nzText).includes(n)).slice(0, 30).map(csCard) },
  { k: 'acc', l: 'إكسسوارات', run: n => S.items.filter(i => i.sec == 'acc' && nzOf(i, nzText).includes(n)).slice(0, 30).map(acCard) }
);
VW.sec = () => ({ phones: phView, glass: glView, case: csView, acc: acView }[V.k] || phView)();

/* ============================ الإعدادات الخاصة بالمخزون ============================ */
const tg = (l, g) => [l, "go('st_tg',{g:'" + g + "'})", () => S.tags[g].length];
const CATS = {   // ملف الصيانة يضيف CATS.rp
  ph: ['الهواتف', [tg('الماركات', 'brand'), tg('الألوان', 'color'), tg('السعات', 'cap'), tg('RAM', 'ram'), ['حدود النفاد', "go('st_lim')"], ['ألوان وحدود الماركات', "go('st_br')"]], 'phones'],
  gl: ['الأنتي كاس', [tg('أنواع الزجاج', 'glass'), ['المستويات والحدود', "go('st_lim')"]], null],
  cs: ['البوشيط', [tg('الجنس', 'gender'), tg('الألوان', 'color')], 'case'],
  ac: ['الإكسسوارات', [tg('الأنواع', 'kind'), tg('الموصلات', 'conn'), tg('الفئات السعرية', 'tier'), tg('القدرات (واط)', 'pw'), ['إعداد كل نوع (الموصل، الفئة، المجموعات، الحد)', "go('st_ak')"]], 'acc']
};
VW.st_c = () => { const c = CATS[V.c] || CATS.ph; return { t: c[0], h: c[1].map(([l, fn, n]) => row(l, fn, n ? n() : '')).join('') + (c[2] ? row('خانات مخصصة لهذا القسم', "go('st_fx',{fs:'" + c[2] + "'})", S.fields.filter(f => f.sec == c[2]).length || '') : '') }; };
MORE.push(
  { g: 'sec', o: 10, l: 'الهواتف', fn: "go('st_c',{c:'ph'})" }, { g: 'sec', o: 20, l: 'الأنتي كاس', fn: "go('st_c',{c:'gl'})" },
  { g: 'sec', o: 30, l: 'البوشيط', fn: "go('st_c',{c:'cs'})" }, { g: 'sec', o: 40, l: 'الإكسسوارات', fn: "go('st_c',{c:'ac'})" },
  { g: 'look', o: 20, l: 'تلوين البطاقات', fn: "go('st_col')" }, { g: 'look', o: 30, l: 'الحقول في النماذج', fn: "go('st_fld')" },
  { g: 'look', o: 40, l: 'الخانات المخصصة', fn: "go('st_fx')", n: () => S.fields.length || '' }
);
/* الألوان */
let CE = {};
function ceR() {
  if ($('blim')) CE.l = $('blim').value;
  const sw = `<div>${PAL.map(c => `<button class="sw ${CE.c == c ? 'on' : ''}" style="background:${c}" onclick="CE.c='${c}';ceR()"></button>`).join('')}<button class="tag ${CE.c ? '' : 'on'}" onclick="CE.c='';ceR()">بدون</button></div>`;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(CE.n)}</h3>` + (CE.t == 's' ? `<label>التلوين</label><div>${CE.mo.map(([k, l]) => `<button class="tag ${CE.m == k ? 'on' : ''}" onclick="CE.m='${k}';ceR()">${l}</button>`).join('')}</div>` : '')
    + ((CE.t == 'b' || CE.m == 's') ? `<label>اللون</label>${sw}` : '') + (CE.t == 'b' ? `<label>حد «قارب على النفاد» لهواتف هذه الماركة (فارغ = الحد العام)</label><input id="blim" type="tel" value="${esc(CE.l)}">` : '')
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="if($('blim'))CE.l=$('blim').value;finish(CE)">حفظ</button></div>`;
}
function ceOpen(o, cb) { if (!can('tags')) return toast('للمدير فقط'); CE = o; ceR(); sheetOpen(cb); }
function brEd(j) { const b = S.tags.brand[j]; ceOpen({ t: 'b', n: b, c: BC(b), l: (S.cfg.bl || {})[b] ?? '' }, v => { if (!v) return; upd(() => { S.cfg.bcol = S.cfg.bcol || {}; S.cfg.bcol[b] = v.c; S.cfg.bl = S.cfg.bl || {}; const l = String(v.l).trim(); if (l === '') delete S.cfg.bl[b]; else S.cfg.bl[b] = Math.max(1, +l || 1); }); }); }
function cmEd(s) { ceOpen({ t: 's', n: SN3[s], m: CM(s), c: SCOL(s), mo: s == 'acc' ? [['s', 'لون واحد للقسم'], ['o', 'بدون']] : [['b', 'حسب الماركة'], ['s', 'لون واحد للقسم'], ['o', 'بدون']] }, v => { if (!v) return; upd(() => { S.cfg.cm = S.cfg.cm || {}; S.cfg.cm[s] = v.m; S.cfg.scol = S.cfg.scol || {}; S.cfg.scol[s] = v.c; }); }); }
VW.st_col = () => ({ t: 'الألوان', h: '<p class="m">ألوان خفيفة على خلفية البطاقات للتمييز بسرعة.</p>' + ['phones', 'glass', 'case', 'acc'].map(s => { const m = CM(s), c = m == 's' ? SCOL(s) : ''; return `<button class="card row2" onclick="cmEd('${s}')"><b>${SN3[s]}</b><span class="m">${MN[m]}</span>${c ? `<span class="dotl" style="background:${c}"></span>` : ''}</button>`; }).join('') + row('ألوان الماركات وحدودها', "go('st_br')") });
VW.st_br = () => ({ t: 'ألوان الماركات', h: '<p class="m">اللون + حد «قارب على النفاد» لكل ماركة (اختياري).</p>' + S.tags.brand.map((b, j) => { const c = BC(b), l = (S.cfg.bl || {})[b]; return `<button class="card row2" onclick="brEd(${j})"><b>${esc(b)}</b><span class="m">${l != null ? 'حد ≤' + l : ''}</span>${c ? `<span class="dotl" style="background:${c}"></span>` : ''}</button>`; }).join('') });
/* إعداد كل نوع إكسسوار: ما يظهر في النموذج + العرض كمجموعات + الحدود */
let AK = {};
function akR() {
  if ($('akl')) AK.lim = $('akl').value; if ($('agl')) AK.glim = $('agl').value;
  const t = (k, l) => `<button class="tag ${AK[k] ? 'on' : ''}" onclick="AK.${k}=${AK[k] ? 0 : 1};akR()">${l}</button>`;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(AK.k)}</h3><label>ما يظهر عند إضافة هذا النوع</label><div>${t('conn', 'الموصل')}${t('tier', 'الفئة')}${t('w', 'القدرة (واط)')}</div><label>طريقة العرض</label><div>${t('g', 'مجموعات حسب الفئة')}</div>`
    + `<label>حد «قليل» لكل قطعة من هذا النوع (فارغ = الحد العام)</label><input id="akl" type="tel" value="${esc(AK.lim)}"><label>حد «قارب النفاد» لمجموع المجموعة (فارغ = الحد العام)</label><input id="agl" type="tel" value="${esc(AK.glim)}"><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="akOk()">حفظ</button></div>`;
}
function akOk() { if ($('akl')) AK.lim = $('akl').value; if ($('agl')) AK.glim = $('agl').value; finish(AK); }
function akEd(j) {
  if (!can('tags')) return toast('للمدير فقط'); const k = S.tags.kind[j], c = kc(k), g = gkc(k);
  AK = { k, conn: c.conn ? 1 : 0, tier: c.tier ? 1 : 0, g: g.g ? 1 : 0, w: g.w ? 1 : 0, lim: c.lim ?? '', glim: g.lim ?? '' }; akR();
  sheetOpen(v => { if (!v) return; upd(() => { const l = String(v.lim).trim(), gl = String(v.glim).trim(); S.cfg.kc = S.cfg.kc || {}; S.cfg.kc[v.k] = { conn: v.conn, tier: v.tier, ...(l === '' ? {} : { lim: ci(l) }) }; S.cfg.gkc = S.cfg.gkc || {}; S.cfg.gkc[v.k] = { g: v.g, w: v.w, ...(gl === '' ? {} : { lim: ci(gl) }) }; }); });
}
VW.st_ak = () => ({ t: 'إعداد أنواع الإكسسوارات', h: '<p class="m">لكل نوع: هل له موصل أو فئة أو قدرة، وهل يُعرض كمجموعات (كابلات وشواحن) يُحكم عليها بمجموعها.</p>' + S.tags.kind.map((k, j) => { const c = kc(k), g = gkc(k); return row(k, 'akEd(' + j + ')', (g.g ? 'مجموعات · ' : '') + (c.conn ? 'موصل · ' : '') + (c.tier ? 'فئة · ' : '') + (g.w ? 'قدرة · ' : '') + 'حد ' + (g.g ? (g.lim ?? lim('agl')) : (c.lim ?? lim('acl')))); }).join('') });
/* إدارة الخانات المخصصة */
let FE = {};
VW.st_fx = () => ({ t: 'الخانات المخصصة', h: '<p class="m">خانة إضافية بخيارات تظهر في نموذج القسم وعلى البطاقة وتدخل في البحث.</p>' + (can('tags') ? '<button class="btn" onclick="feEd(null)">+ إضافة خانة</button>' : '') + Object.keys(SECN).filter(s => !V.fs || V.fs == s).map(s => `<h3>${SECN[s]}</h3>` + (S.fields.filter(f => f.sec == s).map(f => `<button class="card row2" onclick="feEd('${f.id}')"><b style="flex:1">${esc(f.name)}</b><span class="m">${f.kinds && f.kinds.length ? esc(f.kinds.join('، ')) : 'الكل'} · ${f.multi ? 'عدة قيم' : 'قيمة'} · ${f.opts.length}</span></button>`).join('') || '<p class="m">لا شيء</p>')).join('') });
function feR() {
  if ($('fen')) { FE.name = $('fen').value; FE.opts = $('feo').value; }
  const kl = FE.sec == 'phones' ? S.tags.brand : FE.sec == 'acc' ? S.tags.kind : null;
  $('sh').innerHTML = `<div class="bar"></div><h3>${FE.id ? 'تعديل خانة' : 'خانة جديدة'}</h3><label>اسم الخانة (مثال: الموصل)<input id="fen" value="${esc(FE.name)}"></label><label>القسم</label><div>${Object.keys(SECN).map(s => `<button class="tag ${FE.sec == s ? 'on' : ''}" onclick="FE.sec='${s}';FE.kinds=[];feR()">${SECN[s]}</button>`).join('')}</div>`
    + (kl ? `<label>تظهر لـ ${FE.sec == 'phones' ? 'ماركات' : 'أنواع'} محددة (بدون اختيار = الكل)</label><div>${kl.map((k, j) => `<button class="tag ${FE.kinds.includes(k) ? 'on' : ''}" onclick="feK(${j})">${esc(k)}</button>`).join('')}</div>` : '')
    + `<label>طريقة الاختيار</label><div><button class="tag ${FE.multi ? '' : 'on'}" onclick="FE.multi=false;feR()">قيمة واحدة</button><button class="tag ${FE.multi ? 'on' : ''}" onclick="FE.multi=true;feR()">عدة قيم</button></div><label>الخيارات (واحد في كل سطر)<textarea id="feo">${esc(FE.opts)}</textarea></label>`
    + `<div class="acts">${FE.id ? '<button class="btn d" onclick="finish({del:1})">حذف</button>' : ''}<button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="feOk()">حفظ</button></div>`;
}
function feK(j) { const k = (FE.sec == 'phones' ? S.tags.brand : S.tags.kind)[j]; FE.kinds = FE.kinds.includes(k) ? FE.kinds.filter(x => x != k) : [...FE.kinds, k]; feR(); }
function feOk() { FE.name = $('fen').value.trim(); FE.opts = $('feo').value; if (!FE.name) return toast('اكتب اسم الخانة'); finish({ ok: 1 }); }
function feEd(id) {
  if (!can('tags')) return toast('للمدير فقط'); const f = id ? S.fields.find(x => x.id == id) : null;
  FE = f ? { id: f.id, name: f.name, sec: f.sec, kinds: [...(f.kinds || [])], multi: !!f.multi, opts: f.opts.join('\n') } : { id: '', name: '', sec: V.fs || 'acc', kinds: [], multi: false, opts: '' };
  feR();
  sheetOpen(v => {
    if (!v) return;
    upd(() => {
      if (v.del) { S.fields = S.fields.filter(x => x.id != FE.id); return; }
      const o = { name: FE.name, sec: FE.sec, kinds: FE.kinds, multi: FE.multi, opts: FE.opts.split('\n').map(s => s.trim()).filter(Boolean) };
      if (FE.id) Object.assign(S.fields.find(x => x.id == FE.id), o); else S.fields.push({ id: uid(), ...o });
    });
  });
}
