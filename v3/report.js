/* ============================================================
   report.js — التقرير اليومي: شاشة التقرير، نص الواتساب، سجل ما وصل اليوم، وإعدادات التقرير.
   يعتمد على invLines() من invreport.js و stkGroups() من invphones.js، و dh/rqTel/rqWA من repair.js.
   ============================================================ */
(() => {
  const RTABS = [['all', 'الشامل'], ['topup', 'التعبئة'], ['phones', 'الهواتف'], ['glass', 'الأنتي كاس'], ['pochette', 'البوشيط'], ['acc', 'الإكسسوارات']];
  const RSEC = { topup: ['التعبئة', '📶 التعبئة'], phones: ['الهواتف الناقصة', '📱 الهواتف'], glass: ['الأنتي كاس', '🛡️ الأنتي كاس'], pochette: ['البوشيط', '🅿️ البوشيط'], acc: ['الإكسسوارات', '🔌 الإكسسوارات'] };
  const SCOL = { topup: '#0891b2', phones: '#2563eb', glass: '#0d9488', pochette: '#db2777', acc: '#7c3aed', req: '#64748b' };
  const RD = { lv: 'a', dt: 1, st: 1, pr: 0, rq: 1, pn: 1, em: 0, ft: '', hs: [], rr: 0, rd: 0, rm: 1, nd: [], rh: 16, wa: '', stRnd: 1, tpSum: 1 };
  const rcf = () => ({ ...RD, tt: 'تقرير ' + shopName(), ...(S.cfg.rc || {}) });
  const okEdit = () => isAdmin() || !S.users.length;
  const rSecs = m => m == 'all' ? ['topup', 'phones', 'glass', 'pochette', 'acc'] : [m];
  const secs = m => rSecs(m).filter(k => !rcf().hs.includes(k));
  const curTab = () => {
    const c = rcf(), f = V.rf || 'all';
    const tabs = RTABS.filter(([k]) => k == 'all' || !c.hs.includes(k));
    return tabs.some(([k]) => k == f) ? f : 'all';
  };
  const curLv = () => V.rlv || rcf().lv;
  const isFiltered = () => curTab() != 'all' || (curLv() == 'r' && rcf().lv != 'r');
  const filterDesc = () => {
    const p = [], f = curTab(), lv = curLv();
    if (f != 'all') p.push((RTABS.find(x => x[0] == f) || [, f])[1]);
    if (lv == 'r') p.push('نافد فقط');
    return p.join(' · ') || 'الشامل';
  };
  window.rcSet = o => { if (!okEdit()) return toast('للمدير فقط'); upd(() => { S.cfg.rc = { ...(S.cfg.rc || {}), ...o }; }); };
  window.rcReset = () => { if (!okEdit()) return toast('للمدير فقط'); upd(() => { delete S.cfg.rc; }); };
  window.rcHide = k => { const h = rcf().hs.slice(), i = h.indexOf(k); i < 0 ? h.push(k) : h.splice(i, 1); rcSet({ hs: h }); };
  window.rcTt = () => { if (!okEdit()) return toast('للمدير فقط'); ask('عنوان التقرير', [{ k: 't', l: 'العنوان (فارغ = بدون عنوان)', v: rcf().tt }]).then(v => { if (v) rcSet({ tt: v.t.trim() }); }); };
  window.rcFt = () => { if (!okEdit()) return toast('للمدير فقط'); ask('عبارة آخر التقرير', [{ k: 't', l: 'مثال: شكراً — فارغ = بدون عبارة', v: rcf().ft }]).then(v => { if (v) rcSet({ ft: v.t.trim() }); }); };
  window.rcWaEd = () => {
    if (!okEdit()) return toast('للمدير فقط');
    ask('رقم واتساب المعلم (اختياري)', [{ k: 'w', l: 'يُفتح مباشرة عند إرسال التقرير الشامل (اتركه فارغاً لاختيار المحادثة يدوياً)', t: 'tel', v: rcf().wa || '' }]).then(v => {
      if (!v) return;
      const t = v.w.trim();
      if (t && waNum(t).length < 8) return toast('رقم الهاتف قصير أو غير صالح');
      rcSet({ wa: t });
    });
  };
  /* سجل ما تم تقييد وصوله اليوم (يُحفظ داخل S.cfg.rin ويتزامن تلقائياً ويُستعاد مع «تراجع») */
  window.rcLogIn = (k, ref, open, lbl, det) => {
    const now = Date.now(), cut = now - 2 * 864e5;
    S.cfg.rin = (S.cfg.rin || []).filter(x => x && x.t > cut).slice(-59);
    S.cfg.rin.push({ id: uid(), t: now, by: S.me || '', k, ref: String(ref || ''), open: String(open || ''), lbl: String(lbl || ''), det: String(det || '') });
  };
  const todayRin = () => {
    const d = new Date().toDateString();
    return (S.cfg.rin || []).filter(x => x && x.t && new Date(x.t).toDateString() == d).slice().reverse();
  };
  const rinKeySet = () => {
    const s = new Set();
    todayRin().forEach(x => { if (x.ref) s.add(x.k + ':' + x.ref); });
    return s;
  };
  const rinKeyOf = (fn, arg) => {
    if (fn == 'buyP') { const it = find(arg); return it ? 'phones:' + phGroup(it).key : ''; }
    if (fn == 'buyC') return 'case:' + arg;
    if (fn == 'buyG') {
      const i0 = find(arg), g = i0 ? S.gg.find(x => x.id == i0.gid) : S.gg.find(x => x.id == arg);
      return g ? 'glass:' + g.id + '|' + (i0 ? i0.ty : (gFirstTy(g) || 'عادي')) : '';
    }
    if (fn == 'buyA') return 'acc:' + arg;
    if (fn == 'agBuy') return 'ag:' + arg;
    if (fn == 'tpFix') return 'tp:' + arg;
    return '';
  };
  window.rcOpenRin = id => {
    const x = (S.cfg.rin || []).find(r => r && r.id == id); if (!x) return;
    if (x.k == 'case' && typeof csOpen == 'function') return csOpen(x.open);
    if (x.k == 'phones' && typeof phGO == 'function') {
      const it = find(x.open) || ph().find(i => phKey(i) == x.ref);
      if (it) return phGO(it.id);
    }
    if (x.k == 'glass' && typeof glOpen == 'function') {
      const p = String(x.open || '').split('|'), gid = p[0], ty = p.slice(1).join('|');
      if (S.gg.some(g => g.id == gid)) return glOpen(gid, Math.max(0, S.tags.glass.indexOf(ty)));
    }
    if (x.k == 'acc' && typeof acOpen == 'function') return acOpen(x.open);
    if (x.k == 'ag' && typeof agOpen == 'function') return agOpen(x.open);
    if (x.k == 'tp') return go('tp');
  };
  /* الضغط على سطر الصنف في شاشة التقرير يفتح بطاقته/نافذته للتفاصيل والتعديل */
  window.rcOpenItem = (fn, arg) => {
    if (fn == 'buyP' && typeof phGO == 'function') return phGO(arg);
    if (fn == 'buyC' && typeof csOpen == 'function') return csOpen(arg);
    if (fn == 'buyG' && typeof glOpen == 'function') {
      const i0 = find(arg), g = i0 ? S.gg.find(x => x.id == i0.gid) : S.gg.find(x => x.id == arg);
      if (!g) return;
      const ty = i0 ? i0.ty : (gFirstTy(g) || 'عادي');
      return glOpen(g.id, Math.max(0, S.tags.glass.indexOf(ty)));
    }
    if (fn == 'buyA' && typeof acOpen == 'function') return acOpen(arg);
    if (fn == 'agBuy' && typeof agOpen == 'function') return agOpen(arg);
    if (fn == 'tpFix') return go('tp');
  };
  const lines = lvOv => {
    const c = rcf(), lv = lvOv || curLv();
    let L = invLines(!!c.pn).concat(typeof tpLines == 'function' ? tpLines() : []);
    if (lv == 'r') L = L.filter(x => x[2] == 'r');
    return L;
  };
  window.repNeedCount = () => {
    const c = rcf();
    let L = invLines(false).concat(typeof tpLines == 'function' ? tpLines() : []).filter(x => secs('all').some(k => RSEC[k][0] == x[0]));
    if (c.lv == 'r') L = L.filter(x => x[2] == 'r');
    return L.length;
  };
  /* عدد النواقص لكل قسم (نفس حساب repNeedCount) لعرضه على أقسام الرئيسية */
  window.repNeedBy = () => {
    const c = rcf();
    let L = invLines(false).concat(typeof tpLines == 'function' ? tpLines() : []).filter(x => secs('all').some(k => RSEC[k][0] == x[0]));
    if (c.lv == 'r') L = L.filter(x => x[2] == 'r');
    const o = {}; Object.keys(RSEC).forEach(k => { o[k] = L.filter(x => x[0] == RSEC[k][0]).length; });
    return o;
  };
  const dstr = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); };
  const rpLine = () => {
    const i = S.rp.filter(x => x.st == 'in').length, d = S.rp.filter(x => x.st == 'rd');
    const ok = d.filter(x => x.res != 'fail' && x.res != 'ref').length, nf = d.length - ok;
    const late = d.filter(x => Date.now() - (x.t1 || x.t0) > lim('rpLate') * 864e5).length;
    return i || d.length ? 'الصيانة: ' + i + ' في المحل · ' + ok + ' جاهز للتسليم' + (nf ? ' · ' + nf + ' لم يصلح' : '') + (late ? ' (منسي ' + late + ')' : '') : '';
  };
  const dbLine = () => {
    const O = (S.debt || []).filter(x => !x.paid); if (!O.length) return '';
    const tot = Math.round(O.reduce((s, d) => s + dRem(d), 0) * 100) / 100, late = O.filter(dbtLate).length;
    return 'ديون مفتوحة: ' + O.length + ' بمجموع ' + tot + ' درهم' + (late ? ' (' + late + ' متأخر)' : '');
  };
  const sentToday = () => { const x = S.cfg.rs; return !!(x && x.t && new Date(x.t).toDateString() == new Date().toDateString()); };
  const cleanReq = s => String(s || '').replace(/(?:\+?212|0)[\s\-.]*[567](?:[\s\-.]*\d){8}/g, '').replace(/\s*[-–—:]\s*$/, '').replace(/\s{2,}/g, ' ').trim();
  const tpAdjTxt = ts => {
    if (!ts || !(ts.adjList && ts.adjList.length)) return '';
    const p = [];
    if (ts.extTot > 0) p.push('تزويد خارجي +' + ts.extTot + ' درهم');
    if (ts.inTot > 0) p.push('إضافة للصندوق +' + ts.inTot + ' درهم');
    if (ts.outTot > 0) p.push('سحب المعلم −' + ts.outTot + ' درهم');
    return p.join(' · ');
  };
  const tpSumTxt = ts => {
    if (!ts || (ts.grand <= 0 && !ts.cap && ts.incomplete && !(ts.adjList && ts.adjList.length))) return '';
    const base = `حساب التعبئة: بطاقات ${ts.cardsTot} + هواتف ${ts.phonesTot} + الصندوق ${ts.cashTot} = ${ts.grand}`;
    const refN = ts.expected || ts.cap;
    const adjS = ts.netAdj ? ` (المرجع ${ts.cap}${ts.netAdj > 0 ? '+' : '−'}${Math.abs(ts.netAdj)})` : '';
    if (ts.incomplete) return base + ' درهم (الجرد غير مكتمل اليوم)';
    if (ts.cap > 0) {
      if (ts.diff === 0) return base + ` من ${refN} درهم${adjS} (متوازن ✓)`;
      if (ts.diff < 0) return `⚠ ${base} من ${refN} درهم${adjS} (ناقص ${Math.abs(ts.diff)} درهم)`;
      return `${base} من ${refN} درهم${adjS} (زائد ${ts.diff} درهم)`;
    }
    return base + ' درهم';
  };
  /* حساب عدد النواقص والطلبات التي ظهرت بعد آخر إرسال اليوم */
  function newAfterSend() {
    const x = S.cfg.rs; if (!x || !x.t || !sentToday()) return 0;
    const t = x.t, c = rcf(), onlyR = c.lv == 'r', okSt = s => s != 'g' && (!onlyR || s == 'r');
    let n = 0;
    if (!c.hs.includes('phones')) n += phGroupsOf(ph()).filter(g => g.cond != 'مستعمل' && !g.stp && okSt(phGSt(g)) && (g.at || 0) > t).length;
    if (!c.hs.includes('glass')) S.gg.forEach(g => S.tags.glass.filter(ty => gShow(g, ty)).forEach(ty => { const i = gitem(g.id, ty); if (i && okSt(gSt(i, g, ty)) && (i.at || 0) > t) n++; }));
    if (!c.hs.includes('pochette')) n += S.items.filter(i => i.sec == 'case' && okSt(csSt(i)) && (i.at || 0) > t).length;
    if (!c.hs.includes('acc')) {
      n += S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g && okSt(acSt(i)) && (i.at || 0) > t).length;
      n += agList().filter(d => okSt(d.st) && (d.at || 0) > t).length;
    }
    if (!c.hs.includes('topup') && typeof tpLines == 'function') {
      const tpIds = new Set(tpLines().filter(l => !onlyR || l[2] == 'r').map(l => (String(l[3] || '').match(/'([^']+)'/) || [])[1]).filter(Boolean));
      n += (S.tp || []).filter(r => r && tpIds.has(r.id) && (r.at || 0) > t).length;
    }
    if (c.rq) n += (S.req || []).filter(q => (q.at || 0) > t).length;
    return n;
  }
  window.rcMark = () => { S.cfg.rs = { t: Date.now(), by: S.me }; save(); };
  function rcCopyFallback(txt, waTo) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => {
        toast('التقرير طويل — تم نسخه تلقائياً، الصقه في واتساب', null, 8000);
        setTimeout(() => { location.href = 'https://wa.me/' + waTo; }, 450);
      }).catch(() => toast('التقرير طويل جداً — انسخه من زر «نسخ» ثم الصقه في واتساب', null, 8000));
    } else {
      toast('التقرير طويل جداً — انسخه من زر «نسخ» ثم الصقه في واتساب', null, 8000);
      location.href = 'https://wa.me/' + waTo;
    }
  }
  function rcExec(kind, mode, lv) {
    const c = rcf(), txt = generateReportText(mode, lv);
    const isFull = mode == 'all' && lv == c.lv;
    if (kind == 'copy') {
      navigator.clipboard.writeText(txt)
        .then(() => toast(isFull ? 'تم نسخ التقرير الشامل' : 'تم نسخ القسم المعروض'))
        .catch(() => toast('تعذّر النسخ'));
      return;
    }
    if (isFull) { rcMark(); render(); }
    const waTo = isFull && c.wa ? waNum(c.wa) : '';
    const enc = encodeURIComponent(txt);
    if (enc.length <= 3500) {
      location.href = 'https://wa.me/' + waTo + '?text=' + enc;
      return;
    }
    if (navigator.share) {
      navigator.share({ text: txt }).catch(err => {
        if (err && err.name == 'AbortError') return;
        rcCopyFallback(txt, waTo);
      });
    } else {
      rcCopyFallback(txt, waTo);
    }
  }
  function rcPickSend(kind) {
    const c = rcf();
    if (!isFiltered()) return rcExec(kind, 'all', c.lv);
    const desc = filterDesc(), isWa = kind == 'wa';
    $('sh').innerHTML = `<div class="bar"></div><h3>${isWa ? 'ماذا تريد أن ترسل بالواتساب؟' : 'ماذا تريد أن تنسخ؟'}</h3>`
      + `<p class="m">الشاشة مفلترة حالياً على «<b>${esc(desc)}</b>». اختر ما تريد:</p>`
      + `<button class="btn" onclick="finish('all')">${isWa ? I('send') + ' إرسال التقرير الشامل (كل الأقسام)' : 'نسخ التقرير الشامل (كل الأقسام)'}</button>`
      + `<button class="btn s" onclick="finish('cur')">${isWa ? 'إرسال المعروض حالياً فقط (' + esc(desc) + ')' : 'نسخ المعروض حالياً فقط (' + esc(desc) + ')'}</button>`
      + (isWa ? `<p class="m" style="text-align:center;margin-top:4px">إرسال قسم واحد لا يُسجَّل كإرسال يومي ولا يُفتح تلقائياً لرقم المعلم.</p>` : '')
      + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button></div>`;
    sheetOpen(ch => {
      if (ch == 'all') rcExec(kind, 'all', c.lv);
      else if (ch == 'cur') rcExec(kind, curTab(), curLv());
    });
  }
  window.rcSend = () => rcPickSend('wa');
  window.rcCopy = () => rcPickSend('copy');
  const sentLine = () => {
    const x = S.cfg.rs;
    if (!x || !x.t) return ['لم يُرسل التقرير بعد', 1];
    const t = sentToday(), d = new Date(x.t), p = n => String(n).padStart(2, '0');
    const base = 'آخر إرسال: ' + (t ? 'اليوم ' + p(d.getHours()) + ':' + p(d.getMinutes()) : fd(x.t)) + (x.by ? ' — ' + x.by : '');
    const nw = t ? newAfterSend() : 0;
    if (nw > 0) return [base + ' · وظهرت ' + arCnt(nw, 'ناقص جديد', 'ناقصان جديدان', 'نواقص جديدة', 'ناقصاً جديداً') + ' بعدها', 1];
    return [base, !t];
  };
  const cnt = (a, n) => n == '0' ? ' — نفد' : ' — العدد ' + a + n;
  const fmtT = x => {
    let s = x[1].replace(/\s—\s(?:العدد |المجموع |المتوفر )(≈?)(\d+)/, (m, a, n) => cnt(a, n)).replace(/\s—\s(\d+)$/, (m, n) => cnt('', n));
    if (x[2] == 'r' && !/نفد/.test(s)) s += ' — نفد';
    return s;
  };
  const blocks = (mode, lvOv) => {
    const c = rcf(), L = lines(lvOv), out = [];
    secs(mode).forEach(k => {
      const ls = L.filter(x => x[0] == RSEC[k][0]).sort((a, b) => (a[2] == 'r' ? 0 : 1) - (b[2] == 'r' ? 0 : 1));
      out.push({ k, t: RSEC[k][1], ls: ls.map(x => ({ r: x[2] == 'r', s: k == 'topup' ? x[1] : fmtT(x), x })) });
    });
    if (c.rq && mode == 'all') out.push({ k: 'req', t: 'طلبات الزبائن', ls: S.req.map(q => ({ r: 0, s: q.t, id: q.id })) });
    return out;
  };
  const bd = s => {
    if (!/[A-Za-z]/.test(s)) return s;
    const w = s.replace(/[A-Za-z0-9][A-Za-z0-9+\-\/.#&' ]*/g, m => { if (!/[A-Za-z]/.test(m)) return m; const q = m.replace(/\s+$/, ''); return '\u200E' + q + '\u200E' + m.slice(q.length); });
    return s.charAt(0) == '*' ? w : '\u200F' + w + '\u200F';
  };
  window.generateReportText = function (mode = 'all', lvOv = null) {
    const c = rcf(), B = blocks(mode, lvOv), o = [], N = B.filter(b => b.k != 'req');
    const need = N.reduce((a, b) => a + b.ls.length, 0), red = N.reduce((a, b) => a + b.ls.filter(x => x.r).length, 0);
    const head = [c.tt ? '*' + c.tt + '*' : '', c.dt ? dstr() : ''].filter(Boolean).join(' — '); if (head) o.push(head);
    o.push(need ? 'المطلوب: ' + need + (red ? ' (نافد ' + red + ')' : '') : 'لا يوجد نقص حالياً');
    { const W = N.filter(b => b.ls.length); if (W.length > 1) o.push(W.map(b => b.t.split(' ')[0] + b.ls.length).join('  ·  ')); }
    if (mode == 'all') {
      if (c.rr) { const x = rpLine(); if (x) o.push(x); }
      if (c.rd) { const x = dbLine(); if (x) o.push(x); }
      if (c.stRnd) { const stl = rnd().length; if (stl) o.push('تنبيه: ' + stl + ' صنف لم يُؤكَّد منذ أكثر من ' + lim('stale') + ' أيام'); }
    }
    if ((mode == 'all' || mode == 'topup') && !c.hs.includes('topup') && typeof tpSummary == 'function') {
      const ts = tpSummary();
      if (ts.u > 0) o.push('تنبيه تعبئة: لم تُسجَّل بعد ' + arCnt(ts.u, 'خانة', 'خانتان', 'خانات', 'خانة'));
      if (ts.stalePh) o.push('أرصدة التعبئة اليوم: مسجّل ' + ts.done + ' من ' + ts.tot + ' فقط');
      if (c.tpSum) {
        const stx = tpSumTxt(ts), atx = tpAdjTxt(ts);
        if (stx) o.push(stx);
        if (atx) o.push('حركات التعبئة اليوم: ' + atx);
        if (ts.note) o.push('ملاحظة التعبئة: ' + ts.note);
      }
    }
    B.forEach(b => {
      if (!b.ls.length && !c.em) return;
      o.push(''); o.push('*' + b.t + '*');
      if (b.ls.length) b.ls.forEach(x => {
        const txt = b.k == 'req' ? (cleanReq(x.s) || x.s) : x.s;
        o.push((b.k == 'req' ? '- ' : x.r ? '🔴 ' : '🟠 ') + txt);
      });
      else o.push('- لا نقص');
    });
    if ((mode == 'all' || mode == 'phones') && c.st && !c.hs.includes('phones')) {
      const gs = typeof stkGroups == 'function' ? stkGroups() : [];
      if (gs.length) {
        o.push(''); o.push('*الهواتف المتوفرة*');
        gs.forEach(g => {
          const cols = g.items.map(x => (x.color || 'عام') + ' ' + av(x)).join('، ');
          o.push('- ' + [g.brand, g.name, g.ram, g.cap, g.cond == 'مستعمل' && '(مستعمل)'].filter(Boolean).join(' ')
            + ' — ' + g.tot + (cols ? ' (' + cols + ')' : '')
            + (g.rs ? ' · محجوز ' + g.rs : '')
            + (c.pr && g.price ? ' — ' + dh(g.price) : ''));
        });
      }
    }
    if (c.ft) { o.push(''); o.push(c.ft); }
    return o.map(bd).join('\n');
  };
  /* ---------- شاشة التقرير: عرض هيكلي نظيف بلا انقلاب BiDi + بحث فوري + سجل ما وصل اليوم ---------- */
  const SECI = { topup: 'ctopup', phones: 'cphone', glass: 'cglass', pochette: 'ccase', acc: 'cacc' };
  const secT = b => (SECI[b.k] ? I(SECI[b.k]) + ' ' : '') + esc(String(b.t).replace(/^[^\u0600-\u06FFA-Za-z0-9]+/, ''));
  function rrowBody(bk, l, fn, arg, rset) {
    const isRed = l.x[2] == 'r', tap = fn ? ` class="rt-main rt-tap" onclick="rcOpenItem('${fn}','${arg}')"` : ' class="rt-main"';
    const rk = rinKeyOf(fn, arg), rinTag = rk && rset && rset.has(rk) ? `<span class="rin-b">وصل اليوم</span>` : '';
    if (bk == 'phones' && fn == 'buyP') {
      const it = find(arg);
      if (it) {
        const g = phGroup(it), mem = memBadge(g.ram, g.cap);
        const cls = g.items.map(x => `${x.color || 'عام'} (${av(x)})`).join('، ');
        const stH = g.tot <= 0 ? 'نفد' : 'العدد ' + g.tot;
        return `<div${tap}><div class="rt-line1"><bdi>${esc(g.brand + ' ' + g.name)}</bdi>${mem}${rinTag}</div><div class="rt-sub">الألوان: ${esc(cls)}${g.rs ? ' · محجوز ' + g.rs : ''}</div></div><span class="rt-st ${isRed ? 'r' : ''}">${stH}</span>`;
      }
    }
    if (bk == 'glass') {
      const segs = String(l.s || '').split(' — '), head = segs[0] || '', stRaw = segs.slice(1).join(' — ');
      const cIdx = head.indexOf(': ');
      const ty = cIdx > 0 ? head.slice(0, cIdx) : '', ms = cIdx > 0 ? head.slice(cIdx + 2) : head;
      const modsH = ms.split(' / ').map(m => `<bdi>${esc(m)}</bdi>`).join(' / ');
      const dm = stRaw.match(/^(.*?)\s*\((.+)\)\s*$/), stMain = dm ? dm[1] : stRaw;
      const detH = dm ? dm[2].split(' · ').map(q => { const k = q.indexOf(': '); return k > 0 ? esc(q.slice(0, k + 1)) + ' <bdi>' + esc(q.slice(k + 2)) + '</bdi>' : esc(q); }).join(' · ') : '';
      const stH = esc(stMain || (isRed ? 'نفد' : 'قارب')).replace(/(≈?[0-9٠-٩]+)/, '<bdi class="ltr">$1</bdi>');
      return `<div${tap}><div class="rt-line1">${ty ? `<span class="tag">${esc(ty)}</span>` : ''}${modsH}${rinTag}</div>${detH ? `<div class="rt-sub">${detH}</div>` : ''}</div><span class="rt-st ${isRed ? 'r' : ''}">${stH}</span>`;
    }
    if (bk == 'topup') {
      const segs = String(l.s || '').split(' — '), op = segs[0] || '', rest = segs.slice(1);
      if (rest.length >= 2) {
        const stTxt = rest.pop();
        return `<div${tap}><div class="rt-line1"><bdi>${esc(op)}</bdi><span>— ${esc(rest.join(' — '))}</span>${rinTag}</div></div><span class="rt-st ${isRed ? 'r' : ''}">${esc(stTxt)}</span>`;
      }
      const pTxt = rest[0] || '';
      const pm = pTxt.match(/^(.+?)\s+(\d+(?:\.\d+)?\s*درهم)(?:\s*\(([^)]+)\))?$/);
      if (pm) return `<div${tap}><div class="rt-line1"><bdi>${esc(op)}</bdi><span>— ${esc(pm[1])}</span>${rinTag}</div>${pm[3] ? `<div class="rt-sub">آخر تسجيل: ${esc(pm[3])}</div>` : ''}</div><span class="rt-st ${isRed ? 'r' : ''}">${esc(pm[2])}</span>`;
    }
    if (bk == 'pochette') {
      const segs = String(l.s || '').split(' — '), nm = segs[0] || '', det = segs.slice(1).join(' · ');
      return `<div${tap}><div class="rt-line1"><bdi>${esc(nm)}</bdi>${rinTag}</div>${det ? `<div class="rt-sub">${esc(det)}</div>` : ''}</div><span class="rt-st ${isRed ? 'r' : ''}">${isRed ? 'نفد' : 'قارب'}</span>`;
    }
    const segs = String(l.s || '').split(' — '), nm = segs[0] || '';
    let stTxt = isRed ? 'نفد' : 'قارب', subs = [];
    segs.slice(1).forEach(s => {
      if (/^(?:العدد\s*≈?[0-9٠-٩]+|المجموع\s*≈?[0-9٠-٩]+|نفد|قارب النفاد)$/.test(s.trim())) stTxt = s.trim();
      else subs.push(s);
    });
    const stH = esc(stTxt).replace(/(≈?[0-9٠-٩]+)/, '<bdi class="ltr">$1</bdi>');
    return `<div${tap}><div class="rt-line1"><bdi>${esc(nm)}</bdi>${rinTag}</div>${subs.length ? `<div class="rt-sub">${esc(subs.join(' · '))}</div>` : ''}</div><span class="rt-st ${isRed ? 'r' : ''}">${stH}</span>`;
  }
  const rrow = (bk, l, rset) => {
    const act = l.x[3] || '';
    const m = act.match(/^([a-zA-Z]+)\('([^']*)'\)$/);
    const fn = m ? m[1] : '', arg = m ? m[2] : '';
    return `<div class="rrow ${l.x[2] == 'r' ? 'r' : ''}"><span class="dotl" style="background:${DT[l.x[2]]}"></span>${rrowBody(bk, l, fn, arg, rset)}<button class="rck" aria-label="تسجيل وصول البضاعة" onclick="${act}">${I('check')}</button></div>`;
  };
  const stkGroupRow = (g, showPr) => {
    const f0 = g.items[0];
    const dots = g.items.map(x => `<span class="csw"><span class="csd sm" style="background:${csBg(x.color)};color:${csInk(x.color)}">${av(x)}</span><small class="m">${esc(x.color || 'عام')}</small></span>`).join('');
    return `<div class="rrow" style="flex-wrap:wrap"><div class="rt-main rt-tap" onclick="phGO('${f0.id}')"><div class="rt-line1"><bdi>${esc(g.brand + ' ' + g.name)}</bdi>${memBadge(g.ram, g.cap)}${g.cond == 'مستعمل' ? '<span class="phk c">مستعمل</span>' : ''}</div>${g.rs ? `<div class="rt-sub">المتاح ${g.tot} · محجوز ${g.rs}</div>` : ''}</div><div class="cs-sws" onclick="phGO('${f0.id}')">${dots}</div>${showPr && g.price ? prBadge(g.price) : ''}</div>`;
  };
  function rinBoxHtml(list) {
    if (!list.length) return '';
    return `<details class="card rin-box"><summary><b>${I('check')} ما تم تقييد وصوله اليوم (${list.length})</b><span class="m">للمراجعة</span></summary><div class="rlist" style="padding:4px 0 0">`
      + list.map(x => `<div class="rin-row" onclick="rcOpenRin('${x.id}')"><div class="f1"><b><bdi>${esc(x.lbl)}</bdi></b><div class="m">${esc(x.det)}</div></div><div class="rin-meta"><bdi class="ltr">${fdTime(x.t)}</bdi>${x.by ? `<small>${esc(x.by)}</small>` : ''}</div></div>`).join('')
      + `</div></details>`;
  }
  function tpReportBox(ts) {
    if (!ts || (ts.grand <= 0 && !ts.cap && ts.incomplete && !(ts.adjList && ts.adjList.length))) return '';
    let badge = '';
    const refN = ts.expected || ts.cap;
    if (ts.incomplete) badge = '<span class="rp-badge warn">جرد غير مكتمل</span>';
    else if (ts.cap > 0) {
      if (ts.diff === 0) badge = '<span class="rp-badge ok">متوازن ✓</span>';
      else if (ts.diff < 0) badge = `<span class="rp-badge bad">ناقص <bdi>${Math.abs(ts.diff)} درهم</bdi></span>`;
      else badge = `<span class="rp-badge ok">زائد <bdi>${ts.diff} درهم</bdi></span>`;
    }
    const atx = tpAdjTxt(ts);
    return `<div class="card rp-click" onclick="go('tp')">`
      + `<div class="row2"><b>${I('ctopup')} حساب التعبئة</b>${badge}</div>`
      + `<div class="m" style="margin-top:4px">بطاقات <bdi>${ts.cardsTot}</bdi> + هواتف <bdi>${ts.phonesTot}</bdi> + الصندوق <bdi>${ts.cashTot}</bdi> = <b><bdi>${ts.grand} درهم</bdi></b>${ts.cap > 0 ? ` (من أصل <bdi>${refN} درهم</bdi>)` : ''}</div>`
      + (atx ? `<div class="m" style="margin-top:4px">${esc(atx)}</div>` : '')
      + (ts.note ? `<div class="rs" style="margin-top:4px">${I('chat')} ${esc(ts.note)}</div>` : '')
      + `</div>`;
  }
  function repBodyHtml(F, lv, rq) {
    const c = rcf(), nq = nz(rq || ''), B = blocks(F, lv), rset = rinKeySet(), tin = todayRin();
    let h = '';
    if (!nq && F == 'all') {
      const stl = rnd().length;
      if (stl) h += `<div class="card ntc"><span class="f1">${I('alert')} ${stl} صنف لم يُؤكَّد منذ أكثر من ${lim('stale')} أيام</span><button class="btn sm" onclick="go('jl')">افتح الجولة</button></div>`;
    }
    if (!nq && (F == 'all' || F == 'topup') && !c.hs.includes('topup') && typeof tpSummary == 'function') {
      const ts = tpSummary();
      if (ts.u > 0 || ts.stalePh || ts.cashMiss || ts.cashOld) {
        const msgs = [];
        if (ts.u > 0) msgs.push('لم تُسجَّل ' + arCnt(ts.u, 'خانة', 'خانتان', 'خانات', 'خانة'));
        if (ts.stalePh) msgs.push('أرصدة اليوم: ' + ts.done + ' من ' + ts.tot);
        if (ts.cashMiss) msgs.push('صندوق التعبئة غير مسجّل');
        else if (ts.cashOld) msgs.push('صندوق التعبئة لم يُؤكَّد اليوم');
        h += `<div class="card ntc"><span class="f1">${I('alert')} <b>التعبئة:</b> ${esc(msgs.join(' · '))}</span><button class="btn s sm" onclick="go('tp')">افتح التعبئة</button></div>`;
      }
      if (c.tpSum) h += tpReportBox(ts);
    }
    if (!nq && tin.length) h += rinBoxHtml(tin);
    let anyRow = false;
    B.forEach(b => {
      const src = nq ? b.ls.filter(l => nzHit(nz(l.s), rq, nq)) : b.ls;
      let x = '';
      if (b.k == 'req') x = src.map(l => {
        const ph = typeof rqTel == 'function' ? rqTel(l.s) : '';
        return `<div class="rrow col"><div class="row2"><span class="rt">${esc(l.s)}</span><button class="btn s sm" onclick="rqD('${l.id}')">مسح</button></div>${ph ? `<div class="sub"><a href="tel:${esc(ph)}" class="btn s sm rp-icb">${I('phone')} اتصال</a><button class="btn sm" onclick="rqWA('${l.id}')">${I('send')} إبلاغ واتساب</button></div>` : ''}</div>`;
      }).join('');
      else {
        const ex = !!nq || EXP['r_' + b.k], L = !ex && src.length > 6 ? src.slice(0, 5) : src;
        x = L.map(l => rrow(b.k, l, rset)).join('') + (!nq && src.length > 6 ? `<button class="tag" style="width:100%;justify-content:center;margin:6px 0 0" onclick="toggleExp('r_${b.k}')">${ex ? 'طيّ ▴' : 'عرض الباقي (+' + (src.length - 5) + ') ▾'}</button>` : '');
      }
      if (x) {
        anyRow = true;
        h += `<h3 class="sch" style="--sc:${SCOL[b.k] || '#64748b'}">${secT(b)} <span class="m">(${src.length})</span></h3><div class="card rlist sx" style="--sc:${SCOL[b.k] || '#64748b'}">${x}</div>`;
      } else if (c.em && !nq) {
        anyRow = true;
        h += `<h3>${secT(b)}</h3><p class="m">لا نقص</p>`;
      }
    });
    if ((F == 'all' || F == 'phones') && c.st && !c.hs.includes('phones')) {
      const gs0 = typeof stkGroups == 'function' ? stkGroups() : [];
      const gs = nq ? gs0.filter(g => nzHit(nz([g.brand, g.name, g.ram, g.cap, g.items.map(x => x.color).join(' ')].join(' ')), rq, nq)) : gs0;
      if (gs.length) {
        anyRow = true;
        h += '<h3>الهواتف المتوفرة <span class="m">(' + gs.length + ')</span></h3><div class="card rlist">' + gs.map(g => stkGroupRow(g, c.pr)).join('') + '</div>';
      }
    }
    if (!anyRow) h += emptyBox(nq ? 'لا توجد نتائج مطابقة داخل التقرير' : 'لا يوجد نقص في المخزون حالياً ✓', nq ? 'جرّب كلمة أخرى أو امسح البحث' : 'جميع الأصناف متوفرة فوق الحد المطلوب');
    if (!nq) {
      const pvWarn = isFiltered() ? `<div class="rs" style="margin-top:6px">المعاينة تعرض الفلتر الحالي (${esc(filterDesc())}) — عند الضغط على إرسال أو نسخ يمكنك اختيار الشامل أو هذا القسم.</div>` : '';
      h += `<details class="card" style="margin-top:14px"><summary><b>معاينة النص</b>${isFiltered() ? `<span class="m">${esc(filterDesc())}</span>` : ''}</summary>${pvWarn}<div class="rp-pre">${esc(generateReportText(F, lv))}</div></details>`;
    }
    return h;
  }
  window.rcSearch = q => {
    V.rq = q;
    const cBtn = $('rep_q_clr'); if (cBtn) cBtn.hidden = !String(q || '').trim();
    const b = $('rep_body'); if (b) b.innerHTML = repBodyHtml(curTab(), curLv(), q);
  };
  window.rcSearchClr = () => {
    const inp = $('rep_q'); if (inp) { inp.value = ''; inp.focus(); }
    rcSearch('');
  };
  VW.rep = () => {
    const c = rcf(), F = curTab(), lv = curLv(), rq = V.rq || '';
    const tabs = RTABS.filter(([k]) => k == 'all' || !c.hs.includes(k));
    const AL = invLines(!!c.pn).concat(typeof tpLines == 'function' ? tpLines() : []).filter(x => secs('all').some(k => RSEC[k][0] == x[0]));
    const red = AL.filter(x => x[2] == 'r').length, yel = AL.length - red, sl = sentLine();
    let h = `<div class="qbar rsum"><div class="qpill al"><div class="qn">${red}</div><div class="ql">نافد</div></div><div class="qpill wn"><div class="qn">${yel}</div><div class="ql">قارب النفاد</div></div><div class="qpill ${S.req.length ? 'rp' : 'ok'}"><div class="qn">${S.req.length}</div><div class="ql">طلبات الزبائن</div></div></div>`
      + `<div class="rsent ${sl[1] ? 'w' : ''}">${esc(sl[0])}</div>`;
    if (c.rr) { const x = rpLine(); if (x) h += `<div class="card row2">${I('tool')}<span class="f1">${esc(x)}</span><button class="btn s sm" onclick="go('rp')">افتح</button></div>`; }
    if (c.rd) { const x = dbLine(); if (x) h += `<div class="card row2">${I('wallet')}<span class="f1">${esc(x)}</span><button class="btn s sm" onclick="go('dbt')">افتح</button></div>`; }
    h += `<div class="sec-panel">`
      + `<div class="sec-tags">${tabs.map(([k, l]) => `<button class="tag ${F === k ? 'on' : ''}" onclick="V.rf='${k}';render()">${l}</button>`).join('')}</div>`
      + `<div class="sec-toolbar"><div class="seg-group"><button type="button" class="seg-btn ${lv == 'a' ? 'on' : ''}" onclick="V.rlv='a';render()">نافد وقارب</button><button type="button" class="seg-btn ${lv == 'r' ? 'on' : ''}" onclick="V.rlv='r';render()">نافد فقط</button></div><button type="button" class="tool-pill" onclick="go('st_rep')">${I('sl')} تخصيص</button></div>`
      + `<div class="q-wrap" style="margin-top:7px"><input id="rep_q" placeholder="ابحث داخل التقرير: موديل، لون، كابل..." value="${esc(rq)}" oninput="rcSearch(this.value)"><button id="rep_q_clr" type="button" class="q-clr" ${rq ? '' : 'hidden'} onclick="rcSearchClr()" aria-label="مسح البحث">✕</button></div>`
      + `</div>`
      + `<div id="rep_body">${repBodyHtml(F, lv, rq)}</div>`
      + `<div class="rbar"><button class="btn" onclick="rcSend()">${I('send')} إرسال بالواتساب</button><button class="btn s" onclick="rcCopy()">نسخ</button></div>`;
    return { t: 'التقرير اليومي', h };
  };
  /* ---------- إعدادات التقرير ---------- */
  const tog = (l, k) => swRow(l, 'rcSet({' + k + ':' + (rcf()[k] ? 0 : 1) + '})', !!rcf()[k]);
  window.rcRh = () => { if (!okEdit()) return toast('للمدير فقط'); ask('ساعة بدء التذكير', [{ k: 'h', l: 'من 0 إلى 23 (مثال: 16)', v: String(rcf().rh) }]).then(v => { const h = v && parseInt(dg(v.h), 10); if (h >= 0 && h <= 23) rcSet({ rh: h }); }); };
  VW.st_rep = () => {
    const c = rcf(), od = offDays();
    return {
      t: 'التقرير اليومي', h: '<p class="m">هذه الإعدادات تحدد ما يظهر في التقرير ونصّ الواتساب، وتنطبق على كل الأجهزة.</p>'
        + '<h3>العنوان والتوقيع</h3>' + row('عنوان التقرير', 'rcTt()', c.tt || 'بدون') + tog('إظهار التاريخ بجانب العنوان', 'dt') + row('عبارة في آخر التقرير', 'rcFt()', c.ft || 'بدون')
        + '<h3>ما الذي يُدرج</h3>' + tog('قائمة الهواتف المتوفرة', 'st') + (c.st ? tog('أسعار الهواتف المتوفرة', 'pr') : '') + tog('طلبات الزبائن', 'rq') + tog('ملاحظات البوشيط (باقي / خاصنا)', 'pn') + tog('إظهار الأقسام التي لا نقص فيها', 'em')
        + '<h3>أسطر إضافية في التقرير الشامل</h3>' + tog('سطر ملخص حساب التعبئة والمجموع الكامل', 'tpSum') + tog('سطر الصيانة (في المحل / جاهز / لم يصلح / منسي)', 'rr') + tog('سطر الديون المفتوحة', 'rd') + tog('تنبيه الجولة اليومية (أصناف غير مؤكدة) في النص', 'stRnd')
        + '<h3>الإرسال والتذكير</h3>' + row('رقم واتساب المعلم (اختياري)', 'rcWaEd()', c.wa || 'اختيار يدوي') + tog('تذكير في الرئيسية إن لم يُرسل التقرير اليوم', 'rm') + row('ساعة بدء التذكير', 'rcRh()', c.rh + ':00')
        + row('أيام عطلة المحل (بلا تذكير)', "go('st_shop')", od.length ? arCnt(od.length, 'يوم', 'يومان', 'أيام') : 'لا عطلة')
        + '<h3>المستوى الافتراضي</h3><div style="display:flex;gap:6px;margin-bottom:10px"><button class="tag ' + (c.lv == 'a' ? 'on' : '') + '" onclick="rcSet({lv:\'a\'})">النافد وقارب النفاد</button><button class="tag ' + (c.lv == 'r' ? 'on' : '') + '" onclick="rcSet({lv:\'r\'})">النافد فقط</button></div>'
        + '<h3>الأقسام الظاهرة في التقرير</h3>' + RTABS.filter(([k]) => k != 'all').map(([k, l]) => swRow(l, "rcHide('" + k + "')", !c.hs.includes(k))).join('')
        + `<div style="margin-top:14px"><button class="btn s" onclick="rcReset()">إرجاع الإعدادات الافتراضية</button></div>`
    };
  };
  window.rcSkip = () => sure('لن يُرسل تقرير اليوم؟ سيختفي التذكير حتى الغد.', 'نعم، لا تقرير اليوم', false).then(ok => {
    if (!ok) return;
    S.cfg.rx = new Date().toDateString(); save(); render();
    toast('أُلغي تذكير اليوم', () => { delete S.cfg.rx; });
  });
  HOME.top.push(() => {
    const c = rcf(), d = new Date();
    if (!c.rm || (typeof noRem == 'function' && noRem()) || sentToday() || isOffDay(d) || d.getHours() < c.rh || S.cfg.rx == d.toDateString()) return '';
    return `<div class="card row2">${I('alert')}<span class="f1">لم يُرسل تقرير اليوم بعد</span><button class="btn sm" onclick="go('rep')">افتح التقرير</button><button class="btn s sm" aria-label="لا تقرير اليوم" onclick="rcSkip()">✕</button></div>`;
  });
  MORE.push({ g: 'work', o: 20, l: 'التقرير اليومي', d: 'ما يظهر في التقرير ونص الواتساب، رقم المعلم، وتذكير الإرسال', fn: "go('st_rep')" });
})();