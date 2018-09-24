import * as mux from "mux.js";
import { Parser } from "m3u8-parser";
import { Mp4 } from "../../vendor/mp4.js/dist";
import {
  ITrackHeaderBox,
  ITrackRunBox,
  IMediaDataBox,
  IESDBox,
  IMP4AudioSampleEntry,
  ISampleDescriptionBox,
  IMovieHeaderBox
} from "../../vendor/mp4.js/dist/interface.box";
import * as Hls from "hls.js";
import {
  IDecoderConfigDescriptor,
  ISLConfigDescriptor,
  IESDescriptor
} from "../../vendor/mp4.js/dist/interface.descr";
import { DecoderConfigDescriptorParser } from "../../vendor/mp4.js/dist/parser.descr";
import { BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY } from "../../vendor/mp4.js/dist/statics";
import { Finder } from "../../vendor/mp4.js/dist/finder";

var concatBytes = (bytess: Uint8Array[]): Uint8Array => {
  var i,
    n,
    byteLength = 0,
    offset = 0;
  for (i = 0, n = bytess.length; i < n; ++i) {
    byteLength += bytess[i].length;
  }
  var ret = new Uint8Array(byteLength);
  for (i = 0; i < n; ++i) {
    ret.set(bytess[i], offset);
    offset += bytess[i].length;
  }
  return ret;
};

const container = document.createElement("div");
container.style.position = "fixed";
container.style.right = "0px";
container.style.bottom = "0px";
container.style.width = "240px";
container.style.backgroundColor = "#fff";
container.style.zIndex = "10000000000";
container.style.transform = "translateX(100%)";
container.style.transition = "transform 0.25s";
container.style.boxShadow = "0 0 5px rgba(0,0,0,.2)";

const progressBar = document.createElement("div");
progressBar.style.height = "3px";
progressBar.style.width = "0%";
progressBar.style.backgroundColor = "rgb(90, 185, 241)";

const messageBox = document.createElement("div");
messageBox.style.width = "100%";
messageBox.style.padding = "10px 5px";
messageBox.style.fontSize = "12px";
messageBox.style.color = "#494949";

const closeBtn = document.createElement("div");
closeBtn.textContent = "×";
closeBtn.style.position = "absolute";
closeBtn.style.right = "10px";
closeBtn.style.bottom = "5px";
closeBtn.style.fontSize = "20px";
closeBtn.style.cursor = "pointer";

container.appendChild(progressBar);
container.appendChild(messageBox);
document.body.appendChild(container);

const SAMPLE_FREQUENCY_INDEX_TABLE = {
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
  8000: 11,
  7350: 12
};

