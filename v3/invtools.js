/* ============================================================
   invtools.js — أدوات المخزون: الجرد والجولة اليومية، كاشف الأثمنة،
   الباركود والبيع السريع، إعدادات الأقسام والألوان والخانات، وإدارة الوسوم الموحدة.
   يُحمَّل مباشرة بعد inventory.js وقبل repair.js.
   ============================================================ */

/* ============================ الجرد والجولة اليومية (مضغوط + مقسم بالرفوف + شامل/قديم) ============================ */
function rndAll() {
  const out = [];
  S.items.forEach(i => {
    if (i.sec == 'acc' && gkc(i.kind).g) return;
    if (i.sec == 'glass' && !S.gg.some(g => g.id == i.gid)) return;
    out.push(i);
  });
  agList().forEach(d => {
    const t = d.cf || d.at || Date.now();
    out.push({ _jl: 'ag', sec: 'acc', id: d.id, d, at: t, cf: t });
  });
  (S.tp || []).forEach(r => {
    if (!r || r.k != 'c') return;
    const t = cfTime(r) || Date.now();
    out.push({ _jl: 'tp', sec: 'tp', id: r.id, r, at: t, cf: t });
  });
  return out.sort((a, b) => cfTime(a) - cfTime(b));
}

/* rnd() بدون معاملات تعيد الأصناف القديمة فقط (لتنبيهات التقرير والرئيسية) */
function rnd(allMode) {
  const ms = lim('stale') * 864e5, now = Date.now();
  const L = rndAll();
  return allMode ? L : L.filter(i => { const t = cfTime(i); return t && now - t > ms; });
}

const jlSecOf = i => i._jl == 'ag' ? 'acc' : i._jl == 'tp' ? 'tp' : i.sec;
const jlTextOf = i => {
  if (i._jl == 'ag') return i.d.title;
  if (i._jl == 'tp') return 'تعبئة ' + i.r.op + ' ' + i.r.n;
  if (i.sec == 'glass') { const g = S.gg.find(x => x.id == i.gid); return (i.ty || '') + ' ' + (g ? g.models.join(' ') : ''); }
  return nzText(i);
};

/* إحصائيات سريعة للرف/القسم: عدد الأصناف + مجموع القطع الفعلية */
function jlSecSummary(sec) {
  if (sec == 'phones') {
    const A = ph();
    return `${A.length} صنف · مجموع القطع: ${A.reduce((s, i) => s + (+i.cnt || 0), 0)}`;
  }
  if (sec == 'glass') {
    const tot = S.gg.reduce((s, g) => s + S.tags.glass.reduce((a, t) => { const i = gitem(g.id, t); return a + (i ? gTot(i, g) : 0); }, 0), 0);
    return `${S.gg.length} مجموعة · مجموع الزجاج: ≈${tot}`;
  }
  if (sec == 'case') {
    const A = S.items.filter(i => i.sec == 'case');
    return `${A.length} موديل · مجموع القطع: ${A.reduce((s, i) => s + csTot(i), 0)}`;
  }
  if (sec == 'acc') {
    const A = S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g), G = agList();
    const cnt = A.reduce((s, i) => s + (typeof i.cnt == 'number' ? i.cnt : 0), 0) + G.reduce((s, d) => s + (d.tot || 0), 0);
    return `${A.length + G.length} صنف/مجموعة · مجموع القطع المرقمة: ${cnt}`;
  }
  if (sec == 'tp') {
    const C = (S.tp || []).filter(r => r && r.k == 'c');
    return `${C.length} فئة بطاقات · مجموع البطاقات: ${C.reduce((s, r) => s + (+r.val || 0), 0)}`;
  }
  const phCnt = ph().reduce((s, i) => s + (+i.cnt || 0), 0), csCnt = S.items.filter(i => i.sec == 'case').reduce((s, i) => s + csTot(i), 0);
  return `الهواتف: ${phCnt} قطعة · البوشيط: ${csCnt} قطعة`;
}

const itemCard = i => i._jl == 'ag' ? agCard(i.d) : i._jl == 'tp' ? jlTpCard(i.r) : i.sec == 'phones' ? phCard(i) : i.sec == 'case' ? csCard(i) : i.sec == 'acc' ? acCard(i) : i.sec == 'glass' ? gl2(i) : '';
function jlTpCard(r) {
  return `<div class="card"><div class="row2"><b>تعبئة ${esc(r.op)} — بطاقة ${r.n} درهم</b><span class="m">${r.val <= 0 ? 'نفد' : r.est ? '≈' + r.val : 'العدد ' + r.val}</span></div><div class="m">آخر تأكيد قبل ${Math.floor((Date.now() - cfTime(r)) / 864e5)} يوم</div><div class="sub"><button class="btn s sm" onclick="go('tp')">فتح شاشة التعبئة</button></div></div>`;
}

