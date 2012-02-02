/*
Copyright 2012 - Syu Kato (ukyo.web@gmail.com) @ukyo

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var Mp4 = (function(){

var fromCharCode = String.fromCharCode,
	BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder,
	//see: http://www.mp4ra.org/atoms.html
	boxes = {
		ID32: getBox,
		albm: function(bytes, offset, size){},
		auth: function(bytes, offset, size){},
		bpcc: function(bytes, offset, size){},
		buff: function(bytes, offset, size){},
		bxml: getBox,
		ccid: function(bytes, offset, size){},
		cdef: function(bytes, offset, size){},
		clsf: function(bytes, offset, size){},
		cmap: function(bytes, offset, size){},
		co64: function(bytes, offset, size){},
		colr: function(bytes, offset, size){},
		cprt: function(bytes, offset, size){},
		crhd: function(bytes, offset, size){},
		cslg: function(bytes, offset, size){},
		ctts: function(bytes, offset, size){
			var ret = {size: size, body: []},
				i, n = getIntBE(bytes, offset += 12);
				
			for(i = 0; i < n; ++i){
				ret.body.push({
					compositionOffset: getIntBE(bytes, offset += 4),
					sampleCount: getIntBE(bytes, offset += 4)
				})
			}
			return ret;
		},
		cvru: function(bytes, offset, size){},
		dcfD: function(bytes, offset, size){},
		dinf: getBox,
		dref: getBox,
		dscp: function(bytes, offset, size){},
		dsgd: getBox,
		dstg: getBox,
		edts: getBox,
		elst: function(bytes, offset, size){},
		feci: function(bytes, offset, size){},
		fecr: function(bytes, offset, size){},
		fiin: function(bytes, offset, size){},
		fire: function(bytes, offset, size){},
		fpar: function(bytes, offset, size){},
		free: function(bytes, offset, size){},
		frma: getBox,
		ftyp: function(bytes, offset, size){},
		gitn: function(bytes, offset, size){},
		gnre: function(bytes, offset, size){},
		grpi: function(bytes, offset, size){},
		hdlr: function(bytes, offset, size){
			return {
				size: size,
				type: getType(bytes, offset + 16)
			}
		},
		hmhd: function(bytes, offset, size){},
		hpix: function(bytes, offset, size){},
		icnu: function(bytes, offset, size){},
		idat: function(bytes, offset, size){},
		ihdr: function(bytes, offset, size){},
		iinf: function(bytes, offset, size){},
		iloc: function(bytes, offset, size){},
		imif: getBox,
		infu: function(bytes, offset, size){},
		iods: getBox,
		iphd: function(bytes, offset, size){},
		ipmc: getBox,
		ipro: function(bytes, offset, size){},
		iref: function(bytes, offset, size){},
		'jp  ': function(bytes, offset, size){},
		jp2c: function(bytes, offset, size){},
		jp2h: function(bytes, offset, size){},
		jp2i: function(bytes, offset, size){},
		kywd: function(bytes, offset, size){},
		loci: function(bytes, offset, size){},
		lrcu: function(bytes, offset, size){},
		m7hd: function(bytes, offset, size){},
		mdat: function(bytes, offset, size){
			return {offset: offset, size: size, dataSize: size - 8};
		},
		mdhd: function(bytes, offset, size){
			return {
				size: size,
				creationTime: getIntBE(bytes, offset + 12),
				modificationTime: getIntBE(bytes, offset + 16),
				timeScale: getIntBE(bytes, offset + 20),
				duration: getIntBE(bytes, offset + 24),
				languageCode: getIntBE(bytes, offset + 28)
			}
		},
		mdia: getBox,
		mdri: function(bytes, offset, size){},
		meco: getBox,
		mehd: getBox,
		mere: function(bytes, offset, size){},
		meta: getBox,
		mfhd: function(bytes, offset, size){},
		mfra: function(bytes, offset, size){},
		mfro: function(bytes, offset, size){},
		minf: getBox,
		mjhd: function(bytes, offset, size){},
		moof: function(bytes, offset, size){},
		moov: getBox,
		mvcg: function(bytes, offset, size){},
		mvci: function(bytes, offset, size){},
		mvex: getBox,
		mvhd: function(bytes, offset, size){
			
		},
		mvra: function(bytes, offset, size){},
		nmhd: function(bytes, offset, size){},
		ochd: function(bytes, offset, size){},
		odaf: function(bytes, offset, size){},
		odda: function(bytes, offset, size){},
		odhd: function(bytes, offset, size){},
		odhe: function(bytes, offset, size){},
		odrb: function(bytes, offset, size){},
		odrm: getBox,
		odtt: function(bytes, offset, size){},
		ohdr: function(bytes, offset, size){},
		padb: function(bytes, offset, size){},
		paen: function(bytes, offset, size){},
		pclr: function(bytes, offset, size){},
		pdin: function(bytes, offset, size){},
		perf: function(bytes, offset, size){},
		pitm: function(bytes, offset, size){},
		'res ': function(bytes, offset, size){},
		resc: function(bytes, offset, size){},
		resd: function(bytes, offset, size){},
		rtng: function(bytes, offset, size){},
		sbgp: getBox,
		schi: getBox,
		schm: getBox,
		sdep: function(bytes, offset, size){},
		sdhd: function(bytes, offset, size){},
		sdtp: getBox,
		sdvp: getBox,
		segr: function(bytes, offset, size){},
		sgpd: getBox,
		sidx: getBox,
		sinf: getBox,
		skip: function(bytes, offset, size){},
		smhd: function(bytes, offset, size){},
		srmb: function(bytes, offset, size){},
		srmc: getBox,
		srpp: function(bytes, offset, size){},
		stbl: getBox,
		stco: function(bytes, offset, size){
			var ret = {size: size, body: []},
				i, n = getIntBE(bytes, offset += 12);
			
			for(i = 0; i < n; ++i){
				ret.body.push(getIntBE(bytes, offset += 4));
			}
			return ret;
		},
		stdp: function(bytes, offset, size){},
		stsc: function(bytes, offset, size){
			var ret = {size: size, body: []},
				i, n = getIntBE(bytes, offset += 12);
			
			for(i = 0; i < n; ++i){
				ret.body.push({
					firstChunk: getIntBE(bytes, offset += 4),
					samplesPerChunk: getIntBE(bytes, offset += 4),
					sampleDescriptionIndex: getIntBE(bytes, offset += 4)
				})
			}
			return ret;
		},
		stsd: function(bytes, offset, size){
			return getBox(bytes, offset + 8, size - 8);
		},
		stsh: function(bytes, offset, size){},
		stss: function(bytes, offset, size){},
		stts: function(bytes, offset, size){
			return {
				size: size,
				entryCount: getIntBE(bytes, offset + 12),
				sampleCount: getIntBE(bytes, offset + 16),
				sampleDelta: getIntBE(bytes, offset + 20)
			}
		},
		styp: getBox,
		stsz: function(bytes, offset, size){
			var ret = {size: size, body: []},
				i, n = getIntBE(bytes, offset += 16);
			
			for(i = 0; i < n; ++i){
				ret.body.push(getIntBE(bytes, offset += 4));
			}
			return ret;
		},
		stz2: function(bytes, offset, size){},
		subs: function(bytes, offset, size){},
		swtc: function(bytes, offset, size){},
		tfad: getBox,
		tfhd: function(bytes, offset, size){},
		tfma: getBox,
		tfra: function(bytes, offset, size){},
		tibr: function(bytes, offset, size){},
		tiri: function(bytes, offset, size){},
		titl: function(bytes, offset, size){},
		tkhd: function(bytes, offset, size){},
		traf: function(bytes, offset, size){},
		trak: getBox,
		tref: getBox,
		trex: function(bytes, offset, size){},
		trgr: function(bytes, offset, size){},
		trun: function(bytes, offset, size){},
		tsel: function(bytes, offset, size){},
		udta: getBox,
		uinf: function(bytes, offset, size){},
		UITS: function(bytes, offset, size){},
		ulst: function(bytes, offset, size){},
		'url ': function(bytes, offset, size){},
		vmhd: function(bytes, offset, size){},
		vwdi: function(bytes, offset, size){},
		'xml ': function(bytes, offset, size){},
		yrrc: function(bytes, offset, size){},
		
		//codecs
		mp4a: function(bytes, offset, size){
			return {
				dataReferenceIndex: getIntBE(bytes, offset += 12),
				channels: getShortBE(bytes, offset += 12),
				bitPerSample: getShortBE(bytes, offset += 2),
				sampleRate: getIntBE(bytes, offset += 4),
				esds: {
					objectTypeIndication: bytes[offset += 25],
					bufferSizeDB: getShortBE(bytes, offset += 3),
					maxBitrate: getIntBE(bytes, offset += 2),
					avgBitrate: getIntBE(bytes, offset += 4)
				}
			}
		}
	},
	sampleRateTable = {
		96000: 0,
		88200: 1,
		64000: 2,
		48000: 3,
		44100: 4,
		32000: 5,
		24000: 6,
		22050: 7,
		16000: 8,
		12000: 9,
		11025: 10,
		8000: 11
	};

Blob.prototype.slice = Blob.prototype.webkitSlice || Blob.prototype.mozSlice || Blob.prototype.slice;

function Mp4(data){
	var self = this,
		bb = new BlobBuilder();
	
	this.complete = false;
	this.cache = {};
	
	if(isType(data, ArrayBuffer)){
		this.data = data;
		bb.append(data);
		this.blob = bb.getBlob();
		this.cache.parse = this.parse();
	} else if(isType(data, String)){
		loadFileBuffer(data, function(bytes, offset, size){
			bb.append(bytes);
			self.blob = bb.getBlob();
			self.data = bytes;
			self.cache.parse = self.parse();
			self.complete = true;
		});
	}
};

Mp4.prototype = {
	//only AAC-LC
	extractAAC: function(){
		var tree = this.parse(),
			tracks = tree.moov.trak,
			audioTrack, mp4a, sampleToChunkEntries, sampleSizeEntries, chunkEntries,
			i, j, k, n, m, l, fileSize, idx,
			offset = 0,
			bb = new BlobBuilder(),
			aacHeader = new Uint8Array(new ArrayBuffer(7));
		
		if(isType(tracks, Array)){
			tracks.forEach(function(track){
				if(track.mdia.hdlr.type === 'soun'){
					audioTrack = track;
				}
			});
		} else {
			if(tracks.mdia.hdlr.type === 'soun'){
				audioTrack = track;
			} else {
				throw 'This file does not have audio files.';
			}
		}
		
		mp4a = audioTrack.mdia.minf.stbl.stsd.mp4a;
		sampleToChunkEntries = audioTrack.mdia.minf.stbl.stsc.body;
		sampleSizeEntries = audioTrack.mdia.minf.stbl.stsz.body;
		chunkEntries = audioTrack.mdia.minf.stbl.stco.body;
		
		aacHeader[0] = 0xFF;
		aacHeader[1] = 0xF9;
		aacHeader[2] = 0x40 | (sampleRateTable[mp4a.sampleRate] << 2) | (mp4a.channels >> 2);
		aacHeader[6] = 0xFC;
		
		for(i = 0, idx = 0, n = sampleToChunkEntries.length; i < n; ++i){
			j = sampleToChunkEntries[i].firstChunk - 1;
			m = i + 1 < n ? sampleToChunkEntries[i + 1].firstChunk - 1 : chunkEntries.length;
			for(;j < m; ++j){
				offset = chunkEntries[j];
				for(k = 0, l = sampleToChunkEntries[i].samplesPerChunk; k < l; ++k, ++idx){
					//AAC header.
					fileSize = sampleSizeEntries[idx] + 7;
					aacHeader[3] = (mp4a.channels << 6) | (fileSize >> 11);
					aacHeader[4] = fileSize >> 3;
					aacHeader[5] = (fileSize << 5) | (0x7ff >> 6);
					bb.append(aacHeader.buffer);
					
					//AAC body.
					bb.append(this.blob.slice(offset, offset += sampleSizeEntries[idx]));
				}
			}
		}
		
		return bb.getBlob('audio/aac');
	},
	
	parse: function(){
		if(this.cache.parse) return this.cache.parse;
		return getBox(new Uint8Array(this.data), -8, this.data.byteLength);
	}
};

function getBox(bytes, offset, size){
	var ret = {size: size},
		last = offset + size,
		boxInfo, box;
	
	offset += 8;
	while(offset < last){
		boxInfo = getBoxInfo(bytes, offset);
		box = boxes[boxInfo.type];
		if(box) {
			if(ret[boxInfo.type] && !isType(ret[boxInfo.type], Array)){
				ret[boxInfo.type] = [ret[boxInfo.type]];
				ret[boxInfo.type].push(box(bytes, offset, boxInfo.size));
			} else if(isType(ret[boxInfo.type], Array)){
				ret[boxInfo.type].push(box(bytes, offset, boxInfo.size));
			} else {
				ret[boxInfo.type] = box(bytes, offset, boxInfo.size);
			}
		} else {
			break;
		}
		offset += boxInfo.size;
	}
	
	return ret;
}

function getIntBE(bytes, offset){
	return (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
}

function getShortBE(bytes, offset){
	return (bytes[offset] << 8) | (bytes[offset + 1]);
}

function getType(bytes, offset){
	return fromCharCode.apply(null, [bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]]);
}

function getBoxInfo(bytes, offset){
	return {
		size: getIntBE(bytes, offset),
		type: getType(bytes, offset + 4)
	}
}

function isType(obj, type){
	return obj != null ? obj.constructor == type : false;
}

/*
function loadFileBuffer(url, callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.setRequestHeader('If-Modified-Since', '01 Jan 1970 00:00:00 GMT');
	xhr.responseType = 'arraybuffer';
	xhr.onload = function(){
		console.log(xhr.statusText)
		callback(xhr.response);
	};
	xhr.send();
}
*/

return Mp4;

})();
