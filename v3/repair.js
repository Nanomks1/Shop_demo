/* ============================================================
   repair.js — الصيانة، التذاكر (#A101)، قطع الغيار، الضمان،
   دليل أسعار الإصلاح، وطلبات الزبائن.
   ============================================================ */
const RK = ['شاشة مكسورة', 'مطفأ لا يشتغل', 'ترك شريحة SIM', 'ترك كارت ميموري', 'معه بوشيط', 'بدون غطاء', 'البصمة لا تعمل', 'بدون SIM'];
const TB = { in: 'في المحل', rd: 'جاهز', nf: 'لم تُصلَّح', dn: 'الأرشيف' };
const tabOf = r => r.st == 'rd' && (r.res == 'fail' || r.res == 'ref') ? 'nf' : r.st;
const FL = [['all', 'الكل'], ['today', 'اليوم'], ['yest', 'البارحة'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['date', 'تاريخ']];
const RES = { ok: 'تم الإصلاح', fail: 'تعذّر الإصلاح', ref: 'رفض الإصلاح' };
const LOC = { m: 'عند المعلم', s: 'الرف' };
const DVO = ['— اختر —', 'جُرِّب مع الزبون وهو يعمل', 'سُلِّم بدون تجربة مع الزبون'];
const WAR_OPTS = [[0, 'بدون ضمان'], [3, '3 أيام'], [7, '7 أيام'], [15, '15 يوم'], [30, '30 يوم']];
const WAR_SEL = ['بدون ضمان (0 يوم)', '3 أيام', '7 أيام', '15 يوم', '30 يوم'];
let ZP = [], ZK = [], ZI = '', ZD = 0, ZR = {}, ZW = 0, ZL = '', GPM = [];
const rf = id => S.rp.find(r => r.id == id);
const rnum = t => waNum(t);
const rph8 = t => rnum(t).slice(-8);
const sn1 = x => /^\s*\d+(\.\d+)?\s*$/.test(dg(x || ''));
const d0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dh = p => sn1(p) ? dg(String(p).trim()) + ' درهم' : (p || '');
const tOf = r => r.st == 'dn' ? r.t2 : r.st == 'rd' ? (r.t1 || r.t0) : r.t0;
const isLateRp = r => r.st == 'rd' && Math.floor((Date.now() - (r.t1 || r.t0)) / 864e5) > 15;
const isSlowRp = r => r.st == 'in' && Math.floor((Date.now() - (r.t0 || Date.now())) / 864e5) >= 3;
const inR = t => {
  const f = V.d || 'all', n = d0(Date.now()); if (f == 'all') return 1; if (!t) return 0;
  if (f == 'today') return d0(t) == n; if (f == 'yest') return d0(t) == n - 864e5;
  if (f == 'week') return d0(t) >= n - ((new Date().getDay() + 6) % 7) * 864e5;
  if (f == 'month') { const a = new Date(t), b = new Date(); return a.getMonth() == b.getMonth() && a.getFullYear() == b.getFullYear(); }
  return !V.dt || new Date(t).toLocaleDateString('en-CA') == V.dt;
};
const PI = s => { const p = i => [20 + 40 * (i % 3), 20 + 40 * Math.floor(i / 3)]; return (s.length > 1 ? `<polyline fill="none" stroke="#3b82f6" stroke-width="4" points="${s.map(i => p(i).join(',')).join(' ')}"/>` : '') + [...Array(9).keys()].map(i => `<circle cx="${p(i)[0]}" cy="${p(i)[1]}" r="${s.includes(i) ? 7 : 5}" fill="${s[0] == i ? '#22c55e' : s.includes(i) ? '#3b82f6' : '#94a3b8'}"/>`).join(''); };
const rImg = r => r.img && r.img.startsWith('data:') ? r.img : (IMG[r.id] || '');
const rpText = r => [r.tk ? r.tk + ' #' + r.tk : '', r.st == 'in' && LOC[r.loc] ? LOC[r.loc] : '', r.part || '', r.ret ? 'راجع ضمان' : '', r.name, r.tel, r.dev, r.fault, r.note || '', r.dnote || '', (r.chk || []).join(' '), fxTxt(r), r.imei || ''].join(' ');
Object.assign(DL0, { rpKeep: 30 });
LM.push(['rpKeep', 'الصيانة: مسح الصورة والرمز بعد التسليم بـ (أيام)']);
FLD.rp = [['cap', 'السعر المتفق'], ['dep', 'العربون'], ['war', 'ضمان الإصلاح'], ['loc', 'مكان الهاتف (عند المعلم / الرف)'], ['need', 'خاصو قطعة غيار'], ['lock', 'PIN'], ['pat', 'نمط القفل'], ['img', 'الصورة'], ['chk', 'حالة الجهاز'], ['imei', 'IMEI'], ['note', 'الملاحظة']];
FLDN.rp = 'الصيانة';
/* ---------- رقم التذكرة القصير (#A101 .. #Z999) ---------- */
const tkCode = n => { n = Math.max(1, Math.floor(+n || 1)) - 1; return String.fromCharCode(65 + (Math.floor(n / 899) % 26)) + (101 + (n % 899)); };
const tkParse = c => { const m = String(c || '').trim().match(/^#?([A-Z])(\d{3})$/i); return m ? (m[1].toUpperCase().charCodeAt(0) - 65) * 899 + (+m[2] - 100) : 0; };
function tkMax() {
  let mx = +(S.cfg && S.cfg.tkSeq) || 0;
  S.rp.forEach(r => { const n = tkParse(r.tk); if (n > mx) mx = n; });
  (S.trash || []).forEach(t => { if (t.coll == 'rp' && t.obj) { const n = tkParse(t.obj.tk); if (n > mx) mx = n; } });
  return mx;
}
function nextTk() { const n = tkMax() + 1; S.cfg.tkSeq = n; return tkCode(n); }
function fixDupTk() {
  const seen = {}; let chg = 0;
  S.rp.slice().sort((a, b) => (a.t0 || 0) - (b.t0 || 0)).forEach(r => {
    if (!r.tk) { if (r.st != 'dn') { r.tk = nextTk(); chg = 1; } return; }
    if (seen[r.tk]) { const base = r.tk.replace(/-\d+$/, ''); let n = 2; while (seen[base + '-' + n]) n++; r.tk = base + '-' + n; chg = 1; }
    seen[r.tk] = r.id;
  });
  const mx = tkMax(); if ((S.cfg.tkSeq || 0) < mx) { S.cfg.tkSeq = mx; chg = 1; }
  return chg;
}
/* ---------- فحص ديون الزبون وأجهزته الأخرى + قطع الغيار ---------- */
function rpDebts(tel, name) { return typeof dbtCustOpen == 'function' ? dbtCustOpen(tel, name) : []; }
const rpDebtSum = L => L.reduce((a, d) => a + (typeof dRem == 'function' ? dRem(d) : Math.max(0, (+d.amt || 0))), 0);
function rpOtherOpen(tel, name, excludeId) {
  const ph = rph8(tel), nm = nz(name || '');
  return (S.rp || []).filter(x => {
    if (x.id == excludeId || x.st == 'dn') return false;
    const xph = rph8(x.tel);
    if (ph.length >= 8 && xph.length >= 8) return ph === xph;
    return nm.length >= 4 && nz(x.name) === nm;
  });
}
window.rpPartLines = () => (S.rp || []).filter(r => r.st == 'in' && r.part && r.part.trim()).map(r => ({ id: r.id, s: `${r.part.trim()} — (${r.dev || r.name}${r.tk ? ' #' + r.tk : ''})` }));
window.rpPartDone = id => { const r = rf(id); if (r && r.part) commit('وصلت قطعة الغيار: ' + r.part, () => { r.part = ''; r.lb = S.me; }); };
/* ---------- الضمان والتنظيف ---------- */
function warInfo(r) {
  const w = +r.war || 0; if (!w || r.res == 'fail' || r.res == 'ref') return null;
  if (r.st != 'dn' || !r.t2) return { active: true, daysLeft: w, label: `الضمان المقرر: ${w} يوم` };
  const end = r.t2 + w * 864e5, rem = Math.ceil((end - Date.now()) / 864e5), endStr = new Date(end).toLocaleDateString('ar-MA');
  return rem > 0 ? { active: true, daysLeft: rem, label: `تحت الضمان: باقي ${rem} يوم (لغاية ${endStr})` } : { active: false, daysLeft: 0, label: `انتهى الضمان (${w} يوم — انتهى ${endStr})` };
}
const warToLbl = d => { d = +d || 0; if (!d) return WAR_SEL[0]; const f = WAR_OPTS.find(x => x[0] === d); return f ? f[1] : d + ' يوم'; };
const lblToWar = s => { const m = String(s || '').match(/\d+/); return m ? +m[0] : 0; };
function cleanOldRpMedia() {
  const now = Date.now(), base = lim('rpKeep') * 864e5; let chg = fixDupTk();
  S.rp.forEach(r => {
    if (r.st != 'dn' || !r.t2) return;
    if (now - r.t2 > base && (r.img || IMG[r.id] || r.lock || (r.pat && r.pat.length))) {
      r.img = ''; r.lock = ''; r.pat = []; MEDIA.del(r.id).catch(e => errLog('حذف صورة قديمة: ' + (e && e.message || e))); delete IMG[r.id]; chg = 1;
    }
  });
  if (chg) save();
}
cleanOldRpMedia();
/* ---------- بطاقة الصيانة المدمجة ---------- */
function rc(r, showTabBadge) {
  const n = Math.floor((Date.now() - r.t0) / 864e5), w = r.st == 'rd' ? Math.floor((Date.now() - (r.t1 || r.t0)) / 864e5) : 0;
  const i = r.id, im = rImg(r), wi = warInfo(r), slow = isSlowRp(r);
  const bCls = w > 15 || (r.st == 'rd' && (r.res == 'fail' || r.res == 'ref')) ? 'rp-late' : r.st == 'rd' && r.res == 'ok' ? 'rp-ok' : slow ? 'rp-warn' : r.st == 'in' ? 'rp-in' : '';
  const oDebts = r.st != 'dn' ? rpDebts(r.tel, r.name) : [], oSum = oDebts.length ? rpDebtSum(oDebts) : 0;
  const B = (t, f, p) => `<button class="btn ${p ? '' : 's'} sm" onclick="${f}">${t}</button>`;
  const tabB = showTabBadge ? `<span class="rp-badge">${esc(TB[tabOf(r)] || '')}</span>` : '';
  const retB = r.ret ? `<span class="rp-badge ret">راجع${r.ret > 1 ? ' ' + r.ret : ''}</span>` : '';
  const prHtml = r.cap
    ? `<div class="rp-pr"><span class="cmp-pr">${esc(dh(r.cap))}</span>${r.dep ? `<small class="rp-dep">عربون ${esc(dh(r.dep))}</small>` : ''}</div>`
    : (r.dep ? `<div class="rp-pr"><small class="rp-dep">عربون ${esc(dh(r.dep))}</small></div>` : '');
  const metaParts = [];
  if (r.tel) metaParts.push(`<span class="rp-mi"><bdi>${esc(r.tel)}</bdi></span>`);
  if (r.st == 'in') metaParts.push(`<span class="rp-mi">استلام: <bdi>${fd(r.t0)}</bdi>${n ? ` (منذ ${n} يوم)` : ' (اليوم)'}</span>`);
  else if (r.st == 'rd') metaParts.push(`<span class="rp-mi">جاهز: <bdi>${fd(r.t1 || r.t0)}</bdi>${w ? ` (منذ ${w} يوم)` : ' (اليوم)'}</span>`);
  else if (r.st == 'dn') metaParts.push(`<span class="rp-mi">سُلّم: <bdi>${fd(r.t2)}</bdi> · المقبوض: <b>${esc(dh(r.paid))}</b></span>`);
  const whoName = r.st == 'dn' ? (r.dby || r.by) : (r.lb || r.by);
  if (whoName) metaParts.push(`<span class="rp-mi">${esc(whoName)}</span>`);
  let statusRow = '';
  if (r.st == 'in') {
    const locBtns = shown('rp', 'loc') ? Object.keys(LOC).map(k => `<button class="tag rp-mini ${r.loc == k ? 'on' : ''}" onclick="rLoc('${i}','${k}')">${LOC[k]}</button>`).join('') : '';
    const partBtn = shown('rp', 'need') ? (r.part ? `<button class="tag rp-mini part on" onclick="rPart('${i}')">${I('tool')} خاصو: ${esc(r.part)}</button>` : `<button class="tag rp-mini" onclick="rPart('${i}')">+ خاصو قطعة</button>`) : '';
    const slowBadge = slow ? `<span class="rp-badge warn">متأخر ${n} أيام</span>` : '';
    const lockInd = (r.lock || (r.pat || []).length > 1) ? `<button class="tag rp-mini" onclick="rpOpen('${i}')" title="عرض القفل">${I('lock')} القفل</button>` : '';
    if (locBtns || partBtn || slowBadge || lockInd) statusRow = `<div class="rp-tags">${locBtns}${partBtn}${lockInd}${slowBadge}</div>`;
  } else if (r.st == 'rd') {
    const resCls = r.res == 'ok' ? 'ok' : 'bad', lastC = (r.calls || []).slice(-1)[0];
    statusRow = `<div class="rp-tags"><span class="rp-badge ${resCls}">${esc(RES[r.res] || 'جاهز')}</span>`
      + (lastC ? `<span class="rp-mi">آخر تواصل: <bdi>${esc(lastC)}</bdi> (${r.calls.length})</span>` : '')
      + (w > 15 ? `<span class="rp-badge bad">منسي منذ ${w} يوم</span>` : '') + `</div>`;
  } else if (r.st == 'dn') {
    const tstBadge = r.tst ? `<span class="rp-badge ok">${I('check')} جُرِّب مع الزبون</span>` : '';
    const wiBadge = wi ? `<span class="rp-badge ${wi.active ? 'ok' : ''}">${I('shield')} ${esc(wi.label)}</span>` : '';
    if (tstBadge || wiBadge) statusRow = `<div class="rp-tags">${tstBadge}${wiBadge}</div>`;
  }
  const callBtn = r.tel ? `<a href="tel:${esc(r.tel)}" class="btn s sm rp-icb" title="اتصال">${I('phone')}</a>` : '';
  const moreBtn2 = `<button class="btn s sm rp-icb" onclick="rpOpen('${i}')" title="تفاصيل وخيارات">⋯</button>`;
  const actsRow = r.st == 'in'
    ? `<div class="sub">${B('مصلوح', `rSt('${i}','ok')`, 1)}${B('غير مصلوح', `rSt('${i}','fail')`)}${B('رفض', `rSt('${i}','ref')`)}${callBtn}${moreBtn2}</div>`
    : r.st == 'rd'
      ? `<div class="sub">${B('تسليم', `rDV('${i}')`, 1)}${B('واتساب', `rWA('${i}')`)}${B('اتصلت', `rCL('${i}')`)}${callBtn}${moreBtn2}</div>`
      : `<div class="sub">${B('إرجاع للصيانة', `rRet('${i}')`)}${callBtn}${B('تفاصيل / تعديل', `rpOpen('${i}')`)}</div>`;
  return `<div class="card cmp ${bCls}">`
    + `<div class="row2"><div class="rp-hd" onclick="rpOpen('${i}')">${im ? `<img class="rp-th" onclick="event.stopPropagation();rpZoom('${i}')" src="${im}">` : ''}<div class="cmp-main"><div class="rp-title">${r.tk ? `<span class="tk-b">#${esc(r.tk)}</span>` : ''}${tabB}${retB}<b>${esc(r.name)}</b></div><div class="rp-dev">${esc(r.dev || 'هاتف')} — <span>${esc(r.fault)}</span></div></div></div>${prHtml}</div>`
    + `<div class="rp-meta" onclick="rpOpen('${i}')">${metaParts.join('')}</div>`
    + statusRow
    + (r.note ? `<div class="rnote" onclick="rNote('${i}')" title="اضغط لتعديل الملاحظة">${I('chat')}<span>${esc(r.note)}</span></div>` : '')
    + (r.st == 'dn' && r.dnote ? `<div class="m">ملاحظة التسليم: ${esc(r.dnote)}</div>` : '')
    + (typeof dbtRp == 'function' ? dbtRp(r) : '')
    + (oSum > 0 ? `<div class="rs rp-click" onclick="go('dbt')">${I('alert')} تنبيه: على هذا الزبون دين مفتوح (${oSum} درهم)</div>` : '')
    + actsRow + `</div>`;
}
/* ---------- نافذة تفاصيل التذكرة السفلية ---------- */
const rpGo = (fn, id, arg2) => { finish(null); setTimeout(() => window[fn](id, arg2), 380); };
function rpCanSaveGuide(r) {
  if (!can('price') || !r || !r.dev || !r.fault || !sn1(r.cap)) return false;
  const nd = nz(r.dev), nf = nz(r.fault), pr = dg(r.cap).trim();
  return !(S.guide || []).some(g => nz(g.m) === nd && nz(g.f) === nf && dg(g.p).trim() === pr);
}
window.rpSaveToGuide = id => {
  const r = rf(id); if (!r) return;
  ask('حفظ في دليل أسعار الإصلاح', [
    { k: 'm', l: 'الموديل', v: r.dev || '' },
    { k: 'f', l: 'العطل', v: r.fault || '' },
    { k: 'p', l: 'السعر الأساسي (درهم)', t: 'tel', v: sn1(r.cap) ? dg(r.cap).trim() : '' },
    { k: 'p2', l: 'سعر الفئة 2 / الأصلي (اختياري)', t: 'tel', v: '' }
  ], 'حفظ في الدليل').then(v => {
    if (!v || !v.m.trim() || !v.f.trim() || !v.p.trim()) return;
    commit('حُفظ السعر في الدليل', () => {
      const ex = (S.guide || []).find(g => nz(g.m) === nz(v.m) && nz(g.f) === nz(v.f));
      if (ex) { ex.p = v.p.trim(); if (v.p2.trim()) ex.p2 = v.p2.trim(); }
      else S.guide.push({ id: uid(), m: v.m.trim(), f: v.f.trim(), p: v.p.trim(), p2: v.p2.trim(), n: '' });
    });
  });
};
window.rpOpen = id => { const r = rf(id); if (r) { rpSheetR(id); sheetOpen(() => { }); } };
function rpSheetR(id) {
  const r = rf(id); if (!r) return;
  const im = rImg(r), wi = warInfo(r), others = rpOtherOpen(r.tel, r.name, r.id), oDebts = rpDebts(r.tel, r.name);
  const calls = (r.calls || []).slice().reverse();
  $('sh').innerHTML = `<div class="bar"></div>`
    + `<div class="row2">${r.tk ? `<span class="tk-b">#${esc(r.tk)}</span>` : ''}<h3>${esc(r.name)}</h3><span class="rp-badge">${esc(TB[tabOf(r)] || '')}</span></div>`
    + `<div class="card rp-sum-box">`
    + `<div class="row2"><b>${esc(r.dev || 'هاتف')} — ${esc(r.fault)}</b>${r.cap ? `<span class="cmp-pr">${esc(dh(r.cap))}</span>` : ''}</div>`
    + (r.dep ? `<div class="m">العربون المقبوض: <b>${esc(dh(r.dep))}</b>${sn1(r.cap) && sn1(r.dep) ? ` · المتبقي: <b>${Math.max(0, +dg(r.cap) - +dg(r.dep))} درهم</b>` : ''}</div>` : '')
    + (r.tel ? `<div class="m">الهاتف: <a href="tel:${esc(r.tel)}"><bdi>${esc(r.tel)}</bdi></a></div>` : '<div class="m">بدون رقم هاتف مسجل</div>')
    + `<div class="m">استلام: <bdi>${fd(r.t0)}</bdi> (${esc(r.by || '')})${r.t1 ? ` · جُهّز: <bdi>${fd(r.t1)}</bdi>` : ''}${r.st == 'dn' && r.t2 ? ` · سُلّم: <bdi>${fd(r.t2)}</bdi> (${esc(r.dby || '')}) · المقبوض: <b>${esc(dh(r.paid))}</b>` : ''}</div>`
    + ((r.chk || []).length ? `<div class="m">حالة الاستلام / الأمانات: <b>${esc(r.chk.join('، '))}</b></div>` : '')
    + (r.part ? `<div class="rs">خاصو قطعة غيار: ${esc(r.part)}</div>` : '')
    + (wi ? `<div class="m"><b>${I('shield')} ${esc(wi.label)}</b></div>` : '')
    + (r.imei ? `<div class="m">IMEI: <bdi>${esc(r.imei)}</bdi></div>` : '')
    + fxShow(r)
    + (r.note ? `<div class="rnote" onclick="rpGo('rNote','${r.id}')">${I('chat')}<span>${esc(r.note)}</span></div>` : '')
    + (r.dnote ? `<div class="m">ملاحظة التسليم: ${esc(r.dnote)}</div>` : '')
    + `</div>`
    + ((r.lock || (r.pat || []).length > 1) ? `<div class="card row2"><div class="f1"><b>بيانات فتح القفل</b>${r.lock ? `<div class="m">رمز القفل (PIN): <b><bdi>${esc(r.lock)}</bdi></b></div>` : '<div class="m">بدون رمز PIN</div>'}</div>${(r.pat || []).length > 1 ? `<svg viewBox="0 0 120 120" width="76" class="rp-pat-svg">${PI(r.pat)}</svg>` : ''}</div>` : '')
    + (im ? `<img onclick="rpGo('rpZoom','${r.id}')" src="${im}" class="rp-sheet-im">` : '')
    + (others.length ? `<div class="card rp-warn"><b>${I('alert')} لهذا الزبون جهاز آخر في الصيانة:</b>${others.map(x => `<div class="m">#${esc(x.tk || '')} — ${esc(x.dev)} (${esc(TB[tabOf(x)])})</div>`).join('')}</div>` : '')
    + (oDebts.length ? `<div class="card rp-late"><b>${I('wallet')} على هذا الزبون دين مفتوح: ${rpDebtSum(oDebts)} درهم</b></div>` : '')
    + (calls.length ? `<div class="card"><b>سجل التواصل (${calls.length})</b>${calls.slice(0, 6).map(c => `<div class="m">• <bdi>${esc(c)}</bdi></div>`).join('')}</div>` : '')
    + `<div class="cs-acts">`
    + `<button class="btn s" onclick="rpGo('rEd','${r.id}')">تعديل التذكرة</button>`
    + `<button class="btn s" onclick="rpGo('rNote','${r.id}')">${r.note ? 'تعديل الملاحظة' : '+ ملاحظة'}</button>`
    + (r.st == 'in' && shown('rp', 'need') ? `<button class="btn s" onclick="rpGo('rPart','${r.id}')">${r.part ? 'تعديل/وصول القطعة' : '+ خاصو قطعة غيار'}</button>` : '')
    + (r.st == 'in' ? `<button class="btn s" onclick="rpGo('rCL','${r.id}')">سجّل اتصالاً بالزبون</button>` : '')
    + (r.st == 'rd' ? `<button class="btn s" onclick="rpGo('rSt','${r.id}','in')">إرجاع إلى «في المحل»</button>` : '')
    + (r.st == 'dn' ? `<button class="btn s" onclick="rpGo('rRet','${r.id}')">إرجاع للصيانة (راجع)</button>` : '')
    + (rpCanSaveGuide(r) ? `<button class="btn s" onclick="rpGo('rpSaveToGuide','${r.id}')">${I('bulb')} حفظ السعر في الدليل</button>` : '')
    + (can('del') ? `<button class="btn s del" onclick="rpGo('rDel','${r.id}')">حذف التذكرة</button>` : '')
    + `</div><div class="acts"><button class="btn" onclick="finish(null)">إغلاق</button></div>`;
}
/* ---------- قائمة الصيانة والفلاتر والبحث الذكي ---------- */
function rpList() {
  const q = nz(V.q || ''), tab = V.tab || 'in', sf = V.sf || '';
  const matchR = (r, ignoreTab) => (ignoreTab || V.all || tabOf(r) == tab) && inR(tOf(r)) && (!q || nzOf(r, rpText).includes(q));
  let a = S.rp.filter(r => matchR(r, false)), autoAll = false;
  if (!V.all && !a.length && q) {
    const anyTab = S.rp.filter(r => matchR(r, true));
    if (anyTab.length) { a = anyTab; autoAll = true; }
  }
  if (!V.all && !autoAll) {
    if (sf == 'late' && (tab == 'rd' || tab == 'nf')) a = a.filter(isLateRp);
    else if (sf == 'war' && tab == 'dn') a = a.filter(r => { const w = warInfo(r); return w && w.active; });
    else if ((sf == 'm' || sf == 's') && tab == 'in') a = a.filter(r => r.loc == sf);
    else if (sf == 'part' && tab == 'in') a = a.filter(r => r.part && r.part.trim());
    else if (sf == 'slow' && tab == 'in') a = a.filter(isSlowRp);
  }
  if (tab == 'in' && sf == 'slow') a.sort((x, y) => tOf(x) - tOf(y));
  else a.sort((x, y) => tOf(y) - tOf(x));
  const limN = V.rlim || 40, vis = a.slice(0, limN);
  const banner = autoAll ? `<div class="rsent w">لا نتائج في «${esc(TB[tab])}» — عُرضت النتائج من التبويبات الأخرى (${a.length})</div>` : '';
  const moreBtnHtml = a.length > limN ? `<button class="btn s" onclick="V.rlim=(V.rlim||40)+40;rpL()">عرض المزيد (+${a.length - limN} متبقية)</button>` : '';
  return banner + ((vis.map(r => rc(r, V.all || autoAll)).join('') + moreBtnHtml) || emptyBox('لا توجد هواتف صيانة في هذا الفلتر', 'اضغط على «+ استلام هاتف» في الأعلى لتسجيل جهاز جديد'));
}
const rpL = () => { if ($('rl')) $('rl').innerHTML = rpList(); };
function rpSubFiltersHtml(tab) {
  const sf = V.sf || '';
  if (tab == 'in') {
    const mCnt = shown('rp', 'loc') ? S.rp.filter(r => r.st == 'in' && r.loc == 'm').length : 0;
    const sCnt = shown('rp', 'loc') ? S.rp.filter(r => r.st == 'in' && r.loc == 's').length : 0;
    const pCnt = shown('rp', 'need') ? S.rp.filter(r => r.st == 'in' && r.part && r.part.trim()).length : 0;
    const wCnt = S.rp.filter(isSlowRp).length;
    if (!mCnt && !sCnt && !pCnt && !wCnt && !sf) return '';
    return `<div class="sec-tags rp-sub-tags">`
      + `<button class="tag ${!sf ? 'on' : ''}" onclick="V.sf='';render()">الكل</button>`
      + (mCnt || sf == 'm' ? `<button class="tag ${sf == 'm' ? 'on' : ''}" onclick="V.sf=V.sf=='m'?'':'m';render()">عند المعلم (${mCnt})</button>` : '')
      + (sCnt || sf == 's' ? `<button class="tag ${sf == 's' ? 'on' : ''}" onclick="V.sf=V.sf=='s'?'':'s';render()">في الرف (${sCnt})</button>` : '')
      + (pCnt || sf == 'part' ? `<button class="tag ${sf == 'part' ? 'on' : ''}" onclick="V.sf=V.sf=='part'?'':'part';render()">${I('tool')} خاصو قطعة (${pCnt})</button>` : '')
      + (wCnt || sf == 'slow' ? `<button class="tag ${sf == 'slow' ? 'on' : ''}" onclick="V.sf=V.sf=='slow'?'':'slow';render()">${I('alert')} متأخر +3 أيام (${wCnt})</button>` : '')
      + `</div>`;
  }
  if (tab == 'rd' || tab == 'nf') {
    const lateCnt = S.rp.filter(r => tabOf(r) == tab && isLateRp(r)).length;
    if (!lateCnt && sf != 'late') return '';
    return `<div class="sec-tags rp-sub-tags"><button class="tag ${!sf ? 'on' : ''}" onclick="V.sf='';render()">الكل</button><button class="tag ${sf == 'late' ? 'on' : ''}" onclick="V.sf=V.sf=='late'?'':'late';render()">${I('alert')} منسي +15 يوم (${lateCnt})</button></div>`;
  }
  if (tab == 'dn') {
    const warCnt = S.rp.filter(r => r.st == 'dn' && (warInfo(r) || {}).active).length;
    if (!warCnt && sf != 'war') return '';
    return `<div class="sec-tags rp-sub-tags"><button class="tag ${!sf ? 'on' : ''}" onclick="V.sf='';render()">كل الأرشيف</button><button class="tag ${sf == 'war' ? 'on' : ''}" onclick="V.sf=V.sf=='war'?'':'war';render()">${I('shield')} تحت الضمان (${warCnt})</button></div>`;
  }
  return '';
}
VW.rp = () => {
  const tab = V.tab || 'in';
  return {
    t: 'الصيانة',
    h: `<div class="row2"><button class="btn rp-top-main" onclick="rEd(null)">+ استلام هاتف</button><button class="btn s rp-top-sub" onclick="go('gd')">دليل الأسعار</button></div>`
      + `<div class="sec-panel">`
      + `<div class="rp-tabs-grid">`
      + Object.keys(TB).map(k => {
        const cnt = S.rp.filter(r => tabOf(r) == k).length, on = !V.all && tab == k;
        return `<button class="tag rp-tab-btn ${on ? 'on' : ''}" onclick="V.all=0;V.tab='${k}';V.sf='';V.rlim=40;render()"><span>${TB[k]}</span><b>${cnt}</b></button>`;
      }).join('')
      + `</div>`
      + rpSubFiltersHtml(tab)
      + `<input class="rp-srch" placeholder="ابحث: تذكرة (A101)، اسم، رقم، جهاز، عطل، حالة..." value="${esc(V.q)}" oninput="V.q=this.value;V.rlim=40;rpL()">`
      + `<div class="row2"><select class="rp-dt-sel" aria-label="التاريخ" onchange="V.d=this.value;V.rlim=40;render()">${FL.map(([k, l]) => `<option value="${k}" ${(V.d || 'all') == k ? 'selected' : ''}>${k == 'all' ? 'كل التواريخ' : l}</option>`).join('')}</select><button class="tool-pill ${V.all ? 'on' : ''}" onclick="V.all=!V.all;V.rlim=40;render()">كل التبويبات (${S.rp.length})</button></div>`
      + `${V.d == 'date' ? `<input type="date" class="rp-dt-inp" value="${V.dt || ''}" onchange="V.dt=this.value;render()">` : ''}`
      + `</div><div id="rl">${rpList()}</div>`
  };
};
/* ---------- إجراءات الحالة وقطعة الغيار والإرجاع والاتصال ---------- */
window.rSt = function (id, x) {
  const r = rf(id); if (!r) return;
  if (x == 'ok' && !sn1(r.cap)) {
    ask('تحديد تكلفة الإصلاح — ' + (r.tk ? '#' + r.tk + ' ' : '') + r.name, [
      { k: 'c', l: `السعر المتفق عليه لـ «${r.dev || ''} — ${r.fault || ''}» (درهم) — اتركه فارغاً إن لم يُحدد بعد`, t: 'tel', v: '' }
    ], 'تأكيد وجاهز').then(v => {
      if (!v) return;
      commit('انتقل إلى «جاهز»', () => {
        if (v.c.trim()) r.cap = dg(v.c).trim();
        r.st = 'rd'; r.res = 'ok'; r.t1 = Date.now(); r.loc = ''; r.part = ''; r.lb = S.me;
      });
    });
    return;
  }
  commit(x == 'in' ? 'عاد إلى «في المحل»' : x == 'ok' ? 'انتقل إلى «جاهز»' : 'انتقل إلى «لم تُصلَّح»', () => {
    if (x == 'in') { r.st = 'in'; r.res = ''; }
    else { r.st = 'rd'; r.res = x; r.t1 = Date.now(); r.part = ''; }
    r.loc = ''; r.lb = S.me;
  });
};
window.rPart = function (id) {
  const r = rf(id); if (!r) return;
  const defPart = r.part || [r.fault, r.dev].filter(Boolean).join(' ');
  $('sh').innerHTML = `<div class="bar"></div><h3>قطعة غيار مطلوبة — ${esc((r.tk ? '#' + r.tk + ' ' : '') + r.name)}</h3>`
    + `<p class="m">تظهر هذه القطعة تلقائياً في «التقرير اليومي» للمعلم حتى يشتريها، وتختفي بمجرد إصلاح الهاتف أو مسحها.</p>`
    + `<label>اسم القطعة المطلوبة<input id="rp_pt" value="${esc(defPart)}" placeholder="مثال: افيشور Samsung A15"></label>`
    + `<div class="acts">${r.part ? `<button class="btn s del" onclick="finish('')">وصلت / مسح</button>` : '<button class="btn s" onclick="finish(null)">إلغاء</button>'}<button class="btn" onclick="finish($('rp_pt').value.trim())">حفظ في التقرير</button></div>`;
  sheetOpen(v => {
    if (v === null) return;
    commit(v ? 'أُضيفت القطعة للتقرير اليومي' : 'تم مسح القطعة المطلوبة', () => { r.part = v; r.lb = S.me; });
  });
};
window.rRet = function (id) {
  const r = rf(id); if (!r) return;
  const wi = warInfo(r), defN = wi && wi.active ? 'راجع تحت الضمان' : 'راجع للصيانة';
  ask('إرجاع الهاتف للصيانة — ' + (r.tk ? '#' + r.tk + ' ' : '') + r.name, [
    { k: 'n', l: 'سبب الإرجاع / ملاحظة للمعلم (تظهر بارزة على البطاقة)', v: defN }
  ], 'إرجاع للمحل').then(v => {
    if (!v) return;
    commit('أُعيد الهاتف إلى «في المحل»', () => {
      r.st = 'in'; r.res = ''; r.ret = (r.ret || 0) + 1; r.lb = S.me;
      const rn = v.n.trim();
      if (rn && !(r.note || '').includes(rn)) r.note = [r.note, rn].filter(Boolean).join(' · ');
    });
  });
};
window.rNote = function (id) {
  const r = rf(id); if (!r) return;
  $('sh').innerHTML = `<div class="bar"></div><h3>ملاحظة — ${esc((r.tk ? '#' + r.tk + ' ' : '') + r.name)}</h3><textarea id="rn_t" rows="4" placeholder="اكتب ملاحظة عن هذا الهاتف…">${esc(r.note || '')}</textarea><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="finish($('rn_t').value.trim())">حفظ</button></div>`;
  sheetOpen(v => { if (v === null) return; commit(v ? 'تم حفظ الملاحظة' : 'تم مسح الملاحظة', () => { r.note = v; r.lb = S.me; }); });
  setTimeout(() => { const t = $('rn_t'); if (t) t.focus(); }, 80);
};
window.rLoc = function (id, k) {
  const r = rf(id); if (!r || !LOC[k]) return;
  const off = r.loc == k;
  commit(off ? 'أُلغي مكان الهاتف' : 'مكان الهاتف: ' + LOC[k], () => { r.loc = off ? '' : k; r.lb = S.me; });
};
window.rCL = function (id) { const r = rf(id); if (r) commit('تم تسجيل الاتصال', () => (r.calls = r.calls || []).push('اتصال ' + fd(Date.now()) + ' ' + S.me)); };
window.rDel = function (id) { const r = rf(id); if (r) del('rp', id, (r.tk ? '#' + r.tk + ' ' : '') + r.name + ' — ' + r.dev); };
/* ---------- إرفاق سلعة من المخزون عند التسليم ---------- */
function rpAddonOpts(dev) {
  const out = [{ k: '', l: '— بدون إرفاق سلعة —' }], nd = nz(dev || '');
  if (nd.length >= 2) {
    S.gg.filter(g => g.models.some(m => { const nm = nz(m); return nm && (nd.includes(nm) || nm.includes(nd)); })).forEach(g => {
      const mName = g.models.find(m => { const nm = nz(m); return nm && (nd.includes(nm) || nm.includes(nd)); }) || g.models[0];
      S.tags.glass.forEach((ty, j) => {
        if (!gHas(g, mName, ty)) return;
        const it = gitem(g.id, ty), tot = it ? gTot(it, g) : 0;
        if (tot > 0) out.push({ k: `gl:${g.id}:${j}:${mName}`, l: `أنتي كاس ${ty} (${mName})${it && it.price ? ' — ' + dh(it.price) : ''}` });
      });
    });
    S.items.filter(i => i.sec == 'case' && (nd.includes(nz(i.name)) || nz(i.name).includes(nd))).forEach(i => {
      (i.v || []).filter(v => v.n > 0).forEach(v => {
        const vl = [v.g, v.c].filter(Boolean).join('·') || 'عام';
        out.push({ k: `cs:${i.id}:${v.id}`, l: `بوشيط ${i.name} (${vl}) — متوفر ${v.n}` });
      });
    });
  }
  return out;
}
function applyRpAddon(opt) {
  if (!opt || !opt.k) return '';
  const p = opt.k.split(':');
  if (p[0] == 'gl') {
    const g = S.gg.find(x => x.id == p[1]), ty = S.tags.glass[+p[2]], m = p.slice(3).join(':');
    if (g && ty) {
      const i = glGet(g.id, ty), tM = mval(i, m) > 0 ? m : (g.models.find(x => mval(i, x) > 0) || m);
      if (i.stock && i.stock[tM] > 0) i.stock[tM]--;
      else if (i.lv && i.lv[tM] && i.lv[tM] != 'r') i.lv[tM] = ({ a: 'b', b: 'c', c: 'y', y: 'r' })[i.lv[tM]] || 'r';
      touch(i);
      return 'أنتي كاس ' + ty + ' (' + m + ')';
    }
  } else if (p[0] == 'cs') {
    const i = find(p[1]), v = i && (i.v || []).find(x => x.id == p[2]);
    if (v && v.n > 0) { v.n--; touch(i); return 'بوشيط ' + i.name + ' (' + ([v.g, v.c].filter(Boolean).join('·') || 'عام') + ')'; }
  } else if (p[0] == 'ac') {
    const i = find(p[1]);
    if (i && i.cnt > 0) { i.cnt--; touch(i); return acName(i); }
  }
  return '';
}
/* ---------- التسليم الذكي ---------- */
window.rDV = function (id, pre) {
  const r = rf(id); if (!r) return;
  const pr = pre || {}, cap = sn1(r.cap) ? +dg(r.cap) : null, dep = sn1(r.dep) ? +dg(r.dep) : 0;
  const notFixed = r.res == 'fail' || r.res == 'ref';
  const def = (!notFixed && cap !== null) ? String(Math.max(0, cap - dep)) : '0';
  const addons = rpAddonOpts(r.dev), oDebts = rpDebts(r.tel, r.name), oSum = oDebts.length ? rpDebtSum(oDebts) : 0;
  const others = rpOtherOpen(r.tel, r.name, r.id);
  const lbl = notFixed
    ? (r.dep ? `المبلغ المقبوض (الهاتف ${RES[r.res]} — تذكّر إرجاع العربون ${dh(r.dep)} للزبون)` : 'المبلغ المقبوض (0 إن لم يُقبض شيء)')
    : (cap !== null ? (dep ? `المتبقي ${def} درهم (السعر ${cap} − العربون ${dep}) — عدّله إن دفع أقل أو أكثر` : `المبلغ المقبوض (السعر المتفق ${cap} درهم)`) : 'المبلغ المقبوض الآن (درهم)');
  const F = [{ k: 'p', l: lbl, t: 'tel', v: pr.p ?? def }];
  if (!notFixed) {
    const cur = warToLbl(pr.war ?? r.war ?? 0), wo = WAR_SEL.includes(cur) ? WAR_SEL : [cur, ...WAR_SEL];
    F.unshift(
      { k: 'tested', l: (pr.err ? 'مطلوب، اختر أحد الخيارين: ' : '') + 'تجربة الإصلاح مع الزبون قبل التسليم (إجباري)', t: 'sel', o: DVO, v: pr.tested || DVO[0] },
      { k: 'war', l: 'مدة ضمان الإصلاح (يبدأ اليوم)', t: 'sel', o: wo, v: cur }
    );
  }
  if (addons.length > 1) F.push({ k: 'addon', l: 'إرفاق سلعة من المخزون مع التسليم (تُخصم تلقائياً)', t: 'sel', o: addons.map(x => x.l), v: pr.addon || addons[0].l });
  F.push({ k: 'dnote', l: 'ملاحظة عند التسليم (اختياري)', v: pr.dnote ?? (r.dnote || '') });
  const p = ask('تسليم الهاتف: ' + (r.tk ? '#' + r.tk + ' ' : '') + r.name, F, 'تأكيد التسليم');
  if ($('sh')) {
    const h3 = $('sh').querySelector('h3');
    const sumH = `<div class="card rp-sum-box">`
      + `<div><b>${esc(r.dev || 'هاتف')} — ${esc(r.fault)}</b>${r.cap ? ` · السعر: <b>${esc(dh(r.cap))}</b>` : ''}${r.dep ? ` · العربون: <b>${esc(dh(r.dep))}</b>` : ''}</div>`
      + ((r.chk || []).length ? `<div class="rs">${I('alert')} تذكير بحالة الاستلام / الأمانات: ${esc(r.chk.join('، '))}</div>` : '')
      + (notFixed && r.dep ? `<div class="rs">${I('alert')} تنبيه مهم: الزبون دفع عربون (${esc(dh(r.dep))}) والهاتف «${esc(RES[r.res])}» — تأكد من إرجاع العربون له!</div>` : '')
      + (others.length ? `<div class="rs">${I('bell')} لهذا الزبون جهاز آخر في الصيانة: ${others.map(x => '#' + esc(x.tk || '') + ' ' + esc(x.dev) + ' (' + esc(TB[tabOf(x)]) + ')').join(' ، ')}</div>` : '')
      + (oSum > 0 ? `<div class="rs">${I('wallet')} على هذا الزبون دين سابق مفتوح: ${oSum} درهم</div>` : '')
      + `</div>`;
    if (h3) h3.insertAdjacentHTML('afterend', sumH);
  }
  return p.then(v => {
    if (!v) return;
    const again = e => rDV(id, { p: v.p, dnote: v.dnote, tested: v.tested, war: lblToWar(v.war), addon: v.addon, err: e });
    if (!notFixed && v.tested == DVO[0]) return again(1);
    if (v.p.trim() !== '' && !sn1(v.p)) { toast('اكتب المبلغ رقماً فقط (مثال 100)'); return again(0); }
    const paidStr = dg(v.p.trim()) || '0', paidNum = parseFloat(paidStr) || 0, picked = addons.find(x => x.l == v.addon);
    commit('تم التسليم', () => {
      const addTxt = applyRpAddon(picked);
      r.st = 'dn'; r.t2 = Date.now(); r.dby = S.me; r.paid = paidStr; r.part = '';
      r.tst = !notFixed && v.tested == DVO[1] ? Date.now() : 0;
      if (!notFixed) r.war = lblToWar(v.war);
      const dn = (v.dnote || '').trim();
      r.dnote = [dn, addTxt ? 'مرفق: ' + addTxt : ''].filter(Boolean).join(' · ');
    });
    const remDebt = !notFixed && cap !== null ? Math.max(0, cap - dep - paidNum) : 0;
    if (remDebt > 0 && !r.debt) {
      setTimeout(() => {
        sure(`الباقي غير المقبوض هو ${remDebt} درهم (السعر ${cap}${dep ? ' − العربون ' + dep : ''} − المقبوض ${paidNum}). هل تريد تسجيل ${remDebt} درهم كدين على «${r.name}»؟`, 'نعم، سجّله كدين', false).then(ok => {
          if (!ok) return;
          commit(`سُجّل الباقي (${remDebt} درهم) كدين`, () => {
            const o = { id: uid(), name: r.name, tel: r.tel || '', amt: String(remDebt), why: 'باقي إصلاح ' + (r.dev || '') + (r.tk ? ' #' + r.tk : ''), pays: [], by: S.me, at: Date.now(), rp: r.id };
            S.debt.push(o); r.debt = o.id;
          });
        });
      }, 280);
    }
  });
};
/* ---------- واتساب يدوي فقط ---------- */
window.rWA = function (id) {
  const r = rf(id); if (!r) return;
  const send = tel => {
    const ph = rnum(tel); if (ph.length < 8) return toast('رقم الهاتف غير صالح');
    const cap = sn1(r.cap) ? +dg(r.cap) : null, dep = sn1(r.dep) ? +dg(r.dep) : 0;
    let c = '';
    if (r.res == 'ok') {
      if (cap !== null && dep > 0) c = ` تكلفة الإصلاح: ${cap} درهم (العربون: ${dep} درهم — الباقي للأداء: ${Math.max(0, cap - dep)} درهم).`;
      else if (cap !== null) c = ` تكلفة الإصلاح: ${cap} درهم.`;
      else if (r.cap) c = ` تكلفة الإصلاح: ${dh(r.cap)}.`;
    } else if (r.dep) c = ` (مع استرجاع العربون: ${dh(r.dep)}).`;
    const dev = (r.dev || 'هاتفك') + (r.tk ? ` (تذكرة #${r.tk})` : '') + (r.imei ? ` [IMEI: ${r.imei}]` : '') + ((+r.war > 0 && r.res == 'ok') ? ` (الضمان: ${r.war} يوم)` : '');
    const s = r.res == 'ok' ? `هاتفك ${dev} جاهز في المحل.${c}` : r.res == 'fail' ? `للأسف تعذّر إصلاح هاتفك ${dev}. يمكنك استلامه من المحل.${c}` : `هاتفك ${dev} جاهز للاستلام بدون إصلاح.${c}`;
    (r.calls = r.calls || []).push('واتساب ' + fd(Date.now()) + ' ' + S.me);
    save(); render();
    location.href = 'https://wa.me/' + ph + '?text=' + encodeURIComponent(`مرحباً ${r.name}، ${s}\n— محل عزيز`);
  };
  if (rnum(r.tel).length >= 8) return send(r.tel);
  ask('رقم هاتف ' + r.name, [{ k: 't', l: 'أدخل رقم الهاتف لإرسال رسالة الجاهزية وحفظه في التذكرة', t: 'tel', v: r.tel || '' }], 'إرسال واتساب').then(v => {
    if (!v || !v.t.trim()) return;
    r.tel = v.t.trim(); save(); render(); send(r.tel);
  });
};
/* ---------- إكمال الأجهزة فقط (بلا اقتراح أسماء زبائن أثناء الكتابة) ---------- */
function rpSugData() {
  const devs = new Set();
  [...(S.rp || []), ...(S.used || [])].forEach(x => { if (x.dev) devs.add(x.dev.trim()); });
  (S.items || []).forEach(i => { if (i.sec == 'phones') devs.add((i.brand + ' ' + i.name).trim()); });
  (S.guide || []).forEach(g => { if (g.m) devs.add(g.m.trim()); });
  return { devs: [...devs] };
}
delete SUG.rn;
SUG.rd = () => rpSugData().devs.slice(0, 50);
function rpDatalists() { return ''; }
/* ---------- نافذة الاستلام والتعديل ---------- */
window.rEd = function (id) { const rec = id ? rf(id) : {}; $('sh').innerHTML = ''; sheetOpen(v => rDone(v, rec)); rForm(rec); };
function rForm(rec) {
  ZR = rec; ZP = [...(rec.pat || [])]; ZK = [...(rec.chk || [])]; ZI = rec.img || ''; ZW = +(rec.war ?? 0); ZL = rec.loc || '';
  fsInit([], {}, 'rp', rec);
  const shownImg = ZI.startsWith('data:') ? ZI : (rec.id && IMG[rec.id]) || '';
  const tkShow = rec.tk || '', moreOpen = (rec.imei || +rec.war || rec.part || (rec.pat && rec.pat.length > 1)) ? ' open' : '';
  $('sh').innerHTML = `<div class="bar"></div><div class="row2"><h3 class="rp-fh">${rec.id ? 'تعديل صيانة' : 'استلام هاتف'}</h3>${tkShow ? `<span class="tk-b" title="اكتب هذا الرقم على ملصق الهاتف">#${esc(tkShow)}</span>` : '<span class="m">رقم التذكرة يظهر بعد الحفظ</span>'}</div>`
    + `<div class="row2"><label class="f1">اسم الزبون<input id="r_n" autocomplete="off" value="${esc(rec.name || '')}" oninput="rH(1)"></label><label class="f1">رقم الهاتف (اختياري)<input id="r_t" type="tel" value="${esc(rec.tel || '')}" placeholder="بدون رقم إن تعذّر" oninput="rH()"></label></div><div id="rh" class="m"></div>`
    + `<label>نوع الهاتف (اكتب أو اختر الماركة تحته)<input id="r_v" data-sug="rd" value="${esc(rec.dev || '')}" placeholder="مثال: Samsung A15" oninput="syncRpTags();checkDeviceHistory();suggestGuidePrice()"></label>`
    + `<div id="rp_br_tags" class="rp-chip-box">${S.tags.brand.map((b, j) => `<button type="button" class="tag rp-br-tg" onclick="pickRpBrand(${j})">${esc(b)}</button>`).join('')}</div><div id="rp_dev_hist" class="rs"></div>`
    + `<label>العطل / المشكل (اكتب أو اختر من الأعطال تحته)<input id="r_f" value="${esc(rec.fault || '')}" placeholder="مثال: تغيير شاشة" oninput="syncRpTags();suggestGuidePrice()"></label>`
    + `<div id="rp_fl_tags" class="rp-chip-box">${S.tags.fault.map((x, j) => `<button type="button" class="tag rp-fl-tg" onclick="pickRpFault(${j})">${esc(x)}</button>`).join('')}</div>`
    + `<div id="rp_price_hint"></div>`
    + `<div class="row2"><label class="f13"${hh('rp', 'cap')}><span class="row2"><span>السعر المتفق</span><button type="button" class="rp-qbtn" onclick="rpToggleCallPrice()">اتصل بعد الفحص</button></span><input id="r_c" value="${esc(rec.cap || '')}" placeholder="مثال: 150 أو اتصل"></label><label class="f1"${hh('rp', 'dep')}>العربون (اختياري)<input id="r_d" type="tel" value="${esc(rec.dep || '')}" placeholder="0"></label>${rec.st == 'dn' ? `<label class="f1">المقبوض عند التسليم<input id="r_paid" type="tel" value="${esc(rec.paid ?? '')}"></label>` : ''}</div>`
    + `<div class="row2"><div class="f1"${hh('rp', 'loc')}><label>مكان الهاتف</label><div class="row2">${Object.keys(LOC).map(k => `<button type="button" class="tag rp-loc-tg f1 ${ZL == k ? 'on' : ''}" onclick="pickRpLoc('${k}')">${LOC[k]}</button>`).join('')}</div></div><label class="f1"${hh('rp', 'lock')}>رمز القفل (PIN)<input id="r_l" value="${esc(rec.lock || '')}" placeholder="إن وجد"></label></div>`
    + `<div${hh('rp', 'chk')}><label>حالة الجهاز والأمانات عند الاستلام</label><div id="rk" class="rp-chip-box"></div></div>`
    + `<div${hh('rp', 'img')}><div class="row2"><label class="f1">صورة الهاتف (اختياري)</label><button type="button" class="btn s sm" onclick="rCam()">التقاط صورة</button><button type="button" class="btn s sm" onclick="$('r_i').click()">من المعرض</button><button type="button" id="r_imx" class="btn s sm del" onclick="rImDel()" ${shownImg ? '' : 'hidden'}>حذف</button></div><img id="r_im" class="rp-sheet-im" ${shownImg ? `src="${shownImg}"` : 'hidden'}><input id="r_i" type="file" accept="image/*" hidden onchange="rIM(this.files[0])"></div>`
    + `<label${hh('rp', 'note')}>ملاحظة (اختياري) — تظهر بارزة على البطاقة<textarea id="r_o" rows="2">${esc(rec.note || '')}</textarea></label>`
    + `<details class="card rp-det"${moreOpen}><summary><b>تفاصيل إضافية</b> <span class="m">(نمط القفل، خاصو قطعة، الضمان، IMEI)</span></summary>`
    + `<div${hh('rp', 'pat')}><label>نمط القفل (ارسمه بإصبعك)</label><div class="row2"><svg id="zsv" viewBox="0 0 120 120" width="135" class="rp-pat-pad" onpointerdown="ZD=1;rP(event,1)" onpointermove="if(ZD)rP(event)" onpointerup="ZD=0" onpointercancel="ZD=0">${PI(ZP)}</svg><button type="button" class="btn s sm" onclick="ZP=[];$('zsv').innerHTML=PI(ZP)">مسح النمط</button></div></div>`
    + `<label${hh('rp', 'need')}>خاصو قطعة غيار (تظهر تلقائياً في التقرير اليومي للمعلم)<input id="r_part" value="${esc(rec.part || '')}" placeholder="مثال: افيشور Samsung A15"></label>`
    + `<label${hh('rp', 'war')}>ضمان الإصلاح (يبدأ من تاريخ التسليم)<div class="rp-chip-box">${WAR_OPTS.map(([d, l]) => `<button type="button" class="tag war-tg ${ZW === d ? 'on' : ''}" onclick="setRpWar(${d})">${l}</button>`).join('')}</div><input id="r_war" type="tel" value="${ZW || ''}" placeholder="أو اكتب عدد أيام الضمان (0 = بدون ضمان)" oninput="setRpWar(+this.value||0,1)"></label>`
    + `<label${hh('rp', 'imei')}>IMEI / الرقم التسلسلي (اختياري)<div class="row2"><input id="r_imei" class="f1" value="${esc(rec.imei || '')}" placeholder="امسح باركود العلبة أو *#06#"><button type="button" class="btn s sm" onclick="scanIntoInput('r_imei')">${I('scan')} مسح</button></div></label>`
    + `<div id="fx"></div></details>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="rSave(0)">حفظ</button></div>`
    + (rec.id ? '' : `<button type="button" class="btn s" onclick="rSave(1)">حفظ + استلام هاتف آخر لنفس الزبون</button>`);
  rKc(); rH(); fxR(); syncRpTags(); checkDeviceHistory(); suggestGuidePrice();
}
window.rpToggleCallPrice = () => { const el = $('r_c'); if (el) el.value = el.value.trim() === 'اتصل' ? '' : 'اتصل'; };
window.pickRpLoc = k => {
  ZL = ZL == k ? '' : k;
  document.querySelectorAll('.rp-loc-tg').forEach((b, idx) => b.classList.toggle('on', Object.keys(LOC)[idx] === ZL));
};
function syncRpTags() {
  const dev = (($('r_v') || {}).value || '').trim().toLowerCase();
  document.querySelectorAll('.rp-br-tg').forEach((btn, j) => {
    const b = String(S.tags.brand[j] || '').toLowerCase();
    btn.classList.toggle('on', !!b && dev.startsWith(b));
  });
  const pts = (($('r_f') || {}).value || '').split('،').map(s => s.trim()).filter(Boolean);
  document.querySelectorAll('.rp-fl-tg').forEach((btn, j) => btn.classList.toggle('on', pts.includes(S.tags.fault[j])));
}
function setRpWar(d, typing) {
  ZW = +d || 0; if (!typing && $('r_war')) $('r_war').value = ZW || '';
  document.querySelectorAll('.war-tg').forEach((b, k) => b.classList.toggle('on', WAR_OPTS[k] && WAR_OPTS[k][0] === ZW));
}
function rP(e, d) { const b = $('zsv').getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 120, y = (e.clientY - b.top) / b.height * 120; if (d) ZP = []; for (let i = 0; i < 9; i++) if (!ZP.includes(i) && Math.hypot(20 + 40 * (i % 3) - x, 20 + 40 * Math.floor(i / 3) - y) < 14) ZP.push(i); $('zsv').innerHTML = PI(ZP); }
function rShowIm() { const m = $('r_im'); if (!m) return; m.src = ZI; m.hidden = false; if ($('r_imx')) $('r_imx').hidden = false; }
function rImDel() { ZI = ''; const m = $('r_im'); if (m) { m.hidden = true; m.removeAttribute('src'); } if ($('r_imx')) $('r_imx').hidden = true; }
function rIM(f) { if (!f) return; const im = new Image(); im.onload = () => { const k = Math.min(1, 560 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ZI = c.toDataURL('image/jpeg', .55); rShowIm(); }; im.src = URL.createObjectURL(f); }
let CAMS = null;
function camStop() { if (CAMS) { CAMS.getTracks().forEach(t => t.stop()); CAMS = null; } const b = $('cam_box'); if (b) b.remove(); }
function rCam() {
  if ($('cam_box')) return camStop();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return $('r_i').click();
  $('r_im').insertAdjacentHTML('beforebegin', '<div id="cam_box" class="card rp-cam-box"><video id="cam_v" autoplay playsinline muted class="rp-cam-v"></video><div class="row2"><button type="button" class="btn sm f1" onclick="camSnap()">التقاط</button><button type="button" class="btn s sm" onclick="camStop()">إلغاء</button></div></div>');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
    const v = $('cam_v'); if (!v) { s.getTracks().forEach(t => t.stop()); return; } CAMS = s; v.srcObject = s;
  }).catch(e => { camStop(); toast(camErr(e), 0, 15000); $('r_i').click(); });
}
function camSnap() {
  const v = $('cam_v'); if (!v || !v.videoWidth) return toast('انتظر ظهور الصورة ثم اضغط التقاط');
  const k = Math.min(1, 560 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas'); c.width = v.videoWidth * k; c.height = v.videoHeight * k;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); ZI = c.toDataURL('image/jpeg', .55); camStop(); rShowIm();
}
HK.hide.push(camStop);
function rKc() { $('rk').innerHTML = RK.map(k => `<button type="button" class="tag ${ZK.includes(k) ? 'on' : ''}" onclick="rKt('${k}')">${k}</button>`).join(''); }
function rKt(k) { ZK = ZK.includes(k) ? ZK.filter(x => x != k) : [...ZK, k]; rKc(); }
function rH(fromName) {
  const box = $('rh'); if (!box) return;
  const telEl = $('r_t'), nameEl = $('r_n');
  let telVal = (telEl || {}).value || '', nameVal = (nameEl || {}).value || '';
  if (fromName && nameVal && !telVal && telEl) {
    const known = S.rp.find(r => r != ZR && r.name == nameVal && r.tel) || (S.debt || []).find(d => d.name == nameVal && d.tel);
    if (known) telEl.value = telVal = known.tel;
  }
  const t = rph8(telVal), m = t.length >= 8 ? S.rp.filter(r => r != ZR && rph8(r.tel) === t) : [];
  if (!fromName && t.length >= 8 && !nameVal && nameEl) {
    const cust = m[m.length - 1] || [...(S.debt || []), ...(S.used || [])].filter(x => x.tel && x.name && rph8(x.tel) === t).pop();
    if (cust && cust.name) nameEl.value = nameVal = cust.name;
  }
  const parts = [];
  if (m.length) parts.push(`<div>زبون سابق: ${m.length} مرة، آخرها ${esc(m[m.length - 1].dev)}</div>`);
  const openNow = rpOtherOpen(telVal, nameVal, ZR && ZR.id);
  if (openNow.length) parts.push(`<div class="rs">${I('bell')} تنبيه: لهذا الزبون جهاز آخر حالياً في الصيانة (${openNow.map(x => '#' + esc(x.tk || '') + ' ' + esc(x.dev)).join(' ، ')})</div>`);
  const aw = m.map(r => ({ r, w: warInfo(r) })).filter(x => x.r.st == 'dn' && x.w && x.w.active);
  if (aw.length) { const l = aw[aw.length - 1]; parts.push(`<div class="rp-ok-txt">${I('shield')} تنبيه: جهاز (${esc(l.r.dev)}) لهذا الزبون ما زال ${esc(l.w.label)}!</div>`); }
  const dbs = rpDebts(telVal, nameVal);
  if (dbs.length) {
    const sum = rpDebtSum(dbs), why = dbs.map(d => d.why).filter(Boolean).join('، ');
    parts.push(`<div class="rs">${I('alert')} تنبيه: على هذا الزبون دين مفتوح بمجموع ${sum} درهم${why ? ' (' + esc(why) + ')' : ''}!</div>`);
  }
  box.innerHTML = parts.join('');
}
function pickRpBrand(j) {
  const b = S.tags.brand[j], el = $('r_v'); if (!el) return; let cur = el.value.trim();
  const o = S.tags.brand.find(x => x && cur.toLowerCase().startsWith(String(x).toLowerCase()));
  if (o && o.toLowerCase() === b.toLowerCase()) el.value = cur.slice(o.length).trim();
  else { if (o) cur = cur.slice(o.length).trim(); el.value = b + (cur ? ' ' + cur : ' '); }
  syncRpTags(); el.focus(); checkDeviceHistory(); suggestGuidePrice();
}
function pickRpFault(j) {
  const f = S.tags.fault[j], el = $('r_f'); if (!el) return;
  let p = el.value.split('،').map(s => s.trim()).filter(Boolean); p = p.includes(f) ? p.filter(x => x !== f) : [...p, f];
  el.value = p.join('، '); syncRpTags(); suggestGuidePrice();
}
/* دقة مطابقة الموديل في دليل الأسعار (تجنب اقتراح عشوائي عند كتابة اسم الماركة فقط أو مطابقة A1 مع A15) */
function rpStripBrand(s) {
  let cur = String(s || '').trim();
  const o = S.tags.brand.find(x => x && cur.toLowerCase().startsWith(String(x).toLowerCase()));
  if (o) cur = cur.slice(o.length).trim();
  return nz(cur);
}
function suggestGuidePrice() {
  const rawDev = (($('r_v') || {}).value || '').trim(), flt = nz(($('r_f') || {}).value || ''), box = $('rp_price_hint'); if (!box) return;
  const mdl = rpStripBrand(rawDev), fullDev = nz(rawDev);
  if (mdl.length < 2) { GPM = []; box.innerHTML = ''; return; }
  GPM = S.guide.filter(g => {
    const gm = rpStripBrand(g.m) || nz(g.m), gFull = nz(g.m), gf = nz(g.f);
    const mm = (gm && gm === mdl) || gFull === fullDev;
    const fm = !flt || flt.includes(gf) || gf.includes(flt);
    return mm && fm;
  }).slice(0, 4);
  box.innerHTML = GPM.flatMap((g, j) => {
    const btns = [`<button type="button" class="tag on rp-ghint" onclick="$('r_c').value=GPM[${j}].p">${I('bulb')} ${esc(g.m)} (${esc(g.f)}): ${esc(dh(g.p))} — اضغط لوضعه</button>`];
    if (g.p2) btns.push(`<button type="button" class="tag on rp-ghint alt" onclick="$('r_c').value=GPM[${j}].p2">${I('bulb')} ${esc(g.m)} (أصلي / 2): ${esc(dh(g.p2))}</button>`);
    return btns;
  }).join('');
}
function checkDeviceHistory() {
  const rawDev = (($('r_v') || {}).value || '').trim(), box = $('rp_dev_hist'); if (!box) return;
  const mdl = rpStripBrand(rawDev);
  if (mdl.length < 2) { box.textContent = ''; return; }
  const rec = S.rp.filter(r => r != ZR && r.st == 'dn' && rpStripBrand(r.dev) === mdl && (Date.now() - (r.t2 || 0)) < 14 * 864e5);
  if (!rec.length) { box.textContent = ''; return; }
  const l = rec[rec.length - 1], days = Math.floor((Date.now() - l.t2) / 864e5);
  box.textContent = `تنبيه: جهاز مشابه (${l.dev} — ${l.name}) سُلّم منذ ${days || 'أقل من'} يوم (${l.tst ? 'جُرِّب مع الزبون' : 'بدون توثيق تجربة'})`;
}
function rSave(moreSame) {
  const n = $('r_n').value.trim(), f = $('r_f').value.trim(), v = $('r_v').value.trim(), rawTel = $('r_t').value.trim(), t = rawTel.replace(/\D/g, ''), isNew = !(ZR && ZR.id);
  if (!n || !f) return toast('الاسم والعطل مطلوبان');
  if (!v && (isNew || ZR.dev)) return toast('اكتب نوع الهاتف');
  if (rawTel && t.length < 8) return toast('رقم الهاتف قصير: اكتب 8 أرقام على الأقل أو اتركه فارغاً');
  const out = fxAtt({
    name: n, tel: rawTel, dev: v, fault: f,
    cap: $('r_c').value.trim(), dep: $('r_d').value.trim(),
    loc: ZL, part: ($('r_part') ? $('r_part').value.trim() : (ZR.part || '')),
    lock: $('r_l').value.trim(), pat: ZP, chk: ZK, img: ZI,
    note: $('r_o').value.trim(), imei: $('r_imei').value.trim(),
    war: Math.max(0, Math.floor(+$('r_war').value || 0)),
    _moreSame: moreSame ? 1 : 0
  });
  if ($('r_paid')) out.paid = dg($('r_paid').value.trim()) || '0';
  finish(out);
}
function rDone(v, r) {
  if (!v) return;
  const moreSame = v._moreSame; delete v._moreSame;
  if (r && r.id && S.rp.includes(r)) {
    return commit('تم التعديل', () => {
      if (!v.img && IMG[r.id]) delImg(r.id);
      if (v.img && v.img.startsWith('data:image')) { putImg(r.id, v.img); v.img = 'idb:' + r.id; }
      if (!r.tk) r.tk = nextTk();
      Object.assign(r, v, { lb: S.me });
    });
  }
  let tk = '';
  commit('تم الاستلام', () => {
    tk = nextTk();
    const id = uid();
    if (v.img && v.img.startsWith('data:image')) { putImg(id, v.img); v.img = 'idb:' + id; }
    S.rp.push({ id, tk, st: 'in', t0: Date.now(), by: S.me, calls: [], ...v });
  });
  if (tk) toast('تم الاستلام — رقم التذكرة: #' + tk);
  if (moreSame) setTimeout(() => { const rec2 = { name: v.name, tel: v.tel }; $('sh').innerHTML = ''; sheetOpen(x => rDone(x, rec2)); rForm(rec2); }, 380);
}
window.rpZoom = function (id) {
  const r = rf(id), src = r && rImg(r); if (!src) return;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc((r.tk ? '#' + r.tk + ' — ' : '') + r.name + ' — ' + r.dev)}</h3><img src="${src}" class="rp-zoom-im"><div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
  sheetOpen(() => { });
};
/* ---------- دليل أسعار الإصلاح (مع أزرار الماركات والأعطال السريعة) ---------- */
const gdCard = g => `<div class="card cmp"><div class="row2"><b>${esc(g.m)}</b><span class="cmp-pr">${esc(dh(g.p))}${g.p2 ? ` <span class="m">· أصلي/2:</span> ${esc(dh(g.p2))}` : ''}</span></div><div class="row2"><span class="m f1">${esc(g.f)}${g.n ? ' · ' + esc(g.n) : ''}</span>${can('price') ? `<button class="btn s sm" onclick="gdEd('${g.id}')">تعديل</button><button class="btn s sm del" onclick="gdDel('${g.id}')">حذف</button>` : ''}</div></div>`;
const gdList = (q, flt) => {
  const n = nz(q || ''), fn = nz(flt || '');
  return S.guide.filter(g => (!fn || nz(g.f).includes(fn)) && (!n || nz(g.m + ' ' + g.f + ' ' + (g.n || '')).includes(n))).sort((a, b) => a.m.localeCompare(b.m)).map(gdCard).join('') || emptyBox('لا توجد تسعيرات مطابقة', can('price') ? 'اضغط على «+ إضافة تسعيرة» في الأعلى لإضافة سعر إصلاح جديد' : '');
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
/* ---------- طلبات الزبائن («زبون سأل ولم نجد») ---------- */
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
  location.href = 'https://wa.me/' + rnum(ph) + '?text=' + encodeURIComponent(`مرحباً، بخصوص طلبك (${clean || 'السلعة المطلوبة'}) فقد توفرت لدينا في محل عزيز. مرحباً بك!`);
}
function rqCard(q) {
  const ph = rqTel(q.t);
  return `<div class="card"><div class="row2"><b class="f1">${esc(q.t)}</b></div>`
    + `<div class="m"><bdi>${fd(q.at)}</bdi>${q.by ? ' · ' + esc(q.by) : ''}${ph ? ` · هاتف: <bdi>${esc(ph)}</bdi>` : ''}</div>`
    + `<div class="sub">${ph ? `<a href="tel:${esc(ph)}" class="btn s sm rp-icb">${I('phone')} اتصال</a><button class="btn sm" onclick="rqWA('${q.id}')">${I('send')} إبلاغ واتساب</button>` : ''}<button class="btn s sm" onclick="rqEd('${q.id}')">تعديل</button><button class="btn s sm del" onclick="rqD('${q.id}')">مسح</button></div></div>`;
}
function rqList() {
  const n = nz(V.q || '');
  const L = (S.req || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0)).filter(q => !n || nz(q.t).includes(n));
  return L.map(rqCard).join('') || emptyBox('لا توجد طلبات زبائن مسجلة حالياً', 'اضغط على «+ تسجيل طلب زبون» لتدوين أي سلعة سأل عنها زبون ولم يجدها');
}
VW.req = () => ({
  t: 'طلبات الزبائن',
  h: `<button class="btn" onclick="rq()">+ تسجيل طلب زبون (سأل ولم نجد)</button>`
    + `<div class="sec-panel">`
    + `<div class="row2"><b class="f1">إجمالي الطلبات المسجلة: ${(S.req || []).length}</b><span class="m">تظهر أيضاً في التقرير اليومي</span></div>`
    + `<input class="rp-srch" placeholder="ابحث في الطلبات: موديل، سلعة، أو رقم..." value="${esc(V.q || '')}" oninput="V.q=this.value;$('rql').innerHTML=rqList()">`
    + `</div><div id="rql">${rqList()}</div>`
});
/* ---------- ربط الباركود/IMEI والأرشفة والإعدادات ---------- */
function bcNewRp() { $('sh').innerHTML = ''; const rec = { imei: BCODE }; sheetOpen(v => rDone(v, rec)); rForm(rec); }
BCX.push(() => `<button class="btn s sm" onclick="bcNewRp()">${I('tool')} + استلام صيانة</button>`);
BCM.push(c => { const nc = nz(c); return S.rp.filter(r => r.imei && nz(r.imei).includes(nc)).map(r => rc(r, true)).join(''); });
const rpOld = () => { const n = Date.now(); return S.rp.filter(r => r.st == 'dn' && r.t2 && n - r.t2 > Math.max(365, (+r.war || 0) + 30) * 864e5); };
function rpArch() {
  if (!isAdmin()) return toast('للمدير فقط');
  const a = rpOld(); if (!a.length) return toast('لا توجد صيانات مسلّمة أقدم من سنة');
  sure('حذف ' + a.length + ' صيانة مسلّمة منذ أكثر من سنة (انتهى ضمانها) من كل الأجهزة؟ يُفضّل أخذ ملف نسخة احتياطية قبل ذلك. تُحفظ نسخة تلقائية داخل الهاتف أولاً.', 'أرشفة').then(y => {
    if (!y) return;
    snapPre().then(() => { const ids = new Set(a.map(x => x.id)); S.rp = S.rp.filter(x => !ids.has(x.id)); save(); render(); toast('تمت أرشفة ' + a.length + ' صيانة'); });
  });
}
CATS.rp = ['الصيانة', [tg('أعطال الصيانة', 'fault'), ['دليل أسعار الإصلاح', "go('gd')"], ['مدة حفظ الصورة والرمز بعد التسليم', "limEd('rpKeep')", () => lim('rpKeep') + ' يوم'], ['أرشفة الصيانات المسلّمة القديمة', "rpArch()", () => rpOld().length + ' صيانة']], 'rp'];
MORE.push({ g: 'sec', o: 50, l: 'الصيانة', fn: "go('st_c',{c:'rp'})" });