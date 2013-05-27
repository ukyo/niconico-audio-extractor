var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Mp4;
(function (Mp4) {
    (function (Composer) {
        var BoxComposer = (function (_super) {
            __extends(BoxComposer, _super);
            function BoxComposer() {
                        _super.call(this);
                this.skipBytes(4);
                this.writeString(this['constructor'].TYPE);
            }
            BoxComposer.prototype.compose = function () {
                this.view.setUint32(0, this.byteOffset);
                return _super.prototype.compose.call(this);
            };
            BoxComposer.prototype.writeBox = function (box) {
                var bytes;
                if(box instanceof Uint8Array) {
                    bytes = box;
                } else if(box.bytes) {
                    bytes = box.bytes;
                } else {
                    bytes = createBoxComposer(box).compose();
                }
                this.writeBytes(bytes);
            };
            return BoxComposer;
        })(Composer.DescriptorComposerMixin);
        Composer.BoxComposer = BoxComposer;        
        var FullBoxComposer = (function (_super) {
            __extends(FullBoxComposer, _super);
            function FullBoxComposer(box) {
                        _super.call(this);
                this.box = box;
                this.writeUint8(box.version || 0);
                this.writeUint24(box.flags || 0);
            }
            return FullBoxComposer;
        })(BoxComposer);
        Composer.FullBoxComposer = FullBoxComposer;        
        var BoxListComposer = (function (_super) {
            __extends(BoxListComposer, _super);
            function BoxListComposer(boxes) {
                var _this = this;
                        _super.call(this);
                boxes.forEach(function (box) {
                    return _this.writeBox(box);
                });
            }
            return BoxListComposer;
        })(BoxComposer);
        Composer.BoxListComposer = BoxListComposer;        
        var FileTypeBoxComposer = (function (_super) {
            __extends(FileTypeBoxComposer, _super);
            function FileTypeBoxComposer(box) {
                var _this = this;
                        _super.call(this);
                this.writeString(box.majorBrand);
                this.writeUint32(box.minorVersion);
                box.compatibleBrands.forEach(function (brand) {
                    return _this.writeString(brand);
                });
            }
            FileTypeBoxComposer.TYPE = Mp4.BOX_TYPE_FILE_TYPE_BOX;
            return FileTypeBoxComposer;
        })(BoxComposer);
        Composer.FileTypeBoxComposer = FileTypeBoxComposer;        
        var MovieBoxComposer = (function (_super) {
            __extends(MovieBoxComposer, _super);
            function MovieBoxComposer() {
                _super.apply(this, arguments);

            }
            MovieBoxComposer.TYPE = Mp4.BOX_TYPE_MOVIE_BOX;
            return MovieBoxComposer;
        })(BoxListComposer);
        Composer.MovieBoxComposer = MovieBoxComposer;        
        var MediaDataBoxComposer = (function (_super) {
            __extends(MediaDataBoxComposer, _super);
            function MediaDataBoxComposer(box) {
                        _super.call(this);
                this.writeBytes(box.data);
            }
            MediaDataBoxComposer.TYPE = Mp4.BOX_TYPE_MEDIA_DATA_BOX;
            return MediaDataBoxComposer;
        })(BoxComposer);
        Composer.MediaDataBoxComposer = MediaDataBoxComposer;        
        var MovieHeaderBoxComposer = (function (_super) {
            __extends(MovieHeaderBoxComposer, _super);
            function MovieHeaderBoxComposer(box) {
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
            MovieHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_MOVIE_HEADER_BOX;
            return MovieHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.MovieHeaderBoxComposer = MovieHeaderBoxComposer;        
        var TrackBoxComposer = (function (_super) {
            __extends(TrackBoxComposer, _super);
            function TrackBoxComposer() {
                _super.apply(this, arguments);

            }
            TrackBoxComposer.TYPE = Mp4.BOX_TYPE_TRACK_BOX;
            return TrackBoxComposer;
        })(BoxListComposer);
        Composer.TrackBoxComposer = TrackBoxComposer;        
        var TrackHeaderBoxComposer = (function (_super) {
            __extends(TrackHeaderBoxComposer, _super);
            function TrackHeaderBoxComposer(box) {
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
            TrackHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_TRACK_HEADER_BOX;
            return TrackHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.TrackHeaderBoxComposer = TrackHeaderBoxComposer;        
        var TrackReferenceBoxComposer = (function (_super) {
            __extends(TrackReferenceBoxComposer, _super);
            function TrackReferenceBoxComposer() {
                _super.apply(this, arguments);

            }
            TrackReferenceBoxComposer.TYPE = Mp4.BOX_TYPE_TRACK_REFERENCE_BOX;
            return TrackReferenceBoxComposer;
        })(BoxListComposer);
        Composer.TrackReferenceBoxComposer = TrackReferenceBoxComposer;        
        var TrackReferenceTypeBoxComposer = (function (_super) {
            __extends(TrackReferenceTypeBoxComposer, _super);
            function TrackReferenceTypeBoxComposer(box) {
                var _this = this;
                        _super.call(this);
                box.trackIDs.forEach(function (id) {
                    return _this.writeUint32(id);
                });
            }
            return TrackReferenceTypeBoxComposer;
        })(BoxComposer);
        Composer.TrackReferenceTypeBoxComposer = TrackReferenceTypeBoxComposer;        
        var HintTrackReferenceTypeBoxComposer = (function (_super) {
            __extends(HintTrackReferenceTypeBoxComposer, _super);
            function HintTrackReferenceTypeBoxComposer() {
                _super.apply(this, arguments);

            }
            HintTrackReferenceTypeBoxComposer.TYPE = Mp4.BOX_TYPE_HINT_TRACK_REFERENCE_TYPE_BOX;
            return HintTrackReferenceTypeBoxComposer;
        })(TrackReferenceTypeBoxComposer);
        Composer.HintTrackReferenceTypeBoxComposer = HintTrackReferenceTypeBoxComposer;        
        var DescribeTrackReferenceTypeBoxComposer = (function (_super) {
            __extends(DescribeTrackReferenceTypeBoxComposer, _super);
            function DescribeTrackReferenceTypeBoxComposer() {
                _super.apply(this, arguments);

            }
            DescribeTrackReferenceTypeBoxComposer.TYPE = Mp4.BOX_TYPE_DISCRIBE_TRACK_REFERENCE_TYPE_BOX;
            return DescribeTrackReferenceTypeBoxComposer;
        })(TrackReferenceTypeBoxComposer);
        Composer.DescribeTrackReferenceTypeBoxComposer = DescribeTrackReferenceTypeBoxComposer;        
        var MediaBoxComposer = (function (_super) {
            __extends(MediaBoxComposer, _super);
            function MediaBoxComposer() {
                _super.apply(this, arguments);

            }
            MediaBoxComposer.TYPE = Mp4.BOX_TYPE_MEDIA_BOX;
            return MediaBoxComposer;
        })(BoxListComposer);
        Composer.MediaBoxComposer = MediaBoxComposer;        
        var MediaHeaderBoxComposer = (function (_super) {
            __extends(MediaHeaderBoxComposer, _super);
            function MediaHeaderBoxComposer(box) {
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
            MediaHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_MEDIA_HEADER_BOX;
            return MediaHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.MediaHeaderBoxComposer = MediaHeaderBoxComposer;        
        var HandlerBoxComposer = (function (_super) {
            __extends(HandlerBoxComposer, _super);
            function HandlerBoxComposer(box) {
                        _super.call(this, box);
                this.skipBytes(4);
                this.writeString(box.handlerType);
                this.skipBytes(4 * 3);
                this.writeUTF8StringNullTerminated(box.name);
            }
            HandlerBoxComposer.TYPE = Mp4.BOX_TYPE_HANDLER_BOX;
            return HandlerBoxComposer;
        })(FullBoxComposer);
        Composer.HandlerBoxComposer = HandlerBoxComposer;        
        var MediaInformationBoxComposer = (function (_super) {
            __extends(MediaInformationBoxComposer, _super);
            function MediaInformationBoxComposer() {
                _super.apply(this, arguments);

            }
            MediaInformationBoxComposer.TYPE = Mp4.BOX_TYPE_MEDIA_INFORMATION_BOX;
            return MediaInformationBoxComposer;
        })(BoxListComposer);
        Composer.MediaInformationBoxComposer = MediaInformationBoxComposer;        
        var VideoMediaHeaderBoxComposer = (function (_super) {
            __extends(VideoMediaHeaderBoxComposer, _super);
            function VideoMediaHeaderBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint16(box.graphicsmode);
                box.opcolor.forEach(function (x) {
                    return _this.writeUint16(x);
                });
            }
            VideoMediaHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_VIDEO_MEDIA_HEADER_BOX;
            return VideoMediaHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.VideoMediaHeaderBoxComposer = VideoMediaHeaderBoxComposer;        
        var SoundMediaHeaderBoxComposer = (function (_super) {
            __extends(SoundMediaHeaderBoxComposer, _super);
            function SoundMediaHeaderBoxComposer(box) {
                        _super.call(this, box);
                this.writeInt16(box.balance);
                this.skipBytes(2);
            }
            SoundMediaHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_SOUND_MEDIA_HEADER_BOX;
            return SoundMediaHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.SoundMediaHeaderBoxComposer = SoundMediaHeaderBoxComposer;        
        var HintMediaHeaderBoxComposer = (function (_super) {
            __extends(HintMediaHeaderBoxComposer, _super);
            function HintMediaHeaderBoxComposer(box) {
                        _super.call(this, box);
                this.writeUint16(box.maxPDUsize);
                this.writeUint16(box.avgPDUsize);
                this.writeUint32(box.maxbitrate);
                this.writeUint32(box.avgbitrate);
                this.skipBytes(4);
            }
            HintMediaHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_HINT_MEDIA_HEADER_BOX;
            return HintMediaHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.HintMediaHeaderBoxComposer = HintMediaHeaderBoxComposer;        
        var NullMediaHeaderBoxComposer = (function (_super) {
            __extends(NullMediaHeaderBoxComposer, _super);
            function NullMediaHeaderBoxComposer() {
                _super.apply(this, arguments);

            }
            NullMediaHeaderBoxComposer.TYPE = Mp4.BOX_TYPE_NULL_MEDIA_HEADER_BOX;
            return NullMediaHeaderBoxComposer;
        })(FullBoxComposer);
        Composer.NullMediaHeaderBoxComposer = NullMediaHeaderBoxComposer;        
        var DataInformationBoxComposer = (function (_super) {
            __extends(DataInformationBoxComposer, _super);
            function DataInformationBoxComposer() {
                _super.apply(this, arguments);

            }
            DataInformationBoxComposer.TYPE = Mp4.BOX_TYPE_DATA_INFORMATION_BOX;
            return DataInformationBoxComposer;
        })(BoxListComposer);
        Composer.DataInformationBoxComposer = DataInformationBoxComposer;        
        var DataEntryUrlBoxComposer = (function (_super) {
            __extends(DataEntryUrlBoxComposer, _super);
            function DataEntryUrlBoxComposer(box) {
                        _super.call(this, box);
                this.writeUTF8StringNullTerminated(box.location);
            }
            DataEntryUrlBoxComposer.TYPE = Mp4.BOX_TYPE_DATA_ENTRY_URL_BOX;
            return DataEntryUrlBoxComposer;
        })(FullBoxComposer);
        Composer.DataEntryUrlBoxComposer = DataEntryUrlBoxComposer;        
        var DataEntryUrnBoxComposer = (function (_super) {
            __extends(DataEntryUrnBoxComposer, _super);
            function DataEntryUrnBoxComposer(box) {
                        _super.call(this, box);
                this.writeUTF8StringNullTerminated(box.name);
                this.writeUTF8StringNullTerminated(box.location);
            }
            DataEntryUrnBoxComposer.TYPE = Mp4.BOX_TYPE_DATA_ENTRY_URN_BOX;
            return DataEntryUrnBoxComposer;
        })(FullBoxComposer);
        Composer.DataEntryUrnBoxComposer = DataEntryUrnBoxComposer;        
        var DataReferenceBoxComposer = (function (_super) {
            __extends(DataReferenceBoxComposer, _super);
            function DataReferenceBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    return _this.writeBox(entry);
                });
            }
            DataReferenceBoxComposer.TYPE = Mp4.BOX_TYPE_DATA_REFERENCE_BOX;
            return DataReferenceBoxComposer;
        })(FullBoxComposer);
        Composer.DataReferenceBoxComposer = DataReferenceBoxComposer;        
        var SampleTableBoxComposer = (function (_super) {
            __extends(SampleTableBoxComposer, _super);
            function SampleTableBoxComposer() {
                _super.apply(this, arguments);

            }
            SampleTableBoxComposer.TYPE = Mp4.BOX_TYPE_SAMPLE_TABLE_BOX;
            return SampleTableBoxComposer;
        })(BoxListComposer);
        Composer.SampleTableBoxComposer = SampleTableBoxComposer;        
        var TimeToSampleBoxComposer = (function (_super) {
            __extends(TimeToSampleBoxComposer, _super);
            function TimeToSampleBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    _this.writeUint32(entry.sampleCount);
                    _this.writeUint32(entry.sampleDelta);
                });
            }
            TimeToSampleBoxComposer.TYPE = Mp4.BOX_TYPE_TIME_TO_SAMPLE_BOX;
            return TimeToSampleBoxComposer;
        })(FullBoxComposer);
        Composer.TimeToSampleBoxComposer = TimeToSampleBoxComposer;        
        var CompositionOffsetBoxComposer = (function (_super) {
            __extends(CompositionOffsetBoxComposer, _super);
            function CompositionOffsetBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    _this.writeUint32(entry.sampleCount);
                    _this.writeUint32(entry.sampleOffset);
                });
            }
            CompositionOffsetBoxComposer.TYPE = Mp4.BOX_TYPE_COMPOSITION_OFFSET_BOX;
            return CompositionOffsetBoxComposer;
        })(FullBoxComposer);
        Composer.CompositionOffsetBoxComposer = CompositionOffsetBoxComposer;        
        var SampleEntryComposer = (function (_super) {
            __extends(SampleEntryComposer, _super);
            function SampleEntryComposer(box) {
                        _super.call(this);
                this.skipBytes(6);
                this.writeUint16(box.dataReferenceIndex);
            }
            return SampleEntryComposer;
        })(BoxComposer);
        Composer.SampleEntryComposer = SampleEntryComposer;        
        var HintSampleEntryComposer = (function (_super) {
            __extends(HintSampleEntryComposer, _super);
            function HintSampleEntryComposer(box) {
                        _super.call(this, box);
                this.writeBytes(box.data);
            }
            return HintSampleEntryComposer;
        })(SampleEntryComposer);
        Composer.HintSampleEntryComposer = HintSampleEntryComposer;        
        var VisualSampleEntryComposer = (function (_super) {
            __extends(VisualSampleEntryComposer, _super);
            function VisualSampleEntryComposer(box) {
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
            return VisualSampleEntryComposer;
        })(SampleEntryComposer);
        Composer.VisualSampleEntryComposer = VisualSampleEntryComposer;        
        var MP4VisualSampleEntryComposer = (function (_super) {
            __extends(MP4VisualSampleEntryComposer, _super);
            function MP4VisualSampleEntryComposer(box) {
                        _super.call(this, box);
                box.esBox.type = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
                this.writeBox(box.esBox);
            }
            MP4VisualSampleEntryComposer.TYPE = Mp4.BOX_TYPE_MP4_VISUAL_SAMPLE_ENTRY;
            return MP4VisualSampleEntryComposer;
        })(VisualSampleEntryComposer);
        Composer.MP4VisualSampleEntryComposer = MP4VisualSampleEntryComposer;        
        var ESDBoxComposer = (function (_super) {
            __extends(ESDBoxComposer, _super);
            function ESDBoxComposer(box) {
                        _super.call(this, box);
                box.esDescr.tag = Mp4.DESCR_TAG_ES_DESCRIPTOR;
                this.writeDescriptor(box.esDescr);
            }
            ESDBoxComposer.TYPE = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
            return ESDBoxComposer;
        })(FullBoxComposer);
        Composer.ESDBoxComposer = ESDBoxComposer;        
        var AudioSampleEntryComposer = (function (_super) {
            __extends(AudioSampleEntryComposer, _super);
            function AudioSampleEntryComposer(box) {
                        _super.call(this, box);
                this.skipBytes(4 * 2);
                this.writeUint16(box.channelCount);
                this.writeUint16(box.sampleSize);
                this.skipBytes(2);
                this.skipBytes(2);
                this.writeUint32(box.sampleRate * 0x10000);
            }
            return AudioSampleEntryComposer;
        })(SampleEntryComposer);
        Composer.AudioSampleEntryComposer = AudioSampleEntryComposer;        
        var MP4AudioSampleEntryComposer = (function (_super) {
            __extends(MP4AudioSampleEntryComposer, _super);
            function MP4AudioSampleEntryComposer(box) {
                        _super.call(this, box);
                box.esBox.type = Mp4.BOX_TYPE_ES_DESCRIPTOR_BOX;
                this.writeBox(box.esBox);
            }
            MP4AudioSampleEntryComposer.TYPE = Mp4.BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY;
            return MP4AudioSampleEntryComposer;
        })(AudioSampleEntryComposer);
        Composer.MP4AudioSampleEntryComposer = MP4AudioSampleEntryComposer;        
        var SampleDescriptionBoxComposer = (function (_super) {
            __extends(SampleDescriptionBoxComposer, _super);
            function SampleDescriptionBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.boxes.forEach(function (b) {
                    return _this.writeBox(b);
                });
            }
            SampleDescriptionBoxComposer.TYPE = Mp4.BOX_TYPE_SAMPLE_DESCRIPTION_BOX;
            return SampleDescriptionBoxComposer;
        })(FullBoxComposer);
        Composer.SampleDescriptionBoxComposer = SampleDescriptionBoxComposer;        
        var SampleSizeBoxComposer = (function (_super) {
            __extends(SampleSizeBoxComposer, _super);
            function SampleSizeBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.sampleSize);
                this.writeUint32(box.sampleCount);
                if(box.sampleSize === 0) {
                    box.sampleSizes.forEach(function (size) {
                        return _this.writeUint32(size);
                    });
                }
            }
            SampleSizeBoxComposer.TYPE = Mp4.BOX_TYPE_SAMPLE_SIZE_BOX;
            return SampleSizeBoxComposer;
        })(FullBoxComposer);
        Composer.SampleSizeBoxComposer = SampleSizeBoxComposer;        
        var SampleToChunkBoxComposer = (function (_super) {
            __extends(SampleToChunkBoxComposer, _super);
            function SampleToChunkBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.entries.forEach(function (entry) {
                    _this.writeUint32(entry.firstChunk);
                    _this.writeUint32(entry.samplesPerChunk);
                    _this.writeUint32(entry.sampleDescriptionIndex);
                });
            }
            SampleToChunkBoxComposer.TYPE = Mp4.BOX_TYPE_SAMPLE_TO_CHUNK_BOX;
            return SampleToChunkBoxComposer;
        })(FullBoxComposer);
        Composer.SampleToChunkBoxComposer = SampleToChunkBoxComposer;        
        var ChunkOffsetBoxComposer = (function (_super) {
            __extends(ChunkOffsetBoxComposer, _super);
            function ChunkOffsetBoxComposer(box) {
                var _this = this;
                        _super.call(this, box);
                this.writeUint32(box.entryCount);
                box.chunkOffsets.forEach(function (offset, i) {
                    return _this.writeUint32(offset);
                });
            }
            ChunkOffsetBoxComposer.TYPE = Mp4.BOX_TYPE_CHUNK_OFFSET_BOX;
            return ChunkOffsetBoxComposer;
        })(FullBoxComposer);
        Composer.ChunkOffsetBoxComposer = ChunkOffsetBoxComposer;        
        var createBoxComposer = function (box) {
            var _Composer;
            Object.keys(Mp4.Composer).some(function (key) {
                if(Mp4.Composer[key].TYPE === box.type) {
                    _Composer = Mp4.Composer[key];
                    return true;
                }
            });
            return new (_Composer || BoxComposer)(box);
        };
    })(Mp4.Composer || (Mp4.Composer = {}));
    var Composer = Mp4.Composer;
})(Mp4 || (Mp4 = {}));
//@ sourceMappingURL=composer.box.js.map
