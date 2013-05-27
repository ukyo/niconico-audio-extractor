window.onload = function (e) {
    chrome.runtime.getBackgroundPage(function (_) {
        var bg = (_).Background;
        var progressBar = document.querySelector('progress');
        var progressInfo = document.getElementById('info');
        var pageTitle = bg['pageTitle'];
        (bg['downloadType'] === 'movie' ? bg.getMovie : bg.getAudio)({
            pageTitle: bg['pageTitle'],
            pageUrl: bg['pageUrl'],
            xhrSuccess: function (movie) {
                progressBar.value = 100;
                progressInfo.innerText = 'Complete!';
                return movie;
            },
            xhrFail: function (e) {
                progressInfo.innerText = 'Error: ' + (e.target).status;
                return e;
            },
            xhrProgress: function (e) {
                progressBar.value = Math.floor(e.loaded / e.total * 100);
                progressInfo.innerText = 'Now Loading... ' + progressBar.value + '%';
            }
        }).then(function (media) {
            var a = document.createElement('a');
            var e = document.createEvent('MouseEvent');
            a.setAttribute('download', media.name + '.' + media.type);
            a.setAttribute('href', URL.createObjectURL(new Blob([
                media.data
            ])));
            e.initEvent('click', true, true);
            a.dispatchEvent(e);
        });
    });
};
//@ sourceMappingURL=downloadhelper.js.map
