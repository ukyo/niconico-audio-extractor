/// <reference path="reference.ts" />

module Flv {

  export var TAG_TYPE_AUDIO = 0x08;
  export var TAG_TYPE_VIDEO = 0x09;
  export var TAG_TYPE_META = 0x12;

  export var SOUND_FORMAT_LINEAR_PCM_PLATFORM_ENDIAN = 0;
  export var SOUND_FORMAT_ADPCM = 1;
  export var SOUND_FORMAT_MP3 = 2;
  export var SOUND_FORMAT_LINEAR_PCM_LITTLE_ENDIAN = 3;
  export var SOUND_FORMAT_NELLYMOSER_16KHZ_MONO = 4;
  export var SOUND_FORMAT_NELLYMOSER_8KHZ_MONO = 5;
  export var SOUND_FORMAT_NELLYMOSER = 6;
  export var SOUND_FORMAT_G711_ALAW_LOGARITHMIC_PCM = 7;
  export var SOUND_FORMAT_G711_MULAW_LOGARITHMIC_PCM = 8;
  export var SOUND_FORMAT_RESERVED = 9;
  export var SOUND_FORMAT_AAC = 10;
  export var SOUND_FORMAT_SPEEX = 11;
  export var SOUND_FORMAT_MP3_8KHZ = 14;
  export var SOUND_FORMAT_DEVICE_SPECIFIC_SOUND = 15;

  export var VIDEO_FRAME_TYPE_KEY_FRAME = 1;
  export var VIDEO_FRAME_TYPE_INTER_FRAME = 2;
  export var VIDEO_FRAME_TYPE_DISPOSABLE_INTER_FRAME = 3;
  export var VIDEO_FRAME_TYPE_GENERATED_KEY_FRAME = 4;
  export var VIDEO_FRAME_TYPE_VIDEO_INFO = 5;

  export var VIDEO_CODEC_ID_JPEG = 1;
  export var VIDEO_CODEC_ID_SORENSON_H263 = 2;
  export var VIDEO_CODEC_ID_SCREEN_VIDEO = 3;
  export var VIDEO_CODEC_ID_ON2_VP6 = 4;
  export var VIDEO_CODEC_ID_ON2_VP6_WITH_ALPHA_CHANNEL = 5;
  export var VIDEO_CODEC_ID_SCREEN_VIDEO_VERSION2 = 6;
  export var VIDEO_CODEC_ID_AVC = 7;

  export var EXTENSION_TABLE = [
    'wav',
    'wav',
    'mp3',
    'wav',
    '',
    '',
    '',
    'wav',
    '',
    'aac',
    'spx',
    'mp3',
    ''
  ];

  export var SAMPLE_RATE_TABLE = [
    5512,
    11025,
    22050,
    44100
  ];

  export var AAC_SAMPLE_RATE_TABLE = [
    96000,
    88200,
    64000,
    48000,
    44100,
    32000,
    24000,
    22050,
    16000,
    12000,
    11025,
    8000
  ];

  export var SAMPLE_SIZE_TABLE = [
    8,
    16
  ];

  export var CHANNELS_TABLE = [
    1,
    2
  ];


  // interfaces

  export interface IFlv {
    header: IFlvHeader;
    tags: IFlvTag[];
  }

  export interface IFlvHeader {
    signature: string;
    version: number;
    flags: number;
    offset: number;
  }

  export interface IFlvTag {
    type: number;
    bodyLength: number;
    body: Uint8Array;
    timeStamp: number;
    timeStampExtended: number;
    streamID: number;
    previousTagSize: number;
  }

  export interface IAudioInfo {
    soundFormat: number;
    sampleRate: number;
    sampleSize: number;
    channels: number;
  }

  export interface IAacInfo {
    type: number;
    sampleRateIndex: number;
    channels: number;
  }


  // functions

  // parse to a object tree.
  export var parse = (bytes: Uint8Array): IFlv => {
    var reader = new Mp4.BitReader(bytes);
    var header: IFlvHeader = {
      signature: reader.readString(3),
      version: reader.readUint8(),
      flags: reader.readUint8(),
      offset: reader.readUint32()
    };

    reader.skipBytes(4);

    var tags: IFlvTag[] = [];

    while (!reader.eof()) {
      var tag = <IFlvTag>{};
      tag.type = reader.readUint8();
      tag.bodyLength = reader.readUint24();
      tag.timeStamp = reader.readUint24();
      tag.timeStampExtended = reader.readUint8();
      tag.streamID = reader.readUint24();
      tag.body = reader.readBytes(tag.bodyLength);
      tag.previousTagSize = reader.readUint32();
      tags.push(tag);
    }

    return {
      header: header,
      tags: tags
    };
  };


