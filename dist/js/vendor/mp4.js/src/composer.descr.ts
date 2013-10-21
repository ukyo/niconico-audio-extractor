/// <reference path="mp4.ts" />

module Mp4.Builder {

  export class DescriptorBuilderMixin extends BaseBuilder {
    writeDescriptor(descr) {
      var bytes: Uint8Array;
      if (descr instanceof Uint8Array) {
        bytes = descr;
      } else if (descr.bytes) {
        bytes = descr.bytes;
      } else {
        bytes = createDescriptorBuilder(descr).build();
      }
      this.writeBytes(bytes);
    }
  }


  export class DescriptorBuilder extends DescriptorBuilderMixin {
    constructor() {
      super();
      this.writeUint8(this['constructor'].TAG);
      this.writeBytes(new Uint8Array(4));
    }

    build(): Uint8Array {
      this.writeBodyLength();
      return super.build();
    }

    private writeBodyLength() {
      var bytes = [0x80, 0x80, 0x80, 0x00];
      var bodyLength = this.byteOffset - 5;
      var i = 3;
      while (bodyLength) {
        bytes[i--] |= bodyLength & 0x7F;
        bodyLength >>>= 7;
      }
      this.bytes.set(bytes, 1);
    }
  }


  export class DecoderConfigDescriptorBuilder extends DescriptorBuilder {
    static TAG = DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;

    constructor(descr: IDecoderConfigDescriptor) {
      super();
      this.writeUint8(descr.objectTypeIndication);
      this.writeBits(descr.streamType, 6);
      this.writeBits(descr.upStream, 1);
      this.writeBits(1, 1);
      this.writeUint24(descr.bufferSizeDB);
      this.writeUint32(descr.maxBitrate);
      this.writeUint32(descr.avgBitrate);
      descr.decSpecificInfo.tag = DESCR_TAG_DECODER_SPECIFIC_INFO;
      this.writeDescriptor(descr.decSpecificInfo);
      if (descr.profileLevelIndicationIndexDescrs) {
        descr.profileLevelIndicationIndexDescrs.forEach(d => {
          d.tag = DESCR_TAG_PROFILE_LEVEL_INDICATION_INDEX_DESCRIPTOR;
          this.writeDescriptor(d);
        });
      }
    }
  }


  export class SLConfigDescriptorBuilder extends DescriptorBuilder {
    static TAG = DESCR_TAG_SL_CONFIG_DESCRIPTOR;

    constructor(descr: ISLConfigDescriptor) {
      super();
      this.writeUint8(descr.preDefined);
      if (descr.preDefined === 0) {
        this.writeBits(descr.useAccessUnitStartFlag, 1);
        this.writeBits(descr.useAccessUnitEndFlag, 1);
        this.writeBits(descr.useRandomAccessPointFlag, 1);
        this.writeBits(descr.hasRandomAccessUnitsOnlyFlag, 1);
        this.writeBits(descr.usePaddingFlag, 1);
        this.writeBits(descr.useTimeStampsFlag, 1);
        this.writeBits(descr.useTimeStampsFlag, 1);
        this.writeBits(descr.useIdleFlag, 1);
        this.writeBits(descr.durationFlag, 1);
        this.writeUint32(descr.timeStampResolution);
        this.writeUint32(descr.ocrResolution);
        this.writeUint8(descr.timeStampLength);
        this.writeUint8(descr.ocrLength);
        this.writeUint8(descr.auLength);
        this.writeUint8(descr.instantBitrateLength);
        this.writeBits(descr.degradationPriorityLength, 4);
        this.writeBits(descr.auSeqNumLength, 5);
        this.writeBits(descr.packetSeqNumLength, 5);
        this.writeBits(3, 2);
      }
      if (descr.durationFlag) {
        this.writeUint32(descr.timeScale);
        this.writeUint16(descr.accessUnitDuration);
        this.writeUint16(descr.compositionUnitDuration);
      }
      if (descr.useTimeStampsFlag === 0) {
        this.writeBits(descr.startDecodingTimeStamp, descr.timeStampLength);
        this.writeBits(descr.startCompositionTimeStamp, descr.timeStampLength);
      }
    }
  }


  export class DecoderSpecificInfoBuilder extends DescriptorBuilder {
    static TAG = DESCR_TAG_DECODER_SPECIFIC_INFO;

    constructor(descr: IDecoderSpecificInfo) {
      super();
      this.writeBytes(descr.data);
    }
  }


  export class ESDescriptorBuilder extends DescriptorBuilder {
    static TAG = DESCR_TAG_ES_DESCRIPTOR;

    constructor(descr: IESDescriptor) {
      super();
      this.writeUint16(descr.esID);
      this.writeBits(descr.streamDependenceFlag || 0, 1);
      this.writeBits(descr.urlFlag || 0, 1);
      this.writeBits(descr.ocrStreamFlag || 0, 1);
      this.writeBits(descr.streamPriority, 5);
      
      if (descr.urlFlag) {
        this.writeUint8(descr.urlLength);
        this.writeString(descr.urlString);
      }

      if (descr.ocrStreamFlag) {
        this.writeUint16(descr.ocrEsID);
      }

      descr.decConfigDescr.tag = DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
      this.writeDescriptor(descr.decConfigDescr);
      descr.slConfigDescr.tag = DESCR_TAG_SL_CONFIG_DESCRIPTOR;
      this.writeDescriptor(descr.slConfigDescr);
    }
  }

  export var createDescriptorBuilder = (descr: IDescriptor): DescriptorBuilder => {
    var _Builder;
    Object.keys(Builder).some(key => {
      if (Builder[key].TAG === descr.tag) {
        _Builder = Builder[key];
        return true;
      }
    });
    return new (_Builder || DescriptorBuilder)(descr);
  };

}