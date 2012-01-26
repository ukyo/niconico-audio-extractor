function extractAAC(){
    chrome.tabs.getSelected(null, function(tab){
        var url = getMovieURL(tab.url);
        var mp4 = new Mp4(url);
        function loop(){
            if(mp4.complete){
                var blob = mp4.extractAAC();
                fs.update({
                    size: 100 * 1024 * 1024,
                    name: tab.title + ".aac",
                    data: blob,
                    success: function(entry){
                        chrome.tabs.create({
                            url: entry.toURL()
                        });
                    }
                })
            } else {
                setTimeout(loop, 10);
            }
        }
        loop();
    });
}

function getMovieURL(pageURL){
    var id = pageURL.split("/").pop();
    var xhr2 = new XMLHttpRequest();
    xhr2.open("GET", pageURL, false);
    xhr2.send();
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://flapi.nicovideo.jp/api/getflv/" + id, false);
    xhr.send();
    return decodeURIComponent(/url=([^&]+)/.exec(xhr.responseText)[1]);
}

chrome.contextMenus.removeAll(function(){
    chrome.contextMenus.create({
        title: "Extract a AAC File",
        contexts: ["all"],
        onclick: extractAAC
    });
});