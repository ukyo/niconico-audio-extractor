/// <reference path="mp4.ts" />

module Mp4.Parser {

  export var getDescriptorInfo = (bytes: Uint8Array, offset: number = 0): IDescriptor => {
    var tag = bytes[offset++];
    var b = bytes[offset++];
    var bodyLength = b & 0x7F;
    var headerLength = 2;
    while (b & 0x80) {
      headerLength++;
      b = bytes[offset++];
      bodyLength <<= 7;
      bodyLength |= b & 0x7F;
    }
    return {
      tag: tag,
      byteLength: headerLength + bodyLength,
      headerLength: headerLength,
      bodyLength: bodyLength
    };
  };

  export class DescriptorParserMixin extends BaseParser {
    readDescriptor(): IDescriptor {
      var info = getDescriptorInfo(this.bytes, this.byteOffset);
      return createDescriptorParser(this.readBytes(info.byteLength), info.tag).parse();
    }
  }

  export class DescriptorParser extends DescriptorParserMixin {
    parse(): IDescriptor {
      var info = getDescriptorInfo(this.bytes);
      this.skipBytes(info.headerLength);
      info.bytes = this.bytes;
      return info;
    }
  }


  export class DecoderSpecificInfoParser extends DescriptorParser {
    static TAG = DESCR_TAG_DECODER_SPECIFIC_INFO;

    parse(): IDecoderSpecificInfo {
      var ret = <IDecoderSpecificInfo>super.parse();
      ret.data = this.bytes.subarray(this.byteOffset);
      return ret;
    }
  }


  export class ProfileLevelINdicationIndexDescriptor extends DescriptorParser {
    static TAG = DESCR_TAG_PROFILE_LEVEL_INDICATION_INDEX_DESCRIPTOR;

    parse(): IProfileLevelIndicationIndexDescriptor {
      var ret = <IProfileLevelIndicationIndexDescriptor>super.parse();
      ret.profileLevelIndicationIndex = this.readUint8();
      return ret;
    }
  }


  export class DecoderConfigDescriptorParser extends DescriptorParser {
    static TAG = DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
    static OBJECT_TYPE_INDICATION = {
      MP3: 0x6B,
      AAC: 0x40
    };

    parse(): IDecoderConfigDescriptor {
      var ret = <IDecoderConfigDescriptor>super.parse();
      ret.objectTypeIndication = this.readUint8();
      ret.streamType = this.readBits(6);
      ret.upStream = this.readBits(1);
      this.skipBits(1);
      ret.bufferSizeDB = this.readUint24();
      ret.maxBitrate = this.readUint32();
      ret.avgBitrate = this.readUint32();

      var info: IDescriptor;
      var descrParser: DescriptorParser;
      var descr: IDescriptor;
      ret.profileLevelIndicationIndexDescrs = [];

      while (!this.eof()) {
        info = getDescriptorInfo(this.bytes.subarray(this.byteOffset));
        descrParser = createDescriptorParser(this.readBytes(info.byteLength), info.tag);
        descr = descrParser.parse();
        if (descrParser instanceof DecoderSpecificInfoParser) {
          ret.decSpecificInfo = <IDecoderSpecificInfo>descr;
        } else if (descrParser instanceof ProfileLevelINdicationIndexDescriptor) {
          ret.profileLevelIndicationIndexDescrs.push(<IProfileLevelIndicationIndexDescriptor>descr);
        } else {
          throw new TypeError();
        }
      }
      return ret;
    }
  }


  export class SLConfigDescriptorParser extends DescriptorParser {
    static TAG = DESCR_TAG_SL_CONFIG_DESCRIPTOR;

