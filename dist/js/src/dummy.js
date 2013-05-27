chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    var a = document.createElement('a');
    var e = document.createEvent('MouseEvent');
    a.setAttribute('download', message.filename);
    a.setAttribute('href', message.url);
    e.initEvent('click', true, true);
    a.dispatchEvent(e);
    sendResponse({
    });
    setTimeout(window.close, 3000);
});
//@ sourceMappingURL=dummy.js.map
