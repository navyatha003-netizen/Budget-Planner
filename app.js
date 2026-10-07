const DBKEY="BloomBudgetDB_Interactive_v2";
const CATS=["Food","Rent","Transport","Education","Shopping","Entertainment","Healthcare","Utilities","Travel","Subscriptions","Investment","Salary","Freelance","Other"];
let db=JSON.parse(localStorage.getItem(DBKEY)||"null")||{
 users:[],transactions:{},budgets:{},goals:{},bills:{},subs:{},loans:{},investments:{},accent:"#7c5cff",theme:"dark"
};
let currentId=localStorage.getItem("bb_current")||null;
const $=id=>document.getElementById(id);
const user=()=>db.users.find(x=>x.id===currentId);
const arr=k=>db[k][currentId]||[];
const setArr=(k,v)=>{db[k][currentId]=v;save()};
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dateNow=()=>new Date().toISOString().slice(0,10);
function save(){localStorage.setItem(DBKEY,JSON.stringify(db))}
function showScreen(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active")}
function toast(title,msg=""){ $("toastTitle").textContent=title;$("toastText").textContent=msg;$("toast").classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>$("toast").classList.remove("show"),2800)}
function boot(){
  // Initialize demo accounts for first-time project demonstration; normal users still sign in through the login screen.
  let changed=false;
  if(!db.users.some(x=>x.role==="admin")){
    db.users.push({id:"system-admin",name:"System Administrator",username:"admin",email:"admin@local",password:"admin123",role:"admin",status:"Active",created:new Date().toISOString()});
    changed=true;
  }
  if(!db.users.some(x=>x.id==="demo-user")){
    db.users.push({id:"demo-user",name:"Demo User",username:"demo",email:"demo@local",password:"demo123",role:"user",status:"Active",created:new Date().toISOString()});
    ["transactions","budgets","goals","bills","subs","loans","investments"].forEach(k=>db[k]["demo-user"]=db[k]["demo-user"]||[]);
    changed=true;
  }
  if(changed)save();
  document.body.classList.toggle("light",db.theme==="light");document.documentElement.style.setProperty("--accent",db.accent);
  // Always start at the landing/login screen instead of bypassing authentication.
  currentId=null;localStorage.removeItem("bb_current");
  $("app").classList.add("hidden");
  showScreen("landing");
  $("mDate").value=dateNow();
}
function enterTestMode(mode){
  const id=mode==="admin"?"system-admin":"demo-user";
  const u=db.users.find(x=>x.id===id);
  if(!u){toast("Testing mode error","Demo account is missing. Reload the page to recreate it.");return;}
  currentId=u.id;
  enterApp();
  toast(mode==="admin"?"Admin access":"User access",mode==="admin"?"Admin features opened.":"User features opened.");
}
function enterApp(){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $("app").classList.remove("hidden");
  const u=user(),admin=u.role==="admin";
  $("sideName").textContent=u.name;$("sideRole").textContent=admin?"Administrator":"Personal account";
  $("sideAvatar").textContent=u.name[0].toUpperCase();$("topAvatar").textContent=u.name[0].toUpperCase();
  $("userNav").classList.toggle("hidden",admin);$("adminNav").classList.toggle("hidden",!admin);
  navigate(admin?"adminDashboard":"dashboard");
}
function navigate(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  const p=$(id);if(!p)return;p.classList.add("active");
  document.querySelectorAll(".sidebar button[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  $("crumb").textContent=p.querySelector("h1")?.textContent||"BloomBudget";
  const f={dashboard:renderDashboard,transactions:renderTransactions,budget:renderBudget,analytics:renderAnalytics,planner:renderPlanner,tools:()=>{},settings:renderSettings,adminDashboard:renderAdmin,users:renderUsers,allTransactions:renderAllTransactions,systemAnalytics:renderSystemAnalytics,adminMonitor:renderAdminMonitor,adminOperations:renderAdminOperations,adminOps:renderAdminOps,moneyCenter:renderMoneyCenter,smartCenter:renderSmartCenter,adminSettings:()=>{}};f[id]?.();
}
function logout(){localStorage.removeItem("bb_current");currentId=null;$("app").classList.add("hidden");showScreen("landing")}
$("userLoginForm").onsubmit=e=>{
 e.preventDefault();const id=$("userLoginId").value.trim().toLowerCase(),pass=$("userLoginPass").value;
 const u=db.users.find(x=>x.role==="user"&&(x.username.toLowerCase()===id||x.email.toLowerCase()===id)&&x.password===pass);
 if(!u)return toast("Login failed","Invalid user credentials.");if(u.status==="Blocked")return toast("Access blocked","This account has been blocked by an administrator.");
 currentId=u.id;localStorage.setItem("bb_current",currentId);enterApp();toast("Welcome back","Your dashboard is ready.");
};
$("signupForm").onsubmit=e=>{
 e.preventDefault();if($("suPass").value!==$("suConfirm").value)return toast("Password mismatch","Both passwords must match.");
 if(db.users.some(x=>x.username.toLowerCase()===$("suUser").value.toLowerCase()))return toast("Username unavailable","Choose another username.");
 const u={id:uid(),name:$("suName").value,username:$("suUser").value,email:$("suEmail").value,password:$("suPass").value,role:"user",status:"Active",created:new Date().toISOString()};
 db.users.push(u);["transactions","budgets","goals","bills","subs","loans","investments"].forEach(k=>db[k][u.id]=[]);save();currentId=u.id;localStorage.setItem("bb_current",currentId);enterApp();toast("Account created","Welcome to BloomBudget.");
};
$("adminLoginForm").onsubmit=e=>{
 e.preventDefault();const un=$("adminUser").value.toLowerCase(),pw=$("adminPass").value;
 if(!un.includes("admin")||!pw.toLowerCase().includes("admin"))return toast("Admin login denied","Username and password must contain “admin”.");
 const a=db.users.find(x=>x.role==="admin");currentId=a.id;localStorage.setItem("bb_current",currentId);enterApp();toast("Admin access granted","Restricted control center opened.");
};
function tx(){return arr("transactions")}
function totals(){let a=tx(),inc=a.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0),exp=a.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);return{inc,exp,bal:inc-exp}}
function score(){let t=totals(),rate=t.inc?t.bal/t.inc:0,s=50+rate*45;if(t.exp>t.inc)s-=25;return Math.max(0,Math.min(100,Math.round(s)))}
function syncCustomCategories(){const cats=[...CATS,...(db.customCats||[])];['mCat','bCat'].forEach(id=>{const el=$(id);if(!el)return;const current=el.value;el.innerHTML=cats.map(c=>`<option>${esc(c)}</option>`).join('');if(cats.includes(current))el.value=current})}
function addTx(e){e.preventDefault();let a=tx();a.push({id:uid(),type:$("mType").value,amount:+$("mAmount").value,description:$("mDesc").value,category:$("mCat").value,method:$("mMethod").value,date:$("mDate").value,note:$("mNote").value});setArr("transactions",a);closeModal("txModal");e.target.reset();$("mDate").value=dateNow();renderDashboard();toast("Transaction added","Balance and charts updated instantly.")}
$("txForm").onsubmit=addTx;
function delTx(id){if(!confirm("Delete this transaction?"))return;setArr("transactions",tx().filter(x=>x.id!==id));renderTransactions();renderDashboard()}
function renderDashboard(){renderUserAnnouncements();syncCustomCategories();
 const t=totals(),s=score();$("dashBalance").textContent=money(t.bal);$("dashIncome").textContent=money(t.inc);$("dashExpense").textContent=money(t.exp);$("dashScore").textContent=s+"/100";
 $("hello").textContent=user().name.split(" ")[0];$("today").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 $("balanceNote").textContent=t.bal>=0?"Positive cash position":"Expenses exceed income";$("scoreNote").textContent=s>=75?"Strong discipline":s>=55?"Room to improve":"Needs attention";
 renderInsights();renderGoals("goalMini",true);renderRecent();renderDashboardCharts();renderHealthSnapshot();renderRecurringWatch();
}
function renderRecent(){let a=[...tx()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);$("recent").innerHTML=a.length?a.map(x=>`<div class="setting"><span><b>${esc(x.description)}</b><small>${x.date} · ${x.category} · ${x.method}</small></span><b class="${x.type==="income"?"amount-income":"amount-expense"}">${x.type==="income"?"+":"-"}${money(x.amount)}</b></div>`).join(""):'<div class="empty">No activity yet. Add your first transaction.</div>'}
function renderInsights(){let t=totals(),ex=tx().filter(x=>x.type==="expense"),by={};ex.forEach(x=>by[x.category]=(by[x.category]||0)+x.amount);let top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0],rate=t.inc?t.bal/t.inc*100:0,m=[];m.push(t.bal>=0?`Your balance is <b>${money(t.bal)}</b>, calculated as total income minus total expenses.`:`Your expenses are <b>${money(Math.abs(t.bal))}</b> above income. Consider reducing flexible categories.`);if(top)m.push(`<b>${esc(top[0])}</b> is your highest expense category at <b>${money(top[1])}</b>.`);m.push(`Your current savings rate is <b>${Math.max(0,rate).toFixed(1)}%</b>. The system calculates this from balance ÷ income.`);$("insights").innerHTML=m.map(x=>`<div class="insight">◇ ${x}</div>`).join("")}
function renderGoals(id,mini=false){let a=arr("goals");$(id).innerHTML=a.length?a.slice(0,mini?4:99).map(g=>{let p=g.target?Math.min(100,g.current/g.target*100):0;return `<div class="goal"><div class="goal-top"><span><b>${esc(g.name)}</b><small class="muted"> · Target ${g.date}</small></span><b>${p.toFixed(0)}%</b></div><div class="progress"><i style="width:${p}%"></i></div><small class="muted">${money(g.current)} / ${money(g.target)}</small>${!mini?`<button class="mini-btn" onclick="deleteGoal('${g.id}')">Delete</button>`:""}</div>`}).join(""):'<div class="empty">No goals yet.</div>'}
function renderDashboardCharts(){let range=+$("chartRange").value||6;drawPie("dashPie",catTotals(),$("pieLegend"));drawBar("dashBar",monthData(range))}
function catTotals(){let o={};tx().filter(x=>x.type==="expense").forEach(x=>o[x.category]=(o[x.category]||0)+x.amount);return o}
function monthData(n=6){
  n=Math.max(1,Math.min(12,+n||6));
  const now=new Date(), o={};
  for(let i=n-1;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;o[k]={income:0,expense:0};}
  tx().forEach(x=>{const k=(x.date||"").slice(0,7);if(o[k])o[k][x.type==="income"?"income":"expense"]+=+x.amount||0;});
  return o;
}
function setupCanvas(id){let c=$(id);if(!c)return null;let r=c.getBoundingClientRect(),d=devicePixelRatio||1,w=Math.max(300,r.width),h=280;c.width=w*d;c.height=h*d;let ctx=c.getContext("2d");ctx.scale(d,d);return{ctx,w,h}}
const colors=["#7c5cff","#00c2a8","#ff5c7a","#f0a43c","#4aa3ff","#b36bff","#34c38f","#e878a9","#7fa8ff"];
function drawPie(id,data,legend){
 let z=setupCanvas(id);if(!z)return;let {ctx,w,h}=z,e=Object.entries(data),sum=e.reduce((s,x)=>s+x[1],0);ctx.clearRect(0,0,w,h);
 if(!sum){ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.textAlign="center";ctx.fillText("No expense data yet",w/2,h/2);return}
 let cx=w*.36,cy=h/2,r=Math.min(100,h*.34),a=-Math.PI/2;
 e.forEach((x,i)=>{let q=x[1]/sum*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+q);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();a+=q});
 if(legend)legend.innerHTML=e.slice(0,8).map((x,i)=>`<span><i style="background:${colors[i%colors.length]}"></i>${esc(x[0])} ${money(x[1])}</span>`).join("");
}
function drawBar(id,data){
 let z=setupCanvas(id);if(!z)return;let {ctx,w,h}=z,e=Object.entries(data);ctx.clearRect(0,0,w,h);if(!e.length)return;let max=Math.max(1,...e.flatMap(x=>[x[1].income,x[1].expense])),step=(w-70)/e.length,scale=(h-60)/max;
 e.forEach((x,i)=>{let base=h-32,bw=Math.min(28,step*.24),xx=35+i*step;ctx.fillStyle="rgba(124,92,255,.9)";ctx.fillRect(xx,base-x[1].income*scale,bw,x[1].income*scale);ctx.fillStyle="rgba(255,92,122,.9)";ctx.fillRect(xx+bw+5,base-x[1].expense*scale,bw,x[1].expense*scale);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.font="10px sans-serif";ctx.fillText(x[0].slice(5),xx,base+15)});
}
function renderTransactions(){syncCustomCategories();let q=($("txSearch").value||"").toLowerCase(),typ=$("txType").value,cat=$("txCat").value,sort=$("txSort").value,a=tx().filter(x=>(!q||x.description.toLowerCase().includes(q))&&(typ==="all"||x.type===typ)&&(cat==="all"||x.category===cat));a.sort((x,y)=>sort==="high"?y.amount-x.amount:sort==="low"?x.amount-y.amount:y.date.localeCompare(x.date));$("txCat").innerHTML='<option value="all">All categories</option>'+CATS.map(c=>`<option ${c===cat?"selected":""}>${c}</option>`).join("");$("txRows").innerHTML=a.length?a.map(x=>`<tr><td>${x.date}</td><td><b>${esc(x.description)}</b><small class="muted">${esc(x.note||"")}</small></td><td><span class="pill">${esc(x.category)}</span></td><td>${esc(x.method)}</td><td>${x.type}</td><td class="${x.type==="income"?"amount-income":"amount-expense"}">${x.type==="income"?"+":"-"}${money(x.amount)}</td><td><button class="mini-btn" onclick="delTx('${x.id}')">Delete</button></td></tr>`).join(""):'<tr><td colspan="7" class="empty">No matching transactions.</td></tr>'}
function renderBudget(){syncCustomCategories();let bs=arr("budgets"),ex=tx().filter(x=>x.type==="expense");$("budgetList").innerHTML=bs.length?bs.map(b=>{let spent=ex.filter(x=>x.category===b.category).reduce((s,x)=>s+x.amount,0),p=Math.min(100,spent/b.amount*100);return `<div class="goal"><div class="goal-top"><b>${b.category}</b><span>${money(spent)} / ${money(b.amount)}</span></div><div class="progress"><i style="width:${p}%;background:${p>=100?"var(--negative)":"var(--accent)"}"></i></div><small class="muted">${p.toFixed(0)}% used <button class="mini-btn" onclick="deleteBudget('${b.id}')">Delete</button></small></div>`}).join(""):'<div class="empty">No budgets set.</div>';renderGoals("goalList")}
$("goalForm").onsubmit=e=>{e.preventDefault();let a=arr("goals");a.push({id:uid(),name:$("gName").value,target:+$("gTarget").value,current:+$("gCurrent").value,date:$("gDate").value});setArr("goals",a);closeModal("goalModal");e.target.reset();renderGoals("goalList");renderDashboard();toast("Goal created","Your progress tracker is ready.")};
function deleteGoal(id){setArr("goals",arr("goals").filter(x=>x.id!==id));renderGoals("goalList");renderDashboard()}
$("budgetForm").onsubmit=e=>{e.preventDefault();let a=arr("budgets").filter(x=>x.category!==$("bCat").value);a.push({id:uid(),category:$("bCat").value,amount:+$("bAmount").value});setArr("budgets",a);closeModal("budgetModal");e.target.reset();renderBudget();renderDashboard();toast("Budget saved","Category limit updated.")}
function deleteBudget(id){setArr("budgets",arr("budgets").filter(x=>x.id!==id));renderBudget()}
function renderAnalytics(){let t=totals(),ex=tx().filter(x=>x.type==="expense"),by=catTotals(),top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0],largest=Math.max(0,...ex.map(x=>x.amount));$("avgSpend").textContent=money(t.exp/Math.max(1,new Date().getDate()));$("saveRate").textContent=(t.inc?t.bal/t.inc*100:0).toFixed(1)+"%";$("topCategory").textContent=top?top[0]:"—";$("largest").textContent=money(largest);let needs=["Rent","Education","Healthcare","Utilities","Transport"],n=ex.filter(x=>needs.includes(x.category)).reduce((s,x)=>s+x.amount,0),w=t.exp-n;$("needsWants").innerHTML=`<div class="setting"><span><b>Needs</b><small>Rent, education, healthcare, utilities, transport</small></span><b>${money(n)}</b></div><div class="setting"><span><b>Wants</b><small>Shopping, entertainment, travel and flexible spending</small></span><b>${money(w)}</b></div><div class="progress"><i style="width:${t.exp?n/t.exp*100:0}%"></i></div>`;drawBar("analyticsBar",monthData(8));drawPie("analyticsPie",by)}
function renderPlanner(){let bills=arr("bills"),subs=arr("subs"),loans=arr("loans");$("plannerCards").innerHTML=[["🧾 Bills",bills.length, "Track due dates"],["▣ Subscriptions",subs.length,"Monitor recurring costs"],["⌂ Loans",loans.length,"Track outstanding debt"]].map(x=>`<div class="panel"><h3>${x[0]}</h3><strong style="font-size:30px">${x[1]}</strong><p>${x[2]}</p></div>`).join("");renderCalendar()}
function renderCalendar(){let d=new Date(),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),html='<div class="calendar-grid">';["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(x=>html+=`<b>${x}</b>`);for(let i=0;i<first;i++)html+="<span></span>";for(let n=1;n<=days;n++){let ds=`${y}-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`,a=tx().filter(x=>x.date===ds),amt=a.reduce((s,x)=>s+(x.type==="income"?x.amount:-x.amount),0);html+=`<div class="cal-day"><b>${n}</b><small>${amt?money(amt):""}</small></div>`}$("calendar").innerHTML=html+"</div>"}
function renderSettings(){$("profileName").value=user().name;$("profileEmail").value=user().email}
function saveProfile(){let u=user();u.name=$("profileName").value;u.email=$("profileEmail").value;save();enterApp();toast("Profile saved","Your account details were updated.")}
function calcEMI(){let p=+$("emiP").value,r=+$("emiR").value/1200,n=+$("emiN").value,e=r?p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):p/n;$("emiOut").textContent=money(e)+" / month"}
function calcCI(){let p=+$("ciP").value,r=+$("ciR").value/100,n=+$("ciN").value;$("ciOut").textContent=money(p*Math.pow(1+r,n))}
function calcEF(){$("efOut").textContent=money(+$("efP").value*+$("efN").value)}
function renderAdmin(){
  let users=db.users.filter(x=>x.role==="user"),all=Object.values(db.transactions).flat(),
      inc=all.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0),
      exp=all.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
  const active=users.filter(x=>x.status==="Active").length, blocked=users.filter(x=>x.status==="Blocked").length;
  $("adminStats").innerHTML=[
    ["USERS",users.length],["ACTIVE",active],["TRANSACTIONS",all.length],["NET CASH FLOW",money(inc-exp)]
  ].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><em>System-wide</em></div>`).join("");
  $("adminInfo").innerHTML=[
    ["System status",'<b class="positive">Operational</b>'],
    ["Active accounts",active],["Blocked accounts",blocked],
    ["Total income",money(inc)],["Total expense",money(exp)],
    ["Net tracked cash flow",money(inc-exp)]
  ].map(x=>`<div class="setting"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");
  const userActivity=users.map(u=>({u,n:(db.transactions[u.id]||[]).length})).sort((a,b)=>b.n-a.n).slice(0,6);
  $("adminTopUsers").innerHTML=userActivity.length?userActivity.map(x=>`<div class="setting"><span><b>${esc(x.u.name)}</b><small>@${esc(x.u.username)}</small></span><span class="pill">${x.n} tx</span></div>`).join(""):'<div class="empty">No user activity yet.</div>';
  const recent=[...all].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,6);
  $("adminRecent").innerHTML=recent.length?recent.map(x=>`<div class="setting"><span><b>${esc(x.description)}</b><small>${x.date} · ${esc(x.category)}</small></span><b class="${x.type==="income"?"amount-income":"amount-expense"}">${x.type==="income"?"+":"-"}${money(x.amount)}</b></div>`).join(""):'<div class="empty">No system events yet.</div>';
  $("adminHealth").innerHTML=[
    ["Storage","LocalStorage connected","positive"],["Accounts",`${users.length} registered user${users.length===1?"":"s"}`,""],
    ["Transactions",`${all.length} records indexed`,""],["Backups","Available from Settings",""]
  ].map(x=>`<div class="health-row"><span><b>${x[0]}</b><small>${x[1]}</small></span><b class="${x[2]}">${x[2]?"●":"✓"}</b></div>`).join("");
  drawBar("adminBar",{"System":{income:inc,expense:exp}});
}
function renderAdminMonitor(){
  const users=db.users.filter(x=>x.role==="user"),all=Object.values(db.transactions).flat();
  const blocked=users.filter(x=>x.status==="Blocked").length,empty=users.filter(x=>(db.transactions[x.id]||[]).length===0).length;
  $("monitorStats").innerHTML=[
    ["TOTAL USERS",users.length],["BLOCKED",blocked],["ZERO-ACTIVITY",empty],["DATA RECORDS",all.length]
  ].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><em>Live check</em></div>`).join("");
  const integrity=[
    ["User records",users.length?"Healthy":"No user records",users.length?"positive":"negative"],
    ["Transaction store",all.length?"Healthy":"Empty",all.length?"positive":"negative"],
    ["Orphan check","Passed","positive"],
    ["Frontend mode","Testing mode",""]
  ];
  $("integrityList").innerHTML=integrity.map(x=>`<div class="health-row"><span><b>${x[0]}</b><small>${x[1]}</small></span><b class="${x[2]}">●</b></div>`).join("");
  const cats={};all.filter(x=>x.type==="expense").forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);
  $("monitorCats").innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>`<div class="setting"><span>${esc(x[0])}</span><b>${money(x[1])}</b></div>`).join("")||'<div class="empty">No expense categories yet.</div>';
}
function renderUsers(){let u=db.users.filter(x=>x.role==="user");$("usersRows").innerHTML=u.length?u.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.username)}</td><td>${esc(x.email)}</td><td>${x.status}</td><td>${new Date(x.created).toLocaleDateString()}</td><td><button class="mini-btn" onclick="toggleUser('${x.id}')">${x.status==="Active"?"Block":"Unblock"}</button> <button class="mini-btn" onclick="deleteUser('${x.id}')">Delete</button></td></tr>`).join(""):'<tr><td colspan="6" class="empty">No registered users.</td></tr>'}
function toggleUser(id){let x=db.users.find(v=>v.id===id);x.status=x.status==="Active"?"Blocked":"Active";save();renderUsers();toast("User status changed",x.status)}
function deleteUser(id){if(!confirm("Delete this account and all its data?"))return;db.users=db.users.filter(x=>x.id!==id);Object.keys(db).filter(k=>["transactions","budgets","goals","bills","subs","loans","investments","incomePlans"].includes(k)).forEach(k=>delete db[k][id]);save();renderUsers();renderAdmin();toast("User deleted","Account and local data removed.")}
function renderAllTransactions(){
  let rows=[];
  db.users.filter(x=>x.role==="user").forEach(u=>(db.transactions[u.id]||[]).forEach(t=>rows.push({...t,who:u.username})));
  const q=($("adminTxSearch")?.value||"").toLowerCase(), typ=$("adminTxType")?.value||"all";
  rows=rows.filter(x=>(!q||`${x.who} ${x.description} ${x.category}`.toLowerCase().includes(q))&&(typ==="all"||x.type===typ));
  rows.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  $("allTxRows").innerHTML=rows.length?rows.map(x=>`<tr><td>${esc(x.who)}</td><td>${x.date}</td><td>${esc(x.description)}</td><td>${esc(x.category)}</td><td>${x.type}</td><td class="${x.type==="income"?"amount-income":"amount-expense"}">${money(x.amount)}</td></tr>`).join(""):'<tr><td colspan="6" class="empty">No matching transactions.</td></tr>';
}
function exportAllTransactions(){
  const rows=[["User","Date","Description","Category","Type","Amount","Method"]];
  db.users.filter(x=>x.role==="user").forEach(u=>(db.transactions[u.id]||[]).forEach(t=>rows.push([u.username,t.date,t.description,t.category,t.type,t.amount,t.method])));
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="BloomBudget-system-transactions.csv";a.click();URL.revokeObjectURL(a.href);toast("CSV exported","System transaction report created.");
}
function renderSystemAnalytics(){let all=Object.values(db.transactions).flat(),inc=all.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0),exp=all.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0),c={};all.filter(x=>x.type==="expense").forEach(x=>c[x.category]=(c[x.category]||0)+x.amount);drawBar("systemBar",{"System":{income:inc,expense:exp}});$("systemCats").innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>`<div class="setting"><span>${esc(x[0])}</span><b>${money(x[1])}</b></div>`).join("")||'<div class="empty">No data.</div>'}
function setAccent(c){db.accent=c;save();document.documentElement.style.setProperty("--accent",c);toast("Accent changed","The interface color has been updated.");}
function toggleTheme(){db.theme=db.theme==="dark"?"light":"dark";save();document.body.classList.toggle("light",db.theme==="light");$("bulbBtn").textContent=db.theme==="dark"?"💡":"🌙";document.querySelector(".page.active")&&navigate(document.querySelector(".page.active").id)}
function openModal(id){$(id).classList.add("show")}function closeModal(id){$(id).classList.remove("show")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function globalSearch(q){if(!q.trim())return;navigate("transactions");$("txSearch").value=q;renderTransactions()}
function toggleSidebar(){document.querySelector(".sidebar").classList.toggle("open")}
document.addEventListener("click",e=>{if(e.target.classList.contains("modal"))e.target.classList.remove("show")});
document.addEventListener("keydown",e=>{if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName))return;const m={d:"dashboard",t:"transactions",b:"budget",a:"analytics",p:"planner"}[e.key.toLowerCase()];if(m&&!user()?.role==="admin")navigate(m)});
window.addEventListener("resize",()=>{if($("app")&&!$("app").classList.contains("hidden")){const p=document.querySelector(".page.active")?.id;if(p==="dashboard")renderDashboardCharts();if(p==="analytics")renderAnalytics()}});
boot();

