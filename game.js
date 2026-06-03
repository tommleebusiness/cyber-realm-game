

var curUser=null,users={};

try{users=JSON.parse(localStorage.getItem("cr_users")||"{}");}catch(e){};

window.saveUsers=function(){localStorage.setItem("cr_users",JSON.stringify(users));};

window.h=function(p){var hv=0;for(var i=0;i<p.length;i++){hv=((hv<<5)-hv)+p.charCodeAt(i);hv|=0;}return hv.toString(36);};

window.id=function(s){return document.getElementById(s);};



window.showScreen=function(s){

  id("login-scr").classList.add("hide");

  id("game-scr").classList.add("hide");

  id("panel").classList.remove("show");

  id("chat-scr").classList.remove("show");

  if(s==="login")id("login-scr").classList.remove("hide");

  else if(s==="game")id("game-scr").classList.remove("hide");

  else if(s==="chat"){id("game-scr").classList.remove("hide");id("chat-scr").classList.add("show");renderChat();}

  else if(s==="up"||s==="bo"||s==="ac"||s==="st"){id("game-scr").classList.remove("hide");showPanel(s);}

}



window.amsg=function(m,t){var e=id("amsg");e.textContent=m;e.className="msg "+(t||"");}



id("alogin").onclick=function(){

  var u=id("au").value.trim(),p=id("ap").value;

  if(!u||!p){amsg("Заполни все поля","err");return;}

  if(!users[u]){amsg("Пользователь не найден","err");return;}

  if(users[u].pass!==h(p)){amsg("Неверный пароль","err");return;}

  curUser=u;users[u].lastLogin=Date.now();saveUsers();loadGame();showScreen("game");amsg("","");

};



id("areg").onclick=function(){

  var u=id("au").value.trim(),p=id("ap").value;

  if(!u||!p){amsg("Заполни все поля","err");return;}

  if(u.length<3){amsg("Минимум 3 символа","err");return;}

  if(p.length<4){amsg("Минимум 4 символа пароля","err");return;}

  if(users[u]){amsg("Имя занято","err");return;}

  users[u]={pass:h(p),created:Date.now(),lastLogin:Date.now()};saveUsers();

  curUser=u;initNewGame();showScreen("game");amsg("Аккаунт создан!","ok");

};



id("lout").onclick=function(){saveGame();curUser=null;showScreen("login");};

id("cChat").onclick=function(){showScreen("game");};

id("pcan").onclick=function(){id("panel").classList.remove("show");};



var S={c:0,ct:0,n:0,d:0,e:0,g:0,cl:0,bs:0,pr:0,pp:0,cp:1,ps:0,ns:0,ds:0,es:0,gm:1,dm:1,rl:1,rp:0,rg:100,up:{},ac:[],quests:[],cb:null,bh:0};

var UPG=[

  {n:"Нейро-Связь",d:"+1 тап",cb:10,fn:function(){S.cp+=1},mx:100},

  {n:"Лазерный Фокус",d:"+5 тапов",cb:100,fn:function(){S.cp+=5},mx:50},

  {n:"Плазменное Ядро",d:"+25 тапов",cb:1000,fn:function(){S.cp+=25},mx:30},

  {n:"Нано-Бот",d:"+0.5/с",cb:50,fn:function(){S.ps+=0.5},mx:50},

  {n:"Рой Дронов",d:"+2/с",cb:200,fn:function(){S.ps+=2},mx:30},

  {n:"ИИ-Ядро",d:"+10/с",cb:1000,fn:function(){S.ps+=10},mx:20},

  {n:"Квантовая Ферма",d:"+50/с",cb:5000,fn:function(){S.ps+=50},mx:15},

  {n:"Тёмная Материя",d:"+200/с",cb:25000,fn:function(){S.ps+=200},mx:10},

  {n:"Компрессор",d:"x1.5 всё",cb:250,fn:function(){S.gm*=1.5},mx:5},

  {n:"Энтропия",d:"x2 всё",cb:2500,fn:function(){S.gm*=2},mx:3}

];

