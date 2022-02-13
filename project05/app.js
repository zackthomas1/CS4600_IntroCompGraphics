///////////////////////////////////////////////////////////////////////////////////
// Below is the core WebGL initialization code.
///////////////////////////////////////////////////////////////////////////////////

var boxDrawer;
var meshDrawer;
var canvas, gl;
var perspectiveMatrix;	// perspective projection matrix
var rotX=0, rotY=0, transZ=3, autorot=0;

// Called once to initialize
function InitWebGL()
{
	// Initialize the WebGL canvas
	canvas = document.getElementById("canvas");
	canvas.oncontextmenu = function() {return false;};
	gl = canvas.getContext("webgl", {antialias: false, depth: true});	// Initialize the GL context
	if (!gl) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}
	
	// Initialize settings
	gl.clearColor(0,0,0,0);
	gl.enable(gl.DEPTH_TEST);
	
	// Initialize the programs and buffers for drawing
	boxDrawer  = new BoxDrawer();
	meshDrawer = new MeshDrawer();
	
	// Set the viewport size
	UpdateCanvasSize();
}

// Called every time the window size is changed.
function UpdateCanvasSize()
{
	canvas.style.width  = "100%";
	canvas.style.height = "100%";
	const pixelRatio = window.devicePixelRatio || 1;
	canvas.width  = pixelRatio * canvas.clientWidth;
	canvas.height = pixelRatio * canvas.clientHeight;
	const width  = (canvas.width  / pixelRatio);
	const height = (canvas.height / pixelRatio);
	canvas.style.width  = width  + 'px';
	canvas.style.height = height + 'px';
	gl.viewport( 0, 0, canvas.width, canvas.height );
	UpdateProjectionMatrix();
}

function ProjectionMatrix( c, z, fov_angle=60 )
{
	var r = c.width / c.height;
	var n = (z - 1.74);
	const min_n = 0.001;
	if ( n < min_n ) n = min_n;
	var f = (z + 1.74);;
	var fov = 3.145 * fov_angle / 180;
	var s = 1 / Math.tan( fov/2 );
	return [
		s/r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, (n+f)/(f-n), 1,
		0, 0, -2*n*f/(f-n), 0
	];
}

function UpdateProjectionMatrix()
{
	perspectiveMatrix = ProjectionMatrix( canvas, transZ );
}

// This is the main function that handled WebGL drawing
function DrawScene()
{
	var mv  = GetModelViewMatrix( 0, 0, transZ, rotX, autorot+rotY );
	var mvp = MatrixMult( perspectiveMatrix, mv );

	// Clear the screen and the depth buffer.
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	
	// Draw the curve and then the line segments that connect the control points.
	var nrmTrans = [ mv[0],mv[1],mv[2], 
					 mv[4],mv[5],mv[6], 
					 mv[8],mv[9],mv[10], 
					];
	meshDrawer.draw( mvp, mv, nrmTrans );
	if ( showBox.checked ) {
		boxDrawer.draw( mvp );
	}
}

