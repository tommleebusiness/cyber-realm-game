# -*- coding: utf-8 -*-
# OWL run 2026-08-12: wire 3 unobtainable secrets (pet_master, patience, explorer)
# CRLF-safe exact-substring patch (pitfall #22)
import io
NL = "\r\n"
P = "index.html"
with io.open(P, "r", encoding="utf-8", newline="") as f:
    html = f.read()
assert "\r\n" in html, "not CRLF?"
edits = []

# --- Edit 1: checkPets() grants pet_master when all 10 pets owned ------------
old1 = 'S.pets.push(i+1);toast("\U0001F43E "+PETS[i].n+"!")}}}'
new1 = 'S.pets.push(i+1);toast("\U0001F43E "+PETS[i].n+"!")}}if(S.pets.length>=PETS.length&&S.secrets.indexOf("pet_master")<0){S.secrets.push("pet_master")}}'
assert html.count(old1) == 1, "edit1 anchor count=%d" % html.count(old1)
html = html.replace(old1, new1, 1)
edits.append("edit1 checkPets pet_master")

# --- Edit 2: winBoss() also runs checkPets() so boss-milestone pets unlock
#            immediately (pet_master needs all pets; tap() alone delayed it) ---
old2 = '  if(id("panel").style.display==="flex"&&id("panT").textContent.indexOf("\u0411\u043e\u0441\u0441\u044b")>=0)showPanel("bo");' + NL + '  chkAch();draw();saveGame();'
new2 = old2.replace('chkAch();draw();saveGame();', 'checkPets();chkAch();draw();saveGame();')
assert html.count(old2) == 1, "edit2 anchor count=%d" % html.count(old2)
html = html.replace(old2, new2, 1)
edits.append("edit2 winBoss checkPets")

# --- Edit 3: opening the Support (donate) panel reveals s5 explorer ----------
old3 = 'var cp=function(){navigator.clipboard.writeText(addr);toast("\u2705 \u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!")};id("da").onclick=cp;id("cb").onclick=cp;'
new3 = old3 + NL + '  if(S.secrets.indexOf("explorer")<0){S.secrets.push("explorer");chkAch();}'
assert html.count(old3) == 1, "edit3 anchor count=%d" % html.count(old3)
html = html.replace(old3, new3, 1)
edits.append("edit3 dt-panel explorer")

# --- Edit 4: 1s loop grants s2 patience after 600s of active play ------------
old4 = '  if(curUser&&id("game-scr").style.display==="flex")S.playSec=(S.playSec||0)+1;' + NL + '    tickEvents();draw();'
new4 = old4.replace('tickEvents();draw();', 'if((S.playSec||0)>=600&&S.secrets.indexOf("patience")<0){S.secrets.push("patience");chkAch();}' + NL + '    tickEvents();draw();')
assert html.count(old4) == 1, "edit4 anchor count=%d" % html.count(old4)
html = html.replace(old4, new4, 1)
edits.append("edit4 loop patience")

with io.open(P, "w", encoding="utf-8", newline="") as f:
    f.write(html)
print("PATCHED:", "; ".join(edits))
crlf = html.count("\r\n"); lf = html.count("\n")
assert lf == crlf, "EOL gate FAIL: LF-only lines=%d" % (lf - crlf)
print("EOL gate OK: %d CRLF lines" % crlf)