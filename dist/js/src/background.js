var Background;
(function (Background) {
    var getMovieURL = function (pageUrl) {
        var id = pageUrl.split('?')[0].split('/').pop();
        var xhr = new XMLHttpRequest();
        var d = Q.defer();

        xhr.open('GET', 'http://flapi.nicovideo.jp/api/getflv/' + id + (/^nm/.test(id) ? '?as3=1' : ''));
        xhr.send();
        xhr.onload = function (e) {
            return d.resolve(decodeURIComponent(/url=([^&]+)/.exec(xhr.responseText)[1]));
        };
        xhr.onerror = d.reject;
        xhr.onprogress = d.notify;

        return d.promise;
    };

    var loadMovie = function (movieUrl) {
        var xhr = new XMLHttpRequest();
        var d = Q.defer();

        xhr.open('GET', movieUrl);
        xhr.responseType = 'arraybuffer';
        xhr.send();
        xhr.onloadend = function (e) {
            return xhr.response && d.resolve(new Uint8Array(xhr.response));
        };
        xhr.onerror = d.reject;
        xhr.onprogress = d.notify;
        return d.promise;
    };

    var detectMovieType = function (movie) {
        var view = new Mp4.DataView2(movie);

        if (view.getString(4, 4) === 'ftyp') {
            return 'mp4';
        } else {
            switch (view.getString(0, 3)) {
                case 'FWS':
                case 'CWS':
                    return 'swf';
                case 'FLV':
                    return 'flv';
            }
        }
    };

    var extractAudio = function (movie) {
        var media;

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
            default:
                throw new TypeError();
        }

        if (media.type === 'aac') {
            media = {
                type: 'm4a',
                data: Mp4.aacToM4a(media.data)
            };
        }

        return media;
    };

    Background.getMovie = function (params) {
        return getMovieURL(params.pageUrl).then(loadMovie).then(params.xhrSuccess, params.xhrFail, params.xhrProgress).then(function (movie) {
            var type;
            var d = Q.defer();

            var media = {
                type: detectMovieType(movie),
                data: movie,
                name: params.pageTitle.split(Settings.VIDEO_TITLE_SAFIX)[0]
            };

            setTimeout(function (_) {
                return d.resolve(media);
            }, 0);
            return d.promise;
        });
    };

    Background.getAudio = function (params) {
        return getMovieURL(params.pageUrl).then(loadMovie).then(params.xhrSuccess, params.xhrFail, params.xhrProgress).then(function (movie) {
            var media = extractAudio(movie);
            var d = Q.defer();
            media.name = params.pageTitle.split(Settings.VIDEO_TITLE_SAFIX)[0];
            setTimeout(function (_) {
                return d.resolve(media);
            }, 0);
            return d.promise;
        });
    };

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (/^http:\/\/www\.nicovideo\.jp\/watch\/(sm|nm)/.test(tab.url)) {
            chrome.pageAction.show(tabId);
        }
    });
})(Background || (Background = {}));
//# sourceMappingURL=background.js.map
