
"use strict";
var curUser=null,users={};
try{users=JSON.parse(localStorage.getItem("cr_users")||"{}")}catch(e){}
function saveUsers(){localStorage.setItem("cr_users",JSON.stringify(users))}
function hv(p){var h=0;for(var i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0}return h.toString(36)}
function id(s){return document.getElementById(s)}
function ga(e,a){return e?e.getAttribute(a):null}
function hasClass(e,c){return e&&e.className&&e.className.indexOf(c)>=0}
function addClass(e,c){if(e&&!hasClass(e,c))e.className=e.className+" "+c}
function remClass(e,c){if(e)e.className=e.className.replace(new RegExp("\\b"+c+"\\b","g"),"").replace(/\s+/g," ").trim()}

// === BACKGROUND PARTICLES ===
function initBgParts(){
  var c=id("bg-parts");
  var colors=["#0ff","#f0f","#0f0","#ffd700","#f44"];
  for(var i=0;i<15;i++){
    var p=document.createElement("div");
    p.className="bg-p";
    var size=2+Math.random()*4;
    p.style.cssText="width:"+size+"px;height:"+size+"px;background:"+colors[Math.floor(Math.random()*colors.length)]+";left:"+(Math.random()*100)+"%;animation-duration:"+(8+Math.random()*12)+"s;animation-delay:"+(Math.random()*10)+"s";
    c.appendChild(p);
  }
}
initBgParts();

// === SCREEN MANAGEMENT ===
function showScreen(s){
  id("login-scr").style.display="none";
  id("game-scr").style.display="none";
  id("chat-scr").style.display="none";
  id("panel").style.display="none";
  if(s==="login")id("login-scr").style.display="flex";
  else if(s==="game")id("game-scr").style.display="flex";
  else if(s==="chat"){id("game-scr").style.display="flex";id("chat-scr").style.display="flex";renderChat()}
  else if(s==="up"||s==="bo"||s==="ac"||s==="qu"||s==="cf"||s==="st"||s==="dt"||s==="lb"){id("game-scr").style.display="flex";showPanel(s)}
}

// === DAILY REWARD ===
function checkDailyReward(){
  var now=Math.floor(Date.now()/86400000);
  var last=S.lastDaily||0;
  var streak=S.dailyStreak||0;
  if(now>last){
    if(now===last+1){streak++}else{streak=1};
    S.lastDaily=now;S.dailyStreak=streak;
    var rewards=[{day:1,credits:100,gems:5},{day:2,credits:250,gems:10},{day:3,credits:500,gems:20},{day:4,credits:1000,gems:35},{day:5,credits:2000,gems:50},{day:6,credits:5000,gems:75},{day:7,credits:10000,gems:100}];
    var reward=rewards[Math.min(streak-1,rewards.length-1)];
    S.c+=reward.credits;S.g+=reward.gems;S.ct+=reward.credits;
    setTimeout(function(){dlg("🎁 Ежедневная награда!","День "+streak+" подряд!\n\n+"+fmt(reward.credits)+" 💎\n+"+reward.gems+" 💎 гемов",[{t:"Отлично!",f:function(){hdlg()}}])},500);
  }
}

function amsg(m,t){var e=id("amsg");e.textContent=m;e.className="msg "+(t||"")}

// === DATABASE SYNC ===
var DB_URL="http://127.0.0.1:8765/api";
var TG_BOT_TOKEN="8603295219:AAFj5cgwzp69Wo9dVM0hfPxJ2UDQYlxKr7A";
var TG_CHAT_ID="7819200201";
var dbUserId=null;
var dbSyncTimer=null;

function tgNotify(text){
  try{
    var x=new XMLHttpRequest();
    x.open("POST","https://api.telegram.org/bot"+TG_BOT_TOKEN+"/sendMessage",true);
    x.setRequestHeader("Content-Type","application/json");
    x.timeout=5000;
    x.onreadystatechange=function(){};
    x.send(JSON.stringify({chat_id:TG_CHAT_ID,text:text,parse_mode:"HTML"}));
  }catch(e){}
}

function owlUpdateNotify(version,changes){
  var msg="🆕 <b>Обновление v"+version+"!</b>\n\n"+changes+"\n\n💡 Напиши 'что нового?' чтобы узнать подробности!";
  addChatMsg("🦉 OWL",msg);
  tgNotify(msg);
}

function dbReq(path,method,data,cb){
  try{
    var x=new XMLHttpRequest();
    x.open(method||"GET",DB_URL+path,true);
    x.setRequestHeader("Content-Type","application/json");
    x.timeout=5000;
    x.onreadystatechange=function(){if(x.readyState===4&&cb)cb(x.status,x.responseText)};
    x.onerror=function(){if(cb)cb(0,"")};
    x.ontimeout=function(){if(cb)cb(0,"")};
    x.send(data?JSON.stringify(data):null);
  }catch(e){if(cb)cb(0,"")}
}

function dbRegister(username,password){
  dbReq("/register","POST",{username:username,password:password},function(s,t){
    if(s===200){try{var d=JSON.parse(t);if(d.ok)dbLogin(username,password)}catch(e){}}
  });
}

function dbLogin(username,password){
  dbReq("/login","POST",{username:username,password:password},function(s,t){
    if(s===200){try{var d=JSON.parse(t);if(d.ok){dbUserId=d.user_id;dbStartSync()}}catch(e){}}
  });
}

function dbSave(){
  if(!dbUserId)return;
  dbReq("/save","POST",{user_id:dbUserId,stats:{
    credits:S.c,taps:S.cl,realm_level:S.rl,bosses_killed:S.bs,
    prestige:S.pr,comboMax:S.comboMax,luck:S.luck,gm:S.gm,
    tap_power:S.cp,cps:getCPS()
  }});
}

function dbAchievement(achId,achName){
  if(!dbUserId)return;
  dbReq("/achievement","POST",{user_id:dbUserId,achievement_id:achId,achievement_name:achName});
}

function dbChat(message,isDev){
  if(!curUser)return;
  dbReq("/chat","POST",{username:curUser,message:message,is_dev_chat:isDev||false});
}

function dbStartSync(){
  if(dbSyncTimer)clearInterval(dbSyncTimer);
  dbSyncTimer=setInterval(dbSave,30000);
}

function dbLoadLeaderboard(sortBy){
  try{
    fetch(DB_URL+"/leaderboard?sort="+(sortBy||"credits"))
    .then(function(r){return r.json()})
    .then(function(d){if(d.players){renderLeaderboardFromDB(d.players,sortBy)}})
    .catch(function(){});
  }catch(e){}
}

// === AUTH ===
id("alogin").onclick=function(){
  var u=id("au").value.trim(),p=id("ap").value;
  if(!u||!p){amsg("Заполни все поля","err");return}
  if(!users[u]){amsg("Пользователь не найден","err");return}
  if(users[u].pass!==hv(p)){amsg("Неверный пароль","err");return}
  curUser=u;users[u].lastLogin=Date.now();saveUsers();loadGame();checkDailyReward();showScreen("game");amsg("","");
  try{dbLogin(u,p)}catch(e){}
};
id("areg").onclick=function(){
  var u=id("au").value.trim(),p=id("ap").value;
  if(!u||!p){amsg("Заполни все поля","err");return}
  if(u.length<3){amsg("Минимум 3 символа","err");return}
  if(p.length<4){amsg("Минимум 4 символа пароля","err");return}
  if(users[u]){amsg("Имя занято","err");return}
  users[u]={pass:hv(p),created:Date.now(),lastLogin:Date.now()};saveUsers();
  curUser=u;initNewGame();showScreen("game");amsg("Аккаунт создан!","ok");
  try{dbRegister(u,p)}catch(e){}
};
id("lout").onclick=function(){saveGame();curUser=null;showScreen("login")};
id("cChat").onclick=function(){showScreen("game")};
id("pcan").onclick=function(){id("panel").style.display="none"};

