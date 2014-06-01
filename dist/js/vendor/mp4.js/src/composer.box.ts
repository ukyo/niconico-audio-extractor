/// <reference path="mp4.ts" />

module Mp4.Builder {

  export class BoxBuilder extends DescriptorBuilderMixin {
    constructor() {
      super();
      this.skipBytes(4);
      this.writeString((<any>this.constructor).TYPE);
    }

    build(): Uint8Array {
      // write box size;
      this.view.setUint32(0, this.byteOffset);
      return super.build();
    }

    writeBox(box) {
      var bytes: Uint8Array;
      if (box instanceof Uint8Array) {
        bytes = box;
      } else if (box.bytes) {
        bytes = box.bytes;
      } else {
        bytes = createBoxBuilder(box).build();
      }
      this.writeBytes(bytes);
    }
  }


  export class FullBoxBuilder extends BoxBuilder {
    constructor(public box: IFullBox) {
      super();
      this.writeUint8(box.version || 0);
      this.writeUint24(box.flags || 0);
    }
  }


  export class BoxListBuilder extends BoxBuilder {
    constructor(boxes: any[]) {
      super();
      boxes.forEach(box => this.writeBox(box));
    }
  }


  export class FileTypeBoxBuilder extends BoxBuilder {
    static TYPE = BOX_TYPE_FILE_TYPE_BOX;

    constructor(box: IFileTypeBox) {
      super();
      this.writeString(box.majorBrand);
      this.writeUint32(box.minorVersion);
      box.compatibleBrands.forEach(brand => this.writeString(brand));
    }
  }


