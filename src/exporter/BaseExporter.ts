import { PackGroup } from "../core/ValueObjects";
import { canvas2PNGBase64} from "../core/PackImageUtil";

export class BaseExporter{
    async generate(groups:PackGroup[],opts?:{dir:string,[key:string]:any}):Promise<boolean>{
        return false;
    };

    exportImage(group:PackGroup){
        let canvas = document.createElement('canvas');
        canvas.width = group.width;
        canvas.height = group.height;
        let context = canvas.getContext('2d');

        for(let image of group.images){
            let bmd = image.bitmapData;
            context.drawImage(bmd, image.packRect.x,image.packRect.y);
        }
        let base64 = canvas2PNGBase64(canvas);
        return base64;
    }
}