// === GAME STATE ===
var S={c:0,ct:0,n:0,d:0,e:0,g:0,cl:0,bs:0,pr:0,pp:0,cp:1,ps:0,ns:0,ds:0,es:0,gm:1,dm:1,rl:1,rp:0,rg:100,up:{},ac:[],quests:[],cb:null,bh:0,donated:false,lastDaily:0,dailyStreak:0,autoClick:0,combo:0,comboMax:0,lastTapTime:0,luck:1,gemBonus:0,ms1:false,ms3:false,ms5:false,ms10:false,ms25:false,craftItems:[],activeEvent:null,eventTimer:0,totalPlayTime:0,bestCombo:0};
var audioCtx=null;

var UPG=[
  {n:"Нейро-Связь",d:"+1 тап",cb:10,fn:function(){S.cp+=1},mx:100},
  {n:"Лазерный Фокус",d:"+5 тапов",cb:100,fn:function(){S.cp+=5},mx:50},
  {n:"Плазменное Ядро",d:"+25 тапов",cb:1000,fn:function(){S.cp+=25},mx:30},
  {n:"Нано-Бот",d:"+0.5/с",cb:50,fn:function(){S.ps+=0.5},mx:50},
  {n:"Рой Дронов",d:"+2/с",cb:200,fn:function(){S.ps+=2},mx:30},
  {n:"ИЯ-Ядро",d:"+10/с",cb:1000,fn:function(){S.ps+=10},mx:20},
  {n:"Квантовая Ферма",d:"+50/с",cb:5000,fn:function(){S.ps+=50},mx:15},
  {n:"Тёмная Материя",d:"+200/с",cb:25000,fn:function(){S.ps+=200},mx:10},
  {"n":"Компрессор","d":"x1.5 всё","cb":250,"fn":function(){S.gm*=1.5},"mx":5},
  {n:"Энтропия",d:"x2 всё",cb:2500,fn:function(){S.gm*=2},mx:3},
  {n:"🤖 Авто-Кликер",d:"+1 клик/с",cb:500,fn:function(){S.autoClick+=1},mx:50},
  {n:"🤖 Рой Ботов",d:"+5 кликов/с",cb:2500,fn:function(){S.autoClick+=5},mx:30},
  {n:"🤖 ИЯ-Ядро",d:"+25 кликов/с",cb:15000,fn:function(){S.autoClick+=25},mx:20},
  {n:"🤖 Квантовый Рой",d:"+100 кликов/с",cb:100000,fn:function(){S.autoClick+=100},mx:10},
  {n:"⚡ Комбо-Множитель",d:"+5 макс комбо",cb:5000,fn:function(){S.comboMax+=5},mx:10},
  {n:"🍀 Удача",d:"+10% дроп",cb:3000,fn:function(){S.luck+=0.1},mx:20},
  {n:"⏱️ Ускорение",d:"-10% цены",cb:8000,fn:function(){for(var i=0;i<UPG.length;i++){UPG[i].cb=Math.floor(UPG[i].cb*0.9)}},mx:5},
  {n:"🔥 Термоядер",d:"+1000/с",cb:100000,fn:function(){S.ps+=1000},mx:10},
  {n:"💀 Антиматерия",d:"+5000/с",cb:500000,fn:function(){S.ps+=5000},mx:5},
  {n:"🌀 Сингулярность",d:"x5 всё!",cb:1000000,fn:function(){S.gm*=5},mx:3},
  {n:"⚡⚡ Мега-Комбо",d:"+25 макс комбо",cb:25000,fn:function(){S.comboMax+=25},mx:5},
  {n:"🍀🍀 Супер-Удача",d:"+50% дроп",cb:50000,fn:function(){S.luck+=0.5},mx:10},
  {n:"🤖🤖 Нано-Рой",d:"+500 кликов/с",cb:250000,fn:function(){S.autoClick+=500},mx:10},
  {n:"🏭 Фабрика Ботов",d:"+25/с + x2",cb:75000,fn:function(){S.ps+=25;S.gm*=2},mx:5}
];

var BS=[
  {n:"Глитч-Фантом",hp:100,cr:50,ic:"👻",rare:false},
  {n:"Фаервол-Голем",hp:500,cr:200,ic:"🗿",rare:false},
  {n:"Вирусный Рой",hp:2000,cr:800,ic:"🦠",rare:false},
  {n:"Дата-Кракен",hp:8000,cr:3000,ic:"🐙",rare:false},
  {n:"Квантовый Дракон",hp:30000,cr:12000,ic:"🐉",rare:false},
  {n:"Нейро-Владыка",hp:100000,cr:50000,ic:"🧠",rare:false},
  {n:"Пустотный Император",hp:500000,cr:200000,ic:"👑",rare:false},
  {n:"Омега-Сингулярность",hp:2e6,cr:1e6,ic:"🌀",rare:false},
  {n:"Хаотический Лич",hp:1e7,cr:5e6,ic:"💀",rare:false},
  {n:"Древний Ктулху",hp:1e8,cr:5e7,ic:"🐙",rare:false},
  {n:"Повелитель Тьмы",hp:1e9,cr:1e8,ic:"👁️",rare:false},
  {n:"🚀 Ракетный Бог",hp:50000000,cr:10000000,ic:"🚀",rare:false},
  {n:"⭐ Звёздный Колосс",hp:1e12,cr:1e11,ic:"⭐",rare:false},
  {n:"🌟 Золотой Глитч",hp:500,cr:500,ic:"✨",rare:true},
  {n:"💎 Кристалл Удачи",hp:2000,cr:2000,ic:"💠",rare:true},
  {n:"🔥 Огненный Феникс",hp:10000,cr:8000,ic:"🔥",rare:true},
  {n:"❄️ Ледяной Титан",hp:50000,cr:25000,ic:"❄️",rare:true},
  {n:"⚡ Штормовая Ведьма",hp:200000,cr:100000,ic:"⚡",rare:true},
  {n:"🌑 Тёмный Эмперор",hp:1e7,cr:5e6,ic:"🌑",rare:true}
];

var ACHS=[
  {id:"a1",n:"Первый Тап",ck:function(){return S.cl>=1}},
  {id:"a2",n:"Кликер",ck:function(){return S.cl>=100}},
  {id:"a3",n:"Богач",ck:function(){return S.ct>=1e4}},
  {id:"a4",n:"Убийца Боссов",ck:function(){return S.bs>=1}},
  {id:"a5",n:"Охотник",ck:function(){return S.bs>=10}},
  {id:"a6",n:"Странник",ck:function(){return S.rl>=10}},
  {id:"a7",n:"Престиж",ck:function(){return S.pr>=1}},
  {id:"a8",n:"Демон Скорости",ck:function(){return getCPS()>=100}},
  {id:"a9",n:"Коллекционер",ck:function(){return Object.keys(S.up).length>=10}},
  {id:"a10",n:"Мастер",ck:function(){return S.rl>=25}},
  {id:"a11",n:"Биллионер",ck:function(){return S.ct>=1e9}},
  {id:"a12",n:"Легенда",ck:function(){return S.pr>=5}},
  {id:"a13",n:"Комбо-Мастер",ck:function(){return S.comboMax>=10}},
  {id:"a14",n:"Удачливый",ck:function(){return S.luck>=2}},
  {id:"a15",n:"Редкий Охотник",ck:function(){return S.bs>=50}},
  {id:"a16",n:"Триллионер",ck:function(){return S.ct>=1e12}},
  {id:"a17",n:"Престиж x10",ck:function(){return S.pr>=10}},
  {id:"a18",n:"Мега-Комбо",ck:function(){return S.comboMax>=50}},
  {id:"a19",n:"Секретный Комбо",ck:function(){return S.comboMax>=100}},
  {id:"a20",n:"Все Улучшения",ck:function(){return Object.keys(S.up).length>=24}},
  {id:"a21",n:"Убийца Титанов",ck:function(){return S.bs>=100}},
  {id:"a22",n:"Мастер Престижа",ck:function(){return S.pr>=25}},
  {id:"a23",n:"Мультивселенная",ck:function(){return S.rl>=50}},
  {id:"a24",n:"Квадриллионер",ck:function(){return S.ct>=1e15}},
  {id:"a25",n:"Божество",ck:function(){return S.gm>=100}}
];

