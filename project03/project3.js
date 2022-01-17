// [TO-DO] Complete the implementation of the following class and the vertex shader below.

class CurveDrawer {
	constructor()
	{
		this.prog   = InitShaderProgram( curvesVS, curvesFS );
		// [TO-DO] Other initializations should be done here.
		// [TO-DO] This is a good place to get the locations of attributes and uniform variables.
		this.mvp = gl.getUniformLocation(this.prog, 'mvp'); 
		this.p0 = gl.getUniformLocation(this.prog, 'p0');
		this.p1 = gl.getUniformLocation(this.prog, 'p1');
		this.p2 = gl.getUniformLocation(this.prog, 'p2');
		this.p3 = gl.getUniformLocation(this.prog, 'p3');

		this.t = gl.getAttribLocation(this.prog, 't');
		// Initialize the attribute buffer
		this.steps = 100;
		var tv = [];
		for ( var i=0; i<this.steps; ++i ) {
			tv.push( i / (this.steps-1) );
		}
		// [TO-DO] This is where you can create and set the contents of the vertex buffer object
		// for the vertex attribute we need.
		this.buffer = gl.createBuffer(); 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tv), gl.STATIC_DRAW);
	}
	setViewport( width, height )
	{
		console.log("width: ", width);
		console.log("height: ", height);
		// [TO-DO] This is where we should set the transformation matrix.
		// [TO-DO] Do not forget to bind the program before you set a uniform variable value.
		let trans = [
					2/width,0,0,0,	
					0,2/height,0,0,	
					0,0,1,0,
					-1,0,0,1
				];
		gl.useProgram( this.prog );	// Bind the program
		gl.uniformMatrix4fv(this.mvp, false, trans)
	}
	updatePoints( pt )
	{
		// [TO-DO] The control points have changed, we must update corresponding uniform variables.
		// [TO-DO] Do not forget to bind the program before you set a uniform variable value.
		// [TO-DO] We can access the x and y coordinates of the i^th control points using
		// var x = pt[i].getAttribute("cx");
		// var y = pt[i].getAttribute("cy");

		gl.useProgram( this.prog );	// Bind the program

		let p = [];
		for(let i = 0; i < pt.length; ++i){
			let x = pt[i].getAttribute('cx'); 
			let y = pt[i].getAttribute('cy'); 
			p.push([x,y]);
		}
		console.log("p0: x- ", p[0][0], " y- ", p[0][1]);
		console.log("p1: x- ", p[1][0], " y- ", p[1][1]);
		console.log("p2: x- ", p[2][0], " y- ", p[2][1]);
		console.log("p3: x- ", p[3][0], " y- ", p[3][1]);

		gl.uniform2fv(this.p0, p[0]); 
		gl.uniform2fv(this.p1, p[1]); 
		gl.uniform2fv(this.p2, p[2]); 
		gl.uniform2fv(this.p3, p[3]); 

	}
	draw()
	{
		// [TO-DO] This is where we give the command to draw the curve.
		// [TO-DO] Do not forget to bind the program and set the vertex attribute.
		gl.useProgram(this.prog); 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer); 
		gl.vertexAttribPointer(this.t, 1, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.t); 
		gl.drawArrays(gl.LINE_STRIP, 0, this.steps);

	}
}

// Vertex Shader
var curvesVS = `
	attribute float t;
	uniform mat4 mvp;
	uniform vec2 p0;
	uniform vec2 p1;
	uniform vec2 p2;
	uniform vec2 p3;
	void main()
	{
		// [TO-DO] Replace the following with the proper vertex shader code
		float lerp_p0p1_x = (p1.x - p0.x) * t + p0.x;
		float lerp_p0p1_y = (p1.y - p0.y) * t + p0.y;
		gl_Position = mvp * vec4(lerp_p0p1_x,lerp_p0p1_y,0,1);
	}
`;

// Fragment Shader
var curvesFS = `
	precision mediump float;
	void main()
	{
		gl_FragColor = vec4(1,0,0,1);
	}
`;