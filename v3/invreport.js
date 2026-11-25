/* ============================================================
   invreport.js — الشراء، سطور تقرير المخزون، البحث الموحّد وعرض القسم
   يُحمَّل بعد invacc.js.
   ============================================================ */
/* ============================ الشراء والتقرير ============================ */
function qty(t, d, fn) { ask(t, [{ k: 'n', l: 'الكمية التي وصلت', t: 'tel', v: d ?? '' }], 'حفظ الوصول').then(v => { if (v && ci(v.n) > 0) commit('تم تسجيل الوصول', () => fn(ci(v.n))); }); }
let PHB = { id: '' };
function phBuyAddRow() {
  const box = $('phb_ex'), it = find(PHB.id); if (!box || !it) return;
  const g = phGroup(it), used = new Set(g.items.map(x => x.color || ''));
  box.querySelectorAll('.buy-sel').forEach(s => used.add(s.value));
  const cols = [...S.tags.color.filter(c => !used.has(c)), ...S.tags.color.filter(c => used.has(c))];
  const opts = cols.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('') + '<option value="">عام</option>';
  box.insertAdjacentHTML('beforeend', `<div class="buy-row"><select class="buy-sel">${opts}</select><input type="tel" inputmode="numeric" class="buy-inp buy-ninp" placeholder="0"><button type="button" class="rp-xbtn" onclick="this.parentElement.remove()" aria-label="إزالة">${I('close')}</button></div>`);
}
function phBuySave() {
  const adds = [], news = [];
  document.querySelectorAll('#sh .buy-inp[data-pid]').forEach(el => {
    const n = ci(el.value); if (n > 0) adds.push({ pid: el.dataset.pid, n });
  });
  document.querySelectorAll('#phb_ex .buy-row').forEach(r => {
    const sel = r.querySelector('.buy-sel'), inp = r.querySelector('.buy-ninp');
    const n = inp ? ci(inp.value) : 0;
    if (n > 0) news.push({ c: sel ? sel.value : '', n });
  });
  if (!adds.length && !news.length) return toast('أدخل الكمية التي وصلت للون واحد على الأقل');
  finish({ adds, news });
}
function buyP(id) {
  const it = find(id); if (!it) return;
  const g = phGroup(it);
  PHB = { id: it.id };
  const specs = [g.ram, g.cap, g.cond && g.cond != 'جديد' && g.cond].filter(Boolean).join(' · ');
  const rows = g.items.map(x => `<div class="buy-row"><span class="csd" style="background:${csBg(x.color)};color:${csInk(x.color)}">${x.cnt}</span><div class="buy-info"><b>${esc(x.color || 'عام')}</b><small class="m">المتوفر: ${x.cnt}${rsQ(x) ? ' · محجوز ' + rsQ(x) : ''}</small></div><input type="tel" inputmode="numeric" class="buy-inp" data-pid="${x.id}" placeholder="0"></div>`).join('');
  $('sh').innerHTML = `<div class="bar"></div><h3>وصول هواتف: <bdi>${esc(g.brand + ' ' + g.name)}</bdi></h3>`
    + `<p class="m">${specs ? esc(specs) + ' · ' : ''}اكتب الكمية التي وصلت لكل لون (اترك ما لم يصل فارغاً).</p>`
    + rows + `<div id="phb_ex"></div>`
    + `<button type="button" class="btn s sm" style="margin-top:8px" onclick="phBuyAddRow()">+ إضافة لون جديد وصل</button>`
    + `<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="phBuySave()">حفظ الوصول</button></div>`;
  sheetOpen(v => {
    if (!v) return;
    const base = find(id); if (!base) return;
    const grp = phGroup(base);
    commit('تم تسجيل وصول ' + grp.brand + ' ' + grp.name, () => {
      const parts = [];
      v.adds.forEach(({ pid, n }) => { const x = find(pid); if (x) { x.cnt += n; touch(x, 1); parts.push('+' + n + ' ' + (x.color || 'عام')); } });
      v.news.forEach(({ c, n }) => {
        const ex = ph().find(x => phKey(x) == grp.key && (x.color || '') == c);
        if (ex) { ex.cnt += n; touch(ex, 1); }
        else {
          const o = { id: uid(), sec: 'phones', brand: grp.brand, name: grp.name, color: c, ram: grp.ram || '', cap: grp.cap || '', cond: grp.cond || 'جديد', price: grp.price || '', cnt: n, note: '', imei: '' };
          touch(o, 1); S.items.push(o);
        }
        parts.push('+' + n + ' ' + (c || 'عام'));
      });
      if (typeof rcLogIn == 'function' && parts.length) rcLogIn('phones', grp.key, base.id, [grp.brand, grp.name, grp.ram, grp.cap].filter(Boolean).join(' '), parts.join('، '));
    });
    reqChk(grp.brand + ' ' + grp.name, 1);
  });
}
/* كل سطر: [القسم, النص, الحالة r/y, دالة «تم الشراء»] */
function invLines(notes = true) {
  const L = [];
  phGroupsOf(ph()).filter(g => g.cond != 'مستعمل' && !g.stp && phGSt(g) != 'g').forEach(g => {
    const lo = g.items.slice().sort((x, y) => av(x) - av(y))[0];
    const cl = g.items.length > 1 ? ' (' + g.items.map(x => (x.color || 'عام') + ' ' + av(x)).join('، ') + ')' : g.items[0].color ? ' (' + g.items[0].color + ')' : '';
    const stTxt = g.tot <= 0 ? ' — نفد' : ' — العدد ' + g.tot;
    L.push(['الهواتف الناقصة', [g.brand, g.name, g.ram, g.cap].filter(Boolean).join(' ') + stTxt + (g.rs ? ' (محجوز ' + g.rs + ')' : '') + cl, phGSt(g), `buyP('${lo.id}')`]);
  });
  S.gg.forEach(g => {
    const tys = S.tags.glass.filter(t => gShow(g, t)), hasAny = tys.some(t => gitem(g.id, t));
    tys.forEach((t, idx) => {
      const i = gitem(g.id, t), ms = gMods(g, t).join(' / ');
      if (i && gSt(i, g, t) != 'g') L.push(['الأنتي كاس', t + ': ' + ms + ' — المجموع ' + (gEst(i, g) ? '≈' : '') + gTot(i, g) + (glx('rp') ? glBrk(i, g, t) : ''), gSt(i, g, t), `buyG('${i.id}')`]);
      else if (!i && !hasAny && idx === 0) L.push(['الأنتي كاس', t + ': ' + ms + ' — المجموع 0', 'r', `buyG('${g.id}')`]);
    });
  });
  S.items.filter(i => i.sec == 'case' && csSt(i) != 'g').forEach(i => {
    const V0 = csN(i).v || [], fm = x => csEmo(x.c) + ' ' + (x.c || 'عام') + ' ' + (x.n <= 0 ? 'نفد' : x.n);
    const bad = V0.filter(x => csVSt(i, x) != 'g').map(fm), ok = V0.filter(x => csVSt(i, x) == 'g').map(fm);
    L.push(['البوشيط', i.name + (V0.length ? (bad.length ? ' — ناقص: ' + bad.join('، ') : '') + (ok.length ? ' — متوفر: ' + ok.join('، ') : '') : ' — نفد') + (notes && i.rem ? ' — باقي: ' + i.rem : '') + (notes && i.need ? ' — خاصنا: ' + i.need : ''), csSt(i), `buyC('${i.id}')`]);
  });
  S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g && acSt(i) != 'g').forEach(i => L.push(['الإكسسوارات', acName(i) + (typeof i.cnt == 'number' ? ' — العدد ' + i.cnt : '') + (i.note ? ' — ' + i.note : ''), acSt(i), `buyA('${i.id}')`]));
  agList().filter(d => d.st != 'g').forEach(d => L.push(['الإكسسوارات', d.title + (d.tot !== null ? ' — المجموع ' + (d.est ? '≈' : '') + d.tot : d.st == 'r' ? ' — نفد' : ' — قارب النفاد') + (notes && d.g && d.g.note ? ' — ' + d.g.note : ''), d.st, `agBuy('${encodeURIComponent(d.id)}')`]));
  return L;
}
/* ============================ البحث الموحّد وعرض القسم ============================ */
SRCH.push(
  { k: 'phones', l: 'هواتف', run: (n, q) => { const ks = new Set(S.items.filter(i => i.sec == 'phones' && !i.sold && nzHit(nzOf(i, nzText), q, n)).slice(0, 30).map(phKey)); return phGroupsOf(ph().filter(i => ks.has(phKey(i)))).map(phGCard); } },
  { k: 'glass', l: 'أنتي كاس', run: (n, q) => S.gg.filter(g => g.models.some(m => nzHit(nz(((g.br || {})[m] || '') + m), q, n))).slice(0, 15).map(glB) },
  { k: 'case', l: 'بوشيط', run: (n, q) => S.items.filter(i => i.sec == 'case' && nzHit(nzOf(i, nzText), q, n)).slice(0, 30).map(csCard) },
  { k: 'acc', l: 'إكسسوارات', run: (n, q) => [...agList().filter(d => nzHit(nz(agTxt(d)), q, n)).slice(0, 15).map(agCard), ...S.items.filter(i => i.sec == 'acc' && !gkc(i.kind).g && nzHit(nzOf(i, nzText), q, n)).slice(0, 30).map(acCard)] }
);
VW.sec = () => ({ phones: phView, glass: glView, case: csView, acc: acView }[V.k] || phView)();