function getCPS(){return Math.floor(S.ps*S.gm)}
function fmt(n){if(n>=1e12)return(n/1e12).toFixed(1)+"T";if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e4)return(n/1e3).toFixed(1)+"K";return Math.floor(n)}

// === TAP WITH EFFECTS ===
function tap(){
  var now=Date.now();
  if(now-S.lastTapTime<500){S.combo++;if(S.combo>S.comboMax)S.comboMax=S.combo}else{S.combo=1};
  S.lastTapTime=now;
  var comboBonus=1+Math.floor(S.combo/5)*0.5;
  var v=Math.floor(S.cp*S.gm*comboBonus*S.luck);
  S.c+=v;S.ct+=v;S.cl++;S.rp+=v;

  // Combo display
  if(S.combo>=5){
    var cd=id("combo-display");
    cd.textContent="⚡ COMBO x"+S.combo+"!";
    cd.className="show";
    setTimeout(function(){cd.className=""},1500);
  }

  var comboText=S.combo>1?" x"+comboBonus+" ⚡":"";
  id("tpinfo").textContent="+"+fmt(v)+comboText;
  id("tpinfo").className=comboBonus>1?"bonus":"";

  // Button animation
  var btn=id("tpbtn");
  btn.className="pressing";
  setTimeout(function(){btn.className=""},150);

  // Sound
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800 + Math.random()*400;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }catch(e){}

  // Particles
  if(id("panel").style.display==="none"){
    var colors=["#0ff","#ffd700","#f0f","#0f0"];
    var symbols=["+","✦","◆","●"];
    for(var i=0;i<4;i++){
      var part=document.createElement("div");
      var isCoin=Math.random()<0.3;
      var isGem=Math.random()<0.1;
      part.className="pt "+(isCoin?"pt-coin":isGem?"pt-gem":"");
      part.textContent=isCoin?"💎":isGem?"✨":symbols[Math.floor(Math.random()*symbols.length)];
      part.style.cssText="position:absolute;pointer-events:none;z-index:100;font-size:"+(12+Math.random()*8)+"px;color:"+(isCoin?"#ffd700":isGem?"#f0f":colors[Math.floor(Math.random()*colors.length)])+";left:"+(40+Math.random()*20)+"%;top:"+(40+Math.random()*20)+"%;transition:all .6s ease-out;";
      id("tapz").appendChild(part);
      (function(p){setTimeout(function(){p.style.opacity="0";p.style.transform="translateY(-"+(60+Math.random()*40)+"px) scale(0) rotate("+(Math.random()*360)+"deg)"},50);setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p)},700)})(part);
    }
  }

  // Boss fight
  if(S.cb&&S.bh>0){S.bh-=v;if(S.bh<=0)winBoss()}

  // Level up
  while(S.rp>=S.rg){S.rp-=S.rg;S.rl++;S.rg=Math.floor(S.rg*1.4);S.cp+=Math.ceil(S.rl*0.5);S.ps+=S.rl*0.3}

  // Random boss spawn (rare: ~0.5% base, scales with realm level)
  if(!S.cb&&S.rl>=5&&Math.random()<0.005+Math.min(S.rl*0.001,0.015)){
    var r=Math.min(Math.floor(S.rl/5),BS.length-1);
    if(Math.random()<0.02){
      var rare=BS.filter(function(b){return b.rare});
      if(rare.length>0){var rb=rare[Math.floor(Math.random()*rare.length)];S.cb=rb;S.bh=rb.hp;showBossFight(rb,true);chkAch();draw();return}
    }
    S.cb=BS[r];S.bh=S.cb.hp;showBossFight(S.cb,false);
  }
  chkAch();chkQuests();draw()
}

id("tpbtn").addEventListener("touchstart",function(e){e.preventDefault();tap()},{passive:false});
id("tpbtn").addEventListener("mousedown",function(e){e.preventDefault()});

// === BOSS FIGHT ===
function showBossFight(boss,isRare){
  id("bfight").style.display="flex";
  id("bfs").textContent=boss.ic;
  id("bfn").textContent=boss.n+(isRare?" ⭐":"");
  if(isRare)id("bfn").style.color="#ffd700";
  else id("bfn").style.color="#f44";
  updateBossHP()
}

function spawnBoss(){
  var i=Math.min(Math.floor(S.rl/5),BS.length-1);
  if(Math.random()<0.05+S.luck*0.02){
    var rare=BS.filter(function(b){return b.rare});
    if(rare.length>0){var rb=rare[Math.floor(Math.random()*rare.length)];S.cb=rb;S.bh=rb.hp;showBossFight(rb,true);return}
  }
  S.cb=BS[i];S.bh=S.cb.hp;showBossFight(S.cb,false)
}

function winBoss(){
  var r=Math.floor(S.cb.cr*S.gm*(1+(S.gemBonus||0)));
  S.c+=r;S.bs++;
  flyText("+ "+fmt(r));
  S.cb=null;S.bh=0;id("bfight").style.display="none";
  chkAch();draw()
}

function updateBossHP(){
  var pct=Math.max(0,(S.bh/S.cb.hp)*100);
  id("bf-hp").style.width=pct+"%";
  id("bf-text").textContent="HP: "+fmt(S.bh)+" / "+fmt(S.cb.hp)
}

id("bf-atk").onclick=function(){
  var v=Math.floor(S.cp*S.gm);S.bh-=v;S.rp+=v;S.c+=v;S.ct+=v;
  var d=document.createElement("div");d.className="fdmg";d.textContent="-"+fmt(v);
  d.style.left=(30+Math.random()*40)+"%";d.style.top="30%";
  id("bfight").appendChild(d);setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d)},800);
  // Screen flash
  var bfight = id("bfight");
  var originalBg = bfight.style.backgroundColor;
  bfight.style.backgroundColor = "rgba(255,0,68,0.3)";
  setTimeout(function(){
    bfight.style.backgroundColor = originalBg;
  }, 100);
  if(S.bh<=0)winBoss();else updateBossHP();
  while(S.rp>=S.rg){S.rp-=S.rg;S.rl++;S.rg=Math.floor(S.rg*1.4);S.cp+=Math.ceil(S.rl*0.5);S.ps+=S.rl*0.3}
  draw()
};

