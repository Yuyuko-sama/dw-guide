const DW = 466;                 // Demon's Wheel
const BANDERSNATCH = 46601;     // Bandersnatch
const DEMOROS = 46602;          // Demoros

const dices = {
    0: {0: '打全部', 1: '别打红', 2: '只打红'},       // red dice
    1: {0: '打全部', 1: '别打蓝', 2: '只打蓝'},     // blue dice
    2: {0: '打全部', 1: '别打白', 2: '只打白'},   // white dice
};

module.exports = function DWGuide(mod) {
    let boss = null;
    let ball = null;
    let color; // 0: red, 1: blue, 2: white
    let orbit = 0; // 0: STOP, 1:clockwise, 2:counter-clockwise
    let count = 0;
    let circlecount = 0;
    
    mod.command.add('dw', (subcommand) => {
        switch(subcommand) {
            case '':
            case null:
            case undefined:
                mod.settings.enabled = !mod.settings.enabled;
                mod.command.message(mod.settings.enabled ? 'enabled' : 'disabled');
                break;
            case 'party':
                mod.settings.sendToParty = !mod.settings.sendToParty;
                mod.command.message(mod.settings.sendToParty ? 'Messages将会被发送到组队频道' : '只有你能看到Messages');
                break;
        }
    });
    
    function sendMessage(msg) {
        if (mod.settings.sendToParty) {
            mod.send('C_CHAT', 1, {
                channel: 1, //21 = p-notice, 1 = party
                message: msg,
            });
        } else {
            mod.send('S_DUNGEON_EVENT_MESSAGE', 2, {
                type: 42,
				chat: 0,
				channel: 27,
                message: `<font color="#ffff00">${msg}</font>`,
            });
        }       
    }

    mod.hook('S_BOSS_GAGE_INFO', 3, (event) => {
        if (!mod.settings.enabled)
            return;
        
        if (event.huntingZoneId === DW) {
            if([BANDERSNATCH, DEMOROS].includes(event.templateId)) {
                if (boss && event.templateId === BANDERSNATCH && !event.id.equals(boss.id))
                    circlecount = 0;
                boss = event;
            }
        }
        
        if (boss && boss.curHp <= 0)
            boss = null;
    });
    
    mod.hook('S_ACTION_STAGE', 9, (event) => {
        if (!mod.settings.enabled || !boss || !event.gameId.equals(boss.id))
            return;
        
        switch(boss.templateId) {
            case BANDERSNATCH:
                switch(event.skill.id) {
                    case 1311: // Red inner explosion (pre 50%)
                    case 1313: // Blue inner explosion (pre 50%)
                    case 1315: // Red inner explosion (post 50%)
                    case 1317: // Blue inner explosion (post 50%)
                        sendMessage('出↓！！！');
                        circlecount = 0;
                        break;
                    case 1312: // Red outer explosion (pre 50%)
                    case 1314: // Blue outer explosion (pre 50%)
                    case 1316: // Red outer explosion (post 50%)
                    case 1318: // Blue outer explosion (post 50%)
                        sendMessage('进↑！！！');
                        circlecount = 0;
                        break;
                    case 1306: // 1 orange circle (pre 50%)
                    case 1307: // 2 blue circles (pre 50%)
                    case 1308: // 3 red circles (pre 50%)
                    case 1309: // 4 blue circles (pre 50%)
                    case 1310: // 5 red circles (pre 50%)
                        circlecount += (event.skill.id - 1306) + 1;
                        sendMessage(`${circlecount} - ${(circlecount & 1) ? "单数 - 红" : "双数 - 蓝"}`);
                        break;
                    case 1319: // 1 green circle (post 50%)
                    case 1320: // 2 green circles (post 50%)
                    case 1321: // 3 green circles (post 50%)
                    case 1322: // 4 green circles (post 50%)
                    case 1323: // 5 green circles (post 50%)
                        circlecount += (event.skill.id - 1319) + 1;
                        sendMessage(`${circlecount} - ${(circlecount & 1) ? "单数 - 红" : "双数 - 蓝"}`);
                        break;
                }
                break;
                
            case DEMOROS:
                switch(event.skill.id) {
                    // Laser, 4 times
                    case 1113:
                    case 2113:
                        if(count === 0)
                            sendMessage('激光!!!!!!');
                        count = (count + 1) % 4;
                        break;
                        
                    case 1309: // First Blue Outer-inner explosion
                    case 1310: // First Red Outer-inner explosion
                        orbit = 0;
                        break;
                
                    case 1311: // Blue Outer-inner explosion
                    case 1314: // Red Outer-inner explosion
                        sendMessage('内↑+外↓');
                        break;
                        
                    case 1312: // Red Inner-outer explosion
                    case 1313: // Blue Inner-outer explosion
                        sendMessage('外↓+内↑');
                        break;
                        
                    case 1303: // Red,Blue,White dice? mech
                        sendMessage(dices[color][orbit]);
                        break;
                        
                    // 1217 Blue circles, 3 times
                    case 1223: // Red circles, 3 times
                        if(count === 0)
                            sendMessage('红圈：两次伤害！');
                        count = (count + 1) % 3;
                        break;
                }
                break;
        }
    });
    
    mod.hook('S_SPAWN_NPC', 9, (event) => {
        if (!mod.settings.enabled || !boss || event.huntingZoneId !== DW)
            return;
        
        switch (event.templateId) {
            case 46621: // clockwise ball
                ball = event;
                orbit = 1;
                break;
            case 46622: // counterclockwise ball
                ball = event;
                orbit = 2;
                break;
        }
    });
    
    mod.hook('S_DESPAWN_NPC', 3, (event) => {
        if (!mod.settings.enabled || !boss || !ball)
            return;
        
        if(event.gameId.equals(ball.gameId)){
            if(Math.abs(event.loc.x+21927.0)<200 && Math.abs(event.loc.y-43462.6)<200) color = 0;
            if(Math.abs(event.loc.x+23881.0)<200 && Math.abs(event.loc.y-42350.3)<200) color = 0;
            if(Math.abs(event.loc.x+22896.0)<200 && Math.abs(event.loc.y-41786.0)<200) color = 1;
            if(Math.abs(event.loc.x+22911.0)<200 && Math.abs(event.loc.y-44026.0)<200) color = 1;
            if(Math.abs(event.loc.x+23847.4)<200 && Math.abs(event.loc.y-43489.7)<200) color = 2;
            if(Math.abs(event.loc.x+21960.7)<200 && Math.abs(event.loc.y-42323.2)<200) color = 2;
            sendMessage(dices[color][orbit]);
            ball = null;
        }
    });
}