/* سطر جرد مضغوط وسريع (تعديل فوري + زر تأكيد ✓ في نفس السطر) */
function jlCompactRow(i) {
  const days = Math.max(0, Math.floor((Date.now() - cfTime(i)) / 864e5));
  const dBadge = `<span class="m" style="font-size:.75rem">${days ? 'قبل ' + days + 'ي' : 'مؤكد اليوم'}</span>`;
  if (i._jl == 'ag') {
    const d = i.d, e = encodeURIComponent(d.id);
    const sub = d.tot !== null ? `المجموع ${d.est ? '≈' : ''}${d.tot}` : ALB2[d.st];
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[d.st]}"></span><div class="cmp-main" onclick="agCnt('${e}')"><b>${esc(d.title)}</b><div class="m">${esc(sub)} · ${dBadge}</div></div>`
      + ['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" style="margin:0;padding:4px 7px;font-size:.74rem" onclick="agLv('${e}','${s}')">${ALB2[s]}</button>`).join('')
      + `<button class="rck" title="تأكيد كما هو" onclick="rCfAg('${e}')">${I('check')}</button></div></div>`;
  }
  if (i._jl == 'tp') {
    const r = i.r;
    return `<div class="card cmp jl-row"><div class="row2"><div class="cmp-main" onclick="go('tp')"><b>تعبئة ${esc(r.op)} — ${r.n} درهم</b><div class="m">${r.val <= 0 ? 'نفد' : (r.est ? '≈' : 'العدد ') + r.val} · ${dBadge}</div></div>`
      + `<button class="btn s sm" onclick="go('tp')">تعديل</button><button class="rck" title="تأكيد كما هو" onclick="rCfTp('${r.id}')">${I('check')}</button></div></div>`;
  }
  if (i.sec == 'phones') {
    const s = phSt(i), sub = [i.color, i.ram, i.cap, i.price && i.price + ' درهم'].filter(Boolean).map(esc).join(' · ');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="phEd('${i.id}')"><b>${esc(i.brand + ' ' + i.name)}</b><div class="m">${sub ? sub + ' · ' : ''}${dBadge}</div></div>`
      + `<button class="btn s sm" onclick="phC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="phC('${i.id}',1)">+</button>`
      + `<button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div>`;
  }
  if (i.sec == 'glass') {
    const g = S.gg.find(x => x.id == i.gid); if (!g) return '';
    const s = gSt(i, g, i.ty), j = Math.max(0, S.tags.glass.indexOf(i.ty));
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="go('sec',{k:'glass',ty:${j}})"><b>زجاج ${esc(i.ty)}: ${esc(g.models.join(' / '))}</b><div class="m">المجموع ${gEst(i, g) ? '≈' : ''}${gTot(i, g)}${i.price ? ' · ' + esc(i.price) : ''} · ${dBadge}</div></div>`
      + `<button class="btn s sm" onclick="go('sec',{k:'glass',ty:${j}})">فتح</button><button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div>`;
  }
  if (i.sec == 'case') {
    const s = csSt(i), chips = (i.v || []).map(x => `<div class="cs-chip ${x.n <= 0 ? 'low' : ''}"><span>${esc([x.g, x.c].filter(Boolean).join('·') || 'عام')}</span><button onclick="csC('${i.id}','${x.id}',-1)">−</button><b>${x.n}</b><button onclick="csC('${i.id}','${x.id}',1)">+</button></div>`).join('');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="csQuickNote('${i.id}')"><b>بوشيط ${esc(i.name)}</b><div class="m">المجموع ${csTot(i)}${i.price ? ' · ' + esc(i.price) : ''} · ${dBadge}</div></div>`
      + `<button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div>${chips ? `<div class="cs-chips">${chips}</div>` : ''}</div>`;
  }
  if (i.sec == 'acc') {
    const s = acSt(i), cn = typeof i.cnt == 'number';
    const act = cn ? `<button class="btn s sm" onclick="acC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="acC('${i.id}',1)">+</button>`
      : ['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" style="margin:0;padding:4px 7px;font-size:.74rem" onclick="acS('${i.id}','${x}')">${ALB[x]}</button>`).join('');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="acEd('${i.id}')"><b>${esc(acTitle(i))}</b><div class="m">${i.price ? esc(i.price) + ' · ' : ''}${dBadge}</div></div>`
      + act + `<button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div>`;
  }
  return '';
}

function rCf(id) { const i = find(id); if (i) upd(() => touch(i, 1)); }
function rCfAg(e) {
  const d = agD(e); if (!d) return;
  upd(() => {
    let g = S.ag.find(x => x.id == d.id);
    if (!g) { g = { id: d.id, kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw }; S.ag.push(g); }
    g.by = S.me; g.at = g.cf = Date.now();
    d.mem.forEach(m => touch(m, 1));
  });
}
function rCfTp(id) {
  const r = (S.tp || []).find(x => x.id == id); if (!r) return;
  upd(() => { r.by = S.me; r.at = r.cf = Date.now(); });
}

function jlFiltered() {
  const allMode = V.jm == 'all', sec = V.js || 'all', q = nz(V.jq || '');
  return rnd(allMode).filter(i => (sec == 'all' || jlSecOf(i) == sec) && (!q || nz(jlTextOf(i)).includes(q)));
}

function rCfAll() {
  const L = jlFiltered().slice(0, 40);
  if (!L.length) return;
  commit('تم تأكيد ' + L.length + ' صنف في الجرد', () => {
    const now = Date.now();
    L.forEach(i => {
      if (i._jl == 'ag') {
        let g = S.ag.find(x => x.id == i.id);
        if (!g) { g = { id: i.d.id, kind: i.d.kind, conn: i.d.conn, tier: i.d.tier, pw: i.d.pw }; S.ag.push(g); }
        g.by = S.me; g.at = g.cf = now;
        i.d.mem.forEach(m => touch(m, 1));
      } else if (i._jl == 'tp') {
        i.r.by = S.me; i.r.at = i.r.cf = now;
      } else {
        touch(i, 1);
      }
    });
  });
}

const JL_TABS = [['all', 'الكل'], ['phones', 'الهواتف'], ['glass', 'الأنتي كاس'], ['case', 'البوشيط'], ['acc', 'الإكسسوارات'], ['tp', 'التعبئة']];
function jlRefreshList() {
  const L = jlFiltered(), a = L.slice(0, 40), box = $('jl_list'), btn = $('jl_cf_all');
  if (btn) { btn.hidden = !a.length; btn.innerHTML = `${I('check')} تأكيد كل القائمة الظاهرة (${a.length})`; }
  if (box) box.innerHTML = a.map(jlCompactRow).join('') || '<p class="m" style="text-align:center;margin:20px 0">كل الأصناف في هذا القسم مؤكدة حديثاً ✓</p>';
}
VW.jl = () => {
  const allMode = V.jm == 'all', sec = V.js || 'all', staleCnt = rnd(false).length;
  const L = jlFiltered(), a = L.slice(0, 40);
  return {
    t: 'الجرد والجولة اليومية',
    h: `<div class="card" style="padding:10px 12px;margin:4px 0 8px"><div class="row2"><b style="flex:1">${esc(jlSecSummary(sec))}</b><span class="m">غير مؤكد: ${staleCnt}</span></div></div>`
      + `<div class="row2" style="gap:6px;margin-bottom:8px">`
      + `<button class="tag ${!allMode ? 'on' : ''}" style="flex:1;margin:0;justify-content:center" onclick="V.jm='old';render()">يحتاج تأكيداً (${staleCnt})</button>`
      + `<button class="tag ${allMode ? 'on' : ''}" style="flex:1;margin:0;justify-content:center" onclick="V.jm='all';render()">جرد شامل للقسم</button>`
      + `</div>`
      + `<div class="rtabs">${JL_TABS.map(([k, l]) => `<button class="tag ${sec == k ? 'on' : ''}" onclick="V.js='${k}';render()">${l}</button>`).join('')}</div>`
      + `<input placeholder="ابحث داخل الجرد: موديل أو ماركة..." value="${esc(V.jq || '')}" oninput="V.jq=this.value;jlRefreshList()">`
      + `<button id="jl_cf_all" class="btn s" ${a.length ? '' : 'hidden'} onclick="rCfAll()">${I('check')} تأكيد كل القائمة الظاهرة (${a.length})</button>`
      + `<div id="jl_list">${a.map(jlCompactRow).join('') || '<p class="m" style="text-align:center;margin:20px 0">كل الأصناف في هذا القسم مؤكدة حديثاً ✓ — اضغط «جرد شامل للقسم» إن أردت مراجعة كل المخزون.</p>'}</div>`
  };
};
HOME.after.push(() => {
  const n = rnd(false).length;
  return `<button class="btn s" onclick="go('jl')">${I('check')} الجرد والجولة اليومية${n ? ` (${n} يحتاج تأكيداً)` : ''}</button>`;
});

/* ============================ كاشف الأثمنة الفوري (ملخص شامل للموديل في البحث) ============================ */
window.priceLookupHtml = function (q) {
  const n = nz(q); if (n.length < 2) return '';
  const phs = ph().filter(i => nzOf(i, nzText).includes(n)).slice(0, 6);
  const gls = S.gg.filter(g => g.models.some(m => nz(((g.br || {})[m] || '') + m).includes(n))).slice(0, 4);
  const css = S.items.filter(i => i.sec == 'case' && nzOf(i, nzText).includes(n)).slice(0, 4);
  const gds = (S.guide || []).filter(g => nz(g.m + ' ' + g.f + ' ' + (g.n || '')).includes(n)).slice(0, 6);
  const acs = S.items.filter(i => i.sec == 'acc' && nzOf(i, nzText).includes(n)).slice(0, 5);
  const cats = (phs.length ? 1 : 0) + (gls.length ? 1 : 0) + (css.length ? 1 : 0) + (gds.length ? 1 : 0) + (acs.length ? 1 : 0);
  if (!cats) return '';
  let rows = '';
  phs.forEach(i => {
    const s = phSt(i), sub = [i.color, i.ram, i.cap, i.cond && i.cond != 'جديد' && i.cond].filter(Boolean).join('·');
    rows += `<div class="prc-r" onclick="phEd('${i.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="prc-t">📱 <b>${esc(i.brand + ' ' + i.name)}</b> ${sub ? `<small class="m">(${esc(sub)})</small>` : ''} <small class="m">· متاح ${av(i)}</small></span><b class="cmp-pr">${esc(i.price ? i.price + ' درهم' : 'بدون سعر')}</b></div>`;
  });
  gls.forEach(g => {
    S.tags.glass.forEach((ty, j) => {
      const it = gitem(g.id, ty), tot = it ? gTot(it, g) : 0, s = it ? gSt(it, g, ty) : 'r';
      if (tot > 0 || (it && it.price)) {
        rows += `<div class="prc-r" onclick="glMin('${g.id}',${j})"><span class="dotl" style="background:${DT[s]}"></span><span class="prc-t">🛡️ زجاج <b>${esc(ty)}</b> <small class="m">(${esc(g.models.join('/'))}) · ${it && gEst(it, g) ? '≈' : ''}${tot}</small></span><b class="cmp-pr">${esc(it && it.price ? it.price + ' درهم' : 'حدّد السعر')}</b></div>`;
      }
    });
  });
  css.forEach(c => {
    const s = csSt(c);
    rows += `<div class="prc-r" onclick="csLimEd('${c.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="prc-t">🅿️ بوشيط <b>${esc(c.name)}</b> <small class="m">· المتوفر ${csTot(c)}</small></span><b class="cmp-pr">${esc(c.price ? c.price + ' درهم' : 'حدّد السعر')}</b></div>`;
  });
  acs.forEach(a => {
    const s = acSt(a);
    rows += `<div class="prc-r" onclick="acEd('${a.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="prc-t">🔌 <b>${esc(acName(a))}</b></span><b class="cmp-pr">${esc(a.price ? a.price + ' درهم' : '—')}</b></div>`;
  });
  gds.forEach(g => {
    rows += `<div class="prc-r" onclick="go('gd')"><span class="dotl" style="background:var(--p)"></span><span class="prc-t">🔧 إصلاح <b>${esc(g.m)}</b> — ${esc(g.f)}${g.n ? ` <small class="m">(${esc(g.n)})</small>` : ''}</span><b class="cmp-pr">${esc(g.p)} درهم</b></div>`;
  });
  if (!rows) return '';
  return `<div class="card prc-card"><div class="row2" style="margin-bottom:6px"><b>${I('tag')} ملخص الأثمنة والتوفر</b><span class="m" style="font-size:.78rem">اضغط على أي سطر للتعديل</span></div>${rows}</div>`;
};
SRCH.unshift({
  k: 'prc',
  l: 'الأثمنة',
  run: n => { const h = window.priceLookupHtml(n); return h ? [h] : []; }
});

/* ============================ الباركود و IMEI والبيع السريع المتتالي ============================ */
let BS = null, BI = 0, BCODE = '', BDP = null, BC_AC = null, BC_LAST = { c: '', t: 0 };
const BCX = [], BCM = [];   // ملف الصيانة والمستعمل يضيفان أزراراً (BCX) ونتائج مطابقة (BCM)
function bcStop() { clearInterval(BI); if (BS) { BS.getTracks().forEach(t => t.stop()); BS = null; } }

/* نغمة صوتية قصيرة (Beep) عند المسح بدون ملفات صوتية خارجية */
function bcBeep(ok = true) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    BC_AC = BC_AC || new Ctx(); if (BC_AC.state === 'suspended') BC_AC.resume();
    const o = BC_AC.createOscillator(), g = BC_AC.createGain();
    o.type = ok ? 'sine' : 'triangle';
    o.frequency.value = ok ? 920 : 320;
    g.gain.setValueAtTime(0.16, BC_AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, BC_AC.currentTime + (ok ? 0.09 : 0.18));
    o.connect(g); g.connect(BC_AC.destination);
    o.start(); o.stop(BC_AC.currentTime + (ok ? 0.09 : 0.18));
  } catch (e) { }
}