const dl2 = () => {
  return new Promise<Uint8Array>(resolve => {
    chrome.runtime.sendMessage("GET_PLAYLIST_URL", async url => {
      const video = document.createElement("video");
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        const objUrl = video.src;
        video.volume = 0;
        video.play();
      });
      hls.on(Hls.Events.BUFFER_EOS, async () => {
        const samples: number[] = [];
        const datas: Uint8Array[] = [];
        for (let i = 0; i < moofs.length; ++i) {
          const moofBox = Mp4.parse(moofs[i]);
          const finder = new Mp4.Finder(moofBox);
          const trun = finder.findOne("trun") as ITrackRunBox;
          const mdatBox = Mp4.parse(mdats[i])[0] as IMediaDataBox;
          const sizes = trun.samples.map(s => s.sampleSize);
          samples.push(...sizes);
          datas.push(mdatBox.data);
        }
        const headerFinder = new Finder(Mp4.parse(audioTrack));
        console.log(Mp4.parse(audioTrack));

        let offset = 8 * 6;

        const ftyp = headerFinder.findOne("ftyp");
        const ftypBytes = ftyp.bytes;
        offset += ftypBytes.length;

        const mvhd = headerFinder.findOne("mvhd") as IMovieHeaderBox;
        const mvhdBytes = mvhd.bytes;
        offset += mvhdBytes.length;

        const tkhd = headerFinder.findOne("tkhd") as ITrackHeaderBox;
        const tkhdBytes = tkhd.bytes;
        offset += tkhdBytes.length;

        const mdhdBytes = headerFinder.findOne("mdhd").bytes;
        offset += mdhdBytes.length;

        const hdlrBytes = headerFinder.findOne("hdlr").bytes;
        offset += hdlrBytes.length;

        const smhdBytes = headerFinder.findOne("smhd").bytes;
        offset += smhdBytes.length;

        const dinfBytes = headerFinder.findOne("dinf").bytes;
        offset += dinfBytes.length;

        const mp4a = headerFinder.findOne("mp4a") as IMP4AudioSampleEntry;

        const sampleFrequencyIndex =
          SAMPLE_FREQUENCY_INDEX_TABLE[mp4a.sampleRate];
        const byte1 = (2 << 3) | (sampleFrequencyIndex >> 1);
        const byte2 =
          ((sampleFrequencyIndex << 7) | (mp4a.channelCount << 3)) & 0xff;

        var OBJECT_TYPE_INDICATION =
          DecoderConfigDescriptorParser.OBJECT_TYPE_INDICATION;
        var decConfigDescr: IDecoderConfigDescriptor = {
          objectTypeIndication: OBJECT_TYPE_INDICATION.AAC,
          streamType: 0x05,
          upStream: 0,
          bufferSizeDB: 0,
          maxBitrate: 0,
          avgBitrate: 0,
          decSpecificInfo: {
            data: new Uint8Array([byte1, byte2])
          }
        };

        var slConfigDescr: ISLConfigDescriptor = {
          preDefined: 2
        };

        var esDescr: IESDescriptor = {
          esID: 1,
          streamDependenceFlag: 0,
          urlFlag: 0,
          ocrStreamFlag: 0,
          streamPriority: 0,
          decConfigDescr: decConfigDescr,
          slConfigDescr: slConfigDescr
        };

        var esBox: IESDBox = {
          esDescr: esDescr
        };

        var audioSampleEntry: IMP4AudioSampleEntry = {
          type: BOX_TYPE_MP4_AUDIO_SAMPLE_ENTRY,
          dataReferenceIndex: 1,
          channelCount: 2,
          sampleSize: 16,
          sampleRate: 48000,
          esBox: esBox
        };

        var stsdBytes = new Mp4.Builder.SampleDescriptionBoxBuilder({
          entryCount: 1,
          boxes: [audioSampleEntry]
        }).build();
        offset += stsdBytes.length;

        var sttsBytes = new Mp4.Builder.TimeToSampleBoxBuilder({
          entryCount: 1,
          entries: [{ sampleCount: samples.length, sampleDelta: 1024 }]
        }).build();
        offset += sttsBytes.length;

        var stszBytes = new Mp4.Builder.SampleSizeBoxBuilder({
          sampleSize: 0,
          sampleCount: samples.length,
          sampleSizes: samples
        }).build();
        offset += stszBytes.length;

        var mod16 = samples.length % 16;
        var stscEntryCount = mod16 ? 2 : 1;
        var stscEntries = [
          {
            firstChunk: 1,
            samplesPerChunk: 16,
            sampleDescriptionIndex: 1
          }
        ];
        if (stscEntryCount === 2) {
          stscEntries.push({
            firstChunk: Math.floor(samples.length / 16) + 1,
            samplesPerChunk: mod16,
            sampleDescriptionIndex: 1
          });
        }
        var stscBytes = new Mp4.Builder.SampleToChunkBoxBuilder({
          entryCount: stscEntryCount,
          entries: stscEntries
        }).build();
        offset += stscBytes.length;

        var stcoEntryCount = Math.ceil(samples.length / 16);
        offset += 4 + stcoEntryCount * 4 + /* header length */ 12;
        var chunkOffset = offset;
        var chunkOffsets = [];
        for (var i = 0, n = samples.length; i < n; ++i) {
          if (i % 16 === 0) chunkOffsets.push(chunkOffset);
          chunkOffset += samples[i];
        }
        var stcoBytes = new Mp4.Builder.ChunkOffsetBoxBuilder({
          entryCount: stcoEntryCount,
          chunkOffsets: chunkOffsets
        }).build();

        var stblBytes = new Mp4.Builder.SampleTableBoxBuilder([
          stsdBytes,
          sttsBytes,
          stscBytes,
          stszBytes,
          stcoBytes
        ]).build();
        var minfBytes = new Mp4.Builder.MediaInformationBoxBuilder([
          smhdBytes,
          dinfBytes,
          stblBytes
        ]).build();
        var mdiaBytes = new Mp4.Builder.MediaBoxBuilder([
          mdhdBytes,
          hdlrBytes,
          minfBytes
        ]).build();
        var trakBytes = new Mp4.Builder.TrackBoxBuilder([
          tkhdBytes,
          mdiaBytes
        ]).build();
        var moovBytes = new Mp4.Builder.MovieBoxBuilder([
          mvhdBytes,
          trakBytes
        ]).build();
        var mdatBytes = new Mp4.Builder.MediaDataBoxBuilder({
          data: concatBytes(datas)
        }).build();

        const result = concatBytes([ftypBytes, moovBytes, mdatBytes]);

        const foo = [audioTrack];
        moofs.forEach((m, i) => {
          foo.push(m, mdats[i]);
        });
        const aa = concatBytes(foo);
        const b = new Blob([result]);
        const objUrl = URL.createObjectURL(b);
        const a = <HTMLAnchorElement>document.createElement("a");
        const e = <MouseEvent>document.createEvent("MouseEvent");
        a.setAttribute("download", "hello.m4a");
        a.setAttribute("href", objUrl);
        e.initEvent("click", true, true);
        a.dispatchEvent(e);
        URL.revokeObjectURL(objUrl);
      });
      const segments = [];
      let audioTrack: any;
      let moofs: Uint8Array[] = [];
      let mdats: Uint8Array[] = [];

      hls.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, (event, x: any) => {
        audioTrack = x.tracks.audio.initSegment;
        console.log(event, x);
        // console.log(event, x.tracks.audio.initSegment);
        // console.log(Mp4.parse(x.tracks.audio.initSegment));
        // console.log(Mp4.parse(x.tracks.video.initSegment));
      });
      hls.on(Hls.Events.FRAG_PARSING_DATA, (event, x: any) => {
        if (x.type !== "audio") return;
        console.log(event, x);
        moofs[x.frag.sn - 1] = x.data1;
        mdats[x.frag.sn - 1] = x.data2;
        segments[x.frag.sn - 1] = x;
      });
    });
  });
};

