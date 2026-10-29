/* ============================================================
   repair.js — الصيانة: الاستلام والتسليم، الضمان، IMEI، الصور،
   واتساب، دليل أسعار الإصلاح، وطلبات الزبائن.
   يُحمَّل بعد inventory.js وقبل app.js.
   ============================================================ */

/* ---------- ثوابت ومساعدات ---------- */
const RK = ['شاشة مكسورة', 'بدون SIM', 'مطفأ لا يشتغل', 'البصمة لا تعمل', 'بدون غطاء'];
const TB = { in: 'في المحل', rd: 'جاهز', dn: 'الأرشيف' };
const FL = [['all', 'الكل'], ['today', 'اليوم'], ['yest', 'البارحة'], ['week', 'هذا الأسبوع'], ['month', 'هذا الشهر'], ['date', 'تاريخ']];
const RES = { ok: 'تم الإصلاح', fail: 'تعذّر الإصلاح', ref: 'رفض الإصلاح' };
const DVO = ['— اختر —', 'جُرِّب مع الزبون وهو يعمل', 'سُلِّم بدون تجربة مع الزبون'];
const WAR_OPTS = [[0, 'بدون ضمان'], [3, '3 أيام'], [7, '7 أيام'], [15, '15 يوم'], [30, '30 يوم']];
const WAR_SEL = ['بدون ضمان (0 يوم)', '3 أيام', '7 أيام', '15 يوم', '30 يوم'];
let ZP = [], ZK = [], ZI = '', ZD = 0, ZR = {}, ZW = 0, GPM = [];
const rf = id => S.rp.find(r => r.id == id);
const rnum = t => { t = String(t || '').replace(/\D/g, ''); return t[0] == '0' ? '212' + t.slice(1) : t; };
const sn1 = x => /^\s*\d+(\.\d+)?\s*$/.test(x || '');
const d0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dh = p => sn1(p) ? String(p).trim() + ' درهم' : (p || '');
const tOf = r => r.st == 'dn' ? r.t2 : r.st == 'rd' ? (r.t1 || r.t0) : r.t0;
const inR = t => {
  const f = V.d || 'all', n = d0(Date.now()); if (f == 'all') return 1; if (!t) return 0;
  if (f == 'today') return d0(t) == n; if (f == 'yest') return d0(t) == n - 864e5;
  if (f == 'week') return d0(t) >= n - ((new Date().getDay() + 6) % 7) * 864e5;
  if (f == 'month') { const a = new Date(t), b = new Date(); return a.getMonth() == b.getMonth() && a.getFullYear() == b.getFullYear(); }
  return !V.dt || new Date(t).toLocaleDateString('en-CA') == V.dt;
};
const PI = s => { const p = i => [20 + 40 * (i % 3), 20 + 40 * Math.floor(i / 3)]; return (s.length > 1 ? `<polyline fill="none" stroke="#3b82f6" stroke-width="4" points="${s.map(i => p(i).join(',')).join(' ')}"/>` : '') + [...Array(9).keys()].map(i => `<circle cx="${p(i)[0]}" cy="${p(i)[1]}" r="${s.includes(i) ? 7 : 5}" fill="${s[0] == i ? '#22c55e' : s.includes(i) ? '#3b82f6' : '#94a3b8'}"/>`).join(''); };
/* الصورة الحقيقية: في الذاكرة قد تكون data: أو مرجعاً idb: يُحمَّل من الخزنة */
const rImg = r => r.img && r.img.startsWith('data:') ? r.img : (IMG[r.id] || '');
const rpText = r => r.name + r.tel + r.dev + r.fault + r.note + ' ' + fxTxt(r) + ' ' + (r.imei || '');
Object.assign(DL0, { rpKeep: 30 });
LM.push(['rpKeep', 'الصيانة: مسح الصورة والرمز بعد التسليم بـ (أيام)']);
FLD.rp = [['cap', 'السعر المتفق'], ['dep', 'العربون'], ['war', 'ضمان الإصلاح'], ['part', 'ينتظر قطعة'], ['lock', 'PIN'], ['pat', 'نمط القفل'], ['img', 'الصورة'], ['chk', 'حالة الجهاز'], ['imei', 'IMEI'], ['note', 'الملاحظة']];
FLDN.rp = 'الصيانة';

