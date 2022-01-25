
// Multiplies two matrices and returns the result A*B.
// The arguments A and B are arrays, representing column-major matrices.
function MatrixMult( A, B )
{
	var C = [];
	for ( var i=0; i<4; ++i ) {
		for ( var j=0; j<4; ++j ) {
			var v = 0;
			for ( var k=0; k<4; ++k ) {
				v += A[j+4*k] * B[k+4*i];
			}
			if (!isNaN(v)){
				C.push(v);
			}
		}
	}
	return C;
}

function transposeMatrix(matrix){
	let output = []; 
	for(let col = 0; col < 4; col++){
		for(let row = 0; row < 4; row++){
			output.push(matrix[col + (row * 4)])
		}
	}
	return output;
}

// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{

	// row-major transformation matrices
	let translate = [
		1,0,0,translationX,
		0,1,0,translationY,
		0,0,1,translationZ,
		0,0,0,1
	];

	let rotateX = [
		1,0,0,0,
		0,Math.cos(rotationX),Math.sin(rotationX),0,
		0,-Math.sin(rotationX),Math.cos(rotationX),0,
		0,0,0,1,
	];

	let rotateY = [
		Math.cos(rotationY),0, -Math.sin(rotationY),0,
		0,1,0,0,
		Math.sin(rotationY),0, Math.cos(rotationY),0,
		0,0,0,1,
	];

	// transpose to column-major
	let rotation = transposeMatrix(MatrixMult(rotateX, rotateY)); 
	var translation = transposeMatrix(translate); 

	var mvp = MatrixMult( projectionMatrix, MatrixMult(translation, rotation));
	// console.log("mvp: ", mvp);
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{

		// [TO-DO] initializations
		this.prog = InitShaderProgram(meshVS, meshFS);
		
		this.mvp = gl.getUniformLocation(this.prog, 'mvp'); 
		this.yzSwap = gl.getUniformLocation(this.prog, 'yzSwap');
		this.showTex = gl.getUniformLocation(this.prog, 'showTex'); 

		this.vertPos = gl.getAttribLocation(this.prog, 'pos');
		this.texCoord = gl.getAttribLocation(this.prog, 'txc');

		this.vertbuffer = gl.createBuffer(); 
		this.texbuffer = gl.createBuffer(); 

		this.numTriangles = 0;

		this.yz = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1];
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		
		// 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		if(swap){
			this.yz = MatrixMult(
				[
					1,0,0,0,
					0,-1,0,0,
					0,0,1,0,
					0,0,0,1], 
				[
					1,0,0,0,
					0,Math.cos(Math.PI/2),Math.sin(Math.PI/2),0,
					0,-Math.sin(Math.PI/2),Math.cos(Math.PI/2),0,
					0,0,0,1,
				]);
		}else{
			this.yz = [
				1,0,0,0,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1];
		}
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog); 
		gl.uniformMatrix4fv(this.mvp, false, trans);
		gl.uniformMatrix4fv(this.yzSwap,false, this.yz); 
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer); 
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0); 
		gl.enableVertexAttribArray( this.vertPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer); 
		gl.enableVertexAttribArray(this.texCoord);
		gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
 
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		// You can set the texture image data using the following command.
		gl.texImage2D( 
			gl.TEXTURE_2D, 
			0, 
			gl.RGB, 
			gl.RGB, 
			gl.UNSIGNED_BYTE, 
			img );

		// Set texture parameters 
		gl.generateMipmap(gl.TEXTURE_2D);		

		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.useProgram(this.prog); 
		gl.activeTexture(gl.TEXTURE0); 
		gl.bindTexture(gl.TEXTURE_2D, texture); 
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler,0);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog)
		gl.uniform1i(this.showTex, show); 
	}
}

const meshVS = `
			attribute vec3 pos; 
			attribute vec2 txc; 

			uniform mat4 mvp; 
			uniform mat4 yzSwap;

			varying vec2 texCoord; 

			void main()
			{
				texCoord = txc;
				gl_Position = mvp * yzSwap * vec4(pos,1.0); 
			}`;

const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform sampler2D tex;

			varying vec2 texCoord;

			void main()
			{
				if (showTex){
					gl_FragColor = texture2D(tex, texCoord);
				}else{
					gl_FragColor =  vec4(1.0, 0.0, 0.0, 1.0);
				}
			}`;


