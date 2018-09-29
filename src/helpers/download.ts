import { Parser } from "m3u8-parser";
import { Mp4 } from "../../vendor/mp4.js/dist";
import {
  ITrackHeaderBox,
  ITrackRunBox,
  IMediaDataBox,
  IESDBox,
  IMP4AudioSampleEntry,
  IMovieHeaderBox,
  ISampleDependencyTypeBox
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
import { createMp4DescriptorSpecificInfo } from "../../vendor/mp4.js/dist/mp4";

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
container.style.top = "0px";
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

container.appendChild(messageBox);
container.appendChild(progressBar);
document.body.appendChild(container);

export const isBlobUrl = () =>
  (document.querySelector(
    "#MainVideoPlayer video"
  ) as HTMLVideoElement).src.startsWith("blob");

export const extractAudioForLoggedInUser = () => {
  showContainer();

  return new Promise<Uint8Array>(resolve => {
    chrome.runtime.sendMessage("GET_PLAYLIST_URL", async url => {
      const m3u8Parser = new Parser();
      m3u8Parser.push(await fetch(url).then(res => res.text()));
      m3u8Parser.end();
      const n = m3u8Parser.manifest.segments.length;
      const video = document.createElement("video");
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        video.playbackRate = video.defaultPlaybackRate = 8.0;
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
            data: createMp4DescriptorSpecificInfo(
              mp4a.sampleRate,
              mp4a.channelCount
            )
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

        setTimeout(() => container.remove(), 2000);
        const result = concatBytes([ftypBytes, moovBytes, mdatBytes]);
        resolve(result);
      });
      const segments = [];
      let audioTrack: any;
      let moofs: Uint8Array[] = [];
      let mdats: Uint8Array[] = [];

      hls.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, (event, x: any) => {
        audioTrack = x.tracks.audio.initSegment;
      });
      let i = 0;
      hls.on(Hls.Events.FRAG_PARSING_DATA, (event, x: any) => {
        if (x.type !== "audio") return;
        i++;
        const r = ~~((i / n) * 100);
        setProgressPercent(r);
        messageBox.textContent = `Now Loading... ${r}%. Do not close!`;
        moofs[x.frag.sn - 1] = x.data1;
        mdats[x.frag.sn - 1] = x.data2;
        segments[x.frag.sn - 1] = x;
      });
    });
  });
};

