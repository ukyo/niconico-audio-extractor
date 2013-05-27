/// <reference path="reference.ts" />

window.onload = e => {
  var movieButton = document.getElementById('movie');
  var audioButton = document.getElementById('audio');

  var getCurrentTab = (): Qpromise => {
    var d = Q.defer();

    chrome.tabs.query({ active: true }, tabs => {
      var current = tabs[0];
      d.resolve({
        url: current.url,
        title: current.title
      });
    });

    return d.promise;
  };

  var createNotification = (): Qpromise => {
    var d = Q.defer();
    chrome.windows.create({
      type: 'popup',
      url: '/html/downloadhelper.html',
      width: 420,
      height: 160
    }, d.resolve);
    return d.promise;
  };

  var exit = () => chrome.pageAction.hide(null);

  chrome.runtime.getBackgroundPage(_ => {
    var bg = <Background>(<any>_).Background;

    movieButton.onclick = e => {
      movieButton.onclick = null;
      audioButton.onclick = null;
      getCurrentTab()
      .then((tabInfo: ITabInfo) => {
        bg['pageUrl'] = tabInfo.url;
        bg['pageTitle'] = tabInfo.title;
        bg['downloadType'] = 'movie';
      })
      .then(createNotification)
      .then(exit);
    };

    audioButton.onclick = e => {
      movieButton.onclick = null;
      audioButton.onclick = null;
      getCurrentTab()
      .then((tabInfo: ITabInfo) => {
        bg['pageUrl'] = tabInfo.url;
        bg['pageTitle'] = tabInfo.title;
        bg['downloadType'] = 'audio';
      })
      .then(createNotification)
      .then(exit);
    };
  });
};