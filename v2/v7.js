/* ===== 1. وسوم الأعطال والماركات + الاقتراح التلقائي للسعر + كشف الجهاز الراجع ===== */
const dh=p=>sn1(p)?String(p).trim()+' درهم':(p||'');
TG.fault = 'أعطال الصيانة';
S.tags.fault = S.tags.fault || ['تغيير شاشة', 'كونكتور الشحن', 'بطارية', 'مشكلة شبكة', 'سقط في الماء', 'صوت / مايك', 'سوفتوير', 'تغيير ظهر'];

const _rForm7 = rForm;
rForm = function(rec) {
  _rForm7(rec);
  const vInp = $('r_v'), fInp = $('r_f'), cInp = $('r_c');
  if (vInp) {
    vInp.insertAdjacentHTML('beforebegin', `<div id="rp_br_tags" style="margin-bottom:6px">${S.tags.brand.map(b => `<button type="button" class="tag" onclick="pickRpBrand('${esc(b)}')">${esc(b)}</button>`).join('')}</div>`);
    vInp.insertAdjacentHTML('afterend', `<div id="rp_dev_hist" class="m" style="color:#d97706;font-weight:700"></div>`);
    vInp.addEventListener('input', () => { checkDeviceHistory(); suggestGuidePrice(); });
  }
  if (fInp) {
    fInp.insertAdjacentHTML('beforebegin', `<div id="rp_fl_tags" style="margin-bottom:6px">${S.tags.fault.map(f => `<button type="button" class="tag" onclick="pickRpFault('${esc(f)}')">${esc(f)}</button>`).join('')}</div>`);
    fInp.addEventListener('input', suggestGuidePrice);
  }
  if (cInp) {
    cInp.insertAdjacentHTML('afterend', `<div id="rp_price_hint" style="margin-top:4px"></div>`);
  }
  checkDeviceHistory();
  suggestGuidePrice();
};

function pickRpBrand(b) {
  const el = $('r_v');
  if (!el) return;
  const cur = el.value.trim();
  el.value = cur ? (cur.startsWith(b) ? cur : b + ' ' + cur) : b + ' ';
  el.focus();
  checkDeviceHistory();
  suggestGuidePrice();
}

function pickRpFault(f) {
  const el = $('r_f');
  if (!el) return;
  let parts = el.value.split('،').map(s => s.trim()).filter(Boolean);
  if (parts.includes(f)) parts = parts.filter(x => x !== f);
  else parts.push(f);
  el.value = parts.join('، ');
  suggestGuidePrice();
}

function suggestGuidePrice() {
  const dev = nz(($('r_v') || {}).value || '');
  const flt = nz(($('r_f') || {}).value || '');
  const box = $('rp_price_hint');
  if (!box) return;
  if (!dev && !flt) { box.innerHTML = ''; return; }

  const matches = (S.guide || []).filter(g => {
    const gm = nz(g.m), gf = nz(g.f);
    const mMatch = dev && (dev.includes(gm) || gm.includes(dev));
    const fMatch = flt && (flt.includes(gf) || gf.includes(flt));
    return (mMatch && fMatch) || (dev.length > 2 && mMatch && !flt);
  }).slice(0, 3);

  if (matches.length) {
    box.innerHTML = matches.map(g =>
      `<button type="button" class="tag on" style="margin-top:4px" onclick="$('r_c').value='${esc(g.p)}'">💡 السعر في الدليل (${esc(g.m)} - ${esc(g.f)}): ${esc(dh(g.p))} — اضغط لوضعه</button>`
    ).join('');
  } else {
    box.innerHTML = '';
  }
}

function checkDeviceHistory() {
  const dev = nz(($('r_v') || {}).value || '');
  const box = $('rp_dev_hist');
  if (!box) return;
  if (dev.length < 3) { box.textContent = ''; return; }

  const recent = S.rp.filter(r => r != ZR && r.st == 'dn' && nz(r.dev).includes(dev) && (Date.now() - (r.t2 || 0)) < 14 * 864e5);
  if (recent.length) {
    const last = recent[recent.length - 1];
    const days = Math.floor((Date.now() - last.t2) / 864e5);
    box.textContent = `⚠️ تنبيه: جهاز مشابه (${last.dev} — ${last.name}) سُلّم منذ ${days || 'أقل من'} يوم (${last.tst ? 'جُرِّب مع الزبون ✅' : 'بدون توثيق تجربة'})`;
  } else {
    box.textContent = '';
  }
}

/* ===== 2. زر اتصال مباشر + توثيق التجربة مع الزبون في البطاقة ===== */
const _rc7 = rc;
rc = function(r) {
  let h = _rc7(r);
  if (r.tel) {
    const callBtn = `<a href="tel:${esc(r.tel)}" class="btn s sm" style="text-decoration:none;display:inline-flex;align-items:center">📞 اتصال</a>`;
    h = h.replace('<div class="sub">', `<div class="sub">${callBtn}`);
  }
  if (r.st == 'dn') {
    const badge = r.tst
      ? `<div class="m" style="color:#16a34a;font-weight:700">✅ جُرِّب مع الزبون وسُلِّم مصلوحاً (${esc(r.dby || '')})</div>`
      : (r.res == 'ok' ? `<div class="m">سُلِّم بدون توثيق التجربة</div>` : '');
    const dnoteHtml = r.dnote ? `<div class="m">ملاحظة التسليم: ${esc(r.dnote)}</div>` : '';
    h = h.replace('<div class="sub">', badge + dnoteHtml + '<div class="sub">');
  }
  return h;
};