let BDX = null;
function loadPoly() {   // ماسح بديل (للمتصفحات التي لا تدعم المسح الأصلي مثل Brave)
  if (window.BarcodeDetectorPolyfill) return Promise.resolve(true);
  if (BDP) return BDP;
  return BDP = new Promise(res => {
    const s = document.createElement('script'); s.src = 'https://fastly.jsdelivr.net/npm/barcode-detector@2.3.1/dist/iife/pure.min.js';
    s.onload = () => res(!!window.BarcodeDetectorPolyfill); s.onerror = () => { BDP = null; res(false); }; document.head.appendChild(s);
  });
}
async function bdNew() {   // الأصلي إن كان يعمل فعلاً، وإلا البديل
  if (BDX) return BDX;
  if ('BarcodeDetector' in window && !window.BarcodeDetectorPolyfill) {
    try { const t = new window.BarcodeDetector(), c = document.createElement('canvas'); c.width = c.height = 8; await t.detect(c); return BDX = t; } catch (e) { }
  }
  if (await loadPoly()) { try { return BDX = new window.BarcodeDetectorPolyfill(); } catch (e) { } }
  return null;
}
function camErr(e) {   // سبب فشل الكاميرا بكلام مفهوم
  const n = (e && e.name) || '';
  if (!window.isSecureContext) return 'الكاميرا تحتاج رابطاً آمناً (https)';
  if (n == 'NotAllowedError' || n == 'SecurityError' || n == 'PermissionDeniedError') return 'الكاميرا محظورة: اسمح بها من إعدادات الموقع في المتصفح، ومن إعدادات أندرويد ← التطبيقات ← المتصفح ← الأذونات ← الكاميرا';
  if (n == 'NotFoundError' || n == 'OverconstrainedError') return 'لم يتم العثور على كاميرا في هذا الجهاز';
  if (n == 'NotReadableError' || n == 'AbortError') return 'الكاميرا مشغولة بتطبيق آخر، أغلقه وأعد المحاولة';
  return 'تعذر فتح الكاميرا' + (n ? ' (' + n + ')' : '');
}
async function bcScan(cb, onContinuous) {
  if (!BDX) toast('جارٍ تجهيز ماسح الباركود...');
  const d = await bdNew();
  if (!d || !navigator.mediaDevices) return toast('تعذّر تجهيز ماسح الباركود: تحقق من الاتصال بالإنترنت ثم أعد المحاولة', 0, 12000);
  BC_LAST = { c: '', t: 0 };
  const qMode = bcQ();
  $('sh').innerHTML = `<div class="bar"></div><h3>${qMode ? I('zap') + ' البيع السريع المتتالي (−1)' : 'وجّه الكاميرا نحو الباركود'}</h3>`
    + (qMode ? `<div class="m" style="margin-bottom:6px">تبقى الكاميرا مفتوحة لخصم عدة سلع متتالية</div>` : '')
    + `<video id="bcv" autoplay playsinline muted style="width:100%;border-radius:14px"></video><div id="bc_log" style="margin-top:8px"></div><button class="btn s" onclick="finish(null)">إغلاق</button>`;
  sheetOpen(v => { bcStop(); if (v) cb(v); });
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
    if (!SH) { s.getTracks().forEach(t => t.stop()); return; } BS = s; const v = $('bcv'); v.srcObject = s;
    BI = setInterval(() => {
      d.detect(v).then(r => {
        if (!r[0] || !BS) return;
        const c = String(r[0].rawValue || '').trim(); if (!c) return;
        if (BC_LAST.c === c && Date.now() - BC_LAST.t < 2200) return;   // منع تكرار المسح لنفس العلبة خلال ثانيتين
        BC_LAST = { c, t: Date.now() };
        if (onContinuous && onContinuous(c)) return;   // استمرار الكاميرا في وضع البيع السريع
        bcStop(); finish(c);
      }).catch(() => { });
    }, 350);
  }).catch(e => { if (SH) finish(null); toast(camErr(e), 0, 15000); });
}
let INL = null, INT = 0;
function stopInlineScan() { clearInterval(INT); if (INL) { INL.getTracks().forEach(t => t.stop()); INL = null; } const b = $('inline_bc_box'); if (b) b.remove(); }
async function scanIntoInput(inputId) {   // مسح داخل نموذج مفتوح (حقل IMEI)
  if ($('inline_bc_box')) return stopInlineScan(); const inp = $(inputId); if (!inp) return;
  const det = await bdNew(); if (!det || !navigator.mediaDevices) return toast('تعذّر تجهيز ماسح الباركود: تحقق من الاتصال بالإنترنت ثم أعد المحاولة', 0, 12000);
  (inp.closest('label') || inp.parentElement).insertAdjacentHTML('afterend', '<div id="inline_bc_box" class="card" style="margin:8px 0;padding:10px;text-align:center"><div class="m" style="margin-bottom:6px">وجّه الكاميرا نحو باركود IMEI على العلبة أو الشاشة (*#06#)</div><video id="inline_bcv" autoplay playsinline muted style="width:100%;max-height:190px;object-fit:cover;border-radius:10px"></video><button type="button" class="btn s sm" style="margin-top:8px;width:100%" onclick="stopInlineScan()">إلغاء المسح</button></div>');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(st => {
    const v = $('inline_bcv'); if (!v) { st.getTracks().forEach(t => t.stop()); return; } INL = st; v.srcObject = st;
    INT = setInterval(() => { det.detect(v).then(c => { if (c && c[0] && INL) { const val = String(c[0].rawValue || '').trim(); if (val) { const cur = inp.value.trim(); inp.value = cur && !cur.includes(val) ? cur + ' · ' + val : val; bcBeep(true); stopInlineScan(); toast('تم التقاط الرمز: ' + val); } } }).catch(() => { }); }, 350);
  }).catch(e => { stopInlineScan(); toast(camErr(e), 0, 15000); });
}
HK.hide.push(() => { stopInlineScan(); bcStop(); });
const bcLbl = i => i.sec == 'phones' ? i.brand + ' ' + i.name : i.sec == 'case' ? i.name : acName(i);
const isImei = c => /^\d{14,17}$/.test(c);

