// Smoke test for showAchPopup / chkAch (stubbed DOM)
var els = {};
function id(s){return els[s]||(els[s]={className:"",textContent:""})}
function hasClass(e,c){return e&&e.className&&e.className.indexOf(c)>=0}
function addClass(e,c){if(e&&!hasClass(e,c))e.className=e.className+" "+c}
function remClass(e,c){if(e)e.className=e.className.replace(new RegExp("\\b"+c+"\\b","g"),"").replace(/\s+/g," ").trim()}
var S={ac:[],secrets:[],g:0};
function toast(){}
function playSound(){}
function showAchPopup(title,desc){
  var pop=id("ach-popup");if(!pop)return;
  var t=id("ach-title"),d=id("ach-desc");
  if(t)t.textContent=title;
  if(d)d.textContent=desc||"";
  addClass(pop,"show");
  clearTimeout(pop._t);
  pop._t=setTimeout(function(){remClass(pop,"show")},2600);
}
function chkAch(){
  for(var i=0;i<1;i++){var a={id:"a1",n:"Первый Тап",ck:function(){return true}};if(S.ac.indexOf(a.id)<0&&a.ck()){S.ac.push(a.id);S.g+=1;toast("🏆 "+a.n+"!");showAchPopup("🏆 "+a.n,"+1 💎 гем");playSound("level")}}
  for(var i=0;i<1;i++){var s={id:"s1",n:"???",r:50,ck:function(){return true}};if(S.secrets.indexOf(s.id)<0&&s.ck()){S.secrets.push(s.id);S.g+=s.r;toast("🔓 Секрет: "+s.n+"!");showAchPopup("🔓 Секрет: "+s.n,"+"+s.r+" 💎 гемов");playSound("level")}}
}
chkAch();
console.log("popup class:", JSON.stringify(id("ach-popup").className));
console.log("title:", id("ach-title").textContent);
console.log("desc:", id("ach-desc").textContent);
console.log("S.ac:", S.ac, "S.secrets:", S.secrets, "S.g:", S.g);
setTimeout(function(){
  console.log("after 2.7s class:", JSON.stringify(id("ach-popup").className));
  if(id("ach-popup").className.indexOf("show")<0)console.log("POPUP HIDES OK");
  else {console.log("POPUP FAILED TO HIDE");process.exit(1)}
},2700);
