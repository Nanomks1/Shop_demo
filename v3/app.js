/* ============================================================
   app.js — الهيكل: الرئيسية، البحث، المزيد، المستخدمون، القفل،
   النسخ الاحتياطي، الإعدادات العامة، والإقلاع.
   يُحمَّل آخر ملف (بعد ملفات الأقسام).
   ============================================================ */

/* ---------- الأقسام ---------- */
const SECS = [['phones', 'الهواتف', 'mobile'], ['glass', 'الأنتي كاس', 'shield'], ['case', 'البوشيط', 'box'], ['acc', 'الإكسسوارات', 'plug']];
const secCount = k => k == 'glass' ? S.gg.length : S.items.filter(i => i.sec == k).length;
const soon = t => ({ t, h: '<div class="card"><b>يُبنى في مرحلة قادمة</b><p class="m">هذا القسم لم يُنقل إلى النسخة الجديدة بعد، والنسخة القديمة (v2) ما زالت تعمل.</p></div>' });
VW.sec = VW.sec || (() => soon('قسم'));
VW.rp = VW.rp || (() => soon('الصيانة'));
VW.rep = VW.rep || (() => soon('التقرير'));

/* ---------- البحث الموحّد ---------- */
let SC = '';   // نطاق البحث الحالي
const scopeChips = () => [['', 'الكل'], ...SRCH.map(p => [p.k, p.l])].map(([k, l]) => `<button class="tag ${SC == k ? 'on' : ''}" onclick="scSet('${k}')">${l}</button>`).join('');
function scSet(k) { SC = k; const b = $('sc'); if (b) b.innerHTML = scopeChips(); sq(Q); }
function srch(q) {
  const n = nz(q); if (!n) return '';
  const o = []; SRCH.forEach(p => { if (!SC || SC == p.k) o.push(...p.run(n)); });
  return o.join('') || '<p class="m">لا نتائج</p>';
}
function sq(q) {
  if (q && !QP) { QP = 1; history.pushState({ V, q: 1 }, ''); }
  Q = q; const r = $('res'); if (r) r.innerHTML = q ? srch(q) : '';
}
function goSearch() { go('home'); setTimeout(() => { const i = document.querySelector('main input'); if (i) i.focus(); }, 60); }

/* ---------- الرئيسية ---------- */
const bkHide = () => { try { localStorage.setItem('bkHide', Date.now()); } catch (e) { } render(); };
VW.home = () => {
  const old = isAdmin() && (S.items.length || S.rp.length) && Date.now() - (S.cfg.lb || 0) > 7 * 864e5;
  let hid = 0; try { hid = Date.now() - (+localStorage.getItem('bkHide') || 0) < 864e5; } catch (e) { }
  const bk = old && !hid ? `<div class="bkb"><span>لم تُحفظ نسخة خارجية منذ أسبوع</span><button class="btn sm" onclick="BKP()">حفظ</button><button class="bkx" onclick="bkHide()" aria-label="إغلاق">✕</button></div>` : '';
  const call = L => L.map(f => f()).join('');
  return {
    t: 'محل عزيز',
    h: bk + call(HOME.top)
      + `<input placeholder="ابحث..." value="${esc(Q)}" oninput="sq(this.value)"><div id="sc">${scopeChips()}</div>`
      + call(HOME.tools) + '<div id="res"></div><h3>الأقسام</h3>'
      + `<div class="grid">${SECS.map(([k, n, i]) => `<button class="card sc" onclick="go('sec',{k:'${k}'})">${ic(i)}<b>${n}</b><span class="m">${secCount(k)} صنف</span></button>`).join('')}</div>`
      + call(HOME.after),
    a: () => sq(Q)
  };
};