/* اختيار سريع للون/نوع البوشيط عند البيع السريع بالباركود إذا كان له عدة ألوان متوفرة */
function bcPickCsVar(it) {
  const avs = (it.v || []).filter(x => x.n > 0);
  if (!avs.length) return toast('نفد هذا البوشيط بالفعل');
  setTimeout(() => {
    $('sh').innerHTML = `<div class="bar"></div><h3>بيع سريع (−1): بوشيط ${esc(it.name)}</h3><p class="m">اختر النوع/اللون الذي بيع:</p>`
      + avs.map(x => `<button class="btn s" onclick="finish('${x.id}')">${esc([x.g, x.c].filter(Boolean).join(' · ') || 'عام')} (المتوفر: ${x.n})</button>`).join('')
      + `<button class="btn s" onclick="finish(null)">إلغاء</button>`;
    sheetOpen(vid => {
      if (!vid) return;
      const v = (it.v || []).find(x => x.id == vid); if (!v || v.n <= 0) return;
      const lbl = [v.g, v.c].filter(Boolean).join(' · ') || 'عام';
      commit(`بيع سريع (−1): بوشيط ${it.name} (${lbl})`, () => { v.n = Math.max(0, v.n - 1); touch(it); S.cfg.bcQuick = Date.now(); });
    });
  }, 180);
}

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
    const avs = it.v.filter(x => x.n > 0);
    if (!avs.length) return !toast('نفد هذا البوشيط بالفعل');
    if (avs.length > 1) { bcPickCsVar(it); return true; }
    const v = avs[0];
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
      bcBeep(true);
      const r2 = $('res') || r;
      r2.innerHTML = m.map(itemCard).join('') + x;
      if (bcQ() && m.length == 1 && !x && m[0].sec == 'case' && (m[0].v || []).filter(v => v.n > 0).length > 1) bcPickCsVar(m[0]);
      return;
    }
    bcBeep(false);
    const im = isImei(BCODE), B = (fn, ic2, l, p) => `<button class="btn ${p ? '' : 's'} sm" onclick="${fn}()">${I(ic2)} ${l}</button>`;
    r.innerHTML = `<div class="card"><div class="m">${im ? 'رقم IMEI غير مسجل' : 'باركود غير مسجل'}: <bdi><b>${esc(BCODE)}</b></bdi></div><div class="m" style="margin-top:4px">اختر ما تريد فعله بهذا الرمز:</div><div class="sub" style="margin-top:8px">`
      + (im ? B('bcNewPh', 'mobile', '+ هاتف جديد', 1) + B('bcNewAcc', 'plug', '+ إكسسوار') + B('bcNewCs', 'box', '+ بوشيط') : B('bcNewAcc', 'plug', '+ إكسسوار جديد', 1) + B('bcNewCs', 'box', '+ بوشيط جديد', 1) + B('bcNewPh', 'mobile', '+ هاتف جديد'))
      + BCX.map(f => f(BCODE, im)).join('') + `</div><button class="btn s sm" style="width:100%;margin-top:8px" onclick="bcLink()">ربطه بصنف موجود في المخزون</button></div>`;
  }, c => {
    /* المعالج المستمر عندما يكون وضع البيع السريع مفعلاً */
    if (!bcQ()) return false;
    const nc = nz(c), m = S.items.filter(i => i.sec != 'glass' && (i.code == c || (i.imei && nz(i.imei).includes(nc)))), x = BCM.map(f => f(c)).join('');
    if (m.length == 1 && !x) {
      const it = m[0];
      if (it.sec == 'case' && (it.v || []).filter(v => v.n > 0).length > 1) return false;   // نخرج من الكاميرا لاختيار اللون المباع
      const ok = bcQuickSell(it);
      bcBeep(ok);
      if (ok) {
        S.cfg.bcQuick = Date.now();
        const rem = it.sec == 'case' ? csTot(it) : it.cnt;
        const lg = $('bc_log');
        if (lg) lg.innerHTML = `<div class="card rp-ok" style="margin:0;padding:8px 12px"><b>${I('check')} خُصم 1: ${esc(bcLbl(it))}</b><div class="m">المتبقي: ${rem} — وجّه الكاميرا للسلعة التالية</div></div>`;
        const r2 = $('res'); if (r2) r2.innerHTML = itemCard(it);
        return true;   // تبقى الكاميرا مفتوحة
      }
      return true;
    }
    return false;   // باركود غير مسجل أو له عدة نتائج: نخرج من الكاميرا لعرض الخيارات
  });
}
function bcNewPh() { $('sh').innerHTML = ''; sheetOpen(v => phDone(v, PR)); phForm({ imei: isImei(BCODE) ? BCODE : '', code: BCODE, cnt: 1 }); }
function bcNewAcc() { $('sh').innerHTML = ''; sheetOpen(v => acDone(v, PR)); acForm({ code: BCODE }); }
function bcNewCs() { CSCODE = BCODE; csAdd(); }
function bcLink() { $('sh').innerHTML = '<div class="bar"></div><h3>ربط الرمز بعنصر</h3><label>ابحث عن العنصر<input oninput="bcF(this.value)"></label><div id="pr"></div><button class="btn s" onclick="finish(null)">إلغاء</button>'; sheetOpen(() => { }); bcF(''); }
function bcF(q) { const n = nz(q); $('pr').innerHTML = S.items.filter(i => i.sec != 'glass' && n && nz(hay(i)).includes(n)).slice(0, 8).map(i => `<button class="card row2" onclick="bcSet('${i.id}')"><b>${esc(bcLbl(i))}</b></button>`).join(''); }
function bcSet(id) {
  const i = find(id); if (!i) return;
  upd(() => { if (i.sec == 'phones' && isImei(BCODE)) i.imei = i.imei ? (i.imei.includes(BCODE) ? i.imei : i.imei + ' · ' + BCODE) : BCODE; i.code = i.code || BCODE; i.by = S.me; });
  finish(null); toast('تم ربط الباركود بنجاح');
}
HOME.tools.push(() => `<div class="row2" style="margin:8px 0"><button class="btn s" style="flex:1;margin:0" onclick="bcHome()">${I('scan')} مسح باركود</button><button class="btn ${bcQ() ? '' : 's'} sm" style="min-height:50px" onclick="upd(()=>S.cfg.bcQuick=bcQ()?0:Date.now())" title="خصم قطعة تلقائياً عند المسح (15 دقيقة)">${I('zap')} ${bcQ() ? 'البيع السريع مفعّل' : 'بيع سريع −1'}</button></div>`);

