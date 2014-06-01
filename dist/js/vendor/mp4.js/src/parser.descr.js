var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Parser) {
        Parser.getDescriptorInfo = function (bytes, offset) {
            if (typeof offset === "undefined") { offset = 0; }
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

        var DescriptorParserMixin = (function (_super) {
            __extends(DescriptorParserMixin, _super);
            function DescriptorParserMixin() {
                _super.apply(this, arguments);
            }
            DescriptorParserMixin.prototype.readDescriptor = function () {
                var info = Parser.getDescriptorInfo(this.bytes, this.byteOffset);
                return Parser.createDescriptorParser(this.readBytes(info.byteLength), info.tag).parse();
            };
            return DescriptorParserMixin;
        })(Parser.BaseParser);
        Parser.DescriptorParserMixin = DescriptorParserMixin;

        var DescriptorParser = (function (_super) {
            __extends(DescriptorParser, _super);
            function DescriptorParser() {
                _super.apply(this, arguments);
            }
            DescriptorParser.prototype.parse = function () {
                var info = Parser.getDescriptorInfo(this.bytes);
                this.skipBytes(info.headerLength);
                info.bytes = this.bytes;
                return info;
            };
            return DescriptorParser;
        })(DescriptorParserMixin);
        Parser.DescriptorParser = DescriptorParser;

        var DecoderSpecificInfoParser = (function (_super) {
            __extends(DecoderSpecificInfoParser, _super);
            function DecoderSpecificInfoParser() {
                _super.apply(this, arguments);
            }
            DecoderSpecificInfoParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.data = this.bytes.subarray(this.byteOffset);
                return ret;
            };
            DecoderSpecificInfoParser.TAG = Mp4.DESCR_TAG_DECODER_SPECIFIC_INFO;
            return DecoderSpecificInfoParser;
        })(DescriptorParser);
        Parser.DecoderSpecificInfoParser = DecoderSpecificInfoParser;

        var ProfileLevelINdicationIndexDescriptor = (function (_super) {
            __extends(ProfileLevelINdicationIndexDescriptor, _super);
            function ProfileLevelINdicationIndexDescriptor() {
                _super.apply(this, arguments);
            }
            ProfileLevelINdicationIndexDescriptor.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.profileLevelIndicationIndex = this.readUint8();
                return ret;
            };
            ProfileLevelINdicationIndexDescriptor.TAG = Mp4.DESCR_TAG_PROFILE_LEVEL_INDICATION_INDEX_DESCRIPTOR;
            return ProfileLevelINdicationIndexDescriptor;
        })(DescriptorParser);
        Parser.ProfileLevelINdicationIndexDescriptor = ProfileLevelINdicationIndexDescriptor;

        var DecoderConfigDescriptorParser = (function (_super) {
            __extends(DecoderConfigDescriptorParser, _super);
            function DecoderConfigDescriptorParser() {
                _super.apply(this, arguments);
            }
            DecoderConfigDescriptorParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.objectTypeIndication = this.readUint8();
                ret.streamType = this.readBits(6);
                ret.upStream = this.readBits(1);
                this.skipBits(1);
                ret.bufferSizeDB = this.readUint24();
                ret.maxBitrate = this.readUint32();
                ret.avgBitrate = this.readUint32();

                var info;
                var descrParser;
                var descr;
                ret.profileLevelIndicationIndexDescrs = [];

                while (!this.eof()) {
                    info = Parser.getDescriptorInfo(this.bytes.subarray(this.byteOffset));
                    descrParser = Parser.createDescriptorParser(this.readBytes(info.byteLength), info.tag);
                    descr = descrParser.parse();
                    if (descrParser instanceof DecoderSpecificInfoParser) {
                        ret.decSpecificInfo = descr;
                    } else if (descrParser instanceof ProfileLevelINdicationIndexDescriptor) {
                        ret.profileLevelIndicationIndexDescrs.push(descr);
                    } else {
                        throw new TypeError();
                    }
                }
                return ret;
            };
            DecoderConfigDescriptorParser.TAG = Mp4.DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
            DecoderConfigDescriptorParser.OBJECT_TYPE_INDICATION = {
                MP3: 0x6B,
                AAC: 0x40
            };
            return DecoderConfigDescriptorParser;
        })(DescriptorParser);
        Parser.DecoderConfigDescriptorParser = DecoderConfigDescriptorParser;

        var SLConfigDescriptorParser = (function (_super) {
            __extends(SLConfigDescriptorParser, _super);
            function SLConfigDescriptorParser() {
                _super.apply(this, arguments);
            }
            SLConfigDescriptorParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
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
            };
            SLConfigDescriptorParser.TAG = Mp4.DESCR_TAG_SL_CONFIG_DESCRIPTOR;
            return SLConfigDescriptorParser;
        })(DescriptorParser);
        Parser.SLConfigDescriptorParser = SLConfigDescriptorParser;

        var IPIDescriptorPointerParser = (function (_super) {
            __extends(IPIDescriptorPointerParser, _super);
            function IPIDescriptorPointerParser() {
                _super.apply(this, arguments);
            }
            return IPIDescriptorPointerParser;
        })(DescriptorParser);
        Parser.IPIDescriptorPointerParser = IPIDescriptorPointerParser;

        var IPIdentificationDataSetParser = (function (_super) {
            __extends(IPIdentificationDataSetParser, _super);
            function IPIdentificationDataSetParser() {
                _super.apply(this, arguments);
            }
            return IPIdentificationDataSetParser;
        })(DescriptorParser);
        Parser.IPIdentificationDataSetParser = IPIdentificationDataSetParser;

        var IPMPDescriptorPointerParser = (function (_super) {
            __extends(IPMPDescriptorPointerParser, _super);
            function IPMPDescriptorPointerParser() {
                _super.apply(this, arguments);
            }
            return IPMPDescriptorPointerParser;
        })(DescriptorParser);
        Parser.IPMPDescriptorPointerParser = IPMPDescriptorPointerParser;

        var LanguageDescriptorParser = (function (_super) {
            __extends(LanguageDescriptorParser, _super);
            function LanguageDescriptorParser() {
                _super.apply(this, arguments);
            }
            return LanguageDescriptorParser;
        })(DescriptorParser);
        Parser.LanguageDescriptorParser = LanguageDescriptorParser;

        var QosDescriptorParser = (function (_super) {
            __extends(QosDescriptorParser, _super);
            function QosDescriptorParser() {
                _super.apply(this, arguments);
            }
            return QosDescriptorParser;
        })(DescriptorParser);
        Parser.QosDescriptorParser = QosDescriptorParser;

        var ExtensionDescriptorParser = (function (_super) {
            __extends(ExtensionDescriptorParser, _super);
            function ExtensionDescriptorParser() {
                _super.apply(this, arguments);
            }
            return ExtensionDescriptorParser;
        })(DescriptorParser);
        Parser.ExtensionDescriptorParser = ExtensionDescriptorParser;

        var ESDescriptorParser = (function (_super) {
            __extends(ESDescriptorParser, _super);
            function ESDescriptorParser() {
                _super.apply(this, arguments);
            }
            ESDescriptorParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var descr;

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
                        case Mp4.DESCR_TAG_DECODER_CONFIG_DESCRIPTOR:
                            ret.decConfigDescr = descr;
                            break;
                        case Mp4.DESCR_TAG_SL_CONFIG_DESCRIPTOR:
                            ret.slConfigDescr = descr;
                            break;
                    }
                }

                return ret;
            };
            ESDescriptorParser.TAG = Mp4.DESCR_TAG_ES_DESCRIPTOR;
            return ESDescriptorParser;
        })(DescriptorParser);
        Parser.ESDescriptorParser = ESDescriptorParser;

        var InitialObjectDescriptorParser = (function (_super) {
            __extends(InitialObjectDescriptorParser, _super);
            function InitialObjectDescriptorParser() {
                _super.apply(this, arguments);
            }
            InitialObjectDescriptorParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
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
                }
                ret.extDescrs = [];
                if (ret.urlFlag)
                    while (!this.eof()) {
                        ret.extDescrs.push(this.readDescriptor());
                    }
                return ret;
            };
            InitialObjectDescriptorParser.TAG = [0x02, 0x10];
            return InitialObjectDescriptorParser;
        })(DescriptorParser);
        Parser.InitialObjectDescriptorParser = InitialObjectDescriptorParser;

        Parser.createDescriptorParser = function (bytes, tag) {
            var _Parser;
            Object.keys(Parser).some(function (key) {
                var __Parser = Parser[key];
                if (__Parser.TAG === tag || Array.isArray(__Parser) && __Parser.some(function (tag) {
                    return __Parser.TAG === tag;
                })) {
                    _Parser = __Parser;
                    return true;
                }
            });
            return new (_Parser || DescriptorParser)(bytes);
        };
    })(Mp4.Parser || (Mp4.Parser = {}));
    var Parser = Mp4.Parser;
})(Mp4 || (Mp4 = {}));
//# sourceMappingURL=parser.descr.js.map
