/// <reference path="dataview.ts" />
/// <reference path="bitreader.ts" />
/// <reference path="bitwriter.ts" />
/// <reference path="statics.ts" />
/// <reference path="interface.descr.ts" />
/// <reference path="interface.box.ts" />
/// <reference path="parser.ts" />
/// <reference path="parser.descr.ts" />
/// <reference path="parser.box.ts" />
/// <reference path="composer.ts" />
/// <reference path="composer.descr.ts" />
/// <reference path="composer.box.ts" />
/// <reference path="finder.ts" />

module Mp4 {

  var SAMPLERATE_TABLE = [
    96000, 88200, 64000, 48000,
    44100, 32000, 24000, 22050,
    16000, 12000, 11025, 8000
  ];

  export var parse = (bytes: Uint8Array): IBox[] => {
    return new Mp4.Parser.RootParser(bytes).parse();
  };

  var getChunks = (bytes: Uint8Array, trackBox: ITrackBox): Uint8Array[] => {
    var chunks: Uint8Array[] = [];
    var finder = new Finder(trackBox);

    var stsc = <ISampleToChunkBox>finder.findOne(BOX_TYPE_SAMPLE_TO_CHUNK_BOX);
    var stsz = <ISampleSizeBox>finder.findOne(BOX_TYPE_SAMPLE_SIZE_BOX);
    var stco = <IChunkOffsetBox>finder.findOne(BOX_TYPE_CHUNK_OFFSET_BOX);

    var i, j, k, idx, n, m, l, chunkStart, chunkEnd;

    for (i = 0, idx = 0, n = stsc.entryCount; i < n; ++i) {
      j = stsc.entries[i].firstChunk - 1;
      m = i + 1 < n ? stsc.entries[i + 1].firstChunk - 1 : stco.chunkOffsets.length;
      for (; j < m; ++j) {
        chunkStart = chunkEnd = stco.chunkOffsets[j];
        for (k = 0, l = stsc.entries[i].samplesPerChunk; k < l; ++k, ++idx) {
          chunkEnd += stsz.sampleSizes[idx];
        }
        chunks.push(bytes.subarray(chunkStart, chunkEnd));
      }
    }

    return chunks;
  };

  var getAudioTrack = (tree: any): ITrackBox => {
    var audioTrack: ITrackBox;
    var finder = new Finder(tree);
    finder.findAll(BOX_TYPE_TRACK_BOX).some(box => {
      var hdlr = <IHandlerBox>new Finder(box).findOne(BOX_TYPE_HANDLER_BOX);
      if (hdlr.handlerType === 'soun') {
        audioTrack = <ITrackBox>box;
        return true;
      }
    });
    return audioTrack;
  };

  var concatBytes = (bytess: Uint8Array[]): Uint8Array => {
    var i, n, byteLength = 0, offset = 0;
    for (i = 0, n = bytess.length; i < n; ++i) {
      byteLength += bytess[i].length;
    }
    var ret = new Uint8Array(byteLength);
    for (i = 0; i < n; ++i) {
      ret.set(bytess[i], offset);
      offset += bytess[i].length;
    }
    return ret;
  }