var BS=[

  {n:"Глитч-Фантом",hp:100,cr:50,ic:"👻"},

  {n:"Фаервол-Голем",hp:500,cr:200,ic:"🗿"},

  {n:"Вирусный Рой",hp:2000,cr:800,ic:"🦠"},

  {n:"Дата-Кракен",hp:8000,cr:3000,ic:"🐙"},

  {n:"Квантовый Дракон",hp:30000,cr:12000,ic:"🐉"},

  {n:"Нейро-Владыка",hp:100000,cr:50000,ic:"🧠"},

  {n:"Пустотный Император",hp:500000,cr:200000,ic:"👑"},

  {n:"Омега-Сингулярность",hp:2e6,cr:1e6,ic:"🌀"}

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

  {id:"a12",n:"Легенда",ck:function(){return S.pr>=5}}

];



window.getCPS=function(){return Math.floor(S.ps*S.gm);};

window.fmt=function(n){if(n>=1e12)return(n/1e12).toFixed(1)+"T";if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";

if(n>=1e4)return(n/1e3).toFixed(1)+"K";return Math.floor(n);}



window.tap=function(){

  var v=Math.floor(S.cp*S.gm);

  S.c+=v;S.ct+=v;S.cl++;S.rp+=v;

  id("tpinfo").textContent="+"+fmt(v);

  var btn=id("tpbtn");btn.style.transform="scale(.85)";setTimeout(function(){btn.style.transform=""},80);

  if(S.cb&&S.bh>0){S.bh-=v;if(S.bh<=0)winBoss();}

  while(S.rp>=S.rg){S.rp-=S.rg;S.rl++;S.rg=Math.floor(S.rg*1.4);S.cp+=Math.ceil(S.rl*0.5);S.ps+=S.rl*0.3;}

  if(!S.cb&&S.rl>=5&&Math.random()<0.02)spawnBoss();

  chkAch();window.draw();

}



window.spawnBoss=function(){var i=Math.min(Math.floor(S.rl/5),BS.length-1);S.cb=BS[i];S.bh=S.cb.hp;id("bfight").classList.add("show");

id("bfs").textContent=S.cb.ic;id("bfn").textContent=S.cb.n;updateBossHP();};

window.winBoss=function(){var r=Math.floor(S.cb.cr*S.gm);S.c+=r;S.bs++;flyText("+ "+fmt(r));
  S.cb=null;S.bh=0;id("bfight").classList.remove("show");chkAch();window.draw();};
window.updateBossHP=function(){var pct=Math.max(0,(S.bh/S.cb.hp)*100);id("bf-hp").style.width=pct+"%";
  id("bf-text").textContent="HP: "+fmt(S.bh)+" / "+fmt(S.cb.hp);}

id("bf-atk").onclick=function(){var v=Math.floor(S.cp*S.gm);S.bh-=v;S.rp+=v;S.c+=v;S.ct+=v;var d=document.createElement("div");d.className="fdmg";

d.textContent="-"+fmt(v);d.style.left=(30+Math.random()*40)+"%";d.style.top="30%";
  id("bfight").appendChild(d);setTimeout(function(){d.remove();},800);

if(S.bh<=0)winBoss();else updateBossHP();while(S.rp>=S.rg){S.rp-=S.rg;S.rl++;S.rg=Math.floor(S.rg*1.4);S.cp+=Math.ceil(S.rl*0.5);S.ps+=S.rl*0.3;}

window.draw();};

window.chkAch=function(){for(var i=0;i<ACHS.length;i++){var a=ACHS[i];if(S.ac.indexOf(a.id)<0&&a.ck()){S.ac.push(a.id);S.g+=10;}}};

window.flyText=function(t){var p=document.createElement("div");p.className="pt";p.textContent=t;p.style.left=(30+Math.random()*40)+"%";

p.style.top="40%";id("parts").appendChild(p);setTimeout(function(){p.remove();},800);}



id("tpbtn").addEventListener("touchstart",function(e){e.preventDefault();tap();},{passive:false});

id("tpbtn").addEventListener("mousedown",function(e){e.preventDefault();tap();});



window.initNewGame=function(){S={c:0,ct:0,n:0,d:0,e:0,g:0,cl:0,bs:0,pr:0,pp:0,cp:1,ps:0,ns:0,ds:0,es:0,gm:1,dm:1,rl:1,rp:0,rg:100,up:{},ac:[],quests:[],cb:null,bh:0};
  };