// === QUESTS SYSTEM ===
var QUESTS=[
  {id:"q1",n:"Первые шаги",d:"Сделай 10 тапов",ck:function(){return S.cl>=10},reward:{credits:50,gems:2}},
  {id:"q2",n:"Кликер",d:"Сделай 100 тапов",ck:function(){return S.cl>=100},reward:{credits:200,gems:5}},
  {id:"q3",n:"Богач",d:"Накопи 10000 кредитов",ck:function(){return S.ct>=1e4},reward:{credits:500,gems:10}},
  {id:"q4",n:"Охотник",d:"Убей 5 боссов",ck:function(){return S.bs>=5},reward:{credits:1000,gems:15}},
  {id:"q5",n:"Мастер комбо",d:"Достигни комбо x10",ck:function(){return S.comboMax>=10},reward:{credits:2000,gems:20}},
  {id:"q6",n:"Странник",d:"Достигни Рейм 5",ck:function(){return S.rl>=5},reward:{credits:5000,gems:25}},
  {id:"q7",n:"Престиж",d:"Сделай престиж",ck:function(){return S.pr>=1},reward:{credits:10000,gems:50}},
  {id:"q8",n:"Коллекционер",d:"Купи 10 улучшений",ck:function(){return Object.keys(S.up).length>=10},reward:{credits:3000,gems:30}},
  {id:"q9",n:"Удачливый",d:"Достигни удачи x2",ck:function(){return S.luck>=2},reward:{credits:5000,gems:40}},
  {id:"q10",n:"Легенда",d:"Достигни Рейм 25",ck:function(){return S.rl>=25},reward:{credits:50000,gems:100}}
];
var completedQuests=[];
function chkQuests(){
  for(var i=0;i<QUESTS.length;i++){
    var q=QUESTS[i];
    if(completedQuests.indexOf(q.id)>=0)continue;
    if(q.ck()){
      completedQuests.push(q.id);
      S.c+=q.reward.credits;S.g+=q.reward.gems;
      dlg("🎯 Квест!","✅ <b>"+q.n+"</b>\n\nНаграда:\n+"+fmt(q.reward.credits)+" 💎\n+"+q.reward.gems+" 💎 гемов",[{t:"Отлично!",f:function(){hdlg()}}]);
      draw();
    }
  }
}

// === CRAFTING SYSTEM ===
var CRAFT_RECIPES=[
  {id:"c1",n:"Нано-Модуль",d:"+5 тап навсегда",cost:{credits:500,gems:5},fn:function(){S.cp+=5}},
  {id:"c2",n:"Кристалл Скорости",d:"+2/с навсегда",cost:{credits:2000,gems:10},fn:function(){S.ps+=2}},
  {id:"c3",n:"Ядро Удачи",d:"+20% дроп навсегда",cost:{credits:5000,gems:20},fn:function(){S.luck+=0.2}},
  {id:"c4",n:"Квантовый Усилитель",d:"x2 тап навсегда",cost:{credits:25000,gems:50},fn:function(){S.cp*=2}},
  {id:"c5",n:"Тёмная Энергия",d:"+100/с навсегда",cost:{credits:100000,gems:100},fn:function(){S.ps+=100}},
  {id:"c6",n:"Бесконечность",d:"x10 всё!",cost:{credits:1000000,gems:500},fn:function(){S.gm*=10;S.luck+=1}}
];

// === RANDOM EVENTS ===
var GAME_EVENTS=[
  {id:"e1",n:"Золотой Дождь",d:"x3 кредиты на 30 сек!",duration:30,fn:function(){S.gm*=3}},
  {id:"e2",n:"Комбо-Февер",d:"x5 комбо на 20 сек!",duration:20,fn:function(){S.comboMax+=20}},
  {id:"e3",n:"Удачный Час",d:"+100% удача на 60 сек!",duration:60,fn:function(){S.luck+=1}},
  {id:"e4",n:"Нано-Всплеск",d:"+50/с на 45 сек!",duration:45,fn:function(){S.ps+=50}},
  {id:"e5",n:"Престиж-Буст",d:"x2 престиж-очки навсегда",duration:0,fn:function(){S.pp+=Math.max(1,S.pp)}}
];

function triggerRandomEvent(){
  if(S.activeEvent)return;
  var e=GAME_EVENTS[Math.floor(Math.random()*GAME_EVENTS.length)];
  S.activeEvent=e;
  S.eventTimer=e.duration;
  e.fn();
  dlg("⚡ Событие!",e.n+"\n\n"+e.d,[{t:"Отлично!",f:function(){hdlg()}}]);
  draw();
}

function tickEvents(){
  if(S.activeEvent){
    S.eventTimer--;
    if(S.eventTimer<=0){
      S.activeEvent=null;
    }
  }
  // Random event chance: ~1% per minute of play
  if(!S.activeEvent&&Math.random()<0.0002){
    triggerRandomEvent();
  }
}

// === ACHIEVEMENTS ===
function chkAch(){
  for(var i=0;i<ACHS.length;i++){
    var a=ACHS[i];
    if(S.ac.indexOf(a.id)<0&&a.ck()){
      S.ac.push(a.id);S.g+=10;
      showAchPopup(a);
      dbAchievement(a.id,a.n);
    }
  }
}

function showAchPopup(a){
  var p=id("ach-popup");
  p.querySelector(".ach-icon").textContent="🏆";
  p.querySelector(".ach-title").textContent=a.n;
  p.querySelector(".ach-desc").textContent="Награда: 10 💎 гемов";
  p.className="show";
  setTimeout(function(){p.className=""},2500);
}

function flyText(t){
  var p=document.createElement("div");p.className="pt";p.textContent=t;
  p.style.left=(30+Math.random()*40)+"%";p.style.top="40%";
  id("parts").appendChild(p);
  setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p)},800)
}

// === SAVE/LOAD ===
function initNewGame(){S={c:0,ct:0,n:0,d:0,e:0,g:0,cl:0,bs:0,pr:0,pp:0,cp:1,ps:0,ns:0,ds:0,es:0,gm:1,dm:1,rl:1,rp:0,rg:100,up:{},ac:[],quests:[],cb:null,bh:0,donated:false,lastDaily:0,dailyStreak:0,autoClick:0,combo:0,comboMax:0,lastTapTime:0,luck:1,gemBonus:0,ms1:false,ms3:false,ms5:false,ms10:false,ms25:false}}
function loadGame(){if(!curUser)return;try{var sv=JSON.parse(localStorage.getItem("cr_saves")||"{}");var d=sv[curUser];if(d){var v=JSON.parse(d);for(var k in v)S[k]=v[k]}}catch(e){}}
function saveGame(){if(!curUser)return;var sv={};try{sv=JSON.parse(localStorage.getItem("cr_saves")||"{}")}catch(e){}sv[curUser]=JSON.stringify(S);localStorage.setItem("cr_saves",JSON.stringify(sv));localStorage.setItem("cr_lastUser",curUser)}

// === DRAW ===
function draw(){
  id("rc").textContent=fmt(S.c);id("rn").textContent=fmt(S.n);
  id("rd").textContent=fmt(S.d);id("re").textContent=fmt(S.e);
  id("rcR").textContent=getCPS()>0?"+"+fmt(getCPS())+"/s":"";
  var comboInfo=S.combo>1?" | ⚡x"+(1+Math.floor(S.combo/5)*0.5):"";
  var luckInfo=S.luck>1?" | 🍀"+Math.round((S.luck-1)*100)+"%":"";
  id("tcps").textContent="в сек: "+fmt(getCPS())+" | тапов: "+fmt(S.cl)+comboInfo+luckInfo;
  var pct=Math.min(100,(S.rp/S.rg)*100);
  id("prog-fi").style.width=pct+"%";
  var rn=["Цифровой Нексус","Неоновая Сеть","Квантовое Ядро","Кибер-Улей","Тёмная Матрица","Пустотный Сектор","Бесконечный Цикл","Омега-Царство","Альфа-Сингулярность","Кибер-Эдем","Нейросеть","Фантомная Зона","Бинарный Шторм","Хромовая Пустота","Океан Данных","Пустотное Ядро"];
  id("prog-t").textContent="Рейм ур."+S.rl+" — "+rn[Math.min(S.rl-1,rn.length-1)];
  id("uname").textContent=curUser||"";
  var eb=id("event-bar");
  if(S.activeEvent){eb.style.display="block";eb.textContent="⚡ "+S.activeEvent.n+" ("+S.eventTimer+"с)"}
  else{eb.style.display="none"}
}

