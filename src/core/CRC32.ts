export class CRC32Util {
    /**
     * 计算时用到的CRC缓存数据表
     */
    private static _crcTable: number[];
    /**
     * 获取CRC缓存数据表
     */
    static makeCrcTable = function () {
        var crcTable = new Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 8; --k >= 0;) {
                if ((c & 1) !== 0) {
                    c = 0xedb88320 ^ (c >>> 1);
                } else {
                    c = c >>> 1;
                }
            }
            crcTable[n] = c;
        }
        return crcTable;
    };
    /**
     * 从字节流计算CRC32数据
     * @param buf 要计算的字节流
     */
    static getCRC32(buf) {
        if (!CRC32Util._crcTable) {
            CRC32Util._crcTable = CRC32Util.makeCrcTable()
        }
        let crcTable = CRC32Util._crcTable;

        var crc = 0;
        var off = 0;
        var len = buf.length;
        var c = (~crc) & 0xffffffff;
        while (--len >= 0) {
            c = crcTable[(c ^ buf.charCodeAt(off)) & 0xff] ^ (c >>> 8);
            off++;
        }
        crc = ~c;
        return Math.abs(crc);
    };
}