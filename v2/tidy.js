/* ============================================================
   tidy.js — تحكم أكبر في التقرير + إعدادات مرتّبة في أقسام
   يُحمَّل آخر ملف (بعد groups.js)
   ============================================================ */
(()=>{
/* ---------- خيارات التقرير (تُحفظ في الإعدادات وتتزامن بين الأجهزة) ---------- */
const RD={lv:'a',tt:'تقرير محل عزيز',dt:1,st:0,pr:0,pt:1,rq:1,pn:1,em:0,ft:'',hs:[]};
const rc=()=>({...RD,...(S.cfg.rc||{})});
const okEdit=()=>isAdmin()||!S.users.length;
window.rcSet=o=>{if(!okEdit())return toast('للمدير فقط');upd(()=>{S.cfg.rc={...(S.cfg.rc||{}),...o}})};
window.rcHide=k=>{const h=rc().hs.slice(),i=h.indexOf(k);i<0?h.push(k):h.splice(i,1);rcSet({hs:h})};
window.rcTt=()=>{if(!okEdit())return toast('للمدير فقط');ask('عنوان التقرير',[{k:'t',l:'العنوان (فارغ = بدون عنوان)',v:rc().tt}],'حفظ').then(v=>{if(v)rcSet({tt:v.t.trim()})})};
window.rcFt=()=>{if(!okEdit())return toast('للمدير فقط');ask('عبارة آخر التقرير',[{k:'t',l:'مثال: شكراً — فارغ = بدون عبارة',v:rc().ft}],'حفظ').then(v=>{if(v)rcSet({ft:v.t.trim()})})};
window.RLV=null;

const lines=()=>{const c=rc();let L=c.pn?repL7():repLines();if((window.RLV||c.lv)=='r')L=L.filter(x=>x[2]=='r');return L};
const secs=m=>rSecs(m).filter(k=>!rc().hs.includes(k));
const partsL=()=>S.rp.filter(r=>r.st=='in'&&r.part);

/* ---------- نص التقرير: مختصر ومرتّب، بلا رموز تعبيرية ---------- */
const TT={phones:'الهواتف',glass:'الأنتي كاس',pochette:'البوشيط',acc:'الإكسسوارات'};
const dstr=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()};
const cnt=(m,a,n)=>n=='0'?' — نفد':' — العدد '+a+n;
const fmtT=x=>{let s=x[1].replace(/\s—\s(?:العدد |المجموع |المتوفر )(≈?)(\d+)/,(m,a,n)=>cnt(m,a,n)).replace(/\s—\s(\d+)$/,(m,n)=>cnt(m,'',n));
  if(x[2]=='r'&&!/نفد/.test(s))s+=' — نفد';return s};
const blocks=mode=>{const c=rc(),L=lines(),out=[];
  secs(mode).forEach(k=>{const key=RSEC[k][0],ls=L.filter(x=>x[0]==key).sort((a,b)=>(a[2]=='r'?0:1)-(b[2]=='r'?0:1));
    out.push({k,t:TT[k]||RSEC[k][1],ls:ls.map(x=>({r:x[2]=='r',s:fmtT(x),x}))})});
  if(mode=='all'||mode=='acc'){
    if(c.pt){const p=partsL();out.push({k:'parts',t:'قطع الصيانة',ls:p.map(r=>({r:0,s:r.part+(r.dev&&!nz(r.part).includes(nz(r.dev))?' — '+r.dev:'')}))})}
    if(c.rq&&mode=='all'){out.push({k:'req',t:'طلبات الزبائن',ls:S.req.map(q=>({r:0,s:q.t,id:q.id}))})}}
  return out};
window.generateReportText=function(mode='all'){
  const c=rc(),B=blocks(mode),o=[];
  const need=B.filter(b=>b.k!='parts'&&b.k!='req').reduce((a,b)=>a+b.ls.length,0),red=B.filter(b=>b.k!='parts'&&b.k!='req').reduce((a,b)=>a+b.ls.filter(x=>x.r).length,0);
  const head=[c.tt?'*'+c.tt+'*':'',c.dt?dstr():''].filter(Boolean).join(' — ');
  if(head)o.push(head);
  o.push(need?'للشراء: '+need+(red?' (نافد '+red+')':''):'لا يوجد نقص حالياً');
  if((mode=='all'||mode=='phones')&&c.st&&!c.hs.includes('phones')){
    const s=stkL();
    if(s.length){o.push('');o.push('*الهواتف المتوفرة*');s.forEach(i=>o.push('- '+stkN(i)+' — '+i.cnt+(window.rsQ&&rsQ(i)?' (محجوز '+rsQ(i)+')':'')+(c.pr&&i.price?' — '+dh(i.price):'')))}}
  B.forEach(b=>{if(!b.ls.length&&!c.em)return;o.push('');o.push('*'+b.t+'*');
    if(b.ls.length)b.ls.forEach(x=>o.push('- '+x.s));else o.push('- لا نقص')});
  if(c.ft){o.push('');o.push(c.ft)}
  return o.join('\n')};

/* ---------- شاشة التقرير ---------- */
VW.rep=function(){
  const c=rc(),s=stkL(),lv=window.RLV||c.lv,B=blocks(reportSectionFilter);
  const tabs=RTABS.filter(([k])=>k=='all'||!c.hs.includes(k));
  if(!tabs.some(([k])=>k==reportSectionFilter))reportSectionFilter='all';
  let h=`<div class="rtabs">${tabs.map(([k,l])=>`<button class="tag ${reportSectionFilter===k?'on':''}" onclick="reportSectionFilter='${k}';render()">${l}</button>`).join('')}</div>`;
  h+=`<div class="rtabs"><button class="tag ${lv=='a'?'on':''}" onclick="RLV='a';render()">نافد وقارب</button><button class="tag ${lv=='r'?'on':''}" onclick="RLV='r';render()">نافد فقط</button><button class="tag" style="margin-inline-start:auto" onclick="go('st_rep')">تخصيص</button></div>`;
  if((reportSectionFilter=='all'||reportSectionFilter=='phones')&&c.st&&!c.hs.includes('phones')&&s.length)
    h+='<h3>الهواتف المتوفرة</h3>'+s.map(i=>`<div class="card row2"><span style="flex:1">${esc(stkN(i))}</span><span class="m">${i.cnt}${window.rsQ&&rsQ(i)?' (محجوز '+rsQ(i)+')':''}${c.pr&&i.price?' · '+esc(dh(i.price)):''}</span></div>`).join('');
  B.forEach(b=>{
    let x=b.ls.map(l=>{
      if(b.k=='parts')return `<div class="card row2"><span style="flex:1">${esc(l.s)}</span></div>`;
      if(b.k=='req')return `<div class="card row2"><span style="flex:1">${esc(l.s)}</span><button class="btn s sm" onclick="rqD('${l.id}')">مسح</button></div>`;
      return `<div class="card row2"><span class="dotl" style="background:${DT[l.x[2]]}"></span><span style="flex:1">${esc(l.s)}</span><button class="btn sm" onclick="${l.x[3]}">تم الشراء</button></div>`}).join('');
    if(x)h+=`<h3>${b.t}</h3>`+x;else if(c.em)h+=`<h3>${b.t}</h3><p class="m">لا نقص</p>`});
  if(!h.includes('<h3>'))h+='<p class="m" style="text-align:center;margin:24px 0">لا يوجد نقص حالياً</p>';
  h+=`<details class="card" style="margin-top:14px"><summary><b>معاينة النص</b></summary><div style="white-space:pre-wrap;margin-top:8px;line-height:1.8">${esc(generateReportText(reportSectionFilter))}</div></details>`;
  h+=`<div style="margin-top:14px;display:flex;gap:10px"><button class="btn" style="flex:1" onclick="location.href='https://wa.me/?text='+encodeURIComponent(generateReportText(reportSectionFilter))">${I('send')} إرسال بالواتساب</button><button class="btn s" onclick="navigator.clipboard.writeText(generateReportText(reportSectionFilter)).then(()=>toast('تم النسخ'))">نسخ</button></div>`;
  return{t:'التقرير اليومي',h}};

/* ---------- شاشة إعدادات التقرير ---------- */
const yn=v=>v?'نعم':'لا';
const tog=(l,k)=>row(l,"rcSet({"+k+":"+(rc()[k]?0:1)+"})",yn(rc()[k]));
VW.st_rep=()=>{const c=rc();
  return{t:'إعدادات التقرير',h:
  '<p class="m">هذه الإعدادات تحدد ما يظهر في التقرير ونصّ الواتساب، وتنطبق على كل الأجهزة.</p>'
  +'<h3>العنوان والتوقيع</h3>'
  +row('عنوان التقرير',"rcTt()",c.tt||'بدون')
  +tog('إظهار التاريخ بجانب العنوان','dt')
  +row('عبارة في آخر التقرير',"rcFt()",c.ft||'بدون')
  +'<h3>ما الذي يُدرج</h3>'
  +tog('قائمة الهواتف المتوفرة','st')
  +tog('أسعار الهواتف المتوفرة','pr')
  +tog('قطع الصيانة المنتظرة','pt')
  +tog('طلبات الزبائن','rq')
  +tog('ملاحظات البوشيط (باقي / خاصنا)','pn')
  +tog('إظهار الأقسام التي لا نقص فيها','em')
  +'<h3>المستوى الافتراضي</h3>'
  +`<div style="display:flex;gap:6px;margin-bottom:10px"><button class="tag ${c.lv=='a'?'on':''}" onclick="rcSet({lv:'a'})">النافد وقارب النفاد</button><button class="tag ${c.lv=='r'?'on':''}" onclick="rcSet({lv:'r'})">النافد فقط</button></div>`
  +'<h3>الأقسام الظاهرة في التقرير</h3>'
  +RTABS.filter(([k])=>k!='all').map(([k,l])=>row(l,"rcHide('"+k+"')",yn(!c.hs.includes(k)))).join('')
  +`<div style="margin-top:14px"><button class="btn s" onclick="rcSet({lv:'a',tt:'تقرير محل عزيز',dt:1,st:0,pr:0,pt:1,rq:1,pn:1,em:0,ft:'',hs:[]})">إرجاع الإعدادات الافتراضية</button></div>`}};

/* ---------- المزيد / الإعدادات: أقسام منظمة ومنطقية ---------- */
VW.st=()=>{
  const cnt=a=>(a||[]).length||'';
  const sy=typeof syCfg=='function'&&typeof SYM!='undefined'&&typeof SYS!='undefined'?(syCfg().on?SYM[SYS.st]:'متوقفة'):'';
  const sec=Object.keys(CATS).map(k=>row(CATS[k][0],"go('st_c',{c:'"+k+"'})")).join('');
  return{t:'المزيد',h:
  '<h3>أقسام المحل</h3><p class="m">الوسوم والحدود والخانات الخاصة بكل قسم</p>'+sec
  +'<h3>التقرير</h3>'+row('إعدادات التقرير',"go('st_rep')")
  +'<h3>الشكل والنماذج</h3>'
  +row('المظهر',"go('st_look')")
  +row('تلوين البطاقات',"go('st_col')")
  +row('الحقول في النماذج',"go('st_fld')")
  +row('الخانات المخصصة',"go('st_fx')",cnt(S.fields))
  +'<h3>الحدود والتنبيهات</h3>'+row('حدود النفاد والقفل التلقائي',"go('st_lim')")
  +'<h3>المستخدمون والأمان</h3>'
  +row('المستخدمون والصلاحيات',"go('st_users')")
  +row('رمز القفل السريع','lkSet()',S.cfg.lk?'مُعيَّن':'غير مُعيَّن')
  +'<h3>البيانات والنسخ</h3>'
  +row('المزامنة بين الأجهزة',"go('st_sync')",sy)
  +row('النسخ الاحتياطي والاستعادة',"go('st_bk')")
  +row('المحذوفات',"go('st_trash')",cnt(S.trash))
  +row('كل الوسوم (قائمة كاملة)',"go('st_tags')")};
};
render();
})();
