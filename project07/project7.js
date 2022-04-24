// Multiplies two matrices and returns the result A*B.
// The arguments A and B are arrays, representing column-major matrices.
function MatrixMult( A, B )
{
    var C = Array(16);
    for ( var i=0, m=0; i<4; ++i ) {
        for ( var j=0; j<4; ++j, ++m ) {
            var v = 0;
            for ( var k=0; k<4; ++k ) {
                v += A[j+4*k] * B[k+4*i];
            }
            C[m] = v;
        }
    }
    return C;
}

// Transposes a matrix across 
// argument matrix is a 4x4 matrix
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
	let rotateX = [
		1,0,0,0,
		0,Math.cos(rotationX),Math.sin(rotationX),0, 
		0,-Math.sin(rotationX),Math.cos(rotationX),0, 
		0,0,0,1,
	]

	let rotateY = [
		Math.cos(rotationY),0,-Math.sin(rotationY),0, 
		0,1,0,0,
		Math.sin(rotationY),0,Math.cos(rotationY),0, 
		0,0,0,1,
	]

	let rotation = transposeMatrix(MatrixMult(rotateX, rotateY)); 

	var trans = [
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
		this.prog = InitShaderProgram(meshVS, meshFS)

		// get attribute locations 
		this.positionLoc = gl.getAttribLocation(this.prog, 'position');
		this.normalLoc = gl.getAttribLocation(this.prog, 'normal'); 
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');

		// get uniform locations 
		//vertex 
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp'); 
		this.mvLoc = gl.getUniformLocation(this.prog, 'mv'); 
		this.mvNormalLoc = gl.getUniformLocation(this.prog, 'normalMV'); 		

		//fragment
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
		this.lightDirLoc = gl.getUniformLocation(this.prog, 'lightDir');
		this.phongExpoLoc = gl.getUniformLocation(this.prog, 'phongExpo');

		// create array buffers
		this.positionBuffer = gl.createBuffer(); 
		this.normalBuffer = gl.createBuffer(); 
		this.texCoordBuffer = gl.createBuffer(); 

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

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer); 
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW); 

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram(this.prog); 

		// Set uniform parameters
		//vertex 
		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP); 
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV); 
		gl.uniformMatrix3fv(this.mvNormalLoc, false, matrixNormal); 

		// Set Vertex attributes
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer); 
		gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.positionLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer); 
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer); 
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
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

		// Set texture parameters
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAR_FILTER, gl.LINEAR); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAR_FILTER, gl.LINEAR_MIPMAP_LINEAR); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); 

		//
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
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle
	forces.fill(new Vec3(0,0,0));

	// [TO-DO] Compute the total force of each particle
	for(let i = 0; i < springs.length; i++){
		let spring = springs[i];

		// spring attributes
		let x0 = positions[spring.p0]; // particle position
		let x1 = positions[spring.p1];
		let v0 = velocities[spring.p0]; // particle velocity
		let v1 = velocities[spring.p1]; 

		// caculate spring force
		let length = x1.sub(x0).len();
		let restLengh= spring.rest; 
		let springDirection = x1.sub(x0).div(length); 

		// caculate spring force
		let springForce = springDirection.mul(stiffness * (length - restLengh)); //stiffness * (length - restlength) * springDir

		// add spring force
		forces[spring.p0] = forces[spring.p0].add(springForce); 
		forces[spring.p1] = forces[spring.p1].add(springForce.mul(-1.0));

		// caculate damping force 
		let lengthChangeSpeed = v1.sub(v0).dot(springDirection); // (v1-v0) * springDir
		let dampingForce = springDirection.mul(lengthChangeSpeed).mul(damping)

		// add damping force 
		forces[spring.p0] = forces[spring.p0].add(dampingForce); 
		forces[spring.p1] = forces[spring.p1].add(dampingForce.mul(-1.0));
	}
	
	// [TO-DO] Update positions and velocities
	for(let i = 0; i < velocities.length; i++){
		let acceleration = forces[i].div(particleMass).add(gravity); 
		let velocity = velocities[i].add(acceleration.mul(dt)); 
		velocities[i] = velocity; 
	}

	// positions.forEach( pos => pos.y -= 0.05); // alt iteration method
	for(let i = 0; i < positions.length; i++){
		let pos = positions[i].add(velocities[i].mul(dt));
		positions[i] = pos;
	}
	
	// [TO-DO] Handle collisions
	for(let i = 0; i < positions.length; i++){
		
		let floor = new Vec3(-1.0,-1.0,-1.0); 
		let ceiling = new Vec3(1.0,1.0,1.0); 
		
		let pos = positions[i];
		let vel = velocities[i]; 
		
		if(pos.x < floor.x){
			let h = Math.abs(pos.x) - Math.abs(floor.x); 
			pos.x += h + (h * restitution);
			vel.x = vel.x*(-1.0 * restitution);
		}
		if(pos.y < floor.y){
			let h = Math.abs(pos.y) - Math.abs(floor.y); 
			pos.y += h + (h * restitution);
			vel.y = vel.y*(-1.0 * restitution);
		}
		if(pos.z < floor.z){
			let h = Math.abs(pos.z) - Math.abs(floor.z); 
			pos.z += h + (h * restitution);
			vel.z = vel.z*(-1.0 * restitution);
		}

		if(pos.x > ceiling.x){
			let h = Math.abs(pos.x) - Math.abs(ceiling.x); 
			pos.x -= h + (h * restitution);
			vel.x = vel.x*(-1.0 * restitution);
		}
		if(pos.y > ceiling.y){
			let h = Math.abs(pos.y) - Math.abs(ceiling.y); 
			pos.y -= h + (h * restitution);
			vel.y = vel.y*(-1.0 * restitution);
		}
		if(pos.z > ceiling.z){
			let h = Math.abs(pos.z) - Math.abs(ceiling.z); 
			pos.z -= h + (h * restitution);
			vel.z = vel.z*(-1.0 * restitution);
		}


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

// outputs to framgment shader 
varying vec2 v_texCoord; 
varying vec3 v_viewNormal; 
varying vec4 v_viewFragPos; 

void main(){
	v_texCoord = texCoord; 
	v_viewNormal = normalMV * normal; 
	v_viewFragPos = mv * vec4(position, 1.0); 

	gl_Position = mvp * vec4(position, 1.0);  
}`;

const meshFS = `
precision mediump float; 

// input uniforms 
uniform bool showTex; 
uniform vec3 lightDir; 
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
		diffuseColor =  vec4(0.3, 0.3, 0.3, 0.0);
	}

	// dot product between normalized normal and lightDir vectors results 
	// in cos(theta) where theta is the angle between the two vectors 
	float geometryTerm = max(0.0,dot(normalize(v_viewNormal), normalize(lightDir))); 

	float lightIntensity = 2.0;

	// diffuse component
	vec4 lightingColor = lightIntensity * vec4(1.0, 1.0, 1.0, 1.0); // Cl
	vec4 ambientColor =  lightIntensity * vec4(0.1,0.1,0.1,1.0); // Ca
	
	vec4 diffuseLighting = diffuseColor * (ambientColor + (lightingColor * geometryTerm));

	// specular component
	vec3 viewDir = normalize(vec3(v_viewFragPos) - vec3(0.0));
	vec3 halfAngle = normalize(lightDir + viewDir);

	float cosOmega = max(0.0, dot(halfAngle, normalize(v_viewNormal)));
	vec4 specularLighting = lightIntensity * vec4(1.0,1.0,1.0,1.0) *  vec4(1.0,1.0,1.0, 1.0) * pow(cosOmega, phongExpo);

	gl_FragColor = diffuseLighting + specularLighting;
}`;

