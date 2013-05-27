/// <reference path="reference.ts" />

module Zlib {
  export declare var Inflate: {
    new (bytes: Uint8Array);
    decompress(): Uint8Array;
  };
}

module Swf {

  export var TAG_CODE_END = 0;
  export var TAG_CODE_SOUND_STREAM_BLOCK = 19;


  export interface ITag {
    code: number;
    length: number;
    body: Uint8Array;
  }


  export var parse = (bytes: Uint8Array): ITag[] => {
    var signature = new Mp4.DataView2(bytes).getString(0, 3);
    var body: Uint8Array;
    var tags: ITag[] = [];

    if (signature === 'CWS') {
      var inflate = new Zlib.Inflate(bytes.subarray(8));
      body = inflate.decompress();
    } else {
      body = bytes.subarray(8);
    }


    var reader = new Mp4.BitReader(body, true);
    
    // skip header
    var nbits = reader.readBits(5);
    var paddingBits = 8 - (nbits * 4 + 5) % 8;
    paddingBits = paddingBits === 8 ? 0 : paddingBits;
    reader.skipBits(nbits * 4 + paddingBits);
    reader.skipBytes(4);

    // read tags
    while (!reader.eof()) {
      tags.push(getTag(reader));
    }

    return tags;
  };

  var getTag = (reader: Mp4.BitReader): ITag => {
    var codeAndLength = reader.readUint16();
    var code = codeAndLength >>> 6;
    var length = (codeAndLength & 0x3F) === 0x3F ? reader.readUint32() : codeAndLength & 0x3F;

    return {
      code: code,
      length: length,
      body: reader.readBytes(length)
    }
  };

  export var extractMp3 = (bytes: Uint8Array): Uint8Array => {
    var tags = parse(bytes);
    var samples = tags.filter(tag => tag.code === TAG_CODE_SOUND_STREAM_BLOCK).map(tag => tag.body.subarray(4));
    return Flv.concatBytes(samples);
  };
}