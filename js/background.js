class BackgroundManager {
  constructor() {
    this.isEnabled = true;

    this.initStorage();
    this.addToggleListener();
  }

  reloadTabs() {
    chrome.tabs.query({
      url: ['https://www.facebook.com/*', 'https://www.messenger.com/*']
    }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.reload(tab.id);
      }
    });
  }

  refreshIcon() {
    if (this.isEnabled) {
      chrome.browserAction.setIcon({
        path: './images/icon38.png'
      });
    } else {
      chrome.browserAction.setIcon({
        path: './images/iconGrey38.png'
      });
    }
  }

  /**
   * Toggle button - Enable/Disable the extension
   */
  addToggleListener() {
    chrome.browserAction.onClicked.addListener((tab) => {
      this.isEnabled = !this.isEnabled;
      this.refreshIcon();
      chrome.storage.sync.set({
        'isEnabled': this.isEnabled
      }, () => {
        this.reloadTabs();
      });
    });
  }

  initStorage() {
    chrome.storage.sync.get((items) => {
      if (items.isEnabled !== undefined) {
        this.isEnabled = items.isEnabled;
        this.reloadTabs();
        this.refreshIcon();
      } else {
        chrome.storage.sync.set({
          'isEnabled': this.isEnabled
        }, () => {
          this.reloadTabs();
          this.refreshIcon();
        });
      }
    });
  }
}

const backgroundManager = new BackgroundManager();