  // extract audio. it is stored to MP4 container.
  export var extractAudio = (bytes: Uint8Array): Uint8Array => {
    var tree = parse(bytes);
    var finder = new Finder(tree);
    var offset = 8 * 6;

    var ftyp: IFileTypeBox = {
      majorBrand: 'M4A ',
      minorVersion: 1,
      compatibleBrands: ['isom', 'M4A ', 'mp42']
    };

    ftyp.bytes = new Builder.FileTypeBoxBuilder(ftyp).build();
    offset += ftyp.bytes.length;

    var mvhd = finder.findOne(BOX_TYPE_MOVIE_HEADER_BOX);
    offset += mvhd.bytes.length;

    var audioTrack = getAudioTrack(tree);

    finder = new Finder(audioTrack);
    var tkhd = finder.findOne(BOX_TYPE_TRACK_HEADER_BOX);
    offset += tkhd.bytes.length;

    finder = new Finder(finder.findOne(BOX_TYPE_MEDIA_BOX));
    var mdhd = finder.findOne(BOX_TYPE_MEDIA_HEADER_BOX);
    var hdlr = finder.findOne(BOX_TYPE_HANDLER_BOX);
    offset += mdhd.bytes.length + hdlr.bytes.length;

    finder = new Finder(finder.findOne(BOX_TYPE_MEDIA_INFORMATION_BOX));
    var smhd = finder.findOne(BOX_TYPE_SOUND_MEDIA_HEADER_BOX);
    var dinf = finder.findOne(BOX_TYPE_DATA_INFORMATION_BOX);
    offset += smhd.bytes.length + dinf.bytes.length;

    finder = new Finder(finder.findOne(BOX_TYPE_SAMPLE_TABLE_BOX));
    var stsd = finder.findOne(BOX_TYPE_SAMPLE_DESCRIPTION_BOX);
    var stts = finder.findOne(BOX_TYPE_TIME_TO_SAMPLE_BOX);
    var stsc = finder.findOne(BOX_TYPE_SAMPLE_TO_CHUNK_BOX);
    var stsz = finder.findOne(BOX_TYPE_SAMPLE_SIZE_BOX);
    var stco = <IChunkOffsetBox>finder.findOne(BOX_TYPE_CHUNK_OFFSET_BOX);
    var stcoBytes = stco.bytes;
    offset += stsd.bytes.length + stts.bytes.length + stsc.bytes.length + stsz.bytes.length + stcoBytes.length;

    var chunks = getChunks(bytes, audioTrack);
    var chunkOffsets: number[] = [offset];
    for (var i = 1, n = chunks.length; i < n; ++i) {
      offset += chunks[i - 1].length;
      chunkOffsets[i] = offset;
    }
    stcoBytes = new Builder.ChunkOffsetBoxBuilder({
      entryCount: stco.entryCount,
      chunkOffsets: chunkOffsets
    }).build();
    var mdatBytes = new Builder.MediaDataBoxBuilder({
      data: concatBytes(chunks)
    }).build();

    var stblBytes = new Builder.SampleTableBoxBuilder([stsd, stts, stsc, stsz, stcoBytes]).build();
    var minfBytes = new Builder.MediaInformationBoxBuilder([smhd, dinf, stblBytes]).build();
    var mdiaBytes = new Builder.MediaBoxBuilder([mdhd, hdlr, minfBytes]).build();
    var trakBytes = new Builder.TrackBoxBuilder([tkhd, mdiaBytes]).build();
    var moovBytes = new Builder.MovieBoxBuilder([mvhd, trakBytes]).build();

    return concatBytes([ftyp.bytes, moovBytes, mdatBytes]);
  };

  var extractAudioAsAAC = (bytes: Uint8Array, audioTrack: any): Uint8Array => {
    var finder = new Finder(audioTrack);

    var mp4a = <IMP4AudioSampleEntry>finder.findOne(BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY);
    var stsc = <ISampleToChunkBox>finder.findOne(BOX_TYPE_SAMPLE_TO_CHUNK_BOX);
    var stsz = <ISampleSizeBox>finder.findOne(BOX_TYPE_SAMPLE_SIZE_BOX);
    var stco = <IChunkOffsetBox>finder.findOne(BOX_TYPE_CHUNK_OFFSET_BOX);

    var ret = new Uint8Array(stsz.sampleSizes.length * 7 + stsz.sampleSizes.reduce((a, b) => a + b));
    var offset = 0;

    var aacHeader = new Uint8Array(7);
    aacHeader[0] = 0xFF;
    aacHeader[1] = 0xF9;
    aacHeader[2] = 0x40 | (SAMPLERATE_TABLE.indexOf(mp4a.sampleRate) << 2) | (mp4a.channelCount >> 2);
    aacHeader[6] = 0xFC;

    var i, j, k, idx, n, m, l, chunkOffset, sampleSize;

    for (i = 0, idx = 0, n = stsc.entryCount; i < n; ++i) {
      j = stsc.entries[i].firstChunk - 1;
      m = i + 1 < n ? stsc.entries[i + 1].firstChunk - 1 : stco.chunkOffsets.length;
      for (; j < m; ++j) {
        chunkOffset = stco.chunkOffsets[j];
        for (k = 0, l = stsc.entries[i].samplesPerChunk; k < l; ++k, ++idx) {
          sampleSize = stsz.sampleSizes[idx] + 7;
          aacHeader[3] = (mp4a.channelCount << 6) | (sampleSize >> 11);
          aacHeader[4] = sampleSize >> 3;
          aacHeader[5] = (sampleSize << 5) | (0x7FF >> 6);
          ret.set(aacHeader, offset);
          offset += 7;
          ret.set(bytes.subarray(chunkOffset, chunkOffset += stsz.sampleSizes[idx]), offset);
          offset += stsz.sampleSizes[idx];
        }
      }
    }

    return ret;
  };

