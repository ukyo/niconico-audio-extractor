function eventListener(port){
    var progress = document.querySelector("progress");
    var info = document.getElementById("info");
    port.onMessage.addListener(function(msg){
        if(msg.err) {
            info.innerText = msg.err;
            return;
        }
        
        progress.value = ~~(msg.progress * 100);
        console.log(progress.value);
        if(progress.value < 100){
            info.innerText = "Now Loading... " + progress.value + "%";
        } else {
            info.innerText = "Complete!";
        }
    });
    chrome.extension.onConnect.removeListener(eventListener);
};

chrome.extension.onConnect.addListener(eventListener);