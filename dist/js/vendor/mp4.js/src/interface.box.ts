/// <reference path="mp4.ts" />

module Mp4 {

  export interface IBox {
    byteLength?: number; // unsigned int(32)
    type?: string; // unsigned int(32)
    bytes?: Uint8Array;
  }

  export interface IFullBox extends IBox {
    version?: number; // unsigned int(8)
    flags?: number; // bit(24)
  }

  export interface IFileTypeBox extends IBox {
    majorBrand: string; // unsigned int(32)
    minorVersion: number; // unsigned int(32)
    compatibleBrands: string[]; // unsigned int(32) array
  }

  export interface IBoxList extends IBox {
    boxes: IBox[];
  }

  export interface IMovieBox extends IBoxList {}

  export interface IMediaDataBox extends IBox {
    data: Uint8Array;
  }

  export interface IMovieHeaderBox extends IFullBox {
    creationTime: number; // unsigned int(32)
    modificationTime: number; // unsigned int(32)
    timescale: number; // unsigned int(32)
    duration: number; // unsigned int(32)
    rate: number; // int(32)
    volume: number; // int(16)
    matrix: number[]; // int(32)[9]
    nextTrackID: number; // unsigned int(32)
  }

  export interface ITrackBox extends IBoxList {}

  export interface ITrackHeaderBox extends IFullBox {
    creationTime: number; // unsigned int(32)
    modificationTime: number; // unsigned int(32)
    trackID: number; // unsigned int(32)
    duration: number; // unsigned int(32)
    layer: number; // int(16)
    alternateGroup: number; // int(16)
    volume: number; // int(16)
    matrix: number[]; // int(32)[9]
    width: number; // unsigned int(32)
    height: number; // unsigned int(32)
  }

  export interface ITrackReferenceBox extends IBoxList {}

  export interface ITrackReferenceTypeBox extends IBox {
    trackIDs: number[];
  }

  export interface IMediaBox extends IBoxList {}

  export interface IMediaHeaderBox extends IFullBox {
    creationTime: number; // unsigned int(32)
    modificationTime: number; // unsigned int(32)
    timescale: number; // unsigned int(32)
    duration: number; // unsigned int(32)
    language: string;
  }

  export interface IHandlerBox extends IFullBox {
    handlerType: string;
    name: string;
  }

  // 8.10
  export interface IMediaInformationBox extends IBoxList {}

  export interface IVideoMediaHeaderBox extends IFullBox {
    graphicsmode: number; // unsigned int(16)
    opcolor: number[]; // unsigned int(16)[3]
  }

  export interface ISoundMediaHeaderBox extends IFullBox {
    balance: number; // int(16)
  }

  export interface IHintMediaHeaderBox extends IFullBox {
    maxPDUsize: number; // unsigned int(16)
    avgPDUsize: number; // unsigned int(16)
    maxbitrate: number; // unsigned int(32)
    avgbitrate: number; // unsigned int(32)
  }

  export interface INullMediaHeaderBox extends IFullBox {}

  export interface IDataInformationBox extends IBoxList {}

  export interface IDataEntryBox extends IFullBox {}

  export interface IDataEntryUrlBox extends IDataEntryBox {
    location: string;
  }

  export interface IDataEntryUrnBox extends IDataEntryUrlBox {
    name: string;
  }

