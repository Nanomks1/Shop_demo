/* ============================================================
   tidy.js — تحكم أكبر في التقرير + إعدادات مرتّبة في أقسام
   يُحمَّل آخر ملف (بعد groups.js)
   ============================================================ */
(()=>{
/* ---------- خيارات التقرير (تُحفظ في الإعدادات وتتزامن بين الأجهزة) ---------- */
const RD={lv:'a',tt:'تقرير محل عزيز',dt:1,st:1,pr:1,pt:1,rq:1,pn:1,em:1,ft:'',hs:[]};
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

/* ---------- نص التقرير (واتساب / نسخ) ---------- */
window.generateReportText=function(mode='all'){
  const c=rc(),L=lines(),o=[];
  if(c.tt||c.dt){o.push('*'+[c.tt,c.dt?'('+new Date().toLocaleDateString('ar-MA')+')':''].filter(Boolean).join(' ')+'*');o.push('')}
  if((mode=='all'||mode=='phones')&&c.st&&!c.hs.includes('phones')){
    const s=stkL();
    if(s.length){o.push('*الهواتف المتوفرة حالياً*');s.forEach(i=>o.push('• '+stkN(i)+' — العدد '+i.cnt+(c.pr&&i.price?' ('+dh(i.price)+')':'')));o.push('')}
  }
  secs(mode).forEach(k=>{
    const [key,title,none]=RSEC[k],ls=L.filter(x=>x[0]==key),b=[];
    ls.forEach(x=>b.push((x[2]=='r'?'🔴 ':'🟡 ')+x[1]));
    if(k=='acc'){
      if(c.pt)partsL().forEach(r=>b.push('قطعة صيانة: '+r.part+' ('+r.dev+')'));
      if(c.rq&&mode=='all')S.req.forEach(q=>b.push('طلب زبون: '+q.t));
    }
    if(b.length){o.push('*'+title+'*');b.forEach(x=>o.push(x));o.push('')}
    else if(c.em){o.push('*'+title+'*');o.push(none);o.push('')}
  });
  if(c.ft){o.push(c.ft)}
  return o.join('\n').trim();
};

/* ---------- شاشة التقرير ---------- */
VW.rep=function(){
  const c=rc(),L=lines(),s=stkL(),lv=window.RLV||c.lv;
  const tabs=RTABS.filter(([k])=>k=='all'||!c.hs.includes(k));
  if(!tabs.some(([k])=>k==reportSectionFilter))reportSectionFilter='all';
  let h=`<div style="margin-bottom:10px;display:flex;gap:6px;overflow-x:auto">${tabs.map(([k,l])=>`<button class="tag ${reportSectionFilter===k?'on':''}" onclick="reportSectionFilter='${k}';render()">${l}</button>`).join('')}</div>`;
  h+=`<div style="margin-bottom:12px;display:flex;gap:6px;align-items:center"><button class="tag ${lv=='a'?'on':''}" onclick="RLV='a';render()">النافد وقارب النفاد</button><button class="tag ${lv=='r'?'on':''}" onclick="RLV='r';render()">النافد فقط</button><button class="tag" style="margin-inline-start:auto" onclick="go('st_rep')">تخصيص التقرير</button></div>`;
  if((reportSectionFilter=='all'||reportSectionFilter=='phones')&&c.st&&!c.hs.includes('phones')&&s.length)
    h+='<h3>الهواتف المتوفرة حالياً</h3>'+s.map(i=>`<div class="card row2"><span style="flex:1">${esc(stkN(i))}</span><span class="m">${i.cnt}${c.pr&&i.price?' · '+esc(dh(i.price)):''}</span></div>`).join('');
  secs(reportSectionFilter).forEach(k=>{
    const [key,title,none]=RSEC[k],ls=L.filter(x=>x[0]==key);
    let b=ls.map(x=>`<div class="card row2"><span class="dotl" style="background:${DT[x[2]]}"></span><span style="flex:1">${esc(x[1])}</span><button class="btn sm" onclick="${x[3]}">تم الشراء</button></div>`).join('');
    if(k=='acc'){
      if(c.pt)b+=partsL().map(r=>`<div class="card row2"><span class="dotl" style="background:#f59e0b"></span><span style="flex:1">${I('tool')} قطعة صيانة: <b>${esc(r.part)}</b> <span class="m">(${esc(r.dev)})</span></span></div>`).join('');
      if(c.rq&&reportSectionFilter=='all')b+=S.req.map(q=>`<div class="card row2"><span style="flex:1">${I('chat')} طلب زبون: <b>${esc(q.t)}</b></span><button class="btn s sm" onclick="rqD('${q.id}')">مسح</button></div>`).join('');
    }
    if(b)h+=`<h3>${title}</h3>`+b;
    else if(c.em)h+=`<h3>${title}</h3><p class="m">${none}</p>`;
  });
  h+=`<details class="card" style="margin-top:14px"><summary><b>معاينة نص الواتساب</b></summary><div style="white-space:pre-wrap;margin-top:8px;line-height:1.7">${esc(generateReportText(reportSectionFilter))}</div></details>`;
  h+=`<div style="margin-top:14px;display:flex;gap:10px"><button class="btn" style="flex:1" onclick="location.href='https://wa.me/?text='+encodeURIComponent(generateReportText(reportSectionFilter))">${I('send')} إرسال بالواتساب</button><button class="btn s" onclick="navigator.clipboard.writeText(generateReportText(reportSectionFilter)).then(()=>toast('تم النسخ'))">نسخ النص</button></div>`;
  return{t:'التقرير اليومي',h};
};

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
  +tog('الهواتف المتوفرة حالياً','st')
  +tog('أسعار الهواتف المتوفرة','pr')
  +tog('قطع الصيانة المنتظرة','pt')
  +tog('طلبات الزبائن','rq')
  +tog('ملاحظات البوشيط (باقي / خاصنا)','pn')
  +tog('إظهار الأقسام المكتملة (سطر «مكتمل»)','em')
  +'<h3>المستوى الافتراضي</h3>'
  +`<div style="display:flex;gap:6px;margin-bottom:10px"><button class="tag ${c.lv=='a'?'on':''}" onclick="rcSet({lv:'a'})">النافد وقارب النفاد</button><button class="tag ${c.lv=='r'?'on':''}" onclick="rcSet({lv:'r'})">النافد فقط</button></div>`
  +'<h3>الأقسام الظاهرة في التقرير</h3>'
  +RTABS.filter(([k])=>k!='all').map(([k,l])=>row(l,"rcHide('"+k+"')",yn(!c.hs.includes(k)))).join('')
  +`<div style="margin-top:14px"><button class="btn s" onclick="rcSet({lv:'a',tt:'تقرير محل عزيز',dt:1,st:1,pr:1,pt:1,rq:1,pn:1,em:1,ft:'',hs:[]})">إرجاع الإعدادات الافتراضية</button></div>`}};

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