  // concat array of Uint8Array.
  export var concatBytes = (bytess: Uint8Array[]): Uint8Array => {
    var n = bytess.map(x => x.length).reduce((a, b) => a + b);
    var ret = new Uint8Array(n);
    var offset = 0;

    bytess.forEach(bytes => {
      ret.set(bytes, offset);
      offset += bytes.length;
    });

    return ret;
  };


  var getAudioInfo = (tree: IFlv): IAudioInfo => {
    var info = <IAudioInfo>{};

    tree.tags.some(tag => {
      if (tag.type === TAG_TYPE_AUDIO) {
        var reader = new Mp4.BitReader(tag.body);
        info.soundFormat = reader.readBits(4);
        info.sampleRate = SAMPLE_RATE_TABLE[reader.readBits(2)];
        info.sampleSize = SAMPLE_SIZE_TABLE[reader.readBits(1)];
        info.channels = CHANNELS_TABLE[reader.readBits(1)];
        return true;
      }
    });

    return info;
  };


  var getAacInfo = (tree: IFlv): IAacInfo => {
    var info = <IAacInfo>{};

    tree.tags.some(tag => {
      if (tag.type === TAG_TYPE_AUDIO && tag.body[0] === 0) {
        var reader = new Mp4.BitReader(tag.body.subarray(1));
        info.type = reader.readBits(5) - 1;
        info.sampleRateIndex = reader.readBits(4);
        info.channels = reader.readBits(4);
        return true;
      }
    });

    return info;
  };


  var getAudioTags = (tags: IFlvTag[]): IFlvTag[] => {
    return tags.filter(tag => tag.type === TAG_TYPE_AUDIO);
  };


  var extractWave = (bytes: Uint8Array, tree: IFlv): IMedia => {
    var writer = new Mp4.BitWriter(true);
    var info = getAudioInfo(tree);
    var tags = getAudioTags(tree.tags);
    var bodyLength = tags.map(tag => tag.bodyLength).reduce((a, b) => a + b) - tags.length;

    writer.writeString('RIFF');
    writer.writeUint32(bodyLength + 36);
    writer.writeString('WAVE');
    writer.writeString('fmt ');
    writer.writeUint32(info.sampleSize);
    writer.writeUint16(1);
    writer.writeUint16(info.channels);
    writer.writeUint32(info.sampleRate);
    writer.writeUint32(info.sampleRate * info.channels * info.sampleSize / 8);
    writer.writeUint16(info.channels * info.sampleSize / 8);
    writer.writeUint16(info.sampleSize);
    writer.writeString('data');
    writer.writeUint32(bodyLength);
    writer.writeBytes(concatBytes(tags.map(tag => {
      return tag.body.subarray(1);
    })));

    return {
      type: 'wav',
      data: writer.data
    };
  };


  var extractMp3 = (bytes: Uint8Array, tree: IFlv): IMedia => {
    return {
      type: 'mp3',
      data: concatBytes(getAudioTags(tree.tags).map(tag => tag.body.subarray(1)))
    };
  };


  var extractAac = (bytes: Uint8Array, tree: IFlv): IMedia => {
    var header = new Uint8Array(7);
    var info = getAacInfo(tree);
    var bytess: Uint8Array[] = [];

    header[0] = 0xFF;
    header[1] = 0xF9;
    header[2] = 0x40 | (info.sampleRateIndex << 2) | (info.channels >> 2);
    header[6] = 0xFC;

    getAudioTags(tree.tags).forEach(tag => {
      var sample = tag.body.subarray(2);

      header[3] = (info.channels << 6) | (sample.length - 2 + header.length);
      header[4] = sample.length >> 3;
      header[5] = (sample.length << 5) | (0x7FF >> 6);

      var tmp = new Uint8Array(7);
      tmp.set(header);
      bytess.push(tmp);
      bytess.push(sample);
    });

    return {
      type: 'aac',
      data: concatBytes(bytess)
    };
  };


  export var extractAudio = (bytes: Uint8Array): IMedia => {
    var tree = parse(bytes);
    switch (getAudioInfo(tree).soundFormat) {
      case SOUND_FORMAT_AAC: return extractAac(bytes, tree);
      case SOUND_FORMAT_LINEAR_PCM_LITTLE_ENDIAN: return extractWave(bytes, tree);
      case SOUND_FORMAT_MP3: return extractMp3(bytes, tree);
      default: throw new TypeError('Flv.extractAudio: not supported format.');
    }
  };

}