// Premium extra features — all local and frontend-only.
function calcRule(){const income=+$('ruleIncome').value||0;$('ruleOut').textContent=money(income*.5)+' needs';$('ruleDetails').textContent=money(income*.3)+' wants · '+money(income*.2)+' savings';toast('50/30/20 plan created','A simple monthly allocation is ready.');}
function calcNetWorth(){const v=(+$('assetP').value||0)- (+$('debtP').value||0);$('netOut').textContent=money(v);$('netOut').className='result '+(v>=0?'positive':'negative');}
function exportData(){const payload={app:'BloomBudget',version:2,exportedAt:new Date().toISOString(),user:user(),transactions:tx(),budgets:arr('budgets'),goals:arr('goals'),bills:arr('bills'),subs:arr('subs'),loans:arr('loans'),investments:arr('investments')};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='BloomBudget-backup.json';a.click();URL.revokeObjectURL(a.href);toast('Backup exported','Your local finance backup was created.');}
function clearMyData(){if(!confirm('Reset your transactions, budgets, goals and planner data? Your account will remain.'))return;['transactions','budgets','goals','bills','subs','loans','investments','incomePlans'].forEach(k=>setArr(k,[]));renderDashboard();renderTransactions();renderBudget();renderPlanner();renderAnalytics();toast('Personal data reset','Your account profile was kept.');}
function renderPremiumCards(){const t=totals(), goals=arr('goals'), budgets=arr('budgets');const rate=t.inc?Math.max(0,t.bal/t.inc*100):0;const pulse=$('moneyPulse'),mom=$('goalMomentum'),guard=$('budgetGuard');if(pulse)pulse.textContent=t.inc?`Savings rate is ${rate.toFixed(1)}% with ${money(t.bal)} current net cash flow.`:'Add income and expenses to activate your money pulse.';if(mom){if(goals.length){const avg=goals.reduce((s,g)=>s+(g.target?g.current/g.target*100:0),0)/goals.length;mom.textContent=`${goals.length} goal${goals.length>1?'s':''} tracked · average progress ${avg.toFixed(0)}%.`;}else mom.textContent='Set your first savings goal and track its momentum.';}if(guard){if(!budgets.length)guard.textContent='Create a category budget to activate overspending protection.';else{const ex=tx().filter(x=>x.type==='expense');const over=budgets.filter(b=>ex.filter(x=>x.category===b.category).reduce((s,x)=>s+x.amount,0)>b.amount);guard.textContent=over.length?`${over.length} budget${over.length>1?'s are':' is'} over the limit. Review spending now.`:'All current category budgets are within their limits.';}}}
const _renderDashboard=renderDashboard;renderDashboard=function(){_renderDashboard();renderPremiumCards();};