/* ---------- الضمان ---------- */
function warInfo(r) {
  const w = +r.war || 0; if (!w || r.res == 'fail' || r.res == 'ref') return null;
  if (r.st != 'dn' || !r.t2) return { active: true, daysLeft: w, label: `الضمان المقرر: ${w} يوم` };
  const end = r.t2 + w * 864e5, rem = Math.ceil((end - Date.now()) / 864e5), endStr = new Date(end).toLocaleDateString('ar-MA');
  return rem > 0 ? { active: true, daysLeft: rem, label: `تحت الضمان: باقي ${rem} يوم (لغاية ${endStr})` } : { active: false, daysLeft: 0, label: `انتهى الضمان (${w} يوم — انتهى ${endStr})` };
}
const warToLbl = d => { d = +d || 0; if (!d) return WAR_SEL[0]; const f = WAR_OPTS.find(x => x[0] === d); return f ? f[1] : d + ' يوم'; };
const lblToWar = s => { const m = String(s || '').match(/\d+/); return m ? +m[0] : 0; };

/* ---------- تنظيف الصور والرموز بعد التسليم (يراعي مدة الضمان) ---------- */
function cleanOldRpMedia() {
  const now = Date.now(), base = lim('rpKeep') * 864e5; let chg = 0;
  S.rp.forEach(r => {
    if (r.st != 'dn' || !r.t2) return;
    if (now - r.t2 > Math.max(base, ((+r.war || 0) + 3) * 864e5) && (r.img || r.lock || (r.pat && r.pat.length))) {
      r.img = ''; r.lock = ''; r.pat = []; MEDIA.del(r.id).catch(e => errLog('حذف صورة قديمة: ' + (e && e.message || e))); delete IMG[r.id]; chg = 1;
    }
  });
  if (chg) save();
}
cleanOldRpMedia();

