attribute vec3 pos; 
attribute vec2 txc; 

uniform mat4 mvp; 
uniform mat4 yzSwap;

varying vec2 texCoord; 

void main()
{
    texCoord = txc;
    gl_Position = mvp * yzSwap * vec4(pos,1.0); 
}

