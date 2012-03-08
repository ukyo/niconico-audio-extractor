function loadFileBuffer(url, callback){
	var xhr = new XMLHttpRequest(),
		notification = createHTMLNotification(),
		port;
	
	notification.show();
	xhr.open('GET', url);
	xhr.responseType = 'arraybuffer';
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4) {
			if(~~(xhr.status / 100) == 2) {
				port.postMessage({progress: 1});
				callback.call(xhr, xhr.response);
			} else {
				port.postMessage({err: 'Error: ' + xhr.statusText});
				throw 'Error: ' + xhr.statusText;
			}
			setTimeout(function(){
				notification.cancel();
			}, 1500);
			port.disconnect();
			port = null;
		}
	};
	xhr.onprogress = function(e){
		port = port || chrome.extension.connect({name: "progress"});
		port.postMessage({progress: e.loaded / e.total});
	};
	
	notification.onclose = function(){
		xhr.abort();
	};
	
	xhr.send();
}

function createNotification(title, body){
    return webkitNotifications.createNotification("../img/48.png", title, body);
}

function createHTMLNotification(){
    return webkitNotifications.createHTMLNotification("notification.html");
}