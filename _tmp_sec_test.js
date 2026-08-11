// Stub test: showPanel("ac") secrets section rendering
// Brace-extract showPanel from index.html, eval as expression, run with fakeEls id() stub.
var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
var js = html.replace(/\r/g, '');

// Extract function showPanel(t){ ... } by brace counting
var start = js.indexOf('function showPanel(t){');
if (start < 0) { console.log('FAIL: showPanel not found'); process.exit(1); }
var i = start + 'function showPanel(t){'.length;
var depth = 1;
while (depth > 0 && i < js.length) {
  if (js[i] === '{') depth++;
  else if (js[i] === '}') depth--;
  i++;
}
var code = js.slice(start, i);
console.log('Extracted showPanel: ' + code.length + ' chars');

// Stubs
function makeEl() { return { innerHTML: '', textContent: '', style: {}, onclick: null, className: '' }; }
var fakeEls = {};
function id(s) { if (!fakeEls[s]) fakeEls[s] = makeEl(); return fakeEls[s]; }

// Globals the extracted function may reference (only executed branches matter)
var S = { ac: [], secrets: ['s1'] };
var ACHS = [{ id: 'a1', n: 'Достижение A' }];
var SECRETS = [
  { id: 's1', n: '???', h: 'Поговори с OWL о чём-то необычном...', r: 50 },
  { id: 's2', n: '???', h: 'Иногда нужно просто подождать...', r: 30 }
];
function esc(s) { s = String(s); return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function fmt(n) { if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return Math.floor(n); }
function getSkillLvl() { return 0; }
function getCPS() { return 0; }
function fmtTime() { return '0с'; }
function spawnBoss() {}
function surrenderBoss() {}
function attackBoss() {}
function upgradeSkill() {}
function doPrestige() {}
function toast() {}
function hasClass() { return false; }
function ga() { return null; }
function dlg() {}
var completedQuests = [];
var QUESTS = [];
var UPG = [];
var CRAFT = [];
var SKILLS = [];
var PETS = [];
var curUser = 'tester';

global.showPanel = eval('(' + code + ')');

// ---- CASE 1: one secret found, one not ----
fakeEls = {};
showPanel('ac');
var html1 = fakeEls['pc'].innerHTML;
var ok = true;
function chk(name, cond) { console.log((cond ? 'PASS' : 'FAIL') + ': ' + name); if (!cond) ok = false; }

chk('panel title has achievements count', fakeEls['panT'].textContent.indexOf('Достижения (1/1)') >= 0);
chk('secrets section header shows 1/2', html1.indexOf('🔓 Секреты (1/2)') >= 0);
chk('found secret row has unlock icon', html1.indexOf('🔓') >= 0);
chk('unfound secret row has lock icon', html1.indexOf('🔒') >= 0);
chk('found secret hint rendered', html1.indexOf('Поговори с OWL') >= 0);
chk('unfound secret hint rendered', html1.indexOf('просто подождать') >= 0);
chk('found secret shows reward', html1.indexOf('+50💎г') >= 0);
chk('unfound secret shows question mark', html1.indexOf('>?<') >= 0 || html1.indexOf('">?"') >= 0 || /ar'>\?<\/span>/.test(html1));
chk('found row has done class (gold styling)', /class='ach done'><span class='ic'>🔓/.test(html1));
chk('no raw secret name ??? leaked into rows', html1.indexOf('Секрет ???') < 0);
chk('both secret rows numbered', html1.indexOf('Секрет 1') >= 0 && html1.indexOf('Секрет 2') >= 0);

// ---- CASE 2: no secrets found ----
fakeEls = {};
S.secrets = [];
showPanel('ac');
var html2 = fakeEls['pc'].innerHTML;
chk('case2: header shows 0/2', html2.indexOf('🔓 Секреты (0/2)') >= 0);
chk('case2: zero unlock icons', html2.indexOf('🔓') < 0);
chk('case2: two lock icons', (html2.match(/🔒/g) || []).length === 2);

// ---- CASE 3: all secrets found ----
fakeEls = {};
S.secrets = ['s1', 's2'];
showPanel('ac');
var html3 = fakeEls['pc'].innerHTML;
chk('case3: header shows 2/2', html3.indexOf('🔓 Секреты (2/2)') >= 0);
chk('case3: both rewards shown', html3.indexOf('+50💎г') >= 0 && html3.indexOf('+30💎г') >= 0);
chk('case3: no question marks left', html3.indexOf('>?<') < 0 && html3.indexOf('ar\'>?') < 0);

console.log(ok ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
process.exit(ok ? 0 : 1);