/* ---------- المزيد ---------- */
const MG = [['sec', 'أقسام المحل', 'الوسوم والحدود والخانات الخاصة بكل قسم'], ['rep', 'التقرير'], ['look', 'الشكل والنماذج'], ['lim', 'الحدود والتنبيهات'], ['usr', 'المستخدمون والأمان'], ['data', 'البيانات والنسخ']];
VW.st = () => ({
  t: 'المزيد',
  h: MG.map(([k, t, d]) => {
    const L = MORE.filter(x => x.g == k).sort((a, b) => (a.o || 50) - (b.o || 50));
    return L.length ? `<h3>${t}</h3>` + (d ? `<p class="m">${d}</p>` : '') + L.map(x => row(x.l, x.fn, x.n ? x.n() : '')).join('') : '';
  }).join('')
});
MORE.push(
  { g: 'look', o: 10, l: 'المظهر', fn: "go('st_look')" },
  { g: 'lim', o: 10, l: 'حدود النفاد والقفل التلقائي', fn: "go('st_lim')" },
  { g: 'usr', o: 10, l: 'المستخدمون والصلاحيات', fn: "go('st_users')" },
  { g: 'usr', o: 20, l: 'رمز القفل السريع', fn: 'lkSet()', n: () => S.cfg.lk ? 'مُعيَّن' : 'غير مُعيَّن' },
  { g: 'data', o: 20, l: 'النسخ الاحتياطي والاستعادة', fn: "go('st_bk')" },
  { g: 'data', o: 30, l: 'المحذوفات', fn: "go('st_trash')", n: () => S.trash.length || '' },
  { g: 'data', o: 40, l: 'كل الوسوم (قائمة كاملة)', fn: "go('st_tags')" }
);

/* ---------- المظهر ---------- */
const THM=[['a','تلقائي','يتبدّل بين النهاري والليلي مع الهاتف',['#f4f6fa','#0b1220','#2563eb']],['l','نقي','فاتح · أزرق',['#f4f6fa','#ffffff','#2563eb']],['d','ليل','داكن · أزرق',['#0b1220','#131c2e','#4f8cff']],['g','زمرد','فاتح · أخضر',['#f2f7f4','#ffffff','#059669']],['v','بنفسجي','داكن · بنفسجي',['#130f1f','#1c1630','#8b5cf6']],['w','دافئ','ورقي · برتقالي',['#f8f3ea','#fffdf8','#d9480f']]];
VW.st_look = () => ({
  t: 'المظهر',
  h: '<h3>الثيم (لهذا الجهاز فقط)</h3>' + THM.map(([k, n, d, c]) => { const on = (S.cfg.th || 'a') == k; return `<button class="card row2 ${on ? 'sel' : ''}" onclick="upd(()=>S.cfg.th='${k}')"><span class="sw3">${c.map(x => `<i style="background:${x}"></i>`).join('')}</span><b>${n}<div class="m" style="font-weight:400">${d}</div></b>${on ? I('check') : ''}</button>`; }).join('')
    + '<h3>حجم الخط</h3>' + [[15, 'صغير'], [17, 'عادي'], [19, 'كبير'], [21, 'أكبر']].map(([v, l]) => `<button class="tag ${S.cfg.fs == v ? 'on' : ''}" onclick="upd(()=>S.cfg.fs=${v})">${l}</button>`).join('')
});

/* ---------- الحدود ---------- */
VW.st_lim = () => ({
  t: 'الحدود والتنبيهات',
  h: LM.map(([k, l]) => `<button class="card row2" onclick="limEd('${k}')"><b style="flex:1">${l}</b><span>${S.cfg[k] ?? DL0[k]}</span></button>`).join('')
    + '<p class="m">حد مجموعة أنتي كاس بعينها يُحدَّد من «الحد والسعر» داخلها.</p>'
});
function limEd(k) {
  if (!isAdmin()) return toast('للمدير فقط');
  ask('تعديل القيمة', [{ k: 'v', l: 'القيمة', t: 'tel', v: S.cfg[k] ?? DL0[k] }]).then(v => { if (v && v.v.trim() !== '') upd(() => S.cfg[k] = +v.v); });
}

/* ---------- الوسوم ---------- */
VW.st_tags = () => ({ t: 'الوسوم', h: Object.keys(TG).map(g => row(TG[g], `go('st_tg',{g:'${g}'})`, S.tags[g].length)).join('') });
VW.st_tg = () => {
  const g = V.g, ed = can('tags');
  return {
    t: TG[g],
    h: (ed ? '' : '<p class="m">التعديل للمدير فقط.</p>')
      + `<div>${S.tags[g].map((t, i) => `<span class="tag">${esc(t)}${ed ? `<b onclick="tgDel('${g}',${i})">×</b>` : ''}</span>`).join('')}</div>`
      + (ed ? `<button class="btn" onclick="tgAdd('${g}')">+ إضافة</button>` : '')
  };
};
function tgAdd(g) { ask('وسم جديد: ' + TG[g], [{ k: 't', l: 'الاسم' }]).then(v => { const t = v && v.t.trim(); if (t && !S.tags[g].includes(t)) upd(() => S.tags[g].push(t)); }); }
function tgDel(g, i) {
  sure('حذف الوسم «' + S.tags[g][i] + '» ؟').then(y => {
    if (!y) return;
    const o = [...S.tags[g]];
    upd(() => S.tags[g].splice(i, 1));
    toast('تم الحذف', () => { S.tags[g] = o; });
  });
}