  var extractAudioAsMP3 = (bytes: Uint8Array, audioTrack: any): Uint8Array => {
    return concatBytes(getChunks(bytes, audioTrack));
  };

  export var extractRawAudio = (bytes: Uint8Array): { type: string; data: Uint8Array; } => {
    var tree = parse(bytes);
    var audioTrack = getAudioTrack(tree);
    var finder = new Finder(audioTrack);
    var mp4a = <IMP4AudioSampleEntry>finder.findOne(BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY);
    var OBJECT_TYPE_INDICATION = Parser.DecoderConfigDescriptorParser.OBJECT_TYPE_INDICATION;
    switch (mp4a.esBox.esDescr.decConfigDescr.objectTypeIndication) {
      case OBJECT_TYPE_INDICATION.AAC: return { type: 'aac', data: extractAudioAsAAC(bytes, audioTrack) };
      case OBJECT_TYPE_INDICATION.MP3: return { type: 'mp3', data: extractAudioAsMP3(bytes, audioTrack) };
      default: throw new TypeError('not supported object type indication.');
    }
  }

  export var aacToM4a = (bytes: Uint8Array): Uint8Array => {
    var bitReader = new BitReader(bytes);
    var offset = 8 * 6;

    bitReader.skipBits(12);
    var aacInfo = {
      id: bitReader.readBits(1),
      layer: bitReader.readBits(2),
      protectionAbsent: bitReader.readBits(1),
      profile: bitReader.readBits(2),
      sampleingFrequencyIndex: bitReader.readBits(4),
      privateBit: bitReader.readBits(1),
      channelConfiguration: bitReader.readBits(3),
      original: bitReader.readBits(1),
      home: bitReader.readBits(1),
      copyrightIndentificationBit: bitReader.readBits(1),
      copyrightIndentificationStart: bitReader.readBits(1),
      aacFrameLength: bitReader.readBits(13),
      atdsBufferFullness: bitReader.readBits(11),
      noRawDataBlocksInFrames: bitReader.readBits(2)
    };
    bitReader.bitOffset = 0;

    var samples: Uint8Array[] = [];
    var frameLength: number;
    var bufferSizeDB = 0;
    while (!bitReader.eof()) {
      bitReader.skipBits(30);
      frameLength = bitReader.readBits(13);
      bitReader.skipBits(13);
      samples.push(bitReader.readBytes(frameLength - 7));
      bufferSizeDB = Math.max(bufferSizeDB, frameLength - 7);
    }

    var ftypBytes = new Builder.FileTypeBoxBuilder({
      majorBrand: 'M4A ',
      minorVersion: 1,
      compatibleBrands: ['isom', 'M4A ', 'mp42']
    }).build();
    offset += ftypBytes.length;

    var creationTime = Date.now();
    var timescale = 600;
    var sampleRate = SAMPLERATE_TABLE[aacInfo.sampleingFrequencyIndex];
    var duration = (samples.length * 1024 * timescale / sampleRate) | 0;
    var matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];

    var mvhdBytes = new Builder.MovieHeaderBoxBuilder({
      creationTime: creationTime,
      modificationTime: creationTime,
      timescale: timescale,
      duration: duration,
      rate: 1.0,
      volume: 1.0,
      matrix: matrix,
      nextTrackID: 2
    }).build();
    offset += mvhdBytes.length;

    var tkhdBytes = new Builder.TrackHeaderBoxBuilder({
      flags: 0x000001,
      creationTime: creationTime,
      modificationTime: creationTime,
      trackID: 1,
      duration: duration,
      layer: 0,
      alternateGroup: 0,
      volume: 1.0,
      matrix: matrix,
      width: 0,
      height: 0
    }).build();
    offset += tkhdBytes.length;

    var mdhdBytes = new Builder.MediaHeaderBoxBuilder({
      creationTime: creationTime,
      modificationTime: creationTime,
      timescale: timescale,
      duration: duration,
      language: 'und',
    }).build();
    offset += mdhdBytes.length;

    var hdlrBytes = new Builder.HandlerBoxBuilder({
      handlerType: 'soun',
      name: 'mp4.js sound media handler'
    }).build();
    offset += hdlrBytes.length;

    var smhdBytes = new Builder.SoundMediaHeaderBoxBuilder({
      balance: 0
    }).build();
    offset += smhdBytes.length;

    var urlBytes = new Builder.DataEntryUrlBoxBuilder({
      flags: 0x000001,
      location: ''
    }).build();

