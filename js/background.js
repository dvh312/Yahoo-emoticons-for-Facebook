//auto reload all facebook and messenger after installing
reloadTabsURL("https://www.facebook.com/*");
reloadTabsURL("https://www.messenger.com/*");

//initial the isEnable value
var isEnable = true;

//Toggle button - Enable/Disable the extension
chrome.browserAction.onClicked.addListener(function(tab) {

	isEnable = !isEnable;

    if (isEnable)
        chrome.browserAction.setIcon({
            path: "./images/icon.png"
        });
    else {
        chrome.browserAction.setIcon({
            path: "./images/iconblack.png"
        });
    }
    
	//auto reload all facebook and messenger page
    reloadTabsURL("https://www.facebook.com/*");
    reloadTabsURL("https://www.messenger.com/*");

});

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    sendResponse({isEnable: isEnable});

    //check if having BUZZ notification request
    if (request.showNotification){
        showBuzzNotification(request.senderName);
    }
});

function reloadTabsURL(queryUrl){
	chrome.tabs.query({url: queryUrl}, function(tabs){
		for (var i = 0; i < tabs.length; i++){
			chrome.tabs.reload(tabs[i].id);
		}
	});
}

function showBuzzNotification(senderName){
    chrome.notifications.create('buzz-notification',{   
        type: 'basic', 
        iconUrl: 'images/icon.png', 
        title: senderName, 
        message: "BUZZ!!!" 
    },
    function() {

    });
}
