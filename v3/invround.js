/* ============================================================
   invround.js — الجرد والجولة اليومية + كاشف الأثمنة الفوري
   يُحمَّل بعد invreport.js.
   ============================================================ */
/* ============================ الجرد والجولة اليومية (مضغوط + مقسم بالرفوف + شامل/قديم) ============================ */
function rndAll() {
  const out = [];
  S.items.forEach(i => {
    if (i.sec == 'acc' && gkc(i.kind).g) return;
    if (i.sec == 'glass' && !S.gg.some(g => g.id == i.gid && gShow(g, i.ty))) return;
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
/* إحصائيات سريعة للرف/القسم: بطاقات أرقام واضحة */
function jlSecSummary(sec, staleCnt) {
  const P = (n, l, cls = '') => `<div class="jl-sum-pill ${cls}"><b><bdi class="ltr">${n}</bdi></b><small>${l}</small></div>`;
  const stP = P(staleCnt, 'غير مؤكد', staleCnt ? 'wn' : '');
  if (sec == 'phones') {
    const A = ph();
    return P(A.length, 'أصناف الهواتف') + P(A.reduce((s, i) => s + (+i.cnt || 0), 0), 'مجموع القطع') + stP;
  }
  if (sec == 'glass') {
    return P(S.gg.length, 'مجموعات الزجاج') + stP;
  }
  if (sec == 'case') {
    const A = S.items.filter(i => i.sec == 'case');
    return P(A.length, 'موديلات البوشيط') + P(A.reduce((s, i) => s + csTot(i), 0), 'مجموع القطع') + stP;
  }
  if (sec == 'acc') {
    const A = S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g), G = agList();
    const cnt = A.reduce((s, i) => s + (typeof i.cnt == 'number' ? i.cnt : 0), 0) + G.reduce((s, d) => s + (d.tot || 0), 0);
    return P(A.length + G.length, 'أصناف ومجموعات') + P(cnt, 'القطع المرقمة') + stP;
  }
  if (sec == 'tp') {
    const C = (S.tp || []).filter(r => r && r.k == 'c');
    return P(C.length, 'فئات البطاقات') + P(C.reduce((s, r) => s + (+r.val || 0), 0), 'مجموع البطاقات') + stP;
  }
  const phCnt = ph().reduce((s, i) => s + (+i.cnt || 0), 0), csCnt = S.items.filter(i => i.sec == 'case').reduce((s, i) => s + csTot(i), 0);
  return P(phCnt, 'قطع الهواتف') + P(csCnt, 'قطع البوشيط') + stP;
}
const itemCard = i => i._jl == 'ag' ? agCard(i.d) : i._jl == 'tp' ? jlTpCard(i.r) : i.sec == 'phones' ? phCard(i) : i.sec == 'case' ? csCard(i) : i.sec == 'acc' ? (gkc(i.kind).g ? agItemCard(i) : acCard(i)) : i.sec == 'glass' ? gl2(i) : '';
function jlTpCard(r) {
  return `<div class="card"><div class="row2"><b>تعبئة <bdi>${esc(r.op)}</bdi> — بطاقة ${r.n} درهم</b><span class="m">${r.val <= 0 ? 'نفد' : r.est ? `<bdi class="ltr">≈${r.val}</bdi>` : 'العدد ' + r.val}</span></div><div class="m">آخر تأكيد ${agoTxt(cfTime(r))}</div><div class="sub"><button class="btn s sm" onclick="go('tp')">فتح شاشة التعبئة</button></div></div>`;
}
const fmtDh = p => { p = dg(p || '').trim(); return !p ? '' : /^\d+(\.\d+)?$/.test(p) ? p + ' درهم' : p; };
/* سطر جرد مضغوط وسريع (تعديل فوري + زر تأكيد ✓ في الطرف الثابت) */
function jlCompactRow(i) {
  const days = Math.max(0, Math.floor((Date.now() - cfTime(i)) / 864e5));
  const dBadge = `<bdi>${days ? agoTxt(cfTime(i)) : 'مؤكد اليوم'}</bdi>`;
  if (i._jl == 'ag') {
    const d = i.d, e = encodeURIComponent(d.id);
    const sub = d.tot !== null ? `المجموع <bdi class="ltr">${d.est ? '≈' : ''}${d.tot}</bdi>` : esc(ALB2[d.st]);
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[d.st]}"></span><div class="cmp-main" onclick="agCnt('${e}')"><b>${esc(d.title)}</b><div class="m">${sub} · ${dBadge}</div></div>`
      + `<div class="jl-acts">${['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" style="margin:0;padding:4px 7px;font-size:.74rem" onclick="agLv('${e}','${s}')">${ALB2[s]}</button>`).join('')}`
      + `<button class="rck" title="تأكيد كما هو" onclick="rCfAg('${e}')">${I('check')}</button></div></div></div>`;
  }
  if (i._jl == 'tp') {
    const r = i.r;
    return `<div class="card cmp jl-row"><div class="row2"><div class="cmp-main" onclick="go('tp')"><b>تعبئة <bdi>${esc(r.op)}</bdi> — ${r.n} درهم</b><div class="m">${r.val <= 0 ? 'نفد' : (r.est ? `<bdi class="ltr">≈${r.val}</bdi>` : 'العدد ' + r.val)} · ${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="go('tp')">تعديل</button><button class="rck" title="تأكيد كما هو" onclick="rCfTp('${r.id}')">${I('check')}</button></div></div></div>`;
  }
  if (i.sec == 'phones') {
    const s = phSt(i), sub = [i.color, i.ram, i.cap, i.price && fmtDh(i.price)].filter(Boolean).map(x => `<bdi>${esc(x)}</bdi>`).join(' · ');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="phEd('${i.id}')"><b><bdi>${esc(i.brand + ' ' + i.name)}</bdi></b><div class="m">${sub ? sub + ' · ' : ''}${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="phC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="phC('${i.id}',1)">+</button>`
      + `<button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div></div>`;
  }
  if (i.sec == 'glass') {
    const g = S.gg.find(x => x.id == i.gid); if (!g) return '';
    const s = gSt(i, g, i.ty), j = Math.max(0, S.tags.glass.indexOf(i.ty));
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="go('sec',{k:'glass',ty:${j}})"><b>زجاج <bdi>${esc(i.ty)}</bdi>: ${glModsH(gMods(g, i.ty))}</b><div class="m">المجموع <bdi class="ltr">${gEst(i, g) ? '≈' : ''}${gTot(i, g)}</bdi>${gPr(i) ? ' · <bdi>' + esc(fmtDh(gPr(i))) + '</bdi>' : ''} · ${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="go('sec',{k:'glass',ty:${j}})">فتح</button><button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div></div>`;
  }
  if (i.sec == 'case') {
    const s = csSt(i), gSum = (csN(i).v || []).map(x => `<bdi>${esc(x.c || 'عام')} ${x.n}</bdi>`).join(' · ') || 'لا ألوان';
    const chips = typeof csChipsHtml == 'function' ? csChipsHtml(i, true) : '';
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="csOpen('${i.id}')"><b>بوشيط <bdi>${esc(csNm(i))}</bdi></b><div class="m">${gSum}${i.price ? ' · <bdi>' + esc(fmtDh(i.price)) + '</bdi>' : ''} · ${dBadge}</div></div>`
      + `<div class="jl-acts">${chips}<button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div></div>`;
  }
  if (i.sec == 'acc') {
    const s = acSt(i), cn = typeof i.cnt == 'number';
    const act = cn ? `<button class="btn s sm" onclick="acC('${i.id}',-1)">−</button><span class="cn">${i.cnt}</span><button class="btn sm" onclick="acC('${i.id}',1)">+</button>`
      : ['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" style="margin:0;padding:4px 7px;font-size:.74rem" onclick="acS('${i.id}','${x}')">${ALB[x]}</button>`).join('');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="acEd('${i.id}')"><b><bdi>${esc(acTitle(i))}</bdi></b><div class="m">${i.price ? '<bdi>' + esc(fmtDh(i.price)) + '</bdi> · ' : ''}${dBadge}</div></div>`
      + `<div class="jl-acts">${act}<button class="rck" title="تأكيد كما هو" onclick="rCf('${i.id}')">${I('check')}</button></div></div></div>`;
  }
  return '';
}
function rCf(id) { const i = find(id); if (i) { vib(25); upd(() => touch(i, 1)); } }
function rCfAg(e) {
  const d = agD(e); if (!d) return;
  vib(25);
  upd(() => {
    let g = S.ag.find(x => x.id == d.id);
    if (!g) { g = { id: d.id, kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw }; S.ag.push(g); }
    g.by = S.me; g.at = g.cf = Date.now();
    d.mem.forEach(m => touch(m, 1));
  });
}
function rCfTp(id) {
  const r = (S.tp || []).find(x => x.id == id); if (!r) return;
  vib(25);
  upd(() => { r.by = S.me; r.at = r.cf = Date.now(); });
}
const jlCurSec = () => V.js || V.jk || 'all';
function jlFiltered() {
  const allMode = V.jm == 'all', sec = jlCurSec(), q = nz(V.jq || '');
  return rnd(allMode).filter(i => (sec == 'all' || jlSecOf(i) == sec) && (!q || nzHit(nz(jlTextOf(i)), V.jq, q)));
}
function jlListHtml() {
  const L = jlFiltered(), limN = V.jlim || 40, a = L.slice(0, limN), rem = L.length - a.length;
  const more = rem > 0 ? `<button type="button" class="btn s" onclick="V.jlim=(V.jlim||40)+40;jlRefreshList()">عرض المزيد (+${Math.min(40, rem)} من ${rem} متبقية)</button>` : '';
  return { a, html: a.map(jlCompactRow).join('') + more };
}
function rCfAll() {
  const L = jlFiltered().slice(0, V.jlim || 40);
  if (!L.length) return;
  vib(40);
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
  const { a, html } = jlListHtml(), box = $('jl_list'), btn = $('jl_cf_all');
  if (btn) { btn.hidden = !a.length; btn.innerHTML = `${I('check')} تأكيد كل القائمة الظاهرة (${a.length})`; }
  if (box) box.innerHTML = html || emptyBox('كل الأصناف في هذا القسم مؤكدة حديثاً ✓');
}
VW.jl = () => {
  const allMode = V.jm == 'all', sec = jlCurSec(), staleCnt = rnd(false).length;
  const { a, html } = jlListHtml();
  return {
    t: 'الجرد والجولة اليومية',
    h: `<div class="jl-sum-grid">${jlSecSummary(sec, staleCnt)}</div>`
      + `<div class="sec-panel">`
      + `<div class="sec-tags">${JL_TABS.map(([k, l]) => `<button class="tag ${sec == k ? 'on' : ''}" onclick="V.js='${k}';delete V.jk;V.jlim=40;render()">${l}</button>`).join('')}</div>`
      + `<div class="sec-toolbar"><div class="seg-group" style="width:100%"><button type="button" class="seg-btn ${!allMode ? 'on' : ''}" onclick="V.jm='old';V.jlim=40;render()">يحتاج تأكيداً (${staleCnt})</button><button type="button" class="seg-btn ${allMode ? 'on' : ''}" onclick="V.jm='all';V.jlim=40;render()">جرد شامل للقسم</button></div></div>`
      + `<input style="margin:8px 0 0" placeholder="ابحث داخل الجرد: موديل أو ماركة..." value="${esc(V.jq || '')}" oninput="V.jq=this.value;V.jlim=40;jlRefreshList()">`
      + `</div>`
      + `<button id="jl_cf_all" class="btn s" ${a.length ? '' : 'hidden'} onclick="rCfAll()">${I('check')} تأكيد كل القائمة الظاهرة (${a.length})</button>`
      + `<div id="jl_list">${html || emptyBox('كل الأصناف في هذا القسم مؤكدة حديثاً ✓', 'اضغط «جرد شامل للقسم» في الأعلى إن أردت مراجعة كل المخزون')}</div>`
  };
};
HOME.after.push(() => {
  const n = rnd(false).length;
  return `<button class="btn s" onclick="go('jl')">${I('check')} <span>الجرد والجولة اليومية</span>${n ? `<span class="rp-cnt-b">${n} غير مؤكد</span>` : ''}</button>`;
});
/* ============================ كاشف الأثمنة الفوري الموحّد (بأيقونات SVG الملوّنة) ============================ */
window.priceLookupHtml = function (q) {
  const n = nz(q); if (n.length < 2) return '';
  const phs = ph().filter(i => nzHit(nzOf(i, nzText), q, n)).slice(0, 6);
  const gls = S.gg.filter(g => glHit(g, q, n)).slice(0, 4);
  const css = S.items.filter(i => i.sec == 'case' && nzHit(nzOf(i, nzText), q, n)).slice(0, 4);
  const gds = (S.guide || []).filter(g => nzHit(nz(g.m + ' ' + g.f + ' ' + (g.n || '')), q, n)).slice(0, 6);
  const acs = S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g && nzHit(nzOf(i, nzText), q, n)).slice(0, 5);
  const ags = agList().filter(d => nzHit(nz(agTxt(d)), q, n)).slice(0, 4);
  const cats = (phs.length ? 1 : 0) + (gls.length ? 1 : 0) + (css.length ? 1 : 0) + (gds.length ? 1 : 0) + (acs.length || ags.length ? 1 : 0);
  if (!cats) return '';
  let rows = '';
  phs.forEach(i => {
    const s = phSt(i), sub = [i.color, i.ram, i.cap, i.cond && i.cond != 'جديد' && i.cond].filter(Boolean).join('·');
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="phEd('${i.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:.88rem">${I('cphone')} <b><bdi>${esc(i.brand + ' ' + i.name)}</bdi></b> ${sub ? `<small class="m">(${esc(sub)})</small>` : ''} <small class="m">· متاح ${av(i)}</small></span><b class="cmp-pr">${esc(i.price ? fmtDh(i.price) : 'بدون سعر')}</b></div>`;
  });
  gls.forEach(g => {
    S.tags.glass.forEach((ty, j) => {
      if (!gShow(g, ty)) return;
      const it = gitem(g.id, ty), tot = it ? gTot(it, g) : 0, s = it ? gSt(it, g, ty) : 'r';
      if (tot > 0 || (it && it.price)) {
        rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="glMin('${g.id}',${j})"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:.88rem">${I('cglass')} زجاج <b>${esc(ty)}</b> <small class="m">(<bdi>${esc(gMods(g, ty).slice(0, 3).join('/'))}</bdi>) · <bdi class="ltr">${it && gEst(it, g) ? '≈' : ''}${tot}</bdi></small></span><b class="cmp-pr">${esc(gPr(it, ty) ? fmtDh(gPr(it, ty)) : 'حدّد السعر')}</b></div>`;
      }
    });
  });
  css.forEach(c => {
    const s = csSt(c), gSum = typeof csGSummaryTxt == 'function' ? csGSummaryTxt(c) : 'المتوفر ' + csTot(c);
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="csLimEd('${c.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:.88rem">${I('ccase')} بوشيط <b><bdi>${esc(csNm(c))}</bdi></b> <small class="m">(${esc(gSum)})</small></span><b class="cmp-pr">${esc(c.price ? fmtDh(c.price) : 'حدّد السعر')}</b></div>`;
  });
  ags.forEach(d => {
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="agOpen('${encodeURIComponent(d.id)}')"><span class="dotl" style="background:${DT[d.st]}"></span><span class="rt" style="font-size:.88rem">${I('cacc')} <b>${esc(d.title)}</b> <small class="m">(${d.tot !== null ? (d.est ? '≈' : '') + d.tot : ALB2[d.st]})</small></span><b class="cmp-pr">${esc(d.tier ? fmtDh(d.tier) : '—')}</b></div>`;
  });
  acs.forEach(a => {
    const s = acSt(a);
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="acEd('${a.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:.88rem">${I('cacc')} <b>${esc(acName(a))}</b></span><b class="cmp-pr">${esc(a.price ? fmtDh(a.price) : '—')}</b></div>`;
  });
  gds.forEach(g => {
    const prTxt = fmtDh(g.p) + (g.p2 ? ' · أصلي: ' + fmtDh(g.p2) : '');
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="gdEd('${g.id}')"><span class="dotl" style="background:var(--p)"></span><span class="rt" style="font-size:.88rem">${I('crepair')} إصلاح <b><bdi>${esc(g.m)}</bdi></b> — ${esc(g.f)}${g.n ? ` <small class="m">(${esc(g.n)})</small>` : ''}</span><b class="cmp-pr">${esc(prTxt)}</b></div>`;
  });
  if (!rows) return '';
  return `<div class="card" style="border-color:var(--p);background:color-mix(in srgb,var(--ab) 35%,var(--c));padding:10px 12px"><div class="row2" style="margin-bottom:4px"><b style="color:var(--pt);font-size:.9rem">${I('tag')} ملخص الأثمنة والتوفر</b><span class="m" style="font-size:.76rem">اضغط على السطر للتعديل</span></div>${rows}</div>`;
};
SRCH.unshift({
  k: 'prc',
  l: 'الأثمنة',
  run: (n, q) => { const h = window.priceLookupHtml(q ?? n); return h ? [h] : []; }
});