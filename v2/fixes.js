/* ============================================================
   fixes.js — تصحيحات منطقية + الحجز بعدد + سجل حركات الأصناف
   يُحمَّل آخر ملف (بعد tidy.js)
   ============================================================ */
(()=>{
const ci=v=>Math.max(0,Math.floor(+v||0));

/* ---------- 1) منع الأعداد السالبة والكسرية في حقول العدد ---------- */
document.addEventListener('input',e=>{const t=e.target;
  if(t&&t.tagName=='INPUT'&&t.type=='number'&&t.closest&&t.closest('#sh')&&t.value!==''&&!/^\d+$/.test(t.value))t.value=t.value.replace(/\D/g,'')},true);
const _ps=phSave;
phSave=function(){const e=$('pcnt');
  if(e){e.value=ci(e.value);const q=PR&&PR.id?rsQ(PR):0;if(ci(e.value)<q)return toast('العدد أقل من المحجوز ('+q+')')}
  _ps()};
const _pd=phDone;
phDone=function(v){if(v&&v.add!==undefined){v.add=ci(v.add);if(!v.add)return toast('اكتب عدداً أكبر من صفر')}_pd(v)};

/* ---------- 2) الحجز بعدد: يُخصم المحجوز من المتاح ---------- */
window.rsL=i=>Array.isArray(i.res)?i.res:(i.res&&i.res.n?[{n:i.res.n,d:i.res.d||'',q:1}]:[]);
window.rsQ=i=>rsL(i).reduce((a,r)=>a+(+r.q||1),0);
window.av=i=>{const c=+i.cnt;return isNaN(c)?i.cnt:Math.max(0,c-rsQ(i))};
window.rsHtml=i=>{const L=rsL(i);if(!L.length)return '';
  return `<div class="rs">محجوز ${rsQ(i)} من ${i.cnt}: ${L.map(r=>esc(r.n)+((+r.q||1)>1?' ×'+r.q:'')+(r.d?' · عربون '+esc(r.d):'')).join('، ')}${av(i)<=0?' — كل القطع محجوزة':''}</div>`};
function rsList(id){const i=find(id),L=rsL(i);
  $('sh').innerHTML=`<div class="bar"></div><h3>حجوزات ${esc(i.brand+' '+i.name)}</h3><p class="m">العدد ${i.cnt} · محجوز ${rsQ(i)} · متاح ${av(i)}</p>`
  +(L.length?L.map((r,k)=>`<div class="card"><div class="row2"><b style="flex:1">${esc(r.n)} × ${+r.q||1}${r.d?' · عربون '+esc(r.d):''}</b></div><div class="sub"><button class="btn sm" onclick="finish({id:'${id}',k:${k},sold:1})">سُلِّم للزبون</button><button class="btn s sm" onclick="finish({id:'${id}',k:${k}})">إلغاء الحجز</button></div></div>`).join(''):'<p class="m">لا حجوزات</p>')
  +`<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button>${av(i)>0?`<button class="btn" onclick="rsForm('${id}')">+ حجز جديد</button>`:''}</div>`}
window.rsForm=id=>{const i=find(id);
  $('sh').innerHTML=`<div class="bar"></div><h3>حجز جديد — ${esc(i.brand+' '+i.name)}</h3><p class="m">المتاح للحجز: ${av(i)}</p><label>اسم الزبون<input id="rn"></label><label>عدد القطع<input id="rq" type="number" value="1"></label><label>العربون (اختياري)<input id="rd" type="tel"></label><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="rsSave('${id}')">حفظ الحجز</button></div>`};
window.rsSave=id=>{const i=find(id),n=$('rn').value.trim(),q=ci($('rq').value),d=$('rd').value.trim();
  if(!n)return toast('اكتب اسم الزبون');if(!q)return toast('اكتب عدداً أكبر من صفر');
  if(q>av(i))return toast('المتاح للحجز '+av(i)+' فقط');finish({id,add:{n,q,d}})};
const rsCb=v=>{if(!v)return;const i=find(v.id);if(!i)return;
  if(v.add)return commit('تم الحجز',()=>{i.res=[...rsL(i),v.add]});
  const L=rsL(i),r=L[v.k];if(!r)return;
  commit(v.sold?'سُلِّم الحجز':'أُلغي الحجز',()=>{const R=L.filter((_,k)=>k!=v.k);i.res=R.length?R:null;
    if(v.sold){i.cnt=Math.max(0,i.cnt-(+r.q||1));i.by=S.me;i.at=Date.now()}})};
phRs=function(id){sheetOpen(rsCb);rsList(id)};
const _pc=phC;
phC=function(id,d){const i=find(id);
  if(d<0&&rsQ(i)>0&&av(i)<=0)return toast('كل القطع محجوزة: سلّم الحجز أو ألغِه أولاً');_pc(id,d)};

/* ---------- سجل حركات الأصناف (آخر 20 حركة للهواتف والإكسسوارات ذات العدد) ---------- */
const LGB={};let LGI=0;
function lgScan(){(S.items||[]).forEach(i=>{
  if(i.sec!='phones'&&i.sec!='acc')return;const t=typeof i.cnt=='number'?i.cnt:null;if(t===null)return;
  if(!(i.id in LGB)){LGB[i.id]=t;if(LGI&&t>0&&!(i.log&&i.log.length))i.log=[[i.at||Date.now(),i.by||S.me||'',t,t]];return}
  if(LGB[i.id]===t)return;
  const last=(i.log||[]).slice(-1)[0];
  if(!last||last[3]!==t)i.log=[...(i.log||[]),[i.at||Date.now(),i.by||S.me||'',t-LGB[i.id],t]].slice(-20);
  LGB[i.id]=t})}
window.lgOpen=id=>{const i=find(id);if(!i)return;
  const nm=i.sec=='phones'?i.brand+' '+i.name:(typeof acName=='function'?acName(i):(i.kind||''));
  const L=(i.log||[]).slice().reverse();
  $('sh').innerHTML=`<div class="bar"></div><h3>سجل ${esc(nm)}</h3>`
  +(L.map(([t,u,d,c])=>`<div class="card"><b>${d>0?'+'+d:d}</b> ← العدد ${c}<div class="m">${esc(u||'—')} · ${fd(t)}</div></div>`).join('')||'<p class="m">لا حركات بعد</p>')
  +'<div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>';
  sheetOpen(()=>{})};
const _cd=card;
card=function(i){let h=_cd(i);if(i.sec=='phones')h=h.replace(/<button[^>]*phDel[^>]*>[^<]*<\/button>/,'');
  if((i.sec=='phones'||i.sec=='acc')&&(i.log||[]).length)h=h.replace('<div class="sub">',()=>`<div class="sub"><button class="btn s sm" onclick="lgOpen('${i.id}')">السجل</button>`);
  return h};

/* ---------- 5) وسوم مكررة (Samsung / samsung): دمج تلقائي ---------- */
const TKEY=x=>String(x??'').toLowerCase().replace(/[\s\-_.]/g,'');
function tagFix(){['brand','color','cap','ram'].forEach(g=>{
  const a=S.tags&&S.tags[g];if(!Array.isArray(a))return;
  const keep={},out=[],map={};
  a.forEach(x=>{const k=TKEY(x);if(!k)return;if(keep[k]===undefined){keep[k]=x;out.push(x)}else if(keep[k]!==x)map[x]=keep[k]});
  if(out.length===a.length)return;
  S.tags[g]=out;
  (S.items||[]).forEach(i=>{if(map[i[g]]!==undefined)i[g]=map[i[g]];
    if(g=='color'&&Array.isArray(i.v))i.v.forEach(x=>{if(map[x.c]!==undefined)x.c=map[x.c]})});
  if(g=='brand')['bcol','bl'].forEach(c=>{const o=S.cfg&&S.cfg[c];if(!o)return;
    Object.keys(map).forEach(x=>{if(o[x]!==undefined){if(o[map[x]]===undefined)o[map[x]]=o[x];delete o[x]}})})})}
window._svHook=()=>{try{tagFix();lgScan()}catch(e){}};
lgScan();LGI=1;

/* ---------- 3 و 6) التسليم: المتبقي بعد العربون + المبلغ رقماً ---------- */
rDV=function(id,pre){
  const r=rf(id),pr=pre||{};
  const cap=sn1(r.cap)?+r.cap:null,dep=sn1(r.dep)?+r.dep:0;
  const def=(r.res=='ok'&&cap!==null)?String(Math.max(0,cap-dep)):'';
  const lbl=def?(dep?'المتبقي '+def+' (السعر '+cap+' − العربون '+dep+') — هل هو المقبوض الآن؟ عدّله إن اختلف':'هل المبلغ المقبوض هو '+def+' ؟ عدّله إن اختلف')
    :(dep?'المبلغ المقبوض الآن (العربون '+r.dep+' مقبوض سابقاً — اكتب 0 إن لم يُقبض شيء)':'المبلغ المقبوض (0 إن لم يُقبض شيء)');
  const fields=[{k:'p',l:lbl,t:'tel',v:pr.p??def}];
  if(r.res=='ok')fields.unshift({k:'tested',l:(pr.err?'مطلوب، اختر أحد الخيارين: ':'')+'تجربة الإصلاح مع الزبون قبل التسليم (إجباري)',t:'sel',o:DVO,v:pr.tested||DVO[0]});
  fields.push({k:'dnote',l:'ملاحظة عند التسليم (اختياري)',v:pr.dnote??(r.dnote||'')});
  ask('تسليم الهاتف: '+r.name,fields,'تأكيد التسليم',false).then(v=>{
    if(!v)return;
    const again=e=>rDV(id,{p:v.p,dnote:v.dnote,tested:v.tested,err:e});
    if(r.res=='ok'&&v.tested==DVO[0])return again(1);
    if(v.p.trim()!==''&&!sn1(v.p)){toast('اكتب المبلغ رقماً فقط (مثال 100)');return again(0)}
    commit('تم التسليم',()=>{r.st='dn';r.t2=Date.now();r.dby=S.me;r.paid=v.p.trim()||'0';
      r.tst=v.tested==DVO[1]?Date.now():0;r.dnote=(v.dnote||'').trim()})})};

/* ---------- 4) الصيانة: نوع الهاتف ورقم الزبون مطلوبان ---------- */
const _rs=rSave;
rSave=function(){
  const n=$('r_n').value.trim(),f=$('r_f').value.trim(),v=$('r_v').value.trim(),t=$('r_t').value.replace(/\D/g,'');
  const isNew=!(ZR&&ZR.id);
  if(!n||!f)return toast('الاسم والعطل مطلوبان');
  if(!v&&(isNew||ZR.dev))return toast('اكتب نوع الهاتف');
  if(t.length<8&&(isNew||ZR.tel))return toast('اكتب رقم هاتف الزبون (8 أرقام على الأقل)');
  _rs()};
const _wa=rWA;
rWA=function(id,k){const r=rf(id);
  if(!r||!rnum(r.tel))return toast('لا يوجد رقم لهذا الزبون: عدّل السجل وأضف الرقم');
  _wa(id,k)};

/* ---------- 6) أزرار الماركات في نموذج الصيانة ---------- */
pickRpBrand=function(b){const el=$('r_v');if(!el)return;
  let cur=el.value.trim();
  const o=(S.tags.brand||[]).find(x=>x&&cur.toLowerCase().startsWith(String(x).toLowerCase()));
  if(o)cur=cur.slice(o.length).trim();
  el.value=b+' '+cur;el.focus();checkDeviceHistory();suggestGuidePrice()};
/* ---------- دمج مجموعات الأنتي كاس: لا يُفقد الحد الأدنى والسعر ---------- */
const _gm=glMerge;
glMerge=function(a,b){const keep=S.items.filter(i=>i.sec=='glass'&&i.gid==b.id).map(i=>({ty:i.ty,min:i.min,price:i.price}));
  _gm(a,b);keep.forEach(k=>{const t=gitem(a.id,k.ty);if(!t)return;if(t.min==null&&k.min!=null)t.min=k.min;if(!t.price&&k.price)t.price=k.price})};
/* ---------- مظهر: الحذف داخل التعديل، وشريط النسخة الاحتياطية مضغوط ---------- */
const _pf=phForm;
phForm=function(rec){_pf(rec);
  if(rec&&rec.id&&S.items.includes(rec)&&can('del'))$('sh').insertAdjacentHTML('beforeend',`<button class="btn s" style="color:#dc2626;margin-top:10px" onclick="phDelF('${rec.id}')">حذف هذا الهاتف</button>`)};
window.phDelF=id=>{finish(null);setTimeout(()=>phDel(id),450)};
window.bkHide=()=>{try{localStorage.setItem('bkHide',Date.now())}catch(e){}render()};
const _hm=VW.home;
VW.home=function(){const r=_hm();let hid=0;try{hid=Date.now()-(+localStorage.getItem('bkHide')||0)<864e5}catch(e){}
  r.h=r.h.replace(/<div class="card"><b>احفظ نسخة احتياطية<\/b>.*?<\/button><\/div>/s,hid?'':'<div class="bkb"><span>لم تُحفظ نسخة خارجية منذ أسبوع</span><button class="btn sm" onclick="BKP()">حفظ</button><button class="bkx" onclick="bkHide()" aria-label="إغلاق">✕</button></div>');return r};
render();
})();
/* ============================================================
   تحديث شامل (الدفعة 1 + 2):
   1. خزنة الصور في IndexedDB + تكبير الصور
   2. IMEI بالباركود + دعم الآيفون + إضافة مباشرة من المسح (هاتف / صيانة / ربط)
   3. نظام ضمان الإصلاح المتكامل
   4. منع تضارب المخزون بين الموظفين في المزامنة (Delta Sync) + إحكام أمان الموظفين
   ============================================================ */
