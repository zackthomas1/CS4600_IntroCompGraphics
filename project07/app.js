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
// Below is the code for the object that draws the selected vertex.
///////////////////////////////////////////////////////////////////////////////////
class PointDrawer {
    constructor()
    {
        // Compile the shader program
        this.prog = InitShaderProgram( pointVS, pointFS );
        
        // Get the ids of the uniform variables in the shaders
        this.mvp = gl.getUniformLocation( this.prog, 'mvp' );

        // Get the ids of the vertex attributes in the shaders
        this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
        
        // Create the buffer objects
        this.vertbuffer = gl.createBuffer();
    }
    setPoint(p)
    {
        if ( this.selVertex == p ) return false;
        this.selVertex = p;
        this.updatePoint();
        return true;
    }
    updatePoint()
    {
        if ( this.selVertex !== undefined ) {
            var pos = [ this.selVertex.x, this.selVertex.y, this.selVertex.z ];
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        }
    }
    draw( trans )
    {
        if ( this.selVertex ) {
            gl.useProgram( this.prog );
            gl.uniformMatrix4fv( this.mvp, false, trans );
            gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
            gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
            gl.enableVertexAttribArray( this.vertPos );
            gl.disable(gl.DEPTH_TEST);
            gl.drawArrays( gl.POINTS, 0, 1 );
            gl.enable(gl.DEPTH_TEST);
        }
    }
}
// Vertex shader source code
var pointVS = `
    attribute vec3 pos;
    uniform mat4 mvp;
    void main()
    {
        gl_Position = mvp * vec4(pos,1);
        gl_PointSize = 10.0;
    }
`;
// Fragment shader source code
var pointFS = `
    precision mediump float;
    void main()
    {
        gl_FragColor = vec4(1,0,0,1);
    }
`;
///////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////
// Below is the core WebGL initialization code.
///////////////////////////////////////////////////////////////////////////////////
var boxDrawer;
var pointDrawer;
var meshDrawer;
var canvas, gl;
var rotX=0, rotY=0, transY=0, transZ=3;
var MV, MVP; // view matrices

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
    boxDrawer   = new BoxDrawer();
    pointDrawer = new PointDrawer();
    meshDrawer  = new MeshDrawer();
    
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
    UpdateViewMatrices();
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

function UpdateViewMatrices()
{
    var perspectiveMatrix = ProjectionMatrix( canvas, transZ );
    MV  = GetModelViewMatrix( 0, transY, transZ, rotX, rotY );
    MVP = MatrixMult( perspectiveMatrix, MV );
}

