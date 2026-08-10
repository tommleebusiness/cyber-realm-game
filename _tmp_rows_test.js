// Throwaway stub test: verify the stats-panel rows expression renders Секреты as X/Y (secrets progress)
// Reads index.html, finds the var rows=[...] line in the t==="st" branch, evals it with stubs.
var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');

// Extract the rows array line from the stats panel branch (rows is ONE physical line)
var lines = html.split(/\r?\n/);
var rowsCode = null;
for (var li=0; li<lines.length; li++) {
  if (lines[li].indexOf('var rows=[[') >= 0) { rowsCode = lines[li].slice(lines[li].indexOf('var rows=[')); break; }
}
if (!rowsCode) { console.log('FAIL: rows array line not found'); process.exit(1); }
if (rowsCode.indexOf('Секреты') < 0) { console.log('FAIL: no Секреты row found'); process.exit(1); }

// Stubs for every global the rows expression touches
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function fmt(n){return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")}
function fmtTime(s){return Math.floor(s/60)+"м"}
function getCPS(){return 100}
function getSkillLvl(x){return 0}
var PETS=[{id:1,n:"cat"},{id:3,n:"crit"},{id:7,n:"pet7"},{id:9,n:"uni"}];
var SECRETS=[{id:"s1"},{id:"s2"},{id:"s3"},{id:"s4"},{id:"s5"},{id:"s6"},{id:"s7"},{id:"s8"}]; // 8 total
var curUser = "test";
var S={c:5000,ct:5000,g:100,cl:100,rl:3,pr:1,bs:12,cp:5,gm:2,luck:1,comboMax:23,craft:[1,2],skills:[1],pets:[1],activePet:9,secrets:["s1","s2","s3"],ac:[1,2],dailyQ:[{done:true},{done:false}],pp:5,totalPrestige:1,dailyStreak:2,playSec:300};

var rows = eval(rowsCode);
var out = rows.map(function(r){return r[0]+"="+r[1]}).join(" | ");

// Find the Секреты row by label
var secRow = null;
for (var i=0;i<rows.length;i++) if (rows[i][0]==="Секреты") secRow = rows[i][1];
console.log("Секреты row value:", secRow);
if (secRow !== "3/8") { console.log("FAIL: expected 3/8, got", secRow); process.exit(1); }
console.log("PASS: Секреты renders as X/Y progress (3/8)");
console.log("Full rows count:", rows.length);