/* ---------- بطاقة الصيانة ---------- */
function rc(r) {
  const n = Math.floor((Date.now() - r.t0) / 864e5), w = r.st == 'rd' ? Math.floor((Date.now() - (r.t1 || r.t0)) / 864e5) : 0, i = r.id, im = rImg(r), wi = warInfo(r);
  const B = (t, f, p) => `<button class="btn ${p ? '' : 's'} sm" onclick="${f}">${t}</button>`;
  return `<div class="card"><div class="row2">${im ? `<img onclick="rpZoom('${i}')" src="${im}" style="cursor:pointer;width:56px;height:56px;object-fit:cover;border-radius:10px">` : ''}<div style="flex:1"><b>${esc(r.name)}</b><div class="m">${esc(r.dev)} — ${esc(r.fault)}</div></div>${(r.pat || []).length > 1 ? `<svg viewBox="0 0 120 120" width="52">${PI(r.pat)}</svg>` : ''}</div>`
    + `<div class="m"><a href="tel:${esc(r.tel)}">${esc(r.tel)}</a></div><div class="m">استلام: <bdi>${fd(r.t0)}</bdi> · ${esc(r.by)}${n && r.st != 'dn' ? ' · منذ ' + n + ' يوم' : ''}</div>`
    + (r.st == 'dn' ? `<div class="m">تسليم: <bdi>${fd(r.t2)}</bdi> · ${esc(r.dby || '')}</div>` : '') + (r.cap ? `<div class="m">السعر المتفق: ${esc(r.cap)}</div>` : '') + (r.dep ? `<div class="m">العربون: ${esc(r.dep)}</div>` : '') + (r.st == 'dn' ? `<div class="m">المقبوض: ${esc(r.paid)}</div>` : '')
    + (r.part ? `<div class="rs">ينتظر قطعة: ${esc(r.part)}</div>` : '') + ((r.chk || []).length ? `<div class="m">${esc(r.chk.join('، '))}</div>` : '') + (r.lock ? `<div class="m">PIN: ${esc(r.lock)}</div>` : '') + (w > 15 ? `<div class="rs">منسي منذ ${w} يوم</div>` : '')
    + ((r.calls || []).length ? `<div class="m">اتصالات: ${r.calls.length}</div>` : '') + (r.st != 'in' && r.res ? `<div class="m">${RES[r.res]}</div>` : '') + (r.note ? `<div class="m">${esc(r.note)}</div>` : '')
    + fxShow(r) + (r.imei ? `<div class="m">IMEI: <bdi>${esc(r.imei)}</bdi></div>` : '') + (wi ? `<div class="m" style="color:${wi.active ? '#16a34a' : '#64748b'};font-weight:700">${I('shield')} ${esc(wi.label)}</div>` : '')
    + (r.st == 'dn' ? (r.tst ? `<div class="m" style="color:#16a34a;font-weight:700">${I('check')} جُرِّب مع الزبون وسُلِّم مصلوحاً (${esc(r.dby || '')})</div>` : (r.res == 'ok' ? '<div class="m">سُلِّم بدون توثيق التجربة</div>' : '')) + (r.dnote ? `<div class="m">ملاحظة التسليم: ${esc(r.dnote)}</div>` : '') : '')
    + `<div class="sub">${r.tel ? `<a href="tel:${esc(r.tel)}" class="btn s sm" style="text-decoration:none;display:inline-flex;align-items:center">${I('phone')} اتصال</a>` : ''}`
    + (r.st == 'in' ? B('تم الإصلاح', `rSt('${i}','ok')`, 1) + B('تعذّر', `rSt('${i}','fail')`) + B('رفض', `rSt('${i}','ref')`)
      : r.st == 'rd' ? B('إبلاغ واتساب', `rWA('${i}')`, 1) + B('اتصلت', `rCL('${i}')`) + B('تسليم', `rDV('${i}')`, 1) + B('إرجاع للمحل', `rSt('${i}','in')`) : '')
    + B('تعديل', `rEd('${i}')`) + B('حذف', `rDel('${i}')`) + `</div></div>`;
}
function rpList() {
  const q = nz(V.q || ''), tab = V.tab || 'in', all = V.all && q;
  const a = S.rp.filter(r => (all || r.st == tab) && inR(tOf(r)) && (!q || nzOf(r, rpText).includes(q))).sort((x, y) => tOf(y) - tOf(x));
  return a.map(rc).join('') || '<p class="m">لا شيء</p>';
}
const rpL = () => { $('rl').innerHTML = rpList(); };
VW.rp = () => {
  const tab = V.tab || 'in';
  return {
    t: 'الصيانة',
    h: `<button class="btn" onclick="rEd(null)">+ استلام هاتف</button><button class="btn s" onclick="go('gd')">دليل أسعار الإصلاح</button><div>${Object.keys(TB).map(k => `<button class="tag ${tab == k ? 'on' : ''}" onclick="V.tab='${k}';render()">${TB[k]} (${S.rp.filter(r => r.st == k).length})</button>`).join('')}</div>`
      + `<input placeholder="ابحث: اسم، رقم، جهاز، عطل" value="${esc(V.q)}" oninput="V.q=this.value;rpL()"><div>${FL.map(([k, l]) => `<button class="tag ${(V.d || 'all') == k ? 'on' : ''}" onclick="V.d='${k}';render()">${l}</button>`).join('')}<button class="tag ${V.all ? 'on' : ''}" onclick="V.all=!V.all;render()">كل التبويبات</button></div>`
      + `${V.d == 'date' ? `<input type="date" value="${V.dt || ''}" onchange="V.dt=this.value;render()">` : ''}<div id="rl">${rpList()}</div>`
  };
};