/* ============================ الإعدادات الخاصة بالمخزون ============================ */
VW.st_fld = () => ({
  t: 'الحقول في النماذج',
  h: (can('fields') ? '<p class="m">الأزرق = ظاهر. اضغط لإخفاء الحقل أو إظهاره.</p>' : '<p class="m">التعديل للمدير فقط.</p>')
    + Object.keys(FLD).map(s => `<h3>${FLDN[s] || s}</h3><div>${FLD[s].map(([k, l]) => `<button class="tag ${hd(s, k) ? '' : 'on'}" onclick="fTog('${s}','${k}')">${l}</button>`).join('')}</div>`).join('')
});

const tg = (l, g) => [l, "go('st_tg',{g:'" + g + "'})", () => S.tags[g].length];
const CATS = {   // ملف الصيانة يضيف CATS.rp
  ph: ['الهواتف', [tg('الماركات', 'brand'), tg('الألوان', 'color'), tg('السعات', 'cap'), tg('RAM', 'ram'), ['الحد العام: «قارب النفاد» عند عدد', "limEd('low')", () => lim('low') + ' فأقل'], ['ألوان الماركات وحدودها', "go('st_br')"]], 'phones'],
  gl: ['الأنتي كاس', [tg('أنواع الزجاج', 'glass'), ['حد «قارب النفاد» لكل نوع زجاج', "go('st_gl')", () => (lim('gmin') - 1) + ' فأقل'], ['كم تُحسب المستويات (غامق / أخضر / فاتح / قليل)', "go('st_gl2')"]], null],
  cs: ['البوشيط', [tg('الجنس', 'gender'), tg('الألوان', 'color'), ['الحد العام: «قارب النفاد» عند مجموع', "limEd('cl')", () => lim('cl') + ' فأقل']], 'case'],
  ac: ['الإكسسوارات', [tg('الأنواع', 'kind'), tg('الموصلات', 'conn'), tg('الفئات السعرية', 'tier'), tg('القدرات (واط)', 'pw'), ['الحد العام للقطع بعدد: «قليل» عند', "limEd('acl')", () => lim('acl') + ' فأقل'], ['الحد العام للمجموعات (كابل/شاحن) عند', "limEd('agl')", () => lim('agl') + ' فأقل'], ['إعداد كل نوع (الخاصيات، العرض، الحد)', "go('st_ak')"]], 'acc']
};
VW.st_c = () => { const c = CATS[V.c] || CATS.ph; return { t: c[0], h: c[1].map(([l, fn, n]) => row(l, fn, n ? n() : '')).join('') + (c[2] ? row('خانات مخصصة لهذا القسم', "go('st_fx',{fs:'" + c[2] + "'})", S.fields.filter(f => f.sec == c[2]).length || '') : '') }; };
MORE.push(
  { g: 'sec', o: 10, l: 'الهواتف', fn: "go('st_c',{c:'ph'})" }, { g: 'sec', o: 20, l: 'الأنتي كاس', fn: "go('st_c',{c:'gl'})" },
  { g: 'sec', o: 30, l: 'البوشيط', fn: "go('st_c',{c:'cs'})" }, { g: 'sec', o: 40, l: 'الإكسسوارات', fn: "go('st_c',{c:'ac'})" },
  { g: 'look', o: 20, l: 'تلوين البطاقات', fn: "go('st_col')" }, { g: 'look', o: 30, l: 'الحقول في النماذج', fn: "go('st_fld')" },
  { g: 'look', o: 40, l: 'الخانات المخصصة', fn: "go('st_fx')", n: () => S.fields.length || '' }
);

/* حدود الأنتي كاس */
function glTyEd(j) {
  if (!isAdmin()) return toast('للمدير فقط'); const t = S.tags.glass[j], c = (S.cfg.gtl || {})[t];
  ask('حد زجاج ' + t, [{ k: 'n', l: `«قارب النفاد» عند مجموع المجموعة (فارغ = الحد العام ${lim('gmin') - 1} فأقل). اكتب 0 للنوع النادر`, t: 'tel', v: c != null ? c - 1 : '' }]).then(v => {
    if (!v) return; const n = v.n.trim();
    upd(() => { S.cfg.gtl = S.cfg.gtl || {}; if (n === '') delete S.cfg.gtl[t]; else S.cfg.gtl[t] = ci(n) + 1; });
  });
}
VW.st_gl = () => ({ t: 'حدود الأنتي كاس', h: '<p class="m">يُحكم على كل مجموعة موديلات بمجموعها: «قارب النفاد» عند العدد المحدد فأقل. الترتيب: حد المجموعة الخاص (زر «الحد والسعر» داخل بطاقتها) ثم حد نوع الزجاج ثم الحد العام.</p>'
  + row('الحد العام لكل الأنواع', "limEd('gmin')", (lim('gmin') - 1) + ' فأقل') + '<h3>حد خاص بنوع زجاج</h3>'
  + S.tags.glass.map((t, j) => { const c = (S.cfg.gtl || {})[t]; return row(t, 'glTyEd(' + j + ')', c != null ? (c - 1) + ' فأقل' : 'العام'); }).join('') });