// This is the main function that handled WebGL drawing
function DrawScene()
{
    // Clear the screen and the depth buffer.
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
    // Draw the curve and then the line segments that connect the control points.
    var nrmTrans = [ MV[0],MV[1],MV[2], MV[4],MV[5],MV[6], MV[8],MV[9],MV[10] ];
    meshDrawer.draw( MVP, MV, nrmTrans );
    if ( showBox.checked ) {
        boxDrawer.draw( MVP );
    }
    pointDrawer.draw( MVP );
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
    const shader = wgl.createShader(type);
    wgl.shaderSource(shader, source);
    wgl.compileShader(shader);
    if (!wgl.getShaderParameter( shader, wgl.COMPILE_STATUS) ) {
        alert('An error occurred compiling shader:\n' + wgl.getShaderInfoLog(shader));
        wgl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Returns the inverse of the given 4x4 matrix
function MatrixInverse( m )
{
    var r = Array(16);
    
    var v_11_14__10_15 = m[11] * m[14] - m[10] * m[15];
    var v_10_15__11_14 = m[10] * m[15] - m[11] * m[14];
    var v__7_14___6_15 = m[ 7] * m[14] - m[ 6] * m[15];
    var v__6_11___7_10 = m[ 6] * m[11] - m[ 7] * m[10];

    var v__9_15__11_13 = m[ 9] * m[15] - m[11] * m[13];
    var v_11_13___9_15 = m[11] * m[13] - m[ 9] * m[15];
    var v__5_15___7_13 = m[ 5] * m[15] - m[ 7] * m[13];
    var v__7__9___5_11 = m[ 7] * m[ 9] - m[ 5] * m[11];
    
    var v_10_13___9_14 = m[10] * m[13] - m[ 9] * m[14];
    var v__9_14__10_13 = m[ 9] * m[14] - m[10] * m[13];
    var v__6_13___5_14 = m[ 6] * m[13] - m[ 5] * m[14];
    var v__5_10___6__9 = m[ 5] * m[10] - m[ 6] * m[ 9];
    
    var v_11_12___8_15 = m[11] * m[12] - m[ 8] * m[15];
    var v__8_15__11_12 = m[ 8] * m[15] - m[11] * m[12];
    var v__7_12___4_15 = m[ 7] * m[12] - m[ 4] * m[15];
    var v__4_11___7__8 = m[ 4] * m[11] - m[ 7] * m[ 8];
    
    var v__8_14__10_12 = m[ 8] * m[14] - m[10] * m[12];
    var v_10_12___8_14 = m[10] * m[12] - m[ 8] * m[14];
    var v__4_14___6_12 = m[ 4] * m[14] - m[ 6] * m[12];
    var v__6__8___4_10 = m[ 6] * m[ 8] - m[ 4] * m[10];
    
    var v__9_12___8_13 = m[ 9] * m[12] - m[ 8] * m[13];
    var v__8_13___9_12 = m[ 8] * m[13] - m[ 9] * m[12];
    var v__5_12___4_13 = m[ 5] * m[12] - m[ 4] * m[13];
    var v__4__9___5__8 = m[ 4] * m[ 9] - m[ 5] * m[ 8];

    r[ 0] = m[5] * (-v_11_14__10_15) + m[6] * (-v__9_15__11_13) + m[7] * (-v_10_13___9_14);
    r[ 1] = m[1] * (-v_10_15__11_14) + m[2] * (-v_11_13___9_15) + m[3] * (-v__9_14__10_13);
    r[ 2] = m[1] * (-v__7_14___6_15) + m[2] * (-v__5_15___7_13) + m[3] * (-v__6_13___5_14);
    r[ 3] = m[1] * (-v__6_11___7_10) + m[2] * (-v__7__9___5_11) + m[3] * (-v__5_10___6__9);
    
    r[ 4] = m[4] * ( v_11_14__10_15) + m[6] * (-v_11_12___8_15) + m[7] * (-v__8_14__10_12);
    r[ 5] = m[0] * ( v_10_15__11_14) + m[2] * (-v__8_15__11_12) + m[3] * (-v_10_12___8_14);
    r[ 6] = m[0] * ( v__7_14___6_15) + m[2] * (-v__7_12___4_15) + m[3] * (-v__4_14___6_12);
    r[ 7] = m[0] * ( v__6_11___7_10) + m[2] * (-v__4_11___7__8) + m[3] * (-v__6__8___4_10);
    
    r[ 8] = m[4] * ( v__9_15__11_13) + m[5] * ( v_11_12___8_15) + m[7] * (-v__9_12___8_13);
    r[ 9] = m[0] * ( v_11_13___9_15) + m[1] * ( v__8_15__11_12) + m[3] * (-v__8_13___9_12);
    r[10] = m[0] * ( v__5_15___7_13) + m[1] * ( v__7_12___4_15) + m[3] * (-v__5_12___4_13);
    r[11] = m[0] * ( v__7__9___5_11) + m[1] * ( v__4_11___7__8) + m[3] * (-v__4__9___5__8);

    r[12] = m[4] * ( v_10_13___9_14) + m[5] * ( v__8_14__10_12) + m[6] * ( v__9_12___8_13);
    r[13] = m[0] * ( v__9_14__10_13) + m[1] * ( v_10_12___8_14) + m[2] * ( v__8_13___9_12);
    r[14] = m[0] * ( v__6_13___5_14) + m[1] * ( v__4_14___6_12) + m[2] * ( v__5_12___4_13);
    r[15] = m[0] * ( v__5_10___6__9) + m[1] * ( v__6__8___4_10) + m[2] * ( v__4__9___5__8);

    var det = m[0]*r[0] + m[1]*r[4] + m[2]*r[8] + m[3]*r[12];
    for ( var i=0; i<16; ++i ) r[i] /= det;
    
    return r;
}

///////////////////////////////////////////////////////////////////////////////////

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
///////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////
// Below is the mass-spring system code
///////////////////////////////////////////////////////////////////////////////////
var massSpring;

class Vec3 {
    constructor( x, y, z ) { this.init(x,y,z); }
    init( x, y, z ) { this.x=x; this.y=y; this.z=z; }
    copy ( ) { return new Vec3( this.x, this.y, this.z ); }
    set  (v) { this.x =v.x; this.y =v.y; this.z =v.z; }
    inc  (v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; }
    dec  (v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; }
    scale(f) { this.x*=f; this.y*=f; this.z*=f; }
    add  (v) { return new Vec3( this.x+v.x, this.y+v.y, this.z+v.z ); }
    sub  (v) { return new Vec3( this.x-v.x, this.y-v.y, this.z-v.z ); }
    dot  (v) { return this.x*v.x + this.y*v.y + this.z*v.z; }
    cross(v) { return new Vec3( this.y*v.z-this.z*v.y, this.z*v.x-this.x*v.z, this.x*v.y-this.y*v.x ); }
    mul  (f) { return new Vec3( this.x*f, this.y*f, this.z*f ); }
    div  (f) { return new Vec3( this.x/f, this.y/f, this.z/f ); }
    len2 ( ) { return this.dot(this); }
    len  ( ) { return Math.sqrt(this.len2()); }
    unit ( ) { return this.div(this.len()); }
    normalize() {
        var l = this.len();
        this.x /= l;
        this.y /= l;
        this.z /= l;
    }
    trans(m) {
        return {
            x: m[0]*this.x + m[4]*this.y + m[ 8]*this.z + m[12],
            y: m[1]*this.x + m[5]*this.y + m[ 9]*this.z + m[13],
            z: m[2]*this.x + m[6]*this.y + m[10]*this.z + m[14],
            w: m[3]*this.x + m[7]*this.y + m[11]*this.z + m[15]
        };
    }
}

function ToVec3(a) { return new Vec3(a[0],a[1],a[2]); }

class MassSpring {

    constructor()
    {
        this.gravity = new Vec3( 0, -2.0, 0 );
        this.mass = .1;
        this.stiffness = 1;
        this.damping = 1;
        this.restitution = .8;
        this.setMesh( document.getElementById('box.obj').text );
    }
    setMesh( objdef )
    {
        this.mesh = new ObjMesh;
        this.mesh.parse( objdef );
        var box = this.mesh.getBoundingBox();
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
        var scale = 0.4/maxSize;
        this.mesh.shiftAndScale( shift, scale );
        this.mesh.computeNormals();
        this.reset();
        this.initSprings();
        DrawScene();
    }
    initSprings()
    {
        this.springs = [];
        for ( var i=0; i<this.pos.length; ++i ) {
            for ( var j=i+1; j<this.pos.length; ++j ) {
                var r = this.pos[i].sub(this.pos[j]).len();
                if ( r > .02 ) 
                {
                    this.springs.push( { p0:i, p1:j, rest:r } );
                }
            }
        }
    }
    reset()
    {
        this.pos = Array( this.mesh.vpos.length );
        for ( var i=0; i<this.pos.length; ++i ) this.pos[i] = ToVec3( this.mesh.vpos[i] );
        this.vel = Array( this.pos.length );
        for ( var i=0; i<this.vel.length; ++i ) this.vel[i] = new Vec3(0,0,0);
        this.nrm = Array( this.mesh.norm.length );
        for ( var i=0; i<this.nrm.length; ++i ) this.nrm[i] = ToVec3( this.mesh.norm[i] );
        this.buffers = this.mesh.getVertexBuffers();
        meshDrawer.setMesh( this.buffers.positionBuffer, this.buffers.texCoordBuffer, this.buffers.normalBuffer );
    }

    updateMesh()
    {
        function updateBuffer( buffer, faces, verts )
        {
            function addTriangleToBuffer( buffer, bi, vals, i, j, k )
            {
                buffer[bi++] = vals[i].x;
                buffer[bi++] = vals[i].y;
                buffer[bi++] = vals[i].z;
                buffer[bi++] = vals[j].x;
                buffer[bi++] = vals[j].y;
                buffer[bi++] = vals[j].z;
                buffer[bi++] = vals[k].x;
                buffer[bi++] = vals[k].y;
                buffer[bi++] = vals[k].z;
            }
            for ( var i=0, bi=0; i<faces.length; ++i ) {
                var f = faces[i];
                if ( f.length < 3 ) continue;
                addTriangleToBuffer( buffer, bi, verts, f[0], f[1], f[2] );
                bi += 9;
                for ( var j=3; j<f.length; ++j, bi+=9 ) {
                    addTriangleToBuffer( buffer, bi, verts, f[0], f[j-1], f[j] );
                }
            }
        }
        
        // update the position buffer
        updateBuffer( this.buffers.positionBuffer, this.mesh.face, this.pos );
        
        // update normals
        for ( var i=0; i<this.nrm.length; ++i ) this.nrm[i].init(0,0,0);
        for ( var i=0; i<this.mesh.face.length; ++i ) {
            var f = this.mesh.face[i];
            var nf = this.mesh.nfac[i];
            var v0 = this.pos[ f[0] ];
            for ( var j=1; j<f.length-1; ++j ) {
                var v1 = this.pos[ f[j] ];
                var v2 = this.pos[ f[j+1] ];
                var e0 = v1.sub(v0);
                var e1 = v2.sub(v0);
                var n  = e0.cross(e1);
                n = n.unit();
                this.nrm[ nf[0  ] ].inc(n);
                this.nrm[ nf[j  ] ].inc(n);
                this.nrm[ nf[j+1] ].inc(n);
            }
        }
        for ( var i=0; i<this.nrm.length; ++i ) this.nrm[i].normalize();
        updateBuffer( this.buffers.normalBuffer, this.mesh.nfac, this.nrm );

        // Update the mesh drawer and redraw scene
        meshDrawer.setMesh( this.buffers.positionBuffer, this.buffers.texCoordBuffer, this.buffers.normalBuffer );

        pointDrawer.updatePoint();
        DrawScene();
    }

    simTimeStep()
    {
        // remember the position of the selected vertex, if any
        var p = this.holdVert ? this.holdVert.copy() : undefined;

        // Update positions and velocities
        var timestep = document.getElementById('timestep').value;
        const dt = timestep / 1000;	// time step in seconds
        const damping = this.damping * this.stiffness * dt;
        SimTimeStep( dt, this.pos, this.vel, this.springs, this.stiffness, damping, this.mass, this.gravity, this.restitution );
        
        // make sure that the selected vertex does not change position
        if ( p ) {
            this.holdVert.set(p);
            this.vel[ this.selVert ].init(0,0,0);
        }
        
        this.updateMesh();
    }
    startSimulation()
    {
        var timestep = document.getElementById('timestep').value;
        if ( ! this.isSimulationRunning() ) this.timer = setInterval( function(){ massSpring.simTimeStep(); }, timestep );
    }
    stopSimulation()
    {
        clearInterval( this.timer );
        this.timer = undefined;
    }
    isSimulationRunning() { return this.timer !== undefined; }
    restartSimulation() { if ( this.isSimulationRunning() ) { this.stopSimulation(); this.startSimulation(); } }
    toggleSimulation( btn )
    {
        if ( this.isSimulationRunning() ) {
            this.stopSimulation();
            btn.value = "Start Simulation";
        } else {
            this.startSimulation();
            btn.value = "Stop Simulation";
        }
    }
    
    mouseMove()
    {
        var m = MousePos();
        this.selVert = undefined;
        var selPt;
        var minDist = 10;
        for ( var i=0; i<this.pos.length; ++i ) {
            var p = this.pos[i];
            var pv = p.trans(MVP);
            var px = pv.x / pv.w;
            var py = pv.y / pv.w;
            var dx = m.x - px;
            var dy = m.y - py;
            var len2 = dx*dx + dy*dy;
            if ( len2 < 0.001 && len2 < minDist ) {
                minDist = len2;
                this.selVert = i;
                selPt = p;
            }
        }
        if ( pointDrawer.setPoint( selPt ) ) {
            DrawScene();
            canvas.className = selPt ? "sel" : "";
        }
    }
    
    mouseDown()
    {
        if ( this.selVert === undefined ) return false;
        var mInv = MatrixInverse(MVP);
        var p = this.pos[ this.selVert ];
        var pv = p.trans(MVP);
        this.holdVert = this.pos[ this.selVert ];
        
        function mouse4D()
        {
            var m = MousePos();
            return {
                x: m.x * pv.w,
                y: m.y * pv.w,
                z: pv.z,
                w: pv.w
            };
        }
        
        function invTrans(v)
        {
            return {
                x: mInv[0]*v.x + mInv[4]*v.y + mInv[ 8]*v.z + mInv[12]*v.w,
                y: mInv[1]*v.x + mInv[5]*v.y + mInv[ 9]*v.z + mInv[13]*v.w,
                z: mInv[2]*v.x + mInv[6]*v.y + mInv[10]*v.z + mInv[14]*v.w,
                w: mInv[3]*v.x + mInv[7]*v.y + mInv[11]*v.z + mInv[15]*v.w
            };
        }
        
        function mouse3D() { 
            var m = invTrans(mouse4D());
            return new Vec3( m.x/m.w, m.y/m.w, m.z/m.w );
        }
        
        var m0 = mouse3D();
        var ms = this;
        
        canvas.onmousemove = function() {
            var m1 = mouse3D();
            var d = m1.sub(m0);
            m0 = { ...m1 };
            p.inc(d);
            ms.updateMesh();
        }
        return true;		
    }
    
    mouseUp()
    {
        this.holdVert = undefined;
    }
}
///////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////
// Below are the main UI control functions.
///////////////////////////////////////////////////////////////////////////////////

var showBox;

window.onload = function() {
    showBox = document.getElementById('show-box');
    InitWebGL();
    lightView = new LightView();
    canvas.zoom = function( s ) {
        transZ *= s/canvas.height + 1;
        UpdateViewMatrices();
        DrawScene();
    }
    canvas.onwheel = function() { canvas.zoom(0.3*event.deltaY); }
    canvas.onmousedown = function() {
        if ( massSpring.mouseDown() ) {
            canvas.ondblclick = null;
            return;
        }
        canvas.ondblclick = canvas.resetView;
        var cx = event.clientX;
        var cy = event.clientY;
        if ( event.ctrlKey ) {
            canvas.onmousemove = function() {
                canvas.zoom(5*(event.clientY - cy));
                cy = event.clientY;
            }
        } else if ( event.altKey ) {
            canvas.onmousemove = function() {
                let s = 1.5*transZ*(event.clientY - cy);
                transY -= s/canvas.height;
                UpdateViewMatrices();
                DrawScene();
                cy = event.clientY;
            }
        } else {
            canvas.onmousemove = function() {
                rotY += (cx - event.clientX)/canvas.width*5;
                rotX += (cy - event.clientY)/canvas.height*5;
                cx = event.clientX;
                cy = event.clientY;
                UpdateViewMatrices();
                DrawScene();
            }
        }
    }
    canvas.onmouseup = canvas.onmouseleave = function() {
        massSpring.mouseUp();
        canvas.onmousemove = function() { massSpring.mouseMove(); }
    }
    canvas.onmousemove = function() { massSpring.mouseMove(); }
    canvas.resetView = function() {
        rotX = 0;
        rotY = 0;
        transY = 0;
        transZ = 3;
        UpdateViewMatrices();
        DrawScene();
    }
    
    massSpring = new MassSpring();
    
    SetGravity  ( document.getElementById('gravity') );
    SetMass     ( document.getElementById('mass') );
    SetStiffness( document.getElementById('stiffness') );
    SetShininess( document.getElementById('shininess-exp') );

    DrawScene();
};
function WindowResize()
{
    UpdateCanvasSize();
    DrawScene();
}

function MousePos()
{
    return {
        x:  ( event.clientX / canvas.clientWidth  ) * 2 - 1,
        y: -( event.clientY / canvas.clientHeight ) * 2 + 1
    };
}

function ShowTexture( param )
{
    meshDrawer.showTexture( param.checked );
    DrawScene();
}

function LoadObj( param )
{
    if ( param.files && param.files[0] ) {
        var reader = new FileReader();
        reader.onload = function(e) {
            massSpring.setMesh( e.target.result );
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

function SetTimeStepSize( param )
{
    var s = param.value;
    document.getElementById('timestep-value').innerText = s + " ms";
}

function SetGravity( param )
{
    var v = param.value;
    var s = v / 20;
    document.getElementById('gravity-value').innerText = s.toFixed( 2 );
    massSpring.gravity.y = -s;
}

function SetMass( param )
{
    var v = param.value;
    var s = v / 200;
    document.getElementById('mass-value').innerText = s.toFixed( 3 );
    massSpring.mass = s;
}

function SetStiffness( param )
{
    var v = param.value;
    var s = v / 20;
    document.getElementById('stiffness-value').innerText = s.toFixed( 2 );
    massSpring.stiffness = s;
}

function SetDamping( param )
{
    var v = param.value;
    var s = v / 20;
    document.getElementById('damping-value').innerText = s.toFixed( 2 );
    massSpring.damping = s;
}

function SetShininess( param )
{
    var exp = param.value;
    var s = Math.pow(10,exp/25);
    document.getElementById('shininess-value').innerText = s.toFixed( s < 10 ? 2 : 0 );
    meshDrawer.setShininess(s);
    DrawScene();
}

///////////////////////////////////////////////////////////////////////////////////
