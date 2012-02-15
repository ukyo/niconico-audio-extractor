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
	TAG_TYPE_META = 0x12;

/**
 * @constructor
 * 
 * @param {ArrayBuffer} buffer
 */
function Flv(buffer){
	this.buffer = buffer;
	this.bytes = new Uint8Array(buffer);
	var bb = new BlobBuilder();
	bb.append(buffer);
	this.blob = bb.getBlob();
}

Flv.prototype = {
	
	/**
	 * Parse flv.
	 * @return {Object}
	 */
	parse: function(){
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
		
		return o;
	},
	
	/**
	 * Extract mp3 from flv
	 * @return {Blob}
	 */
	extractMp3: function(){
		var o = this.parse(),
			offset = 13,
			bb = new BlobBuilder();
		for(var i = 0, n = o.tags.length; i < n; ++i){
			offset += 11;
			o.tags[i].type === TAG_TYPE_AUDIO && bb.append(this.blob.slice(offset + 1, offset + o.tags[i].bodyLength));
			offset += o.tags[i].bodyLength + 4;
		}
		return bb.getBlob();
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

return Flv;

})(this);