/* ---------- تغيير الحالة، الاتصال، الحذف ---------- */
function rSt(id, x) { const r = rf(id); commit('تم التحديث', () => { if (x == 'in') { r.st = 'in'; r.res = ''; } else { r.st = 'rd'; r.res = x; r.t1 = Date.now(); } r.lb = S.me; }); }
function rCL(id) { const r = rf(id); commit('تم تسجيل الاتصال', () => (r.calls = r.calls || []).push(fd(Date.now()) + ' ' + S.me)); }
function rDel(id) { const r = rf(id); del('rp', id, r.name + ' — ' + r.dev); }

/* التسليم: تجربة مع الزبون (إجبارية عند الإصلاح) + المتبقي بعد العربون + مدة الضمان */
function rDV(id, pre) {
  const r = rf(id), pr = pre || {}, cap = sn1(r.cap) ? +r.cap : null, dep = sn1(r.dep) ? +r.dep : 0;
  const def = (r.res == 'ok' && cap !== null) ? String(Math.max(0, cap - dep)) : '';
  const lbl = def ? (dep ? 'المتبقي ' + def + ' (السعر ' + cap + ' − العربون ' + dep + ') — هل هو المقبوض الآن؟ عدّله إن اختلف' : 'هل المبلغ المقبوض هو ' + def + ' ؟ عدّله إن اختلف')
    : (dep ? 'المبلغ المقبوض الآن (العربون ' + r.dep + ' مقبوض سابقاً — اكتب 0 إن لم يُقبض شيء)' : 'المبلغ المقبوض (0 إن لم يُقبض شيء)');
  const F = [{ k: 'p', l: lbl, t: 'tel', v: pr.p ?? def }];
  if (r.res == 'ok') {
    const cur = warToLbl(pr.war ?? r.war ?? 0), wo = WAR_SEL.includes(cur) ? WAR_SEL : [cur, ...WAR_SEL];
    F.unshift({ k: 'tested', l: (pr.err ? 'مطلوب، اختر أحد الخيارين: ' : '') + 'تجربة الإصلاح مع الزبون قبل التسليم (إجباري)', t: 'sel', o: DVO, v: pr.tested || DVO[0] }, { k: 'war', l: 'مدة ضمان الإصلاح (يبدأ اليوم)', t: 'sel', o: wo, v: cur });
  }
  F.push({ k: 'dnote', l: 'ملاحظة عند التسليم (اختياري)', v: pr.dnote ?? (r.dnote || '') });
  return ask('تسليم الهاتف: ' + r.name, F, 'تأكيد التسليم').then(v => {
    if (!v) return;
    const again = e => rDV(id, { p: v.p, dnote: v.dnote, tested: v.tested, war: lblToWar(v.war), err: e });
    if (r.res == 'ok' && v.tested == DVO[0]) return again(1);
    if (v.p.trim() !== '' && !sn1(v.p)) { toast('اكتب المبلغ رقماً فقط (مثال 100)'); return again(0); }
    commit('تم التسليم', () => { r.st = 'dn'; r.t2 = Date.now(); r.dby = S.me; r.paid = v.p.trim() || '0'; r.tst = v.tested == DVO[1] ? Date.now() : 0; if (r.res == 'ok') r.war = lblToWar(v.war); r.dnote = (v.dnote || '').trim(); });
  });
}
/* واتساب: إبلاغ الزبون بجاهزية الهاتف فقط (مع IMEI والضمان) */
function rWA(id) {
  const r = rf(id); if (!r || !rnum(r.tel)) return toast('لا يوجد رقم لهذا الزبون: عدّل السجل وأضف الرقم');
  const c = sn1(r.cap) ? ' تكلفة الإصلاح: ' + r.cap.trim() + (r.dep ? '، العربون: ' + r.dep : '') + '.' : '';
  const dev = r.dev + (r.imei ? ` [IMEI: ${r.imei}]` : '') + ((+r.war > 0 && r.res == 'ok') ? ` (الضمان: ${r.war} يوم)` : '');
  const s = r.res == 'ok' ? `هاتفك ${dev} جاهز في المحل.${c}` : r.res == 'fail' ? `للأسف تعذّر إصلاح هاتفك ${dev}. يمكنك استلامه من المحل.` : `هاتفك ${dev} جاهز للاستلام بدون إصلاح.`;
  location.href = 'https://wa.me/' + rnum(r.tel) + '?text=' + encodeURIComponent(`مرحباً ${r.name}، ${s}\n— محل عزيز`);
}

