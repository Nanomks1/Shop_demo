/* ============================================================
   report.js — التقرير اليومي: شاشة التقرير، نص الواتساب، وإعدادات التقرير.
   يعتمد على invLines() و stkL() من inventory.js، و dh من repair.js.
   ============================================================ */
(() => {
  const RTABS = [['all', 'الشامل'], ['phones', 'الهواتف'], ['glass', 'الأنتي كاس'], ['pochette', 'البوشيط'], ['acc', 'الإكسسوارات']];
  const RSEC = { phones: ['الهواتف الناقصة', 'الهواتف'], glass: ['الأنتي كاس', 'الأنتي كاس'], pochette: ['البوشيط', 'البوشيط'], acc: ['الإكسسوارات', 'الإكسسوارات'] };
  const RD = { lv: 'a', tt: 'تقرير محل عزيز', dt: 1, st: 1, pr: 0, pt: 1, rq: 1, pn: 1, em: 0, ft: '', hs: [] };
  const rcf = () => ({ ...RD, ...(S.cfg.rc || {}) });
  const okEdit = () => isAdmin() || !S.users.length;
  const rSecs = m => m == 'all' ? ['phones', 'glass', 'pochette', 'acc'] : [m];
  window.reportSectionFilter = 'all'; window.RLV = null;

  window.rcSet = o => { if (!okEdit()) return toast('للمدير فقط'); upd(() => { S.cfg.rc = { ...(S.cfg.rc || {}), ...o }; }); };
  window.rcHide = k => { const h = rcf().hs.slice(), i = h.indexOf(k); i < 0 ? h.push(k) : h.splice(i, 1); rcSet({ hs: h }); };
  window.rcTt = () => { if (!okEdit()) return toast('للمدير فقط'); ask('عنوان التقرير', [{ k: 't', l: 'العنوان (فارغ = بدون عنوان)', v: rcf().tt }]).then(v => { if (v) rcSet({ tt: v.t.trim() }); }); };
  window.rcFt = () => { if (!okEdit()) return toast('للمدير فقط'); ask('عبارة آخر التقرير', [{ k: 't', l: 'مثال: شكراً — فارغ = بدون عبارة', v: rcf().ft }]).then(v => { if (v) rcSet({ ft: v.t.trim() }); }); };

  const lines = () => { const c = rcf(); let L = invLines(!!c.pn); if ((window.RLV || c.lv) == 'r') L = L.filter(x => x[2] == 'r'); return L; };
  const secs = m => rSecs(m).filter(k => !rcf().hs.includes(k));
  const partsL = () => S.rp.filter(r => r.st == 'in' && r.part);
  const dstr = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); };
  const cnt = (a, n) => n == '0' ? ' — نفد' : ' — العدد ' + a + n;
  const fmtT = x => {
    let s = x[1].replace(/\s—\s(?:العدد |المجموع |المتوفر )(≈?)(\d+)/, (m, a, n) => cnt(a, n)).replace(/\s—\s(\d+)$/, (m, n) => cnt('', n));
    if (x[2] == 'r' && !/نفد/.test(s)) s += ' — نفد'; return s;
  };
  /* كتل التقرير: قسم لكل مجموعة + قطع الصيانة + طلبات الزبائن */
  const blocks = mode => {
    const c = rcf(), L = lines(), out = [];
    secs(mode).forEach(k => {
      const ls = L.filter(x => x[0] == RSEC[k][0]).sort((a, b) => (a[2] == 'r' ? 0 : 1) - (b[2] == 'r' ? 0 : 1));
      out.push({ k, t: RSEC[k][1], ls: ls.map(x => ({ r: x[2] == 'r', s: fmtT(x), x })) });
    });
    if (mode == 'all' || mode == 'acc') {
      if (c.pt) out.push({ k: 'parts', t: 'قطع الصيانة', ls: partsL().map(r => ({ r: 0, s: r.part + (r.dev && !nz(r.part).includes(nz(r.dev)) ? ' — ' + r.dev : '') })) });
      if (c.rq && mode == 'all') out.push({ k: 'req', t: 'طلبات الزبائن', ls: S.req.map(q => ({ r: 0, s: q.t, id: q.id })) });
    }
    return out;
  };
  /* تداخل العربي والإنجليزي: كل مقطع لاتيني يُعزل بعلامة اتجاه كي لا ينقلب ترتيب السطر */
  const bd = s => {
    if (!/[A-Za-z]/.test(s)) return s;
    const w = s.replace(/[A-Za-z0-9][A-Za-z0-9+\-\/.#&' ]*/g, m => { if (!/[A-Za-z]/.test(m)) return m; const q = m.replace(/\s+$/, ''); return '\u200E' + q + '\u200E' + m.slice(q.length); });
    return s.charAt(0) == '*' ? w : '\u200F' + w + '\u200F';
  };
  window.generateReportText = function (mode = 'all') {
    const c = rcf(), B = blocks(mode), o = [], N = B.filter(b => b.k != 'parts' && b.k != 'req');
    const need = N.reduce((a, b) => a + b.ls.length, 0), red = N.reduce((a, b) => a + b.ls.filter(x => x.r).length, 0);
    const head = [c.tt ? '*' + c.tt + '*' : '', c.dt ? dstr() : ''].filter(Boolean).join(' — '); if (head) o.push(head);
    o.push(need ? 'للشراء: ' + need + (red ? ' (نافد ' + red + ')' : '') : 'لا يوجد نقص حالياً');
    { const stl = rnd().length; if (stl) o.push('تنبيه: ' + stl + ' صنف لم يُؤكَّد منذ أكثر من ' + lim('stale') + ' أيام'); }
    B.forEach(b => { if (!b.ls.length && !c.em) return; o.push(''); o.push('*' + b.t + '*'); if (b.ls.length) b.ls.forEach(x => o.push('- ' + x.s)); else o.push('- لا نقص'); });
    if ((mode == 'all' || mode == 'phones') && c.st && !c.hs.includes('phones')) {
      const s = stkL();
      if (s.length) { o.push(''); o.push('*الهواتف المتوفرة*'); s.forEach(i => o.push('- ' + stkN(i) + ' — ' + i.cnt + (rsQ(i) ? ' (محجوز ' + rsQ(i) + ')' : '') + (c.pr && i.price ? ' — ' + dh(i.price) : ''))); }
    }
    if (c.ft) { o.push(''); o.push(c.ft); }
    return o.map(bd).join('\n');
  };

  /* ---------- شاشة التقرير ---------- */
  VW.rep = () => {
    const c = rcf(), s = stkL(), lv = window.RLV || c.lv, f = window.reportSectionFilter;
    const tabs = RTABS.filter(([k]) => k == 'all' || !c.hs.includes(k));
    if (!tabs.some(([k]) => k == f)) window.reportSectionFilter = 'all';
    const F = window.reportSectionFilter, B = blocks(F);
    let h = `<div class="rtabs">${tabs.map(([k, l]) => `<button class="tag ${F === k ? 'on' : ''}" onclick="reportSectionFilter='${k}';render()">${l}</button>`).join('')}</div>`
      + `<div class="rtabs"><button class="tag ${lv == 'a' ? 'on' : ''}" onclick="RLV='a';render()">نافد وقارب</button><button class="tag ${lv == 'r' ? 'on' : ''}" onclick="RLV='r';render()">نافد فقط</button><button class="tag" style="margin-inline-start:auto" onclick="go('st_rep')">تخصيص</button></div>`;
    { const stl = rnd().length; if (stl) h += `<div class="card row2"><span style="flex:1">⚠️ ${stl} صنف لم يُؤكَّد منذ أكثر من ${lim('stale')} أيام</span><button class="btn sm" onclick="go('jl')">افتح الجولة</button></div>`; }
    B.forEach(b => {
      const x = b.ls.map(l => b.k == 'parts' ? `<div class="card row2"><span style="flex:1">${esc(l.s)}</span></div>`
        : b.k == 'req' ? `<div class="card row2"><span style="flex:1">${esc(l.s)}</span><button class="btn s sm" onclick="rqD('${l.id}')">مسح</button></div>`
          : `<div class="card row2"><span class="dotl" style="background:${DT[l.x[2]]}"></span><span style="flex:1">${esc(l.s)}</span><button class="btn sm" onclick="${l.x[3]}">تم الشراء</button></div>`).join('');
      if (x) h += `<h3>${b.t}</h3>` + x; else if (c.em) h += `<h3>${b.t}</h3><p class="m">لا نقص</p>`;
    });
    if ((F == 'all' || F == 'phones') && c.st && !c.hs.includes('phones') && s.length)
      h += '<h3>الهواتف المتوفرة</h3>' + s.map(i => `<div class="card row2"><span style="flex:1">${esc(stkN(i))}</span><span class="m">${i.cnt}${rsQ(i) ? ' (محجوز ' + rsQ(i) + ')' : ''}${c.pr && i.price ? ' · ' + esc(dh(i.price)) : ''}</span></div>`).join('');
    if (!h.includes('<h3>')) h += '<p class="m" style="text-align:center;margin:24px 0">لا يوجد نقص حالياً</p>';
    h += `<details class="card" style="margin-top:14px"><summary><b>معاينة النص</b></summary><div style="white-space:pre-wrap;margin-top:8px;line-height:1.8">${esc(generateReportText(F))}</div></details>`
      + `<div style="margin-top:14px;display:flex;gap:10px"><button class="btn" style="flex:1" onclick="location.href='https://wa.me/?text='+encodeURIComponent(generateReportText(reportSectionFilter))">${I('send')} إرسال بالواتساب</button><button class="btn s" onclick="navigator.clipboard.writeText(generateReportText(reportSectionFilter)).then(()=>toast('تم النسخ'))">نسخ</button></div>`;
    return { t: 'التقرير اليومي', h };
  };

  /* ---------- إعدادات التقرير ---------- */
  const yn = v => v ? 'نعم' : 'لا', tog = (l, k) => row(l, 'rcSet({' + k + ':' + (rcf()[k] ? 0 : 1) + '})', yn(rcf()[k]));
  VW.st_rep = () => {
    const c = rcf();
    return {
      t: 'إعدادات التقرير', h: '<p class="m">هذه الإعدادات تحدد ما يظهر في التقرير ونصّ الواتساب، وتنطبق على كل الأجهزة.</p>'
        + '<h3>العنوان والتوقيع</h3>' + row('عنوان التقرير', 'rcTt()', c.tt || 'بدون') + tog('إظهار التاريخ بجانب العنوان', 'dt') + row('عبارة في آخر التقرير', 'rcFt()', c.ft || 'بدون')
        + '<h3>ما الذي يُدرج</h3>' + tog('قائمة الهواتف المتوفرة', 'st') + tog('أسعار الهواتف المتوفرة', 'pr') + tog('قطع الصيانة المنتظرة', 'pt') + tog('طلبات الزبائن', 'rq') + tog('ملاحظات البوشيط (باقي / خاصنا)', 'pn') + tog('إظهار الأقسام التي لا نقص فيها', 'em')
        + '<h3>المستوى الافتراضي</h3><div style="display:flex;gap:6px;margin-bottom:10px"><button class="tag ' + (c.lv == 'a' ? 'on' : '') + '" onclick="rcSet({lv:\'a\'})">النافد وقارب النفاد</button><button class="tag ' + (c.lv == 'r' ? 'on' : '') + '" onclick="rcSet({lv:\'r\'})">النافد فقط</button></div>'
        + '<h3>الأقسام الظاهرة في التقرير</h3>' + RTABS.filter(([k]) => k != 'all').map(([k, l]) => row(l, "rcHide('" + k + "')", yn(!c.hs.includes(k)))).join('')
        + `<div style="margin-top:14px"><button class="btn s" onclick="rcSet({lv:'a',tt:'تقرير محل عزيز',dt:1,st:1,pr:0,pt:1,rq:1,pn:1,em:0,ft:'',hs:[]})">إرجاع الإعدادات الافتراضية</button></div>`
    };
  };
  MORE.push({ g: 'rep', o: 10, l: 'إعدادات التقرير', fn: "go('st_rep')" });
})();
