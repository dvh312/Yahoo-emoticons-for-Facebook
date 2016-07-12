const debugging = true;

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

    reloadTabs();
    refreshIcon();
});


//FUNCTION + EVENTS

//Toggle button - Enable/Disable the extension
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.sync.set({
        'isEnabled': !isEnabled
    }, function(){
        debug("saved. isEnabled=" + isEnabled);
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
        debug("isEnabled updated");

        reloadTabs();
        refreshIcon();
    }
    if(changes.emoticons !== undefined){
        emoticons = changes.emoticons.newValue;
        debug("emoticons upadted");
    }
});

function refreshIcon(){
    
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
    debug("refreshed icon");
}

function reloadTabs(){
    debug("reloading tabs");
	chrome.tabs.query({url: ["https://www.facebook.com/*","https://www.messenger.com/*"]}, function(tabs){
		for (var i = 0; i < tabs.length; i++){
			chrome.tabs.reload(tabs[i].id);
		}
	});
}

function debug(str){
    if (debugging) {
        console.log(str);
    }
}