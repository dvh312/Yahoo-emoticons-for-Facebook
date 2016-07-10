const debugging = true; //turn print debug on or off
var isEnabled, emoticons; //storageVariable

/**
 * refresh storage variables (local in content script)
 * @return {[type]} [description]
 */
function refreshStorage(){
	chrome.storage.sync.get(function (items){
	    isEnabled = items.isEnabled;
	    emoticons = items.emoticons;

	    debug("Refreshed" + isEnabled);
	});
}

// function main(){
// 	refreshStorage();
// 	setInterval(1000, function(){

// 	});
// }

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.type === "refresh"){
    	refreshStorage();
    }
});


function debug(str){
	if (debugging) {
		console.log(str + " (replace.js)");
	}
}