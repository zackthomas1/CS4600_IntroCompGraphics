class RGB8Bit {
    constructor(r=0, g=0, b=0){

        // type check
        if(typeof(r) != 'number'){r = 0;}
        if(typeof(g) != 'number'){g = 0;}
        if(typeof(b) != 'number'){b = 0;}

        // convert floating point to ints
        if(r % 1 != 0) {r = Math.floor(r);}
        if(g % 1 != 0) {g = Math.floor(g);}
        if(b % 1 != 0) {b = Math.floor(b);}

        // store as float between 0 and 1
        this.red = r/255; 
        this.green = g/255; 
        this.blue = b/255;

        this.clampBlacks(); 
        this.clampWhites();
    }

    getFloatValue(){
        return {
            'red': this.red, 
            'green': this.green, 
            'blue': this.blue
        };
    }

    get8BitPixelValue(){
        return {
                'red': Math.floor(this.red*255), 
                'green': Math.floor(this.green*255), 
                'blue': Math.floor(this.blue*255)
            };
    }

    clampBlacks(){
        // clamp  blacks
        if(this.red < 0) {this.red = 0;}
        if(this.green < 0) {this.green = 0;}
        if(this.blue < 0) {this.blue = 0;}
    }

    clampWhites(){
        // clamp whites
        if(this.red > 1) {this.red = 1;}
        if(this.green > 1) {this.green = 1;}
        if(this.blue > 1) {this.blue = 1;}
    }

    plus(color){
        let outRGB = new RGB8Bit();

        outRGB.red = this.red + color.red; 
        outRGB.green = this.green + color.green; 
        outRGB.blue = this.blue + color.blue;  

        return outRGB;
    }

    minus(color){
        let outRGB = new RGB8Bit();

        outRGB.red = this.red - color.red; 
        outRGB.green = this.green - color.green; 
        outRGB.blue = this.blue - color.blue;  

        return outRGB;
    }

    multiply(color){
        let outRGB = new RGB8Bit();

        outRGB.red = this.red * color.red; 
        outRGB.green = this.green * color.green; 
        outRGB.blue = this.blue * color.blue;  

        return outRGB;
    }

    scalerMultiply(scaler){
        if(typeof(scaler) != 'number'){
            throw Error("Scaler must be numberic value"); 
        }

        let outRGB = new RGB8Bit();

        outRGB.red = this.red * scaler; 
        outRGB.green = this.green * scaler; 
        outRGB.blue = this.blue * scaler; 
        
        outRGB.clampWhites();

        return outRGB;
    }

    absouluteValue(){
        let outRGB = new RGB8Bit(); 

        outRGB.red = Math.abs(this.red); 
        outRGB.green = Math.abs(this.green);
        outRGB.blue = Math.abs(this.blue);

        return outRGB; 
    }
}

function convert8BitPixelValueToFloat(inputValue){
    return inputValue / 255;
}

function convertFloatTo8BitPixelValue(inputValue){
    return Math.ceil(inputValue * 255);
}

/**
 * Composite foreground and background images
 * @param {*} bgImg background image to be modified.
 * @param {*} fgImg foreground image.
 * @param {*} fgOpac opacity of the foreground image.
 * @param {*} fgPos position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
 */
