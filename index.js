const DW = 466; //Demon's Wheel
const BANDERSNATCH = 46601; // Bandersnatch
const DEMOROS = 46602; //Demoros


const dices = {
	0: {0: 'Hit ALL', 1: 'Don\'t hit RED', 2: 'Hit RED'},	//red dice
	1: {0: 'Hit ALL', 1: 'Don\'t hit BLUE', 2: 'Hit BLUE'},	//blue dice
	2: {0: 'Hit ALL', 1: 'Don\'t hit WHITE', 2: 'Hit WHITE'}	//white dice
};

//Planned call outs: Bandersnatch: Stay in or Get out
//Demoros: LASER
//Demoros: In-out or Out-in
//Demoros: Blue? Not Blue? Red? Not Red? White? Not White? Hit everything

module.exports = function DWGuide(dispatch) {
	const Command = require('command');
	const command = Command(dispatch);
	let boss = null;
	let ball = null;
	let x;
	let y;
	let color; //0: red, 1: blue, 2: white
	let enabled = true;
	let sendToParty = false;
	let msg;
	let orbit=0; //0: STOP, 1:clockwise, 2:counter-clockwise
	let count=0;
	let circlecount=0;
	
	command.add(['dw','!dw','\/dw'], () => {
		enabled = !enabled;
		sendMessage((enabled ? 'DW-guide enabled' : 'DW-guide disabled'));
	});
	
	command.add(['dw.party','!dw.party','\/dw.party'], () => {
		sendToParty = !sendToParty;
		sendMessage((sendToParty ? 'Messages will be sent to the party' : 'Only you will see messages'));
	});
	
	function sendMessage(msg) {
		if (!enabled) return;
		
		if (sendToParty) {
			dispatch.toServer('C_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				message: msg
			});
		} else {
			dispatch.toClient('S_CHAT', 1, {
				channel: 21, //21 = p-notice, 1 = party
				authorName: 'DW-Guide',
				message: msg
			});
		}		
	}
	
	function bossHealth() {
		return (boss.curHp / boss.maxHp);
	}
	
	dispatch.hook('S_BOSS_GAGE_INFO', 3, (event) => {
		let hp;
		if (!enabled) return;
		
		if (event.huntingZoneId == DW) {
			if(event.templateId == BANDERSNATCH || event.templateId == DEMOROS) {
				if (boss && event.templateId == BANDERSNATCH && event.id - boss.id != 0) {
 					circlecount = 0;
				}
				boss = event;
			}
		}
		if(boss) {
			hp = bossHealth();
			if(hp<=0) boss = null;
		}
	});
	
	dispatch.hook('S_ACTION_STAGE', 3, (event) => {
		if (!enabled || !boss) return;
			if (event.gameId - boss.id == 0 && boss.templateId == BANDERSNATCH) {
			//systemMessage(''+event.skill);
			//Bandersnatch actions
			//pre 50%
			//1171391770:  1 orange circle
			//1171391771:  2 blue circles
			//1171391772:  3 red circles
			//1171391773:  4 blue circles
			//1171391774:  5 red circles
			//1171391775:  Red inner explosion
			//1171391776:  Red outer explosion
			//1171391777:  Blue inner explosion
			//1171391778:  Blue outer explosion
			//post 50%
			//1171391779:  Red inner explosion
			//1171391780:  Red outer explosion
			//1171391781:  Blue inner explosion
			//1171391782:  Blue outer explosion
			//1171391783:  1 green circle
			//1171391784:  2 green circles
			//1171391785:  3 green circles
			//1171391786:  4 green circles
			//1171391787:  5 green circles
			
			if (event.skill==1171391775 || event.skill==1171391777 || event.skill==1171391779 || event.skill==1171391781) {
				sendMessage('OUT OUT OUT');
				circlecount = 0;
			}
			if (event.skill==1171391776 || event.skill==1171391778 || event.skill==1171391780 || event.skill==1171391782) {
				sendMessage('IN IN IN IN');
				circlecount = 0;
			}
			if (event.skill >= 1171391770 && event.skill <= 1171391774) {
				circlecount += (event.skill - 1171391770) + 1;
				sendMessage(`${circlecount} - ${(circlecount & 1) ? "odd - red" : "even - blue"}`);
			}
			if (event.skill >= 1171391783 && event.skill <= 1171391787) {
				circlecount += (event.skill - 1171391783) + 1;
				sendMessage(`${circlecount} - ${(circlecount & 1) ? "odd - red" : "even - blue"}`);
			}
		}
		if (event.gameId - boss.id == 0 && boss.templateId == DEMOROS) {
			//systemMessage(''+event.skill);
			//1171391577 Laser, 4 times
			if (event.skill==1171391577 || event.skill==1171392577) {
				if(count == 0){
					sendMessage('<font color = "#ff3300">LASER!!!!!!</font>');
				}
				count+=1;
				if(count == 4) count = 0;
			}
			//1171391773 First Blue Outer-inner explosion
			//1171391774 First Red Outer-inner explosion
			if (event.skill==1171391773 || event.skill==1171391774){
				orbit = 0;
			}
			
			//1171391775 Blue Outer-inner explosion
			//1171391776 Red Inner-outer explosion
			//1171391777 Blue Inner-outer explosion
			//1171391778 Red Outer-inner explosion
			if (event.skill==1171391775 || event.skill==1171391778){
				sendMessage('IN then OUT');
			}
			if (event.skill==1171391776 || event.skill==1171391777){
				sendMessage('OUT then IN');
			}
			//1171391767 Red,Blue,White dice? mech
			if (event.skill==1171391767){
				sendMessage(''+dices[color][orbit]);
			}
			
			//1171391681 Blue circles, 3 times
			//1171391687 Red circles, 3 times
			if (event.skill==1171391687){
				if(count == 0){
					sendMessage('Double RED');
				}
				count+=1;
				if(count == 3) count = 0;
			}
		}
	});
	
	dispatch.hook('S_SPAWN_NPC', 5, (event) => {
		if(!enabled || !boss) return;
		if(event.huntingZoneId != 11796946) return;
		//46621 clockwise ball
		//46622 counterclockwise ball
		if(event.templateId == 46621){
			ball = event;
			orbit = 1;
		}
		if(event.templateId == 46622){
			ball = event;
			orbit = 2;
		}
	});
	
	dispatch.hook('S_DESPAWN_NPC', 2, (event) => {
		if(!enabled || !boss || !ball) return;
		if(event.gameId - ball.gameId == 0){
			x = event.x;
			y = event.y;
			//systemMessage('x = '+x+' , y = '+y);
			if(Math.abs(x+21927.0)<200 && Math.abs(y-43462.6)<200) color = 0;
			if(Math.abs(x+23881.0)<200 && Math.abs(y-42350.3)<200) color = 0;
			if(Math.abs(x+22896.0)<200 && Math.abs(y-41786.0)<200) color = 1;
			if(Math.abs(x+22911.0)<200 && Math.abs(y-44026.0)<200) color = 1;
			if(Math.abs(x+23847.4)<200 && Math.abs(y-43489.7)<200) color = 2;
			if(Math.abs(x+21960.7)<200 && Math.abs(y-42323.2)<200) color = 2;
			//if(color == 0) systemMessage('RED');
			//if(color == 1) systemMessage('BLUE');
			//if(color == 2) systemMessage('WHITE');
			sendMessage(''+dices[color][orbit]);
			ball = null;
		}
	});
	
	
}
