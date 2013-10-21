var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Builder) {
        var BoxBuilder = (function (_super) {
            __extends(BoxBuilder, _super);
            function BoxBuilder() {
                _super.call(this);
                this.skipBytes(4);
                this.writeString(this['constructor'].TYPE);
            }
            BoxBuilder.prototype.build = function () {
                this.view.setUint32(0, this.byteOffset);
                return _super.prototype.build.call(this);
            };

            BoxBuilder.prototype.writeBox = function (box) {
                var bytes;
                if (box instanceof Uint8Array) {
                    bytes = box;
                } else if (box.bytes) {
                    bytes = box.bytes;
                } else {
                    bytes = createBoxBuilder(box).build();
                }
                this.writeBytes(bytes);
            };
            return BoxBuilder;
        })(Builder.DescriptorBuilderMixin);
        Builder.BoxBuilder = BoxBuilder;

        var FullBoxBuilder = (function (_super) {
            __extends(FullBoxBuilder, _super);
            function FullBoxBuilder(box) {
                _super.call(this);
                this.box = box;
                this.writeUint8(box.version || 0);
                this.writeUint24(box.flags || 0);
            }
            return FullBoxBuilder;
        })(BoxBuilder);
        Builder.FullBoxBuilder = FullBoxBuilder;

        var BoxListBuilder = (function (_super) {
            __extends(BoxListBuilder, _super);
            function BoxListBuilder(boxes) {
                var _this = this;
                _super.call(this);
                boxes.forEach(function (box) {
                    return _this.writeBox(box);
                });
            }
            return BoxListBuilder;
        })(BoxBuilder);
        Builder.BoxListBuilder = BoxListBuilder;

        var FileTypeBoxBuilder = (function (_super) {
            __extends(FileTypeBoxBuilder, _super);
            function FileTypeBoxBuilder(box) {
                var _this = this;
                _super.call(this);
                this.writeString(box.majorBrand);
                this.writeUint32(box.minorVersion);
                box.compatibleBrands.forEach(function (brand) {
                    return _this.writeString(brand);
                });
            }
            FileTypeBoxBuilder.TYPE = Mp4.BOX_TYPE_FILE_TYPE_BOX;
            return FileTypeBoxBuilder;
        })(BoxBuilder);
        Builder.FileTypeBoxBuilder = FileTypeBoxBuilder;

        var MovieBoxBuilder = (function (_super) {
            __extends(MovieBoxBuilder, _super);
            function MovieBoxBuilder() {
                _super.apply(this, arguments);
            }
            MovieBoxBuilder.TYPE = Mp4.BOX_TYPE_MOVIE_BOX;
            return MovieBoxBuilder;
        })(BoxListBuilder);
        Builder.MovieBoxBuilder = MovieBoxBuilder;

        var MediaDataBoxBuilder = (function (_super) {
            __extends(MediaDataBoxBuilder, _super);
            function MediaDataBoxBuilder(box) {
                _super.call(this);
                this.writeBytes(box.data);
            }
            MediaDataBoxBuilder.TYPE = Mp4.BOX_TYPE_MEDIA_DATA_BOX;
            return MediaDataBoxBuilder;
        })(BoxBuilder);
        Builder.MediaDataBoxBuilder = MediaDataBoxBuilder;

        var MovieHeaderBoxBuilder = (function (_super) {
            __extends(MovieHeaderBoxBuilder, _super);
            function MovieHeaderBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.creationTime);
                this.writeUint32(box.modificationTime);
                this.writeUint32(box.timescale);
                this.writeUint32(box.duration);
                this.writeInt32(box.rate * 0x10000);
                this.writeInt16(box.volume * 0x100);
                this.skipBytes(2);
                this.skipBytes(8);
                box.matrix.forEach(function (x) {
                    return _this.writeInt32(x);
                });
                this.skipBytes(4 * 6);
                this.writeUint32(box.nextTrackID);
            }
            MovieHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_MOVIE_HEADER_BOX;
            return MovieHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.MovieHeaderBoxBuilder = MovieHeaderBoxBuilder;

        var TrackBoxBuilder = (function (_super) {
            __extends(TrackBoxBuilder, _super);
            function TrackBoxBuilder() {
                _super.apply(this, arguments);
            }
            TrackBoxBuilder.TYPE = Mp4.BOX_TYPE_TRACK_BOX;
            return TrackBoxBuilder;
        })(BoxListBuilder);
        Builder.TrackBoxBuilder = TrackBoxBuilder;

        var TrackHeaderBoxBuilder = (function (_super) {
            __extends(TrackHeaderBoxBuilder, _super);
            function TrackHeaderBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
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
                box.matrix.forEach(function (x) {
                    return _this.writeInt32(x);
                });
                this.writeUint32(box.width * 0x10000);
                this.writeUint32(box.height * 0x10000);
            }
            TrackHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_TRACK_HEADER_BOX;
            return TrackHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.TrackHeaderBoxBuilder = TrackHeaderBoxBuilder;

        var TrackReferenceBoxBuilder = (function (_super) {
            __extends(TrackReferenceBoxBuilder, _super);
            function TrackReferenceBoxBuilder() {
                _super.apply(this, arguments);
            }
            TrackReferenceBoxBuilder.TYPE = Mp4.BOX_TYPE_TRACK_REFERENCE_BOX;
            return TrackReferenceBoxBuilder;
        })(BoxListBuilder);
        Builder.TrackReferenceBoxBuilder = TrackReferenceBoxBuilder;

        var TrackReferenceTypeBoxBuilder = (function (_super) {
            __extends(TrackReferenceTypeBoxBuilder, _super);
            function TrackReferenceTypeBoxBuilder(box) {
                var _this = this;
                _super.call(this);
                box.trackIDs.forEach(function (id) {
                    return _this.writeUint32(id);
                });
            }
            return TrackReferenceTypeBoxBuilder;
        })(BoxBuilder);
        Builder.TrackReferenceTypeBoxBuilder = TrackReferenceTypeBoxBuilder;

        var HintTrackReferenceTypeBoxBuilder = (function (_super) {
            __extends(HintTrackReferenceTypeBoxBuilder, _super);
            function HintTrackReferenceTypeBoxBuilder() {
                _super.apply(this, arguments);
            }
            HintTrackReferenceTypeBoxBuilder.TYPE = Mp4.BOX_TYPE_HINT_TRACK_REFERENCE_TYPE_BOX;
            return HintTrackReferenceTypeBoxBuilder;
        })(TrackReferenceTypeBoxBuilder);
        Builder.HintTrackReferenceTypeBoxBuilder = HintTrackReferenceTypeBoxBuilder;

        var DescribeTrackReferenceTypeBoxBuilder = (function (_super) {
            __extends(DescribeTrackReferenceTypeBoxBuilder, _super);
            function DescribeTrackReferenceTypeBoxBuilder() {
                _super.apply(this, arguments);
            }
            DescribeTrackReferenceTypeBoxBuilder.TYPE = Mp4.BOX_TYPE_DISCRIBE_TRACK_REFERENCE_TYPE_BOX;
            return DescribeTrackReferenceTypeBoxBuilder;
        })(TrackReferenceTypeBoxBuilder);
        Builder.DescribeTrackReferenceTypeBoxBuilder = DescribeTrackReferenceTypeBoxBuilder;

        var MediaBoxBuilder = (function (_super) {
            __extends(MediaBoxBuilder, _super);
            function MediaBoxBuilder() {
                _super.apply(this, arguments);
            }
            MediaBoxBuilder.TYPE = Mp4.BOX_TYPE_MEDIA_BOX;
            return MediaBoxBuilder;
        })(BoxListBuilder);
        Builder.MediaBoxBuilder = MediaBoxBuilder;

        var MediaHeaderBoxBuilder = (function (_super) {
            __extends(MediaHeaderBoxBuilder, _super);
            function MediaHeaderBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.creationTime);
                this.writeUint32(box.modificationTime);
                this.writeUint32(box.timescale);
                this.writeUint32(box.duration);
                this.skipBits(1);
                [].forEach.call(box.language, function (c, i) {
                    return _this.writeBits(box.language.charCodeAt(i) - 0x60, 5);
                });
                this.skipBytes(2);
            }
            MediaHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_MEDIA_HEADER_BOX;
            return MediaHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.MediaHeaderBoxBuilder = MediaHeaderBoxBuilder;

        var HandlerBoxBuilder = (function (_super) {
            __extends(HandlerBoxBuilder, _super);
            function HandlerBoxBuilder(box) {
                _super.call(this, box);
                this.skipBytes(4);
                this.writeString(box.handlerType);
                this.skipBytes(4 * 3);
                this.writeUTF8StringNullTerminated(box.name);
            }
            HandlerBoxBuilder.TYPE = Mp4.BOX_TYPE_HANDLER_BOX;
            return HandlerBoxBuilder;
        })(FullBoxBuilder);
        Builder.HandlerBoxBuilder = HandlerBoxBuilder;

        var MediaInformationBoxBuilder = (function (_super) {
            __extends(MediaInformationBoxBuilder, _super);
            function MediaInformationBoxBuilder() {
                _super.apply(this, arguments);
            }
            MediaInformationBoxBuilder.TYPE = Mp4.BOX_TYPE_MEDIA_INFORMATION_BOX;
            return MediaInformationBoxBuilder;
        })(BoxListBuilder);
        Builder.MediaInformationBoxBuilder = MediaInformationBoxBuilder;

        var VideoMediaHeaderBoxBuilder = (function (_super) {
            __extends(VideoMediaHeaderBoxBuilder, _super);
            function VideoMediaHeaderBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint16(box.graphicsmode);
                box.opcolor.forEach(function (x) {
                    return _this.writeUint16(x);
                });
            }
            VideoMediaHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_VIDEO_MEDIA_HEADER_BOX;
            return VideoMediaHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.VideoMediaHeaderBoxBuilder = VideoMediaHeaderBoxBuilder;

        var SoundMediaHeaderBoxBuilder = (function (_super) {
            __extends(SoundMediaHeaderBoxBuilder, _super);
            function SoundMediaHeaderBoxBuilder(box) {
                _super.call(this, box);
                this.writeInt16(box.balance);
                this.skipBytes(2);
            }
            SoundMediaHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_SOUND_MEDIA_HEADER_BOX;
            return SoundMediaHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.SoundMediaHeaderBoxBuilder = SoundMediaHeaderBoxBuilder;

        var HintMediaHeaderBoxBuilder = (function (_super) {
            __extends(HintMediaHeaderBoxBuilder, _super);
            function HintMediaHeaderBoxBuilder(box) {
                _super.call(this, box);
                this.writeUint16(box.maxPDUsize);
                this.writeUint16(box.avgPDUsize);
                this.writeUint32(box.maxbitrate);
                this.writeUint32(box.avgbitrate);
                this.skipBytes(4);
            }
            HintMediaHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_HINT_MEDIA_HEADER_BOX;
            return HintMediaHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.HintMediaHeaderBoxBuilder = HintMediaHeaderBoxBuilder;

        var NullMediaHeaderBoxBuilder = (function (_super) {
            __extends(NullMediaHeaderBoxBuilder, _super);
            function NullMediaHeaderBoxBuilder() {
                _super.apply(this, arguments);
            }
            NullMediaHeaderBoxBuilder.TYPE = Mp4.BOX_TYPE_NULL_MEDIA_HEADER_BOX;
            return NullMediaHeaderBoxBuilder;
        })(FullBoxBuilder);
        Builder.NullMediaHeaderBoxBuilder = NullMediaHeaderBoxBuilder;

        var DataInformationBoxBuilder = (function (_super) {
            __extends(DataInformationBoxBuilder, _super);
            function DataInformationBoxBuilder() {
                _super.apply(this, arguments);
            }
            DataInformationBoxBuilder.TYPE = Mp4.BOX_TYPE_DATA_INFORMATION_BOX;
            return DataInformationBoxBuilder;
        })(BoxListBuilder);
        Builder.DataInformationBoxBuilder = DataInformationBoxBuilder;

        var DataEntryUrlBoxBuilder = (function (_super) {
            __extends(DataEntryUrlBoxBuilder, _super);
            function DataEntryUrlBoxBuilder(box) {
                _super.call(this, box);
                this.writeUTF8StringNullTerminated(box.location);
            }
            DataEntryUrlBoxBuilder.TYPE = Mp4.BOX_TYPE_DATA_ENTRY_URL_BOX;
            return DataEntryUrlBoxBuilder;
        })(FullBoxBuilder);
        Builder.DataEntryUrlBoxBuilder = DataEntryUrlBoxBuilder;

        var DataEntryUrnBoxBuilder = (function (_super) {
            __extends(DataEntryUrnBoxBuilder, _super);
            function DataEntryUrnBoxBuilder(box) {
                _super.call(this, box);
                this.writeUTF8StringNullTerminated(box.name);
                this.writeUTF8StringNullTerminated(box.location);
            }
            DataEntryUrnBoxBuilder.TYPE = Mp4.BOX_TYPE_DATA_ENTRY_URN_BOX;
            return DataEntryUrnBoxBuilder;
        })(FullBoxBuilder);
        Builder.DataEntryUrnBoxBuilder = DataEntryUrnBoxBuilder;

        var DataReferenceBoxBuilder = (function (_super) {
            __extends(DataReferenceBoxBuilder, _super);
            function DataReferenceBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    return _this.writeBox(entry);
                });
            }
            DataReferenceBoxBuilder.TYPE = Mp4.BOX_TYPE_DATA_REFERENCE_BOX;
            return DataReferenceBoxBuilder;
        })(FullBoxBuilder);
        Builder.DataReferenceBoxBuilder = DataReferenceBoxBuilder;

        var SampleTableBoxBuilder = (function (_super) {
            __extends(SampleTableBoxBuilder, _super);
            function SampleTableBoxBuilder() {
                _super.apply(this, arguments);
            }
            SampleTableBoxBuilder.TYPE = Mp4.BOX_TYPE_SAMPLE_TABLE_BOX;
            return SampleTableBoxBuilder;
        })(BoxListBuilder);
        Builder.SampleTableBoxBuilder = SampleTableBoxBuilder;

        var TimeToSampleBoxBuilder = (function (_super) {
            __extends(TimeToSampleBoxBuilder, _super);
            function TimeToSampleBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    _this.writeUint32(entry.sampleCount);
                    _this.writeUint32(entry.sampleDelta);
                });
            }
            TimeToSampleBoxBuilder.TYPE = Mp4.BOX_TYPE_TIME_TO_SAMPLE_BOX;
            return TimeToSampleBoxBuilder;
        })(FullBoxBuilder);
        Builder.TimeToSampleBoxBuilder = TimeToSampleBoxBuilder;

        var CompositionOffsetBoxBuilder = (function (_super) {
            __extends(CompositionOffsetBoxBuilder, _super);
            function CompositionOffsetBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    _this.writeUint32(entry.sampleCount);
                    _this.writeUint32(entry.sampleOffset);
                });
            }
            CompositionOffsetBoxBuilder.TYPE = Mp4.BOX_TYPE_COMPOSITION_OFFSET_BOX;
            return CompositionOffsetBoxBuilder;
        })(FullBoxBuilder);
        Builder.CompositionOffsetBoxBuilder = CompositionOffsetBoxBuilder;

        var SampleEntryBuilder = (function (_super) {
            __extends(SampleEntryBuilder, _super);
            function SampleEntryBuilder(box) {
                _super.call(this);
                this.skipBytes(6);
                this.writeUint16(box.dataReferenceIndex);
            }
            return SampleEntryBuilder;
        })(BoxBuilder);
        Builder.SampleEntryBuilder = SampleEntryBuilder;

        var HintSampleEntryBuilder = (function (_super) {
            __extends(HintSampleEntryBuilder, _super);
            function HintSampleEntryBuilder(box) {
                _super.call(this, box);
                this.writeBytes(box.data);
            }
            return HintSampleEntryBuilder;
        })(SampleEntryBuilder);
        Builder.HintSampleEntryBuilder = HintSampleEntryBuilder;

        var VisualSampleEntryBuilder = (function (_super) {
            __extends(VisualSampleEntryBuilder, _super);
            function VisualSampleEntryBuilder(box) {
                _super.call(this, box);
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
            return VisualSampleEntryBuilder;
        })(SampleEntryBuilder);
        Builder.VisualSampleEntryBuilder = VisualSampleEntryBuilder;

        var MP4VisualSampleEntryBuilder = (function (_super) {
            __extends(MP4VisualSampleEntryBuilder, _super);
            function MP4VisualSampleEntryBuilder(box) {
                _super.call(this, box);
                box.esBox.type = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
                this.writeBox(box.esBox);
            }
            MP4VisualSampleEntryBuilder.TYPE = Mp4.BOX_TYPE_MP4_VISUAL_SAMPLE_ENTRY;
            return MP4VisualSampleEntryBuilder;
        })(VisualSampleEntryBuilder);
        Builder.MP4VisualSampleEntryBuilder = MP4VisualSampleEntryBuilder;

        var ESDBoxBuilder = (function (_super) {
            __extends(ESDBoxBuilder, _super);
            function ESDBoxBuilder(box) {
                _super.call(this, box);
                box.esDescr.tag = Mp4.DESCR_TAG_ES_DESCRIPTOR;
                this.writeDescriptor(box.esDescr);
            }
            ESDBoxBuilder.TYPE = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
            return ESDBoxBuilder;
        })(FullBoxBuilder);
        Builder.ESDBoxBuilder = ESDBoxBuilder;

        var AudioSampleEntryBuilder = (function (_super) {
            __extends(AudioSampleEntryBuilder, _super);
            function AudioSampleEntryBuilder(box) {
                _super.call(this, box);
                this.skipBytes(4 * 2);
                this.writeUint16(box.channelCount);
                this.writeUint16(box.sampleSize);
                this.skipBytes(2);
                this.skipBytes(2);
                this.writeUint32(box.sampleRate * 0x10000);
            }
            return AudioSampleEntryBuilder;
        })(SampleEntryBuilder);
        Builder.AudioSampleEntryBuilder = AudioSampleEntryBuilder;

        var MP4AudioSampleEntryBuilder = (function (_super) {
            __extends(MP4AudioSampleEntryBuilder, _super);
            function MP4AudioSampleEntryBuilder(box) {
                _super.call(this, box);
                box.esBox.type = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
                this.writeBox(box.esBox);
            }
            MP4AudioSampleEntryBuilder.TYPE = Mp4.BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY;
            return MP4AudioSampleEntryBuilder;
        })(AudioSampleEntryBuilder);
        Builder.MP4AudioSampleEntryBuilder = MP4AudioSampleEntryBuilder;

        var SampleDescriptionBoxBuilder = (function (_super) {
            __extends(SampleDescriptionBoxBuilder, _super);
            function SampleDescriptionBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.boxes.forEach(function (b) {
                    return _this.writeBox(b);
                });
            }
            SampleDescriptionBoxBuilder.TYPE = Mp4.BOX_TYPE_SAMPLE_DESCRIPTION_BOX;
            return SampleDescriptionBoxBuilder;
        })(FullBoxBuilder);
        Builder.SampleDescriptionBoxBuilder = SampleDescriptionBoxBuilder;

        var SampleSizeBoxBuilder = (function (_super) {
            __extends(SampleSizeBoxBuilder, _super);
            function SampleSizeBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.sampleSize);
                this.writeUint32(box.sampleCount);
                if (box.sampleSize === 0) {
                    box.sampleSizes.forEach(function (size) {
                        return _this.writeUint32(size);
                    });
                }
            }
            SampleSizeBoxBuilder.TYPE = Mp4.BOX_TYPE_SAMPLE_SIZE_BOX;
            return SampleSizeBoxBuilder;
        })(FullBoxBuilder);
        Builder.SampleSizeBoxBuilder = SampleSizeBoxBuilder;

        var SampleToChunkBoxBuilder = (function (_super) {
            __extends(SampleToChunkBoxBuilder, _super);
            function SampleToChunkBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    _this.writeUint32(entry.firstChunk);
                    _this.writeUint32(entry.samplesPerChunk);
                    _this.writeUint32(entry.sampleDescriptionIndex);
                });
            }
            SampleToChunkBoxBuilder.TYPE = Mp4.BOX_TYPE_SAMPLE_TO_CHUNK_BOX;
            return SampleToChunkBoxBuilder;
        })(FullBoxBuilder);
        Builder.SampleToChunkBoxBuilder = SampleToChunkBoxBuilder;

        var ChunkOffsetBoxBuilder = (function (_super) {
            __extends(ChunkOffsetBoxBuilder, _super);
            function ChunkOffsetBoxBuilder(box) {
                var _this = this;
                _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.chunkOffsets.forEach(function (offset, i) {
                    return _this.writeUint32(offset);
                });
            }
            ChunkOffsetBoxBuilder.TYPE = Mp4.BOX_TYPE_CHUNK_OFFSET_BOX;
            return ChunkOffsetBoxBuilder;
        })(FullBoxBuilder);
        Builder.ChunkOffsetBoxBuilder = ChunkOffsetBoxBuilder;

        var createBoxBuilder = function (box) {
            var _Builder;
            Object.keys(Mp4.Builder).some(function (key) {
                if (Mp4.Builder[key].TYPE === box.type) {
                    _Builder = Mp4.Builder[key];
                    return true;
                }
            });
            return new (_Builder || BoxBuilder)(box);
        };
    })(Mp4.Builder || (Mp4.Builder = {}));
    var Builder = Mp4.Builder;
})(Mp4 || (Mp4 = {}));
//# sourceMappingURL=composer.box.js.map
