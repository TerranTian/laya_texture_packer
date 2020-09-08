// const Canvas = require('canvas')
const { createCanvas, Image } = require('canvas')
global["document"] = {};
document.createElement = (name)=>{
    if(name == "canvas")return createCanvas(1,1);
    if(name == "img")return new Image();

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
import { LayaAtlas } from "./exporter/LayaAtlas";
import { MaxRectsUtil } from "./core/MaxRectsUtil";

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

    private async packfolder(dir_path){
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
        
        let results = new MaxRectsUtil().packImages(rects, 2048, 2048, 1);
        // if(results.length > 1){
        //     results = new MaxRectsUtil().packImages(rects, 1024, 1024, 1);
        // }
        // if(results.length > 1){
        //     results = new MaxRectsUtil().packImages(rects, 2048, 2048, 1);
        // }
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