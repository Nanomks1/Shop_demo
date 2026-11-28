/* repairform.js — الصيانة (2/3): الأمانات، نموذج الاستلام، الكاميرا، الحفظ والتسليم. يُحمَّل بعد repair.js وقبل repairguide.js */
function rpAddonOpts(dev) {
  const out = [{ k: '', l: '— بدون إرفاق سلعة —' }], nd = nz(dev || '');
  if (nd.length >= 2) {
    S.gg.filter(g => g.models.some(m => gDevHit(dev, m) && glBrDev(g, m, dev))).forEach(g => {
      const mName = g.models.find(m => gDevHit(dev, m) && glBrDev(g, m, dev)) || g.models[0];
      S.tags.glass.forEach((ty, j) => {
        if (!gHas(g, mName, ty)) return;
        const it = gitem(g.id, ty), tot = it ? gTot(it, g) : 0;
        if (tot > 0) out.push({ k: `gl:${g.id}:${j}:${mName}`, l: `أنتي كاس ${ty} (${mName})${it && it.price ? ' — ' + dh(it.price) : ''}` });
      });
    });
    S.items.filter(i => i.sec == 'case' && gDevHit(dev, i.name)).forEach(i => {
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
    const cur = warToLbl(pr.war ?? (r.war != null ? r.war : lim('rpWar'))), wo = WAR_SEL.includes(cur) ? WAR_SEL : [cur, ...WAR_SEL];
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
      + `<div><b><bdi>${esc(r.dev || 'هاتف')}</bdi> — ${esc(r.fault)}</b>${r.cap ? ` · السعر: <b>${esc(dh(r.cap))}</b>` : ''}${r.dep ? ` · العربون: <b>${esc(dh(r.dep))}</b>` : ''}</div>`
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
    if (remDebt > 0 && !r.debt && canDebtAdd()) {
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
    const wk = r.res == 'ok' ? 'rp_ok' : r.res == 'fail' ? 'rp_fail' : 'rp_ref';
    const msg = typeof waMsg == 'function'
      ? waMsg(wk, { الزبون: r.name, الجهاز: dev, التكلفة: c })
      : `مرحباً ${r.name}، ${r.res == 'ok' ? `هاتفك ${dev} جاهز في المحل.${c}` : r.res == 'fail' ? `للأسف تعذّر إصلاح هاتفك ${dev}. يمكنك استلامه من المحل.${c}` : `هاتفك ${dev} جاهز للاستلام بدون إصلاح.${c}`}\n— ${shopName()}`;
    (r.calls = r.calls || []).push('واتساب ' + fd(Date.now()) + ' ' + S.me);
    save(); render();
    location.href = 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg);
  };
  if (rnum(r.tel).length >= 8) return send(r.tel);
  ask('رقم هاتف ' + r.name, [{ k: 't', l: 'أدخل رقم الهاتف لإرسال رسالة الجاهزية وحفظه في التذكرة', t: 'tel', v: r.tel || '' }], 'إرسال واتساب').then(v => {
    if (!v || !v.t.trim()) return;
    r.tel = v.t.trim(); save(); render(); send(r.tel);
  });
};
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
window.rEd = function (id) {
  const rec = id ? rf(id) : {};
  if (id && rec && rec.st == 'dn' && !can('rpDone')) return toast('تعديل الصيانة المسلّمة للمدير فقط');
  $('sh').innerHTML = ''; sheetOpen(v => rDone(v, rec)); rForm(rec);
};
function rForm(rec) {
  ZR = rec; ZP = [...(rec.pat || [])]; ZK = [...(rec.chk || [])]; ZI = rec.img || ''; ZW = rec.id ? +(rec.war ?? 0) : +(rec.war ?? lim('rpWar')); ZL = rec.loc || '';
  fsInit([], {}, 'rp', rec);
  const shownImg = ZI.startsWith('data:') ? ZI : (rec.id && IMG[rec.id]) || '';
  const tkShow = rec.tk || '', moreOpen = (rec.imei || +rec.war || (rec.pat && rec.pat.length > 1)) ? ' open' : '';
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
    + `<details class="card rp-det"${moreOpen}><summary><b>تفاصيل إضافية</b> <span class="m">(نمط القفل، الضمان، IMEI)</span></summary>`
    + `<div${hh('rp', 'pat')}><label>نمط القفل (ارسمه بإصبعك)</label><div class="row2"><svg id="zsv" viewBox="0 0 120 120" width="135" class="rp-pat-pad" onpointerdown="ZD=1;rP(event,1)" onpointermove="if(ZD)rP(event)" onpointerup="ZD=0" onpointercancel="ZD=0">${PI(ZP)}</svg><button type="button" class="btn s sm" onclick="ZP=[];$('zsv').innerHTML=PI(ZP)">مسح النمط</button></div></div>`
    + `<label${hh('rp', 'war')}>ضمان الإصلاح (يبدأ من تاريخ التسليم)<div class="rp-chip-box">${WAR_OPTS.map(([d, l]) => `<button type="button" class="tag war-tg ${ZW === d ? 'on' : ''}" onclick="setRpWar(${d})">${l}</button>`).join('')}</div><input id="r_war" type="tel" value="${ZW || ''}" placeholder="أو اكتب عدد أيام الضمان (0 = بدون ضمان)" oninput="setRpWar(+dg(this.value)||0,1)"></label>`
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
function rKc() {
  const L = rpChkTags();
  $('rk').innerHTML = L.map((k, j) => `<button type="button" class="tag ${ZK.includes(k) ? 'on' : ''}" onclick="rKt(${j})">${esc(k)}</button>`).join('');
}
function rKt(j) { const k = rpChkTags()[j]; if (!k) return; ZK = ZK.includes(k) ? ZK.filter(x => x != k) : [...ZK, k]; rKc(); }
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
    loc: ZL,
    lock: $('r_l').value.trim(), pat: ZP, chk: ZK, img: ZI,
    note: $('r_o').value.trim(), imei: $('r_imei').value.trim(),
    war: Math.max(0, Math.floor(+dg($('r_war').value) || 0)),
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
  const tk = tkCode(tkMax() + 1);
  commit('تم الاستلام — تذكرة #' + tk, () => {
    const actualTk = nextTk(), id = uid();
    if (v.img && v.img.startsWith('data:image')) { putImg(id, v.img); v.img = 'idb:' + id; }
    S.rp.push({ id, tk: actualTk, st: 'in', t0: Date.now(), by: S.me, calls: [], ...v });
  });
  if (moreSame) setTimeout(() => { const rec2 = { name: v.name, tel: v.tel }; $('sh').innerHTML = ''; sheetOpen(x => rDone(x, rec2)); rForm(rec2); }, 380);
}
window.rpZoom = function (id) {
  const r = rf(id), src = r && rImg(r); if (!src) return;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc((r.tk ? '#' + r.tk + ' — ' : '') + r.name + ' — ' + r.dev)}</h3><img src="${src}" class="rp-zoom-im"><div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
  sheetOpen(() => { });
};