// === PANEL ===
function showPanel(t){
  id("panel").style.display="flex";
  var p=id("pc");p.innerHTML="";
  if(t==="up"){
    id("panT").textContent="⬆️ Улучшения";
    for(var i=0;i<UPG.length;i++){
      var u=UPG[i],o=S.up[i]||0,mx=o>=u.mx,cost=Math.floor(u.cb*Math.pow(1.15,o)),ok=S.c>=cost&&!mx;
      p.innerHTML+='<div class="card'+(ok?" can":"")+(mx?" done":"")+'" data-idx="'+i+'"><div class="h"><span class="nm">'+u.n+'</span><span class="lv">'+o+"/"+u.mx+'</span></div><div class="d">'+u.d+'</div><div class="c">'+(mx?"МАКС":cost+" 💎")+'</div></div>';
    }
    var cards=p.querySelectorAll(".card");
    for(var i=0;i<cards.length;i++){cards[i].onclick=function(){if(hasClass(this,"done"))return;var idx=parseInt(ga(this,"data-idx")),u=UPG[idx],o=S.up[idx]||0,cost=Math.floor(u.cb*Math.pow(1.15,o));if(S.c<cost)return;S.c-=cost;S.up[idx]=o+1;u.fn();chkAch();showPanel("up");saveGame();draw()}}
  } else if(t==="bo"){
    id("panT").textContent="👹 Боссы";
    if(!S.cb){p.innerHTML='<div style="color:#777;font-size:11px;margin:8px 0">Доберись до Рейм ур.5+</div><button class="atk-btn" id="sb">⚔️ Призвать босса</button>';id("sb").onclick=function(){spawnBoss();id("panel").style.display="none";saveGame()}}
    else{var pct=Math.max(0,(S.bh/S.cb.hp)*100);p.innerHTML='<div class="boss"><div class="bn">'+S.cb.ic+" "+S.cb.n+'</div><div class="hp"><div class="hp-f" style="width:'+pct+'%"></div></div><div class="boss st"><span>HP: '+fmt(S.bh)+" / "+fmt(S.cb.hp)+'</span><span>'+pct.toFixed(0)+'%</span></div><div class="rw">Награда: '+fmt(S.cb.cr*(1+(S.gemBonus||0)))+' 💎</div></div><button class="atk-btn" id="ab">⚔️ АТАКОВАТЬ</button>';id("ab").onclick=function(){var v=Math.floor(S.cp*S.gm);S.bh-=v;S.rp+=v;S.c+=v;S.ct+=v;if(S.bh<=0)winBoss();else showPanel("bo");saveGame();draw()}}
  } else if(t==="ac"){
    id("panT").textContent="🏆 Достижения ("+S.ac.length+"/"+ACHS.length+")";
    for(var i=0;i<ACHS.length;i++){var a=ACHS[i],done=S.ac.indexOf(a.id)>=0;p.innerHTML+='<div class="ach'+(done?" done":"")+'"><span class="ic">'+(done?"✅":"🔲")+'</span><div class="inf"><div class="an">'+a.n+'</div></div><span class="ar">'+(done?"Получено":"💎10")+"</span></div>"}
  } else if(t==="qu"){
    id("panT").textContent="🎯 Квests ("+completedQuests.length+"/"+QUESTS.length+")";
    for(var i=0;i<QUESTS.length;i++){var q=QUESTS[i],done=completedQuests.indexOf(q.id)>=0;p.innerHTML+='<div class="ach'+(done?" done":"")+'"><span class="ic">'+(done?"✅":"🎯")+'</span><div class="inf"><div class="an">'+q.n+'</div><div style="color:#777;font-size:9px">'+q.d+'</div></div><span class="ar">'+(done?"Done":"+"+fmt(q.reward.credits)+"💎")+"</span></div>"}
  } else if(t==="st"){
    id("panT").textContent="📊 Статистика";
    var rows=[["Пользователь",curUser],["Тапов",fmt(S.cl)],["Всего кредитов",fmt(S.ct)],["Рейм уровень",S.rl],["Боссов убито",S.bs],["Престиж",S.pr],["Гемы",S.g],["Сила тапа",fmt(S.cp)],["Доход/сек",fmt(getCPS())],["Комбо макс",S.comboMax],["Удача",Math.round((S.luck-1)*100)+"%"]];
    for(var i=0;i<rows.length;i++){p.innerHTML+='<div class="strow"><span class="sl">'+rows[i][0]+'</span><span class="sv">'+rows[i][1]+"</span></div>"}
    p.innerHTML+='<button class="btn" id="prBtn" style="margin-top:10px;background:linear-gradient(135deg,#ffd700,#ff8c00);color:#000">🌟 Престиж</button>';
    p.innerHTML+='<button class="danger" id="delBtn" style="margin-top:6px">🗑️ Удалить всё</button>';
    id("prBtn").onclick=function(){var pts=Math.floor(Math.sqrt(S.ct/1e6)+S.rl*0.5);if(pts<1)return;dlg("🌟 Престиж","Сбросить за "+pts+" очков?\nБонус: "+Math.floor(pts*10)+"% к тапу",[{t:"Отмена",f:function(){hdlg()}},{t:"Престиж!",f:function(){doPrestige()}}])};
    id("delBtn").onclick=function(){dlg("Удалить ВСЁ?","Нельзя отменить!",[{t:"Отмена",f:function(){hdlg()}},{t:"УДАЛИТЬ",f:function(){localStorage.clear();location.reload()}}])}
  } else if(t==="dt"){
    id("panT").textContent="💎 Поддержать игру";
    var addr="0xC3a92F52E39aaa4B86011d877b40B80Dc39313Ff";
    p.innerHTML='<div style="text-align:center;padding:15px 10px"><div style="font-size:40px;margin-bottom:8px">💎</div><div style="color:#ffd700;font-size:15px;font-weight:bold;margin-bottom:6px">Крипто-донат</div><div style="color:#888;font-size:11px;margin-bottom:12px">Поддержите разработку на любой EVM-сети</div><div style="background:rgba(0,0,0,.3);border-radius:8px;padding:10px;margin-bottom:8px;text-align:left"><div style="color:#ffd700;font-size:11px;font-weight:bold;margin-bottom:4px">📍 Адрес:</div><div style="color:#0ff;font-size:10px;word-break:break-all;background:rgba(0,255,255,.05);padding:6px;border-radius:4px;cursor:pointer" id="donateAddr">'+addr+'</div></div><div style="color:#888;font-size:10px;margin-bottom:10px">🔷 ETH • 🟡 BSC • 🟣 MATIC<br>🔵 BASE • 🔴 ARB • 🟢 OP</div><button class="btn" id="copyAddrBtn" style="margin-bottom:8px;background:linear-gradient(135deg,#0ff,#4af);color:#000">📋 Копировать адрес</button><div style="color:#555;font-size:9px">Спасибо за поддержку! 💖</div></div>';
    id("donateAddr").onclick=function(){navigator.clipboard.writeText(addr);dlg("✅ Скопировано!","Адрес скопирован",[{t:"OK",f:function(){hdlg()}}])};
    id("copyAddrBtn").onclick=function(){navigator.clipboard.writeText(addr);dlg("✅ Скопировано!","Адрес скопирован",[{t:"OK",f:function(){hdlg()}}])};
  } else if(t==="cf"){
    id("panT").textContent="🔧 Крафт";
    for(var i=0;i<CRAFT_RECIPES.length;i++){
      var c=CRAFT_RECIPES[i],canAfford=S.c>=c.cost.credits&&S.gems>=c.cost.gems;
      var cls=canAfford?' can':'';
      var costStr=canAfford?c.cost.credits+' кред':'Нужно: '+fmt(c.cost.credits)+' кред';
      p.innerHTML+='<div class="card"+cls+"" data-cidx=""+i+""><div class="h"><span class="nm">"+c.n+"</span><span class="lv">"+c.cost.gems+" гемов</span></div><div class="d">"+c.d+"</div><div class="c">"+costStr+"</div></div>';
    }
    var ccards=p.querySelectorAll(".card");
    for(var i=0;i<ccards.length;i++){ccards[i].onclick=function(){var idx=parseInt(ga(this,"data-cidx")),r=CRAFT_RECIPES[idx];if(S.c<r.cost.credits||S.gems<r.cost.gems)return;S.c-=r.cost.credits;S.gems-=r.cost.gems;r.fn();chkAch();chkQuests();showPanel("cf");saveGame();draw()}}
  } else if(t==="lb"){
    id("panT").textContent="🏆 Топ игроков";
    renderLeaderboard("credits");
  }
}