VW.st_gl2 = () => ({ t: 'مستويات الأنتي كاس', h: '<p class="m">عندما تختار مستوى تقريبياً (غامق / أخضر / فاتح / قليل) بدل عدد دقيق، يحسب التطبيق كل مستوى كعدد القطع الظاهر هنا ليحكم على مجموع المجموعة. غيّرها فقط إن اختلفت تقديراتك.</p>'
  + ['gA', 'gB', 'gC', 'gY'].map(k => row((LM.find(x => x[0] == k) || [, k])[1].replace('أنتي كاس: ', ''), "limEd('" + k + "')", lim(k))).join('') });

/* الألوان */
let CE = {};
window.cePv = () => { const p = $('cpv'); if (p) p.style.borderInlineStartColor = CE.c || 'transparent'; };
function ceR() {
  if ($('blim')) CE.l = $('blim').value;
  const cur = CE.c || '', inP = PAL.includes(cur), hex = /^#[0-9a-f]{6}$/i.test(cur);
  const sw = `<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">${PAL.map(c => `<button class="sw ${cur == c ? 'on' : ''}" style="background:${c};margin:2px" onclick="CE.c='${c}';ceR()"></button>`).join('')}</div>`
    + `<div class="row2" style="margin-top:8px"><label class="sw ${cur && !inP ? 'on' : ''}" style="display:inline-block;position:relative;overflow:hidden;background:${cur && !inP ? cur : 'conic-gradient(#ef4444,#eab308,#22c55e,#06b6d4,#3b82f6,#d946ef,#ef4444)'}"><input type="color" value="${hex ? cur : '#3b82f6'}" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;padding:0;border:0;cursor:pointer" oninput="CE.c=this.value;cePv()" onchange="ceR()"></label><span class="m" style="flex:1">لون آخر من اللوحة الكاملة</span><button class="tag ${cur ? '' : 'on'}" onclick="CE.c='';ceR()">بدون</button></div>`;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(CE.n)}</h3>` + (CE.t == 's' ? `<label>التلوين</label><div>${CE.mo.map(([k, l]) => `<button class="tag ${CE.m == k ? 'on' : ''}" onclick="CE.m='${k}';ceR()">${l}</button>`).join('')}</div>` : '')
    + ((CE.t == 'b' || CE.m == 's') ? `<label>اللون</label><div id="cpv" class="card" style="border-inline-start:8px solid ${cur || 'transparent'};margin:6px 0 10px"><b>${esc(CE.n)}</b> <span class="m">معاينة البطاقة</span></div>${sw}` : '') + (CE.t == 'b' ? `<label>حد «قارب على النفاد» لهواتف هذه الماركة (فارغ = الحد العام)</label><input id="blim" type="tel" value="${esc(CE.l)}">` : '')
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="if($('blim'))CE.l=$('blim').value;finish(CE)">حفظ</button></div>`;
}
function ceOpen(o, cb) { if (!can('tags')) return toast('للمدير فقط'); CE = o; ceR(); sheetOpen(cb); }
function brEd(j) { const b = S.tags.brand[j]; ceOpen({ t: 'b', n: b, c: BC(b), l: (S.cfg.bl || {})[b] ?? '' }, v => { if (!v) return; upd(() => { S.cfg.bcol = S.cfg.bcol || {}; S.cfg.bcol[b] = v.c; S.cfg.bl = S.cfg.bl || {}; const l = String(v.l).trim(); if (l === '') delete S.cfg.bl[b]; else S.cfg.bl[b] = Math.max(1, +l || 1); }); }); }
function cmEd(s) { ceOpen({ t: 's', n: SN3[s], m: CM(s), c: SCOL(s), mo: s == 'acc' ? [['s', 'لون واحد للقسم'], ['o', 'بدون']] : [['b', 'حسب الماركة'], ['s', 'لون واحد للقسم'], ['o', 'بدون']] }, v => { if (!v) return; upd(() => { S.cfg.cm = S.cfg.cm || {}; S.cfg.cm[s] = v.m; S.cfg.scol = S.cfg.scol || {}; S.cfg.scol[s] = v.c; }); }); }
VW.st_col = () => ({ t: 'الألوان', h: '<p class="m">ألوان خفيفة على خلفية البطاقات للتمييز بسرعة.</p>' + ['phones', 'glass', 'case', 'acc'].map(s => { const m = CM(s), c = m == 's' ? SCOL(s) : ''; return `<button class="card row2" onclick="cmEd('${s}')"><b>${SN3[s]}</b><span class="m">${MN[m]}</span>${c ? `<span class="dotl" style="background:${c}"></span>` : ''}</button>`; }).join('') + row('ألوان الماركات وحدودها', "go('st_br')") });
VW.st_br = () => ({ t: 'ألوان الماركات', h: '<p class="m">اللون + حد «قارب على النفاد» لكل ماركة (اختياري).</p>' + S.tags.brand.map((b, j) => { const c = BC(b), l = (S.cfg.bl || {})[b]; return `<button class="card row2" onclick="brEd(${j})"><b>${esc(b)}</b><span class="m">${l != null ? 'حد ' + l + ' فأقل' : ''}</span>${c ? `<span class="dotl" style="background:${c}"></span>` : ''}</button>`; }).join('') });

/* إعداد كل نوع إكسسوار: صفحة مستقلة (ما يظهر + خاصيات + العرض + الحد) */
const akProps = k => S.fields.filter(f => f.sec == 'acc' && (f.kinds || []).includes(k));
function akTog(j, key) {
  if (!isAdmin()) return toast('للمدير فقط');
  const k = S.tags.kind[j];
  upd(() => {
    S.cfg.kc = S.cfg.kc || {}; S.cfg.gkc = S.cfg.gkc || {};
    const c = kc(k), g = gkc(k);
    if (key == 'conn' || key == 'tier') S.cfg.kc[k] = { ...(S.cfg.kc[k] || {}), conn: c.conn, tier: c.tier, [key]: c[key] ? 0 : 1 };
    else S.cfg.gkc[k] = { ...(S.cfg.gkc[k] || {}), g: g.g, w: g.w, [key]: g[key] ? 0 : 1 };
  });
}
function akLim(j, w) {
  if (!isAdmin()) return toast('للمدير فقط');
  const k = S.tags.kind[j], grp = w == 'g', cur = grp ? gkc(k).lim : kc(k).lim, gen = lim(grp ? 'agl' : 'acl');
  ask('الحد — ' + k, [{ k: 'n', l: (grp ? '«قارب النفاد» عند مجموع المجموعة' : '«قليل» لكل قطعة من هذا النوع عند') + ' (فارغ = الحد العام ' + gen + ' فأقل)', t: 'tel', v: cur ?? '' }]).then(v => {
    if (!v) return; const n = v.n.trim();
    upd(() => {
      const o = grp ? (S.cfg.gkc = S.cfg.gkc || {}) : (S.cfg.kc = S.cfg.kc || {}), c = kc(k), g = gkc(k);
      o[k] = { ...(o[k] || {}), ...(grp ? { g: g.g, w: g.w } : { conn: c.conn, tier: c.tier }) };
      if (n === '') delete o[k].lim; else o[k].lim = ci(n);
    });
  });
}
VW.st_akk = () => {
  const j = V.kj ?? 0, k = S.tags.kind[j]; if (k == null) return VW.st_ak();
  const c = kc(k), g = gkc(k), P = akProps(k), t = (key, l, on) => `<button class="tag ${on ? 'on' : ''}" onclick="akTog(${j},'${key}')">${l}</button>`;
  return {
    t: k,
    h: '<h3>ما يظهر عند إضافة هذا النوع</h3><div>' + t('conn', 'الموصل', c.conn) + t('tier', 'الفئة (السعر)', c.tier) + t('w', 'القدرة (واط)', g.w) + '</div>'
      + '<h3>خاصيات إضافية</h3><p class="m">مثل السعة (GB أو mAh) أو الطول. تظهر عند الإضافة، وتدخل في اسم القطعة والبحث وتمنع اعتبار قطعتين مختلفتين مكررتين.</p>'
      + P.map(f => row(f.name, `feEd('${f.id}')`, (f.unit ? f.unit + ' · ' : '') + f.opts.length + ' خيار')).join('')
      + `<button class="btn s" onclick="feEd(null,${j})">+ خاصية جديدة</button>`
      + '<h3>طريقة العرض</h3><div>' + t('g', 'مجموعات حسب الفئة', g.g) + '</div><p class="m">للكابلات والشواحن: يُحكم على المجموع بدل كل قطعة.</p>'
      + '<h3>الحد</h3>' + (g.g ? row('«قارب النفاد» عند مجموع المجموعة', `akLim(${j},'g')`, (g.lim ?? lim('agl')) + ' فأقل') : row('«قليل» لكل قطعة من هذا النوع عند', `akLim(${j},'p')`, (c.lim ?? lim('acl')) + ' فأقل'))
  };
};
VW.st_ak = () => ({
  t: 'إعداد أنواع الإكسسوارات',
  h: '<p class="m">اضغط على نوع لضبط ما يظهر عند إضافته، وخاصياته (كالسعة)، وطريقة عرضه، وحده.</p>' + (can('tags') ? '<button class="btn" onclick="tgAdd(\'kind\')">+ نوع جديد</button>' : '')
    + S.tags.kind.map((k, j) => { const c = kc(k), g = gkc(k); return row(k, "go('st_akk',{kj:" + j + "})", [g.g && 'مجموعات', c.conn && 'موصل', c.tier && 'فئة', g.w && 'واط', ...akProps(k).map(f => f.name)].filter(Boolean).join(' · ')); }).join('')
});

