//initial the isEnable value
var isEnable = true;

//Toggle button - Enable/Disable the extension
chrome.browserAction.onClicked.addListener(function(tab) {

	isEnable = !isEnable;
	//set new icon
	if (!isEnable)
        alert("Please refresh your page.");
});

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {

    if (isEnable)
    	chrome.browserAction.setIcon({
            path: "./images/icon.png",
            tabId: sender.tab.id
        });
    else {
    	chrome.browserAction.setIcon({
            path: "./images/iconblack.png",
            tabId: sender.tab.id
        });
    }

    sendResponse({isEnable: isEnable});
});