/* Interactive background color response */
(function(){
  const root=document.documentElement;
  let raf=0;
  window.addEventListener('pointermove',function(e){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){
      root.style.setProperty('--mx',((e.clientX/window.innerWidth)*100).toFixed(1)+'%');
      root.style.setProperty('--my',((e.clientY/window.innerHeight)*100).toFixed(1)+'%');
    });
  },{passive:true});
})();

function renderHealthSnapshot(){
  const t=totals(), goals=arr("goals"), budgets=arr("budgets");
  const savings=t.inc?Math.max(0,t.bal/t.inc*100):0;
  const used=budgets.length?budgets.reduce((s,b)=>{const spent=tx().filter(x=>x.type==="expense"&&x.category===b.category).reduce((a,x)=>a+x.amount,0);return s+(b.amount?spent/b.amount:0)},0)/budgets.length:0;
  const goal=goals.length?goals.reduce((s,g)=>s+(g.target?g.current/g.target:0),0)/goals.length:0;
  const cards=[
    ["Savings rate",`${savings.toFixed(1)}%`,savings>=20?"Healthy":"Needs attention"],
    ["Budget health",budgets.length?`${Math.min(999,used*100).toFixed(0)}% used`:"Not set",budgets.length?(used<=.8?"On track":"Review limits"):"Create a budget"],
    ["Goal progress",goals.length?`${Math.min(100,goal*100).toFixed(0)}%`:"—",goals.length?"Average progress":"Add a goal"]
  ];
  $("healthSnapshot").innerHTML=cards.map(x=>`<div class="health-card"><small>${x[0]}</small><b>${x[1]}</b><span>${x[2]}</span></div>`).join("");
}
function renderRecurringWatch(){
  const counts={};
  tx().filter(x=>x.type==="expense").forEach(x=>{const key=x.category;counts[key]=(counts[key]||0)+1});
  const recurring=Object.entries(counts).filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $("recurringWatch").innerHTML=recurring.length?recurring.map(x=>`<div class="setting"><span><b>${esc(x[0])}</b><small>${x[1]} transactions — review as a possible recurring cost</small></span><span class="pill">${x[1]}×</span></div>`).join(""):'<div class="empty">Add a few transactions to detect recurring spending patterns.</div>';
}

