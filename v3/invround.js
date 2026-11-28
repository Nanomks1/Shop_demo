/* ============================================================
   invround.js — الجرد والجولة اليومية + كاشف الأثمنة الفوري
   يُحمَّل بعد invreport.js.
   ============================================================ */
/* ============================ الجرد والجولة اليومية ============================ */
const jlIsToday = t => !!t && new Date(t).toDateString() == new Date().toDateString();
function rndAll() {
  const out = [];
  S.items.forEach(i => {
    if (i.sec == 'phones' && i.sold) return;   // المستعمل المباع لا يدخل الجرد
    if (i.sec == 'acc' && gkc(i.kind).g) return;
    if (i.sec == 'glass' && !S.gg.some(g => g.id == i.gid && gShow(g, i.ty))) return;
    out.push(i);
  });
  agList().forEach(d => {
    const t = d.cf || d.at || 0;
    out.push({ _jl: 'ag', sec: 'acc', id: d.id, d, at: t, cf: t });
  });
  if (typeof tpJournOn == 'function' && tpJournOn()) {
    (S.tp || []).forEach(r => {
      if (!r || r.k != 'c' || r.val == null) return;
      if (typeof tpIsCardActive == 'function' && !tpIsCardActive(r.op, r.n)) return;
      const t = cfTime(r);
      out.push({ _jl: 'tp', sec: 'tp', id: r.id, r, at: t, cf: t });
    });
  }
  return out.sort((a, b) => cfTime(a) - cfTime(b));
}
function jlIsStopped(i) {
  if (i._jl) return false;
  if (i.sec == 'phones') return !!(i.stp && (+i.cnt || 0) <= (+i.stpN || 0)) || !!phGroup(i).stp;
  if (i.sec == 'glass') { const g = S.gg.find(x => x.id == i.gid); return !!(g && gStop(i, g)); }
  if (i.sec == 'case') return !!csMP(i);
  return false;
}
function jlIsZero(i) {
  if (i._jl == 'ag') return i.d.st == 'r' || (i.d.tot !== null && i.d.tot <= 0);
  if (i._jl == 'tp') return (+i.r.val || 0) <= 0;
  if (i.sec == 'phones') return (+i.cnt || 0) <= 0;
  if (i.sec == 'glass') { const g = S.gg.find(x => x.id == i.gid); return !g || gTot(i, g) <= 0; }
  if (i.sec == 'case') return csTot(i) <= 0;
  if (i.sec == 'acc') return typeof i.cnt == 'number' ? i.cnt <= 0 : i.st == 'r';
  return false;
}
/* rnd() بدون معاملات تعيد الأصناف غير المؤكدة حسب حدود وإعدادات المدير */
function rnd(allMode) {
  const L = rndAll();
  if (allMode) return L;
  const ms = lim('stale') * 864e5, now = Date.now();
  return L.filter(i => {
    if (!jlSecOn(jlSecOf(i))) return false;
    if (jlx('ns') && jlIsStopped(i)) return false;
    if (jlx('nz') && jlIsZero(i)) return false;
    const t = cfTime(i);
    return !t || now - t > ms;
  });
}
const jlSecOf = i => i._jl == 'ag' ? 'acc' : i._jl == 'tp' ? 'tp' : i.sec;
function jlTextOf(i) {
  if (i._jl == 'ag') return agTxt(i.d) + ' ' + i.d.title;
  if (i._jl == 'tp') return 'تعبئة ' + i.r.op + ' ' + i.r.n;
  if (i.sec == 'glass') {
    const g = S.gg.find(x => x.id == i.gid);
    return (i.ty || '') + ' ' + (g ? g.models.map(m => ((g.br || {})[m] || '') + ' ' + m).join(' ') : '');
  }
  return nzText(i);
}
function jlNameOf(i) {
  if (i._jl == 'ag') return i.d.title || '';
  if (i._jl == 'tp') return i.r.op + ' ' + String(i.r.n).padStart(4, '0');
  if (i.sec == 'phones') return [i.brand, i.name, i.cap, i.color].filter(Boolean).join(' ');
  if (i.sec == 'glass') { const g = S.gg.find(x => x.id == i.gid); return (g ? gMods(g, i.ty).join(' ') : '') + ' ' + (i.ty || ''); }
  if (i.sec == 'case') return csNm(i);
  if (i.sec == 'acc') return acName(i);
  return '';
}
/* إحصائيات سريعة للرف/القسم المختار */
function jlSecSummary(sec) {
  const P = (n, l, cls = '') => `<div class="jl-sum-pill ${cls}"><b><bdi class="ltr">${n}</bdi></b><small>${l}</small></div>`;
  const staleSec = rnd(false).filter(i => sec == 'all' || jlSecOf(i) == sec).length;
  const stP = P(staleSec, 'غير مؤكد', staleSec ? 'wn' : '');
  if (sec == 'phones') {
    const A = ph();
    return P(A.length, 'أصناف الهواتف') + P(A.reduce((s, i) => s + (+i.cnt || 0), 0), 'مجموع القطع') + stP;
  }
  if (sec == 'glass') {
    const A = rndAll().filter(i => i.sec == 'glass');
    return P(A.length, 'قوائم الزجاج') + P(S.gg.length, 'المجموعات') + stP;
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
    const C = (S.tp || []).filter(r => r && r.k == 'c' && r.val != null && (typeof tpIsCardActive != 'function' || tpIsCardActive(r.op, r.n)));
    return P(C.length, 'فئات البطاقات') + P(C.reduce((s, r) => s + (+r.val || 0), 0), 'مجموع البطاقات') + stP;
  }
  const allL = rndAll(), doneToday = allL.filter(i => jlIsToday(cfTime(i))).length;
  return P(allL.length, 'إجمالي الأصناف') + P(doneToday, 'مؤكدة اليوم') + stP;
}
const itemCard = i => i._jl == 'ag' ? agCard(i.d) : i._jl == 'tp' ? jlTpCard(i.r) : i.sec == 'phones' ? phCard(i) : i.sec == 'case' ? csCard(i) : i.sec == 'acc' ? (gkc(i.kind).g ? agItemCard(i) : acCard(i)) : i.sec == 'glass' ? gl2(i) : '';
function jlTpCard(r) {
  return `<div class="card"><div class="row2"><b>تعبئة <bdi>${esc(r.op)}</bdi> — بطاقة ${r.n} درهم</b><span class="m">${r.val <= 0 ? 'نفد' : 'العدد ' + r.val}</span></div><div class="m">آخر تأكيد ${agoTxt(cfTime(r))}</div><div class="sub"><button class="btn s sm" onclick="go('tp')">فتح شاشة التعبئة</button></div></div>`;
}
const fmtDh = p => { p = dg(p || '').trim(); return !p ? '' : /^\d+(\.\d+)?$/.test(p) ? p + ' درهم' : p; };
/* نافذة تعديل سريعة للأنتي كاس داخل الجرد دون الخروج منه */
let JLG = null;
function jlGlHtml(gid, j) {
  const g = S.gg.find(x => x.id == gid); if (!g) return '';
  const ty = S.tags.glass[j] || gFirstTy(g), i0 = gitem(gid, ty), i = i0 || { stock: {}, lv: {}, ty };
  const s = i0 ? gSt(i, g, ty) : (glx('ng') ? 'n' : 'r'), min = gLim(i, ty), T = GT();
  const L = g.models.map((m, k) => [m, k]).filter(x => gHas(g, x[0], ty)), single = L.length === 1;
  const rows = L.map(([m, k]) => {
    const lv = (i.lv || {})[m], ex = lv === undefined && (i.stock || {})[m] !== undefined, br = (g.br || {})[m];
    const dots = [['a', `<bdi class="ltr">${T.a}+</bdi>`], ['b', `<bdi class="ltr">${T.b}+</bdi>`], ['c', `<bdi class="ltr">${T.c}+</bdi>`], ['y', 'قليل'], ['r', 'نفد']].map(([l, t]) => `<button class="lvb lv-${l} ${lv == l ? 'on' : ''}" onclick="glLv('${g.id}',${j},${k},'${l}')">${t}</button>`).join('');
    const hd2 = ex
      ? `<div class="row2 gl-cnt"><button class="btn s sm" onclick="glC('${g.id}',${j},${k},-1)">−</button><span class="cn">${i.stock[m]}</span><button class="btn sm" onclick="glC('${g.id}',${j},${k},1)">+</button></div>`
      : `<button class="gm-cnt-btn" onclick="finish(null);setTimeout(()=>glEx('${g.id}',${j},${k}),380)">${lv !== undefined && lv != 'r' && !single ? `<bdi class="ltr">≈${lvN(lv)}</bdi> · ` : ''}أدخل العدد</button>`;
    return single && !ex
      ? `<div class="lvs gl-single">${dots}<button class="lvb gl-hash" onclick="finish(null);setTimeout(()=>glEx('${g.id}',${j},${k}),380)">#</button></div>`
      : `<div class="gm"><div class="gm-head"><span><b><bdi>${esc(m)}</bdi></b>${br ? ` <span class="m">· <bdi>${esc(br)}</bdi></span>` : ''}</span>${hd2}</div><div class="lvs">${dots}</div></div>`;
  }).join('');
  return `<div class="bar"></div><div class="row2" data-jlg="${g.id}"><h3>${glModsH(L.map(x => x[0]))}</h3><span class="dotl" style="background:${DT[s]}"></span></div>`
    + `<p class="m">${esc(ty)} · المجموع <bdi class="ltr">${gEst(i, g) ? '≈' : ''}${gTot(i, g)}</bdi> · الحد: <bdi class="ltr">${min - 1}</bdi></p>`
    + rows
    + `<div class="cs-acts"><button class="btn s" onclick="finish(null);setTimeout(()=>glMin('${g.id}',${j}),380)">الحد والسعر</button><button class="btn s" onclick="finish(null);setTimeout(()=>glGoS('${g.id}',${j},0),380)">فتح في القسم</button></div>`
    + `<div class="acts"><button class="btn" onclick="finish(null)">تم</button></div>`;
}
function jlGlOpen(gid, j) {
  JLG = { gid, j };
  $('sh').innerHTML = jlGlHtml(gid, j);
  sheetOpen(() => { JLG = null; });
}
HK.hide.push(() => { JLG = null; });
HK.render.push(() => {
  if (SH && JLG && $('sh') && $('sh').querySelector('[data-jlg]')) {
    const h = jlGlHtml(JLG.gid, JLG.j);
    if (h) $('sh').innerHTML = h;
  }
});
/* سطر جرد مضغوط وسريع (تعديل فوري + زر تأكيد ✓ في الطرف الثابت) */
function jlCompactRow(i) {
  const t = cfTime(i), today = jlIsToday(t);
  const dBadge = today ? '<span class="jl-ok">مؤكد اليوم ✓</span>' : (t ? `<bdi>${agoTxt(t)}</bdi>` : '<span class="rp-warn-inline">غير مؤكد</span>');
  const ckBtn = fn => `<button class="rck ${today ? 'done' : ''}" title="${today ? 'مؤكد اليوم' : 'تأكيد كما هو'}" onclick="${fn}">${I('check')}</button>`;
  if (i._jl == 'ag') {
    const d = i.d, e = encodeURIComponent(d.id);
    const sub = d.tot !== null ? `المجموع <bdi class="ltr">${d.est ? '≈' : ''}${d.tot}</bdi>` : esc(ALB2[d.st]);
    const ctrl = d.mode == 'cnt'
      ? `<button class="btn s sm" onclick="agC('${e}',-1)">−</button><button type="button" class="cn jl-cn" onclick="agCnt('${e}')">${d.est ? '≈' : ''}${d.tot}</button><button class="btn sm" onclick="agC('${e}',1)">+</button>`
      : ['g', 'y', 'r'].map(s => `<button class="tag ${d.st == s ? 'on' : ''}" style="margin:0;padding:4px 7px;font-size:var(--t-xs)" onclick="agLv('${e}','${s}')">${ALB2[s]}</button>`).join('');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[d.st]}"></span><div class="cmp-main" onclick="agOpen('${e}')"><b>${esc(d.title)}</b><div class="m">${sub} · ${dBadge}</div></div>`
      + `<div class="jl-acts">${ctrl}${ckBtn(`rCfAg('${e}')`)}</div></div></div>`;
  }
  if (i._jl == 'tp') {
    const r = i.r;
    return `<div class="card cmp jl-row"><div class="row2"><div class="cmp-main" onclick="tpJlEdit('${r.id}')"><b>تعبئة <bdi>${esc(r.op)}</bdi> — ${r.n} درهم</b><div class="m">${r.val <= 0 ? 'نفد' : 'العدد ' + r.val} · ${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="tpJlEdit('${r.id}')">تعديل</button>${ckBtn(`rCfTp('${r.id}')`)}</div></div></div>`;
  }
  if (i.sec == 'phones') {
    const s = phSt(i), g = phGroup(i), isU = i.cond == 'مستعمل';
    const sub = [i.color, i.ram, i.cap, i.price && fmtDh(i.price), rsQ(i) ? 'محجوز ' + rsQ(i) : '', isU && i.imei ? 'IMEI ' + i.imei : ''].filter(Boolean).map(x => `<bdi>${esc(x)}</bdi>`).join(' · ');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="phOpen('${i.id}')"><b><bdi>${esc(i.brand + ' ' + i.name)}</bdi>${isU ? ' <span class="phk c">مستعمل</span>' : ''}${g.stp ? ' <span class="phk c">متوقف</span>' : ''}</b><div class="m">${sub ? sub + ' · ' : ''}${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="phC('${i.id}',-1)">−</button><button type="button" class="cn jl-cn" onclick="phCnt('${i.id}')">${i.cnt}</button><button class="btn sm" onclick="phC('${i.id}',1)">+</button>`
      + `${ckBtn(`rCf('${i.id}')`)}</div></div></div>`;
  }
  if (i.sec == 'glass') {
    const g = S.gg.find(x => x.id == i.gid); if (!g) return '';
    const s = gSt(i, g, i.ty), j = Math.max(0, S.tags.glass.indexOf(i.ty));
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="jlGlOpen('${g.id}',${j})"><b>زجاج <bdi>${esc(i.ty)}</bdi>: ${glModsH(gMods(g, i.ty))}${gStop(i, g) ? ' <span class="phk c">متوقف</span>' : ''}</b><div class="m">المجموع <bdi class="ltr">${gEst(i, g) ? '≈' : ''}${gTot(i, g)}</bdi>${gPr(i) ? ' · <bdi>' + esc(fmtDh(gPr(i))) + '</bdi>' : ''} · ${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="jlGlOpen('${g.id}',${j})">تعديل</button>${ckBtn(`rCf('${i.id}')`)}</div></div></div>`;
  }
  if (i.sec == 'case') {
    const s = csSt(i), V0 = csN(i).v || [], gSum = V0.map(x => `<bdi>${esc(x.c || 'عام')} ${x.n}</bdi>`).join(' · ') || 'لا ألوان';
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="csOpen('${i.id}')"><b>بوشيط <bdi>${esc(csNm(i))}</bdi>${csMP(i) ? ' <span class="phk c">متوقف</span>' : ''}</b><div class="m">${gSum}${i.price ? ' · <bdi>' + esc(fmtDh(i.price)) + '</bdi>' : ''} · ${dBadge}</div></div>`
      + `<div class="jl-acts"><button class="btn s sm" onclick="csOpen('${i.id}')">الألوان (${V0.length})</button>${ckBtn(`rCf('${i.id}')`)}</div></div></div>`;
  }
  if (i.sec == 'acc') {
    const s = acSt(i), cn = typeof i.cnt == 'number';
    const act = cn ? `<button class="btn s sm" onclick="acC('${i.id}',-1)">−</button><button type="button" class="cn jl-cn" onclick="acCnt('${i.id}')">${i.cnt}</button><button class="btn sm" onclick="acC('${i.id}',1)">+</button>`
      : ['g', 'y', 'r'].map(x => `<button class="tag ${i.st == x ? 'on' : ''}" style="margin:0;padding:4px 7px;font-size:var(--t-xs)" onclick="acS('${i.id}','${x}')">${ALB[x]}</button>`).join('');
    return `<div class="card cmp jl-row"><div class="row2"><span class="dotl" style="background:${DT[s]}"></span><div class="cmp-main" onclick="acOpen('${i.id}')"><b><bdi>${esc(acTitle(i))}</bdi></b><div class="m">${i.price ? '<bdi>' + esc(fmtDh(i.price)) + '</bdi> · ' : ''}${dBadge}</div></div>`
      + `<div class="jl-acts">${act}${ckBtn(`rCf('${i.id}')`)}</div></div></div>`;
  }
  return '';
}
function rCf(id) {
  const i = find(id); if (!i) return;
  vib(25);
  commit('تم تأكيد الجرد', () => cfTouch(i));
}
function rCfAg(e) {
  const d = agD(e); if (!d) return;
  vib(25);
  commit('تم تأكيد المجموعة', () => {
    const g = S.ag.find(x => x.id == d.id);
    if (g) cfTouch(g);
    d.mem.forEach(m => cfTouch(m));
    if (!g && !d.mem.length) S.ag.push({ id: d.id, kind: d.kind, conn: d.conn, tier: d.tier, pw: d.pw, by: S.me, cf: Date.now() });
  });
}
function rCfTp(id) {
  const r = (S.tp || []).find(x => x.id == id); if (!r) return;
  vib(25);
  commit('تم تأكيد الفئة', () => cfTouch(r));
}
const jlCurSec = () => {
  const s = V.js || V.jk || 'all';
  return s == 'tp' && (typeof tpJournOn == 'function' && !tpJournOn()) ? 'all' : s;
};
function jlFiltered() {
  const allMode = V.jm == 'all', sec = jlCurSec(), q = nz(V.jq || '');
  let L = rnd(allMode).filter(i => (sec == 'all' || jlSecOf(i) == sec) && (!q || nzHit(nz(jlTextOf(i)), V.jq, q)));
  if (allMode && V.jrem) L = L.filter(i => !jlIsToday(cfTime(i)));
  if (allMode && (V.jso || jlx('so')) == 'n') {
    L = [...L].sort((a, b) => jlNameOf(a).localeCompare(jlNameOf(b), undefined, { numeric: true }));
  }
  return L;
}
function jlListHtml() {
  const L = jlFiltered(), limN = V.jlim || 40, a = L.slice(0, limN), rem = L.length - a.length;
  const more = rem > 0 ? `<button type="button" class="btn s" onclick="V.jlim=(V.jlim||40)+40;jlRefreshList()">عرض المزيد (+${Math.min(40, rem)} من ${rem} متبقية)</button>` : '';
  return { a, total: L.length, html: a.map(jlCompactRow).join('') + more };
}
function rCfAll() {
  const mod = jlx('all');
  if (mod == 'o') return;
  if (mod == 'a' && !isAdmin()) return toast('تأكيد الكل للمدير فقط');
  const L = jlFiltered().slice(0, V.jlim || 40);
  if (!L.length) return;
  sure('تأكيد ' + L.length + ' صنفاً ظاهراً الآن كما هي؟', 'تأكيد الكل', false).then(y => {
    if (!y) return;
    vib(40);
    commit('تم تأكيد ' + L.length + ' صنف في الجرد', () => {
      L.forEach(i => {
        if (i._jl == 'ag') {
          const g = S.ag.find(x => x.id == i.id);
          if (g) cfTouch(g);
          i.d.mem.forEach(m => cfTouch(m));
          if (!g && !i.d.mem.length) S.ag.push({ id: i.d.id, kind: i.d.kind, conn: i.d.conn, tier: i.d.tier, pw: i.d.pw, by: S.me, cf: Date.now() });
        } else if (i._jl == 'tp') {
          cfTouch(i.r);
        } else {
          cfTouch(i);
        }
      });
    });
  });
}
function jlEmptyHtml() {
  if (String(V.jq || '').trim()) return emptyBox('لا توجد نتائج مطابقة في الجرد', 'جرّب كلمة أخرى أو امسح البحث');
  if (V.jm == 'all') {
    return V.jrem
      ? emptyBox('تم جرد كل أصناف هذا القسم اليوم ✓', 'اضغط «المتبقي اليوم» لإظهار كل الأصناف')
      : emptyBox('لا توجد أصناف مسجلة في هذا القسم بعد');
  }
  return emptyBox('كل الأصناف في هذا القسم مؤكدة حديثاً ✓', 'اضغط «جرد شامل للقسم» في الأعلى إن أردت مراجعة كل المخزون');
}
const JL_TABS = [['all', 'الكل'], ['phones', 'الهواتف'], ['glass', 'الأنتي كاس'], ['case', 'البوشيط'], ['acc', 'الإكسسوارات'], ['tp', 'التعبئة']];
function jlRefreshList() {
  const { a, html } = jlListHtml(), box = $('jl_list'), btn = $('jl_cf_all'), clr = $('jl_q_clr');
  const mod = jlx('all'), showAll = a.length && mod != 'o' && (mod != 'a' || isAdmin());
  if (clr) clr.hidden = !String(V.jq || '').trim();
  if (btn) { btn.hidden = !showAll; btn.innerHTML = `${I('check')} تأكيد كل القائمة الظاهرة (${a.length})`; }
  if (box) box.innerHTML = html || jlEmptyHtml();
}
function jlClearQ() {
  const i = $('jl_q'); if (i) { i.value = ''; i.focus(); }
  V.jq = ''; V.jlim = 40; jlRefreshList();
}
VW.jl = () => {
  const allMode = V.jm == 'all', sec = jlCurSec(), tpOn = typeof tpJournOn == 'function' && tpJournOn();
  const tabs = JL_TABS.filter(([k]) => k != 'tp' || tpOn);
  const staleSecCnt = rnd(false).filter(i => sec == 'all' || jlSecOf(i) == sec).length;
  const secAll = allMode ? rndAll().filter(i => sec == 'all' || jlSecOf(i) == sec) : [];
  const doneSec = allMode ? secAll.filter(i => jlIsToday(cfTime(i))).length : 0;
  const remSec = secAll.length - doneSec;
  const { a, html } = jlListHtml();
  const mod = jlx('all'), showAll = a.length && mod != 'o' && (mod != 'a' || isAdmin());
  const soNow = V.jso || jlx('so');
  return {
    t: 'الجرد والجولة اليومية',
    h: `<div class="jl-sum-grid">${jlSecSummary(sec)}</div>`
      + `<div class="sec-panel">`
      + `<div class="sec-tags">${tabs.map(([k, l]) => `<button class="tag ${sec == k ? 'on' : ''}" onclick="V.js='${k}';delete V.jk;V.jlim=40;render()">${l}</button>`).join('')}</div>`
      + `<div class="sec-toolbar"><div class="seg-group" style="width:100%"><button type="button" class="seg-btn ${!allMode ? 'on' : ''}" onclick="V.jm='old';V.jlim=40;render()">يحتاج تأكيداً (${staleSecCnt})</button><button type="button" class="seg-btn ${allMode ? 'on' : ''}" onclick="V.jm='all';V.jlim=40;render()">جرد شامل للقسم</button></div></div>`
      + (allMode ? `<div class="jl-bar"><span class="m">تم جرد اليوم: <b>${doneSec}</b> من <b>${secAll.length}</b></span><div class="row2" style="gap:5px"><button type="button" class="tag ${V.jrem ? 'on' : ''}" onclick="V.jrem=!V.jrem;V.jlim=40;render()">المتبقي (${remSec})</button><button type="button" class="tag" onclick="V.jso=(V.jso||jlx('so'))=='n'?'o':'n';render()">${soNow == 'n' ? 'ترتيب: الرف' : 'ترتيب: الأقدم'}</button></div></div>` : '')
      + `<div class="q-wrap" style="margin-top:8px"><input id="jl_q" placeholder="ابحث داخل الجرد: موديل أو ماركة..." value="${esc(V.jq || '')}" oninput="V.jq=this.value;V.jlim=40;jlRefreshList()"><button id="jl_q_clr" type="button" class="q-clr" ${V.jq ? '' : 'hidden'} onclick="jlClearQ()" aria-label="مسح البحث">✕</button></div>`
      + `</div>`
      + `<button id="jl_cf_all" class="btn s" ${showAll ? '' : 'hidden'} onclick="rCfAll()">${I('check')} تأكيد كل القائمة الظاهرة (${a.length})</button>`
      + `<div id="jl_list">${html || jlEmptyHtml()}</div>`
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
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="phEd('${i.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:var(--t-sm)">${I('cphone')} <b><bdi>${esc(i.brand + ' ' + i.name)}</bdi></b> ${sub ? `<small class="m">(${esc(sub)})</small>` : ''} <small class="m">· متاح ${av(i)}</small></span><b class="cmp-pr">${esc(i.price ? fmtDh(i.price) : 'بدون سعر')}</b></div>`;
  });
  gls.forEach(g => {
    S.tags.glass.forEach((ty, j) => {
      if (!gShow(g, ty)) return;
      const it = gitem(g.id, ty), tot = it ? gTot(it, g) : 0, s = it ? gSt(it, g, ty) : 'r';
      if (tot > 0 || (it && it.price)) {
        rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="glMin('${g.id}',${j})"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:var(--t-sm)">${I('cglass')} زجاج <b>${esc(ty)}</b> <small class="m">(<bdi>${esc(gMods(g, ty).slice(0, 3).join('/'))}</bdi>) · <bdi class="ltr">${it && gEst(it, g) ? '≈' : ''}${tot}</bdi></small></span><b class="cmp-pr">${esc(gPr(it, ty) ? fmtDh(gPr(it, ty)) : 'حدّد السعر')}</b></div>`;
      }
    });
  });
  css.forEach(c => {
    const s = csSt(c), gSum = typeof csGSummaryTxt == 'function' ? csGSummaryTxt(c) : 'المتوفر ' + csTot(c);
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="csLimEd('${c.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:var(--t-sm)">${I('ccase')} بوشيط <b><bdi>${esc(csNm(c))}</bdi></b> <small class="m">(${esc(gSum)})</small></span><b class="cmp-pr">${esc(c.price ? fmtDh(c.price) : 'حدّد السعر')}</b></div>`;
  });
  ags.forEach(d => {
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="agOpen('${encodeURIComponent(d.id)}')"><span class="dotl" style="background:${DT[d.st]}"></span><span class="rt" style="font-size:var(--t-sm)">${I('cacc')} <b>${esc(d.title)}</b> <small class="m">(${d.tot !== null ? (d.est ? '≈' : '') + d.tot : ALB2[d.st]})</small></span><b class="cmp-pr">${esc(d.tier ? fmtDh(d.tier) : '—')}</b></div>`;
  });
  acs.forEach(a => {
    const s = acSt(a);
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="acEd('${a.id}')"><span class="dotl" style="background:${DT[s]}"></span><span class="rt" style="font-size:var(--t-sm)">${I('cacc')} <b>${esc(acName(a))}</b></span><b class="cmp-pr">${esc(a.price ? fmtDh(a.price) : '—')}</b></div>`;
  });
  gds.forEach(g => {
    const prTxt = fmtDh(g.p) + (g.p2 ? ' · أصلي: ' + fmtDh(g.p2) : '');
    rows += `<div class="rrow" style="padding:7px 0;cursor:pointer" onclick="gdEd('${g.id}')"><span class="dotl" style="background:var(--p)"></span><span class="rt" style="font-size:var(--t-sm)">${I('crepair')} إصلاح <b><bdi>${esc(g.m)}</bdi></b> — ${esc(g.f)}${g.n ? ` <small class="m">(${esc(g.n)})</small>` : ''}</span><b class="cmp-pr">${esc(prTxt)}</b></div>`;
  });
  if (!rows) return '';
  return `<div class="card" style="border-color:var(--p);background:color-mix(in srgb,var(--ab) 35%,var(--c));padding:10px 12px"><div class="row2" style="margin-bottom:4px"><b style="color:var(--pt);font-size:var(--t-md)">${I('tag')} ملخص الأثمنة والتوفر</b><span class="m" style="font-size:var(--t-xs)">اضغط على السطر للتعديل</span></div>${rows}</div>`;
};
SRCH.unshift({
  k: 'prc',
  l: 'الأثمنة',
  run: (n, q) => { const h = window.priceLookupHtml(q ?? n); return h ? [h] : []; }
});