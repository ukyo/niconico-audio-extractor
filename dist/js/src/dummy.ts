/// <reference path="reference.ts" />

chrome.extension.onMessage.addListener((message, sender, sendResponse) => {
  var a = <HTMLAnchorElement>document.createElement('a');
  var e = <MouseEvent>document.createEvent('MouseEvent');

  a.setAttribute('download', message.filename);
  a.setAttribute('href', message.url);
  e.initEvent('click', true, true);
  a.dispatchEvent(e);
  sendResponse({});
  setTimeout(window.close, 3000);
});