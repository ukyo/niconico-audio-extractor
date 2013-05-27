var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Parser) {
        var getBoxInfo = function (bytes, offset) {
            if (typeof offset === "undefined") { offset = 0; }
            var view = new Mp4.DataView2(bytes, offset);
            return {
                byteLength: view.getUint32(0),
                type: view.getString(4, 4)
            };
        };
        var getFullBoxInfo = function (bytes, offset) {
            if (typeof offset === "undefined") { offset = 0; }
            var view = new Mp4.DataView2(bytes, offset);
            return {
                byteLength: view.getUint32(0),
                type: view.getString(4, 4),
                version: view.getUint8(8),
                flags: view.getUint24(9)
            };
        };
        var BoxParserMixin = (function (_super) {
            __extends(BoxParserMixin, _super);
            function BoxParserMixin() {
                _super.apply(this, arguments);

            }
            BoxParserMixin.prototype.readBox = function () {
                var info = getBoxInfo(this.bytes, this.byteOffset);
                return Parser.createBoxParser(this.readBytes(info.byteLength), info.type).parse();
            };
            return BoxParserMixin;
        })(Parser.DescriptorParserMixin);
        Parser.BoxParserMixin = BoxParserMixin;        
        var RootParser = (function (_super) {
            __extends(RootParser, _super);
            function RootParser() {
                _super.apply(this, arguments);

            }
            RootParser.prototype.parse = function () {
                var ret = [];
                while(!this.eof()) {
                    ret.push(this.readBox());
                }
                return ret;
            };
            return RootParser;
        })(BoxParserMixin);
        Parser.RootParser = RootParser;        
        var BoxParser = (function (_super) {
            __extends(BoxParser, _super);
            function BoxParser(bytes) {
                        _super.call(this, bytes);
                this.byteLength = this.bytes.length;
                this.skipBytes(4);
                this.type = this.readString(4);
            }
            BoxParser.prototype.parse = function () {
                return {
                    byteLength: this.byteLength,
                    type: this.type,
                    bytes: this.bytes
                };
            };
            return BoxParser;
        })(BoxParserMixin);
        Parser.BoxParser = BoxParser;        
        var FullBoxParser = (function (_super) {
            __extends(FullBoxParser, _super);
            function FullBoxParser(bytes) {
                        _super.call(this, bytes);
                this.version = this.readUint8();
                this.flags = this.readUint24();
            }
            FullBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.version = this.version;
                ret.flags = this.flags;
                return ret;
            };
            return FullBoxParser;
        })(BoxParser);
        Parser.FullBoxParser = FullBoxParser;        
        var FileTypeBoxParser = (function (_super) {
            __extends(FileTypeBoxParser, _super);
            function FileTypeBoxParser() {
                _super.apply(this, arguments);

            }
            FileTypeBoxParser.TYPE = Mp4.BOX_TYPE_FILE_TYPE_BOX;
            FileTypeBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.majorBrand = this.readString(4);
                ret.minorVersion = this.readUint32();
                ret.compatibleBrands = [];
                while(!this.eof()) {
                    ret.compatibleBrands.push(this.readString(4));
                }
                return ret;
            };
            return FileTypeBoxParser;
        })(BoxParser);
        Parser.FileTypeBoxParser = FileTypeBoxParser;        
        var BoxListParser = (function (_super) {
            __extends(BoxListParser, _super);
            function BoxListParser() {
                _super.apply(this, arguments);

            }
            BoxListParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var boxes = [];
                while(!this.eof()) {
                    boxes.push(this.readBox());
                }
                ret.boxes = boxes;
                return ret;
            };
            return BoxListParser;
        })(BoxParser);
        Parser.BoxListParser = BoxListParser;        
        var MovieBoxParser = (function (_super) {
            __extends(MovieBoxParser, _super);
            function MovieBoxParser() {
                _super.apply(this, arguments);

            }
            MovieBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_BOX;
            return MovieBoxParser;
        })(BoxListParser);
        Parser.MovieBoxParser = MovieBoxParser;        
        var MediaDataBoxParser = (function (_super) {
            __extends(MediaDataBoxParser, _super);
            function MediaDataBoxParser() {
                _super.apply(this, arguments);

            }
            MediaDataBoxParser.TYPE = Mp4.BOX_TYPE_MEDIA_DATA_BOX;
            MediaDataBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.data = this.bytes.subarray(8);
                return ret;
            };
            return MediaDataBoxParser;
        })(BoxParser);
        Parser.MediaDataBoxParser = MediaDataBoxParser;        
        var MovieHeaderBoxParser = (function (_super) {
            __extends(MovieHeaderBoxParser, _super);
            function MovieHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            MovieHeaderBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_HEADER_BOX;
            MovieHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.matrix = [];
                ret.creationTime = this.readUint32();
                ret.modificationTime = this.readUint32();
                ret.timescale = this.readUint32();
                ret.duration = this.readUint32();
                ret.rate = this.readUint32();
                ret.volume = this.readUint16();
                this.skipBytes(2);
                this.skipBytes(4 * 2);
                for(var i = 0; i < 9; ++i) {
                    ret.matrix.push(this.readInt32());
                }
                this.skipBytes(4 * 6);
                ret.nextTrackID = this.readUint32();
                return ret;
            };
            return MovieHeaderBoxParser;
        })(FullBoxParser);
        Parser.MovieHeaderBoxParser = MovieHeaderBoxParser;        
        var TrackBoxParser = (function (_super) {
            __extends(TrackBoxParser, _super);
            function TrackBoxParser() {
                _super.apply(this, arguments);

            }
            TrackBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_BOX;
            return TrackBoxParser;
        })(BoxListParser);
        Parser.TrackBoxParser = TrackBoxParser;        
        var TrackHeaderBoxParser = (function (_super) {
            __extends(TrackHeaderBoxParser, _super);
            function TrackHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            TrackHeaderBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_HEADER_BOX;
            TrackHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
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
                for(var i = 0; i < 9; ++i) {
                    ret.matrix.push(this.readInt32());
                }
                ret.width = this.readUint32() / 0x10000;
                ret.height = this.readUint32() / 0x10000;
                return ret;
            };
            return TrackHeaderBoxParser;
        })(FullBoxParser);
        Parser.TrackHeaderBoxParser = TrackHeaderBoxParser;        
        var TrackReferenceBox = (function (_super) {
            __extends(TrackReferenceBox, _super);
            function TrackReferenceBox() {
                _super.apply(this, arguments);

            }
            TrackReferenceBox.TYPE = Mp4.BOX_TYPE_TRACK_REFERENCE_BOX;
            return TrackReferenceBox;
        })(BoxListParser);
        Parser.TrackReferenceBox = TrackReferenceBox;        
        var TrackReferenceTypeBox = (function (_super) {
            __extends(TrackReferenceTypeBox, _super);
            function TrackReferenceTypeBox() {
                _super.apply(this, arguments);

            }
            TrackReferenceTypeBox.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.trackIDs = [];
                while(!this.eof()) {
                    ret.trackIDs.push(this.readUint32());
                }
                return ret;
            };
            return TrackReferenceTypeBox;
        })(BoxParser);
        Parser.TrackReferenceTypeBox = TrackReferenceTypeBox;        
        var HintTrackReferenceTypeBox = (function (_super) {
            __extends(HintTrackReferenceTypeBox, _super);
            function HintTrackReferenceTypeBox() {
                _super.apply(this, arguments);

            }
            HintTrackReferenceTypeBox.TYPE = Mp4.BOX_TYPE_HINT_TRACK_REFERENCE_TYPE_BOX;
            return HintTrackReferenceTypeBox;
        })(TrackReferenceTypeBox);
        Parser.HintTrackReferenceTypeBox = HintTrackReferenceTypeBox;        
        var DescribeTrackReferenceTypeBox = (function (_super) {
            __extends(DescribeTrackReferenceTypeBox, _super);
            function DescribeTrackReferenceTypeBox() {
                _super.apply(this, arguments);

            }
            DescribeTrackReferenceTypeBox.TYPE = Mp4.BOX_TYPE_DISCRIBE_TRACK_REFERENCE_TYPE_BOX;
            return DescribeTrackReferenceTypeBox;
        })(TrackReferenceTypeBox);
        Parser.DescribeTrackReferenceTypeBox = DescribeTrackReferenceTypeBox;        
        var MediaBoxParser = (function (_super) {
            __extends(MediaBoxParser, _super);
            function MediaBoxParser() {
                _super.apply(this, arguments);

            }
            MediaBoxParser.TYPE = Mp4.BOX_TYPE_MEDIA_BOX;
            return MediaBoxParser;
        })(BoxListParser);
        Parser.MediaBoxParser = MediaBoxParser;        
        var MediaHeaderBoxParser = (function (_super) {
            __extends(MediaHeaderBoxParser, _super);
            function MediaHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            MediaHeaderBoxParser.TYPE = Mp4.BOX_TYPE_MEDIA_HEADER_BOX;
            MediaHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.creationTime = this.readUint32();
                ret.modificationTime = this.readUint32();
                ret.timescale = this.readUint32();
                ret.duration = this.readUint32();
                this.skipBits(1);
                ret.language = String.fromCharCode.apply(null, [
                    this.readBits(5), 
                    this.readBits(5), 
                    this.readBits(5)
                ].map(function (x) {
                    return x + 0x60;
                }));
                return ret;
            };
            return MediaHeaderBoxParser;
        })(FullBoxParser);
        Parser.MediaHeaderBoxParser = MediaHeaderBoxParser;        
        var HandlerBoxParser = (function (_super) {
            __extends(HandlerBoxParser, _super);
            function HandlerBoxParser() {
                _super.apply(this, arguments);

            }
            HandlerBoxParser.TYPE = Mp4.BOX_TYPE_HANDLER_BOX;
            HandlerBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                this.skipBytes(4);
                ret.handlerType = this.readString(4);
                this.skipBytes(4 * 3);
                ret.name = this.readUTF8StringNullTerminated();
                return ret;
            };
            return HandlerBoxParser;
        })(FullBoxParser);
        Parser.HandlerBoxParser = HandlerBoxParser;        
        var MediaInformationBoxParser = (function (_super) {
            __extends(MediaInformationBoxParser, _super);
            function MediaInformationBoxParser() {
                _super.apply(this, arguments);

            }
            MediaInformationBoxParser.TYPE = Mp4.BOX_TYPE_MEDIA_INFORMATION_BOX;
            return MediaInformationBoxParser;
        })(BoxListParser);
        Parser.MediaInformationBoxParser = MediaInformationBoxParser;        
        var VideoMediaHeaderBoxParser = (function (_super) {
            __extends(VideoMediaHeaderBoxParser, _super);
            function VideoMediaHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            VideoMediaHeaderBoxParser.TYPE = Mp4.BOX_TYPE_VIDEO_MEDIA_HEADER_BOX;
            VideoMediaHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var view = new Mp4.DataView2(this.bytes);
                ret.opcolor = [];
                ret.graphicsmode = this.readUint16();
                for(var i = 0; i < 3; ++i) {
                    ret.opcolor.push(this.readUint16());
                }
                return ret;
            };
            return VideoMediaHeaderBoxParser;
        })(FullBoxParser);
        Parser.VideoMediaHeaderBoxParser = VideoMediaHeaderBoxParser;        
        var SoundMediaHeaderBoxParser = (function (_super) {
            __extends(SoundMediaHeaderBoxParser, _super);
            function SoundMediaHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            SoundMediaHeaderBoxParser.TYPE = Mp4.BOX_TYPE_SOUND_MEDIA_HEADER_BOX;
            SoundMediaHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.balance = this.readInt16();
                return ret;
            };
            return SoundMediaHeaderBoxParser;
        })(FullBoxParser);
        Parser.SoundMediaHeaderBoxParser = SoundMediaHeaderBoxParser;        
        var HintMediaHeaderBoxParser = (function (_super) {
            __extends(HintMediaHeaderBoxParser, _super);
            function HintMediaHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            HintMediaHeaderBoxParser.TYPE = Mp4.BOX_TYPE_HINT_MEDIA_HEADER_BOX;
            HintMediaHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.maxPDUsize = this.readUint16();
                ret.avgPDUsize = this.readUint16();
                ret.maxbitrate = this.readUint32();
                ret.avgbitrate = this.readUint32();
                return ret;
            };
            return HintMediaHeaderBoxParser;
        })(FullBoxParser);
        Parser.HintMediaHeaderBoxParser = HintMediaHeaderBoxParser;        
        var NullMediaHeaderBoxParser = (function (_super) {
            __extends(NullMediaHeaderBoxParser, _super);
            function NullMediaHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            NullMediaHeaderBoxParser.TYPE = Mp4.BOX_TYPE_NULL_MEDIA_HEADER_BOX;
            return NullMediaHeaderBoxParser;
        })(FullBoxParser);
        Parser.NullMediaHeaderBoxParser = NullMediaHeaderBoxParser;        
        var DataInformationBoxParser = (function (_super) {
            __extends(DataInformationBoxParser, _super);
            function DataInformationBoxParser() {
                _super.apply(this, arguments);

            }
            DataInformationBoxParser.TYPE = Mp4.BOX_TYPE_DATA_INFORMATION_BOX;
            return DataInformationBoxParser;
        })(BoxListParser);
        Parser.DataInformationBoxParser = DataInformationBoxParser;        
        var DataReferenceBoxParser = (function (_super) {
            __extends(DataReferenceBoxParser, _super);
            function DataReferenceBoxParser() {
                _super.apply(this, arguments);

            }
            DataReferenceBoxParser.TYPE = Mp4.BOX_TYPE_DATA_REFERENCE_BOX;
            DataReferenceBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.entryCount = this.readUint32();
                ret.entries = [];
                while(!this.eof()) {
                    ret.entries.push(this.readBox());
                }
                return ret;
            };
            return DataReferenceBoxParser;
        })(FullBoxParser);
        Parser.DataReferenceBoxParser = DataReferenceBoxParser;        
        var DataEntryUrlBoxParser = (function (_super) {
            __extends(DataEntryUrlBoxParser, _super);
            function DataEntryUrlBoxParser() {
                _super.apply(this, arguments);

            }
            DataEntryUrlBoxParser.TYPE = Mp4.BOX_TYPE_DATA_ENTRY_URL_BOX;
            DataEntryUrlBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.location = this.readUTF8StringNullTerminated();
                return ret;
            };
            return DataEntryUrlBoxParser;
        })(FullBoxParser);
        Parser.DataEntryUrlBoxParser = DataEntryUrlBoxParser;        
        var DataEntryUrnBoxParser = (function (_super) {
            __extends(DataEntryUrnBoxParser, _super);
            function DataEntryUrnBoxParser() {
                _super.apply(this, arguments);

            }
            DataEntryUrnBoxParser.TYPE = Mp4.BOX_TYPE_DATA_ENTRY_URN_BOX;
            DataEntryUrnBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.name = this.readUTF8StringNullTerminated();
                ret.location = this.readUTF8StringNullTerminated();
                return ret;
            };
            return DataEntryUrnBoxParser;
        })(FullBoxParser);
        Parser.DataEntryUrnBoxParser = DataEntryUrnBoxParser;        
        var SampleTableBoxParser = (function (_super) {
            __extends(SampleTableBoxParser, _super);
            function SampleTableBoxParser() {
                _super.apply(this, arguments);

            }
            SampleTableBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_TABLE_BOX;
            return SampleTableBoxParser;
        })(BoxListParser);
        Parser.SampleTableBoxParser = SampleTableBoxParser;        
        var TimeToSampleBoxParser = (function (_super) {
            __extends(TimeToSampleBoxParser, _super);
            function TimeToSampleBoxParser() {
                _super.apply(this, arguments);

            }
            TimeToSampleBoxParser.TYPE = Mp4.BOX_TYPE_TIME_TO_SAMPLE_BOX;
            TimeToSampleBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push({
                        sampleCount: this.readUint32(),
                        sampleDelta: this.readUint32()
                    });
                }
                return ret;
            };
            return TimeToSampleBoxParser;
        })(FullBoxParser);
        Parser.TimeToSampleBoxParser = TimeToSampleBoxParser;        
        var CompositionOffsetBoxParser = (function (_super) {
            __extends(CompositionOffsetBoxParser, _super);
            function CompositionOffsetBoxParser() {
                _super.apply(this, arguments);

            }
            CompositionOffsetBoxParser.TYPE = Mp4.BOX_TYPE_COMPOSITION_OFFSET_BOX;
            CompositionOffsetBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push({
                        sampleCount: this.readUint32(),
                        sampleOffset: this.readUint32()
                    });
                }
                return ret;
            };
            return CompositionOffsetBoxParser;
        })(FullBoxParser);
        Parser.CompositionOffsetBoxParser = CompositionOffsetBoxParser;        
        var SampleEntryParser = (function (_super) {
            __extends(SampleEntryParser, _super);
            function SampleEntryParser() {
                _super.apply(this, arguments);

            }
            SampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                this.skipBytes(6);
                ret.dataReferenceIndex = this.readUint16();
                return ret;
            };
            return SampleEntryParser;
        })(BoxParser);
        Parser.SampleEntryParser = SampleEntryParser;        
        var HintSampleEntryParser = (function (_super) {
            __extends(HintSampleEntryParser, _super);
            function HintSampleEntryParser() {
                _super.apply(this, arguments);

            }
            HintSampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.data = this.bytes.subarray(16);
                return ret;
            };
            return HintSampleEntryParser;
        })(SampleEntryParser);
        Parser.HintSampleEntryParser = HintSampleEntryParser;        
        var VisualSampleEntryParser = (function (_super) {
            __extends(VisualSampleEntryParser, _super);
            function VisualSampleEntryParser() {
                _super.apply(this, arguments);

            }
            VisualSampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                this.skipBytes(16);
                ret.width = this.readUint16();
                ret.height = this.readUint16();
                ret.horizresolution = this.readUint32();
                ret.vertresolution = this.readUint32();
                ret.compressorname = this.readString(32);
                ret.depth = this.readUint16();
                return ret;
            };
            return VisualSampleEntryParser;
        })(SampleEntryParser);
        Parser.VisualSampleEntryParser = VisualSampleEntryParser;        
        var AudioSampleEntryParser = (function (_super) {
            __extends(AudioSampleEntryParser, _super);
            function AudioSampleEntryParser() {
                _super.apply(this, arguments);

            }
            AudioSampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                this.skipBytes(8);
                ret.channelCount = this.readUint16();
                ret.sampleSize = this.readUint16();
                this.skipBytes(4);
                ret.sampleRate = this.readUint32() / 0x10000;
                return ret;
            };
            return AudioSampleEntryParser;
        })(SampleEntryParser);
        Parser.AudioSampleEntryParser = AudioSampleEntryParser;        
        var ESDBoxParser = (function (_super) {
            __extends(ESDBoxParser, _super);
            function ESDBoxParser() {
                _super.apply(this, arguments);

            }
            ESDBoxParser.TYPE = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
            ESDBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.esDescr = this.readDescriptor();
                return ret;
            };
            return ESDBoxParser;
        })(FullBoxParser);
        Parser.ESDBoxParser = ESDBoxParser;        
        var MP4VisualSampleEntryParser = (function (_super) {
            __extends(MP4VisualSampleEntryParser, _super);
            function MP4VisualSampleEntryParser() {
                _super.apply(this, arguments);

            }
            MP4VisualSampleEntryParser.TYPE = Mp4.BOX_TYPE_MP4_VISUAL_SAMPLE_ENTRY;
            MP4VisualSampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.esBox = this.readBox();
                return ret;
            };
            return MP4VisualSampleEntryParser;
        })(VisualSampleEntryParser);
        Parser.MP4VisualSampleEntryParser = MP4VisualSampleEntryParser;        
        var MP4AudioSampleEntryParser = (function (_super) {
            __extends(MP4AudioSampleEntryParser, _super);
            function MP4AudioSampleEntryParser() {
                _super.apply(this, arguments);

            }
            MP4AudioSampleEntryParser.TYPE = Mp4.BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY;
            MP4AudioSampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.esBox = this.readBox();
                return ret;
            };
            return MP4AudioSampleEntryParser;
        })(AudioSampleEntryParser);
        Parser.MP4AudioSampleEntryParser = MP4AudioSampleEntryParser;        
        var MpegSampleEntryParser = (function (_super) {
            __extends(MpegSampleEntryParser, _super);
            function MpegSampleEntryParser() {
                _super.apply(this, arguments);

            }
            MpegSampleEntryParser.TYPE = Mp4.BOX_TYPE_MPEG_SAMPLE_ENTRY;
            MpegSampleEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.esBox = this.readBox();
                return ret;
            };
            return MpegSampleEntryParser;
        })(SampleEntryParser);
        Parser.MpegSampleEntryParser = MpegSampleEntryParser;        
        var SampleDescriptionBoxParser = (function (_super) {
            __extends(SampleDescriptionBoxParser, _super);
            function SampleDescriptionBoxParser() {
                _super.apply(this, arguments);

            }
            SampleDescriptionBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_DESCRIPTION_BOX;
            SampleDescriptionBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.boxes = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.boxes.push(this.readBox());
                }
                return ret;
            };
            return SampleDescriptionBoxParser;
        })(FullBoxParser);
        Parser.SampleDescriptionBoxParser = SampleDescriptionBoxParser;        
        var SampleSizeBoxParser = (function (_super) {
            __extends(SampleSizeBoxParser, _super);
            function SampleSizeBoxParser() {
                _super.apply(this, arguments);

            }
            SampleSizeBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_SIZE_BOX;
            SampleSizeBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var sampleSize = this.readUint32();
                var sampleCount = this.readUint32();
                if(sampleSize === 0) {
                    ret.sampleSizes = [];
                    for(var i = 0; i < sampleCount; ++i) {
                        ret.sampleSizes.push(this.readUint32());
                    }
                }
                ret.sampleSize = sampleSize;
                ret.sampleCount = sampleCount;
                return ret;
            };
            return SampleSizeBoxParser;
        })(FullBoxParser);
        Parser.SampleSizeBoxParser = SampleSizeBoxParser;        
        var SampleToChunkBoxParser = (function (_super) {
            __extends(SampleToChunkBoxParser, _super);
            function SampleToChunkBoxParser() {
                _super.apply(this, arguments);

            }
            SampleToChunkBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_TO_CHUNK_BOX;
            SampleToChunkBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push({
                        firstChunk: this.readUint32(),
                        samplesPerChunk: this.readUint32(),
                        sampleDescriptionIndex: this.readUint32()
                    });
                }
                return ret;
            };
            return SampleToChunkBoxParser;
        })(FullBoxParser);
        Parser.SampleToChunkBoxParser = SampleToChunkBoxParser;        
        var ChunkOffsetBoxParser = (function (_super) {
            __extends(ChunkOffsetBoxParser, _super);
            function ChunkOffsetBoxParser() {
                _super.apply(this, arguments);

            }
            ChunkOffsetBoxParser.TYPE = Mp4.BOX_TYPE_CHUNK_OFFSET_BOX;
            ChunkOffsetBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.chunkOffsets = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.chunkOffsets.push(this.readUint32());
                }
                return ret;
            };
            return ChunkOffsetBoxParser;
        })(FullBoxParser);
        Parser.ChunkOffsetBoxParser = ChunkOffsetBoxParser;        
        var SyncSampleBoxParser = (function (_super) {
            __extends(SyncSampleBoxParser, _super);
            function SyncSampleBoxParser() {
                _super.apply(this, arguments);

            }
            SyncSampleBoxParser.TYPE = Mp4.BOX_TYPE_SYNC_SAMPLE_BOX;
            SyncSampleBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.sampleNumbers = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.sampleNumbers.push(this.readUint32());
                }
                return ret;
            };
            return SyncSampleBoxParser;
        })(FullBoxParser);
        Parser.SyncSampleBoxParser = SyncSampleBoxParser;        
        var ShadowSyncSampleBoxParser = (function (_super) {
            __extends(ShadowSyncSampleBoxParser, _super);
            function ShadowSyncSampleBoxParser() {
                _super.apply(this, arguments);

            }
            ShadowSyncSampleBoxParser.TYPE = Mp4.BOX_TYPE_SHADOW_SYNC_SAMPLE_BOX;
            ShadowSyncSampleBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push({
                        shadowedSampleNumber: this.readUint32(),
                        syncSampleNumber: this.readUint32()
                    });
                }
                return ret;
            };
            return ShadowSyncSampleBoxParser;
        })(FullBoxParser);
        Parser.ShadowSyncSampleBoxParser = ShadowSyncSampleBoxParser;        
        var DegradationPriorityBoxParser = (function (_super) {
            __extends(DegradationPriorityBoxParser, _super);
            function DegradationPriorityBoxParser() {
                _super.apply(this, arguments);

            }
            DegradationPriorityBoxParser.TYPE = Mp4.BOX_TYPE_DEGRADATION_PRIORITY_BOX;
            DegradationPriorityBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.priorities = [];
                while(!this.eof()) {
                    ret.priorities.push(this.readUint16());
                }
                return ret;
            };
            return DegradationPriorityBoxParser;
        })(FullBoxParser);
        Parser.DegradationPriorityBoxParser = DegradationPriorityBoxParser;        
        var PaddingBitsBoxParser = (function (_super) {
            __extends(PaddingBitsBoxParser, _super);
            function PaddingBitsBoxParser() {
                _super.apply(this, arguments);

            }
            PaddingBitsBoxParser.TYPE = Mp4.BOX_TYPE_PADDING_BITS_BOX;
            PaddingBitsBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var sampleCount = this.readUint32();
                var pad1;
                var pad2;
                ret.sampleCount = sampleCount;
                ret.samples = [];
                for(var i = 0; i < sampleCount; ++i) {
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
            };
            return PaddingBitsBoxParser;
        })(FullBoxParser);
        Parser.PaddingBitsBoxParser = PaddingBitsBoxParser;        
        var FreeSpaceBoxParser = (function (_super) {
            __extends(FreeSpaceBoxParser, _super);
            function FreeSpaceBoxParser() {
                _super.apply(this, arguments);

            }
            FreeSpaceBoxParser.TYPE = Mp4.BOX_TYPE_FREE_SPACE_BOX;
            return FreeSpaceBoxParser;
        })(MediaBoxParser);
        Parser.FreeSpaceBoxParser = FreeSpaceBoxParser;        
        var SkipBoxParser = (function (_super) {
            __extends(SkipBoxParser, _super);
            function SkipBoxParser() {
                _super.apply(this, arguments);

            }
            SkipBoxParser.TYPE = Mp4.BOX_TYPE_SKIP_BOX;
            return SkipBoxParser;
        })(MediaBoxParser);
        Parser.SkipBoxParser = SkipBoxParser;        
        var EditBoxParser = (function (_super) {
            __extends(EditBoxParser, _super);
            function EditBoxParser() {
                _super.apply(this, arguments);

            }
            EditBoxParser.TYPE = Mp4.BOX_TYPE_EDIT_BOX;
            return EditBoxParser;
        })(BoxListParser);
        Parser.EditBoxParser = EditBoxParser;        
        var EditListBoxParser = (function (_super) {
            __extends(EditListBoxParser, _super);
            function EditListBoxParser() {
                _super.apply(this, arguments);

            }
            EditListBoxParser.TYPE = Mp4.BOX_TYPE_EDIT_LIST_BOX;
            EditListBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push({
                        sagmentDuration: this.readUint32(),
                        mediaTime: this.readUint32(),
                        mediaRateInteger: this.readUint16()
                    });
                    this.skipBytes(2);
                }
                return ret;
            };
            return EditListBoxParser;
        })(FullBoxParser);
        Parser.EditListBoxParser = EditListBoxParser;        
        var CopyrightBoxParser = (function (_super) {
            __extends(CopyrightBoxParser, _super);
            function CopyrightBoxParser() {
                _super.apply(this, arguments);

            }
            CopyrightBoxParser.TYPE = Mp4.BOX_TYPE_COPYRIGHT_BOX;
            CopyrightBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                this.skipBits(1);
                ret.language = String.fromCharCode(this.readBits(5), this.readBits(5), this.readBits(5));
                ret.notice = this.readUTF8StringNullTerminated();
                return ret;
            };
            return CopyrightBoxParser;
        })(FullBoxParser);
        Parser.CopyrightBoxParser = CopyrightBoxParser;        
        var MovieExtendsBoxParser = (function (_super) {
            __extends(MovieExtendsBoxParser, _super);
            function MovieExtendsBoxParser() {
                _super.apply(this, arguments);

            }
            MovieExtendsBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_EXTENDS_BOX;
            return MovieExtendsBoxParser;
        })(BoxListParser);
        Parser.MovieExtendsBoxParser = MovieExtendsBoxParser;        
        var MovieExtendsHeaderBoxParser = (function (_super) {
            __extends(MovieExtendsHeaderBoxParser, _super);
            function MovieExtendsHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            MovieExtendsHeaderBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_EXTENDS_HEADER_BOX;
            MovieExtendsHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.fragmentDuration = this.readUint32();
                return ret;
            };
            return MovieExtendsHeaderBoxParser;
        })(FullBoxParser);
        Parser.MovieExtendsHeaderBoxParser = MovieExtendsHeaderBoxParser;        
        var TrackExtendsBoxParser = (function (_super) {
            __extends(TrackExtendsBoxParser, _super);
            function TrackExtendsBoxParser() {
                _super.apply(this, arguments);

            }
            TrackExtendsBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_EXTENDS_BOX;
            TrackExtendsBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.trackID = this.readUint32();
                ret.defaultSampleDescriptionIndex = this.readUint32();
                ret.defaultSampleDuration = this.readUint32();
                ret.defaultSampleSize = this.readUint32();
                ret.defaultSampleFlags = this.readUint32();
                return ret;
            };
            return TrackExtendsBoxParser;
        })(FullBoxParser);
        Parser.TrackExtendsBoxParser = TrackExtendsBoxParser;        
        var MovieFlagmentBoxParser = (function (_super) {
            __extends(MovieFlagmentBoxParser, _super);
            function MovieFlagmentBoxParser() {
                _super.apply(this, arguments);

            }
            MovieFlagmentBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_FLAGMENT_BOX;
            return MovieFlagmentBoxParser;
        })(BoxListParser);
        Parser.MovieFlagmentBoxParser = MovieFlagmentBoxParser;        
        var MovieFragmentHeaderBoxParser = (function (_super) {
            __extends(MovieFragmentHeaderBoxParser, _super);
            function MovieFragmentHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            MovieFragmentHeaderBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_FRAGMENT_HEADER_BOX;
            MovieFragmentHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.sequenceNumber = this.readUint32();
                return ret;
            };
            return MovieFragmentHeaderBoxParser;
        })(FullBoxParser);
        Parser.MovieFragmentHeaderBoxParser = MovieFragmentHeaderBoxParser;        
        var TrackFragmentBoxParser = (function (_super) {
            __extends(TrackFragmentBoxParser, _super);
            function TrackFragmentBoxParser() {
                _super.apply(this, arguments);

            }
            TrackFragmentBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_FRAGMENT_BOX;
            return TrackFragmentBoxParser;
        })(BoxListParser);
        Parser.TrackFragmentBoxParser = TrackFragmentBoxParser;        
        var TrackFragmentHeaderBoxParser = (function (_super) {
            __extends(TrackFragmentHeaderBoxParser, _super);
            function TrackFragmentHeaderBoxParser() {
                _super.apply(this, arguments);

            }
            TrackFragmentHeaderBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_FRAGMENT_HEADER_BOX;
            TrackFragmentHeaderBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.trackID = this.readUint32();
                if(ret.flags & 0x000001) {
                    ret.baseDataOffset = this.readBytes(8);
                }
                if(ret.flags & 0x000002) {
                    ret.sampleDescriptionIndex = this.readUint32();
                }
                if(ret.flags & 0x000008) {
                    ret.defaultSampleDuration = this.readUint32();
                }
                if(ret.flags & 0x000010) {
                    ret.defaultSampleSize = this.readUint32();
                }
                if(ret.flags & 0x000020) {
                    ret.defaultSampleFlags = this.readUint32();
                }
                return ret;
            };
            return TrackFragmentHeaderBoxParser;
        })(FullBoxParser);
        Parser.TrackFragmentHeaderBoxParser = TrackFragmentHeaderBoxParser;        
        var TrackRunBoxParser = (function (_super) {
            __extends(TrackRunBoxParser, _super);
            function TrackRunBoxParser() {
                _super.apply(this, arguments);

            }
            TrackRunBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_RUN_BOX;
            TrackRunBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var sampleCount = this.readUint32();
                ret.sampleCount = sampleCount;
                if(ret.flags & 0x000001) {
                    ret.dataOffset = this.readInt32();
                }
                if(ret.flags & 0x000002) {
                    ret.firstSampleFlats = this.readUint32();
                }
                ret.samples = [];
                for(var i = 0; i < sampleCount; ++i) {
                    ret.samples.push({
                        sampleDuration: (ret.flags & 0x000100) ? this.readUint32() : void 0,
                        sampleSize: (ret.flags & 0x000200) ? this.readUint32() : void 0,
                        sampleFlags: (ret.flags & 0x000400) ? this.readUint32() : void 0,
                        sampleCompositionTimeOffset: (ret.flags & 0x000800) ? this.readUint32() : void 0
                    });
                }
                return ret;
            };
            return TrackRunBoxParser;
        })(FullBoxParser);
        Parser.TrackRunBoxParser = TrackRunBoxParser;        
        var TrackFragmentRandomAccessBoxParser = (function (_super) {
            __extends(TrackFragmentRandomAccessBoxParser, _super);
            function TrackFragmentRandomAccessBoxParser() {
                _super.apply(this, arguments);

            }
            TrackFragmentRandomAccessBoxParser.TYPE = Mp4.BOX_TYPE_TRACK_FRAGMENT_RANDOM_ACCESS_BOX;
            TrackFragmentRandomAccessBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.trackID = this.readUint32();
                this.skipBits(26);
                ret.lengthSizeOfTrafNum = this.readBits(2);
                ret.lengthSizeOfTrunNum = this.readBits(2);
                ret.lengthSizeOfSampleNum = this.readBits(2);
                var numberOfEntry = this.readUint32();
                ret.numberOfEntry = numberOfEntry;
                ret.entries = [];
                for(var i = 0; i < numberOfEntry; ++i) {
                    ret.entries.push({
                        time: this.readUint32(),
                        moofOffset: this.readUint32(),
                        trafNumber: this.readBits((ret.lengthSizeOfTrafNum + 1) * 8),
                        trunNumber: this.readBits((ret.lengthSizeOfTrunNum + 1) * 8),
                        sampleNumber: this.readBits((ret.lengthSizeOfSampleNum + 1) * 8)
                    });
                }
                return ret;
            };
            return TrackFragmentRandomAccessBoxParser;
        })(FullBoxParser);
        Parser.TrackFragmentRandomAccessBoxParser = TrackFragmentRandomAccessBoxParser;        
        var MovieFragmentRandomAccessOffsetBoxParser = (function (_super) {
            __extends(MovieFragmentRandomAccessOffsetBoxParser, _super);
            function MovieFragmentRandomAccessOffsetBoxParser() {
                _super.apply(this, arguments);

            }
            MovieFragmentRandomAccessOffsetBoxParser.TYPE = Mp4.BOX_TYPE_MOVIE_FRAGMENT_RANDOM_ACCESS_OFFSET_BOX;
            MovieFragmentRandomAccessOffsetBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.size = this.readUint32();
                return ret;
            };
            return MovieFragmentRandomAccessOffsetBoxParser;
        })(FullBoxParser);
        Parser.MovieFragmentRandomAccessOffsetBoxParser = MovieFragmentRandomAccessOffsetBoxParser;        
        var SampleDependencyTypeBoxParser = (function (_super) {
            __extends(SampleDependencyTypeBoxParser, _super);
            function SampleDependencyTypeBoxParser() {
                _super.apply(this, arguments);

            }
            SampleDependencyTypeBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_DEPENDENCY_TYPE_BOX;
            SampleDependencyTypeBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.samples = [];
                while(!this.eof()) {
                    this.skipBits(2);
                    ret.samples.push({
                        sampleDependsOn: this.readBits(2),
                        sampleIsDependedOn: this.readBits(2),
                        sampleHasRedundancy: this.readBits(2)
                    });
                }
                return ret;
            };
            return SampleDependencyTypeBoxParser;
        })(FullBoxParser);
        Parser.SampleDependencyTypeBoxParser = SampleDependencyTypeBoxParser;        
        var SampleToGroupBoxParser = (function (_super) {
            __extends(SampleToGroupBoxParser, _super);
            function SampleToGroupBoxParser() {
                _super.apply(this, arguments);

            }
            SampleToGroupBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_TO_GROUPE_BOX;
            SampleToGroupBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.groupintType = this.readUint32();
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push({
                        sampleCount: this.readUint32(),
                        groupDescriptionIndex: this.readUint32()
                    });
                }
                return ret;
            };
            return SampleToGroupBoxParser;
        })(FullBoxParser);
        Parser.SampleToGroupBoxParser = SampleToGroupBoxParser;        
        var SampleGroupDescriptionEntryParser = (function (_super) {
            __extends(SampleGroupDescriptionEntryParser, _super);
            function SampleGroupDescriptionEntryParser() {
                _super.apply(this, arguments);

            }
            return SampleGroupDescriptionEntryParser;
        })(BoxParser);
        Parser.SampleGroupDescriptionEntryParser = SampleGroupDescriptionEntryParser;        
        var VisualSampleGroupEntryParser = (function (_super) {
            __extends(VisualSampleGroupEntryParser, _super);
            function VisualSampleGroupEntryParser() {
                _super.apply(this, arguments);

            }
            return VisualSampleGroupEntryParser;
        })(SampleGroupDescriptionEntryParser);
        Parser.VisualSampleGroupEntryParser = VisualSampleGroupEntryParser;        
        var AudioSampleGroupEntryParser = (function (_super) {
            __extends(AudioSampleGroupEntryParser, _super);
            function AudioSampleGroupEntryParser() {
                _super.apply(this, arguments);

            }
            return AudioSampleGroupEntryParser;
        })(SampleGroupDescriptionEntryParser);
        Parser.AudioSampleGroupEntryParser = AudioSampleGroupEntryParser;        
        var HintSampleGroupEntryParser = (function (_super) {
            __extends(HintSampleGroupEntryParser, _super);
            function HintSampleGroupEntryParser() {
                _super.apply(this, arguments);

            }
            return HintSampleGroupEntryParser;
        })(SampleGroupDescriptionEntryParser);
        Parser.HintSampleGroupEntryParser = HintSampleGroupEntryParser;        
        var SampleGroupDescriptionBoxParser = (function (_super) {
            __extends(SampleGroupDescriptionBoxParser, _super);
            function SampleGroupDescriptionBoxParser() {
                _super.apply(this, arguments);

            }
            SampleGroupDescriptionBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_GROUP_DESCRIPTION_BOX;
            SampleGroupDescriptionBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.groupingType = this.readUint32();
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.entries.push(this.readBox());
                }
                return ret;
            };
            return SampleGroupDescriptionBoxParser;
        })(FullBoxParser);
        Parser.SampleGroupDescriptionBoxParser = SampleGroupDescriptionBoxParser;        
        var VisualRollRecoveryEntryParser = (function (_super) {
            __extends(VisualRollRecoveryEntryParser, _super);
            function VisualRollRecoveryEntryParser() {
                _super.apply(this, arguments);

            }
            VisualRollRecoveryEntryParser.TYPE = Mp4.BOX_TYPE_ROLL_RECOVERY_ENTRY;
            VisualRollRecoveryEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.rollDistance = this.readInt16();
                return ret;
            };
            return VisualRollRecoveryEntryParser;
        })(VisualSampleGroupEntryParser);
        Parser.VisualRollRecoveryEntryParser = VisualRollRecoveryEntryParser;        
        var AudioRollRecoveryEntryParser = (function (_super) {
            __extends(AudioRollRecoveryEntryParser, _super);
            function AudioRollRecoveryEntryParser() {
                _super.apply(this, arguments);

            }
            AudioRollRecoveryEntryParser.TYPE = Mp4.BOX_TYPE_ROLL_RECOVERY_ENTRY;
            AudioRollRecoveryEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.rollDistance = this.readInt16();
                return ret;
            };
            return AudioRollRecoveryEntryParser;
        })(VisualSampleGroupEntryParser);
        Parser.AudioRollRecoveryEntryParser = AudioRollRecoveryEntryParser;        
        var SampleScaleBoxParser = (function (_super) {
            __extends(SampleScaleBoxParser, _super);
            function SampleScaleBoxParser() {
                _super.apply(this, arguments);

            }
            SampleScaleBoxParser.TYPE = Mp4.BOX_TYPE_SAMPLE_SCALE_BOX;
            SampleScaleBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                this.skipBits(7);
                ret.constraintFlag = this.readBits(1);
                ret.scaleMethod = this.readUint8();
                ret.displayCenterX = this.readInt16();
                ret.displayCenterY = this.readInt16();
                return ret;
            };
            return SampleScaleBoxParser;
        })(FullBoxParser);
        Parser.SampleScaleBoxParser = SampleScaleBoxParser;        
        var SubSampleInformationBoxParser = (function (_super) {
            __extends(SubSampleInformationBoxParser, _super);
            function SubSampleInformationBoxParser() {
                _super.apply(this, arguments);

            }
            SubSampleInformationBoxParser.TYPE = Mp4.BOX_TYPE_SUB_SAMPLE_INFORMATION_BOX;
            SubSampleInformationBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = this.readUint32();
                ret.entryCount = entryCount;
                ret.entries = [];
                for(var i = 0; i < entryCount; ++i) {
                    var sampleDelta = this.readUint32();
                    var subsampleCount = this.readUint16();
                    var samples = [];
                    for(var j = 0; j < subsampleCount; ++j) {
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
            };
            return SubSampleInformationBoxParser;
        })(FullBoxParser);
        Parser.SubSampleInformationBoxParser = SubSampleInformationBoxParser;        
        var ProgressiveDownloadInfoBoxParser = (function (_super) {
            __extends(ProgressiveDownloadInfoBoxParser, _super);
            function ProgressiveDownloadInfoBoxParser() {
                _super.apply(this, arguments);

            }
            ProgressiveDownloadInfoBoxParser.TYPE = Mp4.BOX_TYPE_PROGRESSIVE_DOWNLOAD_INFO_BOX;
            ProgressiveDownloadInfoBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.entries = [];
                while(!this.eof()) {
                    ret.entries.push({
                        rate: this.readUint32(),
                        initialDelay: this.readUint32()
                    });
                }
                return ret;
            };
            return ProgressiveDownloadInfoBoxParser;
        })(FullBoxParser);
        Parser.ProgressiveDownloadInfoBoxParser = ProgressiveDownloadInfoBoxParser;        
        var MetaBoxParser = (function (_super) {
            __extends(MetaBoxParser, _super);
            function MetaBoxParser() {
                _super.apply(this, arguments);

            }
            MetaBoxParser.TYPE = Mp4.BOX_TYPE_META_BOX;
            MetaBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.theHandler = this.readBox();
                ret.otherBoxes = [];
                while(!this.eof()) {
                    var box = this.readBox();
                    switch(box.type) {
                        case Mp4.BOX_TYPE_PRIMARY_ITEM_BOX:
                            ret.primaryResource = box;
                            break;
                        case Mp4.BOX_TYPE_DATA_INFORMATION_BOX:
                            ret.fileLocations = box;
                            break;
                        case Mp4.BOX_TYPE_ITEM_LOCATION_BOX:
                            ret.itemLocations = box;
                            break;
                        case Mp4.BOX_TYPE_ITEM_INFO_BOX:
                            ret.itemInfos = box;
                            break;
                        case Mp4.BOX_TYPE_ITEM_PROTECTION_BOX:
                            ret.protections = box;
                            break;
                        case Mp4.BOX_TYPE_IPMP_CONTROL_BOX:
                            ret.IPMPControl = box;
                            break;
                        default:
                            ret.otherBoxes.push(box);
                    }
                }
                return ret;
            };
            return MetaBoxParser;
        })(FullBoxParser);
        Parser.MetaBoxParser = MetaBoxParser;        
        var XMLBoxParsr = (function (_super) {
            __extends(XMLBoxParsr, _super);
            function XMLBoxParsr() {
                _super.apply(this, arguments);

            }
            XMLBoxParsr.TYPE = Mp4.BOX_TYPE_XML_BOX;
            XMLBoxParsr.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var bytes = this.bytes.subarray(this.byteOffset);
                ret.xml = Mp4.DataView2.UTF8BytesToString(bytes);
                return ret;
            };
            return XMLBoxParsr;
        })(FullBoxParser);
        Parser.XMLBoxParsr = XMLBoxParsr;        
        var BinaryXMLBoxParser = (function (_super) {
            __extends(BinaryXMLBoxParser, _super);
            function BinaryXMLBoxParser() {
                _super.apply(this, arguments);

            }
            BinaryXMLBoxParser.TYPE = Mp4.BOX_TYPE_BINARY_XML_BOX;
            BinaryXMLBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.data = this.bytes.subarray(this.byteOffset);
                return ret;
            };
            return BinaryXMLBoxParser;
        })(FullBoxParser);
        Parser.BinaryXMLBoxParser = BinaryXMLBoxParser;        
        var ItemLocationBoxParser = (function (_super) {
            __extends(ItemLocationBoxParser, _super);
            function ItemLocationBoxParser() {
                _super.apply(this, arguments);

            }
            ItemLocationBoxParser.TYPE = Mp4.BOX_TYPE_ITEM_LOCATION_BOX;
            ItemLocationBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.offsetSize = this.readBits(4);
                ret.lengthSize = this.readBits(4);
                ret.baseOffsetSize = this.readBits(4);
                this.skipBits(4);
                var itemCount = ret.itemCount = this.readUint16();
                ret.items = [];
                for(var i = 0; i < itemCount; ++i) {
                    var itemID = this.readUint16();
                    var dataReferenceIndex = this.readUint16();
                    var baseOffset = this.readBits(ret.baseOffsetSize * 8);
                    var extentCount = this.readUint16();
                    var extents = [];
                    for(var j = 0; j < extentCount; ++j) {
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
            };
            return ItemLocationBoxParser;
        })(FullBoxParser);
        Parser.ItemLocationBoxParser = ItemLocationBoxParser;        
        var PrimaryItemBoxParser = (function (_super) {
            __extends(PrimaryItemBoxParser, _super);
            function PrimaryItemBoxParser() {
                _super.apply(this, arguments);

            }
            PrimaryItemBoxParser.TYPE = Mp4.BOX_TYPE_PRIMARY_ITEM_BOX;
            PrimaryItemBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.itemID = this.readUint16();
                return ret;
            };
            return PrimaryItemBoxParser;
        })(FullBoxParser);
        Parser.PrimaryItemBoxParser = PrimaryItemBoxParser;        
        var ItemProtectionBoxParser = (function (_super) {
            __extends(ItemProtectionBoxParser, _super);
            function ItemProtectionBoxParser() {
                _super.apply(this, arguments);

            }
            ItemProtectionBoxParser.TYPE = Mp4.BOX_TYPE_ITEM_PROTECTION_BOX;
            ItemProtectionBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var protectionCount = ret.protectionCount = this.readUint16();
                ret.protectionInformations = [];
                for(var i = 0; i < protectionCount; ++i) {
                    ret.protectionInformations.push(this.readBox());
                }
                return ret;
            };
            return ItemProtectionBoxParser;
        })(FullBoxParser);
        Parser.ItemProtectionBoxParser = ItemProtectionBoxParser;        
        var ItemInfoEntryParser = (function (_super) {
            __extends(ItemInfoEntryParser, _super);
            function ItemInfoEntryParser() {
                _super.apply(this, arguments);

            }
            ItemInfoEntryParser.TYPE = Mp4.BOX_TYPE_ITEM_INFO_ENTRY;
            ItemInfoEntryParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.itemID = this.readUint16();
                ret.itemProtectionIndex = this.readUint16();
                ret.itemName = this.readUTF8StringNullTerminated();
                ret.contentType = this.readUTF8StringNullTerminated();
                ret.contentEncoding = this.readString();
                return ret;
            };
            return ItemInfoEntryParser;
        })(FullBoxParser);
        Parser.ItemInfoEntryParser = ItemInfoEntryParser;        
        var ItemInfoBoxParser = (function (_super) {
            __extends(ItemInfoBoxParser, _super);
            function ItemInfoBoxParser() {
                _super.apply(this, arguments);

            }
            ItemInfoBoxParser.TYPE = Mp4.BOX_TYPE_ITEM_INFO_BOX;
            ItemInfoBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                var entryCount = ret.entryCount = this.readUint16();
                ret.itemInfos = [];
                for(var i = 0; i < entryCount; ++i) {
                    ret.itemInfos.push(this.readBox());
                }
                return ret;
            };
            return ItemInfoBoxParser;
        })(FullBoxParser);
        Parser.ItemInfoBoxParser = ItemInfoBoxParser;        
        var ProtectionSchemeInfoBoxParser = (function (_super) {
            __extends(ProtectionSchemeInfoBoxParser, _super);
            function ProtectionSchemeInfoBoxParser() {
                _super.apply(this, arguments);

            }
            ProtectionSchemeInfoBoxParser.TYPE = Mp4.BOX_TYPE_PROTECTION_SCHEME_INFO_BOX;
            ProtectionSchemeInfoBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.originalFormat = this.readBox();
                while(!this.eof()) {
                    var box = this.readBox();
                    switch(box.type) {
                        case Mp4.BOX_TYPE_IPMP_INFO_BOX:
                            ret.IPMPDescriptors = box;
                            break;
                    }
                }
                return ret;
            };
            return ProtectionSchemeInfoBoxParser;
        })(BoxParser);
        Parser.ProtectionSchemeInfoBoxParser = ProtectionSchemeInfoBoxParser;        
        var OriginalFormatBoxParser = (function (_super) {
            __extends(OriginalFormatBoxParser, _super);
            function OriginalFormatBoxParser() {
                _super.apply(this, arguments);

            }
            OriginalFormatBoxParser.TYPE = Mp4.BOX_TYPE_ORIGINAL_FORMAT_BOX;
            OriginalFormatBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.dataFormat = this.readString(4);
                return ret;
            };
            return OriginalFormatBoxParser;
        })(BoxParser);
        Parser.OriginalFormatBoxParser = OriginalFormatBoxParser;        
        var IPMPInfoBoxParser = (function (_super) {
            __extends(IPMPInfoBoxParser, _super);
            function IPMPInfoBoxParser() {
                _super.apply(this, arguments);

            }
            IPMPInfoBoxParser.TYPE = Mp4.BOX_TYPE_IPMP_INFO_BOX;
            IPMPInfoBoxParser.prototype.parse = function () {
                var ret = _super.prototype.parse.call(this);
                ret.ipmpDescrs = [];
                while(!this.eof()) {
                    ret.ipmpDescrs.push(this.readDescriptor());
                }
                return ret;
            };
            return IPMPInfoBoxParser;
        })(FullBoxParser);
        Parser.IPMPInfoBoxParser = IPMPInfoBoxParser;        
        Parser.createBoxParser = function (bytes, type) {
            var _Parser;
            Object.keys(Mp4.Parser).some(function (key) {
                if(Mp4.Parser[key].TYPE === type) {
                    _Parser = Mp4.Parser[key];
                    return true;
                }
            });
            return new (_Parser || BoxParser)(bytes);
        };
    })(Mp4.Parser || (Mp4.Parser = {}));
    var Parser = Mp4.Parser;
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=parser.box.js.map
