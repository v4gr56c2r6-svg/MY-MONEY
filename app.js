import
{initializeApp}from"https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import
{getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut}
  
  from
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import
{getFirestore,collection,addDoc,onSnapshot,query,orderBy,doc,deleteDoc,serverTimestamp}
  
  from"https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const 
  cfg={apiKey:"AIzaSyDXvDTZboOUkIr7bJ1C956KUu1v_jSmGhg",authDomain:"my-money-d2e37.firebaseapp.com",
       projectId:"my-money-d2e37",
       storageBucket:"my-money-d2e37.firebasestorage.app",
       messagingSenderId:"877511100946",
       appId:"1:877511100946:web:d601582afb9d4e725666cb"};

const 
  app=initializeApp(cfg),
  auth=getAuth(app),
  db=getFirestore(app),
  $=id=>document.getElementById(id);

let 
  user,
  stops=[],
  latestTransactions=[];

const
  yen=n=>"¥"+Number(n||0).toLocaleString("ja-JP"),
  today=()=>new Date().toLocaleDateString("sv-SE"),
  col=n=>collection(db,"users",user.uid,n);
$("month").value=today().slice(0,7);
$("date").value=today();

function 
  clean(s)
{return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}
                                             [c]))}function err(id,msg){$(id).textContent=msg}
$("loginForm").onsubmit=async 
  e=>{e.preventDefault();
      err("loginError","");
      try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value)}
      catch{err("loginError","ログインできません。入力内容を確認してください。")}};

$("logout").onclick=()=>signOut(auth);


document.querySelectorAll("nav button").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".view").forEach(v => {
      v.hidden = v.id !== b.dataset.tab;
    });

    document.querySelectorAll("nav button").forEach(btn => {
      btn.classList.toggle("active", btn === b);
    });
  };
});

// 最初はホームを選択状態にする
document.querySelector('nav button[data-tab="home"]').classList.add("active");


onAuthStateChanged
  (auth,u=>{stops.forEach(f=>f());
            stops=[];user=u;$("login").hidden=!!u;
            $("app").hidden=!u;$("logout").hidden=!u;if(u)load()});

function 
  load(){
    stops.push(onSnapshot(query(col("transactions"),orderBy("date","desc")),
                          s=>{let a=s.docs.map(d=>({id:d.id,...d.data()}));
                              latestTransactions=a;
                              drawTx(a);updateMonthTotals();
                              $("recent").innerHTML=a.slice(0,5).map(x=>`<p>${clean(x.date)} · ${clean(x.category)} 
                              <b>${x.type==="income"?"+":"−"}
                              ${yen(x.amount)}</b></p>`).join("")||"記録はありません"},
                          e=>err("txError","読み込み失敗："+e.message)));
    stops.push(onSnapshot(col("debts"),
                          s=>{let 
                            a=s.docs.map(d=>({id:d.id,...d.data()}));
                              $("debtTotal").textContent=yen(a.reduce((t,x)=>t+x.balance,0));
                              $("debtList").innerHTML=a.map(x=>`<p>${clean(x.name)}：${yen(x.balance)}
                              （年利${x.rate}%・月返済${yen(x.payment)}） 
                              <button data-del-debt="${x.id}">
                              削除
                              </button></p>`).join("")||"登録はありません";
                              $("debtList").querySelectorAll("[data-del-debt]").forEach(b=>b.onclick=()=>remove("debts",b.dataset.delDebt))},
                          e=>err("debtError","読み込み失敗："+e.message)));
    stops.push(onSnapshot(col("savings"),
                          s=>{let a=s.docs.map(d=>({id:d.id,...d.data()}));
                              $("savingList").innerHTML=a.map(x=>`<p>${clean(x.name)}：${yen(x.current)} / ${yen(x.goal)}（${Math.min(100,Math.round(x.current/x.goal*100))}%） <button data-del-saving="${x.id}">削除</button></p>`).join("")||"登録はありません";

$("homeSavings").innerHTML = a.map(x => {
  const percent = Math.min(
    100,
    Math.round(Number(x.current) / Number(x.goal) * 100)
  );

  return `
    <div class="home-saving-item">
      <p>${clean(x.name)}</p>
      <strong>${yen(x.current)} / ${yen(x.goal)}</strong>
      <div class="saving-progress">
        <div style="width:${percent}%"></div>
      </div>
      <small>達成率 ${percent}%</small>
    </div>
  `;
}).join("") || "貯金目標はまだ登録されていません";

                              
                              $("savingList").querySelectorAll("[data-del-saving]").forEach(b=>b.onclick=()=>remove("savings",b.dataset.delSaving))},e=>err("savingError","読み込み失敗："+e.message)))}
function remove(c,id){if(confirm("削除しますか？"))deleteDoc(doc(db,"users",user.uid,c,id))}
function drawTx(a){$("txList").innerHTML=a.map(x=>`<p>${clean(x.date)} · ${clean(x.category)} ${clean(x.memo)} <b>${x.type==="income"?"+":"−"}${yen(x.amount)}</b> <button data-del-tx="${x.id}">削除</button></p>`).join("")||"記録はありません";$("txList").querySelectorAll("[data-del-tx]").forEach(b=>b.onclick=()=>remove("transactions",b.dataset.delTx))}
$("month").onchange=updateMonthTotals;function updateMonthTotals(){const m=$("month").value||today().slice(0,7),r=latestTransactions.filter(x=>(x.date||"").startsWith(m)),inc=r.filter(x=>x.type==="income").reduce((t,x)=>t+Number(x.amount||0),0),out=r.filter(x=>x.type==="expense").reduce((t,x)=>t+Number(x.amount||0),0);$("income").textContent=yen(inc);$("expense").textContent=yen(out);$("balance").textContent=yen(inc-out)}
$("txForm").onsubmit=async e=>{e.preventDefault();err("txError","");try{await addDoc(col("transactions"),{type:$("type").value,date:$("date").value,amount:Number($("amount").value),category:$("category").value.trim(),memo:$("memo").value.trim(),createdAt:serverTimestamp()});$("txForm").reset();$("date").value=today()}catch(x){err("txError","保存できませんでした。通信状態とルールを確認してください。")}};
$("debtForm").onsubmit=async e=>{e.preventDefault();try{await addDoc(col("debts"),{name:$("debtName").value.trim(),balance:Number($("debtBalance").value),rate:Number($("debtRate").value),payment:Number($("debtPayment").value),createdAt:serverTimestamp()});$("debtForm").reset();err("debtError","")}catch{err("debtError","保存できませんでした。")}};
$("savingForm").onsubmit=async e=>{e.preventDefault();try{await addDoc(col("savings"),{name:$("savingName").value.trim(),goal:Number($("goal").value),current:Number($("current").value),createdAt:serverTimestamp()});$("savingForm").reset();err("savingError","")}catch{err("savingError","保存できませんでした。")}};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