    var drefBytes = new Builder.DataReferenceBoxBuilder({
      entryCount: 1,
      entries: [urlBytes]
    }).build();

    var dinfBytes = new Builder.DataInformationBoxBuilder([drefBytes]).build();
    offset += dinfBytes.length;

    var OBJECT_TYPE_INDICATION = Parser.DecoderConfigDescriptorParser.OBJECT_TYPE_INDICATION;
    var decConfigDescr: IDecoderConfigDescriptor = {
      objectTypeIndication: OBJECT_TYPE_INDICATION.AAC,
      streamType: 0x05,
      upStream: 0,
      bufferSizeDB: bufferSizeDB,
      maxBitrate: 0,
      avgBitrate: 0,
      decSpecificInfo: {
        data: new Uint8Array([0x12, 0x10])
      }
    };

    var slConfigDescr: ISLConfigDescriptor = {
      preDefined: 2
    };

    var esDescr: IESDescriptor = {
      esID: 0,
      streamDependenceFlag: 0,
      urlFlag: 0,
      ocrStreamFlag: 0,
      streamPriority: 0,
      decConfigDescr: decConfigDescr,
      slConfigDescr: slConfigDescr
    };

    var esBox: IESDBox = {
      esDescr: esDescr
    };

    var audioSampleEntry: IMP4AudioSampleEntry = {
      type: BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY,
      dataReferenceIndex: 1,
      channelCount: aacInfo.channelConfiguration,
      sampleSize: 16,
      sampleRate: sampleRate,
      esBox: esBox
    };

    var mp4aBytes = new Builder.MP4AudioSampleEntryBuilder({
      type: BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY,
      dataReferenceIndex: 1,
      channelCount: aacInfo.channelConfiguration,
      sampleSize: 16,
      sampleRate: sampleRate,
      esBox: esBox
    }).build();

    var stsdBytes = new Builder.SampleDescriptionBoxBuilder({
      entryCount: 1,
      boxes: [audioSampleEntry]
    }).build();
    offset += stsdBytes.length;

    var sttsBytes = new Builder.TimeToSampleBoxBuilder({
      entryCount: 1,
      entries: [{ sampleCount: samples.length, sampleDelta: 1024 }]
    }).build();
    offset += sttsBytes.length;

    var stszBytes = new Builder.SampleSizeBoxBuilder({
      sampleSize: 0,
      sampleCount: samples.length,
      sampleSizes: samples.map(sample => sample.byteLength)
    }).build();
    offset += stszBytes.length;

    var mod16 = samples.length % 16;
    var stscEntryCount = mod16 ? 2 : 1;
    var stscEntries = [
      {
        firstChunk: 1,
        samplesPerChunk: 16,
        sampleDescriptionIndex: 1
      }
    ];
    if (stscEntryCount === 2) {
      stscEntries.push({
        firstChunk: Math.floor(samples.length / 16) + 1,
        samplesPerChunk: mod16,
        sampleDescriptionIndex: 1
      });
    }
    var stscBytes = new Builder.SampleToChunkBoxBuilder({
      entryCount: stscEntryCount,
      entries: stscEntries
    }).build();
    offset += stscBytes.length;

    var stcoEntryCount = Math.ceil(samples.length / 16);
    offset += 4 + stcoEntryCount * 4 + /* header length */12;
    var chunkOffset = offset;
    var chunkOffsets = [];
    for (var i = 0, n = samples.length; i < n; ++i) {
      if (i % 16 === 0) chunkOffsets.push(chunkOffset);
      chunkOffset += samples[i].byteLength;
    }
    var stcoBytes = new Builder.ChunkOffsetBoxBuilder({
      entryCount: stcoEntryCount,
      chunkOffsets: chunkOffsets
    }).build();

    var stblBytes = new Builder.SampleTableBoxBuilder([stsdBytes, sttsBytes, stszBytes, stscBytes, stcoBytes]).build();
    var minfBytes = new Builder.MediaInformationBoxBuilder([smhdBytes, dinfBytes, stblBytes]).build();
    var mdiaBytes = new Builder.MediaBoxBuilder([mdhdBytes, hdlrBytes, minfBytes]).build();
    var trakBytes = new Builder.TrackBoxBuilder([tkhdBytes, mdiaBytes]).build();
    var moovBytes = new Builder.MovieBoxBuilder([mvhdBytes, trakBytes]).build();
    var mdatBytes = new Builder.MediaDataBoxBuilder({
      data: concatBytes(samples)
    }).build();

    return concatBytes([ftypBytes, moovBytes, mdatBytes]);
  };
}