var Zlib;
(function (Zlib) {
})(Zlib || (Zlib = {}));

var Swf;
(function (Swf) {
    Swf.TAG_CODE_END = 0;
    Swf.TAG_CODE_SOUND_STREAM_BLOCK = 19;

    Swf.parse = function (bytes) {
        var signature = new Mp4.DataView2(bytes).getString(0, 3);
        var body;
        var tags = [];

        if (signature === 'CWS') {
            var inflate = new Zlib.Inflate(bytes.subarray(8));
            body = inflate.decompress();
        } else {
            body = bytes.subarray(8);
        }

        var reader = new Mp4.BitReader(body, true);

        var nbits = reader.readBits(5);
        var paddingBits = 8 - (nbits * 4 + 5) % 8;
        paddingBits = paddingBits === 8 ? 0 : paddingBits;
        reader.skipBits(nbits * 4 + paddingBits);
        reader.skipBytes(4);

        while (!reader.eof()) {
            tags.push(getTag(reader));
        }

        return tags;
    };

    var getTag = function (reader) {
        var codeAndLength = reader.readUint16();
        var code = codeAndLength >>> 6;
        var length = (codeAndLength & 0x3F) === 0x3F ? reader.readUint32() : codeAndLength & 0x3F;

        return {
            code: code,
            length: length,
            body: reader.readBytes(length)
        };
    };

    Swf.extractMp3 = function (bytes) {
        var tags = Swf.parse(bytes);
        var samples = tags.filter(function (tag) {
            return tag.code === Swf.TAG_CODE_SOUND_STREAM_BLOCK;
        }).map(function (tag) {
            return tag.body.subarray(4);
        });
        return Flv.concatBytes(samples);
    };
})(Swf || (Swf = {}));
//# sourceMappingURL=swf.js.map