function rEd(id) { const rec = id ? rf(id) : {}; $('sh').innerHTML = ''; sheetOpen(v => rDone(v, rec)); rForm(rec); }
function rForm(rec) {
  ZR = rec; ZP = [...(rec.pat || [])]; ZK = [...(rec.chk || [])]; ZI = rec.img || ''; ZW = +(rec.war ?? 0);
  fsInit([], {}, 'rp', rec);
  const f = (k, l, v, t, o) => `<label${hh('rp', { c: 'cap', d: 'dep', p: 'part', l: 'lock', o: 'note' }[k] || '')}>${l}<input id="r_${k}" ${t ? `type="${t}"` : ''} ${o || ''} value="${esc(v || '')}"></label>`;
  const shownImg = ZI.startsWith('data:') ? ZI : (rec.id && IMG[rec.id]) || '';
  $('sh').innerHTML = `<div class="bar"></div><h3>${rec.id ? 'تعديل' : 'استلام هاتف'}</h3>${f('n', 'اسم الزبون', rec.name)}${f('t', 'رقم الهاتف', rec.tel, 'tel', 'oninput="rH()"')}<div id="rh" class="m"></div>`
    + `<div style="margin-bottom:6px">${S.tags.brand.map((b, j) => `<button type="button" class="tag" onclick="pickRpBrand(${j})">${esc(b)}</button>`).join('')}</div>${f('v', 'نوع الهاتف', rec.dev, '', 'oninput="checkDeviceHistory();suggestGuidePrice()"')}<div id="rp_dev_hist" class="m" style="color:#d97706;font-weight:700"></div>`
    + `<label${hh('rp', 'imei')}>IMEI / الرقم التسلسلي (اختياري)<div class="row2" style="margin-top:4px"><input id="r_imei" value="${esc(rec.imei || '')}" placeholder="امسح باركود العلبة أو *#06#" style="flex:1"><button type="button" class="btn s sm" onclick="scanIntoInput('r_imei')">${I('scan')} مسح</button></div></label>`
    + `<div style="margin-bottom:6px">${S.tags.fault.map((x, j) => `<button type="button" class="tag" onclick="pickRpFault(${j})">${esc(x)}</button>`).join('')}</div>${f('f', 'العطل (المشكل)', rec.fault, '', 'oninput="suggestGuidePrice()"')}`
    + `<div${hh('rp', 'chk')}><label>حالة الجهاز عند الاستلام</label><div id="rk"></div></div>${f('c', 'السعر المتفق (رقم، أو: اتصل، أو من 100 إلى 150)', rec.cap)}<div id="rp_price_hint" style="margin-top:4px"></div>${f('d', 'العربون', rec.dep, 'tel')}`
    + `<label${hh('rp', 'war')}>ضمان الإصلاح (يبدأ من تاريخ التسليم)<div style="margin:4px 0">${WAR_OPTS.map(([d, l]) => `<button type="button" class="tag war-tg ${ZW === d ? 'on' : ''}" onclick="setRpWar(${d})">${l}</button>`).join('')}</div><input id="r_war" type="tel" value="${ZW || ''}" placeholder="أو اكتب عدد أيام الضمان (0 = بدون ضمان)" oninput="setRpWar(+this.value||0,1)"></label>`
    + `${f('p', 'ينتظر قطعة (اختياري)', rec.part)}${f('l', 'رمز PIN (إن وجد)', rec.lock)}`
    + `<div${hh('rp', 'pat')}><label>نمط القفل (ارسمه بإصبعك)</label><svg id="zsv" viewBox="0 0 120 120" width="150" style="touch-action:none;background:var(--bg);border-radius:12px" onpointerdown="ZD=1;rP(event,1)" onpointermove="if(ZD)rP(event)" onpointerup="ZD=0" onpointercancel="ZD=0">${PI(ZP)}</svg> <button class="btn s sm" onclick="ZP=[];$('zsv').innerHTML=PI(ZP)">مسح</button></div>`
    + `<div${hh('rp', 'img')}><label>صورة<input id="r_i" type="file" accept="image/*" onchange="rIM(this.files[0])"></label><img id="r_im" ${shownImg ? `src="${shownImg}"` : 'hidden'} style="width:100%;border-radius:10px"></div>`
    + `<div id="fx"></div>${f('o', 'ملاحظة', '', '', '').replace(/<input id="r_o"[^>]*>/, `<textarea id="r_o">${esc(rec.note || '')}</textarea>`)}<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="rSave()">حفظ</button></div>`;
  rKc(); rH(); fxR(); checkDeviceHistory(); suggestGuidePrice();
}
function setRpWar(d, typing) {
  ZW = +d || 0; if (!typing && $('r_war')) $('r_war').value = ZW || '';
  document.querySelectorAll('.war-tg').forEach((b, k) => b.classList.toggle('on', WAR_OPTS[k] && WAR_OPTS[k][0] === ZW));
}
function rP(e, d) { const b = $('zsv').getBoundingClientRect(), x = (e.clientX - b.left) / b.width * 120, y = (e.clientY - b.top) / b.height * 120; if (d) ZP = []; for (let i = 0; i < 9; i++) if (!ZP.includes(i) && Math.hypot(20 + 40 * (i % 3) - x, 20 + 40 * Math.floor(i / 3) - y) < 14) ZP.push(i); $('zsv').innerHTML = PI(ZP); }
function rIM(f) { if (!f) return; const im = new Image(); im.onload = () => { const k = Math.min(1, 560 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ZI = c.toDataURL('image/jpeg', .55); $('r_im').src = ZI; $('r_im').hidden = false; }; im.src = URL.createObjectURL(f); }
function rKc() { $('rk').innerHTML = RK.map(k => `<button class="tag ${ZK.includes(k) ? 'on' : ''}" onclick="rKt('${k}')">${k}</button>`).join(''); }
function rKt(k) { ZK = ZK.includes(k) ? ZK.filter(x => x != k) : [...ZK, k]; rKc(); }
function rH() {   // زبون سابق + تنبيه ضمان ساري
  const t = $('r_t').value.replace(/\D/g, ''), m = t.length > 5 ? S.rp.filter(r => r != ZR && String(r.tel).replace(/\D/g, '') == t) : [];
  $('rh').textContent = m.length ? `زبون سابق: ${m.length} مرة، آخرها ${m[m.length - 1].dev}` : '';
  const aw = m.map(r => ({ r, w: warInfo(r) })).filter(x => x.r.st == 'dn' && x.w && x.w.active);
  if (aw.length) { const l = aw[aw.length - 1]; $('rh').innerHTML = `<span style="color:#16a34a;font-weight:700">تنبيه: جهاز (${esc(l.r.dev)}) لهذا الزبون ما زال ${esc(l.w.label)}!</span>`; }
}
function pickRpBrand(j) {
  const b = S.tags.brand[j], el = $('r_v'); if (!el) return; let cur = el.value.trim();
  const o = S.tags.brand.find(x => x && cur.toLowerCase().startsWith(String(x).toLowerCase())); if (o) cur = cur.slice(o.length).trim();
  el.value = b + ' ' + cur; el.focus(); checkDeviceHistory(); suggestGuidePrice();
}
function pickRpFault(j) {
  const f = S.tags.fault[j], el = $('r_f'); if (!el) return;
  let p = el.value.split('،').map(s => s.trim()).filter(Boolean); p = p.includes(f) ? p.filter(x => x !== f) : [...p, f];
  el.value = p.join('، '); suggestGuidePrice();
}
function suggestGuidePrice() {   // اقتراح السعر من دليل الأسعار
  const dev = nz(($('r_v') || {}).value || ''), flt = nz(($('r_f') || {}).value || ''), box = $('rp_price_hint'); if (!box) return;
  GPM = (!dev && !flt) ? [] : S.guide.filter(g => { const gm = nz(g.m), gf = nz(g.f), mm = dev && (dev.includes(gm) || gm.includes(dev)), fm = flt && (flt.includes(gf) || gf.includes(flt)); return (mm && fm) || (dev.length > 2 && mm && !flt); }).slice(0, 3);
  box.innerHTML = GPM.map((g, j) => `<button type="button" class="tag on" style="margin-top:4px" onclick="$('r_c').value=GPM[${j}].p">${I('bulb')} السعر في الدليل (${esc(g.m)} - ${esc(g.f)}): ${esc(dh(g.p))} — اضغط لوضعه</button>`).join('');
}
function checkDeviceHistory() {   // جهاز مشابه سُلِّم قبل أقل من 14 يوماً
  const dev = nz(($('r_v') || {}).value || ''), box = $('rp_dev_hist'); if (!box) return;
  if (dev.length < 3) { box.textContent = ''; return; }
  const rec = S.rp.filter(r => r != ZR && r.st == 'dn' && nz(r.dev).includes(dev) && (Date.now() - (r.t2 || 0)) < 14 * 864e5);
  if (!rec.length) { box.textContent = ''; return; }
  const l = rec[rec.length - 1], days = Math.floor((Date.now() - l.t2) / 864e5);
  box.textContent = `تنبيه: جهاز مشابه (${l.dev} — ${l.name}) سُلّم منذ ${days || 'أقل من'} يوم (${l.tst ? 'جُرِّب مع الزبون' : 'بدون توثيق تجربة'})`;
}
function rSave() {
  const n = $('r_n').value.trim(), f = $('r_f').value.trim(), v = $('r_v').value.trim(), t = $('r_t').value.replace(/\D/g, ''), isNew = !(ZR && ZR.id);
  if (!n || !f) return toast('الاسم والعطل مطلوبان');
  if (!v && (isNew || ZR.dev)) return toast('اكتب نوع الهاتف');
  if (t.length < 8 && (isNew || ZR.tel)) return toast('اكتب رقم هاتف الزبون (8 أرقام على الأقل)');
  finish(fxAtt({ name: n, tel: $('r_t').value.trim(), dev: v, fault: f, cap: $('r_c').value.trim(), dep: $('r_d').value.trim(), part: $('r_p').value.trim(), lock: $('r_l').value.trim(), pat: ZP, chk: ZK, img: ZI, note: $('r_o').value.trim(), imei: $('r_imei').value.trim(), war: Math.max(0, Math.floor(+$('r_war').value || 0)) }));
}
function rDone(v, r) {
  if (!v) return;
  if (r && r.id && S.rp.includes(r)) return commit('تم التعديل', () => Object.assign(r, v, { lb: S.me }));
  commit('تم الاستلام', () => S.rp.push({ id: uid(), st: 'in', t0: Date.now(), by: S.me, calls: [], ...v }));
}
function rpZoom(id) {
  const r = rf(id), src = r && rImg(r); if (!src) return;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(r.name + ' — ' + r.dev)}</h3><img src="${src}" style="width:100%;max-height:70vh;object-fit:contain;border-radius:12px"><div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
  sheetOpen(() => { });
}

