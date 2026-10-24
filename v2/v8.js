/* ===== الخانات المخصصة ===== */
S.fields=S.fields||[];
const SECN={phones:'الهواتف',acc:'الإكسسوارات',case:'البوشيط',rp:'الصيانة'};
let FX={},FXSEC='',FXA='',FE={};
const fxList=(sec,key)=>(S.fields||[]).filter(f=>f.sec==sec&&(!f.kinds||!f.kinds.length||f.kinds.includes(key)));
const fxKey=()=>FXSEC=='acc'?CS.kind:FXSEC=='phones'?PF.brand:'';
const fxVal=(i,f)=>[].concat((i.x||{})[f.id]||[]).filter(Boolean);
const fxTxt=i=>(S.fields||[]).map(f=>fxVal(i,f).length?f.name+' '+fxVal(i,f).join(' '):'').join(' ');
const fxShow=i=>{const p=(S.fields||[]).map(f=>fxVal(i,f).length?f.name+': '+fxVal(i,f).join('، '):'').filter(Boolean);return p.length?`<div class="m">🏷 ${esc(p.join(' · '))}</div>`:''};
const fxIns=(h,t)=>!t?h:h.includes('<div class="sub">')?h.replace('<div class="sub">',()=>t+'<div class="sub">'):h.replace(/<\/div>\s*$/,()=>t+'</div>');
function fxR(){const b=$('fx');if(!b)return;b.innerHTML=fxList(FXSEC,fxKey()).map(f=>{const v=[].concat(FX[f.id]||[]);return `<label>${esc(f.name)}</label><div>${f.opts.map((o,j)=>`<button type="button" class="tag ${v.includes(o)?'on':''}" onclick="fxT('${f.id}',${j})">${esc(o)}</button>`).join('')}${FXA==f.id?`<span class="row2"><input id="fxn" placeholder="خيار جديد"><button type="button" class="btn sm" onclick="fxN('${f.id}')">إضافة</button></span>`:`<button type="button" class="tag" onclick="FXA='${f.id}';fxR()">+ جديد</button>`}</div>`}).join('')}
function fxT(id,j){const f=S.fields.find(x=>x.id==id),o=f.opts[j],a=[].concat(FX[id]||[]);FX[id]=f.multi?(a.includes(o)?a.filter(x=>x!=o):[...a,o]):(a[0]==o?'':o);fxR()}
function fxN(id){const f=S.fields.find(x=>x.id==id),v=($('fxn').value||'').trim();FXA='';if(v&&!f.opts.includes(v)){f.opts.push(v);save()}if(v){const a=[].concat(FX[id]||[]);FX[id]=f.multi?[...a,v]:v}fxR()}
function fxOpen(sec,rec){const a=$('sh').querySelector('.acts');if(!a||!(S.fields||[]).some(f=>f.sec==sec))return;FXSEC=sec;FX={...(rec.x||{})};FXA='';a.insertAdjacentHTML('beforebegin','<div id="fx"></div>');fxR()}
function fxEd(id){const i=find(id);$('sh').innerHTML='<div class="bar"></div><h3>خانات: '+esc(i.name||'')+'</h3><div id="fx"></div><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="finish({})">حفظ</button></div>';sheetOpen(v=>{if(v)upd(()=>{i.x={...FX}})});FXSEC='case';FX={...(i.x||{})};FXA='';fxR()}
const _so8=sheetOpen;sheetOpen=function(r){FXSEC='';_so8(r)};
const fxAtt=v=>{if(FXSEC&&v&&typeof v=='object')v.x={...FX};return v};
const _pd8=phDone;phDone=function(v){_pd8(fxAtt(v))};
const _ad8=acDone;acDone=function(v){_ad8(fxAtt(v))};
const _rd8=rDone;rDone=function(v){_rd8(fxAtt(v))};
const _ch8=ch;ch=function(){_ch8();if(FXSEC=='acc'&&$('fx'))fxR()};
if(typeof pc=='function'){const _pc8=pc;pc=function(){_pc8.apply(this,arguments);if(FXSEC=='phones'&&$('fx'))fxR()}}
const _pf8=phForm;phForm=function(rec){_pf8(rec);fxOpen('phones',rec)};
const _af8=acForm;acForm=function(rec){_af8(rec);fxOpen('acc',rec)};
const _rf8=rForm;rForm=function(rec){_rf8(rec);fxOpen('rp',rec)};
const _c8=card;card=function(i){let h=_c8(i);if(i.sec=='case'&&(S.fields||[]).some(f=>f.sec=='case'))h=h.replace('<div class="sub">',()=>`<div class="sub"><button class="btn s sm" onclick="fxEd('${i.id}')">خانات</button>`);return fxIns(h,fxShow(i))};
const _rc8=rc;rc=function(r){return fxIns(_rc8(r),fxShow(r))};
srch=function(q){const n=nz(q),o=[];
if(!SC||SC=='glass')GM().filter(g=>g.models.some(m=>nz(((g.br||{})[m]||'')+m).includes(n))).forEach(g=>o.push(glB(g)));
S.items.filter(i=>i.sec!='glass'&&(!SC||i.sec==SC)&&nz(hay(i)+' '+fxTxt(i)).includes(n)).slice(0,30).forEach(i=>o.push(card(i)));
return o.join('')||'<p class="m">لا نتائج</p>'};
rpList=function(){const q=nz(V.q||''),tab=V.tab||'in',all=V.all&&q;const a=S.rp.filter(r=>(all||r.st==tab)&&inR(tOf(r))&&(!q||nz(r.name+r.tel+r.dev+r.fault+r.note+' '+fxTxt(r)).includes(q))).sort((x,y)=>tOf(y)-tOf(x));return a.map(rc).join('')||'<p class="m">لا شيء</p>'};
/* إدارة الخانات */
VW.st_fx=()=>({t:'الخانات المخصصة',h:'<p class="m">خانة إضافية بخيارات تظهر في نموذج القسم وعلى البطاقة وتدخل في البحث.</p>'+(can('tags')?'<button class="btn" onclick="feEd(null)">+ إضافة خانة</button>':'')+Object.keys(SECN).filter(s=>!V.fs||V.fs==s).map(s=>`<h3>${SECN[s]}</h3>`+((S.fields||[]).filter(f=>f.sec==s).map(f=>`<button class="card row2" onclick="feEd('${f.id}')"><b style="flex:1">${esc(f.name)}</b><span class="m">${f.kinds&&f.kinds.length?esc(f.kinds.join('، ')):'الكل'} · ${f.multi?'عدة قيم':'قيمة'} · ${f.opts.length}</span></button>`).join('')||'<p class="m">لا شيء</p>')).join('')});
function feR(){if($('fen')){FE.name=$('fen').value;FE.opts=$('feo').value}
const kl=FE.sec=='phones'?S.tags.brand:FE.sec=='acc'?S.tags.kind:null;
$('sh').innerHTML=`<div class="bar"></div><h3>${FE.id?'تعديل خانة':'خانة جديدة'}</h3><label>اسم الخانة (مثال: الموصل)<input id="fen" value="${esc(FE.name)}"></label><label>القسم</label><div>${Object.keys(SECN).map(s=>`<button class="tag ${FE.sec==s?'on':''}" onclick="FE.sec='${s}';FE.kinds=[];feR()">${SECN[s]}</button>`).join('')}</div>`+(kl?`<label>تظهر لـ ${FE.sec=='phones'?'ماركات':'أنواع'} محددة (بدون اختيار = الكل)</label><div>${kl.map((k,j)=>`<button class="tag ${FE.kinds.includes(k)?'on':''}" onclick="feK(${j})">${esc(k)}</button>`).join('')}</div>`:'')+`<label>طريقة الاختيار</label><div><button class="tag ${FE.multi?'':'on'}" onclick="FE.multi=false;feR()">قيمة واحدة</button><button class="tag ${FE.multi?'on':''}" onclick="FE.multi=true;feR()">عدة قيم</button></div><label>الخيارات (واحد في كل سطر)<textarea id="feo">${esc(FE.opts)}</textarea></label><div class="acts">${FE.id?'<button class="btn d" onclick="finish({del:1})">حذف</button>':''}<button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn" onclick="feOk()">حفظ</button></div>`}
function feK(j){const k=(FE.sec=='phones'?S.tags.brand:S.tags.kind)[j];FE.kinds=FE.kinds.includes(k)?FE.kinds.filter(x=>x!=k):[...FE.kinds,k];feR()}
function feOk(){FE.name=$('fen').value.trim();FE.opts=$('feo').value;if(!FE.name)return toast('اكتب اسم الخانة');finish({ok:1})}
function feEd(id){if(!can('tags'))return toast('للمدير فقط');const f=id?S.fields.find(x=>x.id==id):null;FE=f?{id:f.id,name:f.name,sec:f.sec,kinds:[...(f.kinds||[])],multi:!!f.multi,opts:f.opts.join('\n')}:{id:'',name:'',sec:V.fs||'acc',kinds:[],multi:false,opts:''};feR();
sheetOpen(v=>{if(!v)return;upd(()=>{S.fields=S.fields||[];if(v.del){S.fields=S.fields.filter(x=>x.id!=FE.id);return}const o={name:FE.name,sec:FE.sec,kinds:FE.kinds,multi:FE.multi,opts:FE.opts.split('\n').map(s=>s.trim()).filter(Boolean)};if(FE.id)Object.assign(S.fields.find(x=>x.id==FE.id),o);else S.fields.push({id:uid(),...o})})})}
/* ===== ترتيب الإعدادات في أقسام ===== */
const tg=(l,g)=>[l,"go('st_tg',{g:'"+g+"'})",()=>S.tags[g].length];
const CATS={ph:['الهواتف',[tg('الماركات','brand'),tg('الألوان','color'),tg('السعات','cap'),tg('RAM','ram'),['حدود النفاد',"go('st_lim')"],['ألوان وحدود الماركات',"go('st_br')"]],'phones'],
gl:['الأنتي كاس',[tg('أنواع الزجاج','glass'),['المستويات والحدود',"go('st_lim')"]],null],
cs:['البوشيط',[tg('الجنس','gender'),tg('الألوان','color')],'case'],
ac:['الإكسسوارات',[tg('الأنواع','kind'),tg('الموصلات','conn'),tg('الفئات السعرية','tier'),['إعداد كل نوع (الموصل والفئة والحد)',"go('st_ak')"]],'acc'],
rp:['الصيانة',[tg('أعطال الصيانة','fault'),['دليل أسعار الإصلاح',"go('gd')"]],'rp']};
VW.st_c=()=>{const c=CATS[V.c]||CATS.ph;return{t:c[0],h:c[1].map(([l,fn,n])=>row(l,fn,n?n():'')).join('')+(c[2]?row('خانات مخصصة لهذا القسم',"go('st_fx',{fs:'"+c[2]+"'})",(S.fields||[]).filter(f=>f.sec==c[2]).length||''):'')}};
VW.st=()=>({t:'المزيد',h:Object.keys(CATS).map(k=>row(CATS[k][0],"go('st_c',{c:'"+k+"'})")).join('')+'<h3>عام</h3>'+row('الخانات المخصصة',"go('st_fx')",(S.fields||[]).length||'')+row('تلوين البطاقات',"go('st_col')")+row('الحقول في النماذج',"go('st_fld')")+row('المستخدمون والصلاحيات',"go('st_users')")+row('المظهر',"go('st_look')")+row('رمز القفل السريع','lkSet()',S.cfg.lk?'مُعيَّن':'غير مُعيَّن')+row('النسخ الاحتياطي والاستعادة',"go('st_bk')")+row('المحذوفات',"go('st_trash')",S.trash.length||'')+row('كل الوسوم (قائمة كاملة)',"go('st_tags')")});
render();