(()=>{
/* ---------- 1) خزنة الصور في IndexedDB لتفريغ localStorage نهائياً ---------- */
const IMG_CACHE = {};
function imgDb(mode, fn) {
  return new Promise((res, rej) => {
    const req = indexedDB.open('AzizShopMedia', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('imgs');
    req.onsuccess = e => {
      try {
        const tx = e.target.result.transaction('imgs', mode);
        fn(tx.objectStore('imgs'), res, rej);
      } catch (err) { rej(err); }
    };
    req.onerror = rej;
  });
}
function putImg(id, data) {
  if (!id || !data) return;
  IMG_CACHE[id] = data;
  imgDb('readwrite', (st, res) => { st.put(data, id); res(); }).catch(() => {});
}
function delImg(id) {
  if (!id) return;
  delete IMG_CACHE[id];
  imgDb('readwrite', (st, res) => { st.delete(id); res(); }).catch(() => {});
}

function initImgs() {
  let migrated = 0;
  (S.rp || []).forEach(r => {
    if (r.img && r.img.startsWith('data:image')) {
      putImg(r.id, r.img);
      migrated = 1;
    }
  });
  imgDb('readonly', (st, res) => {
    const req = st.openCursor();
    req.onsuccess = e => {
      const cur = e.target.result;
      if (cur) {
        IMG_CACHE[cur.key] = cur.value;
        cur.continue();
      } else res();
    };
  }).then(() => {
    let chg = 0;
    (S.rp || []).forEach(r => {
      if (IMG_CACHE[r.id] && (!r.img || r.img.startsWith('idb:'))) {
        r.img = IMG_CACHE[r.id];
        chg = 1;
      }
    });
    if (migrated) save();
    else if (chg) render();
  }).catch(() => {});
}

const _prevSvHook = window._svHook;
let _strippedImgs = null;
window._svHook = () => {
  if (_prevSvHook) try { _prevSvHook(); } catch (e) {}
  try {
    _strippedImgs = [];
    (S.rp || []).forEach(r => {
      if (r.img && r.img.startsWith('data:image')) {
        putImg(r.id, r.img);
        _strippedImgs.push([r, r.img]);
        r.img = 'idb:' + r.id;
      } else if (!r.img && IMG_CACHE[r.id] && r.st == 'dn') {
        delImg(r.id);
      }
      if (r.imei) r._nzV = -1;
    });
    (S.items || []).forEach(i => {
      if (i.imei || i.code) i._nzV = -1;
    });
  } catch (e) {}
};

const _origSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(k, v) {
  try {
    return _origSetItem.call(this, k, v);
  } finally {
    if (this === localStorage && k === 'shop3' && _strippedImgs) {
      _strippedImgs.forEach(([r, data]) => { r.img = data; });
      _strippedImgs = null;
    }
  }
};

/* ---------- 2) منظف الصور الذكي المرتبط بمدة الضمان ---------- */
Object.assign(DL0, { rpKeep: 30 });
LM.push(['rpKeep', 'الصيانة: مسح الصورة والرمز بعد التسليم بـ (أيام)']);

window.cleanOldRpMedia = function() {
  const now = Date.now(), baseKeep = (S.cfg.rpKeep ?? 30) * 864e5;
  let chg = 0;
  (S.rp || []).forEach(r => {
    if (r.st == 'dn' && r.t2) {
      const warKeep = ((+r.war || 0) + 3) * 864e5;
      const keepMs = Math.max(baseKeep, warKeep);
      if (now - r.t2 > keepMs && (r.img || r.lock || (r.pat && r.pat.length))) {
        r.img = ''; r.lock = ''; r.pat = [];
        delImg(r.id);
        chg = 1;
      }
    }
  });
  if (chg) save();
};

window.rpZoom = id => {
  const r = rf(id), src = r && (IMG_CACHE[r.id] || (r.img && r.img.startsWith('data:') ? r.img : ''));
  if (!src) return;
  $('sh').innerHTML = `<div class="bar"></div><h3>${esc(r.name + ' — ' + r.dev)}</h3><img src="${src}" style="width:100%;max-height:70vh;object-fit:contain;border-radius:12px"><div class="acts"><button class="btn s" onclick="finish(null)">إغلاق</button></div>`;
  sheetOpen(() => {});
};

/* ---------- 3) دعم مسح الباركود على الآيفون (iOS Safari / PWA) ---------- */
let _bcPolyLoading = null;
async function ensureBarcodeDetector() {
  if ('BarcodeDetector' in window) return true;
  if (_bcPolyLoading) return _bcPolyLoading;
  _bcPolyLoading = new Promise(res => {
    const s = document.createElement('script');
    s.src = 'https://fastly.jsdelivr.net/npm/barcode-detector@2/dist/iife/pure.min.js';
    s.onload = () => {
      if (window.BarcodeDetectorPolyfill && !('BarcodeDetector' in window)) {
        window.BarcodeDetector = window.BarcodeDetectorPolyfill;
      }
      res('BarcodeDetector' in window);
    };
    s.onerror = () => res(false);
    document.head.appendChild(s);
  });
  return _bcPolyLoading;
}

const _origBcScan = bcScan;
window.bcScan = async function(cb) {
  if (!('BarcodeDetector' in window)) {
    toast('جارٍ تجهيز ماسح الباركود...');
    await ensureBarcodeDetector();
  }
  _origBcScan(cb);
};

let _inlineStream = null, _inlineTimer = 0;
window.stopInlineScan = () => {
  clearInterval(_inlineTimer);
  if (_inlineStream) { _inlineStream.getTracks().forEach(t => t.stop()); _inlineStream = null; }
  const bx = $('inline_bc_box');
  if (bx) bx.remove();
};
window.scanIntoInput = async function(inputId) {
  if ($('inline_bc_box')) { stopInlineScan(); return; }
  const inp = $(inputId);
  if (!inp) return;
  if (!(await ensureBarcodeDetector()) || !navigator.mediaDevices) {
    return toast('هذا المتصفح لا يدعم المسح بالكاميرا');
  }
  const wrap = inp.closest('label') || inp.parentElement;
  wrap.insertAdjacentHTML('afterend', `<div id="inline_bc_box" class="card" style="margin:8px 0;padding:10px;text-align:center"><div class="m" style="margin-bottom:6px">وجّه الكاميرا نحو باركود IMEI على العلبة أو الشاشة (*#06#)</div><video id="inline_bcv" autoplay playsinline muted style="width:100%;max-height:190px;object-fit:cover;border-radius:10px"></video><button type="button" class="btn s sm" style="margin-top:8px;width:100%" onclick="stopInlineScan()">إلغاء المسح</button></div>`);
  const det = new BarcodeDetector();
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
    const v = $('inline_bcv');
    if (!v) { stream.getTracks().forEach(t => t.stop()); return; }
    _inlineStream = stream;
    v.srcObject = stream;
    _inlineTimer = setInterval(() => {
      det.detect(v).then(codes => {
        if (codes && codes[0] && _inlineStream) {
          const val = String(codes[0].rawValue || '').trim();
          if (val) {
            const cur = inp.value.trim();
            inp.value = cur && !cur.includes(val) ? cur + ' · ' + val : val;
            stopInlineScan();
            toast('تم التقاط الرمز: ' + val);
          }
        }
      }).catch(() => {});
    }, 350);
  }).catch(() => {
    stopInlineScan();
    toast('تعذر فتح الكاميرا');
  });
};

const _origHideSheet = hideSheet;
window.hideSheet = function() {
  stopInlineScan();
  _origHideSheet();
};

/* ---------- 4) إضافة حقل IMEI للهواتف + دمج تلقائي عند تعدد القطع ---------- */
FLD.phones.push(['imei', 'IMEI', 'I:p_imei']);
FLD.rp.push(['imei', 'IMEI', 'I:r_imei'], ['war', 'ضمان الإصلاح', 'I:r_war']);

let _tmpPhImei = '', _tmpPhCode = '';
const _pfImei = phForm;
phForm = function(rec) {
  _tmpPhCode = (rec && rec.code) || '';
  _pfImei(rec);
  const cntInp = $('pcnt');
  if (cntInp) {
    const lbl = cntInp.closest('label');
    if (lbl) {
      lbl.insertAdjacentHTML('afterend', `<label>IMEI / الرقم التسلسلي (اختياري)<div class="row2" style="margin-top:4px"><input id="p_imei" value="${esc(rec.imei || '')}" placeholder="امسح الباركود أو اكتب الرقم" style="flex:1"><button type="button" class="btn s sm" onclick="scanIntoInput('p_imei')">${I('scan')} مسح</button></div></label>`);
    }
  }
  hideF('phones');
};

const _psImei = phSave;
phSave = function() {
  const el = $('p_imei');
  _tmpPhImei = el ? el.value.trim() : '';
  _psImei();
};

const _pdImei = phDone;
phDone = function(v) {
  if (v && typeof v == 'object' && v.add === undefined) {
    v.imei = _tmpPhImei;
    if (_tmpPhCode && !(PR && PR.id)) v.code = _tmpPhCode;
    /* إذا كان الهاتف موجوداً مسبقاً وسيتم زيادة عدده، ندمج الـ IMEI الجديد مع القديم لئلا يضيع */
    if (!(PR && PR.id) && _tmpPhImei) {
      const d = ph().find(i => i.brand == v.brand && nz(i.name) == nz(v.name) && i.color == v.color && i.ram == v.ram && i.cap == v.cap && i.cond == v.cond);
      if (d) {
        d.imei = d.imei ? (d.imei.includes(_tmpPhImei) ? d.imei : d.imei + ' · ' + _tmpPhImei) : _tmpPhImei;
      }
    }
  }
  _tmpPhCode = '';
  _pdImei(v);
};

/* خيارات الضمان وIMEI في نموذج الصيانة */
const WAR_OPTS = [[0, 'بدون ضمان'], [3, '3 أيام'], [7, '7 أيام'], [15, '15 يوم'], [30, '30 يوم']];
let _curWar = 0, _tmpRpImei = '', _tmpRpWar = 0;

window.setRpWar = d => {
  _curWar = +d || 0;
  const inp = $('r_war');
  if (inp) inp.value = _curWar || '';
  document.querySelectorAll('.war-tg').forEach(b => {
    b.classList.toggle('on', +b.dataset.w === _curWar);
  });
};

const _rfWar = rForm;
rForm = function(rec) {
  _rfWar(rec);
  _curWar = +(rec.war ?? 0);
  const vInp = $('r_v'), dInp = $('r_d');
  if (vInp) {
    const lbl = vInp.closest('label');
    const hist = $('rp_dev_hist');
    const target = hist || lbl;
    if (target) {
      target.insertAdjacentHTML('afterend', `<label>IMEI / الرقم التسلسلي (اختياري)<div class="row2" style="margin-top:4px"><input id="r_imei" value="${esc(rec.imei || '')}" placeholder="امسح باركود العلبة أو *#06#" style="flex:1"><button type="button" class="btn s sm" onclick="scanIntoInput('r_imei')">${I('scan')} مسح</button></div></label>`);
    }
  }
  if (dInp) {
    const lbl = dInp.closest('label');
    if (lbl) {
      lbl.insertAdjacentHTML('afterend', `<label>ضمان الإصلاح (يبدأ من تاريخ التسليم)<div style="margin:4px 0">${WAR_OPTS.map(([d, l]) => `<button type="button" class="tag war-tg ${_curWar === d ? 'on' : ''}" data-w="${d}" onclick="setRpWar(${d})">${l}</button>`).join('')}</div><input id="r_war" type="tel" value="${_curWar || ''}" placeholder="أو اكتب عدد أيام الضمان (0 = بدون ضمان)" oninput="_curWar=+this.value||0;document.querySelectorAll('.war-tg').forEach(b=>b.classList.toggle('on',+b.dataset.w===_curWar))"></label>`);
    }
  }
  hideF('rp');
};

const _rsWar = rSave;
rSave = function() {
  const im = $('r_imei'), wr = $('r_war');
  _tmpRpImei = im ? im.value.trim() : (ZR && ZR.imei ? ZR.imei : '');
  _tmpRpWar = wr ? Math.max(0, Math.floor(+wr.value || 0)) : (ZR && ZR.war ? +ZR.war : 0);
  _rsWar();
};

const _rdWar = rDone;
rDone = function(v) {
  if (v && typeof v == 'object') {
    v.imei = _tmpRpImei;
    v.war = _tmpRpWar;
  }
  _rdWar(v);
};

/* ---------- 5) تأكيد مدة الضمان عند التسليم (rDV) + إضافته للواتساب ---------- */
const WAR_SEL = ['بدون ضمان (0 يوم)', '3 أيام', '7 أيام', '15 يوم', '30 يوم'];
const warToLbl = d => {
  d = +d || 0;
  if (!d) return WAR_SEL[0];
  const f = WAR_OPTS.find(x => x[0] === d);
  return f ? f[1] : d + ' يوم';
};
const lblToWar = s => {
  const m = String(s || '').match(/\d+/);
  return m ? +m[0] : 0;
};

rDV = function(id, pre) {
  const r = rf(id), pr = pre || {};
  const cap = sn1(r.cap) ? +r.cap : null, dep = sn1(r.dep) ? +r.dep : 0;
  const def = (r.res == 'ok' && cap !== null) ? String(Math.max(0, cap - dep)) : '';
  const lbl = def
    ? (dep ? 'المتبقي ' + def + ' (السعر ' + cap + ' − العربون ' + dep + ') — هل هو المقبوض الآن؟ عدّله إن اختلف' : 'هل المبلغ المقبوض هو ' + def + ' ؟ عدّله إن اختلف')
    : (dep ? 'المبلغ المقبوض الآن (العربون ' + r.dep + ' مقبوض سابقاً — اكتب 0 إن لم يُقبض شيء)' : 'المبلغ المقبوض (0 إن لم يُقبض شيء)');
  const fields = [{ k: 'p', l: lbl, t: 'tel', v: pr.p ?? def }];
  if (r.res == 'ok') {
    const curW = warToLbl(pr.war ?? r.war ?? 0);
    const wOpts = WAR_SEL.includes(curW) ? WAR_SEL : [curW, ...WAR_SEL];
    fields.unshift(
      { k: 'tested', l: (pr.err ? 'مطلوب، اختر أحد الخيارين: ' : '') + 'تجربة الإصلاح مع الزبون قبل التسليم (إجباري)', t: 'sel', o: DVO, v: pr.tested || DVO[0] },
      { k: 'war', l: 'مدة ضمان الإصلاح (يبدأ اليوم)', t: 'sel', o: wOpts, v: curW }
    );
  }
  fields.push({ k: 'dnote', l: 'ملاحظة عند التسليم (اختياري)', v: pr.dnote ?? (r.dnote || '') });
  ask('تسليم الهاتف: ' + r.name, fields, 'تأكيد التسليم', false).then(v => {
    if (!v) return;
    const again = e => rDV(id, { p: v.p, dnote: v.dnote, tested: v.tested, war: lblToWar(v.war), err: e });
    if (r.res == 'ok' && v.tested == DVO[0]) return again(1);
    if (v.p.trim() !== '' && !sn1(v.p)) { toast('اكتب المبلغ رقماً فقط (مثال 100)'); return again(0); }
    commit('تم التسليم', () => {
      r.st = 'dn';
      r.t2 = Date.now();
      r.dby = S.me;
      r.paid = v.p.trim() || '0';
      r.tst = v.tested == DVO[1] ? Date.now() : 0;
      if (r.res == 'ok') r.war = lblToWar(v.war);
      r.dnote = (v.dnote || '').trim();
    });
  });
};

function warInfo(r) {
  const w = +r.war || 0;
  if (!w || r.res == 'fail' || r.res == 'ref') return null;
  if (r.st != 'dn' || !r.t2) return { active: true, daysLeft: w, label: `الضمان المقرر: ${w} يوم` };
  const end = r.t2 + w * 864e5;
  const rem = Math.ceil((end - Date.now()) / 864e5);
  const endStr = new Date(end).toLocaleDateString('ar-MA');
  return rem > 0
    ? { active: true, daysLeft: rem, label: `تحت الضمان: باقي ${rem} يوم (لغاية ${endStr})` }
    : { active: false, daysLeft: 0, label: `انتهى الضمان (${w} يوم — انتهى ${endStr})` };
}

const _cardWar = card;
card = function(i) {
  let h = _cardWar(i);
  if (i.sec == 'phones' && i.imei) {
    const imHtml = `<div class="m">IMEI: <bdi>${esc(i.imei)}</bdi></div>`;
    h = h.replace('<div class="row2" style="margin-top:8px">', imHtml + '<div class="row2" style="margin-top:8px">');
  }
  return h;
};

const _rcWar = rc;
rc = function(r) {
  const realImg = IMG_CACHE[r.id] || (r.img && r.img.startsWith('data:') ? r.img : '');
  const bakImg = r.img;
  r.img = realImg;
  let h;
  try { h = _rcWar(r); } finally { r.img = bakImg; }
  if (realImg) {
    h = h.replace('<img src="', `<img onclick="rpZoom('${r.id}')" style="cursor:pointer;width:56px;height:56px;object-fit:cover;border-radius:10px" src="`);
  }
  let extra = '';
  if (r.imei) extra += `<div class="m">IMEI: <bdi>${esc(r.imei)}</bdi></div>`;
  const wi = warInfo(r);
  if (wi) {
    const col = wi.active ? '#16a34a' : '#64748b';
    extra += `<div class="m" style="color:${col};font-weight:700">${I('shield')} ${esc(wi.label)}</div>`;
  }
  if (extra) h = h.replace('<div class="sub">', extra + '<div class="sub">');
  return h;
};

const _origRH = rH;
rH = function() {
  _origRH();
  const t = ($('r_t') ? $('r_t').value : '').replace(/\D/g, '');
  if (t.length <= 5) return;
  const m = S.rp.filter(r => r != ZR && String(r.tel).replace(/\D/g, '') == t);
  const activeW = m.map(r => ({ r, w: warInfo(r) })).filter(x => x.r.st == 'dn' && x.w && x.w.active);
  if (activeW.length && $('rh')) {
    const last = activeW[activeW.length - 1];
    $('rh').innerHTML = `<span style="color:#16a34a;font-weight:700">⚠️ جهاز (${esc(last.r.dev)}) لهذا الزبون ما زال ${esc(last.w.label)}!</span>`;
  }
};

const _waWar = rWA;
rWA = function(id, k) {
  const r = rf(id);
  if (!r || !rnum(r.tel)) return toast('لا يوجد رقم لهذا الزبون: عدّل السجل وأضف الرقم');
  const wTxt = (+r.war > 0 && (!k || r.res == 'ok')) ? ` (الضمان: ${r.war} يوم)` : '';
  const imTxt = r.imei ? ` [IMEI: ${r.imei}]` : '';
  const origDev = r.dev;
  r.dev = origDev + imTxt + wTxt;
  try { _waWar(id, k); } finally { r.dev = origDev; }
};

/* ---------- 6) شمول IMEI في البحث + إجراءات مباشرة ذكية عند مسح رمز غير موجود ---------- */
const _origSrch = srch;
srch = function(q) {
  (S.items || []).forEach(i => {
    if (i.imei || i.code) i._nz = nz(hay(i) + ' ' + fxTxt(i) + ' ' + (i.imei || '') + ' ' + (i.code || ''));
    i._nzV = window._nzVer || 0;
  });
  (S.rp || []).forEach(r => {
    if (r.imei) r._nz = nz(r.name + r.tel + r.dev + r.fault + r.note + ' ' + fxTxt(r) + ' ' + r.imei);
    r._nzV = window._nzVer || 0;
  });
  return _origSrch(q);
};

const _origRpList = rpList;
rpList = function() {
  (S.rp || []).forEach(r => {
    if (r.imei) {
      r._nz = nz(r.name + r.tel + r.dev + r.fault + r.note + ' ' + fxTxt(r) + ' ' + r.imei);
      r._nzV = window._nzVer || 0;
    }
  });
  return _origRpList();
};

/* دوال الإضافة المباشرة من شاشة المسح في الرئيسية */
window.bcNewPh = () => {
  $('sh').innerHTML = '';
  sheetOpen(phDone);
  phForm({ imei: BCODE, code: BCODE, cnt: 1 });
};
window.bcNewRp = () => {
  $('sh').innerHTML = '';
  sheetOpen(rDone);
  rForm({ imei: BCODE });
};

/* تحسين ربط الرمز بصنف موجود: للهواتف يضيفه أيضاً إلى حقل IMEI */
bcSet = function(id) {
  const i = find(id);
  if (!i) return;
  upd(() => {
    if (i.sec == 'phones' && /^\d{14,17}$/.test(BCODE)) {
      i.imei = i.imei ? (i.imei.includes(BCODE) ? i.imei : i.imei + ' · ' + BCODE) : BCODE;
    }
    i.code = i.code || BCODE;
    i.by = S.me;
    i.at = Date.now();
  });
  finish(null);
  toast('تم الربط بنجاح');
};

bcHome = function() {
  bcScan(c => {
    BCODE = String(c || '').trim();
    const nc = nz(BCODE);
    const mItems = S.items.filter(i => i.sec != 'glass' && (i.code == BCODE || (i.imei && nz(i.imei).includes(nc))));
    const mRp = (S.rp || []).filter(r => r.imei && nz(r.imei).includes(nc));
    const r = $('res');
    if (!r) return;
    if (mItems.length || mRp.length) {
      r.innerHTML = mItems.map(card).join('') + mRp.map(rc).join('');
    } else {
      r.innerHTML = `<div class="card"><div class="m">الرمز غير مسجل حالياً: <bdi><b>${esc(BCODE)}</b></bdi></div><div class="sub" style="margin-top:10px"><button class="btn sm" onclick="bcNewPh()">${I('mobile')} + إضافة كهاتف جديد</button><button class="btn s sm" onclick="bcNewRp()">${I('tool')} + استلام في الصيانة</button><button class="btn s sm" onclick="bcLink()">ربطه بصنف موجود</button></div></div>`;
    }
  });
};

/* ---------- 7) منع تضارب المخزون بين الموظفين في المزامنة (Delta Sync Merge) ---------- */
if (typeof syApply == 'function') {
  const _origSyApply = syApply;
  /* حفظ لقطة محلية لآخر أعداد معروفة عند كل مزامنة لحساب الفرق (Delta) بدقة */
  const getSnapMap = () => {
    try { return JSON.parse(localStorage.getItem('shopSyncSnap') || '{}'); } catch (e) { return {}; }
  };
  const saveSnapMap = m => {
    try { localStorage.setItem('shopSyncSnap', JSON.stringify(m)); } catch (e) {}
  };

  /* تحديث اللقطة بعد كل دورة حفظ ناجحة في المزامنة */
  const _origSyPut2 = syPut2;
  window.syPut2 = function(st) {
    _origSyPut2(st);
    try {
      const snap = getSnapMap();
      (S.items || []).forEach(i => {
        const k = 'items/' + i.id;
        if (st.base && st.base[k] && !st.dt[k]) {
          snap[k] = { cnt: i.cnt, stock: i.stock ? { ...i.stock } : null, v: Array.isArray(i.v) ? i.v.map(x => ({ id: x.id, n: x.n })) : null };
        }
      });
      saveSnapMap(snap);
    } catch (e) {}
  };

  window.syApply = async function(r, st, cm, force) {
    const k = r.coll + '/' + r.id;
    const loc = cm[k];
    const snap = getSnapMap()[k];
    /* إذا كان الصنف معدّلاً محلياً وفي السيرفر معاً في نفس الوقت (تضارب موظفين على نفس الصنف) */
    if (r.coll == 'items' && !r.deleted && loc && snap && st.base[k]) {
      const lh = syH(JSON.stringify(loc));
      const isLocalDirty = lh !== st.base[k].h;
      if (isLocalDirty && force) {
        try {
          let js = r.data;
          if (r.enc) js = await syDec(js);
          const rem = JSON.parse(js);
          /* 1. دمج عدد الهواتف أو الإكسسوارات بالفرق (Delta) */
          if (typeof loc.cnt == 'number' && typeof rem.cnt == 'number' && typeof snap.cnt == 'number') {
            const localDelta = loc.cnt - snap.cnt;
            const remoteDelta = rem.cnt - snap.cnt;
            if (localDelta !== 0 && remoteDelta !== 0) {
              rem.cnt = Math.max(0, snap.cnt + localDelta + remoteDelta);
              r = { ...r, data: r.enc ? await syEnc(JSON.stringify(rem)) : JSON.stringify(rem) };
            }
          }
          /* 2. دمج أعداد البوشيط (الألوان والأنواع) بالفرق */
          if (Array.isArray(loc.v) && Array.isArray(rem.v) && Array.isArray(snap.v)) {
            let vChg = 0;
            rem.v.forEach(rv => {
              const lv = loc.v.find(x => x.id == rv.id), sv = snap.v.find(x => x.id == rv.id);
              if (lv && sv) {
                const ld = lv.n - sv.n, rd = rv.n - sv.n;
                if (ld !== 0 && rd !== 0) { rv.n = Math.max(0, sv.n + ld + rd); vChg = 1; }
              }
            });
            if (vChg) r = { ...r, data: r.enc ? await syEnc(JSON.stringify(rem)) : JSON.stringify(rem) };
          }
        } catch (e) {}
      }
    }
    return _origSyApply(r, st, cm, force);
  };
}

/* ---------- 8) إحكام أمان حسابات الموظفين عند تبديل المستخدم ---------- */
who = function() {
  ask('من أنت؟', [{ k: 'u', l: 'المستخدم', t: 'sel', o: S.users.map(u => u.name), v: S.me }], 'اختيار').then(v => {
    if (!v) return;
    const u = S.users.find(x => x.name == v.u);
    if (!u) return;
    if (!u.admin) {
      const go2 = () => { admSet(false); upd(() => { S.me = u.name; }); };
      if (u.name == S.me) return;
      /* إذا كان للموظف رمز، يُطلب دائماً، وإذا لم يكن له رمز ولكن هناك موظفون آخرون برمز، يُنبه المدير */
      if (u.pin) {
        return ask('رمز الموظف: ' + u.name, [{ k: 'p', l: 'الرمز السري', t: 'password' }], 'دخول').then(p => {
          if (!p) return;
          hv(p.p, u.pin) || hv(p.p, S.pin) ? go2() : toast('الرمز خاطئ');
        });
      }
      return go2();
    }
    if (u.name == S.me && admOk()) return;
    ask('رمز المدير', [{ k: 'p', l: 'الرمز', t: 'password' }], 'دخول').then(p => {
      if (p) hv(p.p, S.pin) ? (admSet(true), upd(() => { S.me = u.name; })) : toast('الرمز خاطئ');
    });
  });
};

/* إظهار حالة خزنة الصور في شاشة النسخ الاحتياطي */
const _bkIdb = VW.st_bk;
VW.st_bk = function() {
  const o = _bkIdb();
  const imgCnt = Object.keys(IMG_CACHE).length;
  o.h += `<div class="card" style="margin-top:10px"><b>خزنة الصور المعزولة (IndexedDB)</b><div class="m">عدد صور الصيانة المحفوظة خارج ذاكرة المتصفح الضيقة: <b>${imgCnt}</b> صورة (لا تستهلك من حد الـ 5 ميجابايت).</div></div>`;
  return o;
};

initImgs();
cleanOldRpMedia();
render();
})();
