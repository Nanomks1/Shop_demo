/* ============================================================
   users.js — المستخدمون والصلاحيات، تسجيل الدخول والقفل السريع
   يُحمَّل بعد home.js.
   ============================================================ */
/* ---------- المستخدمون والصلاحيات ---------- */
VW.st_users = () => {
  const a = isAdmin();
  return {
    t: 'المستخدمون',
    h: S.users.map((u, i) => `<div class="card row2"><b>${esc(u.name)}</b><span class="m">${u.admin ? 'مدير' : 'موظف' + (u.pin ? '' : ' · بلا رمز')}${u.nr ? ' · بلا تنبيهات' : ''}${u.lkmax ? ' · قفل ≤ ' + lkTxt(u.lkmax) : ''}</span>${a ? `<button class="btn s sm" onclick="uEd(${i})">تعديل</button>` : ''}</div>`).join('')
      + (a ? '<button class="btn" onclick="uAdd()">+ مستخدم</button><button class="btn s" onclick="pinCh()">تغيير رمز المدير</button><h3>الصلاحيات</h3>'
        + Object.keys(PL).map(k => `<div class="card row2"><b>${PL[k]}</b><button class="btn s sm" onclick="pTog('${k}')">${S.perm[k] == 'e' ? 'الجميع' : 'المدير فقط'}</button></div>`).join('')
        : '<p class="m">التعديل للمدير فقط.</p>')
  };
};
const adm = () => S.users.filter(u => u.admin).length;
const noRem = () => !!(S.users.find(u => u.name == S.me) || {}).nr;
const uAdd = needAdm(function () {
  ask('مستخدم جديد', [{ k: 'n', l: 'الاسم' }, { k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: 'موظف' }, { k: 'p', l: 'رمز الموظف بالأرقام (إجباري للموظف، 4 على الأقل)', t: 'password' }]).then(v => {
    if (!v || !v.n.trim()) return;
    const nm = v.n.trim();
    if (S.users.some(u => nz(u.name) == nz(nm))) return toast('يوجد مستخدم بهذا الاسم مسبقاً');
    const isA = v.r == 'مدير';
    if (!isA && !(v.p && v.p.length >= 4)) return toast('رمز الموظف إجباري (4 أرقام على الأقل)');
    upd(() => { const u = { name: nm, admin: isA }; if (!isA) u.pin = hs(v.p); S.users.push(u); });
  });
});
const uEd = needAdm(function (i) {
  const u = S.users[i];
  const F = [
    { k: 'nm', l: 'الاسم', v: u.name },
    { k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: u.admin ? 'مدير' : 'موظف' },
    { k: 'p', l: 'رمز جديد للموظف (فارغ = بلا تغيير)' + (u.pin ? ' — له رمز حالياً' : ''), t: 'password' },
    { k: 'n', l: 'التنبيهات اليومية في الرئيسية (التقرير والتعبئة)', t: 'sel', o: ['تظهر', 'مخفية'], v: u.nr ? 'مخفية' : 'تظهر' },
    { k: 'lm', l: 'قفل تلقائي إجباري: أقصى مدة قبل القفل (لا يستطيع تجاوزها)', t: 'sel', o: ['بلا حد', ...LKO.filter(o => o[0] >= 90).map(o => o[1])], v: u.lkmax ? lkTxt(u.lkmax) : 'بلا حد' },
    { k: 'x', l: 'حذف المستخدم؟', t: 'sel', o: ['لا', 'نعم'], v: 'لا' }
  ];
  ask(u.name, F).then(v => {
    if (!v) return;
    const newNm = (v.nm || '').trim();
    if (v.x != 'نعم' && !newNm) return toast('الاسم مطلوب');
    if (v.x != 'نعم' && S.users.some((x, j) => j != i && nz(x.name) == nz(newNm))) return toast('يوجد مستخدم آخر بهذا الاسم');
    if ((v.x == 'نعم' || v.r == 'موظف') && u.admin && adm() < 2) return toast('يجب أن يبقى مدير واحد على الأقل');
    if (v.x != 'نعم' && v.r == 'موظف' && v.p && v.p.length < 4) return toast('الرمز 4 أرقام على الأقل');
    if (v.x != 'نعم' && v.r == 'موظف' && !u.pin && !v.p) return toast('رمز الموظف إجباري: اكتب رمزاً جديداً للموظف');
    upd(() => {
      const wasMe = u.name == S.me;
      if (v.x == 'نعم') {
        S.users.splice(i, 1);
        if (wasMe) S.me = (S.users.find(x => x.admin) || S.users[0] || {}).name || '';
      } else {
        u.name = newNm;
        if (wasMe) S.me = newNm;
        u.admin = v.r == 'مدير';
        if (u.admin) delete u.pin;
        else {
          if (v.p) u.pin = hs(v.p);
          if (wasMe) admSet(false);
        }
        if (v.n == 'مخفية') u.nr = 1; else delete u.nr;
        if (v.lm == 'بلا حد') delete u.lkmax; else { const o = LKO.find(x => x[1] == v.lm); if (o) u.lkmax = o[0]; }
      }
    });
  });
});
const pinCh = needAdm(function () { ask('رمز المدير الجديد', [{ k: 'p', l: 'الرمز الجديد', t: 'password' }]).then(v => { if (v && v.p) upd(() => S.pin = hs(v.p)); }); });
function pTog(k) { if (isAdmin()) upd(() => S.perm[k] = S.perm[k] == 'e' ? 'a' : 'e'); }
function who() {
  ask('من أنت؟', [{ k: 'u', l: 'المستخدم', t: 'sel', o: S.users.map(u => u.name), v: S.me }], 'اختيار').then(v => {
    if (!v) return;
    const u = S.users.find(x => x.name == v.u); if (!u) return;
    if (!u.admin) {
      const go2 = () => { admSet(false); upd(() => { S.me = u.name; }); };
      if (u.name == S.me) return;
      if (u.pin) return ask('رمز الموظف: ' + u.name, [{ k: 'p', l: 'الرمز السري', t: 'password' }], 'دخول').then(p => { if (p) (hv(p.p, u.pin) || hv(p.p, S.pin)) ? go2() : toast('الرمز خاطئ'); });
      return go2();
    }
    if (u.name == S.me && admOk()) return;
    ask('رمز المدير', [{ k: 'p', l: 'الرمز', t: 'password' }], 'دخول').then(p => { if (p) hv(p.p, S.pin) ? (admSet(true), upd(() => { S.me = u.name; })) : toast('الرمز خاطئ'); });
  });
}
function setup() {
  ask('مرحباً في ' + shopName() + '! إعداد المدير', [{ k: 'n', l: 'اسمك' }, { k: 'p', l: 'رمز المدير (لحماية الصلاحيات)', t: 'password' }], 'ابدأ').then(v => {
    if (!v || !v.n.trim() || !v.p) return setup();
    S.users = [{ name: v.n.trim(), admin: true }]; S.me = v.n.trim(); S.pin = hs(v.p); admSet(true); save(); render();
  });
}
/* ---------- القفل: تسجيل الدخول (#lg) والقفل السريع (#lk) ---------- */
/* ---------- القفل التلقائي: مدة شخصية (الافتراضي 90 ث) + سقف إجباري يحدده المدير لكل مستخدم ---------- */
let LAST = Date.now(), usLgEmp = '';
['touchstart', 'click', 'keydown'].forEach(e => addEventListener(e, () => { LAST = Date.now(); }, true));
const lkStore = () => { try { localStorage.setItem('shopLast', String(LAST)); } catch (e) { } };
setInterval(lkStore, 5000);
const LKO = [[30, '30 ثانية'], [90, '90 ثانية'], [180, '3 دقائق'], [300, '5 دقائق'], [600, '10 دقائق'], [1800, '30 دقيقة'], [3600, 'ساعة']];
const lkMe = () => S.users.find(x => x.name == S.me) || null;
const lkCap = () => (lkMe() || {}).lkmax || 0;   // السقف (ثوانٍ) الذي حدده المدير لهذا المستخدم، 0 = بلا سقف
const lkSecs = () => { const p = +S.cfg.lkp || 90, c = lkCap(); return c ? Math.min(p, c) : p; };
const lkTxt = s => (LKO.find(o => o[0] == s) || [0, s + ' ثانية'])[1];
function lkNeeded() {
  if (!S.users.length || !S.pin) return false;
  const u = lkMe();
  return !(u && !u.admin && !u.pin);   // موظف بلا رمز لا يستطيع فتح القفل، فلا نقفل عليه
}
function lkEd() {
  const c = lkCap(), O = LKO.filter(o => !c || o[0] <= c);
  ask('القفل التلقائي', [{ k: 't', l: 'يقفل التطبيق بعد' + (c ? ' (الحد الأقصى حدّده المدير)' : ''), t: 'sel', o: O.map(o => o[1]), v: lkTxt(lkSecs()) }]).then(v => {
    const o = v && O.find(x => x[1] == v.t); if (o) upd(() => { S.cfg.lkp = o[0]; });
  });
}
const TRIES = {};
function tryBlocked(k, m, pad) { const t = TRIES[k] || (TRIES[k] = { n: 0, until: 0 }); if (Date.now() < t.until) { if (m) m.textContent = 'انتظر 10 ثوانٍ ثم أعد المحاولة'; pkTap(pad, 'C'); return true; } return false; }
function tryFail(k, m, pad, txt) { const t = TRIES[k]; t.n++; pkTap(pad, 'C'); if (t.n >= 5) { t.n = 0; t.until = Date.now() + 10000; if (m) m.textContent = 'محاولات كثيرة! انتظر 10 ثوانٍ'; } else if (m) m.textContent = txt; }
function closeOverlaysForLock() {   // نغطي النافذة المفتوحة بشاشة القفل ولا نغلقها، فلا يضيع ما كتبته
  const a = document.activeElement; if (a && a.blur) a.blur();
  sugClose();
  const t = $('ts'); if (t) t.hidden = true;
}
/* شاشة دخول موحّدة (خيار المدير lgu): أسماء الجميع ولوحة رمز واحدة في شاشة واحدة */
const lgU = () => S.users.length && (S.cfg.lgu === undefined ? 1 : +S.cfg.lgu);
function lgUTog() { if (!isAdmin()) return toast('للمدير فقط'); upd(() => { S.cfg.lgu = (S.cfg.lgu === undefined ? 1 : +S.cfg.lgu) ? 0 : 1; }); }
function lgBoxHtmlU() {
  const sel = S.users.find(u => u.name == usLgEmp);
  return `<h2>${I('lock')} تسجيل الدخول — ${esc(shopName())}</h2><p class="m c">اختر اسمك ثم اكتب رمزك</p>`
    + `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${S.users.map((u, i) => `<button class="tag${u.name == usLgEmp ? ' on' : ''}" onclick="lgPick(${i})">${esc(u.name)}${u.admin ? ' ★' : (u.pin ? ' ' + I('lock') : '')}</button>`).join('')}</div>`
    + `<div id="lgm" class="m c">${sel ? esc('أدخل رمز ' + sel.name) : ''}</div>${pinPadHtml('lgup', sel ? 'رمز ' + sel.name : 'الرمز', 'lgUTry()')}<button class="btn" onclick="lgUTry()">دخول</button>`;
}
function lgPick(i) {
  const u = S.users[i]; if (!u) return;
  if (!u.admin && !u.pin) return lgEmpDone(u.name);
  usLgEmp = u.name;
  const b = $('lg') && $('lg').querySelector('.lockbox'); if (b) b.innerHTML = lgBoxHtmlU();
}
function lgUTry() {
  const u = S.users.find(x => x.name == usLgEmp), p = $('lgup'), m = $('lgm');
  if (!u) { if (m) m.textContent = 'اختر اسمك أولاً'; return; }
  const tk = u.admin ? 'lg' : 'lge_' + u.name;
  if (tryBlocked(tk, m, 'lgup')) return;
  if (u.admin) {
    if (p && hv(p.value, S.pin)) {
      TRIES.lg = null; usLgEmp = ''; admSet(true); LAST = Date.now();
      try { localStorage.removeItem('shopLock'); } catch (e) { }
      lkStore();
      upd(() => { S.me = u.name; });
      const el = $('lg'); if (el) el.remove();
    } else tryFail(tk, m, 'lgup', 'رمز خاطئ');
  } else if (p && p.value && (hv(p.value, u.pin) || hv(p.value, S.pin))) { TRIES[tk] = null; usLgEmp = ''; lgEmpDone(u.name); }
  else tryFail(tk, m, 'lgup', 'الرمز خاطئ، حاول مرة أخرى');
}
function lgBoxHtml() {
  if (lgU()) return lgBoxHtmlU();
  const emp = S.users.filter(u => !u.admin), ads = S.users.filter(u => u.admin);
  return `<h2>${I('lock')} تسجيل الدخول — ${esc(shopName())}</h2>`
    + (emp.length ? '<p class="m c">دخول كموظف</p>' + emp.map((u, i) => `<button class="btn s" onclick="lgEmp(${i})">${esc(u.name)}${u.pin ? ' ' + I('lock') : ''}</button>`).join('') : '')
    + `<p class="m c">دخول كمدير</p><select id="lga">${ads.map(u => `<option>${esc(u.name)}</option>`).join('')}</select><div id="lgm" class="m c"></div>${pinPadHtml('lgp', 'رمز المدير', 'lgAdm()')}<button class="btn" onclick="lgAdm()">دخول المدير</button>`;
}
function lgShow() {
  if ($('lg')) return;
  closeOverlaysForLock();
  admSet(false);
  usLgEmp = '';
  document.body.insertAdjacentHTML('beforeend', `<div id="lg" class="lockscr"><div class="lockbox">${lgBoxHtml()}</div></div>`);
}
function lgBack() {
  usLgEmp = '';
  const b = $('lg') && $('lg').querySelector('.lockbox');
  if (b) b.innerHTML = lgBoxHtml();
}
function lgEmpDone(name) {
  admSet(false); LAST = Date.now();
  try { localStorage.removeItem('shopLock'); } catch (e) { }
  lkStore();
  upd(() => { S.me = name; });
  const el = $('lg'); if (el) el.remove();
}
function lgEmp(i) {
  const u = S.users.filter(x => !x.admin)[i]; if (!u) return;
  if (!u.pin) return lgEmpDone(u.name);
  usLgEmp = u.name;
  const b = $('lg') && $('lg').querySelector('.lockbox');
  if (!b) return;
  b.innerHTML = `<h2>${I('lock')} دخول: ${esc(u.name)}</h2><div id="lgem" class="m c">أدخل رمزك السري</div>${pinPadHtml('lgep', 'رمز ' + u.name, 'lgEmpTry()')}<button class="btn" onclick="lgEmpTry()">دخول</button><button class="btn s" onclick="lgBack()">رجوع لقائمة المستخدمين</button>`;
}
function lgEmpTry() {
  const u = S.users.find(x => !x.admin && x.name == usLgEmp); if (!u) return lgBack();
  const p = $('lgep'), m = $('lgem'), tk = 'lge_' + u.name;
  if (tryBlocked(tk, m, 'lgep')) return;
  if (p && p.value && (hv(p.value, u.pin) || hv(p.value, S.pin))) { TRIES[tk] = null; usLgEmp = ''; lgEmpDone(u.name); }
  else tryFail(tk, m, 'lgep', 'الرمز خاطئ، حاول مرة أخرى');
}
function lgAdm() {
  const p = $('lgp'), m = $('lgm');
  if (tryBlocked('lg', m, 'lgp')) return;
  if (p && hv(p.value, S.pin)) {
    TRIES.lg = null; admSet(true); LAST = Date.now();
    try { localStorage.removeItem('shopLock'); } catch (e) { }
    lkStore();
    const n = $('lga').value; upd(() => { S.me = n; });
    const el = $('lg'); if (el) el.remove();
  } else tryFail('lg', m, 'lgp', 'رمز خاطئ');
}
let lkSel = '';   // الاسم المختار في شاشة القفل
function lkBoxHtml() {
  const sel = S.users.find(u => u.name == lkSel);
  return `<h2>${I('lock')} ${esc(shopName())} مقفل</h2><p class="m c">اختر اسمك ثم اكتب رمزك</p>`
    + `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${S.users.map((u, i) => `<button class="tag${u.name == lkSel ? ' on' : ''}" onclick="lkPick(${i})">${esc(u.name)}${u.admin ? ' ★' : (u.pin ? ' ' + I('lock') : '')}</button>`).join('')}</div>`
    + `<p id="lkm" class="m c">${sel ? esc('أدخل رمز ' + sel.name) : ''}</p>${pinPadHtml('lki', sel ? 'رمز ' + sel.name : 'رمز الفتح', 'lkTry()')}<button class="btn" onclick="lkTry()">فتح التطبيق</button>`;
}
function lkEnter(name) {   // دخول المستخدم المختار بعد نجاح الرمز
  TRIES.lk = null; try { localStorage.removeItem('shopLock'); } catch (e) { }
  const u = S.users.find(x => x.name == name);
  admSet(!!(u && u.admin));
  const el = $('lk'); if (el) el.remove();
  LAST = Date.now(); lkStore();
  if (name != S.me) upd(() => { S.me = name; });
}
function lkPick(i) {
  const u = S.users[i]; if (!u) return;
  if (!u.admin && !u.pin) return lkEnter(u.name);   // موظف بلا رمز يدخل مباشرة كما في شاشة الدخول
  lkSel = u.name;
  const b = $('lk') && $('lk').querySelector('.lockbox'); if (b) b.innerHTML = lkBoxHtml();
}
function lkShow() {
  if ($('lk')) return;
  closeOverlaysForLock();
  const me = lkMe(); lkSel = me && (me.admin || me.pin) ? me.name : '';
  document.body.insertAdjacentHTML('beforeend', `<div id="lk" class="lockscr"><div class="lockbox">${lkBoxHtml()}</div></div>`);
}
function lkTry() {
  const m = $('lkm'), el = $('lki');
  if (tryBlocked('lk', m, 'lki')) return;
  const u = S.users.find(x => x.name == lkSel);
  if (!u) { if (m) m.textContent = 'اختر اسمك أولاً'; return; }
  const c = el ? el.value : '';
  const ok = c && (u.admin ? hv(c, S.pin) : (hv(c, u.pin) || hv(c, S.pin)));
  if (ok) lkEnter(u.name);
  else tryFail('lk', m, 'lki', 'الرمز خاطئ، حاول مرة أخرى');
}
function lockNow() {
  if (!S.pin) return toast('لم يُعيَّن رمز المدير بعد');
  if (!lkNeeded()) return toast('لا رمز لك بعد: اطلب من المدير تعيين رمز لك');
  try { localStorage.setItem('shopLock', '1'); } catch (e) { }
  lkShow();
}
const lkDue = () => lkNeeded() && !$('lk') && !$('lg') && Date.now() - LAST > lkSecs() * 1000;
addEventListener('visibilitychange', () => { if (document.hidden) lkStore(); else if (lkDue()) lockNow(); });
setInterval(() => {
  if ([...document.querySelectorAll('video')].some(v => v.srcObject && !v.paused)) LAST = Date.now();   // أثناء مسح الكاميرا لا نقفل
  if (!lkDue()) return;
  if (isAdmin()) lgShow(); else lockNow();
}, 5000);