/* ---------- المحذوفات ---------- */
VW.st_trash = () => ({
  t: 'المحذوفات (30 يوماً)',
  h: S.trash.map(t => `<div class="card row2"><div style="flex:1"><b>${esc(t.label)}</b><div class="m"><bdi>${fd(t.t)}</bdi></div></div><button class="btn s sm" onclick="restore('${t.id}')">استرجاع</button></div>`).join('') || '<p class="m">لا شيء</p>'
});

/* ---------- المستخدمون والصلاحيات ---------- */
VW.st_users = () => {
  const a = isAdmin();
  return {
    t: 'المستخدمون',
    h: S.users.map((u, i) => `<div class="card row2"><b>${esc(u.name)}</b><span class="m">${u.admin ? 'مدير' : 'موظف' + (u.pin ? '' : ' · بلا رمز')}</span>${a ? `<button class="btn s sm" onclick="uEd(${i})">تعديل</button>` : ''}</div>`).join('')
      + (a ? '<button class="btn" onclick="uAdd()">+ مستخدم</button><button class="btn s" onclick="pinCh()">تغيير رمز المدير</button><h3>الصلاحيات</h3>'
        + Object.keys(PL).map(k => `<div class="card row2"><b>${PL[k]}</b><button class="btn s sm" onclick="pTog('${k}')">${S.perm[k] == 'a' ? 'المدير فقط' : 'الجميع'}</button></div>`).join('')
        : '<p class="m">التعديل للمدير فقط.</p>')
  };
};
const adm = () => S.users.filter(u => u.admin).length;
const uAdd = needAdm(function () {
  ask('مستخدم جديد', [{ k: 'n', l: 'الاسم' }, { k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: 'موظف' }, { k: 'p', l: 'رمز الموظف بالأرقام (اختياري)', t: 'password' }]).then(v => {
    if (v && v.n.trim()) upd(() => { const u = { name: v.n.trim(), admin: v.r == 'مدير' }; if (v.p && !u.admin) u.pin = hs(v.p); S.users.push(u); });
  });
});
const uEd = needAdm(function (i) {
  const u = S.users[i];
  const F = [{ k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: u.admin ? 'مدير' : 'موظف' }, { k: 'p', l: 'رمز جديد للموظف (فارغ = بلا تغيير)' + (u.pin ? ' — له رمز حالياً' : ''), t: 'password' }];
  if (u.pin) F.push({ k: 'd', l: 'حذف رمز الموظف؟', t: 'sel', o: ['لا', 'نعم'], v: 'لا' });
  F.push({ k: 'x', l: 'حذف المستخدم؟', t: 'sel', o: ['لا', 'نعم'], v: 'لا' });
  ask(u.name, F).then(v => {
    if (!v) return;
    if ((v.x == 'نعم' || v.r == 'موظف') && u.admin && adm() < 2) return toast('يجب أن يبقى مدير واحد على الأقل');
    upd(() => {
      if (v.x == 'نعم') S.users.splice(i, 1);
      else { u.admin = v.r == 'مدير'; if (u.admin) delete u.pin; else if (v.p) u.pin = hs(v.p); else if (v.d == 'نعم') delete u.pin; }
    });
  });
});
const pinCh = needAdm(function () { ask('رمز المدير الجديد', [{ k: 'p', l: 'الرمز الجديد', t: 'password' }]).then(v => { if (v && v.p) upd(() => S.pin = hs(v.p)); }); });
function pTog(k) { if (isAdmin()) upd(() => S.perm[k] = S.perm[k] == 'a' ? 'e' : 'a'); }

/* تبديل المستخدم: الموظف برمزه (أو برمز المدير)، والمدير برمز المدير */
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
  ask('مرحباً في محل عزيز! إعداد المدير', [{ k: 'n', l: 'اسمك' }, { k: 'p', l: 'رمز المدير (لحماية الصلاحيات)', t: 'password' }], 'ابدأ').then(v => {
    if (!v || !v.n.trim() || !v.p) return setup();
    S.users = [{ name: v.n.trim(), admin: true }]; S.me = v.n.trim(); S.pin = hs(v.p); admSet(true); save(); render();
  });
}

