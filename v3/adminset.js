/* ============================================================
   adminset.js — تحكمات المدير للعمل اليومي: هوية المحل وأيام العطلة،
   الجولة اليومية، قاموس البحث والمترادفات، قوالب رسائل الواتساب، والتشخيص.
   يُحمَّل بعد backup.js وقبل app.js.
   ============================================================ */
const AS_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AS_WA_DEF = {
  rp_ok: 'مرحباً {الزبون}، هاتفك {الجهاز} جاهز في المحل.{التكلفة}\n— {المحل}',
  rp_fail: 'مرحباً {الزبون}، للأسف تعذّر إصلاح هاتفك {الجهاز}. يمكنك استلامه من المحل.{التكلفة}\n— {المحل}',
  rp_ref: 'مرحباً {الزبون}، هاتفك {الجهاز} جاهز للاستلام بدون إصلاح.{التكلفة}\n— {المحل}',
  debt: 'السلام عليكم {الزبون}، نتمنى أن تكونوا بخير.\nتذكير ودي بخصوص الحساب: {التفاصيل}.\n— {المحل}',
  req: 'مرحباً، بخصوص طلبك ({الطلب}) فقد توفرت لدينا في {المحل}. مرحباً بك!'
};
const AS_WA_META = [
  ['rp_ok', 'صيانة: جاهز (تم الإصلاح)', ['الزبون', 'الجهاز', 'التكلفة', 'المحل'], { الزبون: 'أحمد', الجهاز: 'Samsung A15 (تذكرة #A104)', التكلفة: ' تكلفة الإصلاح: 200 درهم.' }],
  ['rp_fail', 'صيانة: تعذّر الإصلاح', ['الزبون', 'الجهاز', 'التكلفة', 'المحل'], { الزبون: 'أحمد', الجهاز: 'Samsung A15 (تذكرة #A104)', التكلفة: '' }],
  ['rp_ref', 'صيانة: رفض الإصلاح', ['الزبون', 'الجهاز', 'التكلفة', 'المحل'], { الزبون: 'أحمد', الجهاز: 'Samsung A15 (تذكرة #A104)', التكلفة: '' }],
  ['debt', 'تذكير الدين (الكريدي)', ['الزبون', 'التفاصيل', 'المحل'], { الزبون: 'كريم', التفاصيل: 'المبلغ المتبقي هو 150 درهم (تغيير شاشة)' }],
  ['req', 'توفر طلب زبون (سأل ولم نجد)', ['الطلب', 'المحل'], { الطلب: 'بوشيط Samsung A54' }]
];
function waMsg(key, vars) {
  const tpl = (S && S.cfg && S.cfg.wa && S.cfg.wa[key]) || AS_WA_DEF[key] || '';
  const all = { المحل: shopName(), ...(vars || {}) };
  return tpl.replace(/\{([^}]+)\}/g, (_, k) => all[k] != null ? String(all[k]) : '');
}
/* ---------- 1. هوية المحل وأيام العطلة الموحّدة ---------- */
function asShopEd() {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  ask('اسم المحل', [{ k: 'n', l: 'يظهر في عنوان التطبيق وتوقيع رسائل الواتساب', v: shopName() }]).then(v => {
    if (!v) return;
    const n = v.n.trim();
    upd(() => {
      if (!n || n == 'المحل') delete S.cfg.shop;
      else S.cfg.shop = n;
    });
  });
}
function asNcTog() {
  if (!isAdmin()) return toast('للمدير فقط');
  upd(() => { S.cfg.nc = S.cfg.nc === 0 ? 1 : 0; });
}
addEventListener('contextmenu', e => {
  if (S.cfg.nc === 0 || !e.target.closest) return;
  if (e.target.closest('input,textarea,select,[contenteditable]')) return;
  if (e.target.closest('button,.card,.tag,summary,[onclick]')) e.preventDefault();
});
function asOffTog(i) {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  const cur = offDays().slice(), k = cur.indexOf(i);
  k < 0 ? cur.push(i) : cur.splice(k, 1);
  cur.sort((a, b) => a - b);
  upd(() => {
    S.cfg.offDays = cur;
    if (S.cfg.rc) S.cfg.rc.nd = cur.slice();
  });
}
VW.st_shop = () => {
  const od = offDays();
  return {
    t: 'هوية المحل وأيام العطلة',
    h: '<p class="m">تتزامن هذه الإعدادات تلقائياً على كل أجهزة المحل.</p>'
      + '<h3>اسم المحل</h3>'
      + row('الاسم الظاهر والتوقيع', 'asShopEd()', shopName())
      + '<h3>أيام العطلة الأسبوعية</h3>'
      + '<p class="m">في أيام العطلة يتوقف تذكير التقرير اليومي وتذكير التعبئة الصباحي تلقائياً.</p>'
      + `<div class="card"><div class="rp-chip-box">${AS_DAYS.map((n, i) => `<button type="button" class="tag ${od.includes(i) ? 'on' : ''}" onclick="asOffTog(${i})">${n}</button>`).join('')}</div>`
      + `<div class="m">${od.length ? 'أيام العطلة المختارة: <b>' + od.map(i => AS_DAYS[i]).join('، ') + '</b>' : 'لا توجد أيام عطلة محددة (التذكيرات تعمل كل الأيام)'}</div></div>`
      + '<h3>الضغط المطوّل</h3>'
      + swRow('منع قائمة النسخ واللصق على الأزرار والبطاقات', 'asNcTog()', S.cfg.nc !== 0, 'حقول الإدخال تبقى تسمح بالنسخ واللصق دائماً')
  };
};
/* ---------- 2. الجرد والجولة اليومية ---------- */
const AS_JR_SECS = [['phones', 'الهواتف'], ['glass', 'الأنتي كاس'], ['case', 'البوشيط'], ['acc', 'الإكسسوارات'], ['tp', 'التعبئة']];
const AS_JR_ALL = { e: 'متاح للجميع', a: 'للمدير فقط', o: 'مخفي' };
function asJrTog(k) {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  upd(() => {
    S.cfg.jrx = { ...(S.cfg.jrx || {}) };
    S.cfg.jrx[k] = jlx(k) ? 0 : 1;
  });
}
function asJrAll() {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  const ord = ['e', 'a', 'o'], nx = ord[(ord.indexOf(jlx('all')) + 1) % ord.length];
  upd(() => { S.cfg.jrx = { ...(S.cfg.jrx || {}), all: nx }; });
}
function asJrSo() {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  upd(() => { S.cfg.jrx = { ...(S.cfg.jrx || {}), so: jlx('so') == 'n' ? 'o' : 'n' }; });
}
function asJrSec(s) {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  if (s == 'tp') return typeof tpxTog == 'function' ? tpxTog('jl') : null;
  const hs = (jlx('hs') || []).slice(), idx = hs.indexOf(s);
  if (idx < 0) hs.push(s); else hs.splice(idx, 1);
  upd(() => { S.cfg.jrx = { ...(S.cfg.jrx || {}), hs }; });
}
VW.st_rnd = () => {
  const stl = typeof rnd == 'function' ? rnd(false).length : 0;
  return {
    t: 'الجرد والجولة اليومية',
    h: '<p class="m">تنبهك الجولة اليومية بالأصناف التي لم يتغير عددها أو لم تُؤكَّد منذ المدة المحددة (متزامن لكل الأجهزة).</p>'
      + `<div class="card row2"><div class="f1"><b>الحالة الآن</b><div class="m">${stl ? arCnt(stl, 'صنف غير مؤكد', 'صنفان غير مؤكدين', 'أصناف غير مؤكدة', 'صنفاً غير مؤكد') : 'كل الأصناف مؤكدة حديثاً ✓'}</div></div><button class="btn sm" onclick="go('jl')">افتح الجرد</button></div>`
      + row('يُعتبر الصنف غير مؤكد بعد (أيام)', "limEd('stale')", lim('stale') + ' يوم')
      + '<h3>الأقسام المشمولة في تنبيه «غير مؤكد»</h3>'
      + '<p class="m">الأزرق = يظهر في تنبيهات «غير مؤكد». الأقسام المعطّلة تبقى متاحة متى أردت في «جرد شامل للقسم».</p>'
      + `<div class="card"><div class="rp-chip-box">${AS_JR_SECS.map(([s, l]) => `<button type="button" class="tag ${jlSecOn(s) ? 'on' : ''}" onclick="asJrSec('${s}')">${l}</button>`).join('')}</div></div>`
      + '<h3>سلوك الجرد والتأكيد</h3>'
      + swRow('استبعاد الموقوف شراؤها من تنبيه «غير مؤكد»', "asJrTog('ns')", !!jlx('ns'), 'تبقى ظاهرة في «جرد شامل للقسم»')
      + swRow('استبعاد الأصناف المنتهية (العدد 0) من تنبيه «غير مؤكد»', "asJrTog('nz')", !!jlx('nz'), 'المنتهي يظل في التقرير اليومي وفي «جرد شامل»')
      + swRow('تأكيد الصنف تلقائياً عند تعديل عدده (− / +) داخل الجرد', "asJrTog('ac')", !!jlx('ac'))
      + row('زر «تأكيد كل القائمة الظاهرة»', 'asJrAll()', AS_JR_ALL[jlx('all')] || AS_JR_ALL.e)
      + row('الترتيب الافتراضي في «جرد شامل للقسم»', 'asJrSo()', jlx('so') == 'n' ? 'حسب الماركة والاسم (كالرفوف)' : 'الأقدم تأكيداً أولاً')
  };
};
/* ---------- 3. قاموس البحث والمترادفات ---------- */
let AS_DQ = '';
function asDictList() {
  const q = nzRaw(AS_DQ || '').trim(), ed = isAdmin() || !S.users.length;
  const custom = (S.cfg && S.cfg.al) || {}, cKeys = Object.keys(custom);
  const match = (k, v) => !q || nzRaw(k).includes(q) || nzRaw(v).includes(q);
  const cRows = cKeys.filter(k => match(k, custom[k])).map(k => {
    const v = custom[k], isOff = v === '', inBase = k in AL_BASE;
    const badge = isOff ? '<span class="rp-badge bad">معطّل</span>' : inBase ? '<span class="rp-badge warn">معدّل</span>' : '<span class="rp-badge ok">مضاف</span>';
    return `<div class="dict-row"><div class="f1"><b><bdi>${esc(k)}</bdi></b> <span class="m">←</span> <bdi class="ltr">${isOff ? '—' : esc(v)}</bdi> ${badge}</div>`
      + (ed ? `<button class="btn s sm" onclick="asDictEd('${encodeURIComponent(k)}')">تعديل</button><button class="btn s sm del" onclick="asDictDel('${encodeURIComponent(k)}')">${inBase ? 'استرجاع' : 'حذف'}</button>` : '')
      + `</div>`;
  }).join('');
  const baseKeys = Object.keys(AL_BASE).filter(k => !(k in custom) && match(k, AL_BASE[k]));
  const bRows = baseKeys.map(k => `<div class="dict-row"><div class="f1"><b><bdi>${esc(k)}</bdi></b> <span class="m">←</span> <bdi class="ltr">${esc(AL_BASE[k])}</bdi></div>`
    + (ed ? `<button class="btn s sm" onclick="asDictEd('${encodeURIComponent(k)}')">تعديل</button>` : '') + `</div>`).join('');
  return (cKeys.length ? `<h3>مترادفاتك المضافة والمعدّلة (${cKeys.length})</h3><div class="card rlist">${cRows || '<p class="m">لا توجد نتائج في إضافاتك</p>'}</div>` : '')
    + `<details class="card" ${q ? 'open' : ''}><summary><b>القاموس الأساسي المدمج</b> <span class="m">(${baseKeys.length} كلمة)</span></summary><div class="rlist" style="padding:4px 0 0">${bRows || '<p class="m">لا نتائج</p>'}</div></details>`;
}
function asDictF(q) {
  AS_DQ = q;
  const b = $('as_dl'); if (b) b.innerHTML = asDictList();
}
function asDictTest(q) {
  const b = $('as_dt'); if (!b) return;
  const t = String(q || '').trim();
  b.innerHTML = t ? `يفهمها البحث كـ: <b class="ltr">${esc(nz(t))}</b>` : 'اكتب أي كلمة بالدارجة أو العربية لترى كيف يوحّدها البحث فوراً.';
}
function asDictEd(encK) {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  const oldK = encK ? decodeURIComponent(encK) : '', inBase = oldK && (oldK in AL_BASE);
  const custom = (S.cfg && S.cfg.al) || {};
  const curV = oldK ? (oldK in custom ? custom[oldK] : AL_BASE[oldK] || '') : '';
  const F = [
    { k: 'k', l: 'الكلمة التي قد يكتبها الموظف (دارجة / عربي / فرنسي)', v: oldK },
    { k: 'v', l: 'الكلمة المقابلة الموحّدة (مثال: glass أو headset أو samsung)' + (inBase ? ' — اتركها فارغة لتعطيل المترادف' : ''), v: curV }
  ];
  ask(oldK ? 'تعديل مترادف' : 'إضافة مترادف للبحث', F).then(v => {
    if (!v) return;
    const nk = nzRaw(v.k).trim(), nv = nzRaw(v.v).trim();
    if (nk.length < 2) return toast('اكتب كلمة من حرفين على الأقل');
    if (!nv && !(nk in AL_BASE)) return toast('اكتب الكلمة المقابلة');
    upd(() => {
      S.cfg.al = { ...(S.cfg.al || {}) };
      if (oldK && oldK != nk && !(oldK in AL_BASE)) delete S.cfg.al[oldK];
      if ((nk in AL_BASE) && nv === AL_BASE[nk]) delete S.cfg.al[nk];
      else S.cfg.al[nk] = nv;
      if (!Object.keys(S.cfg.al).length) delete S.cfg.al;
    });
  });
}
function asDictDel(encK) {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  const k = decodeURIComponent(encK);
  upd(() => {
    if (!S.cfg.al) return;
    delete S.cfg.al[k];
    if (!Object.keys(S.cfg.al).length) delete S.cfg.al;
  });
}
function asDictReset() {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  sure('إرجاع قاموس البحث إلى الكلمات الافتراضية فقط؟', 'إرجاع').then(y => {
    if (y) upd(() => { delete S.cfg.al; });
  });
}
VW.st_dict = () => {
  const ed = isAdmin() || !S.users.length, hasC = !!(S.cfg.al && Object.keys(S.cfg.al).length);
  return {
    t: 'قاموس البحث والمترادفات',
    h: '<p class="m">يساعد البحث على فهم الكلمات بالدارجة والعربية والفرنسية والإنجليزية (مثلاً: «گلاس» ← «glass»، «كيت» ← «headset»). يتزامن لكل الأجهزة.</p>'
      + (ed ? '<button class="btn" onclick="asDictEd(\'\')">+ إضافة مترادف جديد</button>' : '<p class="m">التعديل للمدير فقط.</p>')
      + '<div class="card"><label style="margin-top:0">تجربة فورية للبحث</label><input placeholder="جرّب: افيشور ايفون 13 أو شارجور تايب سي..." oninput="asDictTest(this.value)"><div id="as_dt" class="m" style="margin-top:6px">اكتب أي كلمة بالدارجة أو العربية لترى كيف يوحّدها البحث فوراً.</div></div>'
      + `<input placeholder="ابحث داخل القاموس..." value="${esc(AS_DQ)}" oninput="asDictF(this.value)">`
      + `<div id="as_dl">${asDictList()}</div>`
      + (ed && hasC ? '<button class="btn s" style="margin-top:10px" onclick="asDictReset()">إرجاع القاموس الافتراضي</button>' : '')
  };
};
/* ---------- 4. قوالب رسائل الواتساب الـ 3 ---------- */
function asWaIns(tag) {
  const el = $('wa_txt'); if (!el) return;
  const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, s) + tag + el.value.slice(e);
  el.focus();
  try { el.setSelectionRange(s + tag.length, s + tag.length); } catch (x) { }
}
function asWaEd(key) {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  const meta = AS_WA_META.find(x => x[0] == key); if (!meta) return;
  const cur = (S.cfg.wa && S.cfg.wa[key]) || AS_WA_DEF[key];
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(meta[1])}</h3>`
    + '<p class="m">اضغط على أي متغير لإدراجه في الرسالة (يُستبدل تلقائياً عند الإرسال):</p>'
    + `<div class="wa-vars">${meta[2].map(v => `<button type="button" class="tag" onclick="asWaIns('{${v}}')">{${esc(v)}}</button>`).join('')}</div>`
    + `<label>نص الرسالة<textarea id="wa_txt" rows="5">${esc(cur)}</textarea></label>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn s" onclick="finish('__DEF__')">الافتراضي</button><button class="btn" onclick="finish($('wa_txt').value.trim())">حفظ</button></div>`;
  sheetOpen(v => {
    if (v === null) return;
    upd(() => {
      S.cfg.wa = { ...(S.cfg.wa || {}) };
      if (!v || v === '__DEF__' || v === AS_WA_DEF[key]) delete S.cfg.wa[key];
      else S.cfg.wa[key] = v;
      if (!Object.keys(S.cfg.wa).length) delete S.cfg.wa;
    });
  });
}
function asWaReset() {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  sure('إرجاع كل رسائل الواتساب للنصوص الافتراضية؟', 'إرجاع').then(y => {
    if (y) upd(() => { delete S.cfg.wa; });
  });
}
VW.st_wa = () => {
  const ed = isAdmin() || !S.users.length, custom = (S.cfg && S.cfg.wa) || {};
  return {
    t: 'قوالب رسائل الواتساب',
    h: '<p class="m">تخصيص نصوص رسائل الواتساب اليدوية (الصيانة، الديون، وطلبات الزبائن). اضغط على أي رسالة لتعديلها.</p>'
      + AS_WA_META.map(([k, title, , sample]) => `<div class="card ${ed ? 'rp-click' : ''}" ${ed ? `onclick="asWaEd('${k}')"` : ''}><div class="row2"><b>${esc(title)}</b>${custom[k] ? '<span class="rp-badge ok">مخصّص</span>' : '<span class="m">افتراضي</span>'}</div><div class="wa-pv">${esc(waMsg(k, sample))}</div></div>`).join('')
      + (ed && Object.keys(custom).length ? '<button class="btn s" onclick="asWaReset()">إرجاع كل الرسائل للافتراضي</button>' : '')
  };
};
/* ---------- 5. حالة النظام والتشخيص ---------- */
function asAppVer() {
  try {
    const lk = document.querySelector('link[href*="style.css?v="]');
    const m = lk && lk.getAttribute('href').match(/\?v=(\d+)/);
    return m ? 'v' + m[1] : 'v3';
  } catch (e) { return 'v3'; }
}
function asDiagText() {
  const n = (localStorage.getItem('shop3') || '').length, p = Math.round(n / 5e4);
  const er = JSON.parse(localStorage.getItem('shopErr') || '[]');
  const sy = typeof syCfg == 'function' && syCfg().on ? (SYM[SYS.st] || SYS.st) : 'متوقفة';
  return [
    'تقرير تشخيص التطبيق (بدون بيانات زبائن)',
    'الإصدار: ' + asAppVer(),
    'التخزين: ' + p + '% (' + (n / 1e6).toFixed(2) + 'M / 5M)',
    'خزنة الصور: ' + Object.keys(IMG).length,
    'المزامنة: ' + sy,
    'السجلات: هواتف ' + ph().length + ' | زجاج ' + (S.gg || []).length + ' | بوشيط ' + S.items.filter(i => i.sec == 'case').length + ' | إكسسوارات ' + S.items.filter(i => i.sec == 'acc').length + ' | صيانة ' + (S.rp || []).length + ' | ديون ' + (S.debt || []).length + ' | مستعمل ' + (S.used || []).length + ' | سلة ' + (S.trash || []).length,
    'الأخطاء (' + er.length + '):',
    ...(er.length ? er : ['لا توجد أخطاء مسجلة'])
  ].join('\n');
}
function asDiagCopy() {
  navigator.clipboard.writeText(asDiagText()).then(() => toast('تم نسخ تقرير التشخيص (خالي من بيانات الزبائن)')).catch(() => toast('تعذّر النسخ'));
}
function asDiagClear() {
  if (!isAdmin() && S.users.length) return toast('للمدير فقط');
  try { localStorage.removeItem('shopErr'); } catch (e) { }
  render(); toast('تم مسح سجل الأخطاء');
}
VW.st_diag = () => {
  const n = (localStorage.getItem('shop3') || '').length, p = Math.round(n / 5e4);
  const er = JSON.parse(localStorage.getItem('shopErr') || '[]');
  const sy = typeof syCfg == 'function' && syCfg().on ? (SYM[SYS.st] || SYS.st) : 'متوقفة';
  const cnts = [
    ['الهواتف', ph().length], ['مجموعات الزجاج', (S.gg || []).length],
    ['البوشيط', S.items.filter(i => i.sec == 'case').length], ['الإكسسوارات', S.items.filter(i => i.sec == 'acc').length],
    ['الصيانة', (S.rp || []).length], ['الديون', (S.debt || []).length],
    ['المستعمل', (S.used || []).length], ['الطلبات', (S.req || []).length], ['التعبئة', (S.tp || []).length]
  ];
  return {
    t: 'حالة النظام والتشخيص',
    h: `<div class="card"><div class="row2"><b>الإصدار الحالي</b><span class="tk-b">${esc(asAppVer())}</span></div><div class="row2" style="margin-top:6px"><b>المزامنة</b><span class="m">${esc(sy)}</span></div></div>`
      + `<h3>المساحة والصور</h3><div class="card"><div class="row2"><b>الذاكرة المحلية: ${p}%</b><span class="m">${(n / 1e6).toFixed(2)} من 5 مليون حرف</span></div><div class="meter"><div style="width:${Math.min(100, p)}%;background:${p > 70 ? '#dc2626' : 'var(--p)'}"></div></div><div class="m" style="margin-top:8px">صور الصيانة والمستعمل في خزنة IndexedDB: <b>${Object.keys(IMG).length}</b> (لا تستهلك من حد الـ 5 ميجابايت).</div></div>`
      + `<h3>ملخص السجلات</h3><div class="jl-sum-grid">${cnts.map(([l, c]) => `<div class="jl-sum-pill"><b>${c}</b><small>${l}</small></div>`).join('')}</div>`
      + `<h3>سجل آخر الأخطاء (${er.length})</h3><div class="card">${er.length ? er.map(x => `<div class="m" style="margin:4px 0">• ${esc(x)}</div>`).join('') : '<div class="m">لا توجد أخطاء مسجلة — التطبيق يعمل بسلاسة ✓</div>'}</div>`
      + `<div class="pair-grid"><button class="btn" onclick="asDiagCopy()">نسخ تقرير التشخيص</button>${er.length && (isAdmin() || !S.users.length) ? '<button class="btn s del" onclick="asDiagClear()">مسح السجل</button>' : ''}</div>`
  };
};
/* ---------- التسجيل في قائمة المزيد ---------- */
MORE.push(
  { g: 'work', o: 10, l: 'هوية المحل وأيام العطلة', d: 'اسم المحل وتوقيعه، وأيام العطلة الموحّدة للتقرير والتعبئة', fn: "go('st_shop')", n: () => shopName() },
  { g: 'work', o: 30, l: 'الجرد والجولة اليومية', d: 'مدة التنبيه، الأقسام المشمولة، وسلوك التأكيد والترتيب', fn: "go('st_rnd')", n: () => lim('stale') + ' يوم' },
  { g: 'work', o: 40, l: 'قاموس البحث والمترادفات', d: 'إضافة وتعديل كلمات الدارجة والعربية والفرنسية لفهم البحث', fn: "go('st_dict')", n: () => (S.cfg.al && Object.keys(S.cfg.al).length) ? '+' + Object.keys(S.cfg.al).length : '' },
  { g: 'work', o: 50, l: 'قوالب رسائل الواتساب', d: 'تخصيص رسائل الجاهزية وتذكير الدين وتوفر طلب الزبون', fn: "go('st_wa')" },
  { g: 'adm', o: 50, l: 'حالة النظام والتشخيص', d: 'المساحة، خزنة الصور، الإصدار، وسجل الأخطاء', fn: "go('st_diag')", n: () => asAppVer() }
);