// === LEADERBOARD ===
var lbTab="credits",lbData=[],lbSyncing=false;
var LB_KEY="cr_lb_global";

function getMyScore(){
  return {name:curUser||"?",credits:S.ct,level:S.rl,bosses:S.bs,prestige:S.pr,achievements:S.ac.length,cps:getCPS(),combo:S.comboMax,timestamp:Date.now()}
}

function loadLeaderboard(){
  try{var d=localStorage.getItem(LB_KEY);if(d)lbData=JSON.parse(d)}catch(e){}
  if(!Array.isArray(lbData))lbData=[];
}

function saveLeaderboard(){
  localStorage.setItem(LB_KEY,JSON.stringify(lbData.slice(0,100)));
}

function publishScore(){
  if(!curUser)return;
  loadLeaderboard();
  var my=getMyScore();
  var found=false;
  for(var i=0;i<lbData.length;i++){
    if(lbData[i].name===curUser){lbData[i]=my;found=true;break}
  }
  if(!found)lbData.push(my);
  saveLeaderboard();
}

function syncLeaderboard(syncBtn){
  if(lbSyncing)return;
  lbSyncing=true;
  if(syncBtn)syncBtn.textContent="🔄 Синхронизация...";
  // Read leaderboard from GitHub Pages JSON file (CORS-friendly, same origin)
  var url="https://tommleebusiness.github.io/cyber-realm-game/leaderboard.json";
  try{
    fetch(url,{cache:"no-store"})
    .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
    .then(function(data){
      loadLeaderboard();
      var remoteScores=data.players||[];
      // Merge: keep highest score per player
      var merged={};
      for(var i=0;i<lbData.length;i++){merged[lbData[i].name]=lbData[i]}
      for(var i=0;i<remoteScores.length;i++){var r=remoteScores[i];if(!merged[r.name]||r.credits>merged[r.name].credits)merged[r.name]=r}
      lbData=Object.values(merged);
      saveLeaderboard();
      if(syncBtn)syncBtn.textContent="✅ Обновлено!";
      setTimeout(function(){if(syncBtn)syncBtn.textContent="🔄 Обновить"},2000);
      lbSyncing=false;
      renderLeaderboard(lbTab);
    })
    .catch(function(e){
      if(syncBtn)syncBtn.textContent="⚠️ Оффлайн (локально)";
      setTimeout(function(){if(syncBtn)syncBtn.textContent="🔄 Обновить"},2000);
      lbSyncing=false;
      renderLeaderboard(lbTab);
    });
  }catch(e){
    if(syncBtn)syncBtn.textContent="⚠️ Оффлайн";
    lbSyncing=false;
  }
}

function parseVal(s){
  s=(s||"").toUpperCase().replace(/,/g,"");
  if(s.indexOf("T")>=0)return parseFloat(s)*1e12;
  if(s.indexOf("B")>=0)return parseFloat(s)*1e9;
  if(s.indexOf("M")>=0)return parseFloat(s)*1e6;
  if(s.indexOf("K")>=0)return parseFloat(s)*1e3;
  return parseFloat(s)||0;
}

function renderLeaderboard(sortBy){
  lbTab=sortBy||lbTab;
  loadLeaderboard();
  publishScore();
  var p=id("pc");
  p.innerHTML='<div id="lb-tabs">'+
    '<div class="lb-tab'+(lbTab==="credits"?" on":"")+'" data-sort="credits">💎 Кредиты</div>'+
    '<div class="lb-tab'+(lbTab==="level"?" on":"")+'" data-sort="level">🌀 Рейм</div>'+
    '<div class="lb-tab'+(lbTab==="bosses"?" on":"")+'" data-sort="bosses">👹 Боссы</div>'+
    '<div class="lb-tab'+(lbTab==="prestige"?" on":"")+'" data-sort="prestige">⭐ Престиж</div>'+
    '<div class="lb-tab'+(lbTab==="achievements"?" on":"")+'" data-sort="achievements">🏆 Достиж.</div>'+
  '</div>'+
  '<div class="lb-refresh" id="lb-sync">🔄 Обновить</div>'+
  '<div class="lb-refresh" id="lb-share">📤 Поделиться результатом</div>'+
  '<div class="lb-refresh" id="lb-how" style="font-size:9px;padding:4px">Как попасть в топ? →</div>'+
  '<div id="lb-list"></div>';

  // Sort by selected column
  var keyMap={credits:"credits",level:"level",bosses:"bosses",prestige:"prestige",achievements:"achievements"};
  var key=keyMap[lbTab]||"credits";
  lbData.sort(function(a,b){return(b[key]||0)-(a[key]||0)});

  var list=id("lb-list");
  if(!lbData.length){
    list.innerHTML='<div class="lb-empty">Пока нет игроков.<n>Будь первым! 🚀</div>';
  }else{
    for(var i=0;i<Math.min(lbData.length,50);i++){
      var r=lbData[i],isMe=r.name===curUser;
      var rankClass=i<3?" gold":i===1?" silver":i===2?" bronze":"";
      var medals=["🥇","🥈","🥉"];
      var rank=i<3?medals[i]:""+(i+1);
      var val;
      if(key==="credits")val=fmt(r.credits)+" 💎";
      else if(key==="level")val="Ур."+r.level;
      else if(key==="bosses")val=r.bosses+" 👹";
      else if(key==="prestige")val=r.prestige+" ⭐";
      else val=r.achievements+" 🏆";
      list.innerHTML+='<div class="lb-row'+(isMe?" me":"")+'">'+
        '<span class="lb-rank'+(i<3?" "+lbTab:"")+'">'+rank+'</span>'+
        '<span class="lb-name">'+r.name+(isMe?" (ты)":"")+'</span>'+
        '<span class="lb-val">'+val+'</span>'+
      '</div>';
    }
  }

  // Tab switching
  var tabs=p.querySelectorAll(".lb-tab");
  for(var i=0;i<tabs.length;i++){
    tabs[i].onclick=function(){
      var s=this.getAttribute("data-sort");
      renderLeaderboard(s);
    };
  }

  // Share button — open GitHub issue pre-filled with score
  id("lb-share").onclick=function(){
    var score=getMyScore();
    var title="🏆 "+(curUser||"Player")+" — "+fmt(score.credits)+" 💎";
    var body="## Игрок: "+(curUser||"Player")+"\n\nКредиты: "+fmt(score.credits)+"\nРейм: "+score.level+"\nБоссы: "+score.bosses+"\nПрестиж: "+score.prestige+"\nДостижения: "+score.achievements+"\nМировая сумма кредитов: "+fmt(score.credits)+"\n\n> Автоматически из Cyber Realm Idle v9";
    var url="https://github.com/tommleebusiness/cyber-realm-game/issues/new?title="+encodeURIComponent(title)+"&body="+encodeURIComponent(body)+"&labels=leaderboard";
    window.open(url,"_blank");
  };

  // How it works
  id("lb-how").onclick=function(){
    dlg("📋 Как попасть в топ?","1. Играй и набирай кредиты/боссов/достижения\n2. Нажми «📤 Поделиться»\n3. Откроется GitHub — отправь issue\n4. OWL-бот обновит таблицу\n5. Твоё имя появится в топе!\n\nРейтинг обновляется каждый час через OWL.",[{t:"Понятно!",f:function(){hdlg()}}]);
  };

  // Sync button
  id("lb-sync").onclick(function(){syncLeaderboard(this)});
}

