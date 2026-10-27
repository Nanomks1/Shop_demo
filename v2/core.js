const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const IC={home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',tool:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',sl:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',back:'<path d="M5 12h14M12 5l7 7-7 7"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const TG={brand:'الماركات',color:'الألوان',cap:'السعات',ram:'RAM',gender:'الجنس',kind:'نوع الإكسسوار',conn:'الموصل',tier:'الفئات السعرية',glass:'أنواع الزجاج'};
const PL={del:'الحذف',price:'تعديل الأسعار',tags:'إدارة الوسوم',fields:'إدارة الحقول'};
const DEF={me:'',users:[],pin:'',perm:{del:'a',price:'a',tags:'a',fields:'a'},cfg:{fs:17,th:'a'},tags:{brand:['Samsung','Xiaomi','Redmi','Realme','Oppo','Vivo','Tecno','Infinix','iPhone','Itel'],color:['أسود','أبيض','أزرق','أحمر','أخضر','ذهبي','فضي','وردي'],cap:['32GB','64GB','128GB','256GB','512GB'],ram:['2GB','3GB','4GB','6GB','8GB','12GB'],gender:['رجالي','نسائي'],kind:['كابل','شاحن','رأس شاحن','USB','كارت ميموري','سماعة','باور بانك'],conn:['micro','type-c','lightning'],tier:['10','15','20','25','30','40','50'],glass:['عادي','Super Full Glue','Privacy']},items:[],rp:[],trash:[],req:[]};
function load(){let o={};try{o=JSON.parse(localStorage.getItem('shop3')||'{}')}catch(e){}const d=JSON.parse(JSON.stringify(DEF));return{...d,...o,tags:{...d.tags,...o.tags},perm:{...d.perm,...o.perm},cfg:{...d.cfg,...o.cfg}}}
let S=load(),V={v:'home'},Q='',QP=0,SH=false,SHR=null,ARM=0,TT,AB_T=0,AB_FH=null;
const save=()=>{try{if(window._svHook)window._svHook();localStorage.setItem('shop3',JSON.stringify(S));window._syDirty=1;window._nzVer=(window._nzVer||0)+1;schedAutoBk()}catch(e){toast('الذاكرة ممتلئة')}};
/* ===== تجزئة الرموز السرية: الجديدة قوية (SHA-256 مملّحة ومكرّرة)، والقديمة تُقبل ثم تُحدَّث تلقائياً عند أول دخول ناجح ===== */
const hsL=s=>{let h=5381;for(const c of String(s))h=(h*33^c.charCodeAt(0))>>>0;return h.toString(36)};
const SHK=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256(m){const l=m.length,n=((l+9+63)>>6)<<6,b=new Uint8Array(n);b.set(m);b[l]=128;const dv=new DataView(b.buffer);dv.setUint32(n-8,Math.floor(l*8/4294967296));dv.setUint32(n-4,(l*8)>>>0);
let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const w=new Uint32Array(64);
for(let o=0;o<n;o+=64){for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(((x>>>7)|(x<<25))^((x>>>18)|(x<<14))^(x>>>3))+w[i-7]+(((y>>>17)|(y<<15))^((y>>>19)|(y<<13))^(y>>>10)))|0}
let [a,bb,cc,d,e,f,g,h]=H;
for(let i=0;i<64;i++){const t1=(h+(((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))+((e&f)^(~e&g))+SHK[i]+w[i])|0,t2=((((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))+((a&bb)^(a&cc)^(bb&cc)))|0;h=g;g=f;f=e;e=(d+t1)|0;d=cc;cc=bb;bb=a;a=(t1+t2)|0}
H=[H[0]+a,H[1]+bb,H[2]+cc,H[3]+d,H[4]+e,H[5]+f,H[6]+g,H[7]+h].map(v=>v|0)}
const r=new Uint8Array(32),rv=new DataView(r.buffer);H.forEach((v,i)=>rv.setUint32(i*4,v>>>0));return r}
let _hc=null,_hr='';
const hs=s=>{s=String(s??'');if(s===_hc)return _hr;const E=new TextEncoder(),salt=E.encode('aziz-shop-pin-v2|');let m=sha256(E.encode('aziz-shop-pin-v2|'+s));
for(let i=0;i<3000;i++){const x=new Uint8Array(m.length+salt.length);x.set(m);x.set(salt,m.length);m=sha256(x)}
_hc=s;_hr='h2:'+Array.from(m,v=>v.toString(16).padStart(2,'0')).join('');return _hr};
/* hv: يتحقق من الرمز (جديد أو قديم) وإن كان قديماً يحدّثه إلى الجديد في كل مكان خُزّن فيه */
const hv=(p,st)=>{if(!st)return false;p=String(p??'');if(st===hs(p))return true;
if(st===hsL(p)){const n=hs(p);let ch=0;if(S.pin===st){S.pin=n;ch=1}if(S.cfg&&S.cfg.lk===st){S.cfg.lk=n;ch=1}(S.users||[]).forEach(u=>{if(u.pin===st){u.pin=n;ch=1}});if(ch)save();return true}return false};
const isAdmin=()=>!!(S.users.find(u=>u.name==S.me)||{}).admin;
const can=k=>S.perm[k]=='e'||isAdmin();
const fd=t=>{const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`};
function toast(msg,undo){const t=$('ts');t.innerHTML=`<span>${esc(msg)}</span>`+(undo?'<button id="tu">تراجع</button>':'');t.hidden=false;if(undo)$('tu').onclick=()=>{undo();save();render();t.hidden=true};clearTimeout(TT);TT=setTimeout(()=>t.hidden=true,6000)}
function go(v,p){V={v,...p};Q='';QP=0;history.pushState({V},'');render()}
function sq(q){if(q&&!QP){QP=1;history.pushState({V,q:1},'')}Q=q;const r=$('res');if(r)r.innerHTML=q?`<p class="m">نتائج البحث عن «${esc(q)}» تظهر بعد بناء الأقسام.</p>`:''}
addEventListener('popstate',e=>{const s=e.state||{};if(SH){hideSheet();return}
if(s.root){if(Date.now()-ARM<2500){history.back();return}ARM=Date.now();toast('اضغط رجوع مرة أخرى للخروج');history.pushState({V:{v:'home'}},'');return}
V=s.V||{v:'home'};Q='';QP=0;render()});
history.replaceState({root:1},'');history.pushState({V},'');
function sheetOpen(res){SH=true;SHR={res,val:null};$('ov').hidden=false;history.pushState({V,sh:1},'')}
function hideSheet(){$('ov').hidden=true;SH=false;const r=SHR;SHR=null;r&&r.res(r.val)}
const finish=v=>{if(SHR)SHR.val=v;history.back()};
$('ov').onclick=e=>{if(e.target.id=='ov')finish(null)};

/* ===== لوحة الأرقام التفاعلية مع التبديل السلس إلى لوحة الحروف والأرقام ===== */
function pinPadHtml(id,ph='أدخل الرمز',onEnter=''){
  return `<div class="pin-wrap" id="${id}_wrap"><input id="${id}" type="hidden" value="" autocomplete="off" ${onEnter?`onkeydown="if(event.key==='Enter')${onEnter}"`:''}><div id="${id}_pad"><div id="${id}_dots" class="pin-dots" data-ph="${esc(ph)}"><span class="pin-ph">${esc(ph)}</span></div><div class="pin-grid">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" class="pkb" onclick="pkTap('${id}','${n}')">${n}</button>`).join('')}<button type="button" class="pkb fn" onclick="pkTap('${id}','C')">مسح</button><button type="button" class="pkb" onclick="pkTap('${id}','0')">0</button><button type="button" class="pkb fn" onclick="pkTap('${id}','B')">⌫</button></div></div><button type="button" id="${id}_sw" class="pin-sw" onclick="pkMode('${id}')">⌨️ الرمز فيه حروف؟ اضغط هنا للكتابة</button></div>`;
}
function pkTap(id,k){
  const el=$(id);if(!el)return;
  if(k=='C')el.value='';
  else if(k=='B')el.value=el.value.slice(0,-1);
  else if(el.value.length<24)el.value+=k;
  const d=$(id+'_dots');
  if(d){
    const ph=d.getAttribute('data-ph')||'أدخل الرمز';
    d.innerHTML=el.value.length?Array(el.value.length).fill('<span class="pin-dot"></span>').join(''):`<span class="pin-ph">${esc(ph)}</span>`;
  }
}
function pkMode(id){
  const el=$(id),pad=$(id+'_pad'),sw=$(id+'_sw'),d=$(id+'_dots');
  if(!el||!pad||!sw)return;
  const ph=(d&&d.getAttribute('data-ph'))||'أدخل الرمز';
  if(el.type==='hidden'){
    pad.hidden=true;
    el.type='password';
    el.placeholder=ph+' (حروف وأرقام)';
    el.style.marginBottom='8px';
    sw.textContent='🔢 العودة للوحة الأرقام السريعة';
    setTimeout(()=>el.focus(),50);
  }else{
    el.type='hidden';
    pad.hidden=false;
    sw.textContent='⌨️ الرمز فيه حروف؟ اضغط هنا للكتابة';
    pkTap(id,'');
  }
}

function ask(title,F,ok='حفظ',danger){return new Promise(res=>{
$('sh').innerHTML=`<div class="bar"></div><h3>${esc(title)}</h3>`+F.map(f=>`<label>${esc(f.l)}`+(f.t=='area'?`<textarea id="f_${f.k}">${esc(f.v)}</textarea>`:f.t=='sel'?`<select id="f_${f.k}">${f.o.map(o=>`<option ${o==f.v?'selected':''}>${esc(o)}</option>`).join('')}</select>`:f.t=='password'?pinPadHtml('f_'+f.k,f.ph||'أدخل الرمز','document.getElementById(\'so\').click()'):`<input id="f_${f.k}" type="${f.t||'text'}" value="${esc(f.v)}">`)+'</label>').join('')+`<div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn ${danger?'d':''}" id="so">${esc(ok)}</button></div>`;
sheetOpen(res);$('so').onclick=()=>{const o={};F.forEach(f=>o[f.k]=$('f_'+f.k).value);finish(o)};const i=$('sh').querySelector('input:not([type=hidden])');if(i&&!i.value)setTimeout(()=>i.focus(),150)})}
function sure(msg,ok='نعم',danger=true){return new Promise(res=>{$('sh').innerHTML=`<div class="bar"></div><h3>${esc(msg)}</h3><div class="acts"><button class="btn s" onclick="finish(null)">إلغاء</button><button class="btn ${danger?'d':''}" onclick="finish(1)">${esc(ok)}</button></div>`;sheetOpen(res)}).then(v=>!!v)}
function upd(fn){fn();save();render()}
const snap=()=>JSON.stringify({items:S.items,req:S.req,tags:S.tags,gg:S.gg||[],guide:S.guide||[],ag:S.ag||[],rp:S.rp.map(r=>({...r,img:r.img?1:0}))});
function commit(label,fn){const b=snap(),im=Object.fromEntries(S.rp.map(r=>[r.id,r.img]));fn();save();render();toast(label,()=>{const o=JSON.parse(b);S.items=o.items;S.req=o.req;S.tags=o.tags;S.gg=o.gg;S.guide=o.guide;S.ag=o.ag;S.rp=o.rp.map(r=>({...r,img:im[r.id]||''}))})}
function del(coll,id,label){if(!can('del'))return toast('الحذف للمدير فقط');sure('حذف «'+label+'» ؟').then(y=>{if(!y)return;const i=S[coll].findIndex(x=>x.id==id);if(i<0)return;const o=S[coll].splice(i,1)[0],t={id:uid(),coll,obj:o,label,t:Date.now()};S.trash.push(t);save();render();toast('تم الحذف',()=>restore(t.id))})}
function restore(id){const t=S.trash.find(x=>x.id==id);if(!t)return;S.trash=S.trash.filter(x=>x!=t);S[t.coll]=S[t.coll]||[];S[t.coll].push(t.obj);save();render()}
const row=(l,fn,sub)=>`<button class="card row2" onclick="${fn}"><b>${esc(l)}</b><span class="m">${esc(sub||'')}</span></button>`;
const NV=[['home','home','الرئيسية'],['rp','tool','الصيانة'],['rep','list','التقرير'],['st','sl','المزيد']];
const soon=t=>({t,h:'<div class="card"><b>يُبنى في المرحلة القادمة</b><p class="m">هذا القسم لم يُنقل إلى النسخة الجديدة بعد، والنسخة القديمة ما زالت تعمل.</p></div>'});
const VW={
home:()=>({t:'محل عزيز',h:`<input placeholder="ابحث..." value="${esc(Q)}" oninput="sq(this.value)"><div id="res"></div><h3>الأقسام</h3><div class="grid">${[['phones','الهواتف'],['glass','الأنتي كاس'],['case','البوشيط'],['acc','الإكسسوارات']].map(([k,n])=>`<button class="card" onclick="go('sec',{k:'${k}'})">${n}</button>`).join('')}</div>`,a:()=>sq(Q)}),
sec:()=>soon('قسم'),rp:()=>soon('الصيانة'),rep:()=>soon('التقرير'),
st:()=>({t:'المزيد',h:row('المستخدمون والصلاحيات',"go('st_users')")+row('الوسوم','go(\'st_tags\')')+row('المظهر',"go('st_look')")+row('النسخ الاحتياطي',"go('st_bk')")+row('المحذوفات',"go('st_trash')",S.trash.length||'')}),
st_users:()=>{const a=isAdmin();return{t:'المستخدمون',h:S.users.map((u,i)=>`<div class="card row2"><b>${esc(u.name)}</b><span class="m">${u.admin?'مدير':'موظف'}</span>${a?`<button class="btn s sm" onclick="uEd(${i})">تعديل</button>`:''}</div>`).join('')+(a?`<button class="btn" onclick="uAdd()">+ مستخدم</button><button class="btn s" onclick="pinCh()">تغيير رمز المدير</button><h3>الصلاحيات</h3>`+Object.keys(PL).map(k=>`<div class="card row2"><b>${PL[k]}</b><button class="btn s sm" onclick="pTog('${k}')">${S.perm[k]=='a'?'المدير فقط':'الجميع'}</button></div>`).join(''):'<p class="m">التعديل للمدير فقط.</p>')}},
st_tags:()=>({t:'الوسوم',h:Object.keys(TG).map(g=>row(TG[g],`go('st_tg',{g:'${g}'})`,S.tags[g].length)).join('')}),
st_tg:()=>{const g=V.g;return{t:TG[g],h:(can('tags')?'':'<p class="m">التعديل للمدير فقط.</p>')+`<div>${S.tags[g].map((t,i)=>`<span class="tag">${esc(t)}${can('tags')?`<b onclick="tgDel('${g}',${i})">×</b>`:''}</span>`).join('')}</div>`+(can('tags')?`<button class="btn" onclick="tgAdd('${g}')">+ إضافة</button>`:'')}},
st_look:()=>({t:'المظهر',h:`<h3>حجم الخط</h3>${[[15,'صغير'],[17,'عادي'],[19,'كبير'],[21,'أكبر']].map(([v,l])=>`<button class="tag ${S.cfg.fs==v?'on':''}" onclick="upd(()=>S.cfg.fs=${v})">${l}</button>`).join('')}<h3>المظهر</h3>${[['a','تلقائي'],['l','نهاري'],['d','ليلي']].map(([v,l])=>`<button class="tag ${S.cfg.th==v?'on':''}" onclick="upd(()=>S.cfg.th='${v}')">${l}</button>`).join('')}`}),
st_bk:()=>({t:'النسخ الاحتياطي',h:'<p class="m">يتم تشفير بيانات الزبائن الحساسة (الصيانة، الطلبات، الحجوزات) داخل ملف النسخة الاحتياطية لحمايتها من التسريب.</p><button class="btn" onclick="BKP()">حفظ ملف النسخة في الهاتف (محمي)</button>'+(window.showSaveFilePicker?`<button class="btn s" onclick="linkAutoFile()">${AB_FH?'✅ مرتبط بملف تلقائي (اضغط لتغييره)':'ربط ملف حفظ تلقائي مباشر بالهاتف'}</button>`:'')+'<button class="btn s" onclick="restAutoIdb()">استرجاع النسخة التلقائية الداخلية</button><label>استعادة من ملف خارجي<input type="file" accept=".json" onchange="RST(this.files[0])"></label>'}),
st_trash:()=>({t:'المحذوفات (30 يوماً)',h:S.trash.map(t=>`<div class="card row2"><div style="flex:1"><b>${esc(t.label)}</b><div class="m"><bdi>${fd(t.t)}</bdi></div></div><button class="btn s sm" onclick="restore('${t.id}')">استرجاع</button></div>`).join('')||'<p class="m">لا شيء</p>'})};
function render(){const r=(VW[V.v]||VW.home)();$('ti').textContent=r.t;$('bk').hidden=V.v=='home';$('me').textContent=S.me;$('m').innerHTML=r.h;
$('nv').innerHTML=NV.map(([k,i,l])=>`<button class="${V.v.startsWith(k)?'on':''}" onclick="go('${k}')">${ic(i)}<span>${l}</span></button>`).join('');
document.documentElement.dataset.th=S.cfg.th;document.documentElement.style.setProperty('--fs',S.cfg.fs+'px');r.a&&r.a()}
const adm=()=>S.users.filter(u=>u.admin).length;
function uAdd(){ask('مستخدم جديد',[{k:'n',l:'الاسم'},{k:'r',l:'الدور',t:'sel',o:['موظف','مدير'],v:'موظف'}]).then(v=>{if(v&&v.n.trim())upd(()=>S.users.push({name:v.n.trim(),admin:v.r=='مدير'}))})}
function uEd(i){const u=S.users[i];ask(u.name,[{k:'r',l:'الدور',t:'sel',o:['موظف','مدير'],v:u.admin?'مدير':'موظف'},{k:'x',l:'حذف المستخدم؟',t:'sel',o:['لا','نعم'],v:'لا'}]).then(v=>{if(!v)return;if((v.x=='نعم'||v.r=='موظف')&&u.admin&&adm()<2)return toast('يجب أن يبقى مدير واحد على الأقل');upd(()=>{if(v.x=='نعم')S.users.splice(i,1);else u.admin=v.r=='مدير'})})}
function pTog(k){upd(()=>S.perm[k]=S.perm[k]=='a'?'e':'a')}
function pinCh(){ask('رمز المدير الجديد',[{k:'p',l:'الرمز الجديد',t:'password'}]).then(v=>{if(v&&v.p)upd(()=>S.pin=hs(v.p))})}
function who(){ask('من أنت؟',[{k:'u',l:'المستخدم',t:'sel',o:S.users.map(u=>u.name),v:S.me}],'اختيار').then(v=>{if(!v)return;const u=S.users.find(x=>x.name==v.u);if(!u.admin||u.name==S.me)return sw(u.name);ask('رمز المدير',[{k:'p',l:'الرمز',t:'password'}],'دخول').then(p=>{if(p)hv(p.p,S.pin)?sw(u.name):toast('الرمز خاطئ')})})}
const sw=n=>upd(()=>S.me=n);
function tgAdd(g){ask('وسم جديد: '+TG[g],[{k:'t',l:'الاسم'}]).then(v=>{const t=v&&v.t.trim();if(t&&!S.tags[g].includes(t))upd(()=>S.tags[g].push(t))})}
function tgDel(g,i){sure('حذف الوسم «'+S.tags[g][i]+'» ؟').then(y=>{if(!y)return;const o=[...S.tags[g]];upd(()=>S.tags[g].splice(i,1));toast('تم الحذف',()=>{S.tags[g]=o})})}

/* ===== تشفير وفك تشفير بيانات الزبائن الحساسة في النسخ الاحتياطي + الحفظ التلقائي ===== */
async function bkKey(pin){
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:new TextEncoder().encode('aziz-bk-v1'),iterations:150000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function bkEncObj(obj,pin){
  const key=await bkKey(pin),iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(obj))));
  const out=new Uint8Array(12+ct.length);out.set(iv);out.set(ct,12);
  let s='';for(let i=0;i<out.length;i+=8192)s+=String.fromCharCode.apply(null,out.subarray(i,i+8192));
  return btoa(s);
}
async function bkDecObj(b64,pin){
  const key=await bkKey(pin),u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:u.subarray(0,12)},key,u.subarray(12));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function makeSafeBackupJson(pinOrHash){
  const copy=JSON.parse(JSON.stringify(S));
  const resMap={};
  (copy.items||[]).forEach(i=>{if(i.res){resMap[i.id]=i.res;delete i.res}});
  const custData={rp:copy.rp||[],req:copy.req||[],res:resMap,trash:(copy.trash||[]).filter(t=>t.coll=='rp')};
  copy._encCust=await bkEncObj(custData,pinOrHash);
  copy.rp=[];copy.req=[];copy.trash=(copy.trash||[]).filter(t=>t.coll!='rp');
  delete copy.pin;if(copy.cfg)delete copy.cfg.lk;
  (copy.users||[]).forEach(u=>delete u.pin);
  return JSON.stringify(copy);
}

