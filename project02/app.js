var uav = {
		positionX : 0,
		positionY : 0,
		rotation  : 0,
		scale     : 1,
		altitude  : 0,
	};
var ground = {
		positionX : 0,
		positionY : 0,
	};
document.addEventListener("keydown", KeyDown, false);
function KeyDown(e)
{
	var keyCode = e.key;
	switch ( e.key ) {
		case "w": case "ArrowUp"   : uav.scale    *= 1.01; break;
		case "s": case "ArrowDown" : uav.scale    *= 0.99; break;
		case "a": case "ArrowLeft" : uav.rotation -= 5;    break;
		case "d": case "ArrowRight": uav.rotation += 5;    break;
		case "q": case "PageUp"    : uav.altitude += 1; if ( uav.altitude > 100 ) uav.altitude = 100; break;
		case "e": case "PageDown"  : uav.altitude -= 1; if ( uav.altitude <   0 ) uav.altitude =   0; break;
		case "h":
			var d = document.getElementById('controls');
			d.style.display = d.style.display=="" ? "none" : "";
			break;
		case "F6":
			document.getElementById('includedscript').remove();
			var head = document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.src= 'project2.js';
			script.id = 'includedscript';
			head.appendChild(script);
			console.log('New script loaded.');
			break;
	}
	UpdateTrans();
}
function MoveUAV()
{
	uav.positionX = event.clientX;
	uav.positionY = event.clientY;
	UpdateTrans();

	console.log("UAV Position: (", uav.positionX, ",", uav.positionY, ")", " UAV Rotation: ", uav.rotation, "UAV Scale: ", uav.scale);
	console.log("Ground Position: (", ground.positionX, ",", ground.positionY, ")");
}
function UpdateTrans()
{
	var s = document.getElementById('shadow');
	var a = uav.altitude * uav.scale;
	s.style.transform = "translate(" + a + "px," + a + "px) translate(" + uav.positionX + "px," + uav.positionY + "px) rotate(" + uav.rotation + "deg) scale(" + uav.scale + ")";
	s.style.filter = "blur(" + (uav.altitude*0.5) + "px)";
	var m = GetTransform( uav.positionX, uav.positionY, uav.rotation, uav.scale );
	var b = document.getElementById('uav');
	b.style.transform = "matrix(" + m[0] + "," + m[1] + "," + m[3] + "," + m[4] + "," + m[6] + "," + m[7] + ")";
	var offset = Array(
		{ x:-51, y:-51 },
		{ x: 51, y:-51 },
		{ x:-51, y: 51 },
		{ x: 51, y: 51 },
	);
	for ( var i=0; i<4; ++i ) {
		var p = document.getElementById('propeller'+i);
		var r = Math.random()*360;
		var t = GetTransform( offset[i].x, offset[i].y, r, 1 );
		t = ApplyTransform( t, m );
		p.style.transform = "matrix(" + t[0] + "," + t[1] + "," + t[3] + "," + t[4] + "," + t[6] + "," + t[7] + ")";
	}
	var px = uav.positionX + ground.positionX * uav.scale;
	var py = uav.positionY + ground.positionY * uav.scale;
	document.body.style.backgroundPosition = px + "px " + py + "px";
	document.body.style.backgroundSize = (uav.scale * 1600) + "px";
}
setInterval( function() {
	var speed = uav.altitude * 0.25;
	var angle = uav.rotation * Math.PI/180;
	var velX  = -Math.sin(angle) * speed;
	var velY  =  Math.cos(angle) * speed;
	ground.positionX += velX;
	ground.positionY += velY;
	var sx = 1600;
	var sy = sx;
	if ( ground.positionX < 0  ) ground.positionX += sx;
	if ( ground.positionY < 0  ) ground.positionY += sy;
	if ( ground.positionX > sx ) ground.positionX -= sx;
	if ( ground.positionY > sy ) ground.positionY -= sy;
	UpdateTrans();
}, 15 );