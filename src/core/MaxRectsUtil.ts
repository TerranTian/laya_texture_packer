import { MaxRectangle, FreeRectangleChoiceHeuristic, MaxRectsCore } from "./MaxRectsCore";


export enum MaxRectsSortType {
    /**
     * 按面积排序
     */
    AREA = 'area',
    /**
     * 按宽高排序
     */
    SIZE = 'size'
}

export enum MaxRectsResultType {

    /**
     * 成功了
     */
    SUCCESS = 'success',
    /**
     * 切片面积太大，超过了最大尺寸限制
     */
    SHEET_TO_BIG = 'toBig',
    /**
     * 存在空图
     */
    SHEET_EMPTY = 'sheetEmpty'
}

/**
 * MaxRects工具
 * 
 *
 */
export class MaxRectsUtil {
    packImages(rectangles:MaxRectangle[], imageWidth:number, imageHeight:number, gap=2):{maxWidth:number,maxHeight:number,imageGroups:MaxRectangle[]}[]{
        rectangles.sort((a, b)=>b.area - a.area)
        var results = [];
        var imageRectCores:MaxRectsCore[] = [];

        var newRect;
        var coreLen = 0;
        //遍历所有图片，如果图片大于最大尺寸，则单独为一组；否则遍历已经存在的组，如果找不到组合容纳，则创建新组容纳。
        for (let i=0; i < rectangles.length; i++) {
            let currentRect = rectangles[i];
            currentRect.orginWidth = currentRect.width;
            currentRect.orginWHeight = currentRect.height;
            currentRect.width = Math.min(imageWidth, currentRect.width + gap);
            currentRect.height = Math.min(imageHeight, currentRect.height + gap);
            // if(currentRect.width>imageWidth || currentRect.height >imageHeight){
            // 	newGroup = [currentRect];
            // 	results.push({maxWidth:0,maxHeight:0,imageGroups:newGroup});
            // }
            for (let j = 0; j < coreLen; j++) {
                let currentCore = imageRectCores[j];
                newRect = currentCore.insert(currentRect.width, currentRect.height, currentRect.data, this.layoutMath);
                if (newRect.width > 0) {
                    break;
                } else {
                    newRect = null;
                }
            }
            if (!newRect) {
                let currentCore = this.createMaxRectCore(this.calculater2(Math.max(currentRect.width, imageWidth)), this.calculater2(Math.max(currentRect.height, imageHeight)));
                imageRectCores.push(currentCore);
                coreLen++;
                newRect = currentCore.insert(currentRect.width, currentRect.height, currentRect.data, this.layoutMath);
            }
            newRect.orginWidth = currentRect.orginWidth;
            newRect.orginWHeight = currentRect.orginWHeight;
        }
        //将容纳箱中的图片放进组中
        for (let j = 0; j < coreLen; j++) {
            let currentCore = imageRectCores[j];
            results.push({
                maxWidth: 0,
                maxHeight: 0,
                imageGroups: currentCore.usedRectangles
            });
        }
        //将宽高恢复
        for (let i = 0; i < results.length; i++) {
            var maxWidth = 0;
            var maxheight = 0;
            results[i].imageGroups.forEach(function (rect) {
                rect.width = rect.orginWidth;
                rect.height = rect.orginWHeight;
                maxWidth = Math.max(maxWidth, rect.x + rect.width);
                maxheight = Math.max(maxheight, rect.y + rect.height);
            });
            results[i].maxWidth = maxWidth;
            results[i].maxHeight = maxheight;
        }
        return results;
    };

    packImages3(rectangles, imageWidth, imageHeight, gap):{maxWidth:number,maxHeight:number,imageGroups:MaxRectangle[]}[] {
        rectangles.sort(function (a, b) {
            return (a.area > b.area) ? -1 : 1;
        });
        gap = 2;
        this.setGap(gap);
        this.setMaxSize(imageWidth, imageHeight);
        var results = [];
        var currentMergeList = [];
        var area = 0;
        for (var i = 0; i < rectangles.length; i++) {
            var rect = rectangles[i];
            rect.orginWidth = rect.width;
            rect.orginWHeight = rect.height;
            rect.width = Math.min(imageWidth, rect.width + gap);
            rect.height = Math.min(imageHeight, rect.height + gap);
            currentMergeList.push(rect);

            area += rect.width * rect.height;
            if (area > imageWidth * imageHeight) {
                //如果面积已经超出最大尺寸的话，那么执行递减的测试，找到合适的元素个数
                var testResult = this.test(currentMergeList);
                results.push({
                    maxWidth: testResult.w,
                    maxHeight: testResult.h,
                    imageGroups: testResult.rects
                });
                i -= testResult.deleteNum;

                currentMergeList = [];
                area = 0;
                // console.log('分组',testResult.w,testResult.h,testResult.rects.length);
            }
        }
        //如果有剩余，将剩余部分进行测试
        if (currentMergeList.length > 0) {
            var testResult = this.test(currentMergeList);
            results.push({
                maxWidth: testResult.w,
                maxHeight: testResult.h,
                imageGroups: testResult.rects
            });
            // console.log('剩余',testResult.w,testResult.h,testResult.rects.length);
            //扔剩余
            currentMergeList = rectangles.splice(rectangles.length - testResult.deleteNum, testResult.deleteNum);
            if (currentMergeList.length > 0) {
                var testResult = this.test(currentMergeList);
                results.push({
                    maxWidth: testResult.w,
                    maxHeight: testResult.h,
                    imageGroups: testResult.rects
                });
                // console.log('扔剩余',testResult.deleteNum);
            }

        }

        return results;
    };
    private test(rectangles) {
        var deleteNum = 0;
        while (rectangles.length > 0) {
            this.insertRectangles(rectangles);
            if (this.resultType === MaxRectsResultType.SHEET_TO_BIG) {
                rectangles.forEach(function (rect) {
                    rect.width = rect.orginWidth;
                    rect.height = rect.orginWHeight;
                });
                rectangles.pop();
                deleteNum++;
            } else {
                break;
            }
        }
        return {
            deleteNum: deleteNum,
            w: this.resultSize.x,
            h: this.resultSize.y,
            rects: this.result
        }
    }