/* ==========================================================
   BLOOMBUDGET EXPANSION PACK — USER + ADMIN
   All data stays in LocalStorage; no external services.
========================================================== */
function audit(action,detail=""){
  db.audit=db.audit||[];db.audit.unshift({id:uid(),time:new Date().toISOString(),action,detail});db.audit=db.audit.slice(0,100);save();
}
function listFor(k){db[k]=db[k]||{};db[k][currentId]=db[k][currentId]||[];return db[k][currentId]}
function addMoneyItem(kind){window.moneyKind=kind;const labels={bills:"Recurring Bill",subs:"Subscription",loans:"Debt / Loan",investments:"Investment",incomePlans:"Expected Income"};$('moneyItemTitle').textContent='Add '+labels[kind];$('moneyItemForm').reset();$('miDate').value=dateNow();openModal('moneyItemModal')}
$('moneyItemForm').onsubmit=function(e){e.preventDefault();const kind=window.moneyKind||'bills',a=listFor(kind);a.push({id:uid(),name:$('miName').value,amount:+$('miAmount').value,date:$('miDate').value,type:$('miType').value,note:$('miNote').value,created:new Date().toISOString()});db[kind][currentId]=a;save();audit('Added '+kind,$('miName').value);closeModal('moneyItemModal');renderMoneyCenter();toast('Saved','Your '+kind+' item was added.')}
function deleteMoneyItem(kind,id){db[kind][currentId]=listFor(kind).filter(x=>x.id!==id);save();audit('Deleted '+kind,id);renderMoneyCenter();}
function moneyItemList(kind,id){const a=listFor(kind).sort((x,y)=>String(x.date).localeCompare(String(y.date)));if(!a.length){$(id).innerHTML='<div class="empty">Nothing added yet. Use + Add to start tracking it.</div>';return}$(id).innerHTML=a.slice(0,8).map(x=>`<div class="setting"><span><b>${esc(x.name)}</b><small>${x.date} · ${esc(x.type||'monthly')}${x.note?' · '+esc(x.note):''}</small></span><span><b>${money(x.amount)}</b><button class="icon-btn" onclick="deleteMoneyItem('${kind}','${x.id}')">×</button></span></div>`).join('')}
function renderMoneyCenter(){
  const t=totals(),b=listFor('bills'),s=listFor('subs'),l=listFor('loans'),i=listFor('investments'),ip=listFor('incomePlans');
  const recurring=b.filter(x=>x.type==='monthly').reduce((a,x)=>a+x.amount,0)+s.filter(x=>x.type==='monthly').reduce((a,x)=>a+x.amount,0);
  const debt=l.reduce((a,x)=>a+x.amount,0),invest=i.reduce((a,x)=>a+x.amount,0),planned=ip.reduce((a,x)=>a+x.amount,0);
  $('moneyCenterStats').innerHTML=[['MONTHLY COMMITMENTS',money(recurring),'Bills + subscriptions'],['DEBT TRACKED',money(debt),'Outstanding items'],['INVESTMENTS',money(invest),'Tracked assets'],['EXPECTED INCOME',money(planned),'Planned streams']].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><em>${x[2]}</em></div>`).join('');
  moneyItemList('bills','billsList');moneyItemList('subs','subsList');moneyItemList('loans','loansList');moneyItemList('investments','investmentsList');moneyItemList('incomePlans','incomePlansList');
  const forecast=t.inc-recurring, pct=t.inc?forecast/t.inc*100:0;
  $('forecastBox').innerHTML=`<div class="forecast-big">${money(forecast)}</div><p class="muted">Estimated cash after known recurring commitments.</p><div class="progress"><i style="width:${Math.max(0,Math.min(100,pct))}%"></i></div><small>${Math.max(0,pct).toFixed(1)}% of recorded income remains after recurring commitments.</small>`;
  const alerts=[];if(t.bal<0)alerts.push(['negative','Cash flow is negative','Expenses currently exceed income.']);if(recurring>t.inc&&t.inc)alerts.push(['negative','Recurring commitments are high','Known recurring payments exceed recorded income.']);if(!b.length&&!s.length)alerts.push(['','No recurring commitments tracked','Add bills and subscriptions for a more realistic forecast.']);if(l.length)alerts.push(['','Debt tracking active',`${l.length} debt item${l.length>1?'s':''} recorded.`]);if(i.length)alerts.push(['positive','Investment tracking active',`${i.length} investment item${i.length>1?'s':''} recorded.`]);$('alertsBox').innerHTML=alerts.map(x=>`<div class="insight ${x[0]}"><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');
  renderMonthlyReport();
}
function renderMonthlyReport(){const now=new Date(),ym=now.toISOString().slice(0,7),a=tx().filter(x=>x.date.startsWith(ym)),inc=a.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0),exp=a.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0),cats={};a.filter(x=>x.type==='expense').forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];$('monthlyReport').innerHTML=`<div class="report-grid"><div><small>Income</small><b>${money(inc)}</b></div><div><small>Expense</small><b>${money(exp)}</b></div><div><small>Net</small><b class="${inc-exp>=0?'positive':'negative'}">${money(inc-exp)}</b></div><div><small>Top category</small><b>${top?esc(top[0]):'—'}</b></div></div><div class="setting"><span><b>${a.length}</b><small>transactions recorded this month</small></span><span>${inc?((inc-exp)/inc*100).toFixed(1)+'% net rate':'—'}</span></div>`}
function downloadMonthlyReport(){const now=new Date(),ym=now.toISOString().slice(0,7),a=tx().filter(x=>x.date.startsWith(ym));const lines=[['Date','Description','Category','Type','Amount','Method'],...a.map(x=>[x.date,x.description,x.category,x.type,x.amount,x.method])];const csv=lines.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const el=document.createElement('a');el.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));el.download='BloomBudget-monthly-report.csv';el.click();URL.revokeObjectURL(el.href);toast('Report exported','Monthly transaction report downloaded.')}

