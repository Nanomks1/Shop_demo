/* ============================================================
   groups.js — مجموعات الإكسسوارات (كابلات/شواحن/رؤوس): الحكم على المجموع
   ============================================================ */
(()=>{
if(typeof SY_ARR!='undefined'&&!SY_ARR.includes('ag'))SY_ARR.push('ag');
const A=()=>S.ag||(S.ag=[]);A();
S.tags.pw=S.tags.pw||['10W','18W','20W','25W','33W','45W','65W'];TG.pw='القدرة (واط)';
Object.assign(DL0,{agl:10});LM.push(['agl','مجموعة إكسسوار (كابل/شاحن): «قارب النفاد» عند مجموع ≤']);
const DK={'كابل':{g:1,w:0},'شاحن':{g:1,w:1},'رأس شاحن':{g:1,w:1}};
const gkc=k=>({g:0,w:0,...(DK[k]||{}),...((S.cfg.gkc||{})[k]||{})});
const gkey=i=>[i.kind,i.conn||'',i.tier||'',i.pw||''].join('|').replace(/\//g,'-');
const ORD={r:0,y:1,g:2},LB={g:'متوفر',y:'قارب النفاد',r:'نفد'};
function agList(){const m={},mk=(id,x)=>m[id]=m[id]||{id,kind:x.kind,conn:x.conn||'',tier:x.tier||'',pw:x.pw||'',mem:[]};
S.items.forEach(i=>{if(i.sec=='acc'&&gkc(i.kind).g)mk(gkey(i),i).mem.push(i)});
A().forEach(r=>{if(gkc(r.kind).g)mk(r.id,r)});
return Object.values(m).map(d=>{const g=A().find(x=>x.id==d.id),L=(g&&g.lim)??gkc(d.kind).lim??(S.cfg.agl??10),M=d.mem.filter(i=>typeof i.cnt=='number'),mt=M.reduce((a,i)=>a+i.cnt,0),mat=M.length?Math.max(...M.map(i=>i.at||0)):0;
let tot=null,est=false;if(M.length&&mat>((g&&g.at)||0))tot=mt;else if(g&&typeof g.cnt=='number'){tot=g.cnt;est=true}
const st=tot!==null?(tot<=0?'r':tot<=L?'y':'g'):((g&&g.lv)||'g');
return{...d,g,lim:L,tot,est,st,title:[d.kind,d.conn,d.pw,d.tier&&'فئة '+d.tier].filter(Boolean).join(' · ')}}).sort((a,b)=>ORD[a.st]-ORD[b.st]||a.title.localeCompare(b.title))}
const D=id=>agList().find(x=>x.id==decodeURIComponent(id));
function agSet(d,fn,touch=true){const o=A().find(x=>x.id==d.id),b=o?JSON.stringify(o):null;
upd(()=>{let g=A().find(x=>x.id==d.id);if(!g){g={id:d.id,kind:d.kind,conn:d.conn,tier:d.tier,pw:d.pw};A().push(g)}fn(g);g.by=S.me;if(touch)g.at=Date.now()});
toast('تم التحديث',()=>{S.ag=A().filter(x=>x.id!=d.id);if(b)S.ag.push(JSON.parse(b))})}
function agCard(d){const e=encodeURIComponent(d.id),sub=d.tot!==null?'المجموع '+(d.est?'≈':'')+d.tot+' · الحد '+d.lim:(d.st=='y'?'أقل من '+d.lim:d.st=='r'?'لا يوجد':'');
return `<div class="card"><div class="row2"><b>${esc(d.title)}</b><span class="dotl" style="background:${DT[d.st]}"></span><span class="m">${LB[d.st]}</span></div>${sub?`<div class="m">${sub}</div>`:''}${d.mem.length?`<div>${d.mem.map(i=>`<button class="tag" onclick="acEd('${i.id}')">${esc(i.brand||'بدون ماركة')}${typeof i.cnt=='number'?' · '+i.cnt:''}</button>`).join('')}</div>`:''}<div>${['g','y','r'].map(s=>`<button class="tag ${d.st==s?'on':''}" onclick="agLv('${e}','${s}')">${LB[s]}</button>`).join('')}</div><div class="sub"><button class="btn s sm" onclick="agCnt('${e}')">المجموع</button><button class="btn s sm" onclick="agLimEd('${e}')">الحد</button><button class="btn s sm" onclick="agAddB('${e}')">+ ماركة</button></div></div>`}
Object.assign(window,{agList,
agLv:(e,l)=>{const d=D(e);if(d)agSet(d,g=>{g.lv=l;delete g.cnt})},
agBuy:e=>{const d=D(e);if(d)agSet(d,g=>{g.lv='g';delete g.cnt})},
agCnt:e=>{const d=D(e);if(d)ask('المجموع التقريبي — '+d.title,[{k:'n',l:'العدد تقريباً',t:'tel',v:d.tot??''}]).then(v=>{if(v&&v.n.trim()!=='')agSet(d,g=>{g.cnt=Math.max(0,+v.n||0);delete g.lv})})},
agLimEd:e=>{const d=D(e);if(!d)return;if(!isAdmin())return toast('للمدير فقط');ask('الحد — '+d.title,[{k:'n',l:'«قارب النفاد» عند مجموع ≤ (فارغ = الحد العام)',t:'tel',v:d.g&&d.g.lim!=null?d.g.lim:''}]).then(v=>{if(v)agSet(d,g=>{if(v.n.trim()==='')delete g.lim;else g.lim=Math.max(0,+v.n||0)},false)})},
agAddB:e=>{const d=D(e);if(!d)return;$('sh').innerHTML='';sheetOpen(acDone);acForm({kind:d.kind,conn:d.conn,tier:d.tier,pw:d.pw})}});
/* القدرة (واط) في نموذج الإكسسوار */
const _af9=acForm;acForm=function(r){_af9(r);CS.pw=r.pw||'';CP.push(['pw','القدرة (واط)',()=>gkc(CS.kind).w]);ch()};
const _ad9=acDone;acDone=function(v){if(v)v.pw=gkc(v.kind).w?(CS.pw||''):'';
if(v&&!(PR&&PR.id)){const s=S.items.filter(i=>i.sec=='acc'&&i.kind==v.kind&&i.conn==v.conn&&i.tier==v.tier&&(i.brand||'')==v.brand),x=s.find(i=>(i.pw||'')==v.pw);
if(x)return toast('موجود مسبقاً: '+acName(x));
if(s.length){if(typeof fxAtt=='function')v=fxAtt(v);commit('تمت الإضافة',()=>S.items.push({id:uid(),sec:'acc',...v,st:'g',by:S.me,at:Date.now()}));if(PAN){PAN=0;setTimeout(acAdd,400)}return}}
_ad9(v)};
/* شاشة الإكسسوارات: المجموعات أولاً */
const _av9=acView;acView=function(){const keep=S.items;S.items=keep.filter(i=>!(i.sec=='acc'&&gkc(i.kind).g));let o;try{o=_av9()}finally{S.items=keep}
const j=V.kk,k=j==null?null:S.tags.kind[j],G=agList().filter(d=>k==null||d.kind==k).map(agCard).join('');
if(G){o.h=o.h.replace('<p class="m">لا شيء بعد</p>','');const p=o.h.indexOf('<div class="card"');o.h=p<0?o.h+G:o.h.slice(0,p)+G+o.h.slice(p)}return o};
/* التقرير */
const _rl9=repLines;repLines=function(){const L=_rl9().filter(x=>{if(x[0]!='الإكسسوارات')return 1;const m=/buyA\('([^']+)'\)/.exec(x[3]||''),i=m&&find(m[1]);return!(i&&gkc(i.kind).g)});
agList().filter(d=>d.st!='g').forEach(d=>L.push(['الإكسسوارات',d.title+(d.tot!==null?' — المجموع '+(d.est?'≈':'')+d.tot:d.st=='r'?' — نفد':' — قارب النفاد'),d.st,`agBuy('${encodeURIComponent(d.id)}')`]));return L};
/* الإعدادات (إضافتها أيضاً داخل قسم الإكسسوارات CATS.ac لسهولة الوصول) */
let AG0;
window.agKR=()=>{if($('agl'))AG0.lim=$('agl').value;$('sh').innerHTML=`<div class="bar"></div><h3>${esc(AG0.k)}</h3><label>طريقة العرض</label><div><button class="tag ${AG0.g?'on':''}" onclick="AG0.g=${AG0.g?0:1};agKR()">مجموعات حسب الفئة</button><button class="tag ${AG0.w?'on':''}" onclick="AG0.w=${AG0.w?0:1};agKR()">القدرة (واط)</button></div><label>حد «قارب النفاد» للمجموع (فارغ = الحد العام)</label><input id="agl" type="tel" value="${esc(AG0.lim)}"><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="if($('agl'))AG0.lim=$('agl').value;finish(AG0)">حفظ</button></div>`};
window.agKE=j=>{if(!can('tags'))return toast('للمدير فقط');const k=S.tags.kind[j],c=gkc(k);window.AG0=AG0={k,g:c.g?1:0,w:c.w?1:0,lim:c.lim??''};agKR();sheetOpen(v=>{if(!v)return;upd(()=>{S.cfg.gkc=S.cfg.gkc||{};const l=String(v.lim).trim();S.cfg.gkc[v.k]={g:v.g,w:v.w,...(l===''?{}:{lim:Math.max(0,+l||0)})}})})};
VW.st_ag=()=>({t:'مجموعات الإكسسوارات',h:'<p class="m">الكابلات والشواحن تُجمَّع حسب الفئة (والموصل والقدرة)، والحكم على المجموع.</p>'+S.tags.kind.map((k,j)=>{const c=gkc(k);return row(k,'agKE('+j+')',c.g?'مجموعات'+(c.w?' · قدرة':'')+' · حد '+(c.lim??(S.cfg.agl??10)):'عادي')}).join('')+row('القدرات (واط)',"go('st_tg',{g:'pw'})",S.tags.pw.length)});
if(typeof CATS!='undefined'&&CATS.ac)CATS.ac[1].push(['مجموعات الكابلات والشواحن',"go('st_ag')"]);
const _st99=VW.st;VW.st=function(){const o=_st99();o.h+=row('مجموعات الكابلات والشواحن',"go('st_ag')");return o};
})();
/* ============================================================
   رموز الموظفين: لكل موظف رمز يحدده المدير (اختياري) عبر لوحة الأرقام
   ============================================================ */
(()=>{
const F2=[{k:'p',l:'الرمز بالأرقام',t:'password'}];
uAdd=needAdm(function(){ask('مستخدم جديد',[{k:'n',l:'الاسم'},{k:'r',l:'الدور',t:'sel',o:['موظف','مدير'],v:'موظف'},{k:'p',l:'رمز الموظف بالأرقام (اختياري)',t:'password'}]).then(v=>{if(v&&v.n.trim())upd(()=>{const u={name:v.n.trim(),admin:v.r=='مدير'};if(v.p&&!u.admin)u.pin=hs(v.p);S.users.push(u)})})});
uEd=needAdm(function(i){const u=S.users[i],F=[{k:'r',l:'الدور',t:'sel',o:['موظف','مدير'],v:u.admin?'مدير':'موظف'},{k:'p',l:'رمز جديد للموظف (فارغ = بلا تغيير)'+(u.pin?' — له رمز حالياً':''),t:'password'}];
if(u.pin)F.push({k:'d',l:'حذف رمز الموظف؟',t:'sel',o:['لا','نعم'],v:'لا'});F.push({k:'x',l:'حذف المستخدم؟',t:'sel',o:['لا','نعم'],v:'لا'});
ask(u.name,F).then(v=>{if(!v)return;if((v.x=='نعم'||v.r=='موظف')&&u.admin&&S.users.filter(x=>x.admin).length<2)return toast('يجب أن يبقى مدير واحد على الأقل');
upd(()=>{if(v.x=='نعم')S.users.splice(i,1);else{u.admin=v.r=='مدير';if(u.admin)delete u.pin;else if(v.p)u.pin=hs(v.p);else if(v.d=='نعم')delete u.pin}})})});
who=function(){ask('من أنت؟',[{k:'u',l:'المستخدم',t:'sel',o:S.users.map(u=>u.name),v:S.me}],'اختيار').then(v=>{if(!v)return;const u=S.users.find(x=>x.name==v.u);
if(!u.admin){const go2=()=>{admSet(false);upd(()=>{S.me=u.name})};if(!u.pin||u.name==S.me||isAdmin())return go2();return ask('رمز '+u.name,F2,'دخول').then(p=>{if(!p)return;hs(p.p)==u.pin?go2():toast('الرمز خاطئ')})}
if(u.name==S.me&&admOk())return;ask('رمز المدير',F2,'دخول').then(p=>{if(p)hs(p.p)==S.pin?(admSet(true),upd(()=>{S.me=u.name})):toast('الرمز خاطئ')})})};
lgEmp=function(i){const u=S.users.filter(x=>!x.admin)[i],L=$('lg'),done=()=>{upd(()=>{S.me=u.name});$('lg').remove()};if(!u.pin)return done();
L.style.zIndex=10;ask('رمز '+u.name,F2,'دخول').then(p=>{if($('lg'))$('lg').style.zIndex=55;if(!p)return;hs(p.p)==u.pin?done():toast('الرمز خاطئ')})};
})();
