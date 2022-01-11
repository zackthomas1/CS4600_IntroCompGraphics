window.onload = function () {

    // Initialize WebGL
    const canvas = document.getElementById('mycanvas'); 
    gl = canvas.getContext('webgl'); 

    // set output resolution
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = pixelRatio * canvas.clientWidth; 
    canvas.height = pixelRatio * canvas.clientHeight;
    gl.viewport(0,0, canvas.width, canvas.height);

    // set start states
    gl.clearColor(1,1,1,0); 
    gl.lineWidth(1.0); 


    // Initialize vertex buffer objects
    // allocate memory for vertex data with javascript for CPU access
    let positions = [
            -0.8,  0.4,  0, 
             0.8,  0.4,  0, 
             0.8, -0.4,  0, 
            -0.8,  0.4,  0, 
             0.8, -0.4,  0, 
            -0.8, -0.4,  0 
            ]; 
    let colors = [
            1, 0, 0, 1, // red
            0, 1, 0, 1, // green
            0, 0, 1, 1, // blue
            1, 0, 0, 1, // red
            0, 0, 1, 1, // blue
            1, 0, 1, 1  // purple
        ];

    // Move Scene Data from CPU to GPU
    // create empty GPU memory buffer
    let position_buffer = gl.createBuffer(); 

    // bind position_buffer to be current active buffer
    gl.bindBuffer(
        gl.ARRAY_BUFFER, 
        position_buffer
    );

    // Allocate memory on the GPU for vertex position data
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        new Float32Array(positions), 
        gl.STATIC_DRAW
    );

    let color_buffer = gl.createBuffer(); 

    gl.bindBuffer(
        gl.ARRAY_BUFFER, 
        color_buffer
    ); 

    gl.bufferData(
        gl.ARRAY_BUFFER, 
        new Float32Array(colors), 
        gl.STATIC_DRAW
    );

    // compile vertex/fragment shader into program
    const vs_source = document.getElementById('vertexShader').text; 
    const vs = gl.createShader(gl.VERTEX_SHADER); 
    gl.shaderSource(vs, vs_source);
    gl.compileShader(vs); 

    if(! gl.getShaderParameter(vs, gl.COMPILE_STATUS)){ // error check shader compiled correctly
        console.log( "Vertex Shader:" + gl.getShaderInfoLog(vs)); 
        gl.deleteShader(vs);
    }

    const fs_source = document.getElementById('fragShader').text; 
    const fs = gl.createShader(gl.FRAGMENT_SHADER); 
    gl.shaderSource(fs, fs_source);
    gl.compileShader(fs); 

    if(! gl.getShaderParameter(fs, gl.COMPILE_STATUS)){ // error check shader compiled correctly
        console.log( "Frag Shader:" + gl.getShaderInfoLog(fs)); 
        gl.deleteShader(fs);
    }

    // link vertex shader and fragment shader and create shader program
    prog = gl.createProgram(); 
    gl.attachShader(prog, vs); 
    gl.attachShader(prog, fs); 
    gl.linkProgram(prog); 

    if(! gl.getProgramParameter(prog, gl.LINK_STATUS)){ // error check linking successful
        console.log(gl.getProgramInfoLog(prog));
    }

    // Update shader uniform variables
    let m = gl.getUniformLocation(prog, 'trans'); 
    let matrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    gl.useProgram(prog); 
    gl.uniformMatrix4fv(m,false, matrix); 

    // 
    let pos = gl.getAttribLocation(prog, 'pos'); 
    gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer); 
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(pos);

    let color = gl.getAttribLocation(prog, 'clr'); 
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer); 
    gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(color);


    //
    gl.clear(gl.COLOR_BUFFER_BIT); 
    gl.useProgram(prog); 
    gl.drawArrays(gl.TRIANGLES, 0, 6); 
};



