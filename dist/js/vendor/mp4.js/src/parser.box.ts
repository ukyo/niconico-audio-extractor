/// <reference path="mp4.ts" />

module Mp4.Parser {

  var getBoxInfo = (bytes: Uint8Array, offset: number = 0): IBox => {
    var view = new DataView2(bytes, offset);
    return {
      byteLength: view.getUint32(0),
      type: view.getString(4, 4)
    };
  };

  var getFullBoxInfo = (bytes: Uint8Array, offset: number = 0): IFullBox => {
    var view = new DataView2(bytes, offset);
    return {
      byteLength: view.getUint32(0),
      type: view.getString(4, 4),
      version: view.getUint8(8),
      flags: view.getUint24(9)
    };
  };


  export class BoxParserMixin extends DescriptorParserMixin {
    readBox(): IBox {
      var info = getBoxInfo(this.bytes, this.byteOffset);
      return createBoxParser(this.readBytes(info.byteLength), info.type).parse();
    }
  }


  export class RootParser extends BoxParserMixin {
    parse(): IBox[] {
      var ret: IBox[] = [];
      while (!this.eof()) ret.push(this.readBox());
      return ret;
    }
  }


  export class BoxParser extends BoxParserMixin {
    byteLength: number;
    type: string;

    constructor(bytes: Uint8Array) {
      super(bytes);
      this.byteLength = this.bytes.length;
      this.skipBytes(4);
      this.type = this.readString(4);
    }

    parse(): IBox {
      return {
        byteLength: this.byteLength,
        type: this.type,
        bytes: this.bytes
      };
    }
  }


  export class FullBoxParser extends BoxParser {
    version: number;
    flags: number;

    constructor(bytes: Uint8Array) {
      super(bytes);
      this.version = this.readUint8();
      this.flags = this.readUint24();
    }

    parse(): IFullBox {
      var ret = <IFullBox>super.parse();
      ret.version = this.version;
      ret.flags = this.flags;
      return ret;
    }
  }


  export class FileTypeBoxParser extends BoxParser {
    static TYPE = BOX_TYPE_FILE_TYPE_BOX;

    parse(): IFileTypeBox {
      var ret = <IFileTypeBox>super.parse();
      ret.majorBrand = this.readString(4);
      ret.minorVersion = this.readUint32();
      ret.compatibleBrands = [];
      while (!this.eof()) ret.compatibleBrands.push(this.readString(4));
      return ret;
    }
  }


  export class BoxListParser extends BoxParser {
    parse(): IBoxList {
      var ret = <IBoxList>super.parse();
      var boxes: IBox[] = [];
      while (!this.eof()) boxes.push(this.readBox());
      ret.boxes = boxes;
      return ret;
    }
  }


