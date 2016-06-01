//auto reload all facebook and messenger after installing
reloadTabsURL("https://www.facebook.com/*");
reloadTabsURL("https://www.messenger.com/*");

//turn off BUZZ
chrome.contextMenus.create({
    id: "toggle-buzz-contextMenu",
    title: "Turn off BUZZ",
    contexts:["all"],
    onclick: toggleBuzz,
});

//initial the isEnable value
var isEnable = true;
var buzzEnabled = true;

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
    if (request.buzzActivated){
        if (buzzEnabled){
            showBuzzNotification(request.senderName);
        }
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
        //play sound
        var buzzAudio = new Audio();
        buzzAudio.src = "sounds/buzz.mp3";
        buzzAudio.play();
    });
}

function toggleBuzz(){
    buzzEnabled = !buzzEnabled;
    if (buzzEnabled){
        chrome.contextMenus.update('toggle-buzz-contextMenu', {title: "Turn off BUZZ"});
    } else {
        chrome.contextMenus.update('toggle-buzz-contextMenu', {title: "Turn on BUZZ"});
    }
}
