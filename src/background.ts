import { Mp4 } from "../vendor/mp4.js/dist";
import { IMedia, IDownloadParams } from "./interfaces";
import * as Swf from "./swf";
import * as Flv from "./flv";
import { VIDEO_TITLE_SAFIX } from "./settings";

namespace Background {
  // get a raw movie url with nicovideo api.
  const getMovieURL = async (pageUrl: string) => {
    var id = pageUrl
      .split("?")[0]
      .split("/")
      .pop();

    return new Promise<string>((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `http://flapi.nicovideo.jp/api/getflv/${id +
          (/^nm/.test(id) ? "?as3=1" : "")}`
      );
      xhr.onload = e =>
        resolve(decodeURIComponent(/url=([^&]+)/.exec(xhr.responseText)[1]));
      xhr.onerror = reject;
      xhr.send();
    });
  };

  // load movie as Uint8Array.
  const loadMovie = (movieUrl: string) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", movieUrl);
    xhr.responseType = "arraybuffer";
    xhr.send();
    return {
      onProgress(fn: (ev: ProgressEvent) => void) {
        xhr.onprogress = fn;
      },
      promise: new Promise((resolve, reject) => {
        xhr.onloadend = ev => {
          if (200 <= xhr.status && xhr.status < 300) {
            resolve(new Uint8Array(xhr.response));
          } else {
            reject(new Error("load failed! " + xhr.status));
          }
        };
      })
    };
  };

  // detect movie type (mp4, swf or flv).
  const detectMovieType = (movie: Uint8Array): string => {
    var view = new Mp4.DataView2(movie);

    if (view.getString(4, 4) === "ftyp") {
      return "mp4";
    } else {
      switch (view.getString(0, 3)) {
        case "FWS":
        case "CWS":
          return "swf";
        case "FLV":
          return "flv";
      }
    }
  };

  // extract an audio data as Uint8Array from a movie.
  const extractAudio = (movie: Uint8Array): IMedia => {
    var media: IMedia;

    switch (detectMovieType(movie)) {
      case "swf":
        media = {
          type: "mp3",
          data: Swf.extractMp3(movie)
        };
        break;
      case "mp4":
        media = {
          type: "m4a",
          data: Mp4.extractAudio(movie)
        };
        break;
      case "flv":
        media = Flv.extractAudio(movie);
        break;
      default:
        throw new TypeError();
    }

    if (media.type === "aac") {
      media = {
        type: "m4a",
        data: Mp4.aacToM4a(media.data)
      };
    }

    return media;
  };

  // get a movie data from nicovideo.
  export const getMovie = async (params: IDownloadParams): Promise<IMedia> => {
    const movieURL = await getMovieURL(params.pageUrl);
    const x = loadMovie(movieURL);
    x.onProgress(params.xhrProgress);
    const movie = (await x.promise.then(
      params.xhrSuccess,
      params.xhrFail
    )) as Uint8Array;

    return {
      type: detectMovieType(movie),
      data: movie,
      name: params.pageTitle.split(VIDEO_TITLE_SAFIX)[0]
    };
  };

  // get a audio data from nicovideo.
  export const getAudio = async (params: IDownloadParams): Promise<IMedia> => {
    const movieUrl = await getMovieURL(params.pageUrl);
    const x = loadMovie(movieUrl);
    x.onProgress(params.xhrProgress);
    const movie = (await x.promise.then(
      params.xhrSuccess,
      params.xhrFail
    )) as Uint8Array;
    const media = extractAudio(movie);
    media.name = params.pageTitle.split(VIDEO_TITLE_SAFIX)[0];
    return media;
  };

  // if you visit the movie page, view the badge of pageAction.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (/^https?:\/\/www\.nicovideo\.jp\/watch\/(sm|nm)/.test(tab.url)) {
      chrome.pageAction.show(tabId);
    }
  });
}

(window as any).Background = Background;
