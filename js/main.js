function extractAAC(buffer, title){
    var mp4 = new Mp4(buffer);
    fs.update({
        size: 100 * 1024 * 1024,
        name: title + ".aac",
        data: mp4.extractAAC(),
        success: function(entry){
            chrome.tabs.create({
                url: entry.toURL('application/octet-stream')
            });
        }
    });
}

function extractMp3(buffer, title){
    var swf = new Swf(buffer);
    fs.update({
        size: 100 * 1024 * 1024,
        name: title + ".mp3",
        data: swf.extractMp3(),
        success: function(entry){
            chrome.tabs.create({
                url: entry.toURL('application/octet-stream')
            });
        }
    });
}

function extractAudio(){
    chrome.tabs.getSelected(null, function(tab){
        var url = getMovieURL(tab.url),
            fn;
        if(isSwf(tab.url.split("/").pop())){
            fn = extractMp3;
        } else {
            fn = extractAAC;
        }
        loadFileBuffer(url, function(buffer){
            fn(buffer, tab.title);
        });
    });
}

function isSwf(id){
    return id.slice(0, 2) === "nm";
}

function getMovieURL(pageURL){
    var id = pageURL.split("/").pop();
    var xhr2 = new XMLHttpRequest();
    xhr2.open("GET", pageURL, false);
    xhr2.send();
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://flapi.nicovideo.jp/api/getflv/" + id + (isSwf(id) ? "?as3=1" : ""), false);
    xhr.send();
    return decodeURIComponent(/url=([^&]+)/.exec(xhr.responseText)[1]);
}

chrome.contextMenus.removeAll(function(){
    chrome.contextMenus.create({
        title: "Extract a Audio File",
        contexts: ["all"],
        onclick: extractAudio
    });
});