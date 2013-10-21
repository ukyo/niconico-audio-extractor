var Flv;
(function (Flv) {
    Flv.TAG_TYPE_AUDIO = 0x08;
    Flv.TAG_TYPE_VIDEO = 0x09;
    Flv.TAG_TYPE_META = 0x12;

    Flv.SOUND_FORMAT_LINEAR_PCM_PLATFORM_ENDIAN = 0;
    Flv.SOUND_FORMAT_ADPCM = 1;
    Flv.SOUND_FORMAT_MP3 = 2;
    Flv.SOUND_FORMAT_LINEAR_PCM_LITTLE_ENDIAN = 3;
    Flv.SOUND_FORMAT_NELLYMOSER_16KHZ_MONO = 4;
    Flv.SOUND_FORMAT_NELLYMOSER_8KHZ_MONO = 5;
    Flv.SOUND_FORMAT_NELLYMOSER = 6;
    Flv.SOUND_FORMAT_G711_ALAW_LOGARITHMIC_PCM = 7;
    Flv.SOUND_FORMAT_G711_MULAW_LOGARITHMIC_PCM = 8;
    Flv.SOUND_FORMAT_RESERVED = 9;
    Flv.SOUND_FORMAT_AAC = 10;
    Flv.SOUND_FORMAT_SPEEX = 11;
    Flv.SOUND_FORMAT_MP3_8KHZ = 14;
    Flv.SOUND_FORMAT_DEVICE_SPECIFIC_SOUND = 15;

    Flv.VIDEO_FRAME_TYPE_KEY_FRAME = 1;
    Flv.VIDEO_FRAME_TYPE_INTER_FRAME = 2;
    Flv.VIDEO_FRAME_TYPE_DISPOSABLE_INTER_FRAME = 3;
    Flv.VIDEO_FRAME_TYPE_GENERATED_KEY_FRAME = 4;
    Flv.VIDEO_FRAME_TYPE_VIDEO_INFO = 5;

    Flv.VIDEO_CODEC_ID_JPEG = 1;
    Flv.VIDEO_CODEC_ID_SORENSON_H263 = 2;
    Flv.VIDEO_CODEC_ID_SCREEN_VIDEO = 3;
    Flv.VIDEO_CODEC_ID_ON2_VP6 = 4;
    Flv.VIDEO_CODEC_ID_ON2_VP6_WITH_ALPHA_CHANNEL = 5;
    Flv.VIDEO_CODEC_ID_SCREEN_VIDEO_VERSION2 = 6;
    Flv.VIDEO_CODEC_ID_AVC = 7;

    Flv.EXTENSION_TABLE = [
        'wav',
        'wav',
        'mp3',
        'wav',
        '',
        '',
        '',
        'wav',
        '',
        'aac',
        'spx',
        'mp3',
        ''
    ];

    Flv.SAMPLE_RATE_TABLE = [
        5512,
        11025,
        22050,
        44100
    ];

    Flv.AAC_SAMPLE_RATE_TABLE = [
        96000,
        88200,
        64000,
        48000,
        44100,
        32000,
        24000,
        22050,
        16000,
        12000,
        11025,
        8000
    ];

    Flv.SAMPLE_SIZE_TABLE = [
        8,
        16
    ];

    Flv.CHANNELS_TABLE = [
        1,
        2
    ];

    Flv.parse = function (bytes) {
        var reader = new Mp4.BitReader(bytes);
        var header = {
            signature: reader.readString(3),
            version: reader.readUint8(),
            flags: reader.readUint8(),
            offset: reader.readUint32()
        };

        reader.skipBytes(4);

        var tags = [];

        while (!reader.eof()) {
            var tag = {};
            tag.type = reader.readUint8();
            tag.bodyLength = reader.readUint24();
            tag.timeStamp = reader.readUint24();
            tag.timeStampExtended = reader.readUint8();
            tag.streamID = reader.readUint24();
            tag.body = reader.readBytes(tag.bodyLength);
            tag.previousTagSize = reader.readUint32();
            tags.push(tag);
        }

        return {
            header: header,
            tags: tags
        };
    };

    Flv.concatBytes = function (bytess) {
        var n = bytess.map(function (x) {
            return x.length;
        }).reduce(function (a, b) {
            return a + b;
        });
        var ret = new Uint8Array(n);
        var offset = 0;

        bytess.forEach(function (bytes) {
            ret.set(bytes, offset);
            offset += bytes.length;
        });

        return ret;
    };

    var getAudioInfo = function (tree) {
        var info = {};

        tree.tags.some(function (tag) {
            if (tag.type === Flv.TAG_TYPE_AUDIO) {
                var reader = new Mp4.BitReader(tag.body);
                info.soundFormat = reader.readBits(4);
                info.sampleRate = Flv.SAMPLE_RATE_TABLE[reader.readBits(2)];
                info.sampleSize = Flv.SAMPLE_SIZE_TABLE[reader.readBits(1)];
                info.channels = Flv.CHANNELS_TABLE[reader.readBits(1)];
                return true;
            }
        });

        return info;
    };

    var getAacInfo = function (tree) {
        var info = {};

        tree.tags.some(function (tag) {
            if (tag.type === Flv.TAG_TYPE_AUDIO && tag.body[0] === 0) {
                var reader = new Mp4.BitReader(tag.body.subarray(1));
                info.type = reader.readBits(5) - 1;
                info.sampleRateIndex = reader.readBits(4);
                info.channels = reader.readBits(4);
                return true;
            }
        });

        return info;
    };

    var getAudioTags = function (tags) {
        return tags.filter(function (tag) {
            return tag.type === Flv.TAG_TYPE_AUDIO;
        });
    };

    var extractWave = function (bytes, tree) {
        var writer = new Mp4.BitWriter(true);
        var info = getAudioInfo(tree);
        var tags = getAudioTags(tree.tags);
        var bodyLength = tags.map(function (tag) {
            return tag.bodyLength;
        }).reduce(function (a, b) {
            return a + b;
        }) - tags.length;

        writer.writeString('RIFF');
        writer.writeUint32(bodyLength + 36);
        writer.writeString('WAVE');
        writer.writeString('fmt ');
        writer.writeUint32(info.sampleSize);
        writer.writeUint16(1);
        writer.writeUint16(info.channels);
        writer.writeUint32(info.sampleRate);
        writer.writeUint32(info.sampleRate * info.channels * info.sampleSize / 8);
        writer.writeUint16(info.channels * info.sampleSize / 8);
        writer.writeUint16(info.sampleSize);
        writer.writeString('data');
        writer.writeUint32(bodyLength);
        writer.writeBytes(Flv.concatBytes(tags.map(function (tag) {
            return tag.body.subarray(1);
        })));

        return {
            type: 'wav',
            data: writer.data
        };
    };

    var extractMp3 = function (bytes, tree) {
        return {
            type: 'mp3',
            data: Flv.concatBytes(getAudioTags(tree.tags).map(function (tag) {
                return tag.body.subarray(1);
            }))
        };
    };

    var extractAac = function (bytes, tree) {
        var header = new Uint8Array(7);
        var info = getAacInfo(tree);
        var bytess = [];

        header[0] = 0xFF;
        header[1] = 0xF9;
        header[2] = 0x40 | (info.sampleRateIndex << 2) | (info.channels >> 2);
        header[6] = 0xFC;

        getAudioTags(tree.tags).forEach(function (tag) {
            var sample = tag.body.subarray(2);

            header[3] = (info.channels << 6) | (sample.length - 2 + header.length);
            header[4] = sample.length >> 3;
            header[5] = (sample.length << 5) | (0x7FF >> 6);

            var tmp = new Uint8Array(7);
            tmp.set(header);
            bytess.push(tmp);
            bytess.push(sample);
        });

        return {
            type: 'aac',
            data: Flv.concatBytes(bytess)
        };
    };

    Flv.extractAudio = function (bytes) {
        var tree = Flv.parse(bytes);
        switch (getAudioInfo(tree).soundFormat) {
            case Flv.SOUND_FORMAT_AAC:
                return extractAac(bytes, tree);
            case Flv.SOUND_FORMAT_LINEAR_PCM_LITTLE_ENDIAN:
                return extractWave(bytes, tree);
            case Flv.SOUND_FORMAT_MP3:
                return extractMp3(bytes, tree);
            default:
                throw new TypeError('Flv.extractAudio: not supported format.');
        }
    };
})(Flv || (Flv = {}));
//# sourceMappingURL=flv.js.map
