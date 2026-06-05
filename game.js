
var curUser=null,users={};
try{users=JSON.parse(localStorage.getItem('cr_users')||'{}');}catch(e){};
window.saveUsers=function(){localStorage.setItem('cr_users',JSON.stringify(users));};
window.h=function(p){var hv=0;for(var i=0;i<p.length;i++){hv=((hv<<5)-hv)+p.charCodeAt(i);hv|=0;}return hv.toString(36);};
window.id=function(s){return document.getElementById(s);};
window.showScreen=function(s){
  document.getElementById('login-scr').style.display='none';
  document.getElementById('game-scr').style.display='none';
  if(s==='login')document.getElementById('login-scr').style.display='flex';
  else if(s==='game')document.getElementById('game-scr').style.display='flex';
};
window.amsg=function(m,t){var e=document.getElementById('amsg');e.textContent=m;e.className='msg '+(t||'');};
document.getElementById('alogin').onclick=function(){
  var u=document.getElementById('au').value.trim(),p=document.getElementById('ap').value;
  if(!u||!p){window.amsg('Заполни все поля','err');return;}
  if(!users[u]){window.amsg('Пользователь не найден','err');return;}
  if(users[u].pass!==window.h(p)){window.amsg('Неверный пароль','err');return;}
  curUser=u;users[u].lastLogin=Date.now();window.saveUsers();window.showScreen('game');document.getElementById('uname').textContent = curUser;window.amsg('','');
};
document.getElementById('areg').onclick=function(){
  var u=document.getElementById('au').value.trim(),p=document.getElementById('ap').value;
  if(!u||!p){window.amsg('Заполни все поля','err');return;}
  if(u.length<3){window.amsg('Минимум 3 символа','err');return;}
  if(p.length<4){window.amsg('Минимум 4 символа пароля','err');return;}
  if(users[u]){window.amsg('Имя занято','err');return;}
  users[u]={pass:window.h(p),created:Date.now(),lastLogin:Date.now()};window.saveUsers();
  curUser=u;window.showScreen('game');window.amsg('Аккаунт создан!','ok');
};
