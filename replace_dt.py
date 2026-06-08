import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match the dt block, from "} else if(t===\"dt\"){" up to but not including the next "} else if(t===\"lb\"){"
# We'll use a non-greedy match for anything in between, but we need to stop before the next else if.
# We'll use a lookahead for the next else if.
pattern = r'(\s*\} else if\(t==="dt"\)\{\s*\n.*?)\n\s*\} else if\(t==="lb"\)\{'

# We want to keep the leading whitespace (if any) and the opening line, and then replace until before the next else if.
# We'll capture the whole block including the opening line and the closing brace of the dt block? Actually the dt block ends with a closing brace before the next else if.
# In the file, the dt block ends with a closing brace (the one that closes the else if) and then a newline, then the next else if.
# So we can match from "} else if(t===\"dt\"){" to the next "} else if(t===\"lb\"){" exclusive.

# Let's do a simpler approach: split by lines and rebuild.

lines = content.splitlines()
new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.rstrip() == '} else if(t==="dt"){':
        # Start of dt block
        new_lines.append(line)  # keep the line
        i += 1
        # Now we will skip lines until we find the line that starts the next else if (for lb)
        # but we need to replace the entire block with our new block.
        # Instead, we will add our new block lines and then skip the old lines until we hit the next else if line.
        new_block = [
            '  } else if(t==="dt"){',
            '    id("panT").textContent="👑 Премиум магазин";',
            '    p.innerHTML=\'<div style="padding:15px;"><div style="text-align:center;margin-bottom:20px;"><div style="font-size:30px;margin-bottom:10px;">👑</div><div style="color:#ffd700;font-size:18px;font-weight:bold;margin-bottom:5px;">Премиум магазин</div><div style="color:#888;font-size:12px;">Эксклюзивные улучшения для сторонников</div></div><div style="background:rgba(0,255,255,.05);border-radius:8px;padding:15px;margin-bottom:15px;"><div style="color:#0ff;font-size:14px;font-weight:bold;margin-bottom:10px;">💰 Ваши гемы: <span id="prem-gems">'+S.g+'</span></div><div style="display:grid;gap:10px;"><button class="btn" id="buy-vip1" style="background:linear-gradient(135deg,#ff0,#ff8000);">VIP I - 100💎</button><button class="btn" id="buy-vip2" style="background:linear-gradient(135deg,#0ff,#4af);">VIP II - 500💎</button><button class="btn" id="buy-vip3" style="background:linear-gradient(135deg,#f0f,#f08);">VIP III - 1500💎</button></div></div><div style="background:rgba(0,255,255,.05);border-radius:8px;padding:15px;margin-bottom:15px;"><div style="color:#0ff;font-size:14px;font-weight:bold;margin-bottom:10px;">🚀 Улучшения за гемы:</div><div style="display:grid;gap:10px;"><button class="btn" id="buy-click2x" style="background:linear-gradient(135deg,#0f0,#0ff);">Клик x2 - 250💎</button><button class="btn" id="buy-cps2x" style="background:linear-gradient(135deg,#0f0,#0ff);">Доход x2 - 500💎</button><button class="btn" id="buy-luck" style="background:linear-gradient(135deg,#ff0,#0ff);">Удача +20% - 300💎</button></div></div><div style="text-align:center;"><button class="btn" id="supporter-badge" style="background:linear-gradient(135deg,#ffd700,#ffed4e);color:#000;">Получить значок сторонника - 1000💎</button><div style="margin-top:10px;color:#888;font-size:11px;">Значок показывает вашу поддержку в чате и топе</div></div></div>\';',
            '    document.getElementById(\'prem-gems\').textContent = S.g;',
            '    id("buy-vip1").onclick=function(){if(S.g>=100){S.g-=100;S.dm*=1.1;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ VIP I активирован!","Теперь вы получаете +10% к доходу",[{t:"Отлично!",f:function(){hdlg()}}]);saveGame();draw()}};',
            '    id("buy-vip2").onclick=function(){if(S.g>=500){S.g-=500;S.dm*=1.25;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ VIP II активирован!","Теперь вы получаете +25% к доходу и редкие дропы чаще",[{t:"Отлично!",f:function(){hdlg()}}]);saveGame();draw()}};',
            '    id("buy-vip3").onclick=function(){if(S.g>=1500){S.g-=1500;S.dm*=1.5;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ VIP III активирован!","Теперь вы получаете +50% к доходу и ультра-редкие дропы",[{t:"Отлично!",f:function(){hdlg()}}]);saveGame();draw()}};',
            '    id("buy-click2x").onclick=function(){if(S.g>=250){S.g-=250;S.cp*=2;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ Клик x2 активирован!","Сила вашего тапа удвоена",[{t:"Отлично!",f:function(){hdlg()}}]);saveGame();draw()}};',
            '    id("buy-cps2x").onclick=function(){if(S.g>=500){S.g-=500;S.ps*=2;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ Доход x2 активирован!","Пассивный доход удвоен",[{t:"Отлично!",f:function(){hdlg()}}]);saveGame();draw()}};',
            '    id("buy-luck").onclick=function(){if(S.g>=300){S.g-=300;S.luck+=0.2;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ Удача +20% активирована!","Шанс на редкие дропы увеличен",[{t:"Отлично!",f:function(){hdlg()}}]);saveGame();draw()}};',
            '    id("supporter-badge").onclick=function(){if(S.g>=1000){S.g-=1000;S.donated=true;document.getElementById(\'prem-gems\').textContent = S.g;dlg("✅ Значок сторонника получен!","Ваша поддержка отмечена специальным значком",[{t:"Горжусь!",f:function(){hdlg()}}]);saveGame();draw()}};'
        ]
        new_lines.extend(new_block)
        # Now skip the old lines until we reach the line that starts the next else if (for lb)
        while i < len(lines) and not lines[i].rstrip().startswith('} else if(t==="lb"){'):
            i += 1
        # Now we are at the line that starts the next else if; we will add it in the next iteration.
        continue
    else:
        new_lines.append(line)
        i += 1

with open('index.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
