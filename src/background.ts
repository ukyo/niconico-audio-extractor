namespace Background {
  // if you visit the movie page, view the badge of pageAction.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (/^https?:\/\/www\.nicovideo\.jp\/watch\/(sm|nm)/.test(tab.url)) {
      chrome.pageAction.show(tabId);
    }
  });

  export const extractMovie = () => {
    chrome.tabs.executeScript({
      file: "js/extractmovie.js"
    });
  };

  export const extractAudio = () => {
    chrome.tabs.executeScript({
      file: "js/extractaudio.js"
    });
  };
}

(window as any).Background = Background;
