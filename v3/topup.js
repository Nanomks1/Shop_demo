/* ============================================================
   topup.js — التعبئة: أرصدة هواتف التعبئة (3 لكل شركة) وبطاقات التعبئة (5/10/20/50)
   لشركات IAM و ORANGE و INWI. يُحمَّل بعد core.js مباشرة.
   البيانات: S.tp (سجل لكل رصيد/فئة، يُزامَن) · الحدود: S.cfg.tp.
   يضيف أيضاً أنماط CSS الخاصة به وبأقسام التقرير الملوّنة (حقن تلقائي).
   ============================================================ */
(() => {
  Object.assign(IC, { topup: '<path d="M5 20v-4M10 20v-8M15 20V8M20 20V4"/>' });

  const OPS = [['IAM', '#2563eb'], ['ORANGE', '#ea580c'], ['INWI', '#9333ea']];
  const CARDS = [5, 10, 20, 50], PH = [1, 2, 3], TOTAL = OPS.length * (CARDS.length + PH.length);
  const D0 = { bo: 30, br: 10, cl: { 5: 3, 10: 3, 20: 3, 50: 3 }, rh: 10 };
  const GREY = '#94a3b8';

  const T = () => (S.tp = S.tp || []);
  const cf = () => { const c = (S.cfg && S.cfg.tp) || {}; return { ...D0, ...c, cl: { ...D0.cl, ...(c.cl || {}) } }; };
  const okE = () => isAdmin() || !S.users.length;
  const rid = (op, k, n) => 'tp_' + op + '_' + k + n;
  const rec = (op, k, n) => T().find(r => r.id == rid(op, k, n));
  const val = (op, k, n) => { const r = rec(op, k, n); return r && r.val != null ? r.val : null; };
  const num = s => { s = String(s ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(',', '.').replace(/[^\d.]/g, ''); const n = parseFloat(s); return isNaN(n) ? null : n; };
  const dm = v => +Number(v).toFixed(2) + ' درهم';
  const isToday = t => !!t && new Date(t).toDateString() == new Date().toDateString();
  const pad = n => String(n).padStart(2, '0');
  const when = t => { const d = new Date(t); return isToday(t) ? 'اليوم ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : fd(t); };

  /* الحالة: u غير مسجَّل · g متوفر · y قارب · r نافد/منخفض */
  const stP = v => v == null ? 'u' : v <= cf().br ? 'r' : v <= cf().bo ? 'y' : 'g';
  const stC = (n, v) => v == null ? 'u' : v <= 0 ? 'r' : v <= cf().cl[n] ? 'y' : 'g';
  const each = fn => OPS.forEach(([op]) => { PH.forEach(n => fn(op, 'p', n, stP(val(op, 'p', n)))); CARDS.forEach(n => fn(op, 'c', n, stC(n, val(op, 'c', n)))); });
  const tally = () => { const t = { r: 0, y: 0, g: 0, u: 0 }; each((a, b, c, s) => t[s]++); return t; };
  const phDone = () => { let n = 0; OPS.forEach(([op]) => PH.forEach(p => { const r = rec(op, 'p', p); if (r && r.val != null && isToday(r.at)) n++; })); return n; };
  const lastPh = () => T().filter(r => r.k == 'p' && r.at).sort((a, b) => b.at - a.at)[0];

  function put(op, k, n, v) {
    let r = rec(op, k, n);
    if (!r) { r = { id: rid(op, k, n), op, k, n }; T().push(r); }
    r.val = v; r.at = Date.now(); r.by = S.me || ''; save();
  }

  /* ---------- أسطر التقرير: [القسم, النص, الحالة, دالة «تم»] ---------- */
  window.tpLines = () => {
    const L = [];
    each((op, k, n, s) => {
      if (s != 'r' && s != 'y') return;
      const v = val(op, k, n), id = rid(op, k, n);
      L.push(['التعبئة', k == 'p' ? op + ' — هاتف ' + n + ' — الرصيد ' + dm(v) : op + ' — بطاقة ' + n + ' — ' + (v <= 0 ? 'نفد' : 'باقي ' + v), s, `tpFix('${id}')`]);
    });
    return L;
  };
  /* «تم» في التقرير: هاتف ← الرصيد الجديد · بطاقة ← الكمية التي وصلت */
  window.tpFix = id => {
    const p = id.split('_'), op = p[1], k = p[2][0], n = +p[2].slice(1);
    if (k == 'p') ask(op + ' — هاتف ' + n, [{ k: 'v', l: 'الرصيد الجديد بعد التعبئة (درهم)', t: 'tel' }], 'تم').then(v => { const x = v && num(v.v); if (x != null) { put(op, 'p', n, x); render(); toast('تم تحديث الرصيد'); } });
    else ask(op + ' — بطاقة ' + n, [{ k: 'v', l: 'الكمية التي وصلت', t: 'tel' }], 'تم الشراء').then(v => { const x = v && num(v.v); if (x > 0) { put(op, 'c', n, (val(op, 'c', n) || 0) + Math.round(x)); render(); toast('تمت الإضافة'); } });
  };

  /* ---------- التحديث في مكانه بلا إعادة رسم (حتى لا تُغلق لوحة المفاتيح) ---------- */
  const setT = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const lastLine = () => {
    const d = phDone(), l = lastPh();
    return d >= OPS.length * PH.length ? ['تم تحديث الأرصدة اليوم' + (l ? ' — ' + when(l.at) + (l.by ? ' — ' + l.by : '') : ''), 0] : ['أرصدة اليوم: ' + d + ' من ' + OPS.length * PH.length + ' (لم تكتمل)', 1];
  };
  function paint() {
    each((op, k, n, s) => {
      const id = op + '_' + k + n, d = $('tpd_' + id), r = $('tpr_' + id); if (!d || !r) return;
      d.style.background = s == 'u' ? GREY : DT[s];
      r.className = 'tpr' + (s == 'r' || s == 'y' ? ' ' + s : '');
      setT('tpt_' + id, s == 'r' ? (k == 'p' ? 'منخفض' : 'نفد') : s == 'y' ? 'قارب' : '');
    });
    const t = tally(); setT('tps_r', t.r); setT('tps_y', t.y); setT('tps_u', t.u);
    const l = lastLine(), e = $('tpl'); if (e) { e.textContent = l[0]; e.className = 'rsent' + (l[1] ? ' w' : ''); }
    OPS.forEach(([op]) => { const L = T().filter(r => r.op == op && r.at).sort((a, b) => b.at - a.at)[0]; setT('tpu_' + op, L ? when(L.at) : 'لم يُسجَّل بعد'); });
  }
  const tm = {};
  window.tpIn = (op, k, n, el, now) => {
    clearTimeout(tm[el.id]);
    const x = num(el.value); if (el.value.trim() === '' || x == null) return;
    const go1 = () => { put(op, k, n, k == 'c' ? Math.round(x) : x); paint(); };
    now ? go1() : (tm[el.id] = setTimeout(go1, 600));
  };
  window.tpStep = (op, n, d) => {
    const v = Math.max(0, (val(op, 'c', n) || 0) + d); put(op, 'c', n, v);
    const el = $('tpi_' + op + '_c' + n); if (el) el.value = v; paint();
  };

  /* ---------- الشاشة ---------- */
  const row1 = (op, k, n) => {
    const v = val(op, k, n), id = op + '_' + k + n, ph = k == 'p';
    return `<div class="tpr" id="tpr_${id}"><span class="dotl" id="tpd_${id}"></span><span class="tpn">${ph ? 'هاتف ' + n : 'بطاقة ' + n + ' درهم'}</span><span class="tpt" id="tpt_${id}"></span>`
      + (ph ? '' : `<button class="tpb" aria-label="نقص" onclick="tpStep('${op}',${n},-1)">−</button>`)
      + `<input class="tpi" id="tpi_${id}" inputmode="${ph ? 'decimal' : 'numeric'}" placeholder="—" value="${v == null ? '' : esc(v)}" oninput="tpIn('${op}','${k}',${n},this)" onchange="tpIn('${op}','${k}',${n},this,1)" onfocus="this.select()">`
      + (ph ? '<span class="m tpu">درهم</span>' : `<button class="tpb" aria-label="زيادة" onclick="tpStep('${op}',${n},1)">+</button>`) + '</div>';
  };
  VW.tp = () => {
    const t = tally(), l = lastLine();
    let h = `<div class="qbar rsum"><div class="qpill al"><div class="qn" id="tps_r">${t.r}</div><div class="ql">نافد / منخفض</div></div><div class="qpill wn"><div class="qn" id="tps_y">${t.y}</div><div class="ql">قارب النفاد</div></div><div class="qpill rp"><div class="qn" id="tps_u">${t.u}</div><div class="ql">غير مسجَّل</div></div></div>`
      + `<div id="tpl" class="rsent ${l[1] ? 'w' : ''}">${esc(l[0])}</div>`;
    OPS.forEach(([op, col]) => {
      h += `<div class="card tpop" style="--oc:${col}"><div class="tpoh"><b>${op}</b><span class="m" id="tpu_${op}"></span></div>`
        + '<div class="tpl">هواتف التعبئة — الرصيد المتبقي</div>' + PH.map(n => row1(op, 'p', n)).join('')
        + '<div class="tpl">بطاقات التعبئة — العدد المتبقي</div>' + CARDS.map(n => row1(op, 'c', n)).join('') + '</div>';
    });
    h += `<div class="row2" style="margin-top:12px"><button class="btn s" onclick="reportSectionFilter='topup';go('rep')">عرض في التقرير</button><button class="btn s" onclick="go('st_tp')">الحدود</button></div>`;
    return { t: 'التعبئة', h, a: paint };
  };

  /* ---------- الحدود ---------- */
  const LB = { bo: 'رصيد الهاتف: «قارب» عند ≤ (درهم)', br: 'رصيد الهاتف: «منخفض» عند ≤ (درهم)', rh: 'ساعة بدء تذكير الصباح (0 إلى 23)' };
  window.tpLim = k => {
    if (!okE()) return toast('للمدير فقط');
    const c = cf(), isC = k.startsWith('cl'), cur = isC ? c.cl[k.slice(2)] : c[k];
    ask('الحدود', [{ k: 'v', l: isC ? 'بطاقة ' + k.slice(2) + ': «قارب» عند عدد ≤' : LB[k], t: 'tel', v: String(cur) }]).then(v => {
      const x = v && num(v.v); if (x == null || (k == 'rh' && x > 23)) return;
      upd(() => { const o = { ...(S.cfg.tp || {}) }; if (isC) o.cl = { ...(o.cl || {}), [k.slice(2)]: x }; else o[k] = x; S.cfg.tp = o; });
    });
  };
  VW.st_tp = () => {
    const c = cf();
    return {
      t: 'حدود التعبئة',
      h: '<p class="m">تحدد متى يصير اللون برتقالياً أو أحمر في شاشة التعبئة والتقرير.</p><h3>أرصدة الهواتف</h3>'
        + row(LB.bo, "tpLim('bo')", c.bo) + row(LB.br, "tpLim('br')", c.br)
        + '<h3>بطاقات التعبئة (الأحمر عند 0 دائماً)</h3>' + CARDS.map(n => row('بطاقة ' + n + ' درهم: «قارب» عند ≤', "tpLim('cl" + n + "')", c.cl[n])).join('')
        + '<h3>التذكير</h3>' + row(LB.rh, "tpLim('rh')", c.rh + ':00')
        + '<div style="margin-top:14px"><button class="btn s" onclick="if(okTpE())upd(()=>{delete S.cfg.tp})">إرجاع الحدود الافتراضية</button></div>'
    };
  };
  window.okTpE = () => okE() || (toast('للمدير فقط'), false);

  /* ---------- الرئيسية والمزيد ---------- */
  HOME.top.push(() => {
    if (new Date().getHours() < cf().rh || phDone() >= OPS.length * PH.length) return '';
    return `<div class="card row2">${I('alert')}<span style="flex:1">لم تُسجَّل أرصدة التعبئة اليوم</span><button class="btn sm" onclick="go('tp')">سجّل الآن</button></div>`;
  });
  HOME.after.push(() => {
    const t = tally(), p = [];
    if (t.r) p.push(`<span class="dotl" style="background:${DT.r};margin-inline-end:4px"></span>${t.r} نافد`);
    if (t.y) p.push(`<span class="dotl" style="background:${DT.y};margin-inline-end:4px"></span>${t.y} قارب`);
    const sub = t.u == TOTAL ? 'لم تُسجَّل أرصدة بعد' : p.length ? p.join(' &nbsp; ') : 'كل شيء متوفر';
    return `<button class="card row2 tph" onclick="go('tp')"><span class="tpic">${ic('topup')}</span><span style="flex:1;min-width:0"><b style="display:block">التعبئة</b><span class="m">${sub}</span></span></button>`;
  });
  MORE.push({ g: 'rep', o: 15, l: 'حدود التعبئة', fn: "go('st_tp')" });

  /* ---------- الأنماط ---------- */
  const st = document.createElement('style');
  st.textContent = `
.tpop{border-top:5px solid var(--oc);padding:12px}
.tpoh{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:4px}
.tpoh b{font-size:1.15rem;letter-spacing:.5px}
.tpoh .m{font-size:.78rem}
.tpl{margin:10px 2px 2px;font-size:.82rem;font-weight:600;color:var(--m)}
.tpr{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:12px;margin:3px 0}
.tpr.r{background:color-mix(in srgb,#dc2626 12%,transparent)}
.tpr.y{background:color-mix(in srgb,#d97706 12%,transparent)}
.tpr .dotl{background:${GREY}}
.tpn{flex:1;min-width:0;font-weight:600}
.tpt{font-size:.76rem;font-weight:700;min-width:2.8rem;text-align:center}
.tpr.r .tpt{color:#dc2626}.tpr.y .tpt{color:#d97706}
.tpi{width:5.2rem;min-height:44px;margin:0;padding:0 6px;text-align:center;direction:ltr;font:inherit;font-weight:700;font-size:1.1rem;border:1px solid var(--b);border-radius:12px;background:var(--bg);color:var(--t)}
.tpb{width:44px;height:44px;flex:none;border:1px solid var(--b);border-radius:12px;background:var(--c);color:var(--t);font:inherit;font-size:1.4rem;font-weight:700;line-height:1;cursor:pointer}
.tpb:active{transform:scale(.92)}
.tpu{width:2.6rem;font-size:.8rem}
.tph .tpic{width:2.7rem;height:2.7rem;flex:none;border-radius:14px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,#0891b2 16%,var(--c));color:#0891b2}
.tph .tpic .ic{width:1.5rem;height:1.5rem}
.sch{display:flex;align-items:center;gap:8px;color:var(--t)}
.sch::before{content:"";width:5px;height:1.15em;border-radius:3px;background:var(--sc,var(--m))}
.rlist.sx{border-inline-start:5px solid var(--sc,var(--b))}`;
  document.head.appendChild(st);
})();
