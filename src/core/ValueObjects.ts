import { clipImageByRes } from "./PackImageUtil";
import  * as util from "./util";

export class Rectangle {
    x:number;
    y:number;
    width:number;
    height:number;
    constructor(x?:number, y?:number, width?:number, height?:number) {
        this.setTo(x, y, width, height)
    }

    setTo(x, y, width, height){
        this.x = x||0;
        this.y = y||0;
        this.width = width||0;
        this.height = height||0;
    }
} 

export class ImageItem{
    constructor(public readonly path:string){};

    url:string = '';
    
    bitmapData:HTMLImageElement;
    opaqueRect:Rectangle;
    packRect:Rectangle;

    width:number = 0;
    height:number = 0;
    
    async load(){
        let image = await util.createHtmlElement(this.path);
        if(!image) return false;
        this.width = image.width;
        this.height = image.height;

        let result = await clipImageByRes(image);
        if(!result) return false;
        
        this.bitmapData = result.img;
        this.opaqueRect = result.opaqueRect;
        
        return true;
    }
}

export class PackGroup{
    width:number = 0;
    height:number = 0;
    images:ImageItem[] = [];
}