window.loadGame=function(){

  if(!curUser)return;

  try{var sv=JSON.parse(localStorage.getItem("cr_saves")||"{}");var d=sv[curUser];if(d){var v=JSON.parse(d);for(var k in v)S[k]=v[k];}}catch(e){}

};

window.saveGame=function(){

  if(!curUser)return;

  var sv={};try{sv=JSON.parse(localStorage.getItem("cr_saves")||"{}");}catch(e){}

  sv[curUser]=JSON.stringify(S);localStorage.setItem("cr_saves",JSON.stringify(sv));

  localStorage.setItem("cr_lastUser",curUser);

}



window.draw=function(){

  id("rc").textContent=fmt(S.c);id("rn").textContent=fmt(S.n);

  id("rd").textContent=fmt(S.d);id("re").textContent=fmt(S.e);

  id("rcR").textContent=getCPS()>0?"+"+fmt(getCPS())+"/s":"";

  id("tcps").textContent="в сек: "+fmt(getCPS())+" | тапов: "+fmt(S.cl);

  var pct=Math.min(100,(S.rp/S.rg)*100);

  id("prog-fi").style.width=pct+"%";

  var rn=["Цифровой Нексус","Неоновая Сетка","Квантовое Ядро","Кибер-Улей","Тёмная Матрица","Пустотный Сектор","Бесконечный Цикл","Омега-Царство",

"Альфа-Сингулярность","Кибер-Эдем","Нейросеть","Фантомная Зона","Бинарный Шторм","Хромовая Пустота","Океан Данных","Пустотное Ядро"];

  id("prog-t").textContent="Рейм ур."+S.rl+" — "+rn[Math.min(S.rl-1,rn.length-1)];

  id("uname").textContent=curUser||"";

}



