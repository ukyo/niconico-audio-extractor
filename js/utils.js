function loadFileBuffer(url, callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url);
	xhr.responseType = 'arraybuffer';
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4) {
			if(~~(xhr.status / 100) == 2) {
				callback.call(xhr, xhr.response);
			} else {
				throw 'Error: ' + xhr.status;
			}
		}
	};
	xhr.send();
}

function createNotification(title, body){
    return webkitNotifications.createNotification("../img/48.png", title, body);
}