/* إدارة الخانات المخصصة */
let FE = {};
VW.st_fx = () => ({ t: 'الخانات المخصصة', h: '<p class="m">خانة إضافية بخيارات تظهر في نموذج القسم وعلى البطاقة وتدخل في البحث.</p>' + (can('fields') ? '<button class="btn" onclick="feEd(null)">+ إضافة خانة</button>' : '') + Object.keys(SECN).filter(s => !V.fs || V.fs == s).map(s => `<h3>${SECN[s]}</h3>` + (S.fields.filter(f => f.sec == s).map(f => `<button class="card row2" onclick="feEd('${f.id}')"><b style="flex:1">${esc(f.name)}</b><span class="m">${f.kinds && f.kinds.length ? esc(f.kinds.join('، ')) : 'الكل'} · ${f.multi ? 'عدة قيم' : 'قيمة'} · ${f.opts.length}</span></button>`).join('') || '<p class="m">لا شيء</p>')).join('') });
function feR() {
  if ($('fen')) { FE.name = $('fen').value; FE.opts = $('feo').value; FE.unit = $('feu').value; }
  const kl = FE.sec == 'phones' ? S.tags.brand : FE.sec == 'acc' ? S.tags.kind : null;
  $('sh').innerHTML = `<div class="bar"></div><h3>${FE.id ? 'تعديل خانة' : 'خانة جديدة'}</h3><label>اسم الخانة (مثال: الموصل)</label><input id="fen" value="${esc(FE.name)}"><label>الوحدة (اختياري: GB أو mAh — تُلحق تلقائياً بالأرقام التي تكتبها)</label><input id="feu" value="${esc(FE.unit || '')}"><label>القسم</label><div>${Object.keys(SECN).map(s => `<button class="tag ${FE.sec == s ? 'on' : ''}" onclick="FE.sec='${s}';FE.kinds=[];feR()">${SECN[s]}</button>`).join('')}</div>`
    + (kl ? `<label>تظهر لـ ${FE.sec == 'phones' ? 'ماركات' : 'أنواع'} محددة (بدون اختيار = الكل)</label><div>${kl.map((k, j) => `<button class="tag ${FE.kinds.includes(k) ? 'on' : ''}" onclick="feK(${j})">${esc(k)}</button>`).join('')}</div>` : '')
    + `<label>طريقة الاختيار</label><div><button class="tag ${FE.multi ? '' : 'on'}" onclick="FE.multi=false;feR()">قيمة واحدة</button><button class="tag ${FE.multi ? 'on' : ''}" onclick="FE.multi=true;feR()">عدة قيم</button></div><label>الخيارات (واحد في كل سطر)<textarea id="feo">${esc(FE.opts)}</textarea></label>`
    + `<div class="acts">${FE.id ? '<button class="btn d" onclick="finish({del:1})">حذف</button>' : ''}<button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="feOk()">حفظ</button></div>`;
}
function feK(j) { const k = (FE.sec == 'phones' ? S.tags.brand : S.tags.kind)[j]; FE.kinds = FE.kinds.includes(k) ? FE.kinds.filter(x => x != k) : [...FE.kinds, k]; feR(); }
function feOk() { FE.name = $('fen').value.trim(); FE.opts = $('feo').value; FE.unit = $('feu').value.trim(); if (!FE.name) return toast('اكتب اسم الخانة'); finish({ ok: 1 }); }
function feEd(id, kj) {
  if (!can('fields')) return toast('للمدير فقط'); const f = id ? S.fields.find(x => x.id == id) : null;
  FE = f ? { id: f.id, name: f.name, sec: f.sec, kinds: [...(f.kinds || [])], multi: !!f.multi, unit: f.unit || '', opts: f.opts.join('\n') } : { id: '', name: '', sec: kj != null ? 'acc' : V.fs || 'acc', kinds: kj != null ? [S.tags.kind[kj]] : [], multi: false, unit: '', opts: '' };
  feR();
  sheetOpen(v => {
    if (!v) return;
    upd(() => {
      if (v.del) { S.fields = S.fields.filter(x => x.id != FE.id); return; }
      const o = { name: FE.name, sec: FE.sec, kinds: FE.kinds, multi: FE.multi, unit: FE.unit, opts: FE.opts.split('\n').map(s => fxNorm(s, FE.unit)).filter(Boolean) };
      if (FE.id) Object.assign(S.fields.find(x => x.id == FE.id), o); else S.fields.push({ id: uid(), ...o });
    });
  });
}

