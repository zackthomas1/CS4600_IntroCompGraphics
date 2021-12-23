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
        return [this.red, this.green, this.blue];
    }

    get8BitPixelValue(){
        return [Math.floor(this.red*255), 
                Math.floor(this.green*255), 
                Math.floor(this.blue*255)
            ];
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

    add(color){
        let outRGB = new RGB8Bit();

        outRGB.red = this.red + color.red; 
        outRGB.green = this.green + color.green; 
        outRGB.blue = this.blue + color.blue;  

        return outRGB;
    }

    subtract(color){
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
}



function convert8BitPixelValueToFloat(inputValue){
    return inputValue / 255;
}

function convertFloatTo8BitPixelValue(inputValue){
    return Math.ceil(inputValue * 255);
}

// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    console.log("Background Data Size: ", bgImg.data.length, "Background Data: ",  bgImg.data);
    console.log("Foreground Data Size: ", fgImg.data.length, "Foreground Data: ",  fgImg.data);

    // Iterate through every pixel
    for (let i = 0; i < bgImg.data.length; i += 4) {

        let bgRGB = new RGB8Bit(bgImg.data[i + 0], bgImg.data[i + 1], bgImg.data[i + 2]);
        let bgAlpha = bgImg.data[i + 3] / 255;

        let fgRGB = new RGB8Bit(fgImg.data[i + 0], fgImg.data[i + 1], fgImg.data[i + 2]);
        let fgAlpha = fgOpac * (fgImg.data[i + 3] / 255);

        let blendColor = alphaBlend();

        bgImg.data[i + 0] = blendColor.red; 
        bgImg.data[i + 1] = blendColor.green; 
        bgImg.data[i + 2] = blendColor.blue;

        // console.log("Background Image -", 
        //             "Red: ", bgImg.data[i + 0], 
        //             "Green: ", bgImg.data[i + 1], 
        //             "Blue: ", bgImg.data[i + 2], 
        //             "Alpha: ", bgImg.data[i + 3] 
        //             );

        // console.log("Foreground Image -", 
        //             "Red: ", fgImg.data[i + 0], 
        //             "Green: ", fgImg.data[i + 1], 
        //             "Blue: ", fgImg.data[i + 2], 
        //             "Alpha: ", fgImg.data[i + 3] 
        //             );

    }
      
}

function alphaBlend(bgColor, bgAlpha, fgColor, fgAlpha){
    // // Alpha Blending (over)
    // bgImg.data[i + 0] = convertFloatTo8BitPixelValue(((fgOpac * (fgImg.data[i + 3]/255)) * (fgImg.data[i + 0]/255)) + ((1 - (fgOpac * (fgImg.data[i + 3]/255) )) * (bgImg.data[i + 0]/255)));
    // bgImg.data[i + 1] = convertFloatTo8BitPixelValue(((fgOpac * (fgImg.data[i + 3]/255)) * (fgImg.data[i + 1]/255)) + ((1 - (fgOpac * (fgImg.data[i + 3]/255) )) * (bgImg.data[i + 1]/255)));
    // bgImg.data[i + 2] = convertFloatTo8BitPixelValue(((fgOpac * (fgImg.data[i + 3]/255)) * (fgImg.data[i + 2]/255)) + ((1 - (fgOpac * (fgImg.data[i + 3]/255) )) * (bgImg.data[i + 2]/255)));

    let outputColor = new RGB8Bit(); 

    // c = af*cf + (1-af)*ab*cb
    // outputColor = fgAlpha * fgColor + (1-fgAlpha)*bgAlpha*bgColor
    let fgPremultColor = fgColor.scalerMultiply(fgAlpha);
    let bgPremultColor = bgColor.scalerMultiply(bgAlpha).scalerMultiply((1-fgAlpha)); 
    outputColor = fgPremultColor.add(bgPremultColor); 

    return outputColor;
}

function additiveBlend(c1, c2){
    // // Additive Blending
    // bgImg.data[i + 0] = convertFloatTo8BitPixelValue(((fgImg.data[i + 3]/255)*(fgImg.data[i + 0]/255)) + (bgImg.data[i + 0]/255));
    // bgImg.data[i + 1] = convertFloatTo8BitPixelValue(((fgImg.data[i + 3]/255)*(fgImg.data[i + 1]/255)) + (bgImg.data[i + 1]/255));
    // bgImg.data[i + 2] = convertFloatTo8BitPixelValue(((fgImg.data[i + 3]/255)*(fgImg.data[i + 2]/255)) + (bgImg.data[i + 2]/255));

}

function differenceBlend(c1, c2){
    // Difference Blending

}

function multiplyBlend(c1, c2){
    // // Multiply Blending
    // bgImg.data[i + 0] = convertFloatTo8BitPixelValue(((fgImg.data[i + 0]/255) * (bgImg.data[i + 0]/255)) + ((1-(fgImg.data[i + 3]/255))*(bgImg.data[i + 0]/255))); //red
    // bgImg.data[i + 1] = convertFloatTo8BitPixelValue(((fgImg.data[i + 1]/255) * (bgImg.data[i + 1]/255)) + ((1-(fgImg.data[i + 3]/255))*(bgImg.data[i + 1]/255))); //green
    // bgImg.data[i + 2] = convertFloatTo8BitPixelValue(((fgImg.data[i + 2]/255) * (bgImg.data[i + 2]/255)) + ((1-(fgImg.data[i + 3]/255))*(bgImg.data[i + 2]/255))); //blue

}