    parse(): ISLConfigDescriptor {
      var ret = <ISLConfigDescriptor>super.parse();
      ret.preDefined = this.readUint8();
      if (ret.preDefined === 0) {
        ret.useAccessUnitStartFlag = this.readBits(1);
        ret.useAccessUnitEndFlag = this.readBits(1);
        ret.useRandomAccessPointFlag = this.readBits(1);
        ret.hasRandomAccessUnitsOnlyFlag = this.readBits(1);
        ret.usePaddingFlag = this.readBits(1);
        ret.useTimeStampsFlag = this.readBits(1);
        ret.useIdleFlag = this.readBits(1);
        ret.durationFlag = this.readBits(1);
        ret.timeStampResolution = this.readUint32();
        ret.ocrResolution = this.readUint32();
        ret.timeStampLength = this.readUint8();
        ret.ocrLength = this.readUint8();
        ret.auLength = this.readUint8();
        ret.instantBitrateLength = this.readUint8();
        ret.degradationPriorityLength = this.readBits(4);
        ret.auSeqNumLength = this.readBits(5);
        ret.packetSeqNumLength = this.readBits(5);
        this.skipBits(2);
      }
      if (ret.durationFlag) {
        ret.timeScale = this.readUint32();
        ret.accessUnitDuration = this.readUint16();
        ret.compositionUnitDuration = this.readUint16();
      }
      if (ret.useTimeStampsFlag === 0) {
        ret.startDecodingTimeStamp = this.readBits(ret.timeStampLength);
        ret.startCompositionTimeStamp = this.readBits(ret.timeStampLength);
      }
      return ret;
    }
  }


  export class IPIDescriptorPointerParser extends DescriptorParser {

  }


  export class IPIdentificationDataSetParser extends DescriptorParser { }


  export class IPMPDescriptorPointerParser extends DescriptorParser { }


  export class LanguageDescriptorParser extends DescriptorParser { }


  export class QosDescriptorParser extends DescriptorParser { }


  export class ExtensionDescriptorParser extends DescriptorParser { }


  export class ESDescriptorParser extends DescriptorParser {
    static TAG = DESCR_TAG_ES_DESCRIPTOR;

    parse(): IESDescriptor {
      var ret = <IESDescriptor>super.parse();
      var descr: IDescriptor;

      ret.esID = this.readUint16();
      ret.streamDependenceFlag = this.readBits(1);
      ret.urlFlag = this.readBits(1);
      ret.ocrStreamFlag = this.readBits(1);
      ret.streamPriority = this.readBits(5);

      if (ret.streamDependenceFlag) {
        ret.dependsOnEsID = this.readUint16();
      }

      if (ret.urlFlag) {
        ret.urlLength = this.readUint8();
        ret.urlString = this.readString(ret.urlLength);
      }

      if (ret.ocrStreamFlag) {
        ret.ocrEsID = this.readUint16();
      }

      while (!this.eof()) {
        descr = this.readDescriptor();
        switch (descr.tag) {
          case DESCR_TAG_DECODER_CONFIG_DESCRIPTOR:
            ret.decConfigDescr = <IDecoderConfigDescriptor>descr;
            break;
          case DESCR_TAG_SL_CONFIG_DESCRIPTOR:
            ret.slConfigDescr = <ISLConfigDescriptor>descr;
            break;
        }
      }

      return ret;
    }
  }


  export class InitialObjectDescriptorParser extends DescriptorParser {
    static TAG = [0x02, 0x10];

    parse(): IInitialObjectDescriptor {
      var ret = <IInitialObjectDescriptor>super.parse();
      ret.objectDescrID = this.readBits(10);
      ret.urlFlag = this.readBits(1);
      ret.includeInlineProfileLevelFlag = this.readBits(1);
      this.skipBits(4);
      if (ret.urlFlag) {
        ret.urlLength = this.readUint8();
        ret.urlString = this.readString(ret.urlLength);
      } else {
        ret.odProfileLevelIndication = this.readUint8();
        ret.sceneProfileLevelIndication = this.readUint8();
        ret.audioProfileLevelIndication = this.readUint8();
        ret.visualProfileLevelIndication = this.readUint8();
        ret.graphicsProfileLevelIndication = this.readUint8();
        // TODO
      }
      ret.extDescrs = [];
      if (ret.urlFlag) while (!this.eof()) {
        ret.extDescrs.push(<IExtensionDescriptor>this.readDescriptor());
      }
      return ret;
    }
  }


  export var createDescriptorParser = (bytes: Uint8Array, tag: number): DescriptorParser => {
    var _Parser;
    Object.keys(Parser).some(key => {
      var __Parser = Parser[key];
      if (__Parser.TAG === tag || Array.isArray(__Parser) && __Parser.some(tag => __Parser.TAG === tag)) {
        _Parser = __Parser;
        return true;
      }
    });
    return new (_Parser || DescriptorParser)(bytes);
  };

}