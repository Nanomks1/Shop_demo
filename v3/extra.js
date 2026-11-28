/* ============================================================
   extra.js — شراء المستعمل · الديون · الإحصائيات
   يُحمَّل بعد sync.js وقبل home.js. يسجّل نفسه في VW/HOME/MORE/SRCH/BCM/HK.
   البيانات: S.used (شراء المستعمل) · S.debt (الديون) — وكلاهما يُزامَن ويُشفَّر مع بيانات الزبائن.
   ============================================================ */
Object.assign(IC, {
  wallet: '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 9v9M17 5v13"/>',
  idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4M5 16c.6-1.2 1.7-2 3-2s2.4.8 3 2"/>'
});
/* قراءة المبالغ: الفاصلة عشرية («12,5» = 12.5) إلا فاصل الآلاف («1,500» = 1500)، مع تقريب لخانتين */
const xn = s => {
  let t = dg(s || '').replace(/[٬\s]/g, '').replace(/٫/g, '.');
  t = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  return Math.round((parseFloat(t.replace(/[^\d.]/g, '')) || 0) * 100) / 100;
};
const xTel = t => t ? `<a href="tel:${esc(t)}" class="rp-tel" onclick="event.stopPropagation()"><bdi>${esc(t)}</bdi>${I('phone')}</a>` : '';
/* إكمال اسم الزبون من رقم هاتفه فقط (في المستعمل والديون) */
function xCustLookup(nameId, telId, fromName) {
  const nEl = $(nameId), tEl = $(telId); if (!nEl || !tEl) return;
  const nv = nEl.value.trim(), tv = tEl.value.trim(), ph8 = waNum(tv).slice(-8);
  const all = [...(S.rp || []), ...(S.debt || []), ...(S.used || [])];
  if (!fromName && ph8.length >= 8 && !nv) {
    const f = all.filter(x => x.tel && x.name && waNum(x.tel).slice(-8) === ph8).pop();
    if (f) nEl.value = f.name;
  }
}
/* ---------- خزنة صور المستعمل (تشترك مع IndexedDB في core.js) ---------- */
const uImg = u => u && u.img && u.img.startsWith('data:') ? u.img : (u && IMG[u.id] || '');
HK.save.push(() => {
  (S.used || []).forEach(u => {
    if (!u || !u.id) return;
    if (typeof u.img === 'string' && u.img.startsWith('data:image')) { putImg(u.id, u.img); u.img = 'idb:' + u.id; }
    else if (!u.img && IMG[u.id]) delImg(u.id);
  });
});
/* ---------- شراء المستعمل ---------- */
let UR = {}, UI = '', UCAMS = null;
const isUsInInv = u => !!(u && u.inv && (!u.invId || S.items.some(x => x.id == u.invId)));
function usDup(imei, selfId) {
  const n = nz(imei); if (n.length < 6) return '';
  if (S.items.some(i => i.imei && nz(i.imei).includes(n))) return 'المخزون';
  if (S.rp.some(r => r.imei && nz(r.imei).includes(n))) return 'الصيانة';
  if (S.used.some(u => u.id != selfId && u.imei && nz(u.imei).includes(n))) return 'سجل شراء المستعمل';
  return '';
}
function usCamStop() { if (UCAMS) { UCAMS.getTracks().forEach(t => t.stop()); UCAMS = null; } const b = $('ucam_box'); if (b) b.remove(); }
HK.hide.push(usCamStop);
function usShowIm() { const m = $('u_im'); if (!m) return; m.src = UI; m.hidden = false; if ($('u_imx')) $('u_imx').hidden = false; }
function usImDel() { UI = ''; const m = $('u_im'); if (m) { m.hidden = true; m.removeAttribute('src'); } if ($('u_imx')) $('u_imx').hidden = true; }
function usIM(f) {
  if (!f) return;
  const im = new Image();
  im.onload = () => {
    const k = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = im.width * k; c.height = im.height * k;
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    UI = c.toDataURL('image/jpeg', .6); usShowIm();
  };
  im.src = URL.createObjectURL(f);
}
function usCam() {
  if ($('ucam_box')) return usCamStop();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return $('u_i').click();
  $('u_im').insertAdjacentHTML('beforebegin', '<div id="ucam_box" class="card rp-cam-box"><video id="ucam_v" autoplay playsinline muted class="rp-cam-v"></video><div class="row2"><button type="button" class="btn sm f1" onclick="usCamSnap()">التقاط</button><button type="button" class="btn s sm" onclick="usCamStop()">إلغاء</button></div></div>');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
    const v = $('ucam_v'); if (!v) { s.getTracks().forEach(t => t.stop()); return; } UCAMS = s; v.srcObject = s;
  }).catch(e => { usCamStop(); toast(typeof camErr == 'function' ? camErr(e) : 'تعذر فتح الكاميرا', 0, 15000); $('u_i').click(); });
}
function usCamSnap() {
  const v = $('ucam_v'); if (!v || !v.videoWidth) return toast('انتظر ظهور الصورة ثم اضغط التقاط');
  const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement('canvas');
  c.width = v.videoWidth * k; c.height = v.videoHeight * k;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  UI = c.toDataURL('image/jpeg', .6); usCamStop(); usShowIm();
}
function syncUsBrand() {
  const cur = (($('u_dev') || {}).value || '').trim().toLowerCase();
  const active = S.tags.brand.find(x => x && cur.startsWith(String(x).toLowerCase())) || '';
  document.querySelectorAll('.us-br').forEach((b, idx) => b.classList.toggle('on', S.tags.brand[idx] === active));
}
function pickUsBrand(j) {
  const b = S.tags.brand[j], el = $('u_dev'); if (!el) return;
  let cur = el.value.trim();
  const o = S.tags.brand.find(x => x && cur.toLowerCase().startsWith(String(x).toLowerCase()));
  if (o) cur = cur.slice(o.length).trim();
  el.value = o === b ? cur : (b + (cur ? ' ' + cur : ' '));
  syncUsBrand(); el.focus();
}
function usOpen(rec) {
  UR = rec || {}; UI = UR.img || '';
  const shownImg = UI.startsWith('data:') ? UI : (UR.id && IMG[UR.id]) || '';
  $('sh').innerHTML = `<div class="bar"></div><h3>${UR.id ? 'تعديل شراء مستعمل' : (UR.repOf ? 'روپريز: استلام هاتف الزبون' : 'شراء هاتف مستعمل')}</h3>`
    + (typeof rpDatalists == 'function' ? rpDatalists() : '')
    + (UR.repTxt ? `<div class="card rp-sum-box"><b>مقابل بيع:</b> ${esc(UR.repTxt)}</div>` : '')
    + `<label>الجهاز / الموديل<input id="u_dev" data-sug="rd" value="${esc(UR.dev || '')}" placeholder="اختر ماركة من الأسفل أو اكتب الموديل (مثال: Samsung A54)" oninput="syncUsBrand()"></label>`
    + `<div class="rp-chip-box">${S.tags.brand.map((b, j) => `<button type="button" class="tag us-br" onclick="pickUsBrand(${j})">${esc(b)}</button>`).join('')}</div>`
    + `<div class="row2"><label class="f1">سعر شراء المستعمل<input id="u_price" type="tel" value="${esc(UR.price || '')}" oninput="usCalcDiff()"></label>${UR.repOf ? `<label class="f1">الفرق المقبوض (الصولد)<input id="u_diff" type="tel" value="${esc(UR.diff || '')}"></label>` : ''}</div>`
    + `<div class="row2"><label class="f1">اسم البائع<input id="u_name" autocomplete="off" value="${esc(UR.name || '')}"></label><label class="f1">رقم البطاقة (CIN)<input id="u_cin" value="${esc(UR.cin || '')}" placeholder="مثال: D123456"></label></div>`
    + `<label>هاتف البائع<input id="u_tel" type="tel" value="${esc(UR.tel || '')}" oninput="xCustLookup('u_name','u_tel',0)"></label>`
    + `<label>IMEI / الرقم التسلسلي<div class="row2" style="margin-top:4px"><input id="u_imei" value="${esc(UR.imei || '')}" placeholder="امسح الباركود أو *#06#" class="f1"><button type="button" class="btn s sm" onclick="scanIntoInput('u_imei')">${I('scan')} مسح</button></div></label>`
    + `<div><label>صورة البطاقة الوطنية / الهاتف (محمية)</label><div class="row2"><button type="button" class="btn s sm" onclick="usCam()">التقاط صورة</button><button type="button" class="btn s sm" onclick="$('u_i').click()">من المعرض</button><button type="button" id="u_imx" class="btn s sm del" onclick="usImDel()" ${shownImg ? '' : 'hidden'}>حذف الصورة</button></div><img id="u_im" ${shownImg ? `src="${shownImg}"` : 'hidden'} class="rp-sheet-im"><input id="u_i" type="file" accept="image/*" hidden onchange="usIM(this.files[0])"></div>`
    + `<label>ملاحظة (الحالة، الملحقات...)<textarea id="u_note">${esc(UR.note || '')}</textarea></label>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="usSub()">حفظ</button></div>`;
  syncUsBrand();
  sheetOpen(v => { if (v) usCommit(UR, v); });
}
function usCalcDiff() {
  if (!UR || !UR.repPr || !$('u_diff')) return;
  const p = xn($('u_price').value), d = Math.max(0, UR.repPr - p);
  $('u_diff').value = d ? String(d) : '0';
}
function usSub() {
  const dev = $('u_dev').value.trim(), name = $('u_name').value.trim();
  if (!dev || !name) return toast('اكتب الجهاز واسم البائع');
  const v = {
    dev, name,
    cin: $('u_cin').value.trim().toUpperCase(),
    tel: $('u_tel').value.trim(),
    imei: $('u_imei').value.trim(),
    price: $('u_price').value.trim(),
    diff: $('u_diff') ? $('u_diff').value.trim() : (UR.diff || ''),
    repOf: UR.repOf || '',
    repTxt: UR.repTxt || '',
    img: UI,
    note: $('u_note').value.trim()
  };
  finish(v);
}
async function usCommit(rec, v) {
  const dup = v.imei ? usDup(v.imei, rec.id) : '';
  if (dup && !(await sure('رقم IMEI هذا موجود مسبقاً في ' + dup + '. هل تتابع الحفظ؟', 'متابعة', false))) {
    return setTimeout(() => usOpen({ ...rec, ...v }), 220);
  }
  if (rec.id) {
    if (!v.img && IMG[rec.id]) delImg(rec.id);
    if (v.img && v.img.startsWith('data:image')) { putImg(rec.id, v.img); v.img = 'idb:' + rec.id; }
    Object.assign(rec, v, { lb: S.me }); save(); render(); toast('تم التعديل'); return;
  }
  const id = uid();
  if (v.img && v.img.startsWith('data:image')) { putImg(id, v.img); v.img = 'idb:' + id; }
  const o = { id, ...v, by: S.me, at: Date.now() };
  S.used.push(o);
  if (v.repOf) {
    const it = S.items.find(x => x.id == v.repOf);
    if (it && it.cnt > 0) { it.cnt = Math.max(0, it.cnt - 1); phSoldFix(it); it.by = S.me; it.at = Date.now(); }
  }
  save(); render();
  toast(v.repOf ? 'تم تسجيل الروپريز وخصم الهاتف المباع' : 'تم تسجيل الشراء', () => {
    S.used = S.used.filter(x => x.id != o.id);
    delImg(o.id);
    if (v.repOf) { const it = S.items.find(x => x.id == v.repOf); if (it) { it.cnt += 1; phSoldFix(it); } }
  });
}
const usAdd = pre => usOpen(pre || {});
function usEd(id) { const u = S.used.find(x => x.id == id); if (u) usOpen(u); }
function usDel(id) {
  const u = S.used.find(x => x.id == id); if (!u) return;
  if (!can('del')) return toast('الحذف للمدير فقط');
  sure('حذف «شراء ' + u.dev + '» ؟' + (u.repOf ? ' (سيُعاد الهاتف المباع في الروپريز إلى المخزون)' : '')).then(y => {
    if (!y) return;
    const i = S.used.findIndex(x => x.id == id); if (i < 0) return;
    const o = S.used.splice(i, 1)[0], t = { id: uid(), coll: 'used', obj: o, label: 'شراء ' + o.dev, t: Date.now() };
    const repIt = o.repOf ? S.items.find(x => x.id == o.repOf) : null;
    if (repIt) { repIt.cnt += 1; phSoldFix(repIt); repIt.by = S.me; }
    S.trash.push(t); save(); render();
    toast('تم الحذف', () => restore(t.id, 1));
  });
}
function usZoom(id) {
  const u = S.used.find(x => x.id == id), src = u && uImg(u); if (!src) return;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(u.dev + ' — ' + u.name)}</h3><img src="${src}" class="rp-zoom-im"><div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
  sheetOpen(() => { });
}
function usInv(id) {
  const u = S.used.find(x => x.id == id); if (!u) return;
  $('sh').innerHTML = '';
  const br = (typeof brOfName == 'function' ? brOfName(u.dev) : '') || '';
  const nm = br ? u.dev.replace(new RegExp('^' + br + '\\s*', 'i'), '').trim() || u.dev : u.dev;
  const buyHint = u.price ? 'سعر الشراء: ' + u.price : '';
  const noteText = [u.note || '', buyHint].filter(Boolean).join(' · ');
  sheetOpen(v => {
    if (!v) return;
    delete v._more;
    phDone(v, PR);
    const added = S.items.filter(x => x.sec == 'phones' && x.brand == v.brand && nz(x.name) == nz(v.name)).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
    u.inv = 1; if (added) u.invId = added.id;
    save(); render();
  });
  phForm({ brand: br, name: nm, imei: u.imei || '', price: '', note: noteText, cond: 'مستعمل', cnt: 1, _fromUsed: 1 });
  $('sh').querySelectorAll('button[onclick^="phSave("]').forEach(b => b.remove());
  if (u.price && $('pp')) $('pp').placeholder = 'اكتب سعر البيع (اشتريته بـ ' + u.price + ')';
}
window.usFromRep = function (itemId) {
  const it = S.items.find(x => x.id == itemId); if (!it) return;
  if (typeof av == 'function' && av(it) <= 0) return toast('لا توجد قطع متاحة من هذا الهاتف');
  const title = [it.brand, it.name, it.color, it.cap].filter(Boolean).join(' ');
  usOpen({ repOf: it.id, repTxt: title + (it.price ? ' (' + it.price + ')' : ''), repPr: xn(it.price) });
};
const usedCard = u => {
  const im = uImg(u), inInv = isUsInInv(u);
  return `<div class="card"><div class="row2" style="flex-wrap:wrap">${im ? `<img onclick="usZoom('${u.id}')" src="${im}" class="rp-th">` : ''}<div class="f1"><b><bdi>${esc(u.dev)}</bdi></b><div class="m">البائع: ${esc(u.name)}</div></div>${u.tel ? xTel(u.tel) : ''}${u.price ? prBadge(u.price) : ''}</div>`
    + (u.cin ? `<div class="m" style="font-weight:600;color:var(--pt);margin-top:4px">${I('idcard')} CIN: <bdi>${esc(u.cin)}</bdi></div>` : `<div class="rs" style="margin-top:4px">بدون رقم بطاقة وطنية (CIN)</div>`)
    + (u.repTxt ? `<div class="m">روپريز مقابل: ${esc(u.repTxt)}${u.diff ? ' · الفرق المقبوض: <b>' + esc(u.diff) + '</b>' : ''}</div>` : '')
    + (u.imei ? `<div class="m">IMEI: <bdi class="ltr">${esc(u.imei)}</bdi></div>` : '') + (u.note ? `<div class="m">${esc(u.note)}</div>` : '')
    + `<div class="rp-meta"><div class="rp-meta-line"><span><bdi class="ltr">${fd(u.at)}</bdi>${inInv ? ' · ' + I('check') + ' أُدخل للمخزون' : ''}</span><b><bdi>${esc(u.by || '')}</bdi></b></div></div>`
    + `<div class="sub">${inInv ? '' : `<button class="btn s sm" onclick="usInv('${u.id}')">إدخال للمخزون</button>`}<button class="btn s sm" onclick="usEd('${u.id}')">تعديل</button><button class="btn s sm del rp-icb" onclick="usDel('${u.id}')">حذف</button></div></div>`;
};
const usMatch = (u, n, q) => nzHit(nz([u.dev, u.name, u.cin, u.tel, u.imei, u.note, u.repTxt].join(' ')), q, n);
function usListHtml() {
  const L = S.used.slice().sort((a, b) => b.at - a.at), n = nz(V.q || '');
  const F = n ? L.filter(u => usMatch(u, n, V.q)) : L;
  if (!F.length) return emptyBox(n ? 'لا توجد سجلات مطابقة' : 'لا توجد سجلات شراء مستعمل بعد', n ? '' : 'اضغط على «+ تسجيل شراء هاتف مستعمل» في الأعلى');
  const limN = V.lim || 40, rem = F.length - limN;
  return F.slice(0, limN).map(usedCard).join('') + (rem > 0 ? `<button class="btn s" onclick="V.lim=(V.lim||40)+40;usF()">عرض المزيد (+${Math.min(40, rem)} من ${rem} متبقية)</button>` : '');
}
VW.usd = () => ({
  t: 'شراء المستعمل',
  h: `<button class="btn" onclick="usAdd()">+ تسجيل شراء هاتف مستعمل</button>`
    + `<input placeholder="ابحث بالاسم، رقم البطاقة CIN، IMEI أو الموديل" value="${esc(V.q || '')}" oninput="V.q=this.value;V.lim=40;usF()">`
    + `<div id="usl">${usListHtml()}</div>`
});
function usF() { if ($('usl')) $('usl').innerHTML = usListHtml(); }
/* ---------- الديون (دفعات مرئية، عمر وتأخر، تذكير مسجَّل، نافذة تفاصيل) ---------- */
const dRem = d => Math.max(0, Math.round((xn(d.amt) - (d.pays || []).reduce((a, p) => a + xn(p[1]), 0)) * 100) / 100);
/* تسجيل دين جديد: من له صلاحية «إدارة الديون» أو صلاحية «تسجيل دين جديد فقط» */
const canDebtAdd = () => S.perm.debtAdd == 'e' || can('debt');
const dbtDay = t => { const d = new Date(t || Date.now()); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dbtAge = d => Math.max(0, Math.floor((Date.now() - (d.at || Date.now())) / 864e5));
const dbtAgeTxt = n => n < 1 ? 'اليوم' : n == 1 ? 'منذ يوم' : n == 2 ? 'منذ يومين' : n <= 10 ? 'منذ ' + n + ' أيام' : 'منذ ' + n + ' يوماً';
const dbtPd = () => S.cfg.dbp !== 0;   // إظهار تاريخ الوعد بالسداد (إعداد للمدير)
const dbtPromLate = d => !!(dbtPd() && d.pd && d.pd < dbtDay());
const dbtLate = d => !d.paid && (dbtAge(d) >= lim('dbo') || dbtPromLate(d));
const dbtWaTxt = d => { const w = (d.wa || []).slice(-1)[0]; return w ? 'ذُكِّر ' + dbtAgeTxt(Math.floor((Date.now() - w[0]) / 864e5)) : ''; };
window.dbtCustOpen = function (tel, name) {
  const ph = waNum(tel), nm = nz(name || ''), multi = /\S+\s+\S+/.test(nm.trim());
  return (S.debt || []).filter(d => {
    if (d.paid || dRem(d) <= 0) return false;
    const dph = waNum(d.tel);
    if (ph.length >= 8 && dph.length >= 8) return ph.slice(-8) === dph.slice(-8);
    return multi && nz(d.name) === nm;   // بالاسم وحده: الاسم الكامل (كلمتان فأكثر) فقط
  });
};
function dbtSameCust(d) { return dbtCustOpen(d.tel, d.name); }
function dbtForm(rec, title) {
  const F = [
    { k: 'name', l: 'اسم الزبون', v: rec.name || '' },
    { k: 'tel', l: 'الهاتف (مهم للتذكير بالواتساب)', t: 'tel', v: rec.tel || '' },
    { k: 'amt', l: 'المبلغ', t: 'tel', v: rec.amt || '' },
    { k: 'why', l: 'السبب', t: 'area', v: rec.why || '' }
  ];
  if (dbtPd()) F.splice(3, 0, { k: 'pd', l: 'تاريخ وعد بالسداد (اختياري)', t: 'date', v: rec.pd || '' });
  const p = ask(title || 'دين جديد', F);
  if (typeof rpDatalists == 'function' && $('sh')) {
    $('sh').insertAdjacentHTML('beforeend', rpDatalists());
    const nEl = $('f_name'), tEl = $('f_tel');
    if (nEl) nEl.setAttribute('autocomplete', 'off');
    if (tEl) { tEl.oninput = () => xCustLookup('f_name', 'f_tel', 0); }
  }
  return p;
}
const dbtClean = v => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x || '').trim()]));
const dbtBad = v => !v.name || xn(v.amt) <= 0 ? 'اكتب الاسم ومبلغاً أكبر من صفر' : (v.tel && waNum(v.tel).length < 8 ? 'رقم الهاتف غير صالح (8 أرقام على الأقل)' : '');
async function dbtSave(rec, v) {
  if (!v) return;
  v = dbtClean(v);
  const bad = dbtBad(v);
  if (bad) { toast(bad); return dbtSave(rec, await dbtForm({ ...rec, ...v })); }
  const o = { id: uid(), ...v, amt: String(xn(v.amt)), pays: [], by: S.me, at: Date.now(), ...(rec.rp ? { rp: rec.rp } : {}) };
  if (!o.pd) delete o.pd;
  S.debt.push(o);
  if (rec.rp) { const r = S.rp.find(x => x.id == rec.rp); if (r) r.debt = o.id; }
  save(); render(); toast('تم تسجيل الدين', () => { S.debt = S.debt.filter(x => x.id != o.id); if (rec.rp) { const r = S.rp.find(x => x.id == rec.rp); if (r) delete r.debt; } });
}
const dbtAdd = () => !canDebtAdd() ? toast('تسجيل الديون للمدير فقط') : dbtForm({}).then(v => dbtSave({}, v));
function dbtMore(id) {
  if (!canDebtAdd()) return toast('تسجيل الديون للمدير فقط');
  const d = S.debt.find(x => x.id == id); if (!d) return;
  const rec = { name: d.name, tel: d.tel || '' }; dbtForm(rec).then(v => dbtSave(rec, v));
}
async function dbtEd(id) {
  if (!can('debt')) return toast('تعديل الدين للمدير فقط');
  const d = S.debt.find(x => x.id == id); if (!d) return;
  let v = await dbtForm({ name: d.name, tel: d.tel || '', amt: d.amt, why: d.why || '', pd: d.pd || '' }, 'تعديل الدين');
  while (v) {
    v = dbtClean(v);
    const bad = dbtBad(v); if (!bad) break;
    toast(bad); v = await dbtForm(v, 'تعديل الدين');
  }
  if (!v) return;
  const b = JSON.stringify(d);
  d.name = v.name; d.tel = v.tel; d.amt = String(xn(v.amt)); d.why = v.why;
  if (dbtPd()) { if (v.pd) d.pd = v.pd; else delete d.pd; }
  if (dRem(d) <= 0) { if (!d.paid) d.paid = Date.now(); } else delete d.paid;
  save(); render();
  toast('تم تعديل الدين', () => { Object.keys(d).forEach(k => delete d[k]); Object.assign(d, JSON.parse(b)); });
}
function dbtFromRp(id) {
  if (!canDebtAdd()) return toast('تسجيل الديون للمدير فقط');
  const r = S.rp.find(x => x.id == id); if (!r) return;
  const rest = Math.max(0, xn(r.cap) - xn(r.dep) - xn(r.paid));
  const rec = { name: r.name, tel: r.tel, amt: rest ? String(rest) : '', why: 'باقي إصلاح ' + (r.dev || ''), rp: r.id };
  dbtForm(rec).then(v => dbtSave(rec, v));
}
const dbtRp = r => {
  if (r.st != 'dn') return '';
  const ld = (S.debt || []).find(x => (r.debt && x.id == r.debt) || x.rp == r.id);
  if (ld) {
    const rem = dRem(ld), done = ld.paid || rem <= 0;
    return `<div class="${done ? 'rp-ok-txt' : 'rs'} dbt-line">${I('wallet')} ${done ? 'سُدِّد باقي الإصلاح' : 'سُجّل الباقي كدين (' + rem + ' درهم)'}</div>`;
  }
  return canDebtAdd() && r.res == 'ok' && xn(r.cap) > (xn(r.dep) + xn(r.paid)) ? `<div class="sub"><button class="btn s sm" onclick="dbtFromRp('${r.id}')">${I('wallet')} تسجيل الباقي كدين</button></div>` : '';
};
function dbtPay(id) {
  if (!can('debt')) return toast('إدارة الديون للمدير فقط');
  const d = S.debt.find(x => x.id == id); if (!d) return;
  const rem = dRem(d);
  ask('دفعة من ' + d.name, [{ k: 'a', l: 'المبلغ المدفوع (الباقي ' + rem + ')', t: 'tel', v: String(rem) }], 'تسجيل').then(async v => {
    const a = v && xn(v.a); if (!a) return;
    if (a > rem && !(await sure('المبلغ ' + a + ' أكبر من الباقي ' + rem + '. سيُسجَّل ' + rem + ' درهم فقط ويُغلق الدين. هل تريد المتابعة؟', 'نعم، سجّل الباقي', false))) return;
    const pay = Math.min(a, rem), b = JSON.stringify(d);
    d.pays = [...(d.pays || []), [Date.now(), pay, S.me]];
    if (dRem(d) <= 0) d.paid = Date.now();
    save(); render();
    toast(dRem(d) <= 0 ? 'سُدِّد الدين كاملاً' : 'بقي ' + dRem(d), () => { Object.keys(d).forEach(k => delete d[k]); Object.assign(d, JSON.parse(b)); });
  });
}
function dbtPayAll(id) {
  if (!can('debt')) return toast('إدارة الديون للمدير فقط');
  const d0 = S.debt.find(x => x.id == id); if (!d0) return;
  const list = dbtSameCust(d0).sort((a, b) => a.at - b.at);
  const tot = Math.round(list.reduce((s, x) => s + dRem(x), 0) * 100) / 100;
  ask('تسديد من إجمالي ديون ' + d0.name, [{ k: 'a', l: 'المبلغ المدفوع (الإجمالي ' + tot + ' درهم)', t: 'tel', v: String(tot) }], 'تسجيل').then(async v => {
    const a = v && xn(v.a); if (!a) return;
    if (a > tot && !(await sure('المبلغ ' + a + ' أكبر من إجمالي الديون ' + tot + '. سيُسجَّل ' + tot + ' درهم فقط وتُغلق الديون. هل تريد المتابعة؟', 'نعم، سجّل الإجمالي', false))) return;
    let left = Math.min(a, tot);
    const snapAll = JSON.stringify(S.debt);
    list.forEach(d => {
      if (left <= 0) return;
      const r = dRem(d), pay = Math.min(r, left);
      if (pay > 0) {
        d.pays = [...(d.pays || []), [Date.now(), pay, S.me]];
        if (dRem(d) <= 0) d.paid = Date.now();
        left = Math.round((left - pay) * 100) / 100;
      }
    });
    save(); render();
    toast('تم خصم الدفعة من ديون الزبون', () => { S.debt = JSON.parse(snapAll); });
  });
}
function dbtPayDel(id, k) {
  if (!isAdmin()) return toast('حذف الدفعة للمدير فقط');
  const d = S.debt.find(x => x.id == id), p = d && (d.pays || [])[k]; if (!p) return;
  sure('حذف دفعة ' + xn(p[1]) + ' درهم (' + fd(p[0]) + ') من دين ' + d.name + '؟', 'حذف الدفعة', true).then(y => {
    if (!y) return;
    const b = JSON.stringify(d);
    d.pays = d.pays.filter((_, i) => i != k);
    if (dRem(d) > 0) delete d.paid;
    save(); render();
    toast('حُذفت الدفعة', () => { Object.keys(d).forEach(x => delete d[x]); Object.assign(d, JSON.parse(b)); });
    dbtOpen(id);
  });
}
function dbtWA(id) {
  const d = S.debt.find(x => x.id == id); if (!d) return;
  const send = tel => {
    const ph = waNum(tel); if (ph.length < 8) return toast('رقم الهاتف غير صالح');
    const all = dbtSameCust(d), tot = all.reduce((s, x) => s + dRem(x), 0), rem = dRem(d);
    const details = all.length > 1
      ? `إجمالي المبلغ المتبقي هو ${tot} درهم (${all.map(x => dRem(x) + ' درهم: ' + (x.why || 'دين')).join(' + ')})`
      : `المبلغ المتبقي هو ${rem} درهم${d.why ? ' (' + d.why + ')' : ''}`;
    const msg = typeof waMsg == 'function'
      ? waMsg('debt', { الزبون: d.name, التفاصيل: details })
      : `السلام عليكم ${d.name}، نتمنى أن تكونوا بخير.\nتذكير ودي بخصوص الحساب: ${details}.\n— ${shopName()}`;
    d.wa = [...(d.wa || []), [Date.now(), S.me]].slice(-10);   // سجل التذكيرات (الوقت والموظف)
    save();
    location.href = 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg);
  };
  if (waNum(d.tel).length >= 8) return send(d.tel);
  const keep = can('debt');
  ask('رقم هاتف ' + d.name, [{ k: 't', l: keep ? 'أدخل رقم الهاتف لإرسال التذكير وحفظه' : 'أدخل رقم الهاتف لإرسال التذكير (لن يُحفظ)', t: 'tel', v: d.tel || '' }], 'إرسال واتساب').then(v => {
    const t = v && v.t.trim(); if (!t) return;
    if (waNum(t).length < 8) return toast('رقم الهاتف غير صالح');
    if (keep) { d.tel = t; save(); render(); }
    send(t);
  });
}
function dbtDel(id) { const d = S.debt.find(x => x.id == id); if (d) del('debt', id, 'دين ' + d.name); }
/* ---------- نافذة تفاصيل الدين ---------- */
let DBS = null;
function dbtOpenHtml(id) {
  const d = S.debt.find(x => x.id == id); if (!d) return '';
  const open = !d.paid, rem = dRem(d), same = open ? dbtSameCust(d) : [], P = d.pays || [], adm = isAdmin();
  const rp = d.rp && (S.rp || []).find(r => r.id == d.rp);
  const line = (l, v) => v ? `<div class="rp-meta-line"><span>${l}</span><b>${v}</b></div>` : '';
  const pays = P.length
    ? P.map((p, k) => `<div class="card row2"><div class="f1"><b><bdi class="ltr">${esc(String(xn(p[1])))} DH</bdi></b><div class="m"><bdi class="ltr">${fd(p[0])}</bdi>${p[2] ? ' · <bdi>' + esc(p[2]) + '</bdi>' : ''}</div></div>${adm ? `<button class="btn s sm del rp-icb" onclick="dbtGo('dbtPayDel','${d.id}',${k})">حذف</button>` : ''}</div>`).join('')
    : '<p class="m">لا توجد دفعات بعد</p>';
  const was = (d.wa || []).slice().reverse().slice(0, 5).map(w => `<div class="m"><bdi class="ltr">${fd(w[0])}</bdi>${w[1] ? ' · <bdi>' + esc(w[1]) + '</bdi>' : ''}</div>`).join('') || '<p class="m">لم يُرسل تذكير بعد</p>';
  const acts = (can('debt') ? `<button class="btn s" onclick="dbtGo('dbtEd','${d.id}')">تعديل</button>` : '')
    + (open && can('debt') && same.length > 1 ? `<button class="btn s" onclick="dbtGo('dbtPayAll','${d.id}')">دفعة للإجمالي</button>` : '')
    + (canDebtAdd() ? `<button class="btn s" onclick="dbtGo('dbtMore','${d.id}')">+ دين له</button>` : '')
    + (can('del') ? `<button class="btn s del" onclick="dbtGo('dbtDel','${d.id}')">حذف</button>` : '');
  return `<div class="bar"></div><div data-dbs="${d.id}"><h3>${esc(d.name)}</h3>${d.tel ? xTel(d.tel) : ''}`
    + `<div class="rp-meta">`
    + line('المبلغ الأصلي', `<bdi class="ltr">${esc(d.amt)} DH</bdi>`)
    + line(open ? 'المتبقي' : 'الحالة', open ? `<bdi class="ltr">${rem} DH</bdi>` : 'مسدَّد ' + fd(d.paid))
    + line('السبب', d.why ? esc(d.why) : '')
    + line('التسجيل', `<bdi class="ltr">${fd(d.at)}</bdi>${d.by ? ' · <bdi>' + esc(d.by) + '</bdi>' : ''}`)
    + line('وعد بالسداد', dbtPd() && d.pd ? `<bdi class="ltr">${esc(d.pd)}</bdi>` : '')
    + line('تذكرة الصيانة', rp ? esc((rp.dev || '') + (rp.tk ? ' #' + rp.tk : '')) : '')
    + `</div><h3 class="dbt-h">الدفعات</h3>${pays}<h3 class="dbt-h">التذكيرات</h3>${was}`
    + (acts ? `<div class="sub">${acts}</div>` : '')
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div></div>`;
}
function dbtOpen(id) {
  const h = dbtOpenHtml(id); if (!h) return;
  DBS = id; $('sh').innerHTML = h; sheetOpen(() => { DBS = null; });
}
/* إجراء من داخل النافذة: تُغلق أولاً ثم يُنفَّذ (حتى لا تتداخل نافذتان) */
function dbtGo(fn, id, x) { const run = () => window[fn](id, x); if (SH) { finish(null); setTimeout(run, 180); } else run(); }
HK.hide.push(() => { DBS = null; });
HK.render.push(() => {
  if (SH && DBS && $('sh') && $('sh').querySelector('[data-dbs]')) {
    const h = dbtOpenHtml(DBS);
    if (h) $('sh').innerHTML = h; else finish(null);
  }
});
const dbtCard = d => {
  const rem = dRem(d), open = !d.paid, same = open ? dbtSameCust(d) : [], pLen = (d.pays || []).length;
  const totSame = same.length > 1 ? same.reduce((s, x) => s + dRem(x), 0) : 0;
  const origSub = open && (rem < xn(d.amt) || pLen)
    ? `<span class="dbt-orig">من أصل <bdi class="ltr">${esc(d.amt)} DH</bdi>${pLen ? ' · ' + arCnt(pLen, 'دفعة', 'دفعتان', 'دفعات', 'دفعة') : ''}</span>`
    : (d.paid ? `<span class="dbt-orig">سُدِّد <bdi class="ltr">${typeof fdS == 'function' ? fdS(d.paid) : fd(d.paid)}</bdi> · من أصل <bdi class="ltr">${esc(d.amt)} DH</bdi></span>` : '');
  const bg = open
    ? `<span class="dbt-age ${dbtAge(d) >= lim('dbo') ? 'late' : ''}">${dbtAgeTxt(dbtAge(d))}</span>`
      + (dbtPd() && d.pd ? `<span class="dbt-age ${dbtPromLate(d) ? 'late' : ''}">وعد: <bdi class="ltr">${esc(d.pd)}</bdi></span>` : '')
      + (dbtWaTxt(d) ? `<span class="dbt-age">${dbtWaTxt(d)}</span>` : '')
    : '';
  const acts = (open ? `${can('debt') ? `<button class="btn sm" onclick="dbtPay('${d.id}')">تسجيل دفعة</button>` : ''}<button class="btn s sm rp-wa-btn" onclick="dbtWA('${d.id}')">${I('chat')} واتساب</button>` : '')
    + `<button class="btn s sm" onclick="dbtOpen('${d.id}')">تفاصيل</button>`;
  return `<div class="card ${open ? '' : 'rp-ok'}">`
    + `<div class="dbt-top"><div class="dbt-who"><b>${esc(d.name)}</b>${d.tel ? xTel(d.tel) : ''}</div><div class="dbt-amt">${open ? prBadge(rem) : '<span class="pr-b">✓ مسدَّد</span>'}${origSub}</div></div>`
    + (bg ? `<div class="dbt-badges">${bg}</div>` : '')
    + (totSame ? `<div class="rs dbt-line">إجمالي ديون هذا الزبون: ${totSame} درهم (${arCnt(same.length, 'دين', 'دينان', 'ديون', 'ديناً')})</div>` : '')
    + (d.why ? `<div class="dbt-why">${esc(d.why)}</div>` : '')
    + `<div class="rp-meta"><div class="rp-meta-line"><span>التسجيل: <bdi class="ltr">${fd(d.at)}</bdi></span>${d.by ? `<b><bdi>${esc(d.by)}</bdi></b>` : ''}</div></div>`
    + `<div class="sub">${acts}</div></div>`;
};
const DBT_SO = { n: 'ترتيب: الأحدث', o: 'ترتيب: الأقدم', a: 'ترتيب: الأعلى مبلغاً' };
function dbtListHtml() {
  const tab = V.tab || 'o', q = nz(V.q || ''), so = V.dso || 'n';
  const hit = d => nzHit(nz([d.name, d.tel, d.why].join(' ')), V.q, q);
  let L = S.debt.filter(d => tab == 'o' ? !d.paid : !!d.paid);
  const other = q ? S.debt.filter(d => (tab == 'o' ? !!d.paid : !d.paid) && hit(d)).length : 0;
  if (q) L = L.filter(hit);
  L = tab == 'o' ? L.sort(so == 'o' ? (a, b) => a.at - b.at : so == 'a' ? (a, b) => dRem(b) - dRem(a) : (a, b) => b.at - a.at) : L.sort((a, b) => b.paid - a.paid);
  const hint = other ? `<div class="card row2"><span class="f1 m">${arCnt(other, 'نتيجة مطابقة', 'نتيجتان مطابقتان', 'نتائج مطابقة', 'نتيجة مطابقة')} في ${tab == 'o' ? 'المسدَّدة' : 'المفتوحة'}</span><button class="btn s sm" onclick="V.tab='${tab == 'o' ? 'p' : 'o'}';V.lim=40;render()">اعرضها</button></div>` : '';
  if (!L.length) return emptyBox(q ? 'لا توجد ديون مطابقة' : 'لا توجد ديون مسجلة هنا') + hint;
  const limN = V.lim || 40, rem = L.length - limN;
  return L.slice(0, limN).map(dbtCard).join('') + (rem > 0 ? `<button class="btn s" onclick="V.lim=(V.lim||40)+40;dbtF()">عرض المزيد (+${Math.min(40, rem)} من ${rem} متبقية)</button>` : '') + hint;
}
VW.dbt = () => {
  const tab = V.tab || 'o';
  const O0 = S.debt.filter(d => !d.paid), P0 = S.debt.filter(d => d.paid);
  const totOpen = Math.round(O0.reduce((s, d) => s + dRem(d), 0) * 100) / 100, lateN = O0.filter(dbtLate).length;
  return {
    t: 'الديون',
    h: `<div class="qbar rsum ${lateN ? 'dbt-sum3' : 'dbt-sum'}"><div class="qpill wn"><div class="qn">${O0.length}</div><div class="ql">ديون مفتوحة</div></div><div class="qpill al"><div class="qn">${totOpen}</div><div class="ql">مجموع المتبقي (DH)</div></div>${lateN ? `<div class="qpill al"><div class="qn">${lateN}</div><div class="ql">متأخرة</div></div>` : ''}</div>`
      + (canDebtAdd() ? `<button class="btn" onclick="dbtAdd()">+ دين جديد</button>` : '')
      + `<div class="q-wrap"><input id="dbt_q" placeholder="ابحث باسم الزبون أو الهاتف أو السبب" value="${esc(V.q || '')}" oninput="V.q=this.value;V.lim=40;dbtF()"><button id="dbt_q_clr" type="button" class="q-clr" ${V.q ? '' : 'hidden'} onclick="dbtClrQ()" aria-label="مسح البحث">✕</button></div>`
      + `<div class="sec-panel dbt-tabs"><div class="sec-tags"><button class="tag ${tab == 'o' ? 'on' : ''}" onclick="V.tab='o';V.lim=40;render()">مفتوحة (${O0.length})</button><button class="tag ${tab == 'p' ? 'on' : ''}" onclick="V.tab='p';V.lim=40;render()">المسدَّدة (${P0.length})</button></div></div>`
      + (tab == 'o' && O0.length > 1 ? `<div class="jl-bar"><span class="m"></span><div class="row2 jl-bar-act"><button type="button" class="tag" onclick="V.dso={n:'o',o:'a',a:'n'}[V.dso||'n'];render()">${DBT_SO[V.dso || 'n']}</button></div></div>` : '')
      + `<div id="dbtl">${dbtListHtml()}</div>`
  };
};
function dbtF() { if ($('dbtl')) $('dbtl').innerHTML = dbtListHtml(); const c = $('dbt_q_clr'); if (c) c.hidden = !V.q; }
function dbtClrQ() { V.q = ''; V.lim = 40; const i = $('dbt_q'); if (i) { i.value = ''; i.focus(); } dbtF(); }
/* ---------- الإحصائيات (مع تقسيم الأعطال المركبة بالفاصلة) ---------- */
const stCnt = (arr, f) => { const m = {}; arr.forEach(x => { const k = f(x); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
const stBars = (L, none) => { const mx = Math.max(1, ...L.map(x => x[1])); return L.length ? L.map(([l, n]) => `<div class="brow"><span class="bl">${esc(l)}</span><div class="bt"><i style="width:${Math.round(n / mx * 100)}%"></i></div><b>${n}</b></div>`).join('') : `<p class="m">${none}</p>`; };
VW.stat = () => {
  if (!can('stat')) return { t: 'إحصائيات', h: '<p class="m">عرض الإحصائيات للمدير فقط (يمكن فتحها للجميع من الصلاحيات).</p>' };
  const p = V.p ?? 30, since = p ? Date.now() - p * 864e5 : 0, rp = S.rp.filter(r => (r.t0 || 0) >= since);
  const faults = rp.flatMap(r => String(r.fault || '').split('،').map(s => s.trim()).filter(Boolean));
  const F = stCnt(faults, x => x).slice(0, 8);
  const Rq = {}; S.req.forEach(q => { const t = String(q.t || '').replace(/(?:\+?212|0)[\s\-.]*[567](?:[\s\-.]*\d){8}/g, '').replace(/[-–—:،.]/g, ' ').replace(/\s+/g, ' ').trim(), k = nz(t); if (k) { Rq[k] = Rq[k] || [t, 0]; Rq[k][1]++; } });
  const R = Object.values(Rq).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 6 + i); return d; });
  const dk = t => new Date(t).toDateString(), nm = d => d.toLocaleDateString('ar-MA', { weekday: 'short' });
  const In = days.map(d => [nm(d), S.rp.filter(r => r.t0 && dk(r.t0) == d.toDateString()).length]), Out = days.map(d => [nm(d), S.rp.filter(r => r.t2 && dk(r.t2) == d.toDateString()).length]);
  return {
    t: 'إحصائيات',
    h: `<div class="sec-panel" style="padding:8px"><div class="sec-tags" style="border:0;padding:0">${[[7, 'أسبوع'], [30, 'شهر'], [90, '3 أشهر'], [0, 'الكل']].map(([v, l]) => `<button class="tag ${p == v ? 'on' : ''}" style="flex:1;justify-content:center" onclick="V.p=${v};render()">${l}</button>`).join('')}</div></div>`
      + `<h3>أكثر الأعطال تكراراً</h3><div class="card">${stBars(F, 'لا توجد صيانات في هذه المدة')}</div>`
      + `<h3>أكثر ما يطلبه الزبائن ولا نملكه</h3><div class="card">${stBars(R, 'لا توجد طلبات حالياً')}</div>`
      + `<h3>الصيانات المستلمة آخر 7 أيام</h3><div class="card">${stBars(In, '')}</div>`
      + `<h3>الصيانات المسلَّمة آخر 7 أيام</h3><div class="card">${stBars(Out, '')}</div>`
  };
};
/* ---------- التسجيل في البحث والباركود ---------- */
SRCH.push(
  { k: 'used', l: 'مستعمل', run: (n, Q) => S.used.filter(u => usMatch(u, n, Q)).slice(0, 20).map(usedCard) },
  { k: 'debt', l: 'ديون', run: (n, Q) => S.debt.filter(d => nzHit(nz([d.name, d.tel, d.why].join(' ')), Q, n)).sort((a, b) => (!!a.paid - !!b.paid) || (b.at - a.at)).slice(0, 20).map(dbtCard) }
);
BCM.push(c => { const n = nz(c); return S.used.filter(u => u.imei && nz(u.imei).includes(n)).map(usedCard).join(''); });