/* ---------- دليل أسعار الإصلاح ---------- */
const gdCard = g => `<div class="card"><div class="row2"><b>${esc(g.m)}</b><b style="flex:none;font-size:1.2rem">${esc(g.p)}</b></div><div class="m">${esc(g.f)}${g.n ? ' · ' + esc(g.n) : ''}</div>${can('price') ? `<div class="sub"><button class="btn s sm" onclick="gdEd('${g.id}')">تعديل</button><button class="btn s sm" onclick="gdDel('${g.id}')">حذف</button></div>` : ''}</div>`;
const gdList = q => { const n = nz(q || ''); return S.guide.filter(g => !n || nz(g.m + g.f + (g.n || '')).includes(n)).sort((a, b) => a.m.localeCompare(b.m)).map(gdCard).join('') || '<p class="m">لا شيء بعد</p>'; };
VW.gd = () => ({ t: 'دليل أسعار الإصلاح', h: (can('price') ? '<button class="btn" onclick="gdEd(null)">+ إضافة تسعيرة</button>' : '') + `<input placeholder="ابحث: موديل أو عطل" value="${esc(V.q)}" oninput="V.q=this.value;$('gdl').innerHTML=gdList(V.q)"><div id="gdl">${gdList(V.q)}</div>` });
function gdEd(id) {
  if (!can('price')) return toast('للمدير فقط'); const g = id ? S.guide.find(x => x.id == id) : {};
  ask(id ? 'تعديل تسعيرة' : 'تسعيرة جديدة', [{ k: 'm', l: 'الموديل (مثال: Samsung A12)', v: g.m || '' }, { k: 'f', l: 'العطل (مثال: شاشة)', v: g.f || '' }, { k: 'p', l: 'السعر', t: 'tel', v: g.p || '' }, { k: 'n', l: 'ملاحظة (اختياري)', v: g.n || '' }]).then(v => {
    if (!v) return; if (!v.m.trim() || !v.f.trim() || !v.p.trim()) return toast('الموديل والعطل والسعر مطلوبة');
    upd(() => { const o = { m: v.m.trim(), f: v.f.trim(), p: v.p.trim(), n: v.n.trim() }; if (id) Object.assign(g, o); else S.guide.push({ id: uid(), ...o }); });
  });
}
function gdDel(id) { const g = S.guide.find(x => x.id == id); del('guide', id, g.m + ' ' + g.f); }