    private calculater2(num) {
        return num;
        // var newNum = 2;
        // while (num > newNum) {
        //     newNum = newNum << 1;
        // }
        // return newNum;
    };
    private createMaxRectCore(w, h) {
        var core = new MaxRectsCore();
        core.setCanRotate(false);
        core.init(w, h);
        return core;
    };

    get result() {
        return this._result.concat();
    }
    get resultType() {
        return this._resultType
    }
    get resultSize() {
        return this._resultSize;
    }

    /**
     * 设置最大尺寸
     * @param maxWidth 最大宽度
     * @param maxHeight 最大高度
     *
     */
    setMaxSize(maxWidth, maxHeight) {
        if (maxWidth === void 0) {
            maxWidth = -1;
        }
        if (maxHeight === void 0) {
            maxHeight = -1;
        }
        this._maxWidth = maxWidth;
        this._maxHeight = maxHeight;
    };
    /**
     * 设置排序方式见MaxRectsSortType
     * @param type
     */
    setSortOn(type) {
        this.sortType = type;
    };
    /**
     * 设置间隔
     * @param gap
     *
     */
    setGap(gap) {
        if (gap === void 0) {
            gap = 0;
        }
        this._gap = gap;
    };
    /**
     * 设置是否可以旋转
     * @param value
     */
    private setCanRotate(value) {
        this.maxRectsCore.setCanRotate(value);
    };
    /**
     *设置布局方式
     * @param v
     *
     */
    private setLayoutMath(v) {
        this.layoutMath = v;
    };
    /**
     *设置布局过程中新对象的工厂实例，布局过程产生新对象时将从该工厂实例中获取新对象，默认：MaxRectangle
     * @param instance
     *
     */
    private setFactoryInstance(instance) {
        this.maxRectsCore.factory = instance;
    };
    /**
     * 插入切片开始合图，需要保证每一个切片的面积都大于0
     * @param rectangles
     *
     */
    insertRectangles(rectangles) {
        this._result = null;
        //先过滤一遍碎图，看有没有尺寸为0的图
        var newRects = [];
        for (var i = 0; i < rectangles.length; i++) {
            if (rectangles[i].width > 0 && rectangles[i].height > 0) {
                newRects.push(rectangles[i]);
            }
        }
        if (newRects.length !== rectangles.length) {
            this._resultType = MaxRectsResultType.SHEET_EMPTY;
            // console.log('有图的尺寸不对，宽和高都不能为零');
            return;
        }
        // console.log('加载了:'+rectangles.length+' 个图片');
        //增加间隙
        if (this._gap > 0) {
            for (i = 0; i < newRects.length; i++) {
                newRects[i].width += this._gap;
                newRects[i].height += this._gap;
            }
        }
        //得到碎图的最大宽，最大高，和最大面积
        this._maxW = 0;
        this._maxH = 0;
        var area = 0;
        for (i = 0; i < newRects.length; i++) {
            if (newRects[i].width > this._maxW) {
                this._maxW = newRects[i].width;
            }
            if (newRects[i].height > this._maxH) {
                this._maxH = newRects[i].height;
            }
            area += newRects[i].width * newRects[i].height;
        }
        // console.log('maxW:'+this._maxW+' maxH:'+this._maxH+' area:'+area);
        //现将幂按照碎图的最大宽高做一次过滤
        this._w = 1;
        this._h = 1;
        while (Math.pow(2, this._w) < this._maxW) {
            this._w++;
        }
        while (Math.pow(2, this._h) < this._maxH) {
            this._h++;
        }
        // console.log('第一次过滤 宽幂:'+  this._w+' 宽:'+Math.pow(2,  this._w)+' 高幂:'+  this._h+' 高:'+Math.pow(2,  this._h));
        this._baseW = this._w;
        this._baseH = this._h;
        while (Math.pow(2, this._w) * Math.pow(2, this._h) < area) {
            this.calculateNext();
        }
        this._baseW = this._w;
        this._baseH = this._h;
        // console.log('第二次过滤 宽幂:'+  this._w+' 宽:'+Math.pow(2,  this._w)+' 高幂:'+  this._h+' 高:'+Math.pow(2,  this._h));
        if (this.sortType === MaxRectsSortType.AREA) {
            //按面积排序一遍
            for (i = 0; i < newRects.length; i++) {
                for (var j = i; j < newRects.length; j++) {
                    if (newRects[i].height * newRects[i].width < newRects[j].height * newRects[j].width) {
                        var temp = newRects[i];
                        newRects[i] = newRects[j];
                        newRects[j] = temp;
                    }
                }
            }
        } else if (this.sortType === MaxRectsSortType.SIZE) {
            if (this._maxW > this._maxH) {
                //按宽排序一遍
                for (i = 0; i < newRects.length; i++) {
                    for (j = i; j < newRects.length; j++) {
                        if (newRects[i].width < newRects[j].width) {
                            temp = newRects[i];
                            newRects[i] = newRects[j];
                            newRects[j] = temp;
                        }
                    }
                }
            } else {
                //按高排序一遍
                for (i = 0; i < newRects.length; i++) {
                    for (j = i; j < newRects.length; j++) {
                        if (newRects[i].height < newRects[j].height) {
                            temp = newRects[i];
                            newRects[i] = newRects[j];
                            newRects[j] = temp;
                        }
                    }
                }
            }
        }
        var finish = false;
        var n = 0;
        var tooBig = false;
        while (!finish) {
            var currentW = Math.pow(2, this._w);
            var currentH = Math.pow(2, this._h);
            var tempRectangles = newRects.concat();
            // console.log(n+'次计算，'+'宽:'+currentW+' 高:'+currentH+'     '+'宽幂:'+  this._w+' 高幂:'+  this._h);
            this.maxRectsCore.init(currentW, currentH);
            this.maxRectsCore.insertGroup(tempRectangles, this.layoutMath);
            var results = this.maxRectsCore.usedRectangles;
            finish = true;
            var hasError = false;
            for (i = 0; i < results.length; i++) {
                if (results[i].x === 0 && results[i].y === 0 && results[i].width === 0 && results[i].height === 0) {
                    hasError = true;
                    break;
                }
            }
            if (hasError) {
                this.calculateNext();
                finish = false;
            }
            n++;
            if ((currentW > this._maxWidth && this._maxWidth > 0) ||
                (currentH > this._maxHeight && this._maxHeight > 0)) {
                finish = true;
                tooBig = true;
            }
        }
        if (tooBig) {
            this._resultType = MaxRectsResultType.SHEET_TO_BIG;
            // console.log('图太多了，最大尺寸都不够')
            return;
        }
        // console.log('成功了'+'最终宽度:'+currentW+' 最终高度:'+currentH)
        this._resultSize.x = currentW;
        this._resultSize.y = currentH;
        this._resultType = MaxRectsResultType.SUCCESS;
        this._result = this.maxRectsCore.usedRectangles;
        if (this._gap > 0) {
            for (i = 0; i < this._result.length; i++) {
                this._result[i].width -= this._gap;
                this._result[i].height -= this._gap;
                this._result[i].x += Math.floor(this._gap / 2);
                this._result[i].y += Math.floor(this._gap / 2);
            }
        }
    };
    private calculateNext() {
        if (this._maxW > this._maxH) {
            if (this._w === this._h) {
                this._h++;
                this._w = this._baseW;
                return;
            }
            if (this._h > this._w + 1) {
                this._w++;
                return;
            }
            if (this._h === this._w + 1) {
                this._w = this._h;
                this._h = this._baseH;
                return;
            }
            if (this._w > this._h + 1) {
                this._h++;
                return;
            }
            if (this._w === this._h + 1) {
                this._h = this._w;
                return;
            }
        } else {
            if (this._h === this._w) {
                this._w++;
                this._h = this._baseH;
                return;
            }
            if (this._w > this._h + 1) {
                this._h++;
                return;
            }
            if (this._w === this._h + 1) {
                this._h = this._w;
                this._w = this._baseW;
                return;
            }
            if (this._h > this._w + 1) {
                this._w++;
                return;
            }
            if (this._h === this._w + 1) {
                this._w = this._h;
                return;
            }
        }
    };

    private maxRectsCore = new MaxRectsCore();
    private _maxWidth = -1;
    private _maxHeight = -1;
    /**
     * 是否输出信息
     */
    private isLog = true;
    private _resultSize = {x:0,y:0};
    private sortType = MaxRectsSortType.AREA;
    private _gap = 0;
    private layoutMath = FreeRectangleChoiceHeuristic.BottomLeftRule;
    private _resultType = '';
    //宽和搞的幂数
    private _w = 1;
    private _h = 1;
    private _maxW = 0;
    private _maxH = 0;
    private _baseW = 1;
    private _baseH = 1;

    private _result: MaxRectangle[];
}
