/// <reference path="reference.ts" />

window.onload = e => {
  var movieButton = document.getElementById('movie');
  var audioButton = document.getElementById('audio');

  var getCurrentTab = (): Q.Promise<ITabInfo> => {
    var d = Q.defer<ITabInfo>();

    chrome.tabs.query({ active: true }, tabs => {
      var current = tabs[0];
      d.resolve({
        url: current.url,
        title: current.title
      });
    });

    return d.promise;
  };

  var createNotification = (): Q.Promise<chrome.windows.Window> => {
    var d = Q.defer<chrome.windows.Window>();
    chrome.windows.create({
      type: 'popup',
      url: '/html/downloadhelper.html',
      width: 512,
      height: 160
    }, d.resolve);
    return d.promise;
  };

  var exit = () => chrome.pageAction.hide(null);

  chrome.runtime.getBackgroundPage((_?: Window) => {
    var bg = (<any>_).Background;

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