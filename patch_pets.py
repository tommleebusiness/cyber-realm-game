# Patch pet bonuses into index.html so all 10 pets actually work as described.
import io

path = 'index.html'
with open(path, 'rb') as f:
    raw = f.read()
print('CRLF count:', raw.count(b'\r\n'), '| LF-only total:', raw.count(b'\n'))

text = raw.decode('utf-8')
has_crlf = '\r\n' in text
def E(s):  # adapt newlines to file convention
    return s.replace('\n', '\r\n') if has_crlf else s

def apply(name, old, new):
    global text
    o = E(old); n = E(new)
    cnt = text.count(o)
    print(name, 'found:', cnt, ('OK' if cnt == 1 else '*** PROBLEM ***'))
    if cnt == 1:
        text = text.replace(o, n)
    return cnt == 1

ok = True

# PATCH 1: getCPS() -> pet 2 (+2 CPS), pet 7 (+20% all)
ok &= apply('P1 getCPS pets2/7',
  'function getCPS(){return Math.floor(S.ps*S.gm)}',
  'function getCPS(){var c=S.ps*S.gm;if(S.activePet===2)c+=2;if(S.activePet===7)c*=1.2;return Math.floor(c)}')

# PATCH 2: getBossInterval() -> pet 5 (-10% boss interval)
ok = apply('P2 getBossInterval pet5',
  '  if(speedLvl>0)interval=Math.floor(interval*(1-(5+speedLvl*2)/100));\n  if(S.bossCd>0)interval=Math.floor(interval*3);',
  '  if(speedLvl>0)interval=Math.floor(interval*(1-(5+speedLvl*2)/100));\n  if(S.activePet===5)interval=Math.floor(interval*0.9);\n  if(S.bossCd>0)interval=Math.floor(interval*3);') and ok

# PATCH 3: tap() value -> pet 7 (+all), pet 8 (x2 tap), pet 9 (+5 luck)
ok = apply('P3 tap value pets 7/8/9',
  '  var cb=1+Math.floor((S.combo+comboAdd)/5)*0.5;\n  var pm=S.activePet===1?1.1:1;\n  var v=Math.floor(S.cp*S.gm*cb*S.luck*dbl*pm*goldMult);',
  '  var cb=1+Math.floor((S.combo+comboAdd)/5)*0.5;\n  var pm=S.activePet===1?1.1:1;\n  if(S.activePet===7)pm*=1.2;\n  var petLuck=S.activePet===9?5:0;\n  var v=Math.floor(S.cp*S.gm*cb*(S.luck+petLuck)*dbl*pm*goldMult);\n  if(S.activePet===8)v*=2;') and ok

# PATCH 4: tap() crit -> pet 3 (+10% crit, enables crit without skill)
ok = apply('P4 tap crit pet3',
  '    var critLvl=getSkillLvl("crit");\n    var critChance=3+(critLvl||0)*2;\n    var critDmg=1.5+(critLvl||0)*0.3;\n    if(critLvl>0&&Math.random()<critChance/100){',
  '    var critLvl=getSkillLvl("crit");\n    var critChance=3+(critLvl||0)*2+(S.activePet===3?10:0);\n    var critDmg=1.5+(critLvl||0)*0.3;\n    if((critLvl>0||S.activePet===3)&&Math.random()<critChance/100){') and ok

# PATCH 5: tap() boss dmg -> pet 6 (+15% boss dmg)
ok = apply('P5 tap boss dmg pet6',
  '    var bossLvl=getSkillLvl("boss");\n    if(bossLvl>0)dmg=Math.floor(dmg*(1+(10+bossLvl*5)/100));\n    \n    // Skill: Shield',
  '    var bossLvl=getSkillLvl("boss");\n    if(bossLvl>0)dmg=Math.floor(dmg*(1+(10+bossLvl*5)/100));\n    if(S.activePet===6)dmg=Math.floor(dmg*1.15);\n    \n    // Skill: Shield') and ok

# PATCH 6: tap() boss drain -> pet 10 immune (phoenix auto-rebirth)
ok = apply('P6 tap drain pet10',
  '    }else if(!blocked){\n      var bd=Math.max(1,Math.floor(S.cb.hp*0.0003));\n      S.c=Math.max(0,S.c-bd);\n    }',
  '    }else if(!blocked&&S.activePet!==10){\n      var bd=Math.max(1,Math.floor(S.cb.hp*0.0003));\n      S.c=Math.max(0,S.c-bd);\n    }') and ok

# PATCH 7: attackBoss() crit pet3 + boss dmg pet6 + drain pet10
ok = apply('P7 attackBoss pets 3/6/10',
  '  var critLvl=getSkillLvl("crit");\n  if(critLvl>0&&Math.random()<(3+critLvl*2)/100)dmg=Math.floor(dmg*(1.5+critLvl*0.3));\n  var bossLvl=getSkillLvl("boss");\n  if(bossLvl>0)dmg=Math.floor(dmg*(1+(10+bossLvl*5)/100));',
  '  var critLvl=getSkillLvl("crit");\n  var critChance=3+(critLvl||0)*2+(S.activePet===3?10:0);\n  if((critLvl>0||S.activePet===3)&&Math.random()<critChance/100)dmg=Math.floor(dmg*(1.5+critLvl*0.3));\n  var bossLvl=getSkillLvl("boss");\n  if(bossLvl>0)dmg=Math.floor(dmg*(1+(10+bossLvl*5)/100));\n  if(S.activePet===6)dmg=Math.floor(dmg*1.15);') and ok

ok = apply('attackBoss drain pet10',
  '  if(S.bh<=0){winBoss()}else{if(!blocked){var bd=Math.max(1,Math.floor(S.cb.maxHP*0.0005));S.c=Math.max(0,S.c-bd)}updateBossHP()}',
  '  if(S.bh<=0){winBoss()}else{if(!blocked&&S.activePet!==10){var bd=Math.max(1,Math.floor(S.cb.maxHP*0.0005));S.c=Math.max(0,S.c-bd)}updateBossHP()}') and ok

# PATCH 8: stats panel -> show effective luck incl. pet9
ok = apply('stats luck row',
  '[\"Удача\",Math.round((S.luck-1)*100)+\"%\"],',
  '[\"Удача\",Math.round((S.luck+(S.activePet===9?5:0)-1)*100)+\"%\"],') and ok

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(text)
print('ALL PATCHES APPLIED' if ok else 'SOME PATCHES FAILED')