import * as path from "path";
import { PackGroup } from "../core/ValueObjects";
import * as util from "../core/util";
import { BaseExporter } from "./BaseExporter";

export class LayaAtlas extends BaseExporter{
    async generate(groups:PackGroup[],opts:{dir:string}){
        let dirName = path.basename(opts.dir);

        let imageNames = groups.map((v,index)=>index>0?`${dirName}_index`:dirName);

        let frames = {};
        for(let i = 0;i<groups.length;i++){
            let group = groups[i];
            let images = group.images
            for(let image of group.images){
                let frameData = {
                    frame:{
                        x:image.packRect.x,
                        y:image.packRect.y,
                        w:image.packRect.width,
                        h:image.packRect.height,
                        idx:i
                    },
                    sourceSize:{
                        w:image.width,
                        h:image.height
                    },
                    spriteSourceSize:{
                        x:image.opaqueRect.x,
                        y:image.opaqueRect.y
                    }
                }
                frames[image.url] = frameData;
            }
        }
        let meta = {
            image:imageNames.join(","),
            prefix:`${dirName}/`
        }

        let atlas = {frames,meta};

        let parentPath = path.dirname(opts.dir);
        util.writeJson(path.join(parentPath,`${dirName}.atlas`),atlas);
        for(let i=0;i<groups.length;i++){
            let group = groups[i];
            let base64 = this.exportImage(group);
            util.saveBase64(path.join(parentPath,`${imageNames[i]}.png`),base64);
        }

        return true;
    }    
}