var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Builder) {
        var DescriptorBuilderMixin = (function (_super) {
            __extends(DescriptorBuilderMixin, _super);
            function DescriptorBuilderMixin() {
                _super.apply(this, arguments);
            }
            DescriptorBuilderMixin.prototype.writeDescriptor = function (descr) {
                var bytes;
                if (descr instanceof Uint8Array) {
                    bytes = descr;
                } else if (descr.bytes) {
                    bytes = descr.bytes;
                } else {
                    bytes = Builder.createDescriptorBuilder(descr).build();
                }
                this.writeBytes(bytes);
            };
            return DescriptorBuilderMixin;
        })(Builder.BaseBuilder);
        Builder.DescriptorBuilderMixin = DescriptorBuilderMixin;

        var DescriptorBuilder = (function (_super) {
            __extends(DescriptorBuilder, _super);
            function DescriptorBuilder() {
                _super.call(this);
                this.writeUint8(this['constructor'].TAG);
                this.writeBytes(new Uint8Array(4));
            }
            DescriptorBuilder.prototype.build = function () {
                this.writeBodyLength();
                return _super.prototype.build.call(this);
            };

            DescriptorBuilder.prototype.writeBodyLength = function () {
                var bytes = [0x80, 0x80, 0x80, 0x00];
                var bodyLength = this.byteOffset - 5;
                var i = 3;
                while (bodyLength) {
                    bytes[i--] |= bodyLength & 0x7F;
                    bodyLength >>>= 7;
                }
                this.bytes.set(bytes, 1);
            };
            return DescriptorBuilder;
        })(DescriptorBuilderMixin);
        Builder.DescriptorBuilder = DescriptorBuilder;

        var DecoderConfigDescriptorBuilder = (function (_super) {
            __extends(DecoderConfigDescriptorBuilder, _super);
            function DecoderConfigDescriptorBuilder(descr) {
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
                if (descr.profileLevelIndicationIndexDescrs) {
                    descr.profileLevelIndicationIndexDescrs.forEach(function (d) {
                        d.tag = Mp4.DESCR_TAG_PROFILE_LEVEL_INDICATION_INDEX_DESCRIPTOR;
                        _this.writeDescriptor(d);
                    });
                }
            }
            DecoderConfigDescriptorBuilder.TAG = Mp4.DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
            return DecoderConfigDescriptorBuilder;
        })(DescriptorBuilder);
        Builder.DecoderConfigDescriptorBuilder = DecoderConfigDescriptorBuilder;

        var SLConfigDescriptorBuilder = (function (_super) {
            __extends(SLConfigDescriptorBuilder, _super);
            function SLConfigDescriptorBuilder(descr) {
                _super.call(this);
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
            SLConfigDescriptorBuilder.TAG = Mp4.DESCR_TAG_SL_CONFIG_DESCRIPTOR;
            return SLConfigDescriptorBuilder;
        })(DescriptorBuilder);
        Builder.SLConfigDescriptorBuilder = SLConfigDescriptorBuilder;

        var DecoderSpecificInfoBuilder = (function (_super) {
            __extends(DecoderSpecificInfoBuilder, _super);
            function DecoderSpecificInfoBuilder(descr) {
                _super.call(this);
                this.writeBytes(descr.data);
            }
            DecoderSpecificInfoBuilder.TAG = Mp4.DESCR_TAG_DECODER_SPECIFIC_INFO;
            return DecoderSpecificInfoBuilder;
        })(DescriptorBuilder);
        Builder.DecoderSpecificInfoBuilder = DecoderSpecificInfoBuilder;

        var ESDescriptorBuilder = (function (_super) {
            __extends(ESDescriptorBuilder, _super);
            function ESDescriptorBuilder(descr) {
                _super.call(this);
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

                descr.decConfigDescr.tag = Mp4.DESCR_TAG_DECODER_CONFIG_DESCRIPTOR;
                this.writeDescriptor(descr.decConfigDescr);
                descr.slConfigDescr.tag = Mp4.DESCR_TAG_SL_CONFIG_DESCRIPTOR;
                this.writeDescriptor(descr.slConfigDescr);
            }
            ESDescriptorBuilder.TAG = Mp4.DESCR_TAG_ES_DESCRIPTOR;
            return ESDescriptorBuilder;
        })(DescriptorBuilder);
        Builder.ESDescriptorBuilder = ESDescriptorBuilder;

        Builder.createDescriptorBuilder = function (descr) {
            var _Builder;
            Object.keys(Mp4.Builder).some(function (key) {
                if (Mp4.Builder[key].TAG === descr.tag) {
                    _Builder = Mp4.Builder[key];
                    return true;
                }
            });
            return new (_Builder || DescriptorBuilder)(descr);
        };
    })(Mp4.Builder || (Mp4.Builder = {}));
    var Builder = Mp4.Builder;
})(Mp4 || (Mp4 = {}));
//# sourceMappingURL=composer.descr.js.map
