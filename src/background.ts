/// <reference path="reference.ts" />

module Background {

  // get a raw movie url with nicovideo api.
  var getMovieURL = (pageUrl: string): Q.Promise<string> => {
    var id = pageUrl.split('?')[0].split('/').pop();
    var xhr = new XMLHttpRequest;
    var d = Q.defer<string>();

    xhr.open('GET', 'http://flapi.nicovideo.jp/api/getflv/' + id + (/^nm/.test(id) ? '?as3=1' : ''));
    xhr.send();
    xhr.onload = e => d.resolve(decodeURIComponent(/url=([^&]+)/.exec(xhr.responseText)[1]));
    xhr.onerror = d.reject;
    xhr.onprogress = d.notify;

    return d.promise;
  }


  // load movie as Uint8Array.
  var loadMovie = (movieUrl: string): Q.Promise<Uint8Array> => {
    var xhr = new XMLHttpRequest;
    var d = Q.defer();

    xhr.open('GET', movieUrl);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    xhr.onloadend = e => xhr.response && d.resolve(new Uint8Array(xhr.response));
    xhr.onerror = d.reject;
    xhr.onprogress = d.notify;
    return d.promise;
  };


  // detect movie type (mp4, swf or flv).
  var detectMovieType = (movie: Uint8Array): string => {
    var view = new Mp4.DataView2(movie);

    if (view.getString(4, 4) === 'ftyp') {
      return 'mp4';
    } else {
      switch (view.getString(0, 3)) {
        case 'FWS': case 'CWS':
          return 'swf';
        case 'FLV':
          return 'flv';
      }
    }
  };


  // extract an audio data as Uint8Array from a movie.
  var extractAudio = (movie: Uint8Array): IMedia => {
    var media: IMedia;

    switch (detectMovieType(movie)) {
      case 'swf':
        media = {
          type: 'mp3',
          data: Swf.extractMp3(movie)
        };
        break;
      case 'mp4':
        media = {
          type: 'm4a',
          data: Mp4.extractAudio(movie)
        };
        break;
      case 'flv':
        media = Flv.extractAudio(movie);
        break;
      default: throw new TypeError();
    }

    if (media.type === 'aac') {
      media = {
        type: 'm4a',
        data: Mp4.aacToM4a(media.data)
      };
    }

    return media;
  };

  // get a movie data from nicovideo.
  export var getMovie = (params: IDownloadParams): Q.Promise<IMedia> => {
    return getMovieURL(params.pageUrl)
    .then(loadMovie)
    .then(params.xhrSuccess, params.xhrFail, params.xhrProgress)
    .then((movie: Uint8Array) => {
      var type: string;
      var d = Q.defer();

      var media = {
        type: detectMovieType(movie),
        data: movie,
        name: params.pageTitle.split(Settings.VIDEO_TITLE_SAFIX)[0]
      };

      setTimeout(_ => d.resolve(media), 0);
      return d.promise;
    });
  };


  // get a audio data from nicovideo.
  export var getAudio = (params: IDownloadParams): Q.Promise<IMedia> => {
    return getMovieURL(params.pageUrl)
    .then(loadMovie)
    .then(params.xhrSuccess, params.xhrFail, params.xhrProgress)
    .then((movie: Uint8Array) => {
      var media = extractAudio(movie);
      var d = Q.defer();
      media.name = params.pageTitle.split(Settings.VIDEO_TITLE_SAFIX)[0];
      setTimeout(_ => d.resolve(media), 0);
      return d.promise;
    });
  };


  // if you visit the movie page, view the badge of pageAction.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (/^http:\/\/www\.nicovideo\.jp\/watch\/(sm|nm)/.test(tab.url)) {
      chrome.pageAction.show(tabId);
    }
  });

}