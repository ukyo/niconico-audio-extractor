var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Composer) {
        var DescriptorComposerMixin = (function (_super) {
            __extends(DescriptorComposerMixin, _super);
            function DescriptorComposerMixin() {
                _super.apply(this, arguments);

            }
            DescriptorComposerMixin.prototype.writeDescriptor = function (descr) {
                var bytes;
                if(descr instanceof Uint8Array) {
                    bytes = descr;
                } else if(descr.bytes) {
                    bytes = descr.bytes;
                } else {
                    bytes = Composer.createDescriptorComposer(descr).compose();
                }
                this.writeBytes(bytes);
            };
            return DescriptorComposerMixin;
        })(Composer.BaseComposer);
        Composer.DescriptorComposerMixin = DescriptorComposerMixin;        
        var DescriptorComposer = (function (_super) {
            __extends(DescriptorComposer, _super);
            function DescriptorComposer() {
                        _super.call(this);
                this.writeUint8(this['constructor'].TAG);
                this.writeBytes(new Uint8Array(4));
            }
            DescriptorComposer.prototype.compose = function () {
                this.writeBodyLength();
                return _super.prototype.compose.call(this);
            };
            DescriptorComposer.prototype.writeBodyLength = function () {
                var bytes = [
                    0x80, 
                    0x80, 
                    0x80, 
                    0x00
                ];
                var bodyLength = this.byteOffset - 5;
                var i = 3;
                while(bodyLength) {
                    bytes[i--] |= bodyLength & 0x7F;
                    bodyLength >>>= 7;
                }
                this.bytes.set(bytes, 1);
            };
            return DescriptorComposer;
        })(DescriptorComposerMixin);
        Composer.DescriptorComposer = DescriptorComposer;        
        var DecoderConfigDescriptorComposer = (function (_super) {
            __extends(DecoderConfigDescriptorComposer, _super);
            function DecoderConfigDescriptorComposer(descr) {
                var _this = this;
                        _super.call(this);
                this.writeUint8(descr.objectTypeIndication);
                this.writeBits(descr.streamType, 6);
                this.writeBits(descr.upStream, 1);
                this.writeBits(1, 1);
                this.writeUint24(descr.bufferSizeDB);
                this.writeUint32(descr.maxBitrate);
                this.writeUint32(descr.avgBitrate);
                descr.decSpecificInfo.tag = Mp4.DESCR_TAG_DECODER_SPECIFIC_INFO;
                this.writeDescriptor(descr.decSpecificInfo);
                if(descr.profileLevelIndicationIndexDescrs) {
                    descr.profileLevelIndicationIndexDescrs.forEach(function (d) {
                        d.tag = Mp4.DESCR_TAG_PROFILE_LEVEL_INDICATION_INDEX_DESCRIPTOR;
                        _this.writeDescriptor(d);
                    });
                }
            }
            DecoderConfigDescriptorComposer.TAG = Mp4.DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
            return DecoderConfigDescriptorComposer;
        })(DescriptorComposer);
        Composer.DecoderConfigDescriptorComposer = DecoderConfigDescriptorComposer;        
        var SLConfigDescriptorComposer = (function (_super) {
            __extends(SLConfigDescriptorComposer, _super);
            function SLConfigDescriptorComposer(descr) {
                        _super.call(this);
                this.writeUint8(descr.preDefined);
                if(descr.preDefined === 0) {
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
                if(descr.durationFlag) {
                    this.writeUint32(descr.timeScale);
                    this.writeUint16(descr.accessUnitDuration);
                    this.writeUint16(descr.compositionUnitDuration);
                }
                if(descr.useTimeStampsFlag === 0) {
                    this.writeBits(descr.startDecodingTimeStamp, descr.timeStampLength);
                    this.writeBits(descr.startCompositionTimeStamp, descr.timeStampLength);
                }
            }
            SLConfigDescriptorComposer.TAG = Mp4.DESCR_TAG_SL_CONFIG_DESCRIPTOR;
            return SLConfigDescriptorComposer;
        })(DescriptorComposer);
        Composer.SLConfigDescriptorComposer = SLConfigDescriptorComposer;        
        var DecoderSpecificInfoComposer = (function (_super) {
            __extends(DecoderSpecificInfoComposer, _super);
            function DecoderSpecificInfoComposer(descr) {
                        _super.call(this);
                this.writeBytes(descr.data);
            }
            DecoderSpecificInfoComposer.TAG = Mp4.DESCR_TAG_DECODER_SPECIFIC_INFO;
            return DecoderSpecificInfoComposer;
        })(DescriptorComposer);
        Composer.DecoderSpecificInfoComposer = DecoderSpecificInfoComposer;        
        var ESDescriptorComposer = (function (_super) {
            __extends(ESDescriptorComposer, _super);
            function ESDescriptorComposer(descr) {
                        _super.call(this);
                this.writeUint16(descr.esID);
                this.writeBits(descr.streamDependenceFlag || 0, 1);
                this.writeBits(descr.urlFlag || 0, 1);
                this.writeBits(descr.ocrStreamFlag || 0, 1);
                this.writeBits(descr.streamPriority, 5);
                if(descr.urlFlag) {
                    this.writeUint8(descr.urlLength);
                    this.writeString(descr.urlString);
                }
                if(descr.ocrStreamFlag) {
                    this.writeUint16(descr.ocrEsID);
                }
                descr.decConfigDescr.tag = Mp4.DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
                this.writeDescriptor(descr.decConfigDescr);
                descr.slConfigDescr.tag = Mp4.DESCR_TAG_SL_CONFIG_DESCRIPTOR;
                this.writeDescriptor(descr.slConfigDescr);
            }
            ESDescriptorComposer.TAG = Mp4.DESCR_TAG_ES_DESCRIPTOR;
            return ESDescriptorComposer;
        })(DescriptorComposer);
        Composer.ESDescriptorComposer = ESDescriptorComposer;        
        Composer.createDescriptorComposer = function (descr) {
            var _Composer;
            Object.keys(Mp4.Composer).some(function (key) {
                if(Mp4.Composer[key].TAG === descr.tag) {
                    _Composer = Mp4.Composer[key];
                    return true;
                }
            });
            return new (_Composer || DescriptorComposer)(descr);
        };
    })(Mp4.Composer || (Mp4.Composer = {}));
    var Composer = Mp4.Composer;
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=composer.descr.js.map
