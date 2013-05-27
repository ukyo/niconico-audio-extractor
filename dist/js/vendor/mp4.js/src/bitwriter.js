var Mp4;
(function (Mp4) {
    var BitWriter = (function () {
        function BitWriter(littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.littleEndian = littleEndian;
            this.bitOffset = 0;
            this.bytes = new Uint8Array(2);
            this.view = new Mp4.DataView2(this.bytes);
        }
        Object.defineProperty(BitWriter.prototype, "data", {
            get: function () {
                var byteOffset = this.byteOffset;
                if(byteOffset > this.bytes.length) {
                    var bytes = new Uint8Array(byteOffset);
                    bytes.set(this.bytes);
                    return bytes;
                } else {
                    return this.bytes.subarray(0, byteOffset);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BitWriter.prototype, "byteOffset", {
            get: function () {
                return this.bitOffset >>> 3;
            },
            enumerable: true,
            configurable: true
        });
        BitWriter.prototype.skipBits = function (n) {
            this.bitOffset += n;
        };
        BitWriter.prototype.skipBytes = function (n) {
            this.skipBits(n * 8);
        };
        BitWriter.prototype.writeBits = function (n, bitLength) {
            this.expandBuffer(bitLength);
            var needBytes = Math.ceil((this.bitOffset % 8 + bitLength) / 8);
            var tmp;
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
            tmp |= n << (needBytes * 8 - (this.bitOffset % 8 + bitLength));
            switch(needBytes) {
                case 1:
                    this.view.setUint8(this.byteOffset, tmp);
                    break;
                case 2:
                    this.view.setUint16(this.byteOffset, tmp);
                    break;
                case 3:
                    this.view.setUint24(this.byteOffset, tmp);
                    break;
                case 4:
                    this.view.setUint32(this.byteOffset, tmp);
                    break;
            }
            this.skipBits(bitLength);
        };
        BitWriter.prototype.writeBytes = function (bytes) {
            this.expandBuffer(bytes.length * 8);
            this.bytes.set(bytes, this.byteOffset);
            this.skipBytes(bytes.length);
        };
        BitWriter.prototype.writeUint8 = function (n) {
            this.expandBuffer(8);
            this.view.setUint8(this.byteOffset, n);
            this.skipBytes(1);
        };
        BitWriter.prototype.writeInt8 = function (n) {
            this.expandBuffer(8);
            this.view.setInt8(this.byteOffset, n);
            this.skipBytes(1);
        };
        BitWriter.prototype.writeUint16 = function (n) {
            this.expandBuffer(16);
            this.view.setUint16(this.byteOffset, n, this.littleEndian);
            this.skipBytes(2);
        };
        BitWriter.prototype.writeInt16 = function (n) {
            this.expandBuffer(16);
            this.view.setInt16(this.byteOffset, n, this.littleEndian);
            this.skipBytes(2);
        };
        BitWriter.prototype.writeUint24 = function (n) {
            this.expandBuffer(24);
            this.view.setUint24(this.byteOffset, n, this.littleEndian);
            this.skipBytes(3);
        };
        BitWriter.prototype.writeInt24 = function (n) {
            this.expandBuffer(24);
            this.view.setInt24(this.byteOffset, n, this.littleEndian);
            this.skipBytes(3);
        };
        BitWriter.prototype.writeUint32 = function (n) {
            this.expandBuffer(32);
            this.view.setUint32(this.byteOffset, n, this.littleEndian);
            this.skipBytes(4);
        };
        BitWriter.prototype.writeInt32 = function (n) {
            this.expandBuffer(32);
            this.view.setInt32(this.byteOffset, n, this.littleEndian);
            this.skipBytes(4);
        };
        BitWriter.prototype.writeFloat32 = function (n) {
            this.expandBuffer(32);
            this.view.setFloat32(this.byteOffset, n, this.littleEndian);
            this.skipBytes(4);
        };
        BitWriter.prototype.writeFloat64 = function (n) {
            this.expandBuffer(64);
            this.view.setFloat64(this.byteOffset, n, this.littleEndian);
            this.skipBytes(8);
        };
        BitWriter.prototype.writeString = function (s) {
            this.expandBuffer(s.length * 8);
            this.view.setString(this.byteOffset, s);
            this.skipBytes(s.length);
        };
        BitWriter.prototype.writeStringNullTerminated = function (s) {
            this.writeString(s + '\0');
        };
        BitWriter.prototype.writeUTF8String = function (s) {
            var UTF8Bytes = Mp4.DataView2.stringToUTF8Bytes(s);
            this.expandBuffer(UTF8Bytes.length * 8);
            this.writeBytes(UTF8Bytes);
        };
        BitWriter.prototype.writeUTF8StringNullTerminated = function (s) {
            this.writeUTF8String(s + '\0');
        };
        BitWriter.prototype.expandBuffer = function (expandBitWidth) {
            var bitLength = this.bytes.length * 8;
            var originalBitLength = bitLength;
            while(bitLength < this.bitOffset + expandBitWidth) {
                bitLength *= 2;
            }
            var bytes = new Uint8Array(Math.ceil(bitLength / 8));
            bytes.set(this.bytes);
            this.bytes = bytes;
            this.view = new Mp4.DataView2(bytes);
        };
        return BitWriter;
    })();
    Mp4.BitWriter = BitWriter;    
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=bitwriter.js.map
