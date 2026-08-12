import io
NL = "\r\n"
with io.open("index.html", "r", encoding="utf-8", newline="") as f: html = f.read()
crlf = html.count("\r\n"); lf = html.count("\n")
assert lf == crlf, "LF-only lines: %d" % (lf - crlf)
old = ('document.addEventListener("keydown",function(e){' + NL +
       '  // Never hijack keys while the user is typing in a text field/password.' + NL +
       '  var t=e.target&&e.target.tagName;' + NL +
       '  if(t==="INPUT"||t==="TEXTAREA")return;' + NL +
       '  if(e.key!==" "&&e.key!=="Enter")return;')
new = ('document.addEventListener("keydown",function(e){' + NL +
       '  // Escape closes the topmost overlay (boss fight > chat > panel) via its own close button.' + NL +
       '  if(e.key==="Escape"){' + NL +
       '    if(id("bfight").style.display==="flex"){id("bf-x").click();return;}' + NL +
       '    if(id("chat-scr").style.display==="flex"){id("cChat").click();return;}' + NL +
       '    if(id("panel").style.display==="flex"){id("pcan").click();return;}' + NL +
       '    return;' + NL +
       '  }' + NL +
       '  // Never hijack keys while the user is typing in a text field/password.' + NL +
       '  var t=e.target&&e.target.tagName;' + NL +
       '  if(t==="INPUT"||t==="TEXTAREA")return;' + NL +
       '  if(e.key!==" "&&e.key!=="Enter")return;')
assert html.count(old) == 1, "anchor count=%d (already applied?)" % html.count(old)
html = html.replace(old, new, 1)
with io.open("index.html", "w", encoding="utf-8", newline="") as f: f.write(html)
print("patched OK")