/* ============================ إدارة الوسوم الموحدة (بدون تكرار + حماية الزجاج والسلة) ============================ */
function tgCount(g, val) {
  let n = 0;
  if (['brand', 'color', 'cap', 'ram', 'kind', 'conn', 'tier', 'pw'].includes(g)) {
    S.items.forEach(i => {
      if (i[g] === val) n++;
      else if (g == 'color' && i.sec == 'case' && (i.v || []).some(x => x.c === val)) n++;
    });
  }
  if (g == 'brand') S.gg.forEach(x => { if (Object.values(x.br || {}).includes(val)) n++; });
  if (g == 'gender') S.items.forEach(i => { if (i.sec == 'case' && (i.v || []).some(x => x.g === val)) n++; });
  if (g == 'glass') S.items.forEach(i => { if (i.sec == 'glass' && i.ty === val && (sumv(i.stock) > 0 || Object.keys(i.lv || {}).length > 0)) n++; });
  if (g == 'fault') {
    (S.rp || []).forEach(r => { if ((r.fault || '').split('،').map(s => s.trim()).includes(val)) n++; });
    (S.guide || []).forEach(d => { if (d.f === val) n++; });
  }
  return n;
}
function tgReplace(g, oldV, newV) {
  if (oldV === newV) return;
  if (['brand', 'color', 'cap', 'ram', 'kind', 'conn', 'tier', 'pw'].includes(g)) {
    S.items.forEach(i => {
      if (i[g] === oldV) i[g] = newV;
      if (g == 'color' && i.sec == 'case') (i.v || []).forEach(x => { if (x.c === oldV) x.c = newV; });
    });
  }
  if (g == 'gender') S.items.forEach(i => { if (i.sec == 'case') (i.v || []).forEach(x => { if (x.g === oldV) x.g = newV; }); });
  if (g == 'brand') {
    S.gg.forEach(x => { if (x.br) Object.keys(x.br).forEach(m => { if (x.br[m] === oldV) { if (newV) x.br[m] = newV; else delete x.br[m]; } }); });
    S.fields.forEach(f => { if (f.sec == 'phones' && Array.isArray(f.kinds)) f.kinds = [...new Set(f.kinds.map(k => k === oldV ? newV : k).filter(Boolean))]; });
    ['bcol', 'bl'].forEach(c => { const o = S.cfg && S.cfg[c]; if (o && o[oldV] !== undefined) { if (newV && o[newV] === undefined) o[newV] = o[oldV]; delete o[oldV]; } });
  }
  if (g == 'kind') {
    S.fields.forEach(f => { if (f.sec == 'acc' && Array.isArray(f.kinds)) f.kinds = [...new Set(f.kinds.map(k => k === oldV ? newV : k).filter(Boolean))]; });
    ['kc', 'gkc'].forEach(c => { const o = S.cfg && S.cfg[c]; if (o && o[oldV] !== undefined) { if (newV && o[newV] === undefined) o[newV] = o[oldV]; delete o[oldV]; } });
  }
  if (['kind', 'conn', 'tier', 'pw'].includes(g)) {
    (S.ag || []).forEach(a => { if (a[g] === oldV) { a[g] = newV; a.id = gkey(a); } });
  }
  if (g == 'glass') {
    const o = S.cfg && S.cfg.gtl;
    if (o && o[oldV] !== undefined) { if (newV && o[newV] === undefined) o[newV] = o[oldV]; delete o[oldV]; }
    if (!newV) {
      S.items.filter(i => i.sec == 'glass' && i.ty === oldV).forEach(i => S.trash.push({ id: uid(), coll: 'items', obj: i, label: 'أنتي كاس: ' + oldV, t: Date.now() }));
      S.items = S.items.filter(i => !(i.sec == 'glass' && i.ty === oldV));
    } else {
      S.items = S.items.filter(i => {
        if (i.sec != 'glass' || i.ty !== oldV) return true;
        const t = gitem(i.gid, newV);
        if (!t || t === i) { i.ty = newV; return true; }
        t.stock = t.stock || {}; for (const m in (i.stock || {})) t.stock[m] = (t.stock[m] || 0) + i.stock[m];
        if (i.lv) { t.lv = t.lv || {}; Object.assign(t.lv, i.lv); }
        if (t.min == null && i.min != null) t.min = i.min;
        if (!t.price && i.price) t.price = i.price;
        return false;
      });
    }
  }
  if (g == 'fault') {
    (S.rp || []).forEach(r => {
      if (!r.fault) return;
      const pts = r.fault.split('،').map(s => s.trim()).filter(Boolean);
      if (pts.includes(oldV)) r.fault = [...new Set(pts.map(x => x === oldV ? newV : x).filter(Boolean))].join('، ');
    });
    (S.guide || []).forEach(d => { if (d.f === oldV && newV) d.f = newV; });
  }
}
window.tgRen = (g, i) => {
  if (!can('tags')) return toast('للمدير فقط');
  const oldV = S.tags[g][i]; if (oldV == null) return;
  const cnt = tgCount(g, oldV);
  ask('تعديل اسم الوسم', [{ k: 't', l: 'الاسم الجديد' + (cnt ? ' (سيُحدّث ' + cnt + ' موضع تلقائياً)' : ''), v: oldV }]).then(v => {
    const t = v && v.t.trim(); if (!t || t === oldV) return;
    if (S.tags[g].includes(t)) {
      sure(`«${t}» موجود مسبقاً. هل تريد دمج «${oldV}» فيه؟`, 'دمج', false).then(y => {
        if (y) commit(`تم دمج «${oldV}» في «${t}»`, () => { S.tags[g].splice(i, 1); tgReplace(g, oldV, t); });
      });
      return;
    }
    commit('تم تعديل الوسم إلى «' + t + '»', () => { S.tags[g][i] = t; tgReplace(g, oldV, t); });
  });
};
window.tgDel = (g, i) => {
  if (!can('tags')) return toast('للمدير فقط');
  const val = S.tags[g][i]; if (val == null) return;
  const cnt = tgCount(g, val), others = S.tags[g].filter((_, idx) => idx !== i);
  if (g == 'glass' && !others.length) return toast('لا يمكن حذف آخر نوع زجاج');
  if (!cnt) {
    sure('حذف الوسم «' + val + '» ؟ (غير مستعمل في أي قطعة)').then(y => {
      if (y) commit('تم حذف الوسم', () => { S.tags[g].splice(i, 1); tgReplace(g, val, ''); });
    });
    return;
  }
  const clearOpt = '— مسح الوسم من القطع دون بديل —';
  const opts = g == 'glass' ? others : [clearOpt, ...others];
  ask(`«${val}» مستعمل في ${cnt} موضع`, [
    { k: 'm', l: g == 'glass' ? 'انقل مخزونه إلى نوع زجاج آخر قبل الحذف:' : 'اختر وسماً بديلاً لنقل/دمج القطع إليه قبل الحذف:', t: 'sel', o: opts, v: others[0] || opts[0] }
  ], 'دمج وحذف', true).then(v => {
    if (!v) return;
    const target = v.m === clearOpt ? '' : v.m;
    commit(target ? `تم دمج «${val}» في «${target}»` : `تم حذف «${val}»`, () => {
      S.tags[g].splice(i, 1);
      tgReplace(g, val, target);
    });
  });
};
window.tgEd = window.tgRen;
window.tgDelSmart = window.tgDel;
VW.st_tg = () => {
  const g = V.g, ed = can('tags');
  return {
    t: TG[g],
    h: (ed ? '<p class="m">اضغط على الاسم لتعديله في كل القطع، أو × لحذفه/دمجه.</p>' : '<p class="m">التعديل للمدير فقط.</p>')
      + `<div>${S.tags[g].map((t, i) => {
        const c = tgCount(g, t);
        return `<span class="tag">${ed ? `<span onclick="tgRen('${g}',${i})">${esc(t)}</span>` : esc(t)}${c ? `<small class="m" style="font-size:.75rem">(${c})</small>` : ''}${ed ? `<b onclick="tgDel('${g}',${i})" style="padding-inline-start:4px">×</b>` : ''}</span>`;
      }).join('')}</div>`
      + (ed ? `<button class="btn" onclick="tgAdd('${g}')">+ إضافة</button>` : '')
  };
};
