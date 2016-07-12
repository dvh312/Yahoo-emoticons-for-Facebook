const debugging = true; //turn print debug on or off
var isEnabled, emoticons; //storageVariable

refreshStorage();
setTimeout(main, 1000);

//FUNCTION + EVENTS

function main(){
	if (isEnabled){
		debug("entering main");


	}
}

/**
 * refresh storage variables (local in content script)
 * @return {[type]} [description]
 */
function refreshStorage(){
	chrome.storage.sync.get(function (items){
	    isEnabled = items.isEnabled;
	    emoticons = items.emoticons;
	    debug("Refreshed. isEnabled=" + isEnabled);
	});
}

function getFilename(fullPath){
	var filename = fullPath.replace(/^.*[\\\/]/, '');
	return filename;
}

function debug(str){
	if (debugging) {
		console.log(str);
	}
}