const DVO=['— اختر —','جُرِّب مع الزبون وهو يعمل','سُلِّم بدون تجربة مع الزبون'];
rDV = function(id, pre) {
  const r = rf(id), pr = pre || {};
  const def = r.res == 'ok' && sn1(r.cap) ? r.cap.trim() : '';
  const fields = [
    { k: 'p', l: def ? 'هل المبلغ المقبوض هو ' + def + ' ؟ عدّله إن اختلف' : 'المبلغ المقبوض (0 إن لم يُقبض شيء)', t: 'tel', v: pr.p ?? def }
  ];
  if (r.res == 'ok') {
    fields.unshift({ k: 'tested', l: (pr.err ? '⚠️ اختر أحد الخيارين: ' : '') + 'تجربة الإصلاح مع الزبون قبل التسليم (إجباري)', t: 'sel', o: DVO, v: DVO[0] });
  }
  fields.push({ k: 'dnote', l: 'ملاحظة عند التسليم (اختياري)', v: pr.dnote ?? (r.dnote || '') });
  ask('تسليم الهاتف: ' + r.name, fields, 'تأكيد التسليم', false).then(v => {
    if (!v) return;
    if (r.res == 'ok' && v.tested == DVO[0]) return rDV(id, { p: v.p, dnote: v.dnote, err: 1 });
    commit('تم التسليم', () => {
      r.st = 'dn';
      r.t2 = Date.now();
      r.dby = S.me;
      r.paid = v.p.trim() || '0';
      r.tst = v.tested == DVO[1] ? Date.now() : 0;
      r.dnote = (v.dnote || '').trim();
      r.pat = [];
      r.lock = '';
    });
  });
};

rWA = function(id, k) {
  const r = rf(id);
  const c = sn1(r.cap) ? ' تكلفة الإصلاح: ' + r.cap.trim() + (r.dep ? '، العربون: ' + r.dep : '') + '.' : '';
  const chks = r.chk || [];
  const isDeadOrBroken = chks.includes('مطفأ لا يشتغل') || chks.includes('شاشة مكسورة');
  const legalNote = (!k && isDeadOrBroken)
    ? '\n*(ملاحظة: استُلم الجهاز بشاشة مكسورة/منطفئ مما يتعذر معه فحص باقي الوظائف كالكاميرا والشبكة قبل الإصلاح)*.'
    : '';

  const s = k
    ? (r.res == 'ok' ? `هاتفك ${r.dev} جاهز في المحل.${c}` : r.res == 'fail' ? `للأسف تعذّر إصلاح هاتفك ${r.dev}. يمكنك استلامه من المحل.` : `هاتفك ${r.dev} جاهز للاستلام بدون إصلاح.`)
    : `استلمنا هاتفك ${r.dev} (${r.fault}).${r.dep ? ' العربون: ' + r.dep + '.' : ''} سنبلغك عند جاهزيته.${legalNote}`;

  location.href = 'https://wa.me/' + rnum(r.tel) + '?text=' + encodeURIComponent(`مرحباً ${r.name}، ${s}\nشكراً لثقتكم.`);
};

/* ===== 3. التقرير اليومي حسب الأقسام ===== */
let reportSectionFilter = 'all';
const idOf = x => (String(x[3] || '').match(/'([^']+)'/) || [])[1];
const repL7 = () => repLines().map(x => {
  if (x[0] == 'البوشيط') { const i = find(idOf(x)); if (i && (i.rem || i.need)) return [x[0], x[1] + (i.rem ? ' — باقي: ' + i.rem : '') + (i.need ? ' — خاصنا: ' + i.need : ''), x[2], x[3]]; }
  return x;
});
const RTABS = [['all', '📋 التقرير الشامل'], ['phones', '📱 الهواتف'], ['glass', '🛡️ الأنتي كاس'], ['pochette', '📲 البوشيط'], ['acc', '🔌 الإكسسوارات']];
const RSEC = { phones: ['الهواتف الناقصة', '📱 قسم الهواتف النافدة', 'لا هواتف نافدة'], glass: ['الأنتي كاس', '🛡️ قسم زجاج الحماية (الأنتي كاس)', 'الأنتي كاس مكتمل'], pochette: ['البوشيط', '📲 قسم البوشيط', 'البوشيط مكتمل'], acc: ['الإكسسوارات', '🔌 قسم الإكسسوارات وقطع الصيانة', 'الإكسسوارات مكتملة'] };
const rSecs = m => m == 'all' ? ['phones', 'glass', 'pochette', 'acc'] : [m];

