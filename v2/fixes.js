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
