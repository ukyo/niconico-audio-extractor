var Mp4;
(function (Mp4) {
    var toString = Object.prototype.toString;
    var BUFF8 = new Uint8Array(0x8000);
    var BUFF16 = new Uint16Array(BUFF8.buffer);
    var BUFF32 = new Uint32Array(BUFF8.buffer);

    var expandBuffer = function (expandWidth) {
        var n = BUFF8.byteLength + expandWidth;
        var m = BUFF8.byteLength;
        while (m < n)
            m *= 2;
        var bytes = new Uint8Array(m);
        bytes.set(BUFF8);
        BUFF8 = bytes;
        BUFF16 = new Uint16Array(bytes.buffer);
        BUFF32 = new Uint32Array(bytes.buffer);
    };

    var DataView2 = (function () {
        function DataView2(buffer, byteOffset, byteLength) {
            if (typeof buffer === 'number') {
                this.view = new DataView(new ArrayBuffer(buffer));
            } else {
                switch (toString.call(buffer)) {
                    case '[object ArrayBuffer]':
                        byteOffset = byteOffset || 0;
                        byteLength = byteLength || buffer.byteLength;
                        this.view = new DataView(buffer, byteOffset, byteLength);
                        break;
                    case '[object Uint8Array]':
                    case '[object Uint8ClampedArray]':
                    case '[object CanvasPixelArray]':
                    case '[object Int8Array]':
                    case '[object Uint16Array]':
                    case '[object Int16Array]':
                    case '[object Uint32Array]':
                    case '[object Int32Array]':
                    case '[object Float32Array]':
                    case '[object Float64Array]':
                    case '[object DataView]':
                        if (byteOffset === undefined && byteLength === undefined) {
                            this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
                        } else if (byteOffset !== undefined && byteLength === undefined) {
                            this.view = new DataView(buffer.buffer, buffer.byteOffset + byteOffset);
                        } else if (byteOffset === undefined && byteLength !== undefined) {
                            this.view = new DataView(buffer.buffer, buffer.byteOffset, byteLength);
                        } else {
                            this.view = new DataView(buffer.buffer, byteOffset, byteLength);
                        }
                        break;
                    default:
                        throw new TypeError();
                }
            }

            this.buffer = this.view.buffer;
            this.byteOffset = this.view.byteOffset;
            this.byteLength = this.view.byteLength;
        }
        DataView2.prototype.getUint8 = function (byteOffset) {
            return this.view.getUint8(byteOffset);
        };

        DataView2.prototype.setUint8 = function (byteOffset, value) {
            this.view.setUint8(byteOffset, value);
        };

        DataView2.prototype.getInt8 = function (byteOffset) {
            return this.view.getInt8(byteOffset);
        };

        DataView2.prototype.setInt8 = function (byteOffset, value) {
            this.view.setInt8(byteOffset, value);
        };

        DataView2.prototype.getUint16 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            return this.view.getUint16(byteOffset, littleEndian);
        };

        DataView2.prototype.setUint16 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.view.setUint16(byteOffset, value, littleEndian);
        };

        DataView2.prototype.getInt16 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            return this.view.getInt16(byteOffset, littleEndian);
        };

        DataView2.prototype.setInt16 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.view.setInt16(byteOffset, value, littleEndian);
        };

        DataView2.prototype.getUint32 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            return this.view.getUint32(byteOffset, littleEndian);
        };

        DataView2.prototype.setUint32 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.view.setUint32(byteOffset, value, littleEndian);
        };

        DataView2.prototype.getInt32 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            return this.view.getInt32(byteOffset, littleEndian);
        };

        DataView2.prototype.setInt32 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.view.setInt32(byteOffset, value, littleEndian);
        };

        DataView2.prototype.getFloat32 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            return this.view.getFloat32(byteOffset, littleEndian);
        };

        DataView2.prototype.setFloat32 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.view.setFloat32(byteOffset, value, littleEndian);
        };

        DataView2.prototype.getFloat64 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            return this.view.getFloat64(byteOffset, littleEndian);
        };

        DataView2.prototype.setFloat64 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.view.setFloat64(byteOffset, value, littleEndian);
        };

        DataView2.prototype.getString = function (byteOffset, byteLength) {
            var bytes = new Uint8Array(this.buffer, this.byteOffset + byteOffset, byteLength);
            return String.fromCharCode.apply(null, bytes);
        };

        DataView2.prototype.setString = function (byteOffset, s) {
            var bytes = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
            var i = s.length;
            while (i)
                bytes[--i] = s.charCodeAt(i);
        };

        DataView2.prototype.getUTF8String = function (byteOffset, byteLength) {
            var bytes = new Uint8Array(this.buffer, this.byteOffset + byteOffset, this.byteLength);
            return DataView2.UTF8BytesToString(bytes);
        };

        DataView2.stringToUTF8Bytes = function (s) {
            var n = s.length, idx = -1, buff = BUFF8, byteLength = buff.byteLength, i, c;

            for (i = 0; i < n; ++i) {
                c = s.charCodeAt(i);
                if (c <= 0x7F) {
                    buff[++idx] = c;
                } else if (c <= 0x7FF) {
                    buff[++idx] = 0xC0 | (c >>> 6);
                    buff[++idx] = 0x80 | (c & 0x3F);
                } else if (c <= 0xFFFF) {
                    buff[++idx] = 0xE0 | (c >>> 12);
                    buff[++idx] = 0x80 | ((c >>> 6) & 0x3F);
                    buff[++idx] = 0x80 | (c & 0x3F);
                } else {
                    buff[++idx] = 0xF0 | (c >>> 18);
                    buff[++idx] = 0x80 | ((c >>> 12) & 0x3F);
                    buff[++idx] = 0x80 | ((c >>> 6) & 0x3F);
                    buff[++idx] = 0x80 | (c & 0x3F);
                }

                if (byteLength - idx <= 4) {
                    expandBuffer(4);
                    buff = BUFF8;
                }
            }

            var bytes = new Uint8Array(++idx);
            bytes.set(buff.subarray(0, idx));

            return bytes;
        };

        DataView2.UTF8BytesToString = function (bytes) {
            var n = bytes.byteLength;
            var buff = BUFF32;
            var idx = 0;
            var i = 0;
            var c;
            var ret = '';

            while (i < n) {
                for (idx = 0; idx < 0x1000 && i < n; ++i, ++idx) {
                    c = bytes[i];
                    if (c < 0x80) {
                        buff[idx] = c;
                    } else if ((c >>> 5) === 0x06) {
                        buff[idx] = (c & 0x1F) << 6;
                        buff[idx] |= bytes[++i] & 0x3F;
                    } else if ((c >>> 4) === 0x0E) {
                        buff[idx] = (c & 0x0F) << 12;
                        buff[idx] |= (bytes[++i] & 0x3F) << 6;
                        buff[idx] |= bytes[++i] & 0x3F;
                    } else {
                        buff[idx] = (c & 0x07) << 18;
                        buff[idx] |= (bytes[++i] & 0x3F) << 12;
                        buff[idx] |= (bytes[++i] & 0x3F) << 6;
                        buff[idx] |= bytes[++i] & 0x3F;
                    }
                }
                ret += String.fromCharCode.apply(null, buff.subarray(0, idx));
            }

            return ret;
        };

        DataView2.prototype.setUTF8String = function (byteOffset, s) {
            var UTF8Bytes = DataView2.stringToUTF8Bytes(s);
            var bytes = new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
            bytes.set(UTF8Bytes, byteOffset);
            return UTF8Bytes.length;
        };

        DataView2.prototype.getUint24 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            var b = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
            return littleEndian ? (b[0] | (b[1] << 8) | (b[2] << 16)) : (b[2] | (b[1] << 8) | (b[0] << 16));
        };

        DataView2.prototype.setUint24 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            var b = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
            if (littleEndian) {
                b[0] = value & 0xFF;
                b[1] = (value & 0xFF00) >> 8;
                b[2] = (value & 0xFF0000) >> 16;
            } else {
                b[2] = value & 0xFF;
                b[1] = (value & 0xFF00) >> 8;
                b[0] = (value & 0xFF0000) >> 16;
            }
        };

        DataView2.prototype.getInt24 = function (byteOffset, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            var v = this.getUint24(byteOffset, littleEndian);
            return v & 0x800000 ? v - 0x1000000 : v;
        };

        DataView2.prototype.setInt24 = function (byteOffset, value, littleEndian) {
            if (typeof littleEndian === "undefined") { littleEndian = false; }
            this.setUint24(byteOffset, value, littleEndian);
        };
        return DataView2;
    })();
    Mp4.DataView2 = DataView2;
})(Mp4 || (Mp4 = {}));
//# sourceMappingURL=dataview.js.map