/* ---------- طلبات الزبائن («زبون سأل ولم نجد») ---------- */
function rq() { ask('طلب زبون', [{ k: 't', l: 'ماذا طلب؟ (مع رقمه إن أمكن)', t: 'area' }]).then(v => { const t = v && v.t.trim(); if (t) commit('تم التسجيل', () => S.req.push({ id: uid(), t, by: S.me, at: Date.now() })); }); }
function rqD(id) { commit('تم', () => { S.req = S.req.filter(r => r.id != id); }); }
HOME.after.push(() => '<button class="btn s" onclick="rq()">زبون سأل ولم نجد</button>');

/* ---------- ربط الباركود/IMEI، الإعدادات ---------- */
function bcNewRp() { $('sh').innerHTML = ''; const rec = { imei: BCODE }; sheetOpen(v => rDone(v, rec)); rForm(rec); }
BCX.push(() => `<button class="btn s sm" onclick="bcNewRp()">${I('tool')} + استلام صيانة</button>`);
BCM.push(c => { const nc = nz(c); return S.rp.filter(r => r.imei && nz(r.imei).includes(nc)).map(rc).join(''); });
/* ---------- أرشفة: حذف الصيانات المسلّمة منذ أكثر من سنة وانتهى ضمانها (يدوياً وللمدير فقط) ---------- */
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