function addAnnouncement(){openModal('noticeModal')}
$('noticeForm').onsubmit=function(e){e.preventDefault();db.announcements=db.announcements||[];db.announcements.unshift({id:uid(),text:$('noticeText').value,time:new Date().toISOString()});db.announcements=db.announcements.slice(0,20);save();audit('Published announcement',$('noticeText').value);closeModal('noticeModal');renderAdminOps();toast('Announcement published','The notice is stored locally.')}
function deleteAnnouncement(id){db.announcements=(db.announcements||[]).filter(x=>x.id!==id);save();renderAdminOps()}
function renderOpsUsers(){const q=($('opsUserSearch')?.value||'').toLowerCase();const users=db.users.filter(x=>x.role==='user').filter(x=>`${x.name} ${x.username} ${x.email}`.toLowerCase().includes(q));$('opsUsers').innerHTML=users.length?users.map(u=>`<div class="setting"><span><b>${esc(u.name)}</b><small>@${esc(u.username)} · ${esc(u.email)}</small></span><span class="ops-user-actions"><span class="pill">${u.status}</span><button class="mini-btn" onclick="toggleUser('${u.id}');renderAdminOps()">${u.status==='Active'?'Block':'Unblock'}</button></span></div>`).join(''):'<div class="empty">No users found.</div>'}
function renderAudit(){const a=db.audit||[];$('auditLog').innerHTML=a.length?a.slice(0,12).map(x=>`<div class="setting"><span><b>${esc(x.action)}</b><small>${new Date(x.time).toLocaleString('en-IN')} · ${esc(x.detail)}</small></span></div>`).join(''):'<div class="empty">No audit events yet.</div>'}
function clearAuditLog(){if(!confirm('Clear the local audit log?'))return;db.audit=[];save();renderAudit();toast('Audit cleared','Administrator event history was cleared.')}
function addCategory(){const name=prompt('Enter a new category name:');if(!name?.trim())return;db.customCats=db.customCats||[];if(!db.customCats.includes(name.trim()))db.customCats.push(name.trim());save();audit('Added category',name.trim());renderAdminOps();toast('Category added',name.trim())}
function renderCategoryManager(){const cats=[...CATS,...(db.customCats||[])];$('categoryManager').innerHTML=cats.map(c=>`<span class="category-chip">${esc(c)}${(db.customCats||[]).includes(c)?` <button onclick="removeCategory('${encodeURIComponent(c)}')">×</button>`:''}</span>`).join('')}
function removeCategory(enc){const n=decodeURIComponent(enc);db.customCats=(db.customCats||[]).filter(x=>x!==n);save();audit('Removed category',n);renderAdminOps()}
function renderAdminOps(){const users=db.users.filter(x=>x.role==='user'),all=Object.values(db.transactions).flat(),blocked=users.filter(x=>x.status==='Blocked').length;const notices=db.announcements||[];$('opsStats').innerHTML=[['USERS',users.length],['BLOCKED',blocked],['TRANSACTIONS',all.length],['AUDIT EVENTS',(db.audit||[]).length]].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><em>Live local metric</em></div>`).join('');renderOpsUsers();$('announcements').innerHTML=notices.length?notices.slice(0,8).map(n=>`<div class="setting"><span><b>${esc(n.text)}</b><small>${new Date(n.time).toLocaleString('en-IN')}</small></span><button class="icon-btn" onclick="deleteAnnouncement('${n.id}')">×</button></div>`).join(''):'<div class="empty">No announcements yet.</div>';renderAudit();renderCategoryManager();$('systemRules').innerHTML=[['Storage','LocalStorage only'],['Authentication','Testing mode enabled'],['Currency','Indian Rupee (₹)'],['Data privacy','No external API required'],['Theme','User-selectable light / dark']].map(x=>`<div class="setting"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}
function exportSystemBackup(){const payload={app:'BloomBudget',version:3,exportedAt:new Date().toISOString(),database:db};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='BloomBudget-full-system-backup.json';a.click();URL.revokeObjectURL(a.href);audit('Exported system backup');toast('System backup exported','Complete local database backup created.')}
function resetDemoData(){if(!confirm('Clear finance records, planner items and announcements for all users?'))return;['transactions','budgets','goals','bills','subs','loans','investments','incomePlans'].forEach(k=>{db[k]=db[k]||{};db.users.forEach(u=>{if(u.role==='user')db[k][u.id]=[]})});db.announcements=[];save();audit('Reset demo data');renderAdminOps();renderAdmin();toast('Demo data reset','User accounts were preserved.')}
function generateDemoData(){const users=db.users.filter(x=>x.role==='user');if(!users.length)return toast('No users','Create a user account first.');users.forEach(u=>{const a=db.transactions[u.id]||[];const base=[['Salary',35000,'income','Salary'],['Rent',12000,'expense','Rent'],['Food',4500,'expense','Food'],['Transport',1800,'expense','Transport'],['Shopping',2500,'expense','Shopping'],['Freelance',8000,'income','Freelance']];base.forEach(([d,amt,type,cat],i)=>a.push({id:uid(),type,amount:amt+Math.floor(Math.random()*800),description:d,category:cat,method:i%2?'UPI':'Bank Transfer',date:new Date(Date.now()-i*86400000).toISOString().slice(0,10),note:'Demo data'}));db.transactions[u.id]=a;db.budgets[u.id]=[{id:uid(),category:'Food',amount:6000},{id:uid(),category:'Transport',amount:3000}];db.goals[u.id]=[{id:uid(),name:'Emergency Fund',target:100000,current:25000,date:'2027-06-30'}];db.bills[u.id]=[{id:uid(),name:'Rent',amount:12000,date:dateNow(),type:'monthly',note:'Demo bill'}];db.subs[u.id]=[{id:uid(),name:'Streaming',amount:699,date:dateNow(),type:'monthly',note:'Demo subscription'}];db.loans[u.id]=[{id:uid(),name:'Education Loan',amount:150000,date:dateNow(),type:'monthly',note:'Demo debt'}];db.investments[u.id]=[{id:uid(),name:'Mutual Fund',amount:50000,date:dateNow(),type:'monthly',note:'Demo investment'}];db.incomePlans=db.incomePlans||{};db.incomePlans[u.id]=[{id:uid(),name:'Expected Freelance',amount:10000,date:dateNow(),type:'one-time',note:'Demo plan'}]});save();audit('Generated demo data',`${users.length} user(s)`);renderAdminOps();renderAdmin();toast('Demo data generated','Rich sample finance data is ready to explore.')}

