/* repair.js — الصيانة (1/3): الثوابت والمساعدات، أرقام التذاكر، البطاقة ونافذة التذكرة، القائمة والفلاتر. يليه repairform.js ثم repairguide.js */
const RK = ['شاشة مكسورة', 'مطفأ لا يشتغل', 'ترك شريحة SIM', 'ترك كارت ميموري', 'معه بوشيط', 'بدون غطاء', 'البصمة لا تعمل', 'بدون SIM'];
const rpChkTags = () => (S.tags && Array.isArray(S.tags.rpchk) && S.tags.rpchk.length) ? S.tags.rpchk : RK;
const TB = { in: 'في المحل', rd: 'جاهز', nf: 'لم تُصلَّح', dn: 'الأرشيف' };
const tabOf = r => r.st == 'rd' && (r.res == 'fail' || r.res == 'ref') ? 'nf' : r.st;
const FL = [['all', 'الكل'], ['today', 'اليوم'], ['yest', 'البارحة'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['date', 'تاريخ']];
const RES = { ok: 'تم الإصلاح', fail: 'تعذّر الإصلاح', ref: 'رفض الإصلاح' };
const LOC = { m: 'عند المعلم', s: 'الرف' };
const DVO = ['— اختر —', 'جُرِّب مع الزبون وهو يعمل', 'سُلِّم بدون تجربة مع الزبون'];
const WAR_OPTS = [[0, 'بدون ضمان'], [3, '3 أيام'], [7, '7 أيام'], [15, '15 يوم'], [30, '30 يوم']];
const WAR_SEL = ['بدون ضمان (0 يوم)', '3 أيام', '7 أيام', '15 يوم', '30 يوم'];
const RP_ARCH_O = [[180, '6 أشهر'], [365, 'سنة'], [730, 'سنتان']];
let ZP = [], ZK = [], ZI = '', ZD = 0, ZR = {}, ZW = 0, ZL = '', GPM = [];
const rf = id => S.rp.find(r => r.id == id);
const rnum = t => waNum(t);
const rph8 = t => rnum(t).slice(-8);
const sn1 = x => /^\s*\d+(\.\d+)?\s*$/.test(dg(x || ''));
const d0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dh = p => sn1(p) ? dg(String(p).trim()) + ' درهم' : (p || '');
const tOf = r => r.st == 'dn' ? r.t2 : r.st == 'rd' ? (r.t1 || r.t0) : r.t0;
Object.assign(DL0, { rpKeep: 30, rpSlow: 3, rpLate: 15, rpWar: 0, rpArchD: 365 });
LM.push(
  ['rpKeep', 'الصيانة: مسح الصورة والرمز بعد التسليم بـ (أيام)'],
  ['rpSlow', 'الصيانة: يُعتبر الهاتف متأخراً في المحل بعد (أيام)'],
  ['rpLate', 'الصيانة: يُعتبر الهاتف الجاهز منسياً بعد (أيام)'],
  ['rpWar', 'الصيانة: مدة الضمان الافتراضية (أيام — 0 بدون ضمان)']
);
const isLateRp = r => r.st == 'rd' && Math.floor((Date.now() - (r.t1 || r.t0)) / 864e5) > lim('rpLate');
const isSlowRp = r => r.st == 'in' && Math.floor((Date.now() - (r.t0 || Date.now())) / 864e5) >= lim('rpSlow');
const fdS = t => {
  if (!t) return '';
  const d = new Date(t), now = new Date(), p = n => String(n).padStart(2, '0');
  const hm = `${p(d.getHours())}:${p(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `اليوم ${hm}`;
  const yr = d.getFullYear() === now.getFullYear() ? '' : `/${d.getFullYear()}`;
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}${yr} ${hm}`;
};
const rpStInfo = r => {
  if (r.st == 'in') return { txt: 'في المحل', cls: isSlowRp(r) ? 'warn' : '' };
  if (r.st == 'rd') {
    if (r.res == 'fail') return { txt: 'تعذّر الإصلاح', cls: 'bad' };
    if (r.res == 'ref') return { txt: 'رفض الإصلاح', cls: 'bad' };
    return { txt: 'جاهز للتسليم', cls: 'ok' };
  }
  if (r.res == 'fail' || r.res == 'ref') return { txt: 'سُلّم (' + RES[r.res] + ')', cls: 'bad' };
  return { txt: 'مُسلَّم', cls: 'ok' };
};
function rpParseCall(c) {
  const m = String(c || '').replace(/\u200E/g, '').match(/^(\S+)\s+(\d{2}\/\d{2})\/(\d{4})\s+(\d{2}:\d{2})\s*(.*)$/);
  if (!m) return { dt: c || '', by: '' };
  const yr = +m[3] === new Date().getFullYear() ? '' : '/' + m[3];
  return { dt: `${m[2]}${yr} ${m[4]}`, by: m[5].trim() };
}
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
FLD.rp = [['cap', 'السعر المتفق'], ['dep', 'العربون'], ['war', 'ضمان الإصلاح'], ['loc', 'مكان الهاتف (عند المعلم / الرف)'], ['need', 'خاصو قطعة غيار'], ['lock', 'PIN'], ['pat', 'نمط القفل'], ['img', 'الصورة'], ['chk', 'حالة الجهاز'], ['imei', 'IMEI'], ['note', 'الملاحظة']];
FLDN.rp = 'الصيانة';
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
function rc(r) {
  const n = Math.floor((Date.now() - r.t0) / 864e5), w = r.st == 'rd' ? Math.floor((Date.now() - (r.t1 || r.t0)) / 864e5) : 0;
  const i = r.id, im = rImg(r), wi = warInfo(r), slow = isSlowRp(r), late = w > lim('rpLate'), stB = rpStInfo(r);
  const bCls = late || (r.st == 'rd' && (r.res == 'fail' || r.res == 'ref')) ? 'rp-late' : r.st == 'rd' && r.res == 'ok' ? 'rp-ok' : slow ? 'rp-warn' : r.st == 'in' ? 'rp-in' : '';
  const oDebts = r.st != 'dn' ? rpDebts(r.tel, r.name) : [], oSum = oDebts.length ? rpDebtSum(oDebts) : 0;
  const retB = r.ret ? `<span class="rp-badge ret">راجع${r.ret > 1 ? ' ' + r.ret : ''}</span>` : '';
  const prHtml = r.cap
    ? `<div class="rp-pr-col">${prBadge(r.cap)}${r.dep ? `<small class="rp-dep">عربون ${esc(dh(r.dep))}</small>` : ''}</div>`
    : (r.st == 'in'
      ? `<div class="rp-pr-col"><span class="pr-b wait">السعر بعد الفحص</span>${r.dep ? `<small class="rp-dep">عربون ${esc(dh(r.dep))}</small>` : ''}</div>`
      : (r.dep ? `<div class="rp-pr-col"><small class="rp-dep">عربون ${esc(dh(r.dep))}</small></div>` : ''));
  const telHtml = r.tel ? `<a href="tel:${esc(r.tel)}" class="rp-tel" onclick="event.stopPropagation()"><bdi>${esc(r.tel)}</bdi>${I('phone')}</a>` : '';
  const whoName = r.st == 'dn' ? (r.dby || r.by) : (r.lb || r.by);
  let dateLabel = '';
  if (r.st == 'in') dateLabel = `استلام: <bdi class="ltr">${fdS(r.t0)}</bdi>${slow ? ` <span class="rp-warn-inline">· متأخر ${arCnt(n, 'يوم', 'يومين', 'أيام', 'يوماً')}</span>` : (n ? ` (${agoTxt(r.t0)})` : '')}`;
  else if (r.st == 'rd') dateLabel = `${r.res == 'fail' || r.res == 'ref' ? 'فُحص:' : 'جُهّز:'} <bdi class="ltr">${fdS(r.t1 || r.t0)}</bdi>${late ? ` <span class="rp-warn-inline">· منسي ${arCnt(w, 'يوم', 'يومين', 'أيام', 'يوماً')}</span>` : (w ? ` (${agoTxt(r.t1 || r.t0)})` : '')}`;
  else if (r.st == 'dn') dateLabel = `سُلّم: <bdi class="ltr">${fdS(r.t2)}</bdi> · المقبوض: <b>${esc(dh(r.paid))}</b>`;
  let callRowHtml = '';
  if (r.st == 'rd' && (r.calls || []).length) {
    const pc = rpParseCall(r.calls[r.calls.length - 1]);
    callRowHtml = `<div class="rp-meta-line"><span>آخر تواصل: <bdi class="ltr">${esc(pc.dt)}</bdi></span><span><b class="rp-warn-inline">${arCnt(r.calls.length, 'اتصال', 'اتصالان', 'اتصالات', 'اتصالاً')}</b>${pc.by ? ` · <b><bdi>${esc(pc.by)}</bdi></b>` : ''}</span></div>`;
  }
  const infoBox = `<div class="rp-meta" onclick="rpOpen('${i}')"><div class="rp-meta-line"><span>${dateLabel}</span>${whoName ? `<b><bdi>${esc(whoName)}</bdi></b>` : ''}</div>${callRowHtml}</div>`;
  let statusRow = '';
  if (r.st == 'in') {
    const locBtns = shown('rp', 'loc') ? Object.keys(LOC).map(k => `<button class="tag rp-mini ${r.loc == k ? 'on' : ''}" onclick="rLoc('${i}','${k}')">${LOC[k]}</button>`).join('') : '';
    const partBtn = shown('rp', 'need') ? (r.part ? `<button class="tag rp-mini part on" onclick="rPart('${i}')">${I('tool')} خاصو: ${esc(r.part)}</button>` : `<button class="tag rp-mini" onclick="rPart('${i}')">+ خاصو قطعة</button>`) : '';
    const lockInd = (r.lock || (r.pat || []).length > 1) ? `<button class="tag rp-mini" onclick="rpOpen('${i}')" title="عرض القفل">${I('lock')} القفل</button>` : '';
    if (locBtns || partBtn || lockInd) statusRow = `<div class="rp-tags">${locBtns}${partBtn}${lockInd}</div>`;
  } else if (r.st == 'dn') {
    const tstBadge = r.tst ? `<span class="rp-badge ok">${I('check')} جُرِّب مع الزبون</span>` : '';
    const wiBadge = wi ? `<span class="rp-badge ${wi.active ? 'ok' : ''}">${I('shield')} ${esc(wi.label)}</span>` : '';
    if (tstBadge || wiBadge) statusRow = `<div class="rp-tags">${tstBadge}${wiBadge}</div>`;
  }
  const moreBtn2 = `<button class="btn s sm rp-icb" onclick="rpOpen('${i}')" title="تفاصيل وخيارات">⋯</button>`;
  const actsRow = r.st == 'in'
    ? `<div class="sub"><button class="btn sm" onclick="rSt('${i}','ok')">${I('check')} مصلوح</button><button class="btn s sm" onclick="rSt('${i}','fail')">غير مصلوح</button><button class="btn s sm" onclick="rSt('${i}','ref')">رفض</button>${moreBtn2}</div>`
    : r.st == 'rd'
      ? `<div class="sub"><button class="btn sm" onclick="rDV('${i}')">${I('check')} تسليم</button><button class="btn s sm rp-wa-btn" onclick="rWA('${i}')">${I('chat')} واتساب</button><button class="btn s sm" onclick="rCL('${i}')">اتصلت</button>${moreBtn2}</div>`
      : `<div class="sub"><button class="btn s sm" onclick="rRet('${i}')">${I('undo')} إرجاع للصيانة</button><button class="btn s sm" onclick="rpOpen('${i}')">${can('rpDone') ? 'تفاصيل وتعديل' : 'عرض التفاصيل'}</button></div>`;
  return `<div class="card cmp ${bCls}">`
    + `<div class="rp-head" onclick="rpOpen('${i}')"><div class="rp-who">${r.tk ? `<span class="tk-b ${stB.cls}">#${esc(r.tk)}</span>` : ''}<span class="rp-nm">${esc(r.name)}</span><span class="rp-st-txt ${stB.cls}">· ${esc(stB.txt)}</span>${retB}</div>${prHtml}</div>`
    + `<div class="rp-body">${im ? `<img class="rp-th" onclick="event.stopPropagation();rpZoom('${i}')" src="${im}">` : ''}<div class="rp-dev" onclick="rpOpen('${i}')"><bdi>${esc(r.dev || 'هاتف')}</bdi> <span>— ${esc(r.fault)}</span></div>${telHtml}</div>`
    + infoBox + statusRow
    + (r.note ? `<div class="rnote" onclick="rNote('${i}')" title="اضغط لتعديل الملاحظة">${I('chat')}<span>${esc(r.note)}</span></div>` : '')
    + (r.st == 'dn' && r.dnote ? `<div class="m">ملاحظة التسليم: ${esc(r.dnote)}</div>` : '')
    + (typeof dbtRp == 'function' ? dbtRp(r) : '')
    + (oSum > 0 ? `<div class="rs rp-click" onclick="go('dbt')">${I('alert')} تنبيه: على هذا الزبون دين مفتوح (${oSum} درهم)</div>` : '')
    + actsRow + `</div>`;
}
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
  const calls = (r.calls || []).slice().reverse(), stB = rpStInfo(r), canEd = r.st != 'dn' || can('rpDone');
  const secDateBox = r.st == 'dn' && r.t2
    ? `<div class="rp-date-box"><small>تاريخ التسليم${r.dby ? ' (' + esc(r.dby) + ')' : ''}</small><b><bdi class="ltr">${fdDate(r.t2)}</bdi></b><span><bdi class="ltr">${fdTime(r.t2)}</bdi></span></div>`
    : (r.t1
      ? `<div class="rp-date-box"><small>تاريخ الجاهزية${r.lb ? ' (' + esc(r.lb) + ')' : ''}</small><b><bdi class="ltr">${fdDate(r.t1)}</bdi></b><span><bdi class="ltr">${fdTime(r.t1)}</bdi></span></div>`
      : `<div class="rp-date-box"><small>الحالة الحالية</small><b>${esc(LOC[r.loc] || 'قيد الفحص والإصلاح')}</b></div>`);
  const priBar = r.st == 'rd'
    ? `<div class="pair-grid"><button class="btn" onclick="rpGo('rDV','${r.id}')">${I('check')} تسليم الهاتف للزبون</button><button class="btn s rp-wa-btn" onclick="rpGo('rWA','${r.id}')">${I('chat')} إشعار واتساب</button></div>`
    : (r.st == 'in'
      ? `<div class="pair-grid"><button class="btn" onclick="rpGo('rSt','${r.id}','ok')">${I('check')} جاهز (مصلوح)</button><button class="btn s" onclick="rpGo('rSt','${r.id}','fail')">غير مصلوح</button></div>`
      : '');
  $('sh').innerHTML = `<div class="bar"></div>`
    + `<div class="rp-sh-hd"><div class="rp-who">${r.tk ? `<span class="tk-b ${stB.cls}">#${esc(r.tk)}</span>` : ''}<h3>${esc(r.name)}</h3><span class="rp-st-txt ${stB.cls}">· ${esc(stB.txt)}</span></div><button type="button" class="rp-xbtn" onclick="finish(null)" aria-label="إغلاق">${I('close')}</button></div>`
    + `<div class="card rp-sum-box">`
    + `<div class="ph-top"><b class="ph-nm"><bdi>${esc(r.dev || 'هاتف')}</bdi></b>${prBadge(r.cap, '<span class="pr-b wait">السعر بعد الفحص</span>')}</div>`
    + `<div class="m" style="margin-top:3px;font-weight:600;color:var(--t)">العطل: ${esc(r.fault)}</div>`
    + `<div class="rp-tel-bar"><span>هاتف الزبون:</span>${r.tel ? `<a href="tel:${esc(r.tel)}" class="rp-tel"><bdi>${esc(r.tel)}</bdi>${I('phone')}</a>` : '<b>بدون رقم مسجل</b>'}</div>`
    + `<div class="rp-dates-grid"><div class="rp-date-box"><small>تاريخ الاستلام${r.by ? ' (' + esc(r.by) + ')' : ''}</small><b><bdi class="ltr">${fdDate(r.t0)}</bdi></b><span><bdi class="ltr">${fdTime(r.t0)}</bdi></span></div>${secDateBox}</div>`
    + (r.dep ? `<div class="m" style="margin-top:6px">العربون المقبوض: <b>${esc(dh(r.dep))}</b>${sn1(r.cap) && sn1(r.dep) ? ` · المتبقي: <b>${Math.max(0, +dg(r.cap) - +dg(r.dep))} درهم</b>` : ''}</div>` : '')
    + (r.st == 'dn' ? `<div class="m" style="margin-top:4px">المبلغ المقبوض عند التسليم: <b>${esc(dh(r.paid))}</b></div>` : '')
    + ((r.chk || []).length ? `<div class="m" style="margin-top:4px">حالة الاستلام / الأمانات: <b>${esc(r.chk.join('، '))}</b></div>` : '')
    + (r.part ? `<div class="rs" style="margin-top:4px">خاصو قطعة غيار: ${esc(r.part)}</div>` : '')
    + (wi ? `<div class="m" style="margin-top:4px"><b>${I('shield')} ${esc(wi.label)}</b></div>` : '')
    + (r.imei ? `<div class="m" style="margin-top:4px">IMEI: <bdi class="ltr">${esc(r.imei)}</bdi></div>` : '')
    + fxShow(r)
    + (r.note ? `<div class="rnote" onclick="rpGo('rNote','${r.id}')">${I('chat')}<span>${esc(r.note)}</span></div>` : '')
    + (r.dnote ? `<div class="m" style="margin-top:4px">ملاحظة التسليم: ${esc(r.dnote)}</div>` : '')
    + `</div>`
    + ((r.lock || (r.pat || []).length > 1) ? `<div class="card row2"><div class="f1"><b>بيانات فتح القفل</b>${r.lock ? `<div class="m">رمز القفل (PIN): <b><bdi class="ltr">${esc(r.lock)}</bdi></b></div>` : '<div class="m">بدون رمز PIN</div>'}</div>${(r.pat || []).length > 1 ? `<svg viewBox="0 0 120 120" width="76" class="rp-pat-svg">${PI(r.pat)}</svg>` : ''}</div>` : '')
    + (im ? `<img onclick="rpGo('rpZoom','${r.id}')" src="${im}" class="rp-sheet-im">` : '')
    + (others.length ? `<div class="card rp-warn"><b>${I('alert')} لهذا الزبون جهاز آخر في الصيانة:</b>${others.map(x => `<div class="m">#${esc(x.tk || '')} — ${esc(x.dev)} (${esc(TB[tabOf(x)])})</div>`).join('')}</div>` : '')
    + (oDebts.length ? `<div class="card rp-late"><b>${I('wallet')} على هذا الزبون دين مفتوح: ${rpDebtSum(oDebts)} درهم</b></div>` : '')
    + (calls.length ? `<div class="card"><b>سجل التواصل (${calls.length})</b>${calls.slice(0, 6).map(c => `<div class="m">• <bdi>${esc(c)}</bdi></div>`).join('')}</div>` : '')
    + priBar
    + `<div class="cs-acts">`
    + (canEd ? `<button class="btn s" onclick="rpGo('rEd','${r.id}')">${I('edit')} تعديل التذكرة</button>` : '')
    + (canEd ? `<button class="btn s" onclick="rpGo('rNote','${r.id}')">${I('plus')} ${r.note ? 'تعديل الملاحظة' : 'ملاحظة سريعة'}</button>` : '')
    + (r.st == 'in' && shown('rp', 'need') ? `<button class="btn s" onclick="rpGo('rPart','${r.id}')">${I('tool')} ${r.part ? 'القطعة المطلوبة' : 'خاصو قطعة'}</button>` : '')
    + (r.st == 'in' ? `<button class="btn s" onclick="rpGo('rCL','${r.id}')">${I('phone')} سجّل اتصالاً</button>` : '')
    + (r.st == 'rd' ? `<button class="btn s" onclick="rpGo('rSt','${r.id}','in')">${I('undo')} إرجاع «في المحل»</button>` : '')
    + (r.st == 'dn' ? `<button class="btn s" onclick="rpGo('rRet','${r.id}')">${I('undo')} إرجاع للصيانة</button>` : '')
    + (rpCanSaveGuide(r) ? `<button class="btn s" onclick="rpGo('rpSaveToGuide','${r.id}')">${I('bookmark')} حفظ السعر بالدليل</button>` : '')
    + `</div>`
    + `<div class="acts">${can('del') ? `<button class="btn s del" onclick="rpGo('rDel','${r.id}')">${I('trash')} حذف التذكرة</button>` : ''}<button class="btn s" onclick="finish(null)">إغلاق النافذة</button></div>`;
}
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
  return banner + ((vis.map(r => rc(r)).join('') + moreBtnHtml) || emptyBox('لا توجد هواتف صيانة في هذا الفلتر', 'اضغط على «+ استلام هاتف» في الأعلى لتسجيل جهاز جديد'));
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
      + (mCnt || sf == 'm' ? `<button class="tag ${sf == 'm' ? 'on' : ''}" onclick="V.sf=V.sf=='m'?'':'m';render()">عند المعلم (${mCnt})</button>` : '')
      + (sCnt || sf == 's' ? `<button class="tag ${sf == 's' ? 'on' : ''}" onclick="V.sf=V.sf=='s'?'':'s';render()">في الرف (${sCnt})</button>` : '')
      + (pCnt || sf == 'part' ? `<button class="tag ${sf == 'part' ? 'on' : ''}" onclick="V.sf=V.sf=='part'?'':'part';render()">${I('tool')} خاصو قطعة (${pCnt})</button>` : '')
      + (wCnt || sf == 'slow' ? `<button class="tag ${sf == 'slow' ? 'on' : ''}" onclick="V.sf=V.sf=='slow'?'':'slow';render()">${I('alert')} متأخر +${lim('rpSlow')} أيام (${wCnt})</button>` : '')
      + `</div>`;
  }
  if (tab == 'rd' || tab == 'nf') {
    const lateCnt = S.rp.filter(r => tabOf(r) == tab && isLateRp(r)).length;
    if (!lateCnt && sf != 'late') return '';
    return `<div class="sec-tags rp-sub-tags"><button class="tag ${sf == 'late' ? 'on' : ''}" onclick="V.sf=V.sf=='late'?'':'late';render()">${I('alert')} منسي +${lim('rpLate')} يوم (${lateCnt})</button></div>`;
  }
  if (tab == 'dn') {
    const warCnt = S.rp.filter(r => r.st == 'dn' && (warInfo(r) || {}).active).length;
    if (!warCnt && sf != 'war') return '';
    return `<div class="sec-tags rp-sub-tags"><button class="tag ${sf == 'war' ? 'on' : ''}" onclick="V.sf=V.sf=='war'?'':'war';render()">${I('shield')} تحت الضمان (${warCnt})</button></div>`;
  }
  return '';
}
VW.rp = () => {
  const tab = V.tab || 'in';
  return {
    t: 'الصيانة',
    h: `<div class="pair-grid"><button class="btn" onclick="rEd(null)">${I('plus')} استلام هاتف</button><button class="btn s" onclick="go('gd')">${I('bookmark')} دليل الأسعار</button></div>`
      + `<div class="sec-panel">`
      + `<div class="rp-tabs-grid">`
      + Object.keys(TB).map(k => {
        const cnt = S.rp.filter(r => tabOf(r) == k).length, on = !V.all && tab == k;
        return `<button class="tag rp-tab-btn ${on ? 'on' : ''}" onclick="V.all=0;V.tab='${k}';V.sf='';V.rlim=40;render()"><span>${TB[k]}</span><b>${cnt}</b></button>`;
      }).join('')
      + `</div>`
      + rpSubFiltersHtml(tab)
      + `<div class="rp-filter-row"><input placeholder="ابحث: تذكرة (#A104)، اسم، هاتف، جهاز..." value="${esc(V.q)}" oninput="V.q=this.value;V.rlim=40;rpL()"><select aria-label="التاريخ" onchange="V.d=this.value;V.rlim=40;render()">${FL.map(([k, l]) => `<option value="${k}" ${(V.d || 'all') == k ? 'selected' : ''}>${k == 'all' ? 'كل التواريخ' : l}</option>`).join('')}</select></div>`
      + `${V.d == 'date' ? `<input type="date" class="rp-dt-inp" value="${V.dt || ''}" onchange="V.dt=this.value;render()">` : ''}`
      + `</div><div id="rl">${rpList()}</div>`
  };
};
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
  if (r.st == 'dn' && !can('rpDone')) return toast('تعديل الصيانة المسلّمة للمدير فقط');
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
