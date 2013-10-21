window.onload = function (e) {
    var movieButton = document.getElementById('movie');
    var audioButton = document.getElementById('audio');

    var getCurrentTab = function () {
        var d = Q.defer();

        chrome.tabs.query({ active: true }, function (tabs) {
            var current = tabs[0];
            d.resolve({
                url: current.url,
                title: current.title
            });
        });

        return d.promise;
    };

    var createNotification = function () {
        var d = Q.defer();
        chrome.windows.create({
            type: 'popup',
            url: '/html/downloadhelper.html',
            width: 512,
            height: 160
        }, d.resolve);
        return d.promise;
    };

    var exit = function () {
        return chrome.pageAction.hide(null);
    };

    chrome.runtime.getBackgroundPage(function (_) {
        var bg = (_).Background;

        movieButton.onclick = function (e) {
            movieButton.onclick = null;
            audioButton.onclick = null;
            getCurrentTab().then(function (tabInfo) {
                bg['pageUrl'] = tabInfo.url;
                bg['pageTitle'] = tabInfo.title;
                bg['downloadType'] = 'movie';
            }).then(createNotification).then(exit);
        };

        audioButton.onclick = function (e) {
            movieButton.onclick = null;
            audioButton.onclick = null;
            getCurrentTab().then(function (tabInfo) {
                bg['pageUrl'] = tabInfo.url;
                bg['pageTitle'] = tabInfo.title;
                bg['downloadType'] = 'audio';
            }).then(createNotification).then(exit);
        };
    });
};
//# sourceMappingURL=page.js.map
