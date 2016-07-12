const debugging = true; //turn print debug on or off
var isEnabled, emoticons; //storageVariable

refreshStorage();
setTimeout(main, 1000);

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

	    debug("Refreshed");
	    debug(isEnabled);
	    debug(emoticons);
	});
}

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.type === "refresh"){
    	refreshStorage();
		setTimeout(main, 1000);
		sendResponse({type: "ok"});
    }
});


function debug(str){
	if (debugging) {
		console.log(str);
	}
}