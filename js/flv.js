/**
 * Copyright (c) 2012 - Syu Kato <ukyo.web@gmail.com>
 * Version: 1.0
 * License: MIT
 */

var Flv = (function(window){

var BlobBuilder = window.BlobBuider || window.MozBlobBuilder || window.WebKitBlobBuilder;
Blob.prototype.slice = Blob.prototype.webkitSlice || Blob.prototype.mozSlice || Blob.prototype.slice;

var TAG_TYPE_AUDIO = 0x08,
	TAG_TYPE_VIDEO = 0x09,
	TAG_TYPE_META = 0x12,
	SOUND_FORMAT_LINEAR_PCM_PLATFORM_ENDIAN = 0,
	SOUND_FORMAT_ADPCM = 1,
	SOUND_FORMAT_MP3 = 2,
	SOUND_FORMAT_LINEAR_PCM_LITTLE_ENDIAN = 3,
	SOUND_FORMAT_NELLYMOSER_16KHZ_MONO = 4,
	SOUND_FORMAT_NELLYMOSER_8KHZ_MONO = 5,
	SOUND_FORMAT_NELLYMOSER = 6,
	SOUND_FORMAT_G711_ALAW_LOGARITHMIC_PCM = 7,
	SOUND_FORMAT_G711_MULAW_LOGARITHMIC_PCM = 8,
	SOUND_FORMAT_RESERVED = 9,
	SOUND_FORMAT_AAC = 10,
	SOUND_FORMAT_SPEEX = 11,
	SOUND_FORMAT_MP3_8KHZ = 14,
	SOUND_FORMAT_DEVICE_SPECIFIC_SOUND = 15,
	EXTENSION_TABLE = [
		".wav",
		".wav",//?
		".mp3",
		".wav",
		".?",
		".?",
		".?",
		".wav",//?
		".wav",//?
		".reserved",
		".aac",
		".spx",
		".mp3",
		".?"
	],
	SOUND_RATE_TABLE = [
		5500,
		11025,
		22050,
		44100
	],
	AAC_SAMPLE_RATE_TABLE = [
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
	SOUND_SIZE_TABLE = [
		8, //8bit
		16 //16bit
	],
	SOUND_TYPE_TABLE = [
		1, //Mono
		2 //Stereo
	],
	VIDEO_FRAME_TYPE_KEY_FRAME = 1,
	VIDEO_FRAME_TYPE_INTER_FRAME = 2,
	VIDEO_FRAME_TYPE_DISPOSABLE_INTER_FRAME = 3,
	VIDEO_FRAME_TYPE_GENERATED_KEY_FRAME = 4,
	VIDEO_FRAME_TYPE_VIDEO_INFO = 5,
	VIDEO_CODEC_ID_JPEG = 1,
	VIDEO_CODEC_ID_SORENSON_H263 = 2,
	VIDEO_CODEC_ID_SCREEN_VIDEO = 3,
	VIDEO_CODEC_ID_ON2_VP6 = 4,
	VIDEO_CODEC_ID_ON2_VP6_WITH_ALPHA_CHANNEL = 5,
	VIDEO_CODEC_ID_SCREEN_VIDEO_VERSION2 = 6,
	VIDEO_CODEC_ID_AVC = 7;


/**
 * @param {Object} obj
 * @param {Object} type
 * @return {boolean}
 */
var isType = function(obj, type){
	return obj != null ? obj.constructor == type : false;
};


/**
 * @param {...(Uint8Array|int8Array)} byteArrays
 * @return {Uint8Array}
 */
var concatByteArrays = function(byteArrays){
	var byteArrays = isType(byteArrays, Array) ? byteArrays : Array.prototype.slice.call(arguments, 0),
		size = 0,
		offset = 0,
		i, n, ret;
	
	for(i = 0, n = byteArrays.length; i < n; ++i) size += byteArrays[i].length;
	ret = new Uint8Array(size);
	for(i = 0; i < n; ++i) {
		ret.set(byteArrays[i], offset);
		offset += byteArrays[i].length;
	}
	return ret;
};


/**
 * @constructor
 * 
 * @param {ArrayBuffer} buffer
 */
function Flv(buffer){
	this.buffer = buffer;
	this.bytes = new Uint8Array(buffer);
	this.cache = {};
}


Flv.prototype = {
	
	/**
	 * Parse flv.
	 * @return {Object}
	 */
	parse: function(){
		if(this.cache.parse) return this.cache.parse;
		
		var o = {},
			offset = 0;
		
		//flv header
		o.header = {}
		o.header.signature = this.str(offset, 3);
		offset += 3;
		o.header.version = this.ui8(offset);
		offset++;
		o.header.flags = this.ui8(offset);
		offset++;
		o.header.offset = this.ui32(offset);
		offset += 4;
		
		offset += 4;
		
		//flv tags
		o.tags = [];
		while(offset < this.bytes.length) {
			var tag = {};
			tag.type = this.ui8(offset);
			offset++;
			tag.bodyLength = this.ui24(offset);
			offset += 3;
			tag.timestamp = this.ui24(offset);
			offset += 3;
			tag.timestampExtended = this.ui8(offset);
			offset++;
			tag.streamId = this.ui24(this);
			offset += 3;
			//skip body
			offset += tag.bodyLength;
			tag.previousTagSize = this.ui32(offset);
			offset += 4;
			o.tags.push(tag);
		}
		this.cache.parse = o;
		return o;
	},
	
	/**
	 * Extract audio from flv impl.
	 * @return {Object}
	 */
	_extractAudio: function(){
		var o = this.parse(),
			offset = 13,
			size = 0,
			byteArrays = [],
			info = this.getAudioInfo();
		
		for(var i = 0, n = o.tags.length; i < n; ++i){
			offset += 11;
			o.tags[i].type === TAG_TYPE_AUDIO && byteArrays.push(this.bytes.subarray(offset + 1, offset + o.tags[i].bodyLength));
			offset += o.tags[i].bodyLength + 4;
		}
		if (info.soundFormat === SOUND_FORMAT_LINEAR_PCM_LITTLE_ENDIAN) {
			return this.wave(concatByteArrays(byteArrays), info);
		}
		return {type: EXTENSION_TABLE[info.soundFormat], buffer: concatByteArrays(byteArrays).buffer};
	},
	
	/**
	 * @param {Uint8Array} waveData
	 * @param {Object} info
	 * @return {Object}
	 */
	wave: function(waveData, info) {
		var header = new Uint8Array(44),
			channels = SOUND_TYPE_TABLE[info.soundType],
			sampleRate = SOUND_RATE_TABLE[info.soundRate];
		putStr(header, "RIFF", 0);
		putUi32le(header, waveData.length - 8, 4);
		putStr(header, "WAVE", 8);
		putStr(header, "fmt ", 12);
		putUi32le(header, 16, 16);
		putUi16le(header, 1, 20);
		putUi16le(header, channels, 22);
		putUi32le(header, sampleRate, 24);
		putUi32le(header, sampleRate * channels * 2, 28);
		putUi16le(header, channels * 2, 32);
		putUi16le(header, 16, 34);
		putStr(header, "data", 36);
		putUi32le(header, waveData.length, 40);
		return {
			type: ".wav",
			buffer: concatByteArrays(header, waveData).buffer
		}
	},
	
	/**
	 * Extract aac
	 * @return {Object}
	 */
	extractAAC: function(){
		var o = this.parse(),
			offset = 13,
			size = 0,
			byteArrays = [],
			info = this.getAACInfo(),
			aacHeader = new Uint8Array(7),
			tmpArr;
		
		aacHeader[0] = 0xFF;
		aacHeader[1] = 0xF9;
		aacHeader[2] = 0x40 | (info.sampleRate << 2) | (info.channels >> 2);
		aacHeader[6] = 0xFC;
		
		for(var i = 0, n = o.tags.length; i < n; ++i){
			offset += 11;
			
			if(o.tags[i].type === TAG_TYPE_AUDIO && this.bytes[offset + 1] === 1){
				tmpArr = new Uint8Array(o.tags[i].bodyLength - 2 + 7);
				aacHeader[3] = (info.channels << 6) | (tmpArr.length >> 11);
				aacHeader[4] = tmpArr.length >> 3;
				aacHeader[5] = (tmpArr.length << 5) | (0x7ff >> 6);
				tmpArr.set(aacHeader, 0);
				tmpArr.set(this.bytes.subarray(offset + 2, offset + o.tags[i].bodyLength), 7);
				byteArrays.push(tmpArr);
			}
			offset += o.tags[i].bodyLength + 4;
		}
		return {type: "aac", buffer: concatByteArrays(byteArrays).buffer};
	},
	
	/**
	 * @return {Object}
	 */
	getAudioInfo: function(){
		var o = this.parse(),
			offset = 13,
			i = 0,
			info,
			result;
		
		while(1){
			offset += 11;
			if(o.tags[i].type === TAG_TYPE_AUDIO) {
				info = this.bytes[offset];
				return {
					soundFormat: info >> 4,
					soundRate: (info >> 2) & 0x3,
					soundSize: (info >> 1) & 1,
					soundType: info & 1
				}
			}
			offset += o.tags[i].bodyLength + 4;
			i++;
		}
	},
	
	getAACInfo: function(){
		var o = this.parse(),
			offset = 13,
			i = 0,
			info,
			result;
		
		while(1){
			offset += 11;
			if(o.tags[i].type === TAG_TYPE_AUDIO && this.bytes[offset + 1] === 0) {
				info = this.bytes[offset];
				return {
					type: (this.ui8(offset + 2) >> 3) - 1,
					sampleRate: (this.ui16(offset + 2) >> 7) & 0xF,
					channels: (this.ui16(offset + 2) >> 3) & 0xF
				};
			}
			offset += o.tags[i].bodyLength + 4;
			i++;
		}
	},
	
	/**
	 * Extract audio.
	 * @return {Object}
	 */
	extractAudio: function(){
		var info = this.getAudioInfo();
		if(info.soundFormat === SOUND_FORMAT_AAC) {
			return this.extractAAC();
		} else {
			return this._extractAudio();
		}
	},
	
	/**
	 * unsigned 8 bit int.
	 * @param {number} offset
	 * @return {number}
	 */
	ui8: function(offset){
		return this.bytes[offset];
	},
	
	/**
	 * unsigned 16 bit int.
	 * @param {number} offset
	 * @return {number}
	 */
	ui16: function(offset){
		return this.bytes[offset] << 8 | this.bytes[offset + 1];
	},
	
	/**
	 * unsigned 24 bit int.
	 * @param {number} offset
	 * @return {number}
	 */
	ui24: function(offset){
		return this.bytes[offset] << 16 | this.bytes[offset + 1] << 8 | this.bytes[offset + 2];
	},
	
	/**
	 * unsigned 32 bit int.
	 * @param {number} offset
	 * @return {number}
	 */
	ui32: function(offset){
		return this.bytes[offset] << 24 | this.bytes[offset + 1] << 16 | this.bytes[offset + 2] << 8 | this.bytes[offset + 3];
	},
	
	/**
	 * string
	 * @param {number} offset
	 * @param {number} n
	 * @return {number}
	 */
	str: function(offset, n){
		var ret = [];
		for(var i = offset, end = offset + n; i < end; ++i){
			ret[ret.length] = this.bytes[i];
		}
		return String.fromCharCode.apply(null, ret);
	}
};

/**
 * @param {Uint8Array} bytes
 * @param {number} x
 * @param {number} offset
 */
var putUi16le = function(bytes, x, offset){
	bytes[offset] = x & 0xFF;
	bytes[offset + 1] = x >> 8;
};

/**
 * @param {Uint8Array} bytes
 * @param {number} x
 * @param {number} offset
 */
var putUi24le = function(bytes, x, offset){
	bytes[offset] = x & 0xFF;
	bytes[offset + 1] = (x >> 8) & 0xFF;
	bytes[offset + 2] = x >> 16;
};

/**
 * @param {Uint8Array} bytes
 * @param {number} x
 * @param {number} offset
 */
var putUi32le = function(bytes, x, offset){
	bytes[offset] = x & 0xFF;
	bytes[offset + 1] = (x >> 8) & 0xFF;
	bytes[offset + 2] = (x >> 16) & 0xFF;
	bytes[offset + 3] = x >> 24;
};

/**
 * @param {Uint8Array} bytes
 * @param {string} s
 * @param {number} offset
 * 
 * ascii only!
 */
var putStr = function(bytes, s, offset){
	for(var i = 0, n = s.length; i < n; ++i) bytes[i + offset] = s.charCodeAt(i);
};


return Flv;

})(this);