/* حفظ تلقائي في قاعدة بيانات الهاتف المعزولة (IndexedDB) + ملف الهاتف المباشر */
function idbOp(mode,fn){
  return new Promise((res,rej)=>{
    const req=indexedDB.open('AzizShopAutoBackup',1);
    req.onupgradeneeded=e=>e.target.result.createObjectStore('bk');
    req.onsuccess=e=>{const tx=e.target.result.transaction('bk',mode);fn(tx.objectStore('bk'),res,rej)};
    req.onerror=rej;
  });
}
function schedAutoBk(){
  clearTimeout(AB_T);
  AB_T=setTimeout(async()=>{
    try{
      const snapData={at:Date.now(),data:JSON.parse(JSON.stringify(S))};
      await idbOp('readwrite',(st,res)=>{st.put(snapData,'latest');res()});
      if(AB_FH&&S.pin){
        const js=await makeSafeBackupJson(S.pin);
        const w=await AB_FH.createWritable();
        await w.write(js);await w.close();
      }
    }catch(e){}
  },5000);
}
async function linkAutoFile(){
  if(!isAdmin())return toast('للمدير فقط');
  if(!window.showSaveFilePicker)return toast('متصفحك يعتمد الحفظ التلقائي الداخلي');
  try{
    AB_FH=await window.showSaveFilePicker({suggestedName:'aziz-shop-auto-backup.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
    schedAutoBk();render();toast('تم ربط ملف الحفظ التلقائي بنجاح');
  }catch(e){}
}
function restAutoIdb(){
  if(!isAdmin())return toast('للمدير فقط');
  idbOp('readonly',(st,res)=>{const r=st.get('latest');r.onsuccess=()=>res(r.result)}).then(rec=>{
    if(!rec||!rec.data)return toast('لا توجد نسخة تلقائية محفوظة بعد');
    sure('استعادة النسخة التلقائية المحفوظة بتاريخ '+fd(rec.at)+' ؟','استعادة').then(y=>{
      if(y){S={...load(),...rec.data};save();location.reload()}
    });
  }).catch(()=>toast('تعذر قراءة النسخة التلقائية'));
}

function BKP(){
  if(!isAdmin())return toast('النسخ الاحتياطي للمدير فقط');
  ask('تأكيد رمز المدير لتشفير بيانات الزبائن',[{k:'p',l:'رمز المدير (سيُستخدم لتشفير بيانات الزبائن في النسخة)',t:'password'}],'حفظ النسخة').then(async v=>{
    if(!v||!v.p)return;
    if(!hv(v.p,S.pin))return toast('رمز المدير خاطئ');
    try{
      const js=await makeSafeBackupJson(v.p);
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([js],{type:'application/json'}));
      a.download='aziz-shop-backup-'+new Date().toISOString().slice(0,10)+'.json';
      a.click();
      S.cfg.lb=Date.now();save();render();
    }catch(e){toast('تعذر إنشاء النسخة')}
  });
}

function RST(f){
  if(!f)return;
  if(!isAdmin())return toast('الاستعادة للمدير فقط');
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d.users)throw 0;
      sure('استبدال كل البيانات الحالية بالنسخة؟','استعادة').then(y=>{
        if(!y)return;
        if(d._encCust){
          ask('فك تشفير بيانات الزبائن',[{k:'p',l:'أدخل رمز المدير الذي حُفظت به النسخة',t:'password'}],'فك التشفير والاستعادة').then(async v=>{
            if(!v||!v.p)return;
            try{
              let cust;
              try{cust=await bkDecObj(d._encCust,v.p)}catch(e1){try{cust=await bkDecObj(d._encCust,hs(v.p))}catch(e2){cust=await bkDecObj(d._encCust,hsL(v.p))}}
              delete d._encCust;
              d.rp=cust.rp||[];d.req=cust.req||[];
              (d.items||[]).forEach(i=>{if(cust.res&&cust.res[i.id])i.res=cust.res[i.id]});
              d.trash=[...(d.trash||[]),...(cust.trash||[])];
              d.pin=d.pin||S.pin;
              if(S.cfg&&S.cfg.lk)d.cfg={...(d.cfg||{}),lk:S.cfg.lk};
              S={...load(),...d};save();location.reload();
            }catch(e){toast('الرمز خاطئ، تعذر فك تشفير بيانات الزبائن')}
          });
        }else{
          S={...load(),...d};save();location.reload();
        }
      });
    }catch(e){toast('ملف غير صالح')}
  };
  r.readAsText(f);
}

function setup(){ask('مرحباً في محل عزيز! إعداد المدير',[{k:'n',l:'اسمك'},{k:'p',l:'رمز المدير (لحماية الصلاحيات)',t:'password'}],'ابدأ').then(v=>{if(!v||!v.n.trim()||!v.p)return setup();S.users=[{name:v.n.trim(),admin:true}];S.me=v.n.trim();S.pin=hs(v.p);save();render()})}
$('bk').innerHTML=ic('back');
S.trash=S.trash.filter(t=>Date.now()-t.t<2592e6);
try{navigator.storage.persist()}catch(e){}
render();if(!S.users.length)setup();