/* ---------- القفل: تسجيل الدخول (#lg) والقفل السريع (#lk) ---------- */
let LAST = Date.now(), HID_AT = 0;
['touchstart', 'click', 'keydown'].forEach(e => addEventListener(e, () => { LAST = Date.now(); }, true));
const TRIES = {};   // 5 محاولات خاطئة = تجميد 10 ثوانٍ (لكل شاشة)
function tryBlocked(k, m, pad) { const t = TRIES[k] || (TRIES[k] = { n: 0, until: 0 }); if (Date.now() < t.until) { if (m) m.textContent = 'انتظر 10 ثوانٍ ثم أعد المحاولة'; pkTap(pad, 'C'); return true; } return false; }
function tryFail(k, m, pad, txt) { const t = TRIES[k]; t.n++; pkTap(pad, 'C'); if (t.n >= 5) { t.n = 0; t.until = Date.now() + 10000; if (m) m.textContent = 'محاولات كثيرة! انتظر 10 ثوانٍ'; } else if (m) m.textContent = txt; }

function lgShow() {
  if ($('lg')) return;
  admSet(false);
  const emp = S.users.filter(u => !u.admin), ads = S.users.filter(u => u.admin);
  document.body.insertAdjacentHTML('beforeend', `<div id="lg" class="lockscr"><div class="lockbox"><h2>${I('lock')} تسجيل الدخول — محل عزيز</h2>`
    + (emp.length ? '<p class="m c">دخول كموظف</p>' + emp.map((u, i) => `<button class="btn s" onclick="lgEmp(${i})">${esc(u.name)}${u.pin ? ' ' + I('lock') : ''}</button>`).join('') : '')
    + `<p class="m c">دخول كمدير</p><select id="lga">${ads.map(u => `<option>${esc(u.name)}</option>`).join('')}</select><div id="lgm" class="m c"></div>${pinPadHtml('lgp', 'رمز المدير', 'lgAdm()')}<button class="btn" onclick="lgAdm()">دخول المدير</button></div></div>`);
}
function lgEmp(i) {
  const u = S.users.filter(x => !x.admin)[i], done = () => { upd(() => { S.me = u.name; }); $('lg').remove(); };
  if (!u.pin) return done();
  ask('رمز ' + u.name, [{ k: 'p', l: 'الرمز بالأرقام', t: 'password' }], 'دخول').then(p => { if (p) hv(p.p, u.pin) ? done() : toast('الرمز خاطئ'); });
}
function lgAdm() {
  const p = $('lgp'), m = $('lgm');
  if (tryBlocked('lg', m, 'lgp')) return;
  if (p && hv(p.value, S.pin)) { TRIES.lg = null; admSet(true); LAST = Date.now(); const n = $('lga').value; upd(() => { S.me = n; }); $('lg').remove(); }
  else tryFail('lg', m, 'lgp', 'رمز خاطئ');
}
function lkShow() {
  if ($('lk')) return;
  document.body.insertAdjacentHTML('beforeend', `<div id="lk" class="lockscr"><div class="lockbox"><h2>${I('lock')} محل عزيز مقفل</h2><p id="lkm" class="m c">أدخل رمز القفل السريع أو رمز المدير</p>${pinPadHtml('lki', 'رمز الفتح', 'lkTry()')}<button class="btn" onclick="lkTry()">فتح التطبيق</button></div></div>`);
}
function lkTry() {
  const m = $('lkm'), el = $('lki');
  if (tryBlocked('lk', m, 'lki')) return;
  const c = el ? el.value : '', u = S.users.find(x => x.name == S.me);
  if (c && (hv(c, S.cfg.lk) || hv(c, S.pin) || (u && u.pin && hv(c, u.pin)))) { TRIES.lk = null; localStorage.removeItem('shopLock'); $('lk').remove(); LAST = Date.now(); }
  else tryFail('lk', m, 'lki', 'الرمز خاطئ، حاول مرة أخرى');
}
function lkSet(go2) {
  if (!isAdmin()) return toast('للمدير فقط');
  ask('رمز القفل السريع', [{ k: 'p', l: 'اختر رمزاً لقفل وفتح التطبيق بسرعة', t: 'password' }]).then(v => { if (v && v.p) { upd(() => S.cfg.lk = hs(v.p)); if (go2 === true) lockNow(); } });
}
function lockNow() {
  if (!S.cfg.lk && !S.pin) return isAdmin() ? lkSet(true) : toast('المدير يعيّن رمز القفل من المزيد');
  try { localStorage.setItem('shopLock', '1'); } catch (e) { }
  lkShow();
}
/* قفل تلقائي: عند ترك التطبيق أكثر من 90 ثانية، أو الخمول */
addEventListener('visibilitychange', () => {
  if (document.hidden) HID_AT = Date.now();
  else if (HID_AT && Date.now() - HID_AT > 90000 && S.users.length && (S.cfg.lk || S.pin)) lockNow();
});
setInterval(() => {
  const idle = (S.cfg.alk ?? DL0.alk) * 60000;
  if (S.users.length && S.pin && Date.now() - LAST > idle) {
    if (isAdmin() && !$('lg')) lgShow();
    else if ((S.cfg.lk || S.pin) && !$('lk') && !$('lg')) lockNow();
  }
}, 15000);