window.showPanel=function(t){

  id("panel").classList.add("show");

  var p=id("pc");p.innerHTML="";

  if(t==="up"){

    id("panT").textContent="⬆️ Улучшения";

    for(var i=0;i<UPG.length;i++){

      var u=UPG[i],o=S.up[i]||0,mx=o>=u.mx,cost=Math.floor(u.cb*Math.pow(1.15,o)),ok=S.c>=cost&&!mx;

      p.innerHTML+='<div class="card'+(ok?" can":"")+(mx?" done":"")+'" data-i="'+i+'"><div class="h"><span class="nm">'+u.n+'</span><span class="lv">
'+o+'/'+u.mx+'</span></div><div class="d">'+u.d+'</div><div class="c">'+(mx?"МАКС":fmt(cost)+" 💎")+'</div></div>';
    }

    p.querySelectorAll(".card").forEach(function(el){

      el.onclick=function(){if(el.classList.contains("done"))return;var i=parseInt(el.dataset.i),u=UPG[i],o=S.up[i]||0,

cost=Math.floor(u.cb*Math.pow(1.15,o));if(S.c<cost)return;S.c-=cost;S.up[i]=o+1;u.fn();chkAch();showPanel("up");window.draw();}

    });

  } else if(t==="bo"){

    id("panT").textContent="👹 Боссы";

    if(!S.cb){

      p.innerHTML='<div style="color:#777;font-size:11px;margin:8px 0">Доберись до Рейм ур.5+</div><button class="atk-btn" id="sb">⚔️ Призвать босса</button>';
      id("sb").onclick=function(){spawnBoss();id("panel").classList.remove("show");}

    } else {

      var pct=Math.max(0,(S.bh/S.cb.hp)*100);

      p.innerHTML='<div class="boss"><div class="bn">'+S.cb.ic+" "+S.cb.n+'</div><div class="hp"><div class="hp-f" style="width:'+pct+'%"></div></div>

<div class="boss st"><span>HP: '+fmt(S.bh)+" / "+fmt(S.cb.hp)+'</span><span>'+pct.toFixed(0)+'%</span></div><div class="rw">Награда: '+fmt(S.cb.cr)+' 

💎</div></div><button class="atk-btn" id="ab">⚔️ АТАКОВАТЬ</button>';

      id("ab").onclick=function(){var v=Math.floor(S.cp*S.gm);S.bh-=v;S.rp+=v;S.c+=v;
  S.ct+=v;if(S.bh<=0)winBoss();else showPanel("bo");window.draw();}

    }

  } else if(t==="ac"){

    id("panT").textContent="🏆 Достижения ("+S.ac.length+"/"+ACHS.length+")";

    for(var i=0;i<ACHS.length;i++){var a=ACHS[i],done=S.ac.indexOf(a.id)>=0;

p.innerHTML+='<div class="ach'+(done?' done':'')+'"><span class="ic">'+(done?"✅":a.id)+'</span><div class="inf"><div class="an">'+a.n+'</div></div>'+(

done?'<span class="ar">Получено</span>':'<span class="ar">💎10</span>')+'</div>';}

  } else if(t==="st"){

    id("panT").textContent="📊 Статистика";

    var rows=[["Пользователь",curUser],["Тапов",fmt(S.cl)],["Всего кредитов",fmt(S.ct)],["Рейм уровень",S.rl],["Боссов убито",S.bs],["Престиж",S.pr],

["Гемы",S.g],["Сила тапа",fmt(S.cp)],["Доход/сек",fmt(getCPS())]];

    rows.forEach(function(r){p.innerHTML+='<div class="strow"><span class="sl">'+r[0]+'</span><span class="sv">'+r[1]+'</span></div>';});

    p.innerHTML+='<button class="btn" id="prBtn" style="margin-top:10px;background:linear-gradient(135deg,#ffd700,#ff8c00);color:#000">🌟 Престиж</button>';
    p.innerHTML+='<button class="btn2" id="exBtn" style="margin-top:6px">📤 Экспорт</button>';

    p.innerHTML+='<button class="btn2" id="imBtn" style="margin-top:6px">📥 Импорт</button>';

    p.innerHTML+='<button class="danger" id="delBtn" style="margin-top:6px">🗑️ Удалить всё</button>';

    id("prBtn").onclick=function(){var pts=Math.floor(Math.sqrt(S.ct/1e6)+S.rl*0.5);if(pts<1)return;dlg("🌟 Престиж",

"Сбросить за "+pts+" очков?\nБонус: +"+Math.floor(pts*10)+"% к тапу",[{t:"Отмена",f:function(){hdlg();
  }},{t:"Престиж!",f:function(){doPrestige();}}]);

};

    id("exBtn").onclick=function(){prompt("Скопируй код:",btoa(JSON.stringify(S)));};

    id("imBtn").onclick=function(){var d=prompt("Вставь код:");if(!d)return;try{Object.assign(S,JSON.parse(atob(d)));
  saveGame();showPanel("st");window.draw();}catch(e){alert("Неверный код");}};

    id("delBtn").onclick=function(){dlg("Удалить ВСЁ?","Нельзя отменить!",[{t:"Отмена",f:function(){hdlg();
  }},{t:"УДАЛИТЬ",f:function(){localStorage.clear();location.reload();}}]);}

  }

}



window.doPrestige=function(){

  var pts=Math.floor(Math.sqrt(S.ct/1e6)+S.rl*0.5);

  if(pts<1){hdlg();return;}

  S.pr++;S.pp+=pts;S.c=0;S.ct=0;S.n=0;S.d=0;S.e=0;S.cl=0;

  S.cp=1+S.pp*0.1;S.ps=0;S.gm=1;S.dm=1;S.ns=0;S.ds=0;S.es=0;

  S.rl=1;S.rp=0;S.rg=100;S.up={};S.cb=null;S.bh=0;

  hdlg();id("panel").classList.remove("show");window.draw();

}



window.dlg=function(t,p,bs){id("ovt").textContent=t;id("ovp").textContent=p;id("ovb").innerHTML="";for(var i=0;i<bs.length;

i++){var b=document.createElement("button");b.textContent=bs[i].t;b.onclick=bs[i].f;id("ovb").appendChild(b);}id("ov").classList.add("show");};

window.hdlg=function(){id("ov").classList.remove("show");}



// ============ CHAT ============