export const download = () => {
  return dl2();
  // return new Promise<Uint8Array>((resolve, reject) => {
  //   (window as any).requestIdleCallback(async () => {
  //     container.style.transform = "translateX(0%)";

  //     const request = () => {
  //       return new Promise((_, reject) => {
  //         const url = (document.querySelector(
  //           "#MainVideoPlayer video"
  //         ) as HTMLVideoElement).src;
  //         const xhr = new XMLHttpRequest();
  //         xhr.responseType = "arraybuffer";
  //         xhr.open("GET", url);
  //         xhr.send();
  //         xhr.onprogress = e => {
  //           if (e.loaded === e.total) return;
  //           const r = Math.floor((e.loaded / e.total) * 100);
  //           progressBar.style.width = r + "%";
  //           messageBox.textContent = `Now Loading... ${r}%. Do not close!`;
  //         };
  //         xhr.onloadend = () => {
  //           if (200 <= xhr.status && xhr.status < 300) {
  //             const movie = new Uint8Array(xhr.response);
  //             progressBar.style.width = "100%";
  //             messageBox.textContent = "Complete!";
  //             resolve(movie);
  //             setTimeout(() => container.remove(), 2000);
  //           } else {
  //             reject(new Error(`Error: ${xhr.status}`));
  //           }
  //         };
  //       });
  //     };

  //     for (let i = 128; i >= 0; i--) {
  //       try {
  //         await request();
  //         return;
  //       } catch (e) {
  //         if (i === 0) {
  //           messageBox.textContent = e.message;
  //           container.appendChild(closeBtn);
  //           closeBtn.onclick = () => container.remove();
  //           reject();
  //         }
  //       }
  //     }
  //   });
  // });
};