// This is a helper function for compiling the given vertex and fragment shader source code into a program.
function InitShaderProgram( vsSource, fsSource, wgl=gl )
{
	const vs = CompileShader( wgl.VERTEX_SHADER,   vsSource, wgl );
	const fs = CompileShader( wgl.FRAGMENT_SHADER, fsSource, wgl );

	const prog = wgl.createProgram();
	wgl.attachShader(prog, vs);
	wgl.attachShader(prog, fs);
	wgl.linkProgram(prog);

	if (!wgl.getProgramParameter(prog, wgl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + wgl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}

// This is a helper function for compiling a shader, called by InitShaderProgram().
function CompileShader( type, source, wgl=gl )
{
	let typeStr = ""; 
	if(type === wgl.VERTEX_SHADER){
		typeStr = "vertex"; 
	}else if(type === wgl.FRAGMENT_SHADER){
		typeStr = "fragment"
	}

	const shader = wgl.createShader(type);
	wgl.shaderSource(shader, source);
	wgl.compileShader(shader);
	if (!wgl.getShaderParameter( shader, wgl.COMPILE_STATUS) ) {
		alert(`An error occurred compiling ${typeStr} shader:\n` + wgl.getShaderInfoLog(shader));
		wgl.deleteShader(shader);
		return null;
	}
	return shader;
}

///////////////////////////////////////////////////////////////////////////////////
// Below are the main UI control and SVG update functions.
///////////////////////////////////////////////////////////////////////////////////

var showBox;

window.onload = function() {
	showBox = document.getElementById('show-box');
	InitWebGL();
	lightView = new LightView();
	canvas.zoom = function( s ) {
		transZ *= s/canvas.height + 1;
		UpdateProjectionMatrix();
		DrawScene();
	}
	canvas.onwheel = function() { canvas.zoom(0.3*event.deltaY); }
	canvas.onmousedown = function() {
		var cx = event.clientX;
		var cy = event.clientY;
		if ( event.ctrlKey ) {
			canvas.onmousemove = function() {
				canvas.zoom(5*(event.clientY - cy));
				cy = event.clientY;
			}
		} else {
			canvas.onmousemove = function() {
				rotY += (cx - event.clientX)/canvas.width*5;
				rotX += (cy - event.clientY)/canvas.height*5;
				cx = event.clientX;
				cy = event.clientY;
				UpdateProjectionMatrix();
				DrawScene();
			}
		}
	}
	canvas.onmouseup = canvas.onmouseleave = function() {
		canvas.onmousemove = null;
	}
	
	SetShininess( document.getElementById('shininess-exp') );
	SetLightIntensity( document.getElementById('light-intensity'));
	SetLightColor( document.getElementById('light-color'));
	SetSpecColor(document.getElementById('highlight-color'));
	
	DrawScene();
};
function WindowResize()
{
	UpdateCanvasSize();
	DrawScene();
}

var timer;
function AutoRotate( param )
{
	if ( param.checked ) {
		timer = setInterval( function() {
				var v = document.getElementById('rotation-speed').value;
				autorot += 0.0005 * v;
				if ( autorot > 2*Math.PI ) autorot -= 2*Math.PI;
				DrawScene();
			}, 30
		);
		document.getElementById('rotation-speed').disabled = false;
	} else {
		clearInterval( timer );
		document.getElementById('rotation-speed').disabled = true;
	}
}

function ShowTexture( param )
{
	meshDrawer.showTexture( param.checked );
	DrawScene();
}

function SwapYZ( param )
{
	meshDrawer.swapYZ( param.checked );
	DrawScene();
}

function LoadObj( param )
{
	if ( param.files && param.files[0] ) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var mesh = new ObjMesh;
			mesh.parse( e.target.result );
			var box = mesh.getBoundingBox();
			var shift = [
				-(box.min[0]+box.max[0])/2,
				-(box.min[1]+box.max[1])/2,
				-(box.min[2]+box.max[2])/2
			];
			var size = [
				(box.max[0]-box.min[0])/2,
				(box.max[1]-box.min[1])/2,
				(box.max[2]-box.min[2])/2
			];
			var maxSize = Math.max( size[0], size[1], size[2] );
			var scale = 1/maxSize;
			mesh.shiftAndScale( shift, scale );
			var buffers = mesh.getVertexBuffers();
			meshDrawer.setMesh( buffers.positionBuffer, buffers.texCoordBuffer, buffers.normalBuffer );
			DrawScene();
		}
		reader.readAsText( param.files[0] );
	}
}

function LoadTexture( param )
{
	if ( param.files && param.files[0] ) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var img = document.getElementById('texture-img');
			img.onload = function() {
				meshDrawer.setTexture( img );
				DrawScene();
			}
			img.src = e.target.result;
		};
		reader.readAsDataURL( param.files[0] );
	}
}

function SetShininess( param )
{
	var exp = param.value;
	var s = Math.pow(10,exp/25);
	document.getElementById('shininess-value').innerText = s.toFixed( s < 10 ? 2 : 0 );
	meshDrawer.setShininess(s);
	DrawScene();
}

function SetLightIntensity(param){
	const intensity = param.value; 
	document.getElementById('intensity-value').innerText = param.value;
	meshDrawer.setLightIntensity(intensity);
	DrawScene();
}

function HexToRGB(hex){
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
	  r: parseInt(result[1], 16)/255,
	  g: parseInt(result[2], 16)/255,
	  b: parseInt(result[3], 16)/255
	} : null;

}

function SetLightColor(param){

	const hexcode = param.value;
	const color = HexToRGB(hexcode); 

	meshDrawer.setLightColor(color); 
	DrawScene()
}

function SetSpecColor(param){
	const hexcode = param.value;
	const color = HexToRGB(hexcode); 

	meshDrawer.setSpecColor(color)
	DrawScene()
}

///////////////////////////////////////////////////////////////////////////////////