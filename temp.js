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
var TG_BOT_TOKEN="8603295219:***";
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
    g:S.g, ct:S.ct, lastDaily:S.lastDaily, dailyStreak:S.dailyStreak
  }},function(s,t){
    if(s===200){try{var d=JSON.parse(t);if(d.ok){/* saved */}}catch(e){}}
  });
}
