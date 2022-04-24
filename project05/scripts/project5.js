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
			C.push(v);
		}
	}
	return C;
}

// 
function transposeMatrix(matrix){
	let output = []; 
	for(let col = 0; col < 4; col++){
		for(let row = 0; row < 4; row++){
			output.push(matrix[col + (row * 4)])
		}
	}
	return output;
}

// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.

	const rotateX = [
		1,0,0,0,
		0,Math.cos(rotationX),Math.sin(rotationX),0,
		0,-Math.sin(rotationX),Math.cos(rotationX),0,
		0,0,0,1,
	];

	const rotateY = [
		Math.cos(rotationY),0, -Math.sin(rotationY),0,
		0,1,0,0,
		Math.sin(rotationY),0, Math.cos(rotationY),0,
		0,0,0,1,
	];

	const rotation = transposeMatrix(MatrixMult(rotateX, rotateY)); 

	const trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	var mv = MatrixMult(trans, rotation);
	return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		// comile shader program 
		this.prog = InitShaderProgram(meshVS, meshFS); 

		// get attribute locations
		this.positionLoc = gl.getAttribLocation(this.prog, 'position');
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');

		// get uniform locations 
		//vertex
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp'); 
		this.mvLoc = gl.getUniformLocation(this.prog, 'mv'); 
		this.mvNormalLoc = gl.getUniformLocation(this.prog, 'normalMV'); 
		this.yzSwapLoc = gl.getUniformLocation(this.prog, 'yzSwap');

		// fragment
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
		this.lightDirLoc = gl.getUniformLocation(this.prog, 'lightDir');
		this.lightColorLoc = gl.getUniformLocation(this.prog, 'lightColor');
		this.specColorLoc = gl.getUniformLocation(this.prog, 'specColor');
		this.lightIntensityLoc = gl.getUniformLocation(this.prog, 'lightIntensity');
		this.phongExpoLoc = gl.getUniformLocation(this.prog, 'phongExpo');

		// create array buffers
		this.positionBuffer = gl.createBuffer(); 
		this.normalBuffer = gl.createBuffer(); 
		this.texcoordBuffer = gl.createBuffer(); 

		this.numTriangles = 0;
		this.yzSwapMat = [
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		];
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW); 

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW); 

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW); 

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{

		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		if (swap){
			this.yzSwapMat = MatrixMult(
				[
					1,0,0,0,
					0,-1,0,0,
					0,0,1,0,
					0,0,0,1
				],
				[
					1,0,0,0,
					0,Math.cos(Math.PI/2),Math.sin(Math.PI/2),0,
					0,-Math.sin(Math.PI/2),Math.cos(Math.PI/2),0,
					0,0,0,1,
				]
			);
		}else{
			this.yzSwapMat = [
				1,0,0,0,
				0,1,0,0,
				0,0,1,0,
				0,0,0,1
			]
		}
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog)

		// Set uniform parameters
		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV); 
		gl.uniformMatrix3fv(this.mvNormalLoc, false, matrixNormal);
		gl.uniformMatrix4fv(this.yzSwapLoc, false, this.yzSwapMat);

		// Set Vertex attributes 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer); 
		gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.positionLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); 
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0); 
		gl.enableVertexAttribArray(this.normalLoc); 

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer); 
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT,false, 0, 0); 
		gl.enableVertexAttribArray(this.texCoordLoc); 

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
			img
		);

		// set texture parameters 
		gl.generateMipmap(gl.TEXTURE_2D); 

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAR_FILTER, gl.LINEAR); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAR_FILTER, gl.LINEAR_MIPMAP_LINEAR); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); 

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.useProgram(this.prog); 
		gl.activeTexture(gl.TEXTURE0); 
		gl.bindTexture(gl.TEXTURE_2D, texture); 
		const samplerLoc = gl.getUniformLocation(this.prog, 'tex'); 
		gl.uniform1i(samplerLoc, 0);

	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog); 
		gl.uniform1i(this.showTexLoc, show);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDirLoc,x,y,z)
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog); 
		gl.uniform1f(this.phongExpoLoc, shininess);
	}

	setLightIntensity(intensity){
		gl.useProgram(this.prog); 
		gl.uniform1f(this.lightIntensityLoc, intensity);
	}

	setLightColor(color){
		gl.useProgram(this.prog); 
		gl.uniform3f(this.lightColorLoc, color.r, color.g, color.b);
	}

	setSpecColor(color){
		gl.useProgram(this.prog); 
		gl.uniform3f(this.specColorLoc, color.r, color.g, color.b);
	}
	
}

const meshVS = `
	// vertex attributes 
	attribute vec3 position; 
	attribute vec3 normal; 
	attribute vec2 texCoord; 

	// input uniforms 
	uniform mat4 mvp;
	uniform mat4 mv; 
	uniform mat3 normalMV; 
	uniform mat4 yzSwap; 

	// outputs to fragment shader
	varying vec2 v_texCoord; 
	varying vec3 v_viewNormal; 
	varying vec4 v_viewFragPos; 

	void main(){
		v_viewNormal = normalMV * normal;
		v_texCoord = texCoord;
		v_viewFragPos = mv * vec4(position,0.0);

		gl_Position = mvp * yzSwap * vec4(position, 1.0);
	}
`; 

const meshFS = `
	precision mediump float;

	// input uniforms 
	uniform bool showTex;
	uniform vec3 lightDir;
	uniform vec3 lightColor;
	uniform vec3 specColor;
	uniform float lightIntensity;
	uniform float phongExpo;

	uniform sampler2D tex;

	// inputs from vertex shader
	varying vec2 v_texCoord; 
	varying vec3 v_viewNormal;
	varying vec4 v_viewFragPos; 

	void main(){

		vec4 diffuseColor = vec4(1.0); // Cr
		if(showTex){
			diffuseColor = texture2D(tex, v_texCoord);
		}else{
			diffuseColor =  vec4(1.0, 0.1, 0.1, 1.0);
		}

		// dot product between normalized normal and lightDir vectors results 
		// in cos(theta) where theta is the angle between the two vectors 
		float geometryTerm = max(0.0,dot(normalize(v_viewNormal), normalize(lightDir))); 

		vec4 lightingColor = lightIntensity * vec4(lightColor, 1.0); // Cl
		vec4 ambientColor =  lightIntensity * vec4(0.1,0.1,0.1,1.0); // Ca

		vec4 diffuseLighting = diffuseColor * (ambientColor + (lightingColor * geometryTerm));

		vec3 viewDir = normalize(vec3(v_viewFragPos) - vec3(0.0));
		vec3 halfAngle = normalize(lightDir + viewDir);

		float cosOmega = max(0.0, dot(halfAngle, normalize(v_viewNormal)));
		vec4 specularLighting = lightIntensity * vec4(specColor,1.0) *  vec4(lightColor, 1.0) * pow(cosOmega, phongExpo);

		gl_FragColor = diffuseLighting + specularLighting;
		// gl_FragColor = vec4(halfAngle,1.0);
		// gl_FragColor = vec4(v_viewNormal,1.0);
	}
`;