function composite( bgImg, fgImg, fgOpac, fgPos, fgBlend)
{
    console.log("Background Data Size: ", bgImg.data.length, "Background Data: ",  bgImg.data);
    console.log("Foreground Data Size: ", fgImg.data.length, "Foreground Data: ",  fgImg.data);

    let bgCoord = {x : fgPos.x, y : fgPos.y}
    let fgCoord = {x : 0, y : 0}
    if(fgPos.x < 0){
        bgCoord.x = 0; 
        fgCoord.x = Math.abs(fgPos.x);
    }
    if(fgPos.y < 0){
        bgCoord.y = 0; 
        fgCoord.y = Math.abs(fgPos.y);
    }

    const bgXReset = bgCoord.x;
    const fgXReset = fgCoord.x 

    while(fgCoord.y < fgImg.height && bgCoord.y < bgImg.height) {
        while(fgCoord.x < fgImg.width && bgCoord.x < bgImg.width){
            const bgRGB = getColorAlphaForCoord(bgCoord.x, bgCoord.y, bgImg).color;
            const bgAlpha = getColorAlphaForCoord(bgCoord.x, bgCoord.y, bgImg).alpha;    

            const fgRGB = getColorAlphaForCoord(fgCoord.x, fgCoord.y, fgImg).color;
            const fgAlpha = fgOpac * getColorAlphaForCoord(fgCoord.x, fgCoord.y, fgImg).alpha;

            let blendColor = new RGB8Bit();
            switch(fgBlend){
                case 'normal':
                    blendColor = alphaBlend(bgRGB, bgAlpha, fgRGB, fgAlpha);
                    break;
                case 'additive':
                    blendColor = additiveBlend(bgRGB, bgAlpha, fgRGB, fgAlpha);
                    break;
                case 'difference':
                    blendColor = differenceBlend(bgRGB, bgAlpha, fgRGB, fgAlpha);
                    break;
                case 'multiple':
                    blendColor = multiplyBlend(bgRGB, bgAlpha, fgRGB, fgAlpha);
                    break;
                default:
                    blendColor = alphaBlend(bgRGB, bgAlpha, fgRGB, fgAlpha);
                    break; 
            }
            const blendColor8BitValues = blendColor.get8BitPixelValue();

            const bgIndex = getIndicesForCoord(bgCoord.x, bgCoord.y, bgImg.width)
            bgImg.data[bgIndex.red] = blendColor8BitValues.red; 
            bgImg.data[bgIndex.green] = blendColor8BitValues.green; 
            bgImg.data[bgIndex.blue] = blendColor8BitValues.blue;

            bgCoord.x++;
            fgCoord.x++;
        }
        bgCoord.x = bgXReset; 
        fgCoord.x = fgXReset;
        bgCoord.y++;
        fgCoord.y++;
    }
}

function getColorAlphaForCoord(x, y, image) {
    const i = y * (image.width * 4) + x * 4;
    const outputColor = new RGB8Bit(image.data[i], image.data[i+1], image.data[i+2]);
    return {color: outputColor, alpha: image.data[i+3] / 255};
}

function getIndicesForCoord(x, y, width) {
    const i = y * (width * 4) + x * 4;
    return {red : i, green: i+1, blue: i+2 };
}

function alphaBlend(bgColor, bgAlpha, fgColor, fgAlpha){
    let outputColor = new RGB8Bit(); 

    // Alpha Blending (over)
    // outputColor = fgAlpha * fgColor + (1-fgAlpha)*bgAlpha*bgColor
    const fgPremultColor = fgColor.scalerMultiply(fgAlpha);
    const bgPremultColor = bgColor.scalerMultiply(bgAlpha).scalerMultiply((1-fgAlpha)); 
    outputColor = fgPremultColor.plus(bgPremultColor); 

    return outputColor;
}

function additiveBlend(bgColor, bgAlpha, fgColor, fgAlpha){

    let outputColor = new RGB8Bit(); 

    // Additive Blending
    // outputColor = fgAlpha * fgColor + bgColor
    const fgPremultColor = fgColor.scalerMultiply(fgAlpha)
    outputColor = fgPremultColor.plus(bgColor);

    return outputColor;
}

function differenceBlend(bgColor, bgAlpha, fgColor, fgAlpha){

    let outputColor = new RGB8Bit(); 

    // Difference Blending
    // outputColor = |fgAlpha * fgColor - bgColor|
    const fgPremultColor = fgColor.scalerMultiply(fgAlpha) 
    outputColor = fgPremultColor.minus(bgColor).absouluteValue(); 

    return outputColor;
}

function multiplyBlend(bgColor, bgAlpha, fgColor, fgAlpha){

    let outputColor = new RGB8Bit(); 

    // Multiply Blending
    // outputColor = fgAlpha * (fgColor * bgColor) + (1 - fgAlpha)*bgColor
    const fgPremultColor = fgColor.multiply(bgColor).scalerMultiply(fgAlpha);
    const bgPremultColor = bgColor.scalerMultiply(1-fgAlpha);
    outputColor = fgPremultColor.plus(bgPremultColor); 

    return outputColor;
}
