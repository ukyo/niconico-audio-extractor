/**
 * author: Syu Kato, ukyo.web@gmail.com, @ukyo
 */


/**
 * Extract AAC from movie.
 * 
 * @param {ArrayBuffer} buffer
 * @param {string} title
 */
function extractAAC(buffer, title){
	var mp4 = new Mp4(buffer);
	fs.update({
		size: 100 * 1024 * 1024,
		name: title + ".aac",
		data: mp4.extractAAC(),
		success: function(entry){
			downloadFile({url: entry.toURL('audio/aac'), filename: title + '.aac'});
		}
	});
}


/**
 * Extract mp3 from movie.
 * 
 * @param {ArrayBuffer} buffer
 * @param {string} title
 */
function extractMp3(buffer, title){
	var swf = new Swf(buffer);
	fs.update({
		size: 1024 * 1024 * 1024,
		name: title + ".mp3",
		data: swf.extractMp3(),
		success: function(entry){
			downloadFile({url: entry.toURL('audio/mp3'), filename: title + '.mp3'});
		}
	});
}


/**
 * Create a dummy tab and download a file to download folder.
 * 
 * @param {Object} obj file's url and name.
 */
function downloadFile(obj){
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
					(isSwf(tab.url.split("/").pop()) ? extractMp3 : extractAAC)(buffer, tab.title);
				} catch (e) {
					onerror();
				}
			});
		} catch (e) {
			onerror();
		}
	});
}


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
 * get a movie data url with nicovideo API.
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