/* ---------- النسخ الاحتياطي ---------- */
/* تشفير بيانات الزبائن داخل ملف النسخة */
async function bkKey(pin){
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:new TextEncoder().encode('aziz-bk-v1'),iterations:150000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function bkEncObj(obj,pin){
  const key=await bkKey(pin),iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj))));
  const out=new Uint8Array(12+ct.length);out.set(iv);out.set(ct,12);
  let s='';for(let i=0;i<out.length;i+=8192)s+=String.fromCharCode.apply(null,out.subarray(i,i+8192));
  return btoa(s);
}
async function bkDecObj(b64,pin){
  const key=await bkKey(pin),u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:u.subarray(0,12)},key,u.subarray(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function makeSafeBackupJson(pinOrHash){
  const copy=JSON.parse(JSON.stringify(S));
  const resMap={};
  (copy.items||[]).forEach(i=>{if(i.res){resMap[i.id]=i.res;delete i.res}});
  const custData={rp:copy.rp||[],req:copy.req||[],res:resMap,trash:(copy.trash||[]).filter(t=>t.coll=='rp')};
  copy._encCust=await bkEncObj(custData,pinOrHash);
  copy.rp=[];copy.req=[];copy.trash=(copy.trash||[]).filter(t=>t.coll!='rp');
  delete copy.pin;if(copy.cfg)delete copy.cfg.lk;
  (copy.users||[]).forEach(u=>delete u.pin);
  return JSON.stringify(copy);
}


let AB_T = 0, AB_FH = null;
function schedAutoBk() {   // نسخة تلقائية داخل الهاتف (IndexedDB) + ملف مرتبط اختيارياً
  clearTimeout(AB_T);
  AB_T = setTimeout(async () => {
    try {
      await AUTOBK.put('latest', { at: Date.now(), data: JSON.parse(JSON.stringify(S)) });
      if (AB_FH && S.pin) { const w = await AB_FH.createWritable(); await w.write(await makeSafeBackupJson(S.pin)); await w.close(); }
    } catch (e) { }
  }, 5000);
}
HK.saved.push(schedAutoBk);
async function linkAutoFile() {
  if (!isAdmin()) return toast('للمدير فقط');
  if (!window.showSaveFilePicker) return toast('متصفحك يعتمد الحفظ التلقائي الداخلي');
  try {
    AB_FH = await window.showSaveFilePicker({ suggestedName: 'aziz-shop-auto-backup.json', types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
    schedAutoBk(); render(); toast('تم ربط ملف الحفظ التلقائي بنجاح');
  } catch (e) { }
}
function restAutoIdb() {
  if (!isAdmin()) return toast('للمدير فقط');
  AUTOBK.get('latest').then(rec => {
    if (!rec || !rec.data) return toast('لا توجد نسخة تلقائية محفوظة بعد');
    sure('استعادة النسخة التلقائية المحفوظة بتاريخ ' + fd(rec.at) + ' ؟', 'استعادة').then(y => { if (y) { S = { ...load(), ...rec.data }; save(); location.reload(); } });
  }).catch(() => toast('تعذر قراءة النسخة التلقائية'));
}
function BKP() {
  if (!isAdmin()) return toast('النسخ الاحتياطي للمدير فقط');
  ask('تأكيد رمز المدير لتشفير بيانات الزبائن', [{ k: 'p', l: 'رمز المدير (سيُستخدم لتشفير بيانات الزبائن في النسخة)', t: 'password' }], 'حفظ النسخة').then(async v => {
    if (!v || !v.p) return;
    if (!hv(v.p, S.pin)) return toast('رمز المدير خاطئ');
    try {
      const js = await makeSafeBackupJson(v.p), a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([js], { type: 'application/json' }));
      a.download = 'aziz-shop-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click(); S.cfg.lb = Date.now(); save(); render();
    } catch (e) { toast('تعذر إنشاء النسخة'); }
  });
}
function RST(f) {
  if (!f) return;
  if (!isAdmin()) return toast('الاستعادة للمدير فقط');
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result); if (!d.users) throw 0;
      sure('استبدال كل البيانات الحالية بالنسخة؟', 'استعادة').then(y => {
        if (!y) return;
        if (!d._encCust) { S = { ...load(), ...d }; save(); location.reload(); return; }
        ask('فك تشفير بيانات الزبائن', [{ k: 'p', l: 'أدخل رمز المدير الذي حُفظت به النسخة', t: 'password' }], 'فك التشفير والاستعادة').then(async v => {
          if (!v || !v.p) return;
          try {
            let cust;
            try { cust = await bkDecObj(d._encCust, v.p); } catch (e1) { try { cust = await bkDecObj(d._encCust, hs(v.p)); } catch (e2) { cust = await bkDecObj(d._encCust, hsL(v.p)); } }
            delete d._encCust;
            d.rp = cust.rp || []; d.req = cust.req || [];
            (d.items || []).forEach(i => { if (cust.res && cust.res[i.id]) i.res = cust.res[i.id]; });
            d.trash = [...(d.trash || []), ...(cust.trash || [])];
            d.pin = d.pin || S.pin;
            if (S.cfg && S.cfg.lk) d.cfg = { ...(d.cfg || {}), lk: S.cfg.lk };
            S = { ...load(), ...d }; save(); location.reload();
          } catch (e) { toast('الرمز خاطئ، تعذر فك تشفير بيانات الزبائن'); }
        });
      });
    } catch (e) { toast('ملف غير صالح'); }
  };
  r.readAsText(f);
}
VW.st_bk = () => {
  const n = (localStorage.getItem('shop3') || '').length, p = Math.round(n / 5e4), er = JSON.parse(localStorage.getItem('shopErr') || '[]');
  return {
    t: 'النسخ الاحتياطي',
    h: '<p class="m">يتم تشفير بيانات الزبائن الحساسة (الصيانة، الطلبات، الحجوزات) داخل ملف النسخة الاحتياطية لحمايتها من التسريب.</p>'
      + '<button class="btn" onclick="BKP()">حفظ ملف النسخة في الهاتف (محمي)</button>'
      + (window.showSaveFilePicker ? `<button class="btn s" onclick="linkAutoFile()">${AB_FH ? '✅ مرتبط بملف تلقائي (اضغط لتغييره)' : 'ربط ملف حفظ تلقائي مباشر بالهاتف'}</button>` : '')
      + '<button class="btn s" onclick="restAutoIdb()">استرجاع النسخة التلقائية الداخلية</button>'
      + '<label>استعادة من ملف خارجي<input type="file" accept=".json" onchange="RST(this.files[0])"></label>'
      + `<h3>المساحة المستعملة</h3><div class="card"><div class="row2"><b>${p}%</b><span class="m">${(n / 1e6).toFixed(1)} مليون حرف من نحو 5</span></div><div class="meter"><div style="width:${Math.min(100, p)}%;background:${p > 70 ? '#dc2626' : 'var(--p)'}"></div></div>${p > 70 ? '<p class="m">اقتربت المساحة من الامتلاء. خذ نسخة احتياطية الآن.</p>' : ''}</div>`
      + `<div class="card"><b>خزنة الصور (IndexedDB)</b><div class="m">صور الصيانة المحفوظة خارج ذاكرة المتصفح الضيقة: <b>${Object.keys(IMG).length}</b> (لا تستهلك من حد الـ 5 ميجابايت).</div></div>`
      + (er.length ? '<h3>آخر الأخطاء (للتشخيص)</h3>' + er.map(x => `<div class="m">${esc(x)}</div>`).join('') : '')
  };
};

/* ---------- الإقلاع ---------- */
$('bk').innerHTML = ic('back'); $('srb').innerHTML = ic('search'); $('lkb').innerHTML = I('lock'); $('syb').innerHTML = I('cloud');
S.trash = S.trash.filter(t => Date.now() - t.t < 2592e6);
try { navigator.storage.persist(); } catch (e) { }
startHistory();
render();
if (!S.users.length) { admSet(true); setup(); }
else if (S.pin && ((isAdmin() && !admOk()) || !S.users.some(u => u.name == S.me))) lgShow();
try { if (localStorage.getItem('shopLock') == '1' && (S.cfg.lk || S.pin)) lkShow(); } catch (e) { }
imgInit();
