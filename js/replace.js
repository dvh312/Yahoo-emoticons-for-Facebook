const debugging = true; //turn print debug on or off
var isEnabled, emoticons; //storageVariable
refreshStorage();
setTimeout(main, 1000);

//FUNCTION + EVENTS

function main(){
	if (debugging){
		var t0 = performance.now();
	}

	if (isEnabled){
		debug("entering main");
		var chatDock = $("#ChatTabsPagelet")[0];
		observer.observe(chatDock, config);
	}

	if (debugging){
		var t1 = performance.now();
		debug("Call to main took " + (t1 - t0) + " milliseconds.");
	}
}

// Create an observer instance
var observer = new MutationObserver(function( mutations ) {
	debug("dock changed");
	var chatBoxs = $(".conversation", chatDock);
	
});
// Configuration of the observer:
var config = { 
	childList: true, 
	subtree: true
};

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