  export class MovieBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_MOVIE_BOX;
  }


  export class MediaDataBoxBuilder extends BoxBuilder {
    static TYPE = BOX_TYPE_MEDIA_DATA_BOX;

    constructor(box: IMediaDataBox) {
      super();
      this.writeBytes(box.data);
    }
  }


  export class MovieHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_MOVIE_HEADER_BOX;

    constructor(box: IMovieHeaderBox) {
      super(box);
      this.writeUint32(box.creationTime);
      this.writeUint32(box.modificationTime);
      this.writeUint32(box.timescale);
      this.writeUint32(box.duration);
      this.writeInt32(box.rate * 0x10000);
      this.writeInt16(box.volume * 0x100);
      this.skipBytes(2);
      this.skipBytes(8);
      box.matrix.forEach(x => this.writeInt32(x));
      this.skipBytes(4 * 6);
      this.writeUint32(box.nextTrackID);
    }
  }


  export class TrackBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_TRACK_BOX;
  }


  export class TrackHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_TRACK_HEADER_BOX;

    constructor(box: ITrackHeaderBox) {
      super(box);
      this.writeUint32(box.creationTime);
      this.writeUint32(box.modificationTime);
      this.writeUint32(box.trackID);
      this.skipBytes(4);
      this.writeUint32(box.duration);
      this.skipBytes(4 * 2);
      this.writeInt16(box.layer);
      this.writeInt16(box.alternateGroup);
      this.writeInt16(box.volume * 0x100);
      this.skipBytes(2);
      box.matrix.forEach(x => this.writeInt32(x));
      this.writeUint32(box.width * 0x10000);
      this.writeUint32(box.height * 0x10000);
    }
  }


  export class TrackReferenceBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_TRACK_REFERENCE_BOX;
  }


  export class TrackReferenceTypeBoxBuilder extends BoxBuilder {
    constructor(box: ITrackReferenceTypeBox) {
      super();
      box.trackIDs.forEach(id => this.writeUint32(id));
    }
  }


  export class HintTrackReferenceTypeBoxBuilder extends TrackReferenceTypeBoxBuilder {
    static TYPE = BOX_TYPE_HINT_TRACK_REFERENCE_TYPE_BOX;
  }


  export class DescribeTrackReferenceTypeBoxBuilder extends TrackReferenceTypeBoxBuilder {
    static TYPE = BOX_TYPE_DISCRIBE_TRACK_REFERENCE_TYPE_BOX;
  }


  export class MediaBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_MEDIA_BOX;
  }


  export class MediaHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_MEDIA_HEADER_BOX;

    constructor(box: IMediaHeaderBox) {
      super(box);
      this.writeUint32(box.creationTime);
      this.writeUint32(box.modificationTime);
      this.writeUint32(box.timescale);
      this.writeUint32(box.duration);
      this.skipBits(1);
      [].forEach.call(box.language, (c, i) => this.writeBits(box.language.charCodeAt(i) - 0x60, 5));
      this.skipBytes(2);
    }
  }


  export class HandlerBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_HANDLER_BOX;

    constructor(box: IHandlerBox) {
      super(box);
      this.skipBytes(4);
      this.writeString(box.handlerType);
      this.skipBytes(4 * 3);
      this.writeUTF8StringNullTerminated(box.name);
    }
  }


  export class MediaInformationBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_MEDIA_INFORMATION_BOX;
  }


  export class VideoMediaHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_VIDEO_MEDIA_HEADER_BOX;

    constructor(box: IVideoMediaHeaderBox) {
      super(box);
      this.writeUint16(box.graphicsmode);
      box.opcolor.forEach(x => this.writeUint16(x));
    }
  }


  export class SoundMediaHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_SOUND_MEDIA_HEADER_BOX;

    constructor(box: ISoundMediaHeaderBox) {
      super(box);
      this.writeInt16(box.balance);
      this.skipBytes(2);
    }
  }


  export class HintMediaHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_HINT_MEDIA_HEADER_BOX;

    constructor(box: IHintMediaHeaderBox) {
      super(box);
      this.writeUint16(box.maxPDUsize);
      this.writeUint16(box.avgPDUsize);
      this.writeUint32(box.maxbitrate);
      this.writeUint32(box.avgbitrate);
      this.skipBytes(4);
    }
  }


  export class NullMediaHeaderBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_NULL_MEDIA_HEADER_BOX;
  }


  export class DataInformationBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_DATA_INFORMATION_BOX;
  }


  export class DataEntryUrlBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_DATA_ENTRY_URL_BOX;

    constructor(box: IDataEntryUrlBox) {
      super(box);
      this.writeUTF8StringNullTerminated(box.location);
    }
  }


  export class DataEntryUrnBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_DATA_ENTRY_URN_BOX;

    constructor(box: IDataEntryUrnBox) {
      super(box);
      this.writeUTF8StringNullTerminated(box.name);
      this.writeUTF8StringNullTerminated(box.location);
    }
  }

  export class DataReferenceBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_DATA_REFERENCE_BOX;

    constructor(box: IDataReferenceBox) {
      super(box);
      this.writeUint32(box.entryCount);
      box.entries.forEach(entry => this.writeBox(entry));
    }
  }


  export class SampleTableBoxBuilder extends BoxListBuilder {
    static TYPE = BOX_TYPE_SAMPLE_TABLE_BOX;
  }


  export class TimeToSampleBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_TIME_TO_SAMPLE_BOX;

    constructor(box: ITimeToSampleBox) {
      super(box);
      this.writeUint32(box.entryCount);
      box.entries.forEach(entry => {
        this.writeUint32(entry.sampleCount);
        this.writeUint32(entry.sampleDelta);
      });
    }
  }


  export class CompositionOffsetBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_COMPOSITION_OFFSET_BOX;

    constructor(box: ICompositionOffsetBox) {
      super(box);
      this.writeUint32(box.entryCount);
      box.entries.forEach(entry => {
        this.writeUint32(entry.sampleCount);
        this.writeUint32(entry.sampleOffset);
      });
    }
  }


  export class SampleEntryBuilder extends BoxBuilder {
    constructor(box: ISampleEntry) {
      super();
      this.skipBytes(6);
      this.writeUint16(box.dataReferenceIndex);
    }
  }


  export class HintSampleEntryBuilder extends SampleEntryBuilder {
    constructor(box: IHintSampleEntry) {
      super(box);
      this.writeBytes(box.data);
    }
  }


  export class VisualSampleEntryBuilder extends SampleEntryBuilder {
    constructor(box: IVisualSampleEntry) {
      super(box);
      this.skipBytes(2);
      this.skipBytes(2);
      this.skipBytes(4 * 3);
      this.writeUint16(box.width);
      this.writeUint16(box.height);
      this.writeUint32(box.horizresolution);
      this.writeUint32(box.vertresolution);
      this.skipBytes(4);
      this.writeUint16(box.frameCount);
      this.writeString(box.compressorname);
      this.writeUint16(box.depth);
      this.writeInt16(-1);
    }
  }


  export class MP4VisualSampleEntryBuilder extends VisualSampleEntryBuilder {
    static TYPE = BOX_TYPE_MP4_VISUAL_SAMPLE_ENTRY;

    constructor(box: IMP4VisualSampleEntry) {
      super(box);
      box.esBox.type = BOX_TYPE_ES_DESCRIPTOR_BOX;
      this.writeBox(box.esBox);
    }
  }


  export class ESDBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_ES_DESCRIPTOR_BOX;

    constructor(box: IESDBox) {
      super(box);
      box.esDescr.tag = DESCR_TAG_ES_DESCRIPTOR;
      this.writeDescriptor(box.esDescr);
    }
  }


  export class AudioSampleEntryBuilder extends SampleEntryBuilder {
    constructor(box: IAudioSampleEntry) {
      super(box);
      this.skipBytes(4 * 2);
      this.writeUint16(box.channelCount);
      this.writeUint16(box.sampleSize);
      this.skipBytes(2);
      this.skipBytes(2);
      this.writeUint32(box.sampleRate * 0x10000);
    }
  }


  export class MP4AudioSampleEntryBuilder extends AudioSampleEntryBuilder {
    static TYPE = BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY;

    constructor(box: IMP4AudioSampleEntry) {
      super(box);
      box.esBox.type = BOX_TYPE_ES_DESCRIPTOR_BOX;
      this.writeBox(box.esBox);
    }
  }


  export class SampleDescriptionBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_SAMPLE_DESCRIPTION_BOX;

    constructor(box: ISampleDescriptionBox) {
      super(box);
      this.writeUint32(box.entryCount);
      box.boxes.forEach(b => this.writeBox(b));
    }
  }


  export class SampleSizeBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_SAMPLE_SIZE_BOX;

    constructor(box: ISampleSizeBox) {
      super(box);
      this.writeUint32(box.sampleSize);
      this.writeUint32(box.sampleCount);
      if (box.sampleSize === 0) {
        box.sampleSizes.forEach(size => this.writeUint32(size));
      }
    }
  }


  export class SampleToChunkBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_SAMPLE_TO_CHUNK_BOX;

    constructor(box: ISampleToChunkBox) {
      super(box);
      this.writeUint32(box.entryCount);
      box.entries.forEach(entry => {
        this.writeUint32(entry.firstChunk);
        this.writeUint32(entry.samplesPerChunk);
        this.writeUint32(entry.sampleDescriptionIndex);
      });
    }
  }


  export class ChunkOffsetBoxBuilder extends FullBoxBuilder {
    static TYPE = BOX_TYPE_CHUNK_OFFSET_BOX;

    constructor(box: IChunkOffsetBox) {
      super(box);
      this.writeUint32(box.entryCount);
      box.chunkOffsets.forEach((offset, i) => this.writeUint32(offset));
    }
  }


  var createBoxBuilder = (box: IBox): BoxBuilder => {
    var _Builder;
    Object.keys(Builder).some(key => {
      if (Builder[key].TYPE === box.type) {
        _Builder = Builder[key];
        return true;
      }
    });
    return new (_Builder || BoxBuilder)(box);
  };
}