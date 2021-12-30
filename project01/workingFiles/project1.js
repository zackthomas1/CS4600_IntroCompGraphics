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
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    console.log("Background Data Size: ", bgImg.data.length, "Background Data: ",  bgImg.data);
    console.log("Foreground Data Size: ", fgImg.data.length, "Foreground Data: ",  fgImg.data);

    let bgOffset = {x : fgPos.x, y : fgPos.y}
    let fgOffset = {x : 0, y : 0}
    if(fgPos.x < 0){
        bgOffset.x = 0; 
        fgOffset.x = Math.abs(fgPos.x);
    }
    if(fgPos.y < 0){
        bgOffset.y = 0; 
        fgOffset.y = Math.abs(fgPos.y);
    }
    let bgIndex = (bgImg.width * bgOffset.y + bgOffset.x) * 4; // background start index
    let fgIndex = (fgImg.width * fgOffset.y + fgOffset.x) * 4; // foreground start index

    let xCoord = bgOffset.x; 
    let yCoord = bgOffset.y;
    while(bgOffset.y <= yCoord && yCoord < fgImg.height + bgOffset.y) {

        if( bgOffset.x <= xCoord && xCoord < fgImg.width + bgOffset.x){
            let bgRGB = new RGB8Bit(bgImg.data[bgIndex + 0], bgImg.data[bgIndex + 1], bgImg.data[bgIndex + 2]);
            let bgAlpha = bgImg.data[bgIndex + 3] / 255;
    
            let fgRGB = new RGB8Bit(fgImg.data[fgIndex + 0], fgImg.data[fgIndex + 1], fgImg.data[fgIndex + 2]);
            let fgAlpha = fgOpac * (fgImg.data[fgIndex + 3] / 255);
    
            let blendColor = alphaBlend(bgRGB, bgAlpha, fgRGB, fgAlpha);
            let blendColor8BitValues = blendColor.get8BitPixelValue();
    
            bgImg.data[bgIndex + 0] = blendColor8BitValues.red; 
            bgImg.data[bgIndex + 1] = blendColor8BitValues.green; 
            bgImg.data[bgIndex + 2] = blendColor8BitValues.blue;
            
            fgIndex += 4;
        }

        bgIndex += 4;
        ++xCoord;
        if(xCoord % bgImg.width === 0){
            xCoord = 0; 
            ++yCoord;
        }
    }
}

function alphaBlend(bgColor, bgAlpha, fgColor, fgAlpha){
    let outputColor = new RGB8Bit(); 

    // Alpha Blending (over)
    // outputColor = fgAlpha * fgColor + (1-fgAlpha)*bgAlpha*bgColor
    let fgPremultColor = fgColor.scalerMultiply(fgAlpha);
    let bgPremultColor = bgColor.scalerMultiply(bgAlpha).scalerMultiply((1-fgAlpha)); 
    outputColor = fgPremultColor.plus(bgPremultColor); 

    return outputColor;
}

function additiveBlend(bgColor, bgAlpha, fgColor, fgAlpha){

    let outputColor = new RGB8Bit(); 

    // Additive Blending
    // outputColor = fgAlpha * fgColor + bgColor
    let fgPremultColor = fgColor.scalerMultiply(fgAlpha)
    outputColor = fgPremultColor.plus(bgColor);

    return outputColor;
}

function differenceBlend(bgColor, bgAlpha, fgColor, fgAlpha){

    let outputColor = new RGB8Bit(); 

    // Difference Blending
    // outputColor = |fgAlpha * fgColor - bgColor|
    let fgPremultColor = fgColor.scalerMultiply(fgAlpha) 
    outputColor = fgPremultColor.minus(bgColor).absouluteValue(); 

    return outputColor;
}

function multiplyBlend(bgColor, bgAlpha, fgColor, fgAlpha){

    let outputColor = new RGB8Bit(); 

    // Multiply Blending
    // outputColor = fgAlpha * (fgColor * bgColor) + (1 - fgAlpha)*bgColor
    let fgPremultColor = fgColor.multiply(bgColor).scalerMultiply(fgAlpha);
    let bgPremultColor = bgColor.scalerMultiply(1-fgAlpha);
    outputColor = fgPremultColor.plus(bgPremultColor); 

    return outputColor;
}
