var Mp4;
(function (Mp4) {
    var BIT_MASKS = [
        0x00000000, 
        0x00000001, 
        0x00000003, 
        0x00000007, 
        0x0000000F, 
        0x0000001F, 
        0x0000003F, 
        0x0000007F, 
        0x000000FF, 
        0x000001FF, 
        0x000003FF, 
        0x000007FF, 
        0x00000FFF, 
        0x00001FFF, 
        0x00003FFF, 
        0x00007FFF, 
        0x0000FFFF, 
        0x0001FFFF, 
        0x0003FFFF, 
        0x0007FFFF, 
        0x000FFFFF, 
        0x001FFFFF, 
        0x003FFFFF, 
        0x007FFFFF, 
        0x00FFFFFF, 
        0x01FFFFFF
    ];
    var POW25 = Math.pow(2, 25);
    var BitReader = (function () {
        function BitReader(bytes, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.bytes = bytes;
            this.littleEndian = littleEndian;
            this.bitOffset = 0;
            this.view = new Mp4.DataView2(bytes);
        }
        BitReader.prototype.readBits = function (n) {
            if(n <= 0) {
                throw new Error();
            }
            var tmp;
            var needBytes;
            var m;
            var max = 25;
            var ret = 0;
            while(n > 0) {
                m = n > max ? max : n;
                ret *= POW25;
                needBytes = Math.ceil((this.bitOffset % 8 + m) / 8);
                switch(needBytes) {
                    case 1:
                        tmp = this.view.getUint8(this.byteOffset);
                        break;
                    case 2:
                        tmp = this.view.getUint16(this.byteOffset);
                        break;
                    case 3:
                        tmp = this.view.getUint24(this.byteOffset);
                        break;
                    case 4:
                        tmp = this.view.getUint32(this.byteOffset);
                        break;
                }
                ret += (tmp >>> (needBytes * 8 - (this.bitOffset % 8 + m))) & BIT_MASKS[m];
                this.skipBits(m);
                n -= m;
            }
            return ret;
        };
        BitReader.prototype.readUint8 = function () {
            var ret = this.view.getUint8(this.byteOffset);
            this.skipBytes(1);
            return ret;
        };
        BitReader.prototype.readInt8 = function () {
            var ret = this.view.getInt8(this.byteOffset);
            this.skipBytes(1);
            return ret;
        };
        BitReader.prototype.readUint16 = function () {
            var ret = this.view.getUint16(this.byteOffset, this.littleEndian);
            this.skipBytes(2);
            return ret;
        };
        BitReader.prototype.readInt16 = function () {
            var ret = this.view.getInt16(this.byteOffset, this.littleEndian);
            this.skipBytes(2);
            return ret;
        };
        BitReader.prototype.readUint24 = function () {
            var ret = this.view.getUint24(this.byteOffset, this.littleEndian);
            this.skipBytes(3);
            return ret;
        };
        BitReader.prototype.readInt24 = function () {
            var ret = this.view.getInt24(this.byteOffset, this.littleEndian);
            this.skipBytes(3);
            return ret;
        };
        BitReader.prototype.readUint32 = function () {
            var ret = this.view.getUint32(this.byteOffset, this.littleEndian);
            this.skipBytes(4);
            return ret;
        };
        BitReader.prototype.readInt32 = function () {
            var ret = this.view.getInt32(this.byteOffset, this.littleEndian);
            this.skipBytes(4);
            return ret;
        };
        BitReader.prototype.readFloat32 = function () {
            var ret = this.view.getFloat32(this.byteOffset, this.littleEndian);
            this.skipBytes(4);
            return ret;
        };
        BitReader.prototype.readFloat64 = function () {
            var ret = this.view.getFloat64(this.byteOffset, this.littleEndian);
            this.skipBytes(8);
            return ret;
        };
        BitReader.prototype.readBytes = function (n) {
            var byteOffset = this.byteOffset;
            var ret = this.bytes.subarray(byteOffset, byteOffset + n);
            this.skipBytes(n);
            return ret;
        };
        BitReader.prototype.readString = function (n) {
            if (typeof n === "undefined") { n = 0; }
            var ret;
            if(n === 0) {
                var bytes = this.bytes.subarray(this.byteOffset);
                ret = String.fromCharCode.apply(null, bytes);
                n = bytes.length;
            } else {
                ret = this.view.getString(this.byteOffset, n);
            }
            this.skipBytes(n);
            return ret;
        };
        BitReader.prototype.readStringNullTerminated = function () {
            var bytes = this.bytes.subarray(this.byteOffset);
            var i = 0;
            if(!bytes.byteLength) {
                return '';
            }
            while(bytes[i++] !== 0) {
                ;
            }
            this.skipBytes(i);
            return String.fromCharCode.apply(null, bytes.subarray(0, i - 1));
        };
        BitReader.prototype.readUTF8StringNullTerminated = function () {
            var bytes = this.bytes.subarray(this.byteOffset);
            var i = 0;
            if(!bytes.byteLength) {
                return '';
            }
            while(bytes[i++] !== 0) {
                ;
            }
            this.skipBytes(i);
            return Mp4.DataView2.UTF8BytesToString(bytes.subarray(0, i - 1));
        };
        BitReader.prototype.skipBits = function (n) {
            this.bitOffset += n;
        };
        BitReader.prototype.skipBytes = function (n) {
            this.bitOffset += n * 8;
        };
        Object.defineProperty(BitReader.prototype, "byteOffset", {
            get: function () {
                return this.bitOffset >>> 3;
            },
            enumerable: true,
            configurable: true
        });
        BitReader.prototype.eof = function () {
            return this.bitOffset / 8 >= this.bytes.length;
        };
        return BitReader;
    })();
    Mp4.BitReader = BitReader;    
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=bitreader.js.map
