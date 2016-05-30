//initial the isEnable value
var isEnable = true;
chrome.storage.sync.set({"isEnable": true}, function () {
	if (chrome.runtime.error) {
		console.log("Runtime error");	
	}
});	

//Toggle button - Enable/Disable the extension
chrome.browserAction.onClicked.addListener(function(tab) {

	isEnable = !isEnable;
	//set new icon
	if (!isEnable){
		chrome.browserAction.setIcon({
            path: "./images/iconblack.png",
            tabId: tab.id
        });
	}
	else {
		chrome.browserAction.setIcon({
            path: "./images/icon.png",
            tabId: tab.id
        });
	}

	chrome.storage.sync.set({"isEnable": isEnable}, function () {
		if (chrome.runtime.error) {
			console.log("Runtime error");	
		}
	});	

	//auto reload all facebook and messenger page
    reloadTabsURL("https://www.facebook.com/*");
    reloadTabsURL("https://www.messenger.com/*");
});

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {

    if (request.isEnable)
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
});

function reloadTabsURL(queryUrl){
	chrome.tabs.query({url: queryUrl}, function(tabs){
		for (var i = 0; i < tabs.length; i++){
			chrome.tabs.reload(tabs[i].id);
		}
	});
}