export const downloadMovieForLoggedInUser = () => {
  showContainer();

  return new Promise<Uint8Array>(resolve => {
    chrome.runtime.sendMessage("GET_PLAYLIST_URL", async url => {
      const m3u8Parser = new Parser();
      m3u8Parser.push(await fetch(url).then(res => res.text()));
      m3u8Parser.end();
      const n = m3u8Parser.manifest.segments.length;
      const video = document.createElement("video");
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        video.playbackRate = video.defaultPlaybackRate = 8.0;
        video.volume = 0;
        video.play();
      });
      hls.on(Hls.Events.BUFFER_EOS, async () => {
        const samples = {
          audio: [] as number[][],
          video: [] as number[][]
        };
        let _offset = 0;
        const _chunkOffsets = {
          audio: [] as number[],
          video: [] as number[]
        };
        const sdtpSamples = {
          audio: [],
          video: []
        };
        const cttsSamples = {
          audio: [],
          video: []
        };

        const datas: Uint8Array[] = [];
        for (let i = 0; i < moofs.audio.length; ++i) {
          ["video", "audio"]
            .map(k => [
              moofs[k][i],
              mdats[k][i],
              samples[k],
              _chunkOffsets[k],
              sdtpSamples[k],
              cttsSamples[k]
            ])
            .forEach(
              ([moofBytes, mdatBytes, s, cOffsets, sdtps, ctts]: [
                Uint8Array,
                Uint8Array,
                number[][],
                number[],
                any[],
                any[]
              ]) => {
                const moofBox = Mp4.parse(moofBytes);
                const finder = new Mp4.Finder(moofBox);
                const trun = finder.findOne("trun") as ITrackRunBox;
                const sdtp = finder.findOne("sdtp") as ISampleDependencyTypeBox;
                sdtps.push(...sdtp.samples);
                trun.samples.map(s => {
                  s.sampleCompositionTimeOffset;
                });
                const mdatBox = Mp4.parse(mdatBytes)[0] as IMediaDataBox;
                const sizes = trun.samples.map(s => s.sampleSize);
                s.push(sizes);
                datas.push(mdatBox.data);
                cOffsets.push(_offset);
                _offset += mdatBox.data.length;
              }
            );
        }
        const audioHeaderFinder = new Finder(Mp4.parse(audioTrack));
        const videoHeaderFinder = new Finder(Mp4.parse(videoTrack));
        console.log(Mp4.parse(videoTrack));

        let offset = 8 * 10;

        const ftyp = audioHeaderFinder.findOne("ftyp");
        const ftypBytes = ftyp.bytes;
        offset += ftypBytes.length;

        const audioMvhd = audioHeaderFinder.findOne("mvhd") as IMovieHeaderBox;
        const mvhdBytes = new Mp4.Builder.MovieHeaderBoxBuilder({
          creationTime: audioMvhd.creationTime,
          modificationTime: audioMvhd.modificationTime,
          timescale: 1000,
          duration: ~~((audioMvhd.duration / audioMvhd.timescale) * 1000),
          nextTrackID: audioMvhd.nextTrackID,
          rate: audioMvhd.rate,
          volume: audioMvhd.volume,
          matrix: audioMvhd.matrix
        }).build();
        offset += mvhdBytes.length;

        const videoMvhd = videoHeaderFinder.findOne("mvhd") as IMovieHeaderBox;
        const videoTkhd = videoHeaderFinder.findOne("tkhd") as ITrackHeaderBox;
        const videoTkhdBytes = new Mp4.Builder.TrackHeaderBoxBuilder({
          version: 0,
          flags: 3,
          creationTime: videoTkhd.creationTime,
          modificationTime: videoTkhd.modificationTime,
          trackID: videoTkhd.trackID,
          duration: ~~((videoTkhd.duration / videoMvhd.timescale) * 1000),
          width: videoTkhd.width,
          height: videoTkhd.height,
          matrix: videoTkhd.matrix,
          layer: videoTkhd.layer,
          alternateGroup: videoTkhd.alternateGroup,
          volume: videoTkhd.volume
        }).build();
        // const videoTkhdBytes = videoTkhd.bytes;
        offset += videoTkhdBytes.length;

        const videoMdhdBytes = videoHeaderFinder.findOne("mdhd").bytes;
        offset += videoMdhdBytes.length;

        const videoHdlrBytes = videoHeaderFinder.findOne("hdlr").bytes;
        offset += videoHdlrBytes.length;

        const videoSmhdBytes = videoHeaderFinder.findOne("vmhd").bytes;
        offset += videoSmhdBytes.length;

        const videoDinfBytes = videoHeaderFinder.findOne("dinf").bytes;
        offset += videoDinfBytes.length;

        const videoStsdBytes = videoHeaderFinder.findOne("stsd").bytes;
        offset += videoStsdBytes.length;

        const audioTkhd = audioHeaderFinder.findOne("tkhd") as ITrackHeaderBox;
        const audioTkhdBytes = new Mp4.Builder.TrackHeaderBoxBuilder({
          flags: 3,
          creationTime: audioTkhd.creationTime,
          modificationTime: audioTkhd.modificationTime,
          trackID: audioTkhd.trackID,
          duration: ~~((audioTkhd.duration / audioMvhd.timescale) * 1000),
          layer: audioTkhd.layer,
          alternateGroup: audioTkhd.alternateGroup,
          matrix: audioTkhd.matrix,
          volume: audioTkhd.volume,
          width: 0,
          height: 0
        }).build();
        offset += audioTkhdBytes.length;

        const audioMdhdBytes = audioHeaderFinder.findOne("mdhd").bytes;
        offset += audioMdhdBytes.length;

        const audioHdlrBytes = audioHeaderFinder.findOne("hdlr").bytes;
        offset += audioHdlrBytes.length;

        const audioSmhdBytes = audioHeaderFinder.findOne("smhd").bytes;
        offset += audioSmhdBytes.length;

        const audioDinfBytes = audioHeaderFinder.findOne("dinf").bytes;
        offset += audioDinfBytes.length;

        const mp4a = audioHeaderFinder.findOne("mp4a") as IMP4AudioSampleEntry;

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
            data: createMp4DescriptorSpecificInfo(
              mp4a.sampleRate,
              mp4a.channelCount
            )
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

        var audioStsdBytes = new Mp4.Builder.SampleDescriptionBoxBuilder({
          entryCount: 1,
          boxes: [audioSampleEntry]
        }).build();
        offset += audioStsdBytes.length;

        const _videoSamples = [].concat(...samples.video);
        const videoSttsBytes = new Mp4.Builder.TimeToSampleBoxBuilder({
          entryCount: 1,
          entries: [{ sampleCount: _videoSamples.length, sampleDelta: 3000 }]
        }).build();
        offset += videoSttsBytes.length;

        const videoStszBytes = new Mp4.Builder.SampleSizeBoxBuilder({
          sampleSize: 0,
          sampleCount: _videoSamples.length,
          sampleSizes: _videoSamples
        }).build();
        offset += videoStszBytes.length;

        const videoStscBytes = new Mp4.Builder.SampleToChunkBoxBuilder({
          entryCount: samples.video.length,
          entries: samples.video.map((s, i) => {
            return {
              firstChunk: i + 1,
              samplesPerChunk: s.length,
              sampleDescriptionIndex: 1
            };
          })
        }).build();
        offset += videoStscBytes.length;

        const _audioSamples = [].concat(...samples.audio);
        var audioSttsBytes = new Mp4.Builder.TimeToSampleBoxBuilder({
          entryCount: 1,
          entries: [{ sampleCount: _audioSamples.length, sampleDelta: 1024 }]
        }).build();
        offset += audioSttsBytes.length;

        var audioStszBytes = new Mp4.Builder.SampleSizeBoxBuilder({
          sampleSize: 0,
          sampleCount: _audioSamples.length,
          sampleSizes: _audioSamples
        }).build();
        offset += audioStszBytes.length;

        var audioStscBytes = new Mp4.Builder.SampleToChunkBoxBuilder({
          entryCount: samples.audio.length,
          entries: samples.audio.map((s, i) => {
            return {
              firstChunk: i + 1,
              samplesPerChunk: s.length,
              sampleDescriptionIndex: 1
            };
          })
        }).build();
        offset += audioStscBytes.length;

        const videoSdtpBytes = new Mp4.Builder.SampleDependencyTypeBoxBuilder({
          samples: sdtpSamples.video
        }).build();
        offset += videoSdtpBytes.length;

        const audioSdtpBytes = new Mp4.Builder.SampleDependencyTypeBoxBuilder({
          samples: sdtpSamples.audio
        }).build();
        offset += audioSdtpBytes.length;

        offset += 4 + samples.video.length * 4 + /* header length */ 12;
        offset += 4 + samples.audio.length * 4 + /* header length */ 12;
        const videoStcoBytes = new Mp4.Builder.ChunkOffsetBoxBuilder({
          entryCount: samples.video.length,
          chunkOffsets: _chunkOffsets.video.map(x => x + offset)
        }).build();

        var audioStcoBytes = new Mp4.Builder.ChunkOffsetBoxBuilder({
          entryCount: samples.audio.length,
          chunkOffsets: _chunkOffsets.audio.map(x => x + offset)
        }).build();

        const videoStblBytes = new Mp4.Builder.SampleTableBoxBuilder([
          videoStsdBytes,
          videoSttsBytes,
          videoStscBytes,
          videoStszBytes,
          videoStcoBytes,
          videoSdtpBytes
        ]).build();
        var videoMinfBytes = new Mp4.Builder.MediaInformationBoxBuilder([
          videoSmhdBytes,
          videoDinfBytes,
          videoStblBytes
        ]).build();
        var videoMdiaBytes = new Mp4.Builder.MediaBoxBuilder([
          videoMdhdBytes,
          videoHdlrBytes,
          videoMinfBytes
        ]).build();
        var videoTrakBytes = new Mp4.Builder.TrackBoxBuilder([
          videoTkhdBytes,
          videoMdiaBytes
        ]).build();
        var audioStblBytes = new Mp4.Builder.SampleTableBoxBuilder([
          audioStsdBytes,
          audioSttsBytes,
          audioStscBytes,
          audioStszBytes,
          audioStcoBytes,
          audioSdtpBytes
        ]).build();
        var audioMinfBytes = new Mp4.Builder.MediaInformationBoxBuilder([
          audioSmhdBytes,
          audioDinfBytes,
          audioStblBytes
        ]).build();
        var audioMdiaBytes = new Mp4.Builder.MediaBoxBuilder([
          audioMdhdBytes,
          audioHdlrBytes,
          audioMinfBytes
        ]).build();
        var audioTrakBytes = new Mp4.Builder.TrackBoxBuilder([
          audioTkhdBytes,
          audioMdiaBytes
        ]).build();
        var moovBytes = new Mp4.Builder.MovieBoxBuilder([
          mvhdBytes,
          videoTrakBytes,
          audioTrakBytes
        ]).build();
        var mdatBytes = new Mp4.Builder.MediaDataBoxBuilder({
          data: concatBytes(datas)
        }).build();

        container.remove();
        const result = concatBytes([ftypBytes, moovBytes, mdatBytes]);
        resolve(result);
      });
      const segments = [];
      let audioTrack: any;
      let videoTrack: any;
      const moofs = {
        audio: [] as Uint8Array[],
        video: [] as Uint8Array[]
      };
      const mdats = {
        audio: [] as Uint8Array[],
        video: [] as Uint8Array[]
      };

      hls.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, (event, x: any) => {
        audioTrack = x.tracks.audio.initSegment;
        videoTrack = x.tracks.video.initSegment;
      });
      let i = 0;
      hls.on(Hls.Events.FRAG_PARSING_DATA, (event, x: any) => {
        console.log(x.type, x.frag.sn);
        i++;
        const r = ~~((i / n) * 100);
        setProgressPercent(r);
        messageBox.textContent = `Now Loading... ${r}%. Do not close!`;
        moofs[x.type][x.frag.sn - 1] = x.data1;
        mdats[x.type][x.frag.sn - 1] = x.data2;
        segments[x.frag.sn - 1] = x;
      });
    });
  });
};

