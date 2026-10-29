/* ============================================================
   app.js — الهيكل: الرئيسية، البحث، المزيد، المستخدمون، القفل،
   النسخ الاحتياطي، الإعدادات العامة، الأيقونة العائمة، والإقلاع.
   يُحمَّل آخر ملف (بعد ملفات الأقسام).
   ============================================================ */

/* ---------- أيقونات SVG إضافية حديثة (بدون إيموجي) ---------- */
Object.assign(IC, {
  plus: '<path d="M12 5v14M5 12h14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  keyboard: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/>',
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>'
});
if (typeof SY_LOC !== 'undefined' && !SY_LOC.includes('fab')) SY_LOC.push('fab');

/* تحديث زر التبديل في لوحة الأرقام ليستخدم أيقونات SVG بدل الإيموجي */
window.pinPadHtml = function (id, ph = 'أدخل الرمز', onEnter = '') {
  return `<div class="pin-wrap" id="${id}_wrap"><input id="${id}" type="hidden" value="" autocomplete="off" ${onEnter ? `onkeydown="if(event.key==='Enter')${onEnter}"` : ''}><div id="${id}_pad"><div id="${id}_dots" class="pin-dots" data-ph="${esc(ph)}"><span class="pin-ph">${esc(ph)}</span></div><div class="pin-grid">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="pkb" onclick="pkTap('${id}','${n}')">${n}</button>`).join('')}<button type="button" class="pkb fn" onclick="pkTap('${id}','C')">مسح</button><button type="button" class="pkb" onclick="pkTap('${id}','0')">0</button><button type="button" class="pkb fn" onclick="pkTap('${id}','B')">⌫</button></div></div><button type="button" id="${id}_sw" class="pin-sw" onclick="pkMode('${id}')">${I('keyboard')} الرمز فيه حروف؟ اضغط هنا للكتابة</button></div>`;
};
window.pkMode = function (id) {
  const el = $(id), pad = $(id + '_pad'), sw = $(id + '_sw'), d = $(id + '_dots');
  if (!el || !pad || !sw) return;
  const ph = (d && d.getAttribute('data-ph')) || 'أدخل الرمز';
  if (el.type === 'hidden') {
    pad.hidden = true; el.type = 'password'; el.placeholder = ph + ' (حروف وأرقام)'; el.style.marginBottom = '8px';
    sw.innerHTML = I('hash') + ' العودة للوحة الأرقام السريعة'; setTimeout(() => el.focus(), 50);
  } else {
    el.type = 'hidden'; pad.hidden = false; sw.innerHTML = I('keyboard') + ' الرمز فيه حروف؟ اضغط هنا للكتابة'; pkTap(id, '');
  }
};

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

/* ---------- شريط النظرة السريعة في الرئيسية ---------- */
function homeQuickBar() {
  const rpIn = S.rp.filter(r => r.st == 'in').length;
  const rpRd = S.rp.filter(r => r.st == 'rd').length;
  const rpTot = rpIn + rpRd;
  const need = typeof invLines == 'function' ? invLines(false).length : 0;
  return `<div class="qbar">`
    + `<button class="qpill rp" onclick="go('rp',{tab:'${rpRd ? 'rd' : 'in'}'})"><div class="qic">${ic('tool')}</div><div class="qtxt"><b>الصيانة: ${rpTot}</b><span>${rpRd ? rpRd + ' جاهز للتسليم' : (rpIn ? rpIn + ' قيد الإصلاح' : 'لا أجهزة حالياً')}</span></div></button>`
    + `<button class="qpill ${need ? 'al' : 'ok'}" onclick="go('rep')"><div class="qic">${ic(need ? 'alert' : 'check')}</div><div class="qtxt"><b>${need ? 'نواقص: ' + need : 'المخزون مكتمل'}</b><span>${need ? 'تحتاج للشراء' : 'لا توجد نواقص'}</span></div></button>`
    + `</div>`;
}
HOME.top.push(homeQuickBar);

/* ---------- الرئيسية ---------- */
const bkHide = () => { try { localStorage.setItem('bkHide', Date.now()); } catch (e) { } render(); };
VW.home = () => {
  const old = isAdmin() && (S.items.length || S.rp.length) && Date.now() - (S.cfg.lb || 0) > 7 * 864e5;
  let hid = 0; try { hid = Date.now() - (+localStorage.getItem('bkHide') || 0) < 864e5; } catch (e) { }
  const bk = old && !hid ? `<div class="bkb">${I('alert')}<span>لم تُحفظ نسخة خارجية منذ أسبوع</span><button class="btn sm" onclick="BKP()">حفظ</button><button class="bkx" onclick="bkHide()" aria-label="إغلاق">✕</button></div>` : '';
  const call = L => L.map(f => f()).join('');
  return {
    t: 'محل عزيز',
    h: bk + call(HOME.top)
      + `<input placeholder="ابحث عن هاتف، زجاج، بوشيط، صيانة..." value="${esc(Q)}" oninput="sq(this.value)"><div id="sc">${scopeChips()}</div>`
      + call(HOME.tools) + '<div id="res"></div><h3>الأقسام</h3>'
      + `<div class="grid">${SECS.map(([k, n, i]) => `<button class="card sc" onclick="go('sec',{k:'${k}'})">${ic(i)}<b>${n}</b><span class="m">${secCount(k)} صنف</span></button>`).join('')}</div>`
      + call(HOME.after),
    a: () => sq(Q)
  };
};

/* ---------- المزيد (منظم بأقسام مستقلة) ---------- */
const MG = [
  ['sec', 'أقسام المحل والوسوم', 'إعدادات الهواتف، الزجاج، البوشيط، الإكسسوارات، الصيانة، والوسوم', 'grid'],
  ['look', 'المظهر والعرض', 'الثيم، حجم الخط، الأيقونة العائمة، تلوين البطاقات، والحقول', 'palette'],
  ['rep', 'التقرير والحدود', 'تخصيص التقرير اليومي وحدود التنبيه والقفل التلقائي', 'bell'],
  ['usr', 'المستخدمون والأمان', 'حسابات الموظفين، الصلاحيات، ورمز القفل السريع', 'users'],
  ['data', 'المزامنة والنسخ الاحتياطي', 'المزامنة بين الأجهزة، حفظ واستعادة النسخ، والنسخ التلقائية', 'database']
];
VW.st = () => ({
  t: 'المزيد',
  h: MG.map(([k, t, d, icon]) => {
    const L = MORE.filter(x => x.g == k || (k == 'rep' && x.g == 'lim'));
    if (!L.length) return '';
    return `<button class="card st-card" onclick="go('st_grp',{g:'${k}'})"><div class="st-ic">${ic(icon)}</div><div class="st-txt"><b>${t}</b><div class="m">${d}</div></div><span class="st-arr">${ic('back')}</span></button>`;
  }).join('')
  + `<button class="card st-card" onclick="go('st_trash')"><div class="st-ic">${ic('trash')}</div><div class="st-txt"><b>سلة المحذوفات</b><div class="m">استرجاع ما حُذف خلال آخر 30 يوماً${S.trash.length ? ' (' + S.trash.length + ')' : ''}</div></div><span class="st-arr">${ic('back')}</span></button>`
});
VW.st_grp = () => {
  const g = V.g || 'sec', info = MG.find(x => x[0] == g) || MG[0];
  const L = MORE.filter(x => x.g == g || (g == 'rep' && x.g == 'lim')).sort((a, b) => (a.o || 50) - (b.o || 50));
  return {
    t: info[1],
    h: `<p class="m">${info[2]}</p>` + L.map(x => row(x.l, x.fn, x.n ? x.n() : '')).join('')
  };
};
MORE.push(
  { g: 'look', o: 10, l: 'الثيم وحجم الخط والأيقونة العائمة', fn: "go('st_look')" },
  { g: 'lim', o: 20, l: 'حدود النفاد والقفل التلقائي', fn: "go('st_lim')" },
  { g: 'usr', o: 10, l: 'المستخدمون والصلاحيات', fn: "go('st_users')" },
  { g: 'usr', o: 20, l: 'رمز القفل السريع', fn: 'lkSet()', n: () => S.cfg.lk ? 'مُعيَّن' : 'غير مُعيَّن' },
  { g: 'data', o: 20, l: 'النسخ الاحتياطي والاستعادة', fn: "go('st_bk')" },
  { g: 'sec', o: 60, l: 'كل الوسوم (قائمة كاملة)', fn: "go('st_tags')" }
);

/* ---------- المظهر والأيقونة العائمة ---------- */
const THM = [['a', 'تلقائي', 'يتبدّل بين النهاري والليلي مع الهاتف', ['#f4f6fa', '#0b1220', '#2563eb']], ['l', 'نقي', 'فاتح · أزرق', ['#f4f6fa', '#ffffff', '#2563eb']], ['d', 'ليل', 'داكن · أزرق', ['#0b1220', '#131c2e', '#4f8cff']], ['g', 'زمرد', 'فاتح · أخضر', ['#f2f7f4', '#ffffff', '#059669']], ['v', 'بنفسجي', 'داكن · بنفسجي', ['#130f1f', '#1c1630', '#8b5cf6']], ['w', 'دافئ', 'ورقي · برتقالي', ['#f8f3ea', '#fffdf8', '#d9480f']]];
VW.st_look = () => {
  const fabOn = S.cfg.fab !== 0;
  return {
    t: 'المظهر والعرض',
    h: '<h3>الأيقونة العائمة السريعة (لهذا الجهاز)</h3>'
      + `<button class="card row2" onclick="upd(()=>S.cfg.fab=${fabOn ? 0 : 1})"><b>زر عائم للإضافة والبحث السريع</b><span class="m">${fabOn ? 'مُفعَّل' : 'مُعطَّل'}</span></button>`
      + '<h3>الثيم (لهذا الجهاز فقط)</h3>' + THM.map(([k, n, d, c]) => { const on = (S.cfg.th || 'a') == k; return `<button class="card row2 ${on ? 'sel' : ''}" onclick="upd(()=>S.cfg.th='${k}')"><span class="sw3">${c.map(x => `<i style="background:${x}"></i>`).join('')}</span><b>${n}<div class="m" style="font-weight:400">${d}</div></b>${on ? I('check') : ''}</button>`; }).join('')
      + '<h3>حجم الخط</h3>' + [[15, 'صغير'], [17, 'عادي'], [19, 'كبير'], [21, 'أكبر']].map(([v, l]) => `<button class="tag ${S.cfg.fs == v ? 'on' : ''}" onclick="upd(()=>S.cfg.fs=${v})">${l}</button>`).join('')
  };
};

/* ---------- الأيقونة العائمة الذكية (FAB) ---------- */
function fabAct() {
  if (V.v == 'sec') {
    if (V.k == 'phones') return phAdd();
    if (V.k == 'glass') return glAdd();
    if (V.k == 'case') return csAdd();
    if (V.k == 'acc') return acAdd();
  }
  if (V.v == 'rp') return rEd(null);
  if (V.v == 'gd') return gdEd(null);
  $('sh').innerHTML = `<div class="bar"></div><h3>إجراء سريع</h3>`
    + `<button class="btn" onclick="finish(1)">${I('mobile')} + إضافة هاتف</button>`
    + `<button class="btn s" onclick="finish(2)">${I('tool')} + استلام صيانة</button>`
    + `<button class="btn s" onclick="finish(3)">${I('scan')} مسح باركود أو IMEI</button>`
    + `<button class="btn s" onclick="finish(4)">${I('chat')} تسجيل طلب زبون</button>`
    + `<button class="btn s" onclick="finish(null)">إلغاء</button>`;
  sheetOpen(w => {
    if (w == 1) phAdd();
    else if (w == 2) rEd(null);
    else if (w == 3) bcHome();
    else if (w == 4) rq();
  });
}
function fabUpd() {
  let el = $('fab');
  if (!el) {
    document.body.insertAdjacentHTML('beforeend', '<div id="fab" hidden></div>');
    el = $('fab');
  }
  const show = S.cfg.fab !== 0 && ['home', 'sec', 'rp', 'gd'].includes(V.v);
  el.hidden = !show;
  if (!show) return;
  el.innerHTML = (V.v != 'home' ? `<button class="fab-b s" onclick="goSearch()" aria-label="بحث">${ic('search')}</button>` : '')
    + `<button class="fab-b" onclick="fabAct()" aria-label="إضافة">${ic('plus')}</button>`;
}
const _origRender = render;
render = function () { _origRender(); fabUpd(); };

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
  ask('مستخدم جديد', [{ k: 'n', l: 'الاسم' }, { k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: 'موظف' }, { k: 'p', l: 'رمز الموظف بالأرقام (إجباري للموظف، 4 على الأقل)', t: 'password' }]).then(v => {
    if (!v || !v.n.trim()) return;
    const isA = v.r == 'مدير';
    if (!isA && !(v.p && v.p.length >= 4)) return toast('رمز الموظف إجباري (4 أرقام على الأقل)');
    upd(() => { const u = { name: v.n.trim(), admin: isA }; if (!isA) u.pin = hs(v.p); S.users.push(u); });
  });
});
const uEd = needAdm(function (i) {
  const u = S.users[i];
  const F = [{ k: 'r', l: 'الدور', t: 'sel', o: ['موظف', 'مدير'], v: u.admin ? 'مدير' : 'موظف' }, { k: 'p', l: 'رمز جديد للموظف (فارغ = بلا تغيير)' + (u.pin ? ' — له رمز حالياً' : ''), t: 'password' }];
  F.push({ k: 'x', l: 'حذف المستخدم؟', t: 'sel', o: ['لا', 'نعم'], v: 'لا' });
  ask(u.name, F).then(v => {
    if (!v) return;
    if ((v.x == 'نعم' || v.r == 'موظف') && u.admin && adm() < 2) return toast('يجب أن يبقى مدير واحد على الأقل');
    if (v.x != 'نعم' && v.r == 'موظف' && v.p && v.p.length < 4) return toast('الرمز 4 أرقام على الأقل');
    if (v.x != 'نعم' && v.r == 'موظف' && !u.pin && !v.p) return toast('رمز الموظف إجباري: اكتب رمزاً جديداً للموظف');
    upd(() => {
      if (v.x == 'نعم') S.users.splice(i, 1);
      else { u.admin = v.r == 'مدير'; if (u.admin) delete u.pin; else if (v.p) u.pin = hs(v.p); }
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
async function bkKey(pin) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode('aziz-bk-v1'), iterations: 150000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function bkEncObj(obj, pin) {
  const key = await bkKey(pin), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  let s = ''; for (let i = 0; i < out.length; i += 8192)s += String.fromCharCode.apply(null, out.subarray(i, i + 8192));
  return btoa(s);
}
async function bkDecObj(b64, pin) {
  const key = await bkKey(pin), u = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12) }, key, u.subarray(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function makeSafeBackupJson(pinOrHash) {
  const copy = JSON.parse(JSON.stringify(S));
  const resMap = {};
  (copy.items || []).forEach(i => { if (i.res) { resMap[i.id] = i.res; delete i.res; } });
  const custData = { rp: copy.rp || [], req: copy.req || [], res: resMap, trash: (copy.trash || []).filter(t => t.coll == 'rp') };
  copy._encCust = await bkEncObj(custData, pinOrHash);
  copy.rp = []; copy.req = []; copy.trash = (copy.trash || []).filter(t => t.coll != 'rp');
  delete copy.pin; if (copy.cfg) delete copy.cfg.lk;
  (copy.users || []).forEach(u => delete u.pin);
  return JSON.stringify(copy);
}

let AB_T = 0, AB_FH = null;
/* النسخ التلقائية داخل الهاتف (IndexedDB): آخر حفظ + نسخة يومية (آخر 7 أيام) + نسخة قبل كل استعادة (آخر 3). الصور تُستثنى لخفة الحجم. */
function bkCopy() { return JSON.parse(JSON.stringify(S, function (k, v) { return (k === 'img' && typeof v === 'string' && v.startsWith('data:') && this.id) ? 'idb:' + this.id : v; })); }
const bkSize = d => (d.items || []).length + (d.rp || []).length + (d.gg || []).length;
function bkPrune(pre, n) { AUTOBK.all().then(all => Object.keys(all).filter(k => k.startsWith(pre)).sort().reverse().slice(n).forEach(k => AUTOBK.del(k))).catch(() => { }); }
function snapPre() {
  if (!S.users.length) return Promise.resolve();
  return AUTOBK.put('pre:' + Date.now(), { at: Date.now(), data: bkCopy() }).then(() => bkPrune('pre:', 3)).catch(() => { });
}
function schedAutoBk() {
  clearTimeout(AB_T);
  AB_T = setTimeout(async () => {
    try {
      if (!S.users.length) return;   // لا نحفظ حالة فارغة فوق نسخة سليمة
      const rec = { at: Date.now(), data: bkCopy() }, d = new Date(), p = n => String(n).padStart(2, '0');
      await AUTOBK.put('latest', rec);
      const k = 'd:' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      if (!(await AUTOBK.get(k))) { await AUTOBK.put(k, rec); bkPrune('d:', 7); }
      if (AB_FH && S.pin) { const w = await AB_FH.createWritable(); await w.write(await makeSafeBackupJson(S.pin)); await w.close(); }
    } catch (e) { errLog('نسخة تلقائية: ' + (e && e.message || e)); }
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
function restSnap(key) {
  if (!isAdmin()) return toast('للمدير فقط');
  AUTOBK.get(key).then(rec => {
    if (!rec || !rec.data) return toast('لا توجد هذه النسخة');
    sure('استعادة نسخة ' + fd(rec.at) + ' (' + bkSize(rec.data) + ' سجلاً)؟ يُحفظ وضعك الحالي أولاً كنسخة «قبل استعادة».', 'استعادة').then(y => {
      if (y) snapPre().then(() => { LOAD_BAD = 0; S = { ...load(), ...rec.data }; save(); location.reload(); });
    });
  }).catch(() => toast('تعذر قراءة النسخة'));
}
VW.st_snap = () => ({ t: 'النسخ التلقائية', h: '<p class="m">نسخ داخل الهاتف تُحفظ تلقائياً. الصور لا تدخل فيها. لا تغني عن ملف النسخة الأسبوعي.</p><div id="snl" class="m">جارٍ التحميل…</div>', a: snapList });
function snapList() {
  AUTOBK.all().then(all => {
    const L = Object.keys(all).filter(k => all[k] && all[k].data).sort((x, y) => all[y].at - all[x].at);
    const nm = k => k == 'latest' ? 'آخر حفظ' : k.startsWith('d:') ? 'يومية' : 'قبل استعادة';
    const el = $('snl'); if (!el) return;
    el.innerHTML = L.map(k => { const r = all[k]; return `<div class="card row2"><div style="flex:1"><b>${nm(k)}</b><div class="m"><bdi>${fd(r.at)}</bdi> · ${bkSize(r.data)} سجلاً</div></div><button class="btn s sm" onclick="restSnap('${k}')">استعادة</button></div>`; }).join('') || 'لا توجد نسخ بعد';
  }).catch(() => { const el = $('snl'); if (el) el.textContent = 'تعذر قراءة النسخ'; });
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
        const pre = snapPre();
        if (!d._encCust) { pre.then(() => { S = { ...load(), ...d }; save(); location.reload(); }); return; }
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
function abStatus() {
  AUTOBK.get('latest').then(r => {
    const el = $('st_ab'); if (!el) return;
    const old = !r || Date.now() - r.at > 2 * 864e5;
    el.innerHTML = r ? (old ? I('alert') + ' آخر نسخة تلقائية قديمة: <bdi>' + fd(r.at) + '</bdi>' : I('check') + ' آخر نسخة تلقائية: <bdi>' + fd(r.at) + '</bdi>') : I('alert') + ' لا توجد نسخة تلقائية بعد';
    if (old) el.style.color = '#dc2626';
  }).catch(() => { const el = $('st_ab'); if (el) { el.innerHTML = I('alert') + ' تعذر قراءة النسخ التلقائية'; el.style.color = '#dc2626'; } });
}
VW.st_bk = () => {
  const n = (localStorage.getItem('shop3') || '').length, p = Math.round(n / 5e4), er = JSON.parse(localStorage.getItem('shopErr') || '[]');
  return {
    t: 'النسخ الاحتياطي',
    h: '<p class="m">يتم تشفير بيانات الزبائن الحساسة (الصيانة، الطلبات، الحجوزات) داخل ملف النسخة الاحتياطية لحمايتها من التسريب.</p>'
      + '<button class="btn" onclick="BKP()">حفظ ملف النسخة في الهاتف (محمي)</button>'
      + (window.showSaveFilePicker ? `<button class="btn s" onclick="linkAutoFile()">${AB_FH ? I('check') + ' مرتبط بملف تلقائي (اضغط لتغييره)' : 'ربط ملف حفظ تلقائي مباشر بالهاتف'}</button>` : '')
      + '<button class="btn s" onclick="go(\'st_snap\')">النسخ التلقائية الداخلية (آخر 7 أيام)</button>'
      + '<label>استعادة من ملف خارجي<input type="file" accept=".json" onchange="RST(this.files[0])"></label>'
      + `<h3>المساحة المستعملة</h3><div class="card"><div class="row2"><b>${p}%</b><span class="m">${(n / 1e6).toFixed(1)} مليون حرف من نحو 5</span></div><div class="meter"><div style="width:${Math.min(100, p)}%;background:${p > 70 ? '#dc2626' : 'var(--p)'}"></div></div>${p > 70 ? '<p class="m">اقتربت المساحة من الامتلاء. خذ نسخة احتياطية الآن.</p>' : ''}</div>`
      + `<div class="card"><b>خزنة الصور (IndexedDB)</b><div class="m">صور الصيانة المحفوظة خارج ذاكرة المتصفح الضيقة: <b>${Object.keys(IMG).length}</b> (لا تستهلك من حد الـ 5 ميجابايت).</div></div>`
      + '<div id="st_ab" class="m" style="margin:8px 0"></div>'
      + (er.length ? '<h3>آخر الأخطاء (للتشخيص)</h3>' + er.map(x => `<div class="m">${esc(x)}</div>`).join('') : '')
    , a: abStatus
  };
};

/* ---------- الإقلاع ---------- */
$('bk').innerHTML = ic('back'); $('srb').innerHTML = ic('search'); $('lkb').innerHTML = I('lock'); $('syb').innerHTML = I('cloud');
S.trash = S.trash.filter(t => Date.now() - t.t < 2592e6);
try { navigator.storage.persist(); } catch (e) { }
startHistory();
render();
function boot2() {
  if (!S.users.length) { admSet(true); setup(); }
  else if (S.pin && ((isAdmin() && !admOk()) || !S.users.some(u => u.name == S.me))) lgShow();
  try { if (localStorage.getItem('shopLock') == '1' && (S.cfg.lk || S.pin)) lkShow(); } catch (e) { }
}
function bkBest() {
  return AUTOBK.all().then(all => {
    let b = null;
    Object.keys(all).forEach(k => { const r = all[k]; if (r && r.data && (r.data.users || []).length) { const z = bkSize(r.data); if (!b || z > b.z || (z == b.z && r.at > b.rec.at)) b = { k, rec: r, z }; } });
    return b;
  });
}
function bootRescue() {
  const go2 = () => { LOAD_BAD = 0; boot2(); };
  if (!(LOAD_BAD || !S.users.length)) return boot2();
  bkBest().then(b => {
    if (!b) return go2();
    sure('لا توجد بيانات سليمة على هذا الجهاز، لكن وُجدت نسخة تلقائية بتاريخ ' + fd(b.rec.at) + ' فيها ' + b.z + ' سجلاً. استعادتها؟', 'استعادة', false).then(y => {
      if (!y) return go2();
      LOAD_BAD = 0; S = { ...load(), ...b.rec.data }; save(); location.reload();
    });
  }).catch(go2);
}
bootRescue();
imgInit();