  export class MovieBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_MOVIE_BOX;
  }


  export class MediaDataBoxParser extends BoxParser {
    static TYPE = BOX_TYPE_MEDIA_DATA_BOX;

    parse(): IMediaDataBox {
      var ret = <IMediaDataBox>super.parse();
      ret.data = this.bytes.subarray(8);
      return ret;
    }
  }


  export class MovieHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_MOVIE_HEADER_BOX;

    parse(): IMovieHeaderBox {
      var ret = <IMovieHeaderBox>super.parse();
      ret.matrix = [];
      ret.creationTime = this.readUint32();
      ret.modificationTime = this.readUint32();
      ret.timescale = this.readUint32();
      ret.duration = this.readUint32();
      ret.rate = this.readUint32();
      ret.volume = this.readUint16();
      this.skipBytes(2);
      this.skipBytes(4 * 2);
      for (var i = 0; i < 9; ++i) ret.matrix.push(this.readInt32());
      this.skipBytes(4 * 6);
      ret.nextTrackID = this.readUint32();
      return ret;
    }
  }


  export class TrackBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_TRACK_BOX;
  }


  export class TrackHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_TRACK_HEADER_BOX;

    parse(): ITrackHeaderBox {
      var ret = <ITrackHeaderBox>super.parse();
      ret.matrix = [];
      ret.creationTime = this.readUint32();
      ret.modificationTime = this.readUint32();
      ret.trackID = this.readUint32();
      this.skipBytes(4);
      ret.duration = this.readUint32();
      this.skipBytes(4 * 2);
      ret.layer = this.readInt16();
      ret.alternateGroup = this.readInt16();
      ret.volume = this.readInt16() / 0x100;
      this.skipBytes(2);
      for (var i = 0; i < 9; ++i) ret.matrix.push(this.readInt32());
      ret.width = this.readUint32() / 0x10000;
      ret.height = this.readUint32() / 0x10000;
      return ret;
    }
  }


  export class TrackReferenceBox extends BoxListParser {
    static TYPE = BOX_TYPE_TRACK_REFERENCE_BOX;
  }


  export class TrackReferenceTypeBox extends BoxParser {
    parse(): ITrackReferenceTypeBox {
      var ret = <ITrackReferenceTypeBox>super.parse();
      ret.trackIDs = [];
      while (!this.eof()) ret.trackIDs.push(this.readUint32());
      return ret;
    }
  }


  export class HintTrackReferenceTypeBox extends TrackReferenceTypeBox {
    static TYPE = BOX_TYPE_HINT_TRACK_REFERENCE_TYPE_BOX;
  }


  export class DescribeTrackReferenceTypeBox extends TrackReferenceTypeBox {
    static TYPE = BOX_TYPE_DISCRIBE_TRACK_REFERENCE_TYPE_BOX;
  }


  export class MediaBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_MEDIA_BOX;
  }


  export class MediaHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_MEDIA_HEADER_BOX;

    parse(): IMediaHeaderBox {
      var ret = <IMediaHeaderBox>super.parse();
      ret.creationTime = this.readUint32();
      ret.modificationTime = this.readUint32();
      ret.timescale = this.readUint32();
      ret.duration = this.readUint32();
      this.skipBits(1);
      ret.language = String.fromCharCode.apply(null, [this.readBits(5), this.readBits(5), this.readBits(5)].map(x => x + 0x60));
      return ret;
    }
  }


  export class HandlerBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_HANDLER_BOX;

    parse(): IHandlerBox {
      var ret = <IHandlerBox>super.parse();
      this.skipBytes(4);
      ret.handlerType = this.readString(4);
      this.skipBytes(4 * 3);
      ret.name = this.readUTF8StringNullTerminated();
      return ret;
    }
  }


  export class MediaInformationBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_MEDIA_INFORMATION_BOX;
  }


  export class VideoMediaHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_VIDEO_MEDIA_HEADER_BOX;

    parse(): IVideoMediaHeaderBox {
      var ret = <IVideoMediaHeaderBox>super.parse();
      var view = new DataView2(this.bytes);
      ret.opcolor = [];
      ret.graphicsmode = this.readUint16();
      for (var i = 0; i < 3; ++i) ret.opcolor.push(this.readUint16());
      return ret;
    }
  }


  export class SoundMediaHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SOUND_MEDIA_HEADER_BOX;

    parse(): ISoundMediaHeaderBox {
      var ret = <ISoundMediaHeaderBox>super.parse();
      ret.balance = this.readInt16();
      return ret;
    }
  }


  export class HintMediaHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_HINT_MEDIA_HEADER_BOX;

    parse(): IHintMediaHeaderBox {
      var ret = <IHintMediaHeaderBox>super.parse();
      ret.maxPDUsize = this.readUint16();
      ret.avgPDUsize = this.readUint16();
      ret.maxbitrate = this.readUint32();
      ret.avgbitrate = this.readUint32();
      return ret;
    }
  }


  export class NullMediaHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_NULL_MEDIA_HEADER_BOX;
  }


  export class DataInformationBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_DATA_INFORMATION_BOX;
  }


  export class DataReferenceBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_DATA_REFERENCE_BOX;

    parse(): IDataReferenceBox {
      var ret = <IDataReferenceBox>super.parse();
      ret.entryCount = this.readUint32();
      ret.entries = [];
      while (!this.eof()) {
        ret.entries.push(<IDataEntryBox>this.readBox());
      }
      return ret;
    }
  }


  export class DataEntryUrlBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_DATA_ENTRY_URL_BOX;

    parse(): IDataEntryUrlBox {
      var ret = <IDataEntryUrlBox>super.parse();
      ret.location = this.readUTF8StringNullTerminated();
      return ret;
    }
  }


  export class DataEntryUrnBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_DATA_ENTRY_URN_BOX;

    parse(): IDataEntryUrnBox {
      var ret = <IDataEntryUrnBox>super.parse();
      ret.name = this.readUTF8StringNullTerminated();
      ret.location = this.readUTF8StringNullTerminated();
      return ret;
    }
  }


  export class SampleTableBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_SAMPLE_TABLE_BOX;
  }


  export class TimeToSampleBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_TIME_TO_SAMPLE_BOX;

    parse(): ITimeToSampleBox {
      var ret = <ITimeToSampleBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push({
          sampleCount: this.readUint32(),
          sampleDelta: this.readUint32()
        });
      }
      return ret;
    }
  }


  export class CompositionOffsetBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_COMPOSITION_OFFSET_BOX;

    parse(): ICompositionOffsetBox {
      var ret = <ICompositionOffsetBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push({
          sampleCount: this.readUint32(),
          sampleOffset: this.readUint32()
        });
      }
      return ret;
    }
  }

  export class SampleEntryParser extends BoxParser {
    parse(): ISampleEntry {
      var ret = <ISampleEntry>super.parse();
      this.skipBytes(6);
      ret.dataReferenceIndex = this.readUint16();
      return ret;
    }
  }


  export class HintSampleEntryParser extends SampleEntryParser {
    parse(): IHintSampleEntry {
      var ret = <IHintSampleEntry>super.parse();
      ret.data = this.bytes.subarray(16);
      return ret;
    }
  }


  export class VisualSampleEntryParser extends SampleEntryParser {
    parse(): IVisualSampleEntry {
      var ret = <IVisualSampleEntry>super.parse();
      this.skipBytes(16);
      ret.width = this.readUint16();
      ret.height = this.readUint16();
      ret.horizresolution = this.readUint32();
      ret.vertresolution = this.readUint32();
      ret.compressorname = this.readString(32);
      ret.depth = this.readUint16();
      return ret;
    }
  }


  export class AudioSampleEntryParser extends SampleEntryParser {
    parse(): IAudioSampleEntry {
      var ret = <IAudioSampleEntry>super.parse();
      this.skipBytes(8);
      ret.channelCount = this.readUint16();
      ret.sampleSize = this.readUint16();
      this.skipBytes(4);
      ret.sampleRate = this.readUint32() / 0x10000;
      return ret;
    }
  }


  export class ESDBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_ES_DESCRIPTOR_BOX;

    parse(): IESDBox {
      var ret = <IESDBox>super.parse();
      ret.esDescr = <IESDescriptor>this.readDescriptor();
      return ret;
    }
  }

  export class MP4VisualSampleEntryParser extends VisualSampleEntryParser {
    static TYPE = BOX_TYPE_MP4_VISUAL_SAMPLE_ENTRY;

    parse(): IMP4VisualSampleEntry {
      var ret = <IMP4VisualSampleEntry>super.parse();
      ret.esBox = <IESDBox>this.readBox();
      return ret;
    }
  }


  export class MP4AudioSampleEntryParser extends AudioSampleEntryParser {
    static TYPE = BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY;

    parse(): IMP4AudioSampleEntry {
      var ret = <IMP4AudioSampleEntry>super.parse();
      ret.esBox = <IESDBox>this.readBox();
      return ret;
    }
  }


  export class MpegSampleEntryParser extends SampleEntryParser {
    static TYPE = BOX_TYPE_MPEG_SAMPLE_ENTRY;

    parse(): IMpegSampleEntry {
      var ret = <IMpegSampleEntry>super.parse();
      ret.esBox = <IESDBox>this.readBox();
      return ret;
    }
  }


  export class SampleDescriptionBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_DESCRIPTION_BOX;

    parse(): ISampleDescriptionBox {
      var ret = <ISampleDescriptionBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.boxes = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.boxes.push(this.readBox());
      }
      return ret;
    }
  }


  export class SampleSizeBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_SIZE_BOX;

    parse(): ISampleSizeBox {
      var ret = <ISampleSizeBox>super.parse();
      var sampleSize = this.readUint32();
      var sampleCount = this.readUint32();
      if (sampleSize === 0) {
        ret.sampleSizes = [];
        for (var i = 0; i < sampleCount; ++i)
          ret.sampleSizes.push(this.readUint32());
      }
      ret.sampleSize = sampleSize;
      ret.sampleCount = sampleCount;
      return ret;
    }
  }


  export class SampleToChunkBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_TO_CHUNK_BOX;

    parse(): ISampleToChunkBox {
      var ret = <ISampleToChunkBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push({
          firstChunk: this.readUint32(),
          samplesPerChunk: this.readUint32(),
          sampleDescriptionIndex: this.readUint32()
        });
      }
      return ret;
    }
  }


  export class ChunkOffsetBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_CHUNK_OFFSET_BOX;

    parse(): IChunkOffsetBox {
      var ret = <IChunkOffsetBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.chunkOffsets = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.chunkOffsets.push(this.readUint32());
      }
      return ret;
    }
  }


  export class SyncSampleBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SYNC_SAMPLE_BOX;

    parse(): ISyncSampleBox {
      var ret = <ISyncSampleBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.sampleNumbers = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.sampleNumbers.push(this.readUint32());
      }
      return ret;
    }
  }


  export class ShadowSyncSampleBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SHADOW_SYNC_SAMPLE_BOX;

    parse(): IShadowSyncSampleBox {
      var ret = <IShadowSyncSampleBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push({
          shadowedSampleNumber: this.readUint32(),
          syncSampleNumber: this.readUint32()
        });
      }
      return ret;
    }
  }


  export class DegradationPriorityBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_DEGRADATION_PRIORITY_BOX;

    parse(): IDegradationPriorityBox {
      var ret = <IDegradationPriorityBox>super.parse();
      ret.priorities = [];
      while (!this.eof()) {
        ret.priorities.push(this.readUint16());
      }
      return ret;
    }
  }


  export class PaddingBitsBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_PADDING_BITS_BOX;

    parse(): IPaddingBitsBox {
      var ret = <IPaddingBitsBox>super.parse();
      var sampleCount = this.readUint32();
      var pad1: number;
      var pad2: number;
      ret.sampleCount = sampleCount;
      ret.samples = [];
      for (var i = 0; i < sampleCount; ++i) {
        this.skipBits(1);
        pad1 = this.readBits(3);
        this.skipBits(1);
        pad2 = this.readBits(3);
        ret.samples.push({
          pad1: pad1,
          pad2: pad2
        });
      }
      return ret;
    }
  }


  export class FreeSpaceBoxParser extends MediaBoxParser {
    static TYPE = BOX_TYPE_FREE_SPACE_BOX;
  }


  export class SkipBoxParser extends MediaBoxParser {
    static TYPE = BOX_TYPE_SKIP_BOX;
  }


  export class EditBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_EDIT_BOX;
  }


  export class EditListBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_EDIT_LIST_BOX;

    parse(): IEditListBox {
      var ret = <IEditListBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push({
          sagmentDuration: this.readUint32(),
          mediaTime: this.readUint32(),
          mediaRateInteger: this.readUint16()
        });
        this.skipBytes(2);
      }
      return ret;
    }
  }


  export class CopyrightBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_COPYRIGHT_BOX;

    parse(): ICopyrightBox {
      var ret = <ICopyrightBox>super.parse();
      this.skipBits(1);
      ret.language = String.fromCharCode(this.readBits(5), this.readBits(5), this.readBits(5));
      ret.notice = this.readUTF8StringNullTerminated();
      return ret;
    }
  }


  export class MovieExtendsBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_MOVIE_EXTENDS_BOX;
  }


  export class MovieExtendsHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_MOVIE_EXTENDS_HEADER_BOX;

    parse(): IMovieExtendsHeaderBox {
      var ret = <IMovieExtendsHeaderBox>super.parse();
      ret.fragmentDuration = this.readUint32();
      return ret;
    }
  }


  export class TrackExtendsBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_TRACK_EXTENDS_BOX;

    parse(): ITrackExtendsBox {
      var ret = <ITrackExtendsBox>super.parse();
      ret.trackID = this.readUint32();
      ret.defaultSampleDescriptionIndex = this.readUint32();
      ret.defaultSampleDuration = this.readUint32();
      ret.defaultSampleSize = this.readUint32();
      ret.defaultSampleFlags = this.readUint32();
      return ret;
    }
  }


  export class MovieFlagmentBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_MOVIE_FLAGMENT_BOX;
  }


  export class MovieFragmentHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_MOVIE_FRAGMENT_HEADER_BOX;

    parse(): IMovieFragmentHeaderBox {
      var ret = <IMovieFragmentHeaderBox>super.parse();
      ret.sequenceNumber = this.readUint32();
      return ret;
    }
  }


  export class TrackFragmentBoxParser extends BoxListParser {
    static TYPE = BOX_TYPE_TRACK_FRAGMENT_BOX;
  }


  export class TrackFragmentHeaderBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_TRACK_FRAGMENT_HEADER_BOX;

    parse(): ITrackFragmentHeaderBox {
      var ret = <ITrackFragmentHeaderBox>super.parse();
      ret.trackID = this.readUint32();
      if (ret.flags & 0x000001) ret.baseDataOffset = this.readBytes(8);
      if (ret.flags & 0x000002) ret.sampleDescriptionIndex = this.readUint32();
      if (ret.flags & 0x000008) ret.defaultSampleDuration = this.readUint32();
      if (ret.flags & 0x000010) ret.defaultSampleSize = this.readUint32();
      if (ret.flags & 0x000020) ret.defaultSampleFlags = this.readUint32();
      return ret;
    }
  }


  export class TrackRunBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_TRACK_RUN_BOX;

    parse(): ITrackRunBox {
      var ret = <ITrackRunBox>super.parse();
      var sampleCount = this.readUint32();
      ret.sampleCount = sampleCount;
      if (ret.flags & 0x000001) ret.dataOffset = this.readInt32();
      if (ret.flags & 0x000002) ret.firstSampleFlats = this.readUint32();
      ret.samples = [];
      for (var i = 0; i < sampleCount; ++i) {
        ret.samples.push({
          sampleDuration: (ret.flags & 0x000100) ? this.readUint32() : void 0,
          sampleSize: (ret.flags & 0x000200) ? this.readUint32() : void 0,
          sampleFlags: (ret.flags & 0x000400) ? this.readUint32() : void 0,
          sampleCompositionTimeOffset: (ret.flags & 0x000800) ? this.readUint32() : void 0
        });
      }
      return ret;
    }
  }


  export class TrackFragmentRandomAccessBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_TRACK_FRAGMENT_RANDOM_ACCESS_BOX;

    parse(): ITrackFragmentRandomAccessBox {
      var ret = <ITrackFragmentRandomAccessBox>super.parse();
      ret.trackID = this.readUint32();
      this.skipBits(26);
      ret.lengthSizeOfTrafNum = this.readBits(2);
      ret.lengthSizeOfTrunNum = this.readBits(2);
      ret.lengthSizeOfSampleNum = this.readBits(2);
      var numberOfEntry = this.readUint32();
      ret.numberOfEntry = numberOfEntry;
      ret.entries = [];
      for (var i = 0; i < numberOfEntry; ++i) {
        ret.entries.push({
          time: this.readUint32(),
          moofOffset: this.readUint32(),
          trafNumber: this.readBits((ret.lengthSizeOfTrafNum + 1) * 8),
          trunNumber: this.readBits((ret.lengthSizeOfTrunNum + 1) * 8),
          sampleNumber: this.readBits((ret.lengthSizeOfSampleNum + 1) * 8)
        });
      }
      return ret;
    }
  }


  export class MovieFragmentRandomAccessOffsetBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_MOVIE_FRAGMENT_RANDOM_ACCESS_OFFSET_BOX;

    parse(): IMovieFragmentRandomAccessOffsetBox {
      var ret = <IMovieFragmentRandomAccessOffsetBox>super.parse();
      ret.size = this.readUint32();
      return ret;
    }
  }


  export class SampleDependencyTypeBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_DEPENDENCY_TYPE_BOX;

    parse(): ISampleDependencyTypeBox {
      var ret = <ISampleDependencyTypeBox>super.parse();
      ret.samples = [];
      while (!this.eof()) {
        this.skipBits(2);
        ret.samples.push({
          sampleDependsOn: this.readBits(2),
          sampleIsDependedOn: this.readBits(2),
          sampleHasRedundancy: this.readBits(2)
        });
      }
      return ret;
    }
  }


  export class SampleToGroupBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_TO_GROUPE_BOX;

    parse(): ISampleToGroupBox {
      var ret = <ISampleToGroupBox>super.parse();
      ret.groupintType = this.readUint32();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push({
          sampleCount: this.readUint32(),
          groupDescriptionIndex: this.readUint32()
        });
      }
      return ret;
    }
  }


  export class SampleGroupDescriptionEntryParser extends BoxParser { }


  export class VisualSampleGroupEntryParser extends SampleGroupDescriptionEntryParser { }


  export class AudioSampleGroupEntryParser extends SampleGroupDescriptionEntryParser { }


  export class HintSampleGroupEntryParser extends SampleGroupDescriptionEntryParser { }


  export class SampleGroupDescriptionBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_GROUP_DESCRIPTION_BOX;

    parse(): ISampleGroupDescriptionBox {
      var ret = <ISampleGroupDescriptionBox>super.parse();
      ret.groupingType = this.readUint32();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.entries.push(<ISampleGroupDescriptionEntry>this.readBox());
      }
      return ret;
    }
  }


  export class VisualRollRecoveryEntryParser extends VisualSampleGroupEntryParser {
    static TYPE = BOX_TYPE_ROLL_RECOVERY_ENTRY;

    parse(): IVisualRollRecoveryEntry {
      var ret = <IVisualRollRecoveryEntry>super.parse();
      ret.rollDistance = this.readInt16();
      return ret;
    }
  }


  export class AudioRollRecoveryEntryParser extends VisualSampleGroupEntryParser {
    static TYPE = BOX_TYPE_ROLL_RECOVERY_ENTRY;

    parse(): IAudioRollRecoveryEntry {
      var ret = <IAudioRollRecoveryEntry>super.parse();
      ret.rollDistance = this.readInt16();
      return ret;
    }
  }


  export class SampleScaleBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SAMPLE_SCALE_BOX;

    parse(): ISampleScaleBox {
      var ret = <ISampleScaleBox>super.parse();
      this.skipBits(7);
      ret.constraintFlag = this.readBits(1);
      ret.scaleMethod = this.readUint8();
      ret.displayCenterX = this.readInt16();
      ret.displayCenterY = this.readInt16();
      return ret;
    }
  }


  export class SubSampleInformationBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_SUB_SAMPLE_INFORMATION_BOX;

    parse(): ISubSampleInformationBox {
      var ret = <ISubSampleInformationBox>super.parse();
      var entryCount = this.readUint32();
      ret.entryCount = entryCount;
      ret.entries = [];
      for (var i = 0; i < entryCount; ++i) {
        var sampleDelta = this.readUint32();
        var subsampleCount = this.readUint16();
        var samples = [];
        for (var j = 0; j < subsampleCount; ++j) {
          samples.push({
            subsampleSize: ret.version === 1 ? this.readUint32() : this.readUint16(),
            subsamplePriority: this.readUint8(),
            discardable: this.readUint8()
          });
          this.skipBytes(4);
        }
        ret.entries.push({
          sampleDelta: sampleDelta,
          subsampleCount: subsampleCount,
          samples: samples
        });
      }
      return ret;
    }
  }


  export class ProgressiveDownloadInfoBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_PROGRESSIVE_DOWNLOAD_INFO_BOX;

    parse(): IProgressiveDownloadInfoBox {
      var ret = <IProgressiveDownloadInfoBox>super.parse();
      ret.entries = [];
      while (!this.eof()) {
        ret.entries.push({
          rate: this.readUint32(),
          initialDelay: this.readUint32()
        });
      }
      return ret;
    }
  }


  export class MetaBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_META_BOX;

    parse(): IMetaBox {
      var ret = <IMetaBox>super.parse();
      ret.theHandler = <IHandlerBox>this.readBox();
      ret.otherBoxes = [];
      while (!this.eof()) {
        var box = this.readBox();
        switch (box.type) {
          case BOX_TYPE_PRIMARY_ITEM_BOX: ret.primaryResource = <IPrimaryItemBox>box; break;
          case BOX_TYPE_DATA_INFORMATION_BOX: ret.fileLocations = <IDataInformationBox>box; break;
          case BOX_TYPE_ITEM_LOCATION_BOX: ret.itemLocations = <IItemLocationBox>box; break;
          case BOX_TYPE_ITEM_INFO_BOX: ret.itemInfos = <IItemInfoBox>box; break;
          case BOX_TYPE_ITEM_PROTECTION_BOX: ret.protections = <IItemProtectionBox>box; break;
          case BOX_TYPE_IPMP_CONTROL_BOX: ret.IPMPControl = <IIPMPControlBox>box; break;
          default: ret.otherBoxes.push(box);
        }
      }
      return ret;
    }
  }


  export class XMLBoxParsr extends FullBoxParser {
    static TYPE = BOX_TYPE_XML_BOX;

    parse(): IXMLBox {
      var ret = <IXMLBox>super.parse();
      var bytes = this.bytes.subarray(this.byteOffset);
      ret.xml = DataView2.UTF8BytesToString(bytes);
      return ret;
    }
  }


  export class BinaryXMLBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_BINARY_XML_BOX;

    parse(): IBinaryXMLBox {
      var ret = <IBinaryXMLBox>super.parse();
      ret.data = this.bytes.subarray(this.byteOffset);
      return ret;
    }
  }


  export class ItemLocationBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_ITEM_LOCATION_BOX;

    parse(): IItemLocationBox {
      var ret = <IItemLocationBox>super.parse();
      ret.offsetSize = this.readBits(4);
      ret.lengthSize = this.readBits(4);
      ret.baseOffsetSize = this.readBits(4);
      this.skipBits(4);
      var itemCount = ret.itemCount = this.readUint16();
      ret.items = [];
      for (var i = 0; i < itemCount; ++i) {
        var itemID = this.readUint16();
        var dataReferenceIndex = this.readUint16();
        var baseOffset = this.readBits(ret.baseOffsetSize * 8);
        var extentCount = this.readUint16();
        var extents = [];
        for (var j = 0; j < extentCount; ++j) {
          extents.push({
            extentOffset: this.readBits(ret.offsetSize * 8),
            extentLength: this.readBits(ret.lengthSize * 8)
          });
        }
        ret.items.push({
          itemID: itemID,
          dataReferenceIndex: dataReferenceIndex,
          baseOffset: baseOffset,
          extentCount: extentCount,
          extents: extents
        });
      }
      return ret;
    }
  }


  export class PrimaryItemBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_PRIMARY_ITEM_BOX;

    parse(): IPrimaryItemBox {
      var ret = <IPrimaryItemBox>super.parse();
      ret.itemID = this.readUint16();
      return ret;
    }
  }


  export class ItemProtectionBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_ITEM_PROTECTION_BOX;

    parse(): IItemProtectionBox {
      var ret = <IItemProtectionBox>super.parse();
      var protectionCount = ret.protectionCount = this.readUint16();
      ret.protectionInformations = [];
      for (var i = 0; i < protectionCount; ++i) {
        ret.protectionInformations.push(<IProtectionSchemeInfoBox>this.readBox());
      }
      return ret;
    }
  }


  export class ItemInfoEntryParser extends FullBoxParser {
    static TYPE = BOX_TYPE_ITEM_INFO_ENTRY;

    parse(): IItemInfoEntry {
      var ret = <IItemInfoEntry>super.parse();
      ret.itemID = this.readUint16();
      ret.itemProtectionIndex = this.readUint16();
      ret.itemName = this.readUTF8StringNullTerminated();
      ret.contentType = this.readUTF8StringNullTerminated();
      ret.contentEncoding = this.readString();
      return ret;
    }
  }


  export class ItemInfoBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_ITEM_INFO_BOX;

    parse(): IItemInfoBox {
      var ret = <IItemInfoBox>super.parse();
      var entryCount = ret.entryCount = this.readUint16();
      ret.itemInfos = [];
      for (var i = 0; i < entryCount; ++i) {
        ret.itemInfos.push(<IItemInfoEntry>this.readBox());
      }
      return ret;
    }
  }


  export class ProtectionSchemeInfoBoxParser extends BoxParser {
    static TYPE = BOX_TYPE_PROTECTION_SCHEME_INFO_BOX;

    parse(): IProtectionSchemeInfoBox {
      var ret = <IProtectionSchemeInfoBox>super.parse();
      ret.originalFormat = <IOriginalFormatBox>this.readBox();
      while (!this.eof()) {
        var box = this.readBox();
        switch (box.type) {
          case BOX_TYPE_IPMP_INFO_BOX: ret.IPMPDescriptors = <IIPMPInfoBox>box; break;
        }
      }
      return ret;
    }
  }


  export class OriginalFormatBoxParser extends BoxParser {
    static TYPE = BOX_TYPE_ORIGINAL_FORMAT_BOX;

    parse(): IOriginalFormatBox {
      var ret = <IOriginalFormatBox>super.parse();
      ret.dataFormat = this.readString(4);
      return ret;
    }
  }


  export class IPMPInfoBoxParser extends FullBoxParser {
    static TYPE = BOX_TYPE_IPMP_INFO_BOX;

    parse(): IIPMPInfoBox {
      var ret = <IIPMPInfoBox>super.parse();
      ret.ipmpDescrs = [];
      while (!this.eof()) {
        ret.ipmpDescrs.push(<IIPMPDescriptor>this.readDescriptor());
      }
      return ret;
    }
  }


  /**
   * Create a box parser by the box type.
   * @param bytes
   * @param type A box type.
   */
  export var createBoxParser = (bytes: Uint8Array, type: string): BoxParser => {
    var _Parser;
    Object.keys(Parser).some(key => {
      if (Parser[key].TYPE === type) {
        _Parser = Parser[key];
        return true;
      }
    });
    return new (_Parser || BoxParser)(bytes);
  };

}