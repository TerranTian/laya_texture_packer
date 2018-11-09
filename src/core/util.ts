import * as path from "path";
import * as fs from "fs";

export function output(msg) {
    console.log(`output:${msg}`)
}

export function mkdirByUrl(url) {
    try {
        let dirs = [];
        while (true) {
            url = path.dirname(url);
            if (!fs.existsSync(url)) {
                dirs.push(url);
            } else {
                break;
            }
        }
        let i = dirs.length - 1;
        for (; i >= 0; i--) {
            fs.mkdirSync(dirs[i]);
        }
    } catch (e) {}
}

export function saveBase64(url, str) {
    mkdirByUrl(url);
    let buffer = new Buffer(str, 'base64');
    let fileUrl = path.normalize(url);
    // output('saveBase64:'+fileUrl);
    fs.writeFileSync(fileUrl, buffer);
}

export function readImageToDataUrl(url, callBack?):Promise<string> {
    return new Promise((resolve,reject)=>{
        let fileType = url.substring(url.lastIndexOf('.') + 1);
        let fileUrl = path.normalize(url);
        fs.readFile(fileUrl, function (err, data) {
            if (err) {
                callBack && callBack(null);
                resolve(null);
            } else {
                let b4 = ("data:image/" + fileType + ";base64,") + data.toString('base64')
                callBack && callBack(b4);
                resolve(b4);
            }
        });
    })
}

export function readImageAsyn(url) {
    try {
        let fileType = url.substring(url.lastIndexOf('.') + 1);
        let fileUrl = path.normalize(url);
        return fs.readFileSync(fileUrl).toString('base64');
    } catch (e) {
        output("readImageAsyn error:"+ e.message);
    }
}
export function readText(url) {
    try {
        url = path.normalize(url);
        let configstr = fs.readFileSync(url).toString();
        // output('readText:'+configstr);
        return configstr;
    } catch (e) {
        output("readText error:"+e.message);
    }
}
export function writeText(url, data) {
    mkdirByUrl(url);
    try {
        fs.writeFileSync(path.normalize(url), data, {
            encoding: 'utf8'
        });
    } catch (e) {
        output('写入Text文件失败:' + url);
    }
}
export function readJson(url) {
    url = path.normalize(url);
    let obj;
    try {
        let configstr = fs.readFileSync(url).toString();
        obj = JSON.parse(configstr);
    } catch (error) {
        output('读取json文件失败:' + url);
    }
    return obj;
}
export function writeJson(url, data) {
    mkdirByUrl(url);
    try {
        if (data instanceof String) {
            fs.writeFileSync(path.normalize(url), data);
        } else {
            fs.writeFileSync(path.normalize(url), JSON.stringify(data, null, 0));
        }
    } catch (e) {
        output('写入Json文件失败:' + url);
    }
}
export function copyFile(fromUrl, toUrl) {
    try {
        mkdirByUrl(toUrl);
        fromUrl = path.normalize(fromUrl);
        toUrl = path.normalize(toUrl);
        fs.writeFileSync(toUrl, fs.readFileSync(fromUrl));
    } catch (e) {
        output('copyFile error:' + fromUrl + ' ===> ' + toUrl);
    }
}
export function exitFile(url) {
    return fs.existsSync(path.normalize(url));
}

export function escapePath(str) {
    str = str.split('\\').join('/');
    let index = str.indexOf(':/');
    if (index >= 0) {
        str = str.substring(0, index).toUpperCase() + str.substring(index);
    }
    return str;
}
export function foreachFiles(url) {
    url = path.normalize(url);
    let results = [];
    lsFile(url, results);
    return results;
}
export function lsFile(ff, reuslts) {
    let files = fs.readdirSync(ff);
    let i = 0;
    let len = files.length;
    for (; i < len; i++) {
        let fname = escapePath(ff + path.sep + files[i]);
        let stat = fs.lstatSync(fname);
        if (stat.isDirectory() === true) {
            lsFile(fname, reuslts);
        } else {
            reuslts.push(fname);
        }
    }
}
export function lsFileNo(ff, reuslts) {
    let files = fs.readdirSync(ff);
    let i = 0;
    let len = files.length;
    for (; i < len; i++) {
        let fname = escapePath(ff + path.sep + files[i]);
        let stat = fs.lstatSync(fname);
        if (!stat.isDirectory()) {
            reuslts.push(fname);
        }
    }
}
export function deleteFile(url) {
    if(!fs.existsSync(url)) return;
    try {
        fs.unlinkSync(path.normalize(url));
    } catch (e) {
        output('deleteFile error:' + url);
    }
}
export function pathJoin(url1, url2) {
    return escapePath(path.join(url1, url2));
}

export async function createHtmlElement(path:string){
    let data = await readImageToDataUrl(path);
    if(!data) return null;
    let imgElement:HTMLImageElement = await new Promise<HTMLImageElement>((resolve,reject)=>{
        let img = document.createElement('img');
        img.onload = ()=>{
            img.onerror = img.onload = null;
            resolve(img);
        };
        img.onerror = (e)=>{
            img.onerror = img.onload = null;
            resolve(null);
        };
        img.src = data;
    })
    return imgElement;
}