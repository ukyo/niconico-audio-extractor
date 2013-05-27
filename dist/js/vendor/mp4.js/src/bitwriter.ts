/// <reference path="mp4.ts" />

module Mp4 {

  export class BitWriter {
    view: DataView2;
    bitOffset = 0;
    bytes = new Uint8Array(2);

    constructor(public littleEndian: bool = false) {
      this.view = new DataView2(this.bytes);
    }

    get data() {
      var byteOffset = this.byteOffset;
      if (byteOffset > this.bytes.length) {
        var bytes = new Uint8Array(byteOffset);
        bytes.set(this.bytes);
        return bytes;
      } else {
        return this.bytes.subarray(0, byteOffset);
      }
    }

    get byteOffset(): number {
      return this.bitOffset >>> 3;
    }

    skipBits(n: number) {
      this.bitOffset += n;
    }

    skipBytes(n: number) {
      this.skipBits(n * 8);
    }

    writeBits(n: number, bitLength: number) {
      this.expandBuffer(bitLength);
      var needBytes = Math.ceil((this.bitOffset % 8 + bitLength) / 8);
      var tmp: number;
      switch (needBytes) {
        case 1: tmp = this.view.getUint8(this.byteOffset); break;
        case 2: tmp = this.view.getUint16(this.byteOffset); break;
        case 3: tmp = this.view.getUint24(this.byteOffset); break;
        case 4: tmp = this.view.getUint32(this.byteOffset); break;
      }
      tmp |= n << (needBytes * 8 - (this.bitOffset % 8 + bitLength));
      switch (needBytes) {
        case 1: this.view.setUint8(this.byteOffset, tmp); break;
        case 2: this.view.setUint16(this.byteOffset, tmp); break;
        case 3: this.view.setUint24(this.byteOffset, tmp); break;
        case 4: this.view.setUint32(this.byteOffset, tmp); break;
      }
      this.skipBits(bitLength);
    }

    writeBytes(bytes: Uint8Array) {
      this.expandBuffer(bytes.length * 8);
      this.bytes.set(bytes, this.byteOffset);
      this.skipBytes(bytes.length);
    }

    writeUint8(n: number) {
      this.expandBuffer(8);
      this.view.setUint8(this.byteOffset, n);
      this.skipBytes(1);
    }

    writeInt8(n: number) {
      this.expandBuffer(8);
      this.view.setInt8(this.byteOffset, n);
      this.skipBytes(1);
    }

    writeUint16(n: number) {
      this.expandBuffer(16);
      this.view.setUint16(this.byteOffset, n, this.littleEndian);
      this.skipBytes(2);
    }

    writeInt16(n: number) {
      this.expandBuffer(16);
      this.view.setInt16(this.byteOffset, n, this.littleEndian);
      this.skipBytes(2);
    }

    writeUint24(n: number) {
      this.expandBuffer(24);
      this.view.setUint24(this.byteOffset, n, this.littleEndian);
      this.skipBytes(3);
    }

    writeInt24(n: number) {
      this.expandBuffer(24);
      this.view.setInt24(this.byteOffset, n, this.littleEndian);
      this.skipBytes(3);
    }

    writeUint32(n: number) {
      this.expandBuffer(32);
      this.view.setUint32(this.byteOffset, n, this.littleEndian);
      this.skipBytes(4);
    }

    writeInt32(n: number) {
      this.expandBuffer(32);
      this.view.setInt32(this.byteOffset, n, this.littleEndian);
      this.skipBytes(4);
    }

    writeFloat32(n: number) {
      this.expandBuffer(32);
      this.view.setFloat32(this.byteOffset, n, this.littleEndian);
      this.skipBytes(4);
    }

    writeFloat64(n: number) {
      this.expandBuffer(64);
      this.view.setFloat64(this.byteOffset, n, this.littleEndian);
      this.skipBytes(8);
    }

    writeString(s: string) {
      this.expandBuffer(s.length * 8);
      this.view.setString(this.byteOffset, s);
      this.skipBytes(s.length);
    }

    writeStringNullTerminated(s: string) {
      this.writeString(s + '\0');
    }

    writeUTF8String(s: string) {
      var UTF8Bytes = DataView2.stringToUTF8Bytes(s);
      this.expandBuffer(UTF8Bytes.length * 8);
      this.writeBytes(UTF8Bytes);
    }

    writeUTF8StringNullTerminated(s: string) {
      this.writeUTF8String(s + '\0');
    }

    private expandBuffer(expandBitWidth: number) {
      var bitLength = this.bytes.length * 8;
      var originalBitLength = bitLength;
      while (bitLength < this.bitOffset + expandBitWidth) bitLength *= 2;
      var bytes = new Uint8Array(Math.ceil(bitLength / 8));
      bytes.set(this.bytes);
      this.bytes = bytes;
      this.view = new DataView2(bytes);
    }
  }

}