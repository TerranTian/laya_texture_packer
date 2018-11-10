const Canvas = require('canvas')
global["document"] = {};
document.createElement = (name)=>{
    if(name == "canvas")return new Canvas();
    if(name == "img")return new Canvas.Image();

    return null;
};

process.on('unhandledRejection', error => {
	let content = typeof error == "object"?((error as Error).stack):error;
	console.log('unhandledRejection',content);
});

import * as path from "path";
import * as fs from "fs";
// import probe = require("probe-image-size"); 

import { MaxRectangle } from "./core/MaxRectsCore";
import { PackGroup, ImageItem, Rectangle,} from "./core/ValueObjects";
import * as util from "./core/util"
import { maxRectsUtil } from "./core/MaxRectsUtil";
import { LayaAtlas } from "./exporter/LayaAtlas";

class Main{
    constructor(){
        let dir = process.argv[2]||".";
        // let dir = "/Users/terrantian/Documents/hole_workspace/hole_client/laya_hole/laya/assets/scene";
        if(!path.isAbsolute(dir)){
            dir = path.resolve(process.cwd(),dir);
        }
        console.log(process.argv);
        console.log("path:",dir)

        this.packfolder(dir)
        .then(groups=>new LayaAtlas().generate(groups,{dir:dir}))
        .then(b=>console.log("packer result:",b));
    }

    private async packfolder(dir_path,maxWidth:number = 2048,maxHeight:number = 2048){
        let rects:MaxRectangle[] = []
        let files:string[] = []
        util.lsFile(dir_path,files);
        
        for(let p of files){
            let extension = path.extname(p);
            if(extension != ".png" && extension != ".jpg") continue;

            let url = path.relative(dir_path,p)
            let item = new ImageItem(p);
            item.url = url;
            let bo = await item.load();
            if(bo){
                rects.push(new MaxRectangle(0,0,item.opaqueRect.width,item.opaqueRect.height,item));
            }else{
                console.log("image load fialed:",p);
            }
        }

        let groups:PackGroup[] = []
        let results = maxRectsUtil.packImages(rects, maxWidth, maxHeight, 1);
        for (let result of results) {
            let group = new PackGroup();
            group.width = result.maxWidth;
            group.height = result.maxHeight;
            for(let rect of result.imageGroups){
                let item = rect.data as ImageItem;
                item.packRect = new Rectangle(rect.x,rect.y,rect.width,rect.height);
                group.images.push(item);
            }
            groups.push(group);
        }
        
        return groups;
    }
}

new Main();