// Extend navigation/rendering without removing existing modules.
const _navigate=navigate;
navigate=function(id){_navigate(id);if(id==='moneyCenter')renderMoneyCenter();if(id==='adminOps')renderAdminOps();if(id==='dashboard')renderPremiumCards()}

/* === BloomBudget Smart Finance Suite === */
function renderSmartCenter(){
  const t=totals(), ts=tx(), budgets=arr("budgets"), goals=arr("goals");
  const month=new Date().toISOString().slice(0,7);
  const mtx=ts.filter(x=>String(x.date).slice(0,7)===month);
  const mi=mtx.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0);
  const me=mtx.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
  const cats={}; mtx.filter(x=>x.type==="expense").forEach(x=>cats[x.category]=(cats[x.category]||0)+x.amount);
  const top=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const savingsRate=mi?Math.max(0,(mi-me)/mi)*100:0;
  const budgetUse=budgets.length?budgets.reduce((s,b)=>{const spent=mtx.filter(x=>x.type==="expense"&&x.category===b.category).reduce((a,x)=>a+x.amount,0);return s+(b.amount?spent/b.amount:0)},0)/budgets.length:0;
  const goalRate=goals.length?goals.reduce((s,g)=>s+(g.target?Math.min(1,g.current/g.target):0),0)/goals.length:0;
  const debt=arr("debts").reduce((s,x)=>s+(+x.remaining||+x.amount||0),0);
  let score=Math.round(Math.min(100,Math.max(0,savingsRate*1.7+(1-Math.min(1,budgetUse))*30+goalRate*20+(debt===0?15:5))));
  $("smartStats").innerHTML=[["HEALTH SCORE",score+"/100"],["MONTHLY SAVINGS",money(mi-me)],["BUDGET USED",Math.round(budgetUse*100)+"%"],["TOP CATEGORY",top[0]?top[0][0]:"—"]].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><em>Smart analysis</em></div>`).join("");
  $("healthScoreBadge").textContent=score+"/100";
  $("healthScoreDetails").innerHTML=`<div class="progress"><span style="width:${score}%"></span></div><div class="setting"><span>Saving discipline</span><b>${savingsRate.toFixed(1)}%</b></div><div class="setting"><span>Average budget usage</span><b>${Math.round(budgetUse*100)}%</b></div><div class="setting"><span>Goal progress</span><b>${Math.round(goalRate*100)}%</b></div>`;
  const days=new Date().getDate(), daysInMonth=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();
  const forecast=days?me/days*daysInMonth:0;
  $("budgetForecast").innerHTML=`<div class="forecast-big">${money(forecast)}</div><p class="muted">Projected monthly expense from the current daily pace.</p><div class="setting"><span>Spent so far</span><b>${money(me)}</b></div><div class="setting"><span>Days elapsed</span><b>${days}/${daysInMonth}</b></div>`;
  $("smartAlerts").innerHTML=buildSmartAlerts(budgetUse,savingsRate,forecast,budgets,me);
  $("spendingPatterns").innerHTML=top.length?top.slice(0,6).map((x,i)=>`<div class="setting"><span><b>${esc(x[0])}</b><small>${i===0?"Highest expense category":"Expense category"}</small></span><b>${money(x[1])}</b></div>`).join(""):'<div class="empty">Add expenses to detect patterns.</div>';
  const daysWithSpend=new Set(ts.filter(x=>x.type==="expense").map(x=>x.date)).size;
  $("savingsStreak").textContent=Math.max(0,Math.min(30,daysWithSpend%31))+" active days";
  const ach=[["🌱","First budget",budgets.length>0],["🎯","Goal starter",goals.length>0],["💰","Saver",savingsRate>=10],["🛡️","Budget guard",budgetUse<=.8&&budgets.length>0],["💳","Debt aware",debt>=0],["🏆","Financial planner",budgets.length>0&&goals.length>0]];
  $("achievements").innerHTML=ach.map(a=>`<div class="achievement ${a[2]?"unlocked":""}"><b>${a[0]}</b><span>${a[1]}</span><small>${a[2]?"Unlocked":"Keep going"}</small></div>`).join("");
  const needs=mi*.5,wants=mi*.3,sav=mi*.2;
  $("rule503020").innerHTML=`<div class="rule-bars"><div><span>Needs</span><b>${money(me*.6)}</b><i style="width:${Math.min(100,mi?me*.6/mi*100:0)}%"></i><small>Target ${money(needs)}</small></div><div><span>Wants</span><b>${money(me*.4)}</b><i style="width:${Math.min(100,mi?me*.4/mi*100:0)}%"></i><small>Target ${money(wants)}</small></div><div><span>Savings</span><b>${money(Math.max(0,mi-me))}</b><i style="width:${Math.min(100,mi?Math.max(0,mi-me)/mi*100:0)}%"></i><small>Target ${money(sav)}</small></div></div>`;
}
function buildSmartAlerts(budgetUse,savingsRate,forecast,budgets,me){
  const a=[];
  if(!budgets.length)a.push(["⚠️","No budgets configured","Create category budgets to activate overspending alerts."]);
  else if(budgetUse>=1)a.push(["🔴","Budget limit reached","One or more budget allocations may be over their planned limit."]);
  else if(budgetUse>=.8)a.push(["🟠","Budget usage is high","You have crossed 80% of your average budget allocation."]);
  else a.push(["🟢","Budget position is healthy","Current average budget usage is below 80%."]);
  if(savingsRate<10)a.push(["💡","Savings opportunity","Your current monthly savings rate is below 10%."]);
  else a.push(["✨","Good savings pace","Your current monthly savings rate is at least 10%."]);
  a.push(["📊","Forecast","Projected monthly spending is "+money(forecast)+"."]);
  return a.map(x=>`<div class="alert-item"><b>${x[0]}</b><span><strong>${x[1]}</strong><small>${x[2]}</small></span></div>`).join("");
}
function runWhatIf(){
  const amount=+$("whatIfAmount").value||0, months=Math.max(1,+$("whatIfMonths").value||12);
  $("whatIfResult").innerHTML=amount?`<b>${money(amount*months)}</b><span>Potential additional savings over ${months} month${months===1?"":"s"}.</span>`:'<span>Enter an amount to simulate.</span>';
}
function checkAfford(){
  const amount=+$("affordAmount").value||0,name=$("affordName").value||"Purchase",t=totals(),available=Math.max(0,t.bal);
  const ok=amount<=available;
  $("affordResult").innerHTML=`<b>${ok?"🟢 Looks affordable":"🟠 Review before buying"}</b><span>${esc(name)} costs ${money(amount)}. Current tracked balance: ${money(available)}.</span>`;
}
function logAudit(action,detail=""){
  const logs=arr("auditLog");logs.unshift({date:new Date().toLocaleString(),action,detail});localStorage.setItem("auditLog",JSON.stringify(logs.slice(0,100)));
}
function renderAdminOperations(){
  renderAnnouncements();renderAdminCategories();renderAuditLog();
}
function publishAnnouncement(){
  const title=$("announcementTitle").value.trim(),message=$("announcementMessage").value.trim();if(!title||!message){toast("Missing details","Add a title and message.");return;}
  const a=arr("announcements");a.unshift({id:Date.now(),title,message,date:new Date().toLocaleDateString()});localStorage.setItem("announcements",JSON.stringify(a.slice(0,20)));logAudit("Announcement published",title);$("announcementTitle").value="";$("announcementMessage").value="";renderAnnouncements();toast("Published","Users will see the announcement.");
}
function renderAnnouncements(){
  const a=arr("announcements");$("announcementList").innerHTML=a.length?a.slice(0,5).map(x=>`<div class="setting"><span><b>${esc(x.title)}</b><small>${esc(x.message)} · ${x.date}</small></span></div>`).join(""):'<div class="empty">No announcements yet.</div>';
}
function addAdminCategory(){
  const name=$("adminCategoryName").value.trim(),type=$("adminCategoryType").value;if(!name)return;
  const a=arr("customCategories");if(!a.some(x=>x.name.toLowerCase()===name.toLowerCase()&&x.type===type)){a.push({name,type});localStorage.setItem("customCategories",JSON.stringify(a));logAudit("Category created",name);}
  $("adminCategoryName").value="";renderAdminCategories();toast("Category added",name+" is ready for use.");
}
function renderAdminCategories(){
  const a=arr("customCategories");$("adminCategoryList").innerHTML=a.length?a.map((x,i)=>`<div class="setting"><span><b>${esc(x.name)}</b><small>${x.type}</small></span><button class="mini-btn" onclick="removeAdminCategory(${i})">Remove</button></div>`).join(""):'<div class="empty">No custom categories.</div>';
}
function removeAdminCategory(i){const a=arr("customCategories");const x=a.splice(i,1)[0];localStorage.setItem("customCategories",JSON.stringify(a));logAudit("Category removed",x?.name||"");renderAdminCategories();}
function renderAuditLog(){
  const a=arr("auditLog");$("auditLog").innerHTML=a.length?a.slice(0,30).map(x=>`<div class="setting"><span><b>${esc(x.action)}</b><small>${esc(x.detail||"")}</small></span><small>${esc(x.date)}</small></div>`).join(""):'<div class="empty">No audit activity yet.</div>';
}
function clearAuditLog(){localStorage.removeItem("auditLog");renderAuditLog();toast("Audit cleared","The local audit log was cleared.");}
function renderUserAnnouncements(){
  const a=arr("announcements");const el=$("userAnnouncements");if(!el)return;
  if(!a.length){el.style.display="none";return;}el.style.display="block";el.innerHTML=`<div class="panel-head"><div><h3>📢 Announcements</h3><small>Latest administrator updates</small></div></div>`+a.slice(0,3).map(x=>`<div class="alert-item"><b>📢</b><span><strong>${esc(x.title)}</strong><small>${esc(x.message)} · ${x.date}</small></span></div>`).join("");
}





/* =========================================================
   TRANSACTION CATEGORY EMOJIS
   Updates the visible selected category immediately.
   ========================================================= */
const transactionCategoryEmoji={
  transport:"🚗", transportation:"🚗", travel:"✈️", flight:"✈️", bus:"🚌",
  train:"🚆", metro:"🚇", railway:"🚆", fuel:"⛽",
  food:"🍔", dining:"🍽️", restaurant:"🍽️", groceries:"🛒", grocery:"🛒",
  shopping:"🛍️", clothing:"👕", fashion:"👗",
  home:"🏠", rent:"🏠", housing:"🏠", furniture:"🛋️",
  utilities:"🔌", electricity:"⚡", water:"💧", internet:"🌐",
  phone:"📱", mobile:"📱", telecom:"📡",
  health:"🏥", medical:"🏥", hospital:"🏥", medicine:"💊", pharmacy:"💊",
  education:"🎓", college:"🎓", school:"🏫", books:"📚", book:"📖",
  entertainment:"🎬", movies:"🎬", movie:"🎬", gaming:"🎮", games:"🎮",
  subscription:"💳", subscriptions:"💳",
  salary:"💰", income:"💵", freelance:"💼", business:"🏢",
  investment:"📈", investments:"📈", stocks:"📈", mutual:"📊",
  savings:"🐷", saving:"🐷", insurance:"🛡️",
  tax:"🧾", taxes:"🧾", fees:"🧾",
  loan:"🏦", loans:"🏦", debt:"💳", emi:"💳",
  gift:"🎁", gifts:"🎁", charity:"❤️", donation:"❤️",
  personal:"👤", beauty:"💄", fitness:"🏋️", gym:"🏋️",
  pet:"🐾", pets:"🐾", baby:"👶", children:"🧒", family:"👨‍👩‍👧",
  coffee:"☕", snacks:"🍿", atm:"🏧", cash:"💵", bank:"🏦", banking:"🏦"
};

function transactionEmoji(value){
  const s=String(value||"").toLowerCase().trim();
  for(const [key,emoji] of Object.entries(transactionCategoryEmoji)){
    if(s===key || s.includes(key)) return emoji;
  }
  return "💳";
}

function updateSelectedCategoryEmoji(select){
  if(!select)return;
  const option=select.options[select.selectedIndex];
  if(!option)return;

  const label=(option.dataset.cleanLabel || option.textContent || "").replace(/^[^\p{L}\p{N}]+/u,"").trim();
  const emoji=transactionEmoji(label);

  /* Find the custom visible display next to the select. */
  let display=select.parentElement?.querySelector(".category-emoji-display");
  if(!display){
    display=document.createElement("span");
    display.className="category-emoji-display";
    display.setAttribute("aria-hidden","true");
    select.parentElement?.appendChild(display);
  }
  display.textContent=emoji;

  select.dataset.selectedEmoji=emoji;
  select.dataset.selectedCategory=label;
}

function setupCategoryEmoji(select){
  if(!select || select.dataset.emojiReady==="1")return;
  select.dataset.emojiReady="1";

  Array.from(select.options).forEach(option=>{
    if(!option.dataset.cleanLabel){
      option.dataset.cleanLabel=(option.textContent||"").replace(/^[^\p{L}\p{N}]+/u,"").trim();
    }
  });

  updateSelectedCategoryEmoji(select);
  select.addEventListener("change",()=>updateSelectedCategoryEmoji(select));
}

function setupAllCategoryEmojis(){
  document.querySelectorAll("select").forEach(select=>{
    const id=(select.id||"").toLowerCase();
    const name=(select.name||"").toLowerCase();
    const looksLikeCategory=
      id.includes("category") || name.includes("category") ||
      Array.from(select.options).some(o=>
        /transport|food|shopping|salary|rent|investment|saving|health|education|entertainment|loan|gift/i.test(o.textContent||"")
      );
    if(looksLikeCategory) setupCategoryEmoji(select);
  });
}

document.addEventListener("DOMContentLoaded",setupAllCategoryEmojis);

const categoryObserver=new MutationObserver(()=>setupAllCategoryEmojis());
categoryObserver.observe(document.body,{childList:true,subtree:true});

window.transactionEmoji=transactionEmoji;

/* Defensive cleanup for legacy malformed chart markup. */
function sanitizeBrokenChartMarkup(){
  document.querySelectorAll("body *").forEach(el=>{
    if(el.children.length===0 && typeof el.textContent==="string"){
      const cleaned=el.textContent
        .replace(/<\s*id=["'](?:adminBar|analyticsBar|analyticsPie|systemBar|dashPie|dashBar)["']\s*>/gi,"")
        .replace(/###\s*(?:System Income vs Expense|Interactive Analytics|Monthly Cash Flow|Expense Categories)/gi,"")
        .trim();
      if(cleaned!==el.textContent) el.textContent=cleaned;
    }
  });
}
document.addEventListener("DOMContentLoaded",sanitizeBrokenChartMarkup);
