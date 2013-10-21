module Mp4 {
  var toString = Object.prototype.toString;
  var BUFF8 = new Uint8Array(0x8000);
  var BUFF16 = new Uint16Array(BUFF8.buffer);
  var BUFF32 = new Uint32Array(BUFF8.buffer);

  var expandBuffer = (expandWidth: number) => {
    var n = BUFF8.byteLength + expandWidth;
    var m = BUFF8.byteLength;
    while (m < n) m *= 2;
    var bytes = new Uint8Array(m);
    bytes.set(BUFF8);
    BUFF8 = bytes;
    BUFF16 = new Uint16Array(bytes.buffer);
    BUFF32 = new Uint32Array(bytes.buffer);
  };


  export class DataView2 {
    private view: DataView;
    private buffer: ArrayBuffer;
    private byteOffset: number;
    private byteLength: number;

    constructor(buffer: any, byteOffset?: number, byteLength?: number) {
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
          default: throw new TypeError();
        }
      }

      this.buffer = this.view.buffer;
      this.byteOffset = this.view.byteOffset;
      this.byteLength = this.view.byteLength;
    }

    getUint8(byteOffset: number): number {
      return this.view.getUint8(byteOffset);
    }

    setUint8(byteOffset: number, value: number) {
      this.view.setUint8(byteOffset, value);
    }

    getInt8(byteOffset: number): number {
      return this.view.getInt8(byteOffset);
    }

    setInt8(byteOffset: number, value: number) {
      this.view.setInt8(byteOffset, value);
    }

    getUint16(byteOffset: number, littleEndian: boolean = false): number {
      return this.view.getUint16(byteOffset, littleEndian);
    }

    setUint16(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.view.setUint16(byteOffset, value, littleEndian);
    }

    getInt16(byteOffset: number, littleEndian: boolean = false): number {
      return this.view.getInt16(byteOffset, littleEndian);
    }

    setInt16(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.view.setInt16(byteOffset, value, littleEndian);
    }

    getUint32(byteOffset: number, littleEndian: boolean = false): number {
      return this.view.getUint32(byteOffset, littleEndian);
    }

    setUint32(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.view.setUint32(byteOffset, value, littleEndian);
    }

    getInt32(byteOffset: number, littleEndian: boolean = false): number {
      return this.view.getInt32(byteOffset, littleEndian);
    }

    setInt32(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.view.setInt32(byteOffset, value, littleEndian);
    }

    getFloat32(byteOffset: number, littleEndian: boolean = false): number {
      return this.view.getFloat32(byteOffset, littleEndian);
    }

    setFloat32(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.view.setFloat32(byteOffset, value, littleEndian);
    }

    getFloat64(byteOffset: number, littleEndian: boolean = false): number {
      return this.view.getFloat64(byteOffset, littleEndian);
    }

    setFloat64(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.view.setFloat64(byteOffset, value, littleEndian);
    }

    getString(byteOffset: number, byteLength: number): string {
      var bytes = new Uint8Array(this.buffer, this.byteOffset + byteOffset, byteLength);
      return String.fromCharCode.apply(null, bytes);
    }

    setString(byteOffset: number, s: string) {
      var bytes = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
      var i = s.length;
      while(i) bytes[--i] = s.charCodeAt(i);
    }

    getUTF8String(byteOffset: number, byteLength: number): string {
      var bytes = new Uint8Array(this.buffer, this.byteOffset + byteOffset, this.byteLength);
      return DataView2.UTF8BytesToString(bytes);
    }

    static stringToUTF8Bytes(s: string): Uint8Array {
      var n = s.length,
          idx = -1,
          buff = BUFF8,
          byteLength = buff.byteLength,
          i, c;

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
    }

    static UTF8BytesToString(bytes: Uint8Array): string {
      var n = bytes.byteLength;
      var buff = BUFF32;
      var idx = 0;
      var i = 0;
      var c: number;
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
    }

    setUTF8String(byteOffset: number, s: string): number {
      var UTF8Bytes = DataView2.stringToUTF8Bytes(s);
      var bytes = new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
      bytes.set(UTF8Bytes, byteOffset);
      return UTF8Bytes.length;
    }

    getUint24(byteOffset: number, littleEndian: boolean = false): number {
      var b = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
      return littleEndian ? (b[0] | (b[1] << 8) | (b[2] << 16)) : (b[2] | (b[1] << 8) | (b[0] << 16));
    }

    setUint24(byteOffset: number, value: number, littleEndian: boolean = false) {
      var b = new Uint8Array(this.buffer, this.byteOffset + byteOffset);
      if(littleEndian) {
        b[0] = value & 0xFF;
        b[1] = (value & 0xFF00) >> 8;
        b[2] = (value & 0xFF0000) >> 16;
      } else {
        b[2] = value & 0xFF;
        b[1] = (value & 0xFF00) >> 8;
        b[0] = (value & 0xFF0000) >> 16;
      }
    }

    getInt24(byteOffset: number, littleEndian: boolean = false): number {
      var v = this.getUint24(byteOffset, littleEndian);
      return v & 0x800000 ? v - 0x1000000 : v;
    }

    setInt24(byteOffset: number, value: number, littleEndian: boolean = false) {
      this.setUint24(byteOffset, value, littleEndian);
    }
  }
}