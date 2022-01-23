///////////////////////////////////////////////////////////////////////////////////
// Below is the code for the object that draws lines.
///////////////////////////////////////////////////////////////////////////////////
class BoxDrawer {
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram( boxVS, boxFS );
		
		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		
		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		
		// Create the buffer objects
		
		this.vertbuffer = gl.createBuffer();
		var pos = [
			-1, -1, -1,
			-1, -1,  1,
			-1,  1, -1,
			-1,  1,  1,
			 1, -1, -1,
			 1, -1,  1,
			 1,  1, -1,
			 1,  1,  1 ];
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

		this.linebuffer = gl.createBuffer();
		var line = [
			0,1,   1,3,   3,2,   2,0,
			4,5,   5,7,   7,6,   6,4,
			0,4,   1,5,   3,7,   2,6 ];
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.linebuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(line), gl.STATIC_DRAW);
	}
	draw( trans )
	{
		// Draw the line segments
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, trans );
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.linebuffer );
		gl.drawElements( gl.LINES, 24, gl.UNSIGNED_BYTE, 0 );
	}
}
// Vertex shader source code
var boxVS = `
	attribute vec3 pos;
	uniform mat4 mvp;
	void main()
	{

		gl_Position = mvp * vec4(pos,1);
	}
`;
// Fragment shader source code
var boxFS = `
	precision mediump float;
	void main()
	{
		gl_FragColor = vec4(1,1,1,1);
	}
`;
///////////////////////////////////////////////////////////////////////////////////

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

function UpdateProjectionMatrix()
{
	var r = canvas.width / canvas.height;
	var n = (transZ - 1.74);
	const min_n = 0.001;
	if ( n < min_n ) n = min_n;
	var f = (transZ + 1.74);;
	var fov = 3.145 * 60 / 180;
	var s = 1 / Math.tan( fov/2 );
	perspectiveMatrix = [
		s/r, 0, 0, 0,
		0, s, 0, 0,
		0, 0, (n+f)/(f-n), 1,
		0, 0, -2*n*f/(f-n), 0
	];
}

// This is the main function that handled WebGL drawing
function DrawScene()
{
	// console.log("rotate x: ", rotX); 
	// console.log("rotate y: ", rotY); 

	var mvp = GetModelViewProjection( perspectiveMatrix, 0, 0, transZ, rotX, autorot+rotY );

	// Clear the screen and the depth buffer.
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
	
	// Draw the curve and then the line segments that connect the control points.
	meshDrawer.draw( mvp );
	if ( showBox.checked ) {
		boxDrawer.draw( mvp );
	}
}

// This is a helper function for compiling the given vertex and fragment shader source code into a program.
function InitShaderProgram( vsSource, fsSource )
{
	const vs = CompileShader( gl.VERTEX_SHADER,   vsSource );
	const fs = CompileShader( gl.FRAGMENT_SHADER, fsSource );

	const prog = gl.createProgram();
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);

	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(prog));
		return null;
	}
	return prog;
}

// This is a helper function for compiling a shader, called by InitShaderProgram().
function CompileShader( type, source )
{
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter( shader, gl.COMPILE_STATUS) ) {
		alert('An error occurred compiling shader:\n' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}



///////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////
// Below are the main UI control and SVG update functions.
///////////////////////////////////////////////////////////////////////////////////

var showBox;

window.onload = function() {
	showBox = document.getElementById('show-box');
	InitWebGL();
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
			meshDrawer.setMesh( buffers.positionBuffer, buffers.texCoordBuffer );
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

///////////////////////////////////////////////////////////////////////////////////