// Behavior test: pet bonuses actually work in the REAL functions from index.html
// Extracts getCPS, getBossInterval, tap and runs them under stubs.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function extractFn(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function ' + name + ' not found');
  const open = html.indexOf('{', start);
  let depth = 0, i = open;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

const fakeEl = {
  textContent: '', className: '', style: {},
  appendChild: function(){}, removeChild: function(){},
  addEventListener: function(){}, parentNode: null
};

const STUBS = [
  'var fakeEl={textContent:"",className:"",style:{},appendChild:function(){},removeChild:function(){},addEventListener:function(){},parentNode:null};',
  'var id=function(){return fakeEl;};',
  'var toast=function(t){};',
  'var addClass=function(){},remClass=function(){},flashScreen=function(){},draw=function(){};',
  'var createTapParticles=function(){},showCritText=function(){},showBossAttack=function(){};',
  'var updateBossHP=function(){},winBoss=function(){},spawnBoss=function(){};',
  'var updateDQ=function(){},checkPets=function(){},chkAch=function(){},chkQuests=function(){};',
  'var playSound=function(){},vibratePattern=function(){};',
  'var setTimeout=function(fn,t){return 0;};var clearTimeout=function(){};',
  'var document={createElement:function(){return fakeEl;}};',
  'var fmt=function(n){return String(Math.floor(n));};',
  'var tapSinceBoss=0,BOSS_INTERVAL=300,comboTimer=null;',
  'var getSkillLvl=function(skillId){return 0;};',
  'var vibrate=function(){};navigator={vibrate:function(){}};'
].join('\n');

function makeS(pet) {
  return {
    c:0,ct:0,g:0,cl:0,bs:0,pr:0,pp:0,cp:10,ps:0,gm:1,luck:1,rl:1,rp:0,rg:100,
    up:{},old:{},ac:[],craft:[],cb:null,bh:0,lastDaily:0,dailyStreak:0,combo:0,comboMax:0,
    lastTapTime:0,activeEvent:null,eventTimer:0,skills:[],pets:[],activePet:pet,
    dailyQ:[],dailyP:[],dailyDay:0,secrets:[],bossCd:0,tapsOnBoss:0,
    totalPrestige:0,bossKills:0,dailyAllBonus:false,musicEnabled:false,playSec:0
  };
}

// Build a sandbox: S + Math injected, chosen functions extracted from real file
function makeScenario(fnNames, visibleExtra) {
  const extra = visibleExtra || '';
  const code = STUBS + '\nvar S=S_ARG;\n' + extra + '\n' +
    fnNames.map(extractFn).join('\n') +
    '\nreturn {fns:{' + fnNames.map(function(n){return 'fn_'+n+':'+n;}).join(',') + '},S:S};';
  const factory = new Function('S_ARG', code);
  return function(S, mathObj) {
    const savedRandom = Math.random;
    if (mathObj) Math.random = mathObj;
    const out = factory(S);
    Math.random = savedRandom;
    return out;
  };
}

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + name + ' -> got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want));
  if (!ok) failures++;
}

// ---- getCPS ----
{
  const mk = makeScenario(['getCPS']);
  let S = makeS(null); S.ps=100; S.gm=1; check('getCPS no pet = 100', mk(S).fns.fn_getCPS(), 100);
  S = makeS(2); S.ps=100; S.gm=1; check('getCPS pet2 = 102', mk(S).fns.fn_getCPS(), 102);
  S = makeS(7); S.ps=100; S.gm=1; check('getCPS pet7 x1.2 = 120', mk(S).fns.fn_getCPS(), 120);
  S = makeS(9); S.ps=100; S.gm=1; check('getCPS pet9 (no CPS effect) = 100', mk(S).fns.fn_getCPS(), 100);
}

// ---- getBossInterval ----
{
  const mk = makeScenario(['getBossInterval']);
  let S = makeS(null); check('interval no pet = 300', mk(S).fns.fn_getBossInterval(), 300);
  S = makeS(5); check('interval pet5 -10% = 270', mk(S).fns.fn_getBossInterval(), 270);
}

// ---- tap() credits (Math.random=0.99 => no crit/shield/dbl) ----
{
  const mk = makeScenario(['tap'], 'var speakCount=0;');
  const run = function(S){ const r = mk(S, function(){return 0.999;}); r.fns.fn_tap(); return S.c; };
  let S = makeS(null); check('tap no pet +10', run(S), 10);
  S = makeS(1);  check('tap pet1 +10% = 11', run(S), 11);
  S = makeS(7);  check('tap pet7 x1.2 = 12', run(S), 12);
  S = makeS(8);  check('tap pet8 x2 = 20', run(S), 20);
  S = makeS(9);  check('tap pet9 +5 luck (x6) = 60', run(S), 60);
}

// ---- tap() boss drain: pet10 blocks, others drain ----
{
  const mk = makeScenario(['tap']);
  // boss with huge maxHP so drain = max(1, floor(1e9*0.0003)) = 300000
  const b1 = {hp:1e9,maxHP:1e9};
  let S = makeS(null); S.c=500; S.cb=b1; S.bh=1e9; S.cp=10;
  mk(S, function(){return 0.999;}).fns.fn_tap();
  check('boss hit no pet drains (500+10-300000)', S.c, 500+10-300000);
  const S2 = makeS(10); S2.c=500; S2.cb=b1; S2.bh=1e9; S2.cp=10;
  mk(S2, function(){return 0.999;}).fns.fn_tap();
  check('boss hit pet10 NO drain (510)', S2.c, 510);
}

console.log(failures ? ('FAILURES: ' + failures) : 'ALL TESTS PASSED');
process.exit(failures ? 1 : 0);