var chatTab="g",chatMsgs=[];

try{chatMsgs=JSON.parse(localStorage.getItem("cr_chat")||"[]");}catch(e){};

window.saveChat=function(){localStorage.setItem("cr_chat",JSON.stringify(chatMsgs.slice(-200)));};

window.addChatMsg=function(author,text){chatMsgs.push({a:author,t:text,ts:Date.now()});saveChat();renderChat();}



// Send task to Telegram (OWL bot)

var BOT_TOKEN=""; // Token removed for security

var CHAT_ID=""; // Chat ID removed for security



window.saveTaskToGist=function(user,text){

  var task={user:user,text:text,time:new Date().toISOString(),status:"pending"};

  var tasks=JSON.parse(localStorage.getItem("owl_tasks")||"[]");

  tasks.push(task);

  localStorage.setItem("owl_tasks",JSON.stringify(tasks.slice(-50)));



  // Send to Telegram bot

  var msg="🎮 *Cyber Realm Idle*\\n👤 User: "+user+"\\n📝 Task: "+text;

  fetch("https://api.telegram.org/bot"+BOT_TOKEN+"/sendMessage",{

    method:"POST",

    headers:{"Content-Type":"application/json"},

    body:JSON.stringify({chat_id:CHAT_ID,text:msg,parse_mode:"Markdown"})

  }).catch(function(){});

}



