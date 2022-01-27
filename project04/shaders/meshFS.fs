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
}