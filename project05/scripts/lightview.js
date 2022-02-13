///////////////////////////////////////////////////////////////////////////////////
// Below is the light view control code
///////////////////////////////////////////////////////////////////////////////////

var lightView;

class LightView
{
	constructor()
	{
		this.canvas = document.getElementById("lightcontrol");
		this.canvas.oncontextmenu = function() {return false;};
		this.gl = this.canvas.getContext("webgl", {antialias: false, depth: true});	// Initialize the GL context
		if (!this.gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
			return;
		}
		
		// Initialize settings
		this.gl.clearColor(0.33,0.33,0.33,0);
		this.gl.enable(gl.DEPTH_TEST);
		
		this.rotX = 0;
		this.rotY = 0;
		this.posZ = 5;
		
		this.resCircle = 32;
		this.resArrow = 16;
		this.buffer = this.gl.createBuffer();
		var data = [];
		for ( var i=0; i<=this.resCircle; ++i ) {
			var a = 2 * Math.PI * i / this.resCircle;
			var x = Math.cos(a);
			var y = Math.sin(a);
			data.push( x * .9 );
			data.push( y * .9 );
			data.push( 0 );
			data.push( x );
			data.push( y );
			data.push( 0 );
		}
		for ( var i=0; i<=this.resCircle; ++i ) {
			var a = 2 * Math.PI * i / this.resCircle;
			var x = Math.cos(a);
			var y = Math.sin(a);
			data.push( x );
			data.push( y );
			data.push( -.05 );
			data.push( x );
			data.push( y );
			data.push( 0.05 );
		}
		for ( var i=0; i<=this.resArrow; ++i ) {
			var a = 2 * Math.PI * i / this.resArrow;
			var x = Math.cos(a) * .07;
			var y = Math.sin(a) * .07;
			data.push( x );
			data.push( y );
			data.push( -1 );
			data.push( x );
			data.push( y );
			data.push( 0 );
		}
		data.push( 0 );
		data.push( 0 );
		data.push( -1.2 );
		for ( var i=0; i<=this.resArrow; ++i ) {
			var a = 2 * Math.PI * i / this.resArrow;
			var x = Math.cos(a) * .15;
			var y = Math.sin(a) * .15;
			data.push( x );
			data.push( y );
			data.push( -0.9 );
		}
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);
		
		// Set the viewport size
		this.canvas.style.width  = "";
		this.canvas.style.height = "";
		const pixelRatio = window.devicePixelRatio || 1;
		this.canvas.width  = pixelRatio * this.canvas.clientWidth;
		this.canvas.height = pixelRatio * this.canvas.clientHeight;
		const width  = (this.canvas.width  / pixelRatio);
		const height = (this.canvas.height / pixelRatio);
		this.canvas.style.width  = width  + 'px';
		this.canvas.style.height = height + 'px';
		this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
		this.proj = ProjectionMatrix( this.canvas, this.posZ, 30 );
		
		// Compile the shader program
		this.prog = InitShaderProgram( lightViewVS, lightViewFS, this.gl );
		this.mvp = this.gl.getUniformLocation( this.prog, 'mvp' );
		this.clr1 = this.gl.getUniformLocation( this.prog, 'clr1' );
		this.clr2 = this.gl.getUniformLocation( this.prog, 'clr2' );
		this.vertPos = this.gl.getAttribLocation( this.prog, 'pos' );
		
		this.draw();
		this.updateLightDir();
		
		this.canvas.onmousedown = function() {
			var cx = event.clientX;
			var cy = event.clientY;
			lightView.canvas.onmousemove = function() {
				lightView.rotY += (cx - event.clientX)/lightView.canvas.width*5;
				lightView.rotX += (cy - event.clientY)/lightView.canvas.height*5;
				cx = event.clientX;
				cy = event.clientY;
				lightView.draw();
				lightView.updateLightDir();
			}
		}
		this.canvas.onmouseup = this.canvas.onmouseleave = function() {
			lightView.canvas.onmousemove = null;
		}
	}
	
	updateLightDir()
	{
		var cy = Math.cos( this.rotY );
		var sy = Math.sin( this.rotY );
		var cx = Math.cos( this.rotX );
		var sx = Math.sin( this.rotX );
		meshDrawer.setLightDir( -sy, cy*sx, -cy*cx );
		// console.log("light dir--> x: ", -sy, " y: ",cy*sx ," z: ", -cy*cx);
		DrawScene();
	}
	
	draw()
	{
		// Clear the screen and the depth buffer.
		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );
		
		this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.buffer );
		this.gl.vertexAttribPointer( this.vertPos, 3, this.gl.FLOAT, false, 0, 0 );
		this.gl.enableVertexAttribArray( this.buffer );

		this.gl.useProgram( this.prog );
		var mvp = MatrixMult( this.proj, [ 1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,this.posZ,1 ] );
		this.gl.uniformMatrix4fv( this.mvp, false, mvp );
		this.gl.uniform3f( this.clr1, 0.6,0.6,0.6 );
		this.gl.uniform3f( this.clr2, 0,0,0 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.resCircle*2+2 );

		var mv  = GetModelViewMatrix( 0, 0, this.posZ, this.rotX, this.rotY );
		var mvp = MatrixMult( this.proj, mv );
		this.gl.uniformMatrix4fv( this.mvp, false, mvp );
		this.gl.uniform3f( this.clr1, 1,1,1 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, 0, this.resCircle*2+2 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, this.resCircle*2+2, this.resCircle*2+2 );
		this.gl.uniform3f( this.clr1, 0,0,0 );
		this.gl.uniform3f( this.clr2, 1,1,1 );
		this.gl.drawArrays( this.gl.TRIANGLE_STRIP, this.resCircle*4+4, this.resArrow*2+2 );
		this.gl.drawArrays( this.gl.TRIANGLE_FAN, this.resCircle*4+4 + this.resArrow*2+2, this.resArrow+2 );
	}
}

// Vertex shader source code
const lightViewVS = `
	attribute vec3 pos;
	uniform mat4 mvp;
	void main()
	{
		gl_Position = mvp * vec4(pos,1);
	}
`;
// Fragment shader source code
var lightViewFS = `
	precision mediump float;
	uniform vec3 clr1;
	uniform vec3 clr2;
	void main()
	{
		gl_FragColor = gl_FrontFacing ? vec4(clr1,1) : vec4(clr2,1);
	}
`;


