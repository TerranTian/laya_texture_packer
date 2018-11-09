import { Rectangle} from "./ValueObjects";

let  canvas = document.createElement('canvas');
let  canvas2drender = canvas.getContext('2d');

export function clipImageByRes(image, cb?):Promise<{img:HTMLImageElement,opaqueRect:Rectangle}> {
    return new Promise((resolve,reject)=>{
        canvas.width = image.width;
        canvas.height = image.height;
        canvas2drender.clearRect(0, 0, image.width, image.height);
        canvas2drender.drawImage(image, 0, 0);
        let  inputData = canvas2drender.getImageData(0, 0, image.width, image.height);
        let  result = clipImageByData(inputData);
        canvas.width = result.clipw;
        canvas.height = result.cliph;
        canvas2drender.clearRect(0, 0, result.clipw, result.cliph);
        canvas2drender.putImageData(result.image, 0, 0);
        let newimg = document.createElement('img');
        let opaqueRect = new Rectangle(result.clipx, result.clipy, result.clipw, result.cliph);
        newimg.onload = ()=>{
            let result = {img:newimg,opaqueRect}
            cb && cb(result);
            resolve(result);
        };
        let  str = canvas2PNGDataURL(canvas, result.clipw, result.cliph);
        newimg.src = str;
    })
}

function clipImageByData(input:ImageData) {
    let  w = input.width;
    let  h = input.height;
    let  minLeft = w;
    let  maxRight = 0;
    let  minTop = h;
    let  maxBottom = 0;
    let  data = input.data;
    for (let  yIndex = 0; yIndex < h; yIndex++) {
        for (let  xIndex = 0; xIndex < minLeft; xIndex++) {
            if (getImageAlpha(data, xIndex, yIndex, w) > 0) {
                minLeft = xIndex;
                break;
            }
        }
        for (let xIndex = w - 1; xIndex >= maxRight; xIndex--) {
            if (getImageAlpha(data, xIndex, yIndex, w) > 0) {
                maxRight = xIndex;
                break;
            }
        }
    }
    for (let xIndex = 0; xIndex < w; xIndex++) {
        for (let yIndex = 0; yIndex < minTop; yIndex++) {
            if (getImageAlpha(data, xIndex, yIndex, w) > 0) {
                minTop = yIndex;
                break;
            }
        }
        for (let yIndex = h - 1; yIndex >= maxBottom; yIndex--) {
            if (getImageAlpha(data, xIndex, yIndex, w) > 0) {
                maxBottom = yIndex;
                break;
            }
        }
    }
    let  clipx = Math.min(minLeft, maxRight);
    let  clipy = Math.min(minTop, maxBottom);
    let  clipw = Math.abs(maxRight - minLeft) + 1;
    let  cliph = Math.abs(maxBottom - minTop) + 1;
    let  resultImage = canvas2drender.createImageData(clipw, cliph);
    for (let yIndex = 0; yIndex < cliph; yIndex++) {
        for (let xIndex = 0; xIndex < clipw; xIndex++) {
            let  toIndex = getImageIndex(xIndex, yIndex, clipw);
            let  fromIndex = getImageIndex(xIndex + clipx, yIndex + clipy, w);
            resultImage.data[toIndex] = data[fromIndex];
            resultImage.data[toIndex + 1] = data[fromIndex + 1];
            resultImage.data[toIndex + 2] = data[fromIndex + 2];
            resultImage.data[toIndex + 3] = data[fromIndex + 3];
        }
    }
    return {
        image: resultImage,
        clipx: clipx,
        clipy: clipy,
        clipw: clipw,
        cliph: cliph
    };
}

export function getImageIndex(xIndex, yIndex, w) {
    return (xIndex + yIndex * w) * 4;
}

export function getImageAlpha(data:Uint8ClampedArray, xIndex, yIndex, w) {
    return data[(xIndex + yIndex * w) * 4 + 3];
}

export function canvas2PNGBase64(canvas, width?:number, height?:number) {
    let  str = canvas2PNGDataURL(canvas,width,height);
    str = str.replace('data:image/png;base64,', '');
    return str;
}

export function canvas2PNGDataURL(canvas, width?:number, height?:number) {
    let  w = canvas.width,
        h = canvas.height;
    if (!width) {
        width = w;
    }
    if (!height) {
        height = h;
    }
    let  retCanvas = document.createElement('canvas');
    let  retCtx = retCanvas.getContext('2d');
    retCanvas.width = width;
    retCanvas.height = height;
    retCtx.drawImage(canvas, 0, 0, w, h, 0, 0, width, height);
    let str = retCanvas.toDataURL('image/png',1);
    return str;
}

export function canvas2JPGBase64(canvas){
    return new Promise((resolve,reject)=>{
        let w = canvas.width;
        let h = canvas.height;
    
        let retCanvas = document.createElement('canvas');
        retCanvas.width = w;
        retCanvas.height = h*2;
    
        let retCtx = retCanvas.getContext('2d');
        retCtx.drawImage(canvas, 0, 0, w, h);
        let imgdata = retCtx.getImageData(0,0,w,h);
        for(let i:number = 0;i<imgdata.data.length;i+=4){
            let alpha = imgdata.data[i+3];
            imgdata.data[i+3] = 0xff;
            imgdata.data[i] = alpha; 
            imgdata.data[i+1] = alpha; 
            imgdata.data[i+2] = alpha; 
        }
    
        retCtx.putImageData(imgdata,0,h);
        let str = retCanvas.toDataURL('image/jpeg',1)
        str = str.replace('data:image/jpeg;base64,', '')
        resolve(str);
    })
}