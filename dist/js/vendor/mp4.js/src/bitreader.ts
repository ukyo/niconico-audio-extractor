/// <reference path="mp4.ts" />

module Mp4 {

  var BIT_MASKS: number[] = [
    0x00000000,
    0x00000001, 0x00000003, 0x00000007, 0x0000000F,
    0x0000001F, 0x0000003F, 0x0000007F, 0x000000FF,
    0x000001FF, 0x000003FF, 0x000007FF, 0x00000FFF,
    0x00001FFF, 0x00003FFF, 0x00007FFF, 0x0000FFFF,
    0x0001FFFF, 0x0003FFFF, 0x0007FFFF, 0x000FFFFF,
    0x001FFFFF, 0x003FFFFF, 0x007FFFFF, 0x00FFFFFF,
    0x01FFFFFF //, 0x03FFFFFF, 0x07FFFFFF, 0x0FFFFFFF,
    // 0x1FFFFFFF, 0x3FFFFFFF, 0x7FFFFFFF, 0xFFFFFFFF
  ];

  var POW25 = Math.pow(2, 25);

  export class BitReader {
    view: DataView2;
    bitOffset = 0;

    constructor(public bytes: Uint8Array, public littleEndian: bool = false) {
      this.view = new DataView2(bytes);
    }

    readBits(n: number): number {
      if (n <= 0) throw new Error();

      var tmp: number;
      var needBytes: number;
      var m: number;
      var max = 25;
      var ret = 0;

      while (n > 0) {
        m = n > max ? max : n;
        ret *= POW25;
        needBytes = Math.ceil((this.bitOffset % 8 + m) / 8);
        switch (needBytes) {
          case 1: tmp = this.view.getUint8(this.byteOffset); break;
          case 2: tmp = this.view.getUint16(this.byteOffset); break;
          case 3: tmp = this.view.getUint24(this.byteOffset); break;
          case 4: tmp = this.view.getUint32(this.byteOffset); break;
        }
        ret += (tmp >>> (needBytes * 8 - (this.bitOffset % 8 + m))) & BIT_MASKS[m];
        this.skipBits(m);
        n -= m;
      }

      return ret;
    }

    readUint8(): number {
      var ret = this.view.getUint8(this.byteOffset);
      this.skipBytes(1);
      return ret;
    }

    readInt8(): number {
      var ret = this.view.getInt8(this.byteOffset);
      this.skipBytes(1);
      return ret;
    }

    readUint16(): number {
      var ret = this.view.getUint16(this.byteOffset, this.littleEndian);
      this.skipBytes(2);
      return ret;
    }

    readInt16(): number {
      var ret = this.view.getInt16(this.byteOffset, this.littleEndian);
      this.skipBytes(2);
      return ret;
    }

    readUint24(): number {
      var ret = this.view.getUint24(this.byteOffset, this.littleEndian);
      this.skipBytes(3);
      return ret;
    }

    readInt24(): number {
      var ret = this.view.getInt24(this.byteOffset, this.littleEndian);
      this.skipBytes(3);
      return ret;
    }

    readUint32(): number {
      var ret = this.view.getUint32(this.byteOffset, this.littleEndian);
      this.skipBytes(4);
      return ret;
    }

    readInt32(): number {
      var ret = this.view.getInt32(this.byteOffset, this.littleEndian);
      this.skipBytes(4);
      return ret;
    }

    readFloat32(): number {
      var ret = this.view.getFloat32(this.byteOffset, this.littleEndian);
      this.skipBytes(4);
      return ret;
    }

    readFloat64(): number {
      var ret = this.view.getFloat64(this.byteOffset, this.littleEndian);
      this.skipBytes(8);
      return ret;
    }

    readBytes(n: number): Uint8Array {
      var byteOffset = this.byteOffset;
      var ret = this.bytes.subarray(byteOffset, byteOffset + n);
      this.skipBytes(n);
      return ret;
    }

    readString(n: number = 0): string {
      var ret: string;
      if (n === 0) {
        var bytes = this.bytes.subarray(this.byteOffset);
        ret = String.fromCharCode.apply(null, bytes);
        n = bytes.length;
      } else {
        ret = this.view.getString(this.byteOffset, n);
      }
      this.skipBytes(n);
      return ret;
    }

    readStringNullTerminated(): string {
      var bytes = this.bytes.subarray(this.byteOffset);
      var i = 0;
      if (!bytes.byteLength) return '';
      while (bytes[i++] !== 0);
      this.skipBytes(i);
      return String.fromCharCode.apply(null, bytes.subarray(0, i - 1));
    }

    readUTF8StringNullTerminated(): string {
      var bytes = this.bytes.subarray(this.byteOffset);
      var i = 0;
      if (!bytes.byteLength) return '';
      while (bytes[i++] !== 0);
      this.skipBytes(i);
      return DataView2.UTF8BytesToString(bytes.subarray(0, i - 1));
    }

    skipBits(n: number) {
      this.bitOffset += n;
    }

    skipBytes(n: number) {
      this.bitOffset += n * 8;
    }

    get byteOffset(): number {
      return this.bitOffset >>> 3;
    }

    eof(): bool {
      return this.bitOffset / 8 >= this.bytes.length;
    }
  }

}