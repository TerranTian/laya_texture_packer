export class FileUtil {
    /**
     * 获取路径的文件名(不含扩展名)或文件夹名
     */
    static getFileName(path) {
        if (path === null || path === '') {
            return '';
        }
        path = FileUtil.escapePath(path);
        var startIndex = path.lastIndexOf('/');
        var endIndex;
        if (startIndex > 0 && startIndex === path.length - 1) {
            path = path.substring(0, path.length - 1);
            startIndex = path.lastIndexOf('/');
            endIndex = path.length;
            return path.substring(startIndex + 1, endIndex);
        }
        endIndex = path.lastIndexOf('.');
        if (endIndex <= startIndex) {
            endIndex = path.length;
        }
        return path.substring(startIndex + 1, endIndex);
    };
    
    static getDirectory(path) {
        var path = FileUtil.escapePath(path);
        return path.substring(0, path.lastIndexOf('/') + 1);
    };
    /**
     * 获得路径的扩展名
     */
    static getExtension(path) {
        path = FileUtil.escapePath(path);
        var index = path.lastIndexOf('.');
        if (index === -1) {
            return '';
        }
        var i = path.lastIndexOf('/');
        if (i > index) {
            return '';
        }
        return path.substring(index + 1);
    };

    static escapePath(str) {
        return str.split('\\').join('/');
    };
}