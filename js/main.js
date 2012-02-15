/**
 * author: Syu Kato, ukyo.web@gmail.com, @ukyo
 */


/**
 * Extract AAC from a movie.
 * 
 * @param {ArrayBuffer} buffer
 * @param {string} title
 */
function extractAAC(buffer, title){
	var mp4 = new Mp4(buffer);
	var data = mp4.extractAAC();
	downloadFile(data, title + ".aac");
}


/**
 * Extract mp3 from a swf movie.
 * 
 * @param {ArrayBuffer} buffer
 * @param {string} title
 */
function extractMp3FromSwf(buffer, title){
	var swf = new Swf(buffer);
	var data = swf.extractMp3();
	downloadFile(data, title + ".mp3");
}


/**
 * Extract mp3 from a flv movie.
 * 
 * @param {ArrayBuffer} buffer
 * @param {string} title
 */
function extractMp3FromFlv(buffer, title){
	var flv = new Flv(buffer);
	var data = flv.extractMp3();
	downloadFile(data, title + ".mp3");
}


/**
 * Create a dummy tab and download a file to download folder.
 * 
 * @param {Object} obj file's url and name.
 */
function downloadFile(data, filename){
	var obj = {url: webkitURL.createObjectURL(data), filename: filename};
	chrome.tabs.create({url: "../html/dummy.html", selected: false}, function(tab){
		chrome.tabs.sendRequest(tab.id, obj, function(response){
			console.log(response);
		});
	});
}


/**
 * Extract audio from movie.
 * If a type of movie is mp4, call function extractAAC.
 * Else if a type of movie is swf, call function extractMp3.
 */
function extractAudio(){
	chrome.tabs.getSelected(null, function(tab){
		try{
			loadFileBuffer(getMovieURL(tab.url), function(buffer){
				try{
					if(isSwf(tab.url.split("/").pop())) {
						extractMp3From(buffer, tab.title);
					} else {
						var bytes = new Uint8Array(buffer);
						if(bytes[0] === 70 && bytes[1] === 76 && bytes[2] === 86) {// FLV
							extractMp3FromFlv(buffer, tab.title);
						} else {
							extractAAC(buffer, tab.title);
						}
					}
				} catch (e) {
					onerror();
				}
			});
		} catch (e) {
			onerror();
		}
	});
}


/**
 * When to extract audio is failed, this function will be called.
 * This function displays a error message in notification.
 */
function onerror(){
	var notification = createNotification("Nico Audio Extractor", "To extract was failed.");
	notification.show();
	setTimeout(notification.cancel, 5000);
}


/**
 * @param {string} id
 * @return {boolean}
 */
function isSwf(id){
	return id.slice(0, 2) === "nm";
}


/**
 * Get a URL of movie data with nicovideo API.
 * 
 * @param {string} pageURL
 * @return {string} 動画データのURL
 */
function getMovieURL(pageURL){
	var id = pageURL.split("/").pop();
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://flapi.nicovideo.jp/api/getflv/" + id + (isSwf(id) ? "?as3=1" : ""), false);
	xhr.send();
	return decodeURIComponent(/url=([^&]+)/.exec(xhr.responseText)[1]);
}


/**
 * Show Context Menu when you see the nicovideo page.
 * 
 * @param {number} tabId
 * @param {Object} selectInfo
 * @param {Tab} tab
 */
function showMenu(tabId, selectInfo, tab){
	tab ? _showMenu(tab) : chrome.tabs.get(tabId, _showMenu);
}


/**
 * Implementation of showMenu.
 * 
 * @param {Tab} tab
 */
function _showMenu(tab){
	var rNico = /^https?:\/\/www.nicovideo\.jp\/watch.+$/;
	chrome.contextMenus.removeAll(function(){
		if(!rNico.test(tab.url)) return;
		chrome.contextMenus.create({
			title: "Extract Audio",
			contexts: ["all"],
			onclick: extractAudio
		});
	});
}


chrome.tabs.onUpdated.addListener(showMenu);
chrome.tabs.onSelectionChanged.addListener(showMenu)