const showContainer = () => {
  messageBox.textContent = "Start loading!";
  container.style.transform = "translateX(0%)";
};

const setProgressPercent = (r: number) => {
  progressBar.style.width = r + "%";
};

export const download = () => {
  return new Promise<Uint8Array>((resolve, reject) => {
    (window as any).requestIdleCallback(async () => {
      showContainer();

      const request = () => {
        return new Promise((_, reject) => {
          const url = (document.querySelector(
            "#MainVideoPlayer video"
          ) as HTMLVideoElement).src;
          const xhr = new XMLHttpRequest();
          xhr.responseType = "arraybuffer";
          xhr.open("GET", url);
          xhr.send();
          xhr.onprogress = e => {
            if (e.loaded === e.total) return;
            const r = Math.floor((e.loaded / e.total) * 100);
            setProgressPercent(r);
            messageBox.textContent = `Now Loading... ${r}%. Do not close!`;
          };
          xhr.onloadend = () => {
            if (200 <= xhr.status && xhr.status < 300) {
              const movie = new Uint8Array(xhr.response);
              setProgressPercent(100);
              messageBox.textContent = "Complete!";
              resolve(movie);
              setTimeout(() => container.remove(), 2000);
            } else {
              reject(new Error(`Error: ${xhr.status}`));
            }
          };
        });
      };

      for (let i = 32; i >= 0; i--) {
        try {
          await request();
          return;
        } catch (e) {
          if (i === 0) {
            messageBox.textContent = e.message;
            container.appendChild(closeBtn);
            closeBtn.onclick = () => container.remove();
            reject();
          }
        }
      }
    });
  });
};
