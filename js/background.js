const debugging = true;
reloadTabs();

//add all storageVariables to storage if it hasn't been done
chrome.storage.sync.get(function(items){
    if (items.isEnabled === undefined || items.emoticons === undefined){
        chrome.storage.sync.clear();
        chrome.storage.sync.set({
            'isEnabled': isEnabled,
            'emoticons': emoticons
        }, function(){
            debug("Set new storage.");
        });
    } else {
        isEnabled = items.isEnabled;
        emoticons = items.emoticons;
        debug("Get old storage.");
    }

    refresh();
});

//Toggle button - Enable/Disable the extension
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.sync.set({
        'isEnabled': !isEnabled
    }, function(){
        debug("enable status toggled: " + isEnabled);
    });
});

/** 
 * run after the storage updated
 * @param  {object} changes changed item (ex: changes.isEnabled)
 * @return {void}         N/A
 */
chrome.storage.onChanged.addListener(function(changes){
    if (changes.isEnabled !== undefined){
        isEnabled = changes.isEnabled.newValue;
    }
    if(changes.emoticons !== undefined){
        emoticons = changes.emoticons.newValue;
    }
    refresh();
});

/**
 * refresh icon, send update request to content script
 * @return {void} n/a
 */
function refresh(){
    iconToggle();
    sendStorageRequest();
}
function iconToggle(){
    debug("toggling icon");
    //toggle icon
    if (isEnabled){
        chrome.browserAction.setIcon({
            path: "./images/icon.png"
        });
    } else {
        chrome.browserAction.setIcon({
            path: "./images/iconblack.png"
        });
    }
}
function sendStorageRequest(){
    debug("sending storage request");
    //send refresh storage request
    chrome.tabs.query({url: ["https://www.facebook.com/*","https://www.messenger.com/*"]}, function(tabs){
        for (var i = 0; i < tabs.length; i++){
            chrome.tabs.sendMessage(tabs[i].id, {type: "refresh"}, function(response) {});
        }
    });
}
function reloadTabs(){
    debug("loading tabs");
	chrome.tabs.query({url: ["https://www.facebook.com/*","https://www.messenger.com/*"]}, function(tabs){
		for (var i = 0; i < tabs.length; i++){
			chrome.tabs.reload(tabs[i].id);
		}
	});
}
function debug(str){
    if (debugging) {
        console.log(str + " (background.js)");
    }
}