function doPrestige(){
  var pts=Math.floor(Math.sqrt(S.ct/1e6)+S.rl*0.5);
  if(pts<1){hdlg();return}
  S.pr++;S.pp+=pts;S.c=0;S.ct=0;S.n=0;S.d=0;S.e=0;S.cl=0;
  S.cp=1+S.pp*0.1;S.ps=0;S.gm=1;S.dm=1;S.ns=0;S.ds=0;S.es=0;
  S.rl=1;S.rp=0;S.rg=100;S.up={};S.cb=null;S.bh=0;
  var milestones=[{pr:1,bonus:"x1.1 к тапу",fn:function(){S.cp*=1.1}},{pr:3,bonus:"x1.2 к доходу",fn:function(){S.gm*=1.2}},{pr:5,bonus:"+10% гемов",fn:function(){S.gemBonus=(S.gemBonus||0)+0.1}},{pr:10,bonus:"x1.5 ко всему",fn:function(){S.gm*=1.5}},{pr:25,bonus:"x2 ко всему",fn:function(){S.gm*=2}}];
  var unlocked=[];
  for(var i=0;i<milestones.length;i++){if(S.pr>=milestones[i].pr&&!S["ms"+milestones[i].pr]){S["ms"+milestones[i].pr]=true;milestones[i].fn();unlocked.push(milestones[i].bonus)}}
  var msg="Престиж завершён! Очки: "+pts;
  if(unlocked.length>0)msg+="\n\n🏆 Разблокировки:\n"+unlocked.join("\n");
  hdlg();id("panel").style.display="none";
  setTimeout(function(){dlg("🌟 Престиж "+S.pr,msg,[{t:"Отлично!",f:function(){hdlg()}}])},300);
  saveGame();draw()
}

function dlg(t,p,bs){id("ovt").textContent=t;id("ovp").textContent=p;id("ovb").innerHTML="";for(var i=0;i<bs.length;i++){var b=document.createElement("button");b.textContent=bs[i].t;b.onclick=bs[i].f;id("ovb").appendChild(b)}id("ov").style.display="flex"}
function hdlg(){id("ov").style.display="none"}

// === CHAT WITH SMART OWL ===
var chatTab="g",chatMsgs=[];
try{chatMsgs=JSON.parse(localStorage.getItem("cr_chat")||"[]")}catch(e){}
function saveChat(){localStorage.setItem("cr_chat",JSON.stringify(chatMsgs.slice(-200)))}
function addChatMsg(a,t,isDev){chatMsgs.push({a:a,t:t,ts:Date.now()});saveChat();renderChat();dbChat(t,isDev||false)}
function renderChat(){
  var e=id("chmsgs");e.innerHTML="";
  var msgs=chatTab==="g"?chatMsgs:chatMsgs.filter(function(m){return m.a==="🦉 OWL"||m.a===curUser});
  for(var i=0;i<msgs.length;i++){
    var m=msgs[i],d=new Date(m.ts),t=d.toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"});
    var cls="chmsg"+(m.a===curUser?" me":"")+(m.a==="🦉 OWL"?" owl":"");
    e.innerHTML+='<div class="'+cls+'"><div class="auth">'+m.a+'</div><div class="txt">'+m.t+'</div><div class="time">'+t+"</div></div>"
  }
  if(!msgs.length)e.innerHTML='<div style="text-align:center;color:#555;padding:20px">Сообщений пока нет</div>';
  e.scrollTop=e.scrollHeight
}

