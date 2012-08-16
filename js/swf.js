var Swf = (function(window){

var BlobBuilder = window.BlobBuider || window.MozBlobBuilder || window.WebKitBlobBuilder;
Blob.prototype.slice = Blob.prototype.webkitSlice || Blob.prototype.mozSlice || Blob.prototype.slice;

var tagdic = {
    //end
    0: function(){
        return {label: 'end'};
    },
    
    //setBackgroundColor
    9: function(offset, length){
        return {
            label: 'setBackgroundColor',
            r: this.ui8(offset++),
            g: this.ui8(offset++),
            b: this.ui8(offset)
        };
    },
    
    //FrameLabel
    43: function(offset, length){
        return {
            label: 'FrameLabel',
            name: bytesToString(this.bytes, offset, length)
        };
    },
    
    //Protect
    24: function(offset, length){
        return {label: 'Protect'};
    },
    
    //ExportAssets
    56: function(offset, length){
        var count = this.ui16(offset),
            tags = [], tag, i;
        offset += 2;
        for(i = 0; i < count; ++i){
            tag = {};
            tag.id = this.ui16(offset);
            tag.name = bytesToString(this.bytes, offset, 1);
            tags.push(tag);
            offset += 3;
        }
        return {
            label: 'ExportAssets',
            tags: tags
        };
    },
    
    //ImportAssets
    57: function(offset, length){
        var count = this.ui16(offset),
            tags = [], tag, i;
        offset += 2;
        for(i = 0; i < count; ++i){
            tag = {};
            tag.id = this.ui16(offset);
            tag.name = bytesToString(this.bytes, offset, 1);
            tags.push(tag);
            offset += 3;
        }
        return {
            label: 'ImportAssets',
            tags: tags
        };
    },
    
    //FileAttributes
    69: function(offset, length){
        var b = this.ui8(offset);
        return {
            useDirectBlit: !!(b & 0x7F),
            useGPU: !!(b & 0x3F),
            hasMetadata: !!(b & 0x1F),
            actionScript3: !!(b & 0xF),
            useNetwork: !!(b & 1)
        };
    },
    
    //SoundStreamHead
    18: function(offset, length){
        var b = this.ui8(offset), ret = {};
        
        ret.playbackSoundRate = b >> 2;
        ret.playbackSoundSize = 1;
        ret.playbackSoundType = b & 1;
        b = this.ui8(++offset);
        ret.streamSoundCompression = b >> 4;
        ret.steamSoundRate = (b & 0xC) >> 2;
        ret.streamSoundSize = 1;
        ret.streamSoundType = b & 1;
        ret.streamSoundSampleCount = this.ui16(offset);
        offset += 2;
        if(ret.streamSoundCompression === 2) {
            ret.latencySeek = this.ui16(offset);
        } else {
            ret.latencySeek = null;
        }
        return ret;
    },
    
    //SoundStreamBlock
    19: function(offset, length){
        //mp3 sound data only
        var ret = {}, mp3Frame, i, b, n;
        ret.seekSamples = this.ui16(offset);
        
        offset += 2;
        ret.mp3Frames = {
            offset: offset + 2,
            length: length - 4
        };
        /*
        for(i = 0, n = ret.seekSamples / 576; i < n; ++i){
            mp3Frame = {};
            b = this.ui8(++offset);
            mp3Frame.mpegVersion = (b & 0x18) >> 3;
            mp3Frame.layer = (b & 0x6) >> 1;
            mp3Frame.protectionBit = b & 1;
            b = this.ui8(++offset);
            mp3Frame.bitrate = b >> 4;
            mp3Frame.samplingRate = (b & 0x6) >> 2;
            mp3Frame.paddingBit = (b & 0x2) >> 1;
            b = this.ui8(++offset);
            mp3Frame.channelMode = b >> 6;
            mp3Frame.modeExtension = (b & 0x30) >> 4;
            mp3Frame.copyright = (b & 0x4) >> 3;
            mp3Frame.original = (b & 0x2) >> 1;
            mp3Frame.emphasis = b & 0x3;
            mp3Frame.sampleData = {
                offset: ++offset,
                length: (((mp3Frame.mpegVersion === 3 ? 144 : 72) * mp3Frame.bitrate) / mp3Frame.samplingRate) + mp3Frame.paddingBit - 4
            };
            ret.mp3Frames.push(mp3Frame);
            offset += mp3Frame.sampleData.length;
        }
        */
        return ret;
    }
};

var samplingRateTable = {
    0: {
        0: 11025,
        1: 22050,
        3: 44100
    },
    1: {
        0: 12000,
        1: 24000,
        3: 48000
    },
    2: {
        0: 8000,
        1: 16000,
        3: 32000
    }
};


/**
 * @constructor
 */
function Swf(bytes){
    this.bytes = bytes;
    this.ui8arr = new Uint8Array(bytes);
    this.version = this.ui8arr[3];
    this.length = this.ui32(4);
    if(this._isCommpressed()){
        var zlib = this.ui8arr.subarray(8),
            zlibHeader = zlib.subarray(0, 2),
            offset = 8;
        
        offset += (zlibHeader[1] & 0x20) ? 6 : 2;
        this.ui8arr = new Uint8Array(jz.zlib.decompress(this.ui8arr.subarray(8)));
    } else {
        this.ui8arr = new Uint8Array(new Uint8Array(bytes).subarray(8));
    }
    this.bytes = this.ui8arr.buffer;
    var bb = new BlobBuilder();
    bb.append(this.bytes);
    this.blob = bb.getBlob();
}


/*
 * instance methods
 */
Swf.prototype = {
    readHeader: function(){
        var offset = 0,
            frameSize = {}, frameRate, frameCount,
            i, j, tmp = [];
        
        frameSize.nbits = this.ui8(offset) >> 3;
        frameSize.length = 5 + frameSize.nbits * 4;
        frameSize.byteLength = Math.ceil(frameSize.length / 8);
        for(i = offset; i < offset + frameSize.byteLength; ++i){
            for(j = 7; j >= 0; --j){
                tmp.push(this.ui8(i) & (1 << j) ? 1 : 0);
            }
        }
        tmp = tmp.slice(5, frameSize.length);
        ['xmin', 'xmax', 'ymin', 'ymax'].forEach(function(key, index){
            var size = 0,
                i = index * frameSize.nbits,
                n = i + frameSize.nbits,
                j = frameSize.nbits - 1;
            for(; i < n; ++i, --j){
                size |= tmp[i] << j;
            }
            frameSize[key] = size;
        });
        offset += frameSize.byteLength;
        
        frameRate = this.ui16(offset);
        offset += 2;
        
        frameCount = this.ui16(offset);
        offset += 2;

        return {
            version: this.version,
            fileLength: this.length,
            frameSize: frameSize,
            frameRate: frameRate,
            frameCount: frameCount,
            byteLength: offset
        };
    },
    
    readTags: function(){
        var header = this.readHeader(),
            offset = header.byteLength,
            tags = [], tag;
            
        while(offset < header.fileLength){
            if(this._isShortTag(offset)){
                tag = this._readShortTag(offset);
                offset += 2;
            } else {
                tag = this._readLongTag(offset);
                offset += 6;
            }
            tag.offset = offset;
            if(tagdic[tag.type]) tag.body = tagdic[tag.type].call(this, tag.offset, tag.length);
            tags.push(tag);
            offset += tag.length;
        }
        
        return tags;
    },
    
    extractMp3: function(){
        var tags = this.readTags(),
            i, n = tags.length, mp3Frames,
            arr = [];
        
        for(i = 0; i < n; ++i){
            if(tags[i].type === 19){
                mp3Frames = tags[i].body.mp3Frames;
                arr.push(this.ui8arr.subarray(mp3Frames.offset, mp3Frames.offset + mp3Frames.length));
            }
        }
        
        return new Blob(arr);
    },
    
    _isCommpressed: function(){
        return bytesToString(this.bytes, 0, 1) === 'C';
    },
    
    _isShortTag: function(offset){
        var tag = this.ui16(offset);
        return (tag & 0x3F) !== 0x3F;
    },
    
    _readShortTag: function(offset){
        var tag = this.ui16(offset);
        return {
            type: tag >> 6,
            length: tag & 0x3F
        };
    },
    
    _readLongTag: function(offset){
        return {
            type: this.ui16(offset) >> 6,
            length: this.ui32(offset + 2)
        };
    },
    
    ui8: function(offset){
        return this.ui8arr[offset];
    },
    
    ui16: function(offset){
        return this.ui8arr[offset] | (this.ui8arr[offset + 1] << 8);
    },
    
    ui32: function(offset){
        var ret = 0;
        ret |= this.ui8arr[offset];
        ret |= this.ui8arr[offset + 1] << 8;
        ret |= this.ui8arr[offset + 2] << 16;
        ret |= this.ui8arr[offset + 3] << 24;
        return ret;
    }
};

/**
 * convert ArrayBuffer to String(ASCII only).
 */
function bytesToString(bytes, offset, n){
    var arr = [],
        ui8a = new Uint8Array(bytes),
        i;
    
    for(i = offset; i < n; ++i) arr.push(ui8a[i]);
    
    return String.fromCharCode.apply(null, arr);
}

return Swf;

})(this);