function generateReportText(mode = 'all') {
  const L = repL7(), o = [`📋 *تقرير المحل (${new Date().toLocaleDateString('ar-MA')})*`, ''];
  if (mode == 'all' || mode == 'phones') {
    const s = stkL();
    if (s.length) { o.push('*📱 الهواتف المتوفرة حالياً*'); s.forEach(i => o.push('• ' + stkN(i) + ' — العدد ' + i.cnt + (i.price ? ' (' + dh(i.price) + ')' : ''))); o.push(''); }
  }
  rSecs(mode).forEach(k => {
    const [key, title, none] = RSEC[k], ls = L.filter(x => x[0] == key);
    o.push('*' + title + '*');
    ls.forEach(x => o.push((x[2] == 'r' ? '🔴 ' : '🟡 ') + x[1]));
    if (k == 'acc') {
      S.rp.filter(r => r.st == 'in' && r.part).forEach(r => o.push('🔧 قطعة صيانة: ' + r.part + ' (' + r.dev + ')'));
      if (mode == 'all') S.req.forEach(q => o.push('🗣️ طلب زبون: ' + q.t));
    }
    if (!ls.length && !(k == 'acc' && (S.rp.some(r => r.st == 'in' && r.part) || (mode == 'all' && S.req.length)))) o.push('✅ ' + none);
    o.push('');
  });
  return o.join('\n').trim();
}

VW.rep = function() {
  const L = repL7(), s = stkL();
  let h = `<div style="margin-bottom:12px;display:flex;gap:6px;overflow-x:auto">${RTABS.map(([k, l]) => `<button class="tag ${reportSectionFilter === k ? 'on' : ''}" onclick="reportSectionFilter='${k}';render()">${l}</button>`).join('')}</div>`;
  if ((reportSectionFilter == 'all' || reportSectionFilter == 'phones') && s.length)
    h += '<h3>📱 الهواتف المتوفرة حالياً</h3>' + s.map(i => `<div class="card row2"><span style="flex:1">${esc(stkN(i))}</span><span class="m">${i.cnt}${i.price ? ' · ' + esc(dh(i.price)) : ''}</span></div>`).join('');
  rSecs(reportSectionFilter).forEach(k => {
    const [key, title, none] = RSEC[k], ls = L.filter(x => x[0] == key);
    let b = ls.map(x => `<div class="card row2"><span class="dotl" style="background:${DT[x[2]]}"></span><span style="flex:1">${esc(x[1])}</span><button class="btn sm" onclick="${x[3]}">تم الشراء</button></div>`).join('');
    if (k == 'acc') {
      b += S.rp.filter(r => r.st == 'in' && r.part).map(r => `<div class="card row2"><span class="dotl" style="background:#f59e0b"></span><span style="flex:1">🔧 قطعة صيانة: <b>${esc(r.part)}</b> <span class="m">(${esc(r.dev)})</span></span></div>`).join('');
      if (reportSectionFilter == 'all') b += S.req.map(q => `<div class="card row2"><span style="flex:1">🗣️ طلب زبون: <b>${esc(q.t)}</b></span><button class="btn s sm" onclick="rqD('${q.id}')">مسح</button></div>`).join('');
    }
    h += `<h3>${title}</h3>` + (b || `<p class="m">${none}</p>`);
  });
  h += `<div style="margin-top:20px;display:flex;gap:10px"><button class="btn" style="flex:1" onclick="location.href='https://wa.me/?text='+encodeURIComponent(generateReportText(reportSectionFilter))">📲 إرسال القسم بالواتساب</button><button class="btn s" onclick="navigator.clipboard.writeText(generateReportText(reportSectionFilter)).then(()=>toast('تم النسخ'))">نسخ النص</button></div>`;
  return { t: 'التقرير اليومي', h };
};

/* ===== 4. ملاحظة سريعة للبوشيط (شنو باقي / شنو خاصنا) ===== */
const _csCard7 = csCard;
csCard = function(i) {
  let h = _csCard7(i);
  const info = (i.rem ? `<div class="m">🟢 باقي: ${esc(i.rem)}</div>` : '') + (i.need ? `<div class="rs">🔴 خاصنا: ${esc(i.need)}</div>` : '');
  h = h.replace('<div class="sub">', info + `<div class="sub"><button class="btn s sm" onclick="csQuickNote('${i.id}')">باقي / خاصنا</button>`);
  return h;
};

function csQuickNote(id) {
  const i = find(id);
  ask('بوشيط ' + i.name, [
    { k: 'rem', l: 'شنو باقي عندنا فالمحل؟ (مثال: غير النسائي)', v: i.rem || '' },
    { k: 'need', l: 'شنو خاص يجيب المعلم؟ (مثال: ألوان رجالية / كحل)', v: i.need || '' }
  ]).then(v => {
    if (!v) return;
    commit('تم التحديث', () => {
      i.rem = v.rem.trim();
      i.need = v.need.trim();
      i.by = S.me;
      i.at = Date.now();
    });
  });
}

render();