// === OWL AI CHAT ===
function owlRespond(text){
  var L=text.toLowerCase(),r="";
  if(L.indexOf("привет")>=0||L.indexOf("хай")>=0||L.indexOf("hello")>=0)r="Привет! 👋 Я — OWL 🦉, ИИ-разработчик игры.\n\n📌 Команды:\n• Добавь босса\n• Добавь улучшение\n• Дай кредитов/гемов\n• Повысь уровень\n• Исправь баги\n• Дай гемов\n• Что нового?\n• Статус\n\nКаждая команда = бонус! 🎁";
  else if(L.indexOf("босс")>=0){var bn=["Пустотный","Небулярный","Квазаровый","Пульсарный","Тёмный","Фантомный","Хаотический","Сингулярный"];var i=Math.floor(Math.random()*bn.length);var hp=Math.floor(5e4*Math.pow(1.8,BS.length));BS.push({n:bn[i]+" Владыка",hp:hp,cr:Math.floor(hp*.4),ic:"👹",rare:false});r="✅ Босс создан!\n👹 "+bn[i]+" Владыка\n❤️ HP: "+fmt(hp)+"\n💰 Награда: "+fmt(Math.floor(hp*.4))+"💎\nВсего боссов: "+BS.length}
  else if(L.indexOf("улучшен")>=0||L.indexOf("апгрейд")>=0){var un=["Квантовый Ускоритель","Нейро-Усилитель","Плазменный Инжектор","Вакуумный Насос","Гравитационный Коллаптор","Тёмный Конденсатор"];var i=Math.floor(Math.random()*un.length);var c=Math.floor(100*Math.pow(2,UPG.length));UPG.push({n:un[i],d:"+10% доход",cb:c,fn:function(){S.gm*=1.1},mx:3});r="✅ Улучшение добавлено!\n⚡ "+un[i]+"\nЦена: "+fmt(c)+"💎\nУлучшений: "+UPG.length}
  else if(L.indexOf("кредит")>=0||L.indexOf("монет")>=0||L.indexOf("денег")>=0){var a=500+Math.floor(Math.random()*2000);S.c+=a;S.ct+=a;r="💰 Начислено "+fmt(a)+" кредитов!\nБаланс: "+fmt(S.c)+"💎"}
  else if(L.indexOf("уровень")>=0||L.indexOf("рейм")>=0){var lv=1+Math.floor(Math.random()*3);S.rl+=lv;r="🌀 Рейм повышен на "+lv+"!\nУровень: "+S.rl+"\nДо следующего: "+fmt(S.rg-S.rp)+"💎"}
  else if(L.indexOf("гем")>=0){var g=20+Math.floor(Math.random()*80);S.g+=g;r="💎 Начислено "+g+" гемов!\nБаланс: "+S.g+"💎"}
  else if(L.indexOf("баг")>=0||L.indexOf("ошибк")>=0){S.c+=1e3;S.g+=50;S.cp+=5;r="🐛 Баги исправлены!\n\nПатчи:\n✅ Кнопки на мобильных\n✅ Панель улучшений\n✅ Чат OWL\n✅ Сохранение при выходе\n\nБонус: +1000💎 +50💎гемов +5 тап"}
  else if(L.indexOf("что нов")>=0||L.indexOf("новост")>=0||L.indexOf("обновлен")>=0)r="🆕 Что нового в v9:\n\n✨ Новые анимации и эффекты\n✨ Плавающие частицы на фоне\n✨ Улучшенный дизайн всех экранов\n✨ Анимации при тапе и комбо\n✨ Попап достижений\n✨ Улучшенный OWL чат\n✨ Адаптивность под все устройства\n✨ Звуки при тапе";
  else if(L.indexOf("статус")>=0||L.indexOf("инфо")>=0||L.indexOf("info")>=0)r="📊 Текущий статус:\n\n👤 Игрок: "+curUser+"\n💎 Кредиты: "+fmt(S.c)+"\n🌀 Рейм: "+S.rl+"\n⚡ Тап/сек: "+fmt(getCPS())+"\n👹 Боссов убито: "+S.bs+"\n🏆 Достижений: "+S.ac.length+"/"+ACHS.length+"\n💎 Гемы: "+S.g;
  else if(L.indexOf("спасиб")>=0||L.indexOf("благодар")>=0)r="Рад помочь! 😊🦉\n\nЕсли хочешь поддержать игру — вкладка 'Поддержка' в меню. Любая сумма мотивирует развивать игру! 💖";
  else if(L.indexOf("престиж")>=0)r="🌟 Престиж — это сброс прогресса за очки.\n\nОчки = sqrt(всего кредитов / 1M) + рейм * 0.5\n\nБонусы за престиж:\n• x1.1 к тапу (1 престиж)\n• x1.2 к доходу (3 престиж)\n• +10% гемов (5 престиж)\n• x1.5 ко всему (10 престиж)\n• x2 ко всему (25 престиж)";
  else if(L.indexOf("помощь")>=0||L.indexOf("команд")>=0||L.indexOf("help")>=0)r="📋 Список команд OWL:\n\n🎮 Игровые:\n• Дай кредитов — бонус 💰\n• Дай гемов — бонус 💎\n• Повысь уровень — бонус 🌀\n• Добавь босса — новый босс 👹\n• Добавь улучшение — новое улучшение ⚡\n• Исправь баги — бонус 🐛\n\nℹ️ Информация:\n• Статус — твои данные\n• Что нового? — обновления\n• Престиж — как работает";
  else{r="✅ Задача принята!\n\nБонус: +300💎 +10💎гемов\n\nБаланс: "+fmt(S.c)+"💎 | Гемы: "+S.g}
  S.c+=300;S.g+=10;draw();
  addChatMsg("🦉 OWL",r);
  tgNotify("🦉 <b>OWL Response:</b>\n"+r.replace(/\n/g,"<br>"));
}

id("chat-send").onclick=function(){
  var text=id("chat-in").value.trim();
  if(!text)return;id("chat-in").value="";
  addChatMsg(curUser||"Гость",text);
  if(chatTab==="o"){
    id("chowli").style.display="block";
    setTimeout(function(){
      id("chowli").style.display="none";
      owlRespond(text);
    },600+Math.random()*1000);
  }
};
id("chat-in").addEventListener("keydown",function(e){if(e.key==="Enter")id("chat-send").click()});

id("chtabs").addEventListener("click",function(e){
  var t=e.target.closest(".chtab");if(!t)return;
  var all=document.querySelectorAll(".chtab");
  for(var i=0;i<all.length;i++)remClass(all[i],"on");
  addClass(t,"on");chatTab=ga(t,"data-ct");
  id("chat-in").placeholder=chatTab==="o"?"Задание для OWL...":"Сообщение...";
  renderChat()
});

// === FOOTER TABS ===
id("tgame").onclick=function(){id("panel").style.display="none"};
id("tup").onclick=function(){showScreen("up")};
id("tbo").onclick=function(){showScreen("bo")};
id("tch").onclick=function(){showScreen("chat")};
id("tdt").onclick=function(){showScreen("dt")};
id("tst").onclick=function(){showScreen("st")};
id("tlb").onclick=function(){showScreen("lb")};
id("tqu").onclick=function(){showScreen("qu")};
id("tcf").onclick=function(){showScreen("cf")};

// === GAME LOOP ===
window.addEventListener("beforeunload",function(){saveGame()});
setInterval(function(){saveGame()},30000);
setInterval(function(){
  if(getCPS()>0){var inc=Math.floor(getCPS()*0.3);S.c+=inc;S.ct+=inc;S.rp+=inc}
  if(S.autoClick>0){var ac=Math.floor(S.autoClick*S.gm);S.c+=ac;S.ct+=ac;S.rp+=ac}
  while(S.rp>=S.rg){S.rp-=S.rg;S.rl++;S.rg=Math.floor(S.rg*1.4);S.cp+=Math.ceil(S.rl*0.5);S.ps+=S.rl*0.3}
  tickEvents();draw()
},1000);
setInterval(function(){if(S.combo>0&&Date.now()-S.lastTapTime>2000)S.combo=0;draw()},2000);

// === AUTO LOGIN ===
var lastUser=localStorage.getItem("cr_lastUser");
if(lastUser&&users[lastUser]){curUser=lastUser;loadGame()}
else{showScreen("login")}
draw();

// === PWA: Register Service Worker ===
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").then(function(reg){
    console.log("SW registered:", reg.scope);
  }).catch(function(err){
    console.log("SW failed:", err);
  });
}

// === PWA: Install Prompt ===
var deferredPrompt;
window.addEventListener("beforeinstallprompt",function(e){
  e.preventDefault();
  deferredPrompt=e;
  // Show install hint after 30 seconds
  setTimeout(function(){
    if(deferredPrompt){
      var hint=document.createElement("div");
      hint.style.cssText="position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,255,255,.15);border:1px solid #0ff;border-radius:8px;padding:8px 14px;font-size:11px;color:#0ff;z-index:1000;cursor:pointer;backdrop-filter:blur(4px);white-space:nowrap;";
      hint.innerHTML="📱 Установить приложение? <b style=\"margin-left:4px\">ДА</b>";
      hint.onclick=function(){
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(){
          hint.remove();
          deferredPrompt=null;
        });
      };
      document.body.appendChild(hint);
      setTimeout(function(){if(hint.parentNode)hint.remove()},15000);
    }
  },30000);
});

// === VERSION & UPDATE NOTIFICATIONS ===
var GAME_VERSION="9.5";
var LAST_SEEN_VERSION=localStorage.getItem("cr_lastVersion")||"0";
if(LAST_SEEN_VERSION!==GAME_VERSION){
  localStorage.setItem("cr_lastVersion",GAME_VERSION);
  var updateNotes="Что нового в v"+GAME_VERSION+":\n\n🆕 База данных пользователей\n🏆 Достижения сохраняются\n💬 Анализ пожеланий из чата\n📊 Лидерборд из БД\n🤖 Telegram бот уведомления\n🔄 Автодеплой каждые 10 мин\n🛡️ Защита от багов\n\nНапиши 'что нового?' для подробностей!";
  setTimeout(function(){
    owlUpdateNotify(GAME_VERSION,updateNotes);
  },2000);
}