  export interface IDataReferenceBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: IDataEntryBox[];
  }

  export interface ISampleTableBox extends IBoxList {}

  export interface ITimeToSampleBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: {
      sampleCount: number; // unsigned int(32)
      sampleDelta: number; // unsigned int(32)
    }[];
  }

  export interface ICompositionOffsetBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: {
      sampleCount: number; // unsigned int(32)
      sampleOffset: number; // unsigned int(32)
    }[];
  }

  export interface ISampleEntry extends IBox {
    dataReferenceIndex: number; // unsigned int(16)
  }

  export interface IHintSampleEntry extends ISampleEntry {
    data: Uint8Array;
  }

  export interface IVisualSampleEntry extends ISampleEntry {
    width: number; // unsigned int(16)
    height: number; // unsigned int(16)
    frameCount: number; // unsigned int(16)
    horizresolution: number; // unsigned int(32)
    vertresolution: number; // unsigned int(32)
    compressorname: string; // 32 chars
    depth: number; // unsigned int(16)
  }

  export interface IAudioSampleEntry extends ISampleEntry {
    channelCount: number; // unsigned int(16)
    sampleSize: number; // unsigned int(16)
    sampleRate: number; // unsigned int(32)
  }

  export interface IESDBox extends IFullBox {
    esDescr: IESDescriptor;
  }

  export interface IMpegSampleEntry extends ISampleEntry {
    esBox: IESDBox;
  }

  export interface IMP4VisualSampleEntry extends IVisualSampleEntry {
    esBox: IESDBox;
  }

  export interface IMP4AudioSampleEntry extends IAudioSampleEntry {
    esBox: IESDBox;
  }
  
  export interface ISampleDescriptionBox extends IFullBox, IBoxList {
    entryCount: number; // unsigned int(32)
  }

  export interface ISampleSizeBox extends IFullBox {
    sampleSize: number; // unsigned int(32)
    sampleCount: number; // unsigned int(32)
    sampleSizes: number[]; // unsigned int(32)[]
  }

  export interface ICompactSampleSizeBox extends IFullBox {
    fieldSize: number; // int(8)
    sampleCount: number[]; // int(fieldSize)
  }

  export interface ISampleToChunkBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: {
      firstChunk: number; // unsigned int(32)
      samplesPerChunk: number; // unsigned int(32)
      sampleDescriptionIndex: number; // unsigned int(32)
    }[];
  }

  export interface IChunkOffsetBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    chunkOffsets: number[]; // unsigned int(32)[]
  }

  export interface ISyncSampleBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    sampleNumbers: number[]; // unsigned int(32)
  }

  export interface IShadowSyncSampleBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: {
      shadowedSampleNumber: number; // unsigned int(32)
      syncSampleNumber: number; // unsigned int(32)
    }[];
  }

  export interface IDegradationPriorityBox extends IFullBox {
    priorities: number[]; // unsigned int(16)
  }

  export interface IPaddingBitsBox extends IFullBox {
    sampleCount: number; // unsigned int(32)
    samples: {
      pad1: number; // bit(3)
      pad2: number; // bit(3)
    }[];
  }

  export interface IFreeSpaceBox extends IBox {
    data: Uint8Array;
  }

  export interface IEditBox extends IBox {}

  export interface IEditListBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: {
      sagmentDuration: number; // unsigned int(32)
      mediaTime: number; // unsigned int(32)
      mediaRateInteger: number; // unsigned int(16)
    }[];
  }

  export interface IUserDataBox extends IBox {}

  export interface ICopyrightBox extends IFullBox {
    language: string;
    notice: string;
  }

  export interface IMovieExtendsBox extends IBox {}

  export interface IMovieExtendsHeaderBox extends IFullBox {
    fragmentDuration: number; // unsigned int(32)
  }

  export interface ITrackExtendsBox extends IFullBox {
    trackID: number; // unsigned int(32)
    defaultSampleDescriptionIndex: number; // unsigned int(32)
    defaultSampleDuration: number; // unsigned int(32)
    defaultSampleSize: number; // unsigned int(32)
    defaultSampleFlags: number; // unsigned int(32)
  }

  export interface IMovieFragmentBox extends IBoxList {}

  export interface IMovieFragmentHeaderBox extends IFullBox {
    sequenceNumber: number; // unsigned int(32)
  }

  export interface ITrackFragmentBox extends IBoxList {}

  export interface ITrackFragmentHeaderBox extends IFullBox {
    trackID: number; // unsigned int(32)
    baseDataOffset?: Uint8Array; // unsigned int(64)
    sampleDescriptionIndex?: number; // unsigned int(32)
    defaultSampleDuration?: number; // unsigned int(32)
    defaultSampleSize?: number; // unsigned int(32)
    defaultSampleFlags?: number; // unsigned int(32)
  }

  export interface ITrackRunBox extends IFullBox {
    sampleCount: number; // unsigned int(32)
    dataOffset?: number; // int(32)
    firstSampleFlats?: number; // unsigned int(32)
    samples?: {
      sampleDuration?: number; // unsigned int(32)
      sampleSize?: number; // unsigned int(32)
      sampleFlags?: number; // unsigned int(32)
      sampleCompositionTimeOffset?: number; // unsigned int(32)
    }[];
  }

  export interface IMovieFragmentRandomAccessBox extends IBoxList {}

  export interface ITrackFragmentRandomAccessBox extends IFullBox {
    trackID: number; // unsigned int(32)
    lengthSizeOfTrafNum: number; // unsigned int(2)
    lengthSizeOfTrunNum: number; // unsigned int(2)
    lengthSizeOfSampleNum: number; // unsigned int(2)
    numberOfEntry: number; // unsigned int(32)
    entries: {
      time: number; // unsigned int(32)
      moofOffset: number; // unsigned int(32)
      trafNumber: number; // unsigned int((lengthSizeOfTrafNum + 1) * 8)
      trunNumber: number; // unsigned int((lengthSizeOfTrunNum + 1) * 8)
      sampleNumber: number; // unsigned int((lengthSizeOfSampleNum + 1) * 8)
    }[];
  }

  export interface IMovieFragmentRandomAccessOffsetBox extends IFullBox {
    size: number; // unsigned int(32)
  }

  // 8.40
  export interface ISampleDependencyTypeBox extends IFullBox {
    samples: {
      sampleDependsOn: number; // unsigned int(2)
      sampleIsDependedOn: number; // unsigned int(2)
      sampleHasRedundancy: number; // unsigned int(2)
    }[];
  }

  export interface ISampleToGroupBox extends IFullBox {
    groupintType: number; // unsigned int(32)
    entryCount: number; // unsigned int(32)
    entries: {
      sampleCount: number; // unsigned int(32)
      groupDescriptionIndex: number; // unsigned int(32)
    }[];
  }

  export interface ISampleGroupDescriptionEntry extends IBox {
    handlerType: string; // unsigned int(32)
  }

  export interface IVisualSampleGroupEntry extends ISampleGroupDescriptionEntry {}

  export interface IAudioSampleGroupEntry extends ISampleGroupDescriptionEntry {}

  export interface IHintSampleGroupEntry extends ISampleGroupDescriptionEntry {}

  export interface ISampleGroupDescriptionBox extends IFullBox {
    groupingType: number; // unsigned int(32)
    entryCount: number; // unsigned int(32)
    entries: ISampleGroupDescriptionEntry[];
  }

  export interface IVisualRollRecoveryEntry extends IVisualSampleGroupEntry {
    rollDistance: number;// int(16)
  }

  export interface IAudioRollRecoveryEntry extends IAudioSampleGroupEntry {
    rollDistance: number;// int(16)
  }

  export interface ISampleScaleBox extends IFullBox {
    constraintFlag: number; // bit(1)
    scaleMethod: number; // int(8)
    displayCenterX: number; // int(16)
    displayCenterY: number; // int(16)
  }

  export interface ISubSampleInformationBox extends IFullBox {
    entryCount: number; // unsigned int(32)
    entries: {
      sampleDelta: number; // unsigned int(32)
      subsampleCount: number; // unsigned int(16)
      samples: {
        subsampleSize: number; // unsigned int(32 or 16)
        subsamplePriority: number; // unsigned int(8)
        discardable: number; // unsigned int(8)
      }[];
    }[];
  }

  export interface IProgressiveDownloadInfoBox extends IFullBox {
    entries: {
      rate: number; // unsigned int(32)
      initialDelay: number; // unsigned int(32)
    }[];
  }

  export interface IMetaBox extends IFullBox {
    theHandler: IHandlerBox;
    primaryResource?: IPrimaryItemBox;
    fileLocations?: IDataInformationBox;
    itemLocations?: IItemLocationBox;
    protections?: IItemProtectionBox;
    itemInfos?: IItemInfoBox;
    IPMPControl?: IIPMPControlBox;
    otherBoxes?: IBox[];
  }

  export interface IXMLBox extends IFullBox {
    xml: string;
  }

  export interface IBinaryXMLBox extends IFullBox {
    data: Uint8Array;
  }

  export interface IItemLocationBox extends IFullBox {
    offsetSize: number; // unsigned int(4)
    lengthSize: number; // unsigned int(4)
    baseOffsetSize: number; // unsigned int(4)
    itemCount: number; // unsigned int(16)
    items: {
      itemID: number; // unsigned int(16)
      dataReferenceIndex: number; // unsigned int(16)
      baseOffset: number; // unsigned int(baseOffsetSize * 8)
      extentCount: number; // unsigned int(16)
      extents: {
        extentOffset: number; // unsigned int(offsetSize * 8)
        extentLength: number; // unsigned int(lengthSize * 8)
      }[];
    }[];
  }

  export interface IPrimaryItemBox extends IFullBox {
    itemID: number; // unsigned int(16)
  }

  

  export interface IItemProtectionBox extends IFullBox {
    protectionCount: number;
    protectionInformations: IProtectionSchemeInfoBox[];
  }

  export interface IItemInfoEntry extends IFullBox {
    itemID: number; // unsigned int(16)
    itemProtectionIndex: number; // unsigned int(16)
    itemName: string;
    contentType: string;
    contentEncoding?: string;
  }

  export interface IItemInfoBox extends IFullBox {
    entryCount: number; // unsigned int(16)
    itemInfos: IItemInfoEntry[];
  }

  export interface IIPMPControlBox extends IFullBox {}

  export interface IProtectionSchemeInfoBox extends IBox {
    originalFormat: IOriginalFormatBox;
    IPMPDescriptors?: IIPMPInfoBox;
    schemeTypeBox?; ISchemeTypeBox;
    info?: ISchemeInformationBox;
  }

  export interface IOriginalFormatBox extends IBox {
    dataFormat: string; // unsigned int(32)
  }

  export interface IIPMPInfoBox extends IFullBox {
    ipmpDescrs: IIPMPDescriptorPointer[];
  }

  export interface ISchemeInformationBox extends IFullBox {

  }

  // 8.45.4
}