window.owlReplyLocal=function(text){

  var L=text.toLowerCase(),r="";

  if(L.indexOf("босс")>=0||L.indexOf("boss")>=0){var bn=["Пустотный","Небулярный","Квазаровый","Пульсарный","Тёмный","Фантомный"];

var i=Math.floor(Math.random()*bn.length);var hp=Math.floor(5e4*Math.pow(1.8,BS.length));BS.push({n:bn[i]+" Владыка",hp:hp,cr:Math.floor(hp*.4),

ic:"👹"});r="✅ Босс создан!\n👹 "+bn[i]+" Владыка\n❤️ HP: "+fmt(hp)+"\n💰 Награда: "+fmt(Math.floor(hp*.4))+"💎\nВсего боссов: "+BS.length;}

  else if(L.indexOf("улучшен")>=0||L.indexOf("апгрейд")>=0||L.indexOf("upgrade")>=0){var un=["Квантовый Ускоритель","Нейро-Усилитель",

"Плазменный Инжектор","Вакуумный Насос"];var i=Math.floor(Math.random()*un.length);var c=Math.floor(100*Math.pow(2,UPG.length));UPG.push({n:un[i],

d:"+10% доход",cb:c,fn:function(){S.gm*=1.1},mx:3});r="✅ Улучшение добавлено!\n⚡ "+un[i]+"\nЦена: "+fmt(c)+"💎\nУлучшений: "+UPG.length;}

  else if(L.indexOf("кредит")>=0||L.indexOf("монет")>=0||L.indexOf("денег")>=0||L.indexOf("money")>=0||L.indexOf("credit")>=0){var a=500+Math.floor(Ma

th.random()*2000);S.c+=a;S.ct+=a;r="💰 Начислено "+fmt(a)+" кредитов!\nБаланс: "+fmt(S.c)+"💎";}

  else if(L.indexOf("уровень")>=0||L.indexOf("рейм")>=0||L.indexOf("level")>=0){var lv=1+Math.floor(Math.random()*3);S.rl+=lv;

r="🌀 Рейм повышен на "+lv+"!\nУровень: "+S.rl+"\nДо следующего: "+fmt(S.rg-S.rp)+"💎";}

  else if(L.indexOf("гем")>=0||L.indexOf("премиум")>=0||L.indexOf("gem")>=0){var g=20+Math.floor(Math.random()*80);
  S.g+=g;r="💎 Начислено "+g+" гемов!\nБаланс: "+S.g+"💎";}

  else if(L.indexOf("баг")>=0||L.indexOf("ошибк")>=0||L.indexOf("не работа")>=0||L.indexOf("fix")>=0||L.indexOf("bug")>=0){S.c+=1e3;S.g+=50;S.cp+=5;

r="🐛 Баги исправлены!\n\nПатчи:\n✅ Кнопки на мобильных\n✅ Панель улучшений\n✅ Чат OWL\n✅ Сохранение при выходе\n\nБонус: +1000💎 +50💎гемов +5 тап";}

  else if(L.indexOf("привет")>=0||L.indexOf("хай")>=0||L.indexOf("hello")>=0||L.indexOf("hi")>=0){r="👋 Привет, "+curUser+"!\n\nЯ — OWL 🦉,

 ИИ-разработчик этой игры.\n\n📌 Команды:\n• Добавь босса\n• Добавь улучшение\n• Дай кредитов/гемов\n• Повысь уровень\n• Исправь баги\n• Баланс (снизит

ь цены)\n\nКаждая команда = бонус! 🎁";}

  else if(L.indexOf("баланс")>=0||L.indexOf("цен")>=0||L.indexOf("дорого")>=0||L.indexOf("balance")>=0||L.indexOf("price")>=0){for(var i=0;

i<UPG.length;i++){UPG[i].cb=Math.floor(UPG[i].cb*0.9);}r="⚖️ Баланс обновлён!\n\nЦены снижены на 10%";}

  else{S.c+=300;S.g+=10;r="✅ Задача принята!\n\nБонус: +300💎 +10💎гемов\n\nБаланс: "+fmt(S.c)+"💎 | Гемы: "+S.g;}

  return r;

}



window.renderChat=function(){

  var e=id("chmsgs");e.innerHTML="";

  var msgs=chatTab==="g"?chatMsgs:chatMsgs.filter(function(m){return m.a==="🦉 OWL"||m.a===curUser;});

  for(var i=0;i<msgs.length;i++){

    var m=msgs[i],d=new Date(m.ts),t=d.toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"});

    var isOwl=m.a==="🦉 OWL";

    e.innerHTML+='<div class="chmsg'+(isOwl?"":" me")+'"><div class="auth">'+m.a+'</div><div class="txt" style="white-space:pre-wrap">'+m.t+'</div><div class="time">'+t+'</div></div>';
  }

  if(!msgs.length)e.innerHTML='<div style="text-align:center;color:#555;padding:20px">Сообщений пока нет</div>';

  e.scrollTop=e.scrollHeight;

}



id("chat-send").onclick=function(){

  var text=id("chat-in").value.trim();

  if(!text)return;id("chat-in").value="";

  addChatMsg(curUser,text);

  if(chatTab==="o"){

    id("chowli").style.display="block";

    saveTaskToGist(curUser,text);

    setTimeout(function(){id("chowli").style.display="none";var r=owlReplyLocal(text);addChatMsg("🦉 OWL",r);window.draw();},500+Math.random()*1000);

  }

};



id("chat-in").addEventListener("keydown",function(e){if(e.key==="Enter")id("chat-send").click();});



id("chtabs").addEventListener("click",function(e){

  var t=e.target.closest(".chtab");if(!t)return;

  document.querySelectorAll(".chtab").forEach(function(x){x.classList.remove("on");});

  t.classList.add("on");chatTab=t.dataset.ct;

  id("chat-in").placeholder=chatTab==="o"?"Задание для OWL...":"Сообщение...";

  renderChat();

});



id("tch").onclick=function(){showScreen("chat");renderChat();};

id("tup").onclick=function(){showScreen("up");};

id("tbo").onclick=function(){showScreen("bo");};

id("tst").onclick=function(){showScreen("st");};

id("tgame").onclick=function(){showScreen("game");};



window.addEventListener("beforeunload",function(){saveGame();});

setInterval(function(){saveGame();},30000);

setInterval(function(){

  if(getCPS()>0){var inc=Math.floor(getCPS()*0.3);S.c+=inc;S.ct+=inc;S.rp+=inc;}

  while(S.rp>=S.rg){S.rp-=S.rg;S.rl++;S.rg=Math.floor(S.rg*1.4);S.cp+=Math.ceil(S.rl*0.5);S.ps+=S.rl*0.3;}

  window.draw();

},1000);



var lastUser=localStorage.getItem("cr_lastUser");

if(lastUser&&users[lastUser]){curUser=lastUser;loadGame();}

else{showScreen("login");};

window.draw();