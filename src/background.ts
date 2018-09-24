namespace Background {
  export const tabs: { [tabId: number]: string } = {};

  // if you visit the movie page, view the badge of pageAction.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (/^https?:\/\/www\.nicovideo\.jp\/watch\/(sm|nm)/.test(tab.url)) {
      chrome.pageAction.show(tabId);
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "GET_PLAYLIST_URL") {
      sendResponse(tabs[sender.tab.id]);
    }
  });

  chrome.webRequest.onCompleted.addListener(
    ev => {
      tabs[ev.tabId] = ev.url;
    },
    {
      urls: ["https://*.dmc.nico/*playlist.m3u8*"]
    }
  );

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
