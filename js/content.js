class Service {
  constructor() {
    this.checkEnabledStatus().then(isEnabled => {
      if (isEnabled) {
        this.filterElements(document);
        this.addMutationObserver(this.mutationsHandler.bind(this));
        this.addYahooEmoticonPickerButton();
      }
    });
  }

  /**
   * DOM changed listener.
   */
  addMutationObserver(callback) {
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    const observer = new MutationObserver(callback);
    observer.observe(document, {
      subtree: true,
      childList: true,
    });
  }

  addYahooEmoticonPickerButton(categoryElement) {
    if (!categoryElement){
      return;
    }

    // Prevent adding multiple times because of mutations listening.
    if (categoryElement.querySelector('#yahooButton')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div id="yahooButton" class="_1uwx" role="presentation" data-hover="tooltip" data-tooltip-content="Yahoo!"><img class="_2560 _1ift img" src="' + chrome.extension.getURL('images/icon16.png') + '" alt=""></div>';

    // Added onClicked handler and switching logic.
    const yahooButton = wrapper.children[0];
    yahooButton.onclick = this.onYahooCategoryClicked.bind(this, yahooButton);
    for (const button of categoryElement.children) {
      button.addEventListener('click', this.onOtherCategoryClicked.bind(this, button, yahooButton));
    }

    categoryElement.appendChild(wrapper.children[0]);
  };

  onYahooCategoryClicked(yahooButton) {
    // Remove grey background on other button.
    for (const button of yahooButton.parentNode.children) {
      button.classList.remove('_1uwz');
    }
    yahooButton.classList.add('_1uwz'); // Add grey background on Yahoo button.
    this.showYahooEmojiTable();
  }

  onOtherCategoryClicked(otherButton, yahooButton) {
    this.hideYahooEmojiTable();
    yahooButton.classList.remove('_1uwz'); // Remove grey background on Yahoo button.
    otherButton.classList.add('_1uwz'); // Add grey background on the other button.
  }

  showYahooEmojiTable() {
    document.querySelector('table._3-s_.uiGrid._51mz > tbody:not(#yahooTable)').style.display = 'none'; // Hide normal table.
    let table = document.querySelector('#yahooTable');
    if (!table) {
      // Create Yahoo table if not exist.
      table = document.createElement('tbody');
      table.id = 'yahooTable';
      document.querySelector('table._3-s_.uiGrid._51mz').appendChild(table);

      // Populate emoji table.
      let currentRow = null;
      for (let i = 0; i < emoticons.length; i++) {
        if (i % 6 === 0) {
          // Create new row.
          currentRow = document.createElement('tr');
          currentRow.classList.add('_51mx');
          table.appendChild(currentRow);
        }

        // Add emoticon to the current row.
        const emoticonHtml = '<td class="_3-sy _51m-"><div class=" _4rlu"><div aria-label="Pick an Emoji" role="button" tabindex="1" class=""><img class="_1lih _1ift _1ifu img" style="width: 32px; height: auto" src="' + chrome.extension.getURL(emoticons[i].src) + '" alt="" style="margin: 0px;"></div></div></td>';
        currentRow.insertAdjacentHTML('beforeend', emoticonHtml);
      }
    } else {
      table.style.display = null; // Show Yahoo table.
    }
  }

  hideYahooEmojiTable() {
    document.querySelector('table._3-s_.uiGrid._51mz > tbody:not(#yahooTable)').style.display = null; // Show normal table.

    // Hide Yahoo table.
    const yahooTable = document.querySelector('#yahooTable');
    if (yahooTable) {
      yahooTable.style.display = 'none';
    }
  }

  checkEnabledStatus() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(items => resolve(!!items.isEnabled));
    });
  }

  filterElements(origin) {
    // Some added nodes are text.
    if (!origin.querySelectorAll) {
      return;
    }

    this.addYahooEmoticonPickerButton(document.querySelector('div._1uwv'));

    // Messenger
    this.replace(origin.querySelectorAll('span._3oh-._58nk, span._3oh-._58nk > span'));

    // Facebook
    this.replace(origin.querySelectorAll('span._5yl5 > span, span._5yl5 > span > span')); // Chat popup without/with FB emoticons.
    this.replace(origin.querySelectorAll('div._5pbx.userContent._3576 > p, div._5pbx.userContent._3576 > div > p')); // Text in posts / shared posts.
    this.replace(origin.querySelectorAll('span.UFICommentBody > span')); // Text in comments.
    this.replace(origin.querySelectorAll('span._47e3._5mfr > img')); // Emoticons in posts and comments.

    // Both
    this.replace(origin.querySelectorAll('img._1ift.img:not(._1lih)')); // Emoticons images (excluded picking table).
  }

  getFilename(fullPath) {
    var filename = fullPath.replace(/^.*[\\\/]/, '');
    return filename;
  }

  getImgHtml(src) {
    return "<img src=\"" + chrome.extension.getURL(src) + "\" style=\"vertical-align: middle; height: auto; width: auto;\">";
  }

  mutationsHandler(mutations, observer) {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        this.filterElements(addedNode);
      }
    }
  }

  /**
   * replace
   * @param  {elements array} x focused elements
   * @return {void}   N/A
   */
  replace(x) {
    for (let i = 0; i < x.length; i++) {
      if (x[i].tagName === "IMG") {
        this.replaceImg(x[i]);
      } else {
        this.replaceText(x[i]);
      }
    }
  }

  /**
   * replace facebook emoticon show in an img tag with title = keyCombination (ex: :-D)
   * @param  {DOMelement} x focused element
   * @return {void}   N/A
   */
  replaceImg(element) {
    // Ignore icon on picking table.
    if (element.parentNode.className.includes('_1uwx')) {
      return;
    }

    const idx = this.srcToIndex(element.src);
    if (idx !== null) {
      element.src = chrome.extension.getURL(emoticons[idx].src);
      element.style.height = "auto";
      element.style.width = "auto";

      // In case :)) or =)) become <img of :)> and ), convert back to <img of :))>
      if (idx === 0) { //smile emoticon :)
        if (element.parentNode && element.parentNode.nextSibling !== null) {
          if (element.parentNode.nextSibling.nodeType === 3) {
            if (element.parentNode.nextSibling.textContent[0] === ')') {
              element.src = chrome.extension.getURL(emoticons[20].src); //replace with :)) emo
              element.parentNode.nextSibling.nodeValue = element.parentNode.nextSibling.nodeValue.substr(1);
            }
          }
        }
      }
    }
  }

  /**
   * replace keyCombination show as text to an img element
   * @param  {DOMelement} x focused element
   * @return {void}   N/A
   */
  replaceText(element) {
    if (this.valid(element)) {
      for (var j = 0; j < element.childNodes.length; j++) {
        //only process text child nodes
        if (element.childNodes[j].nodeType === 3 && element.childNodes[j].textContent.length > 0) {
          //initially, element have same content as text child node
          var words = element.childNodes[j].textContent.split(' ');
          var changed = false;
          //search for matched yahoo key
          for (var word = 0; word < words.length; word++) {
            var stop = false; //only change one emoticon in each word
            for (var k = emoticons.length - 1; k >= 0; k--) {
              if (stop) break;
              for (var w = 0; w < emoticons[k].patterns.length; w++) {
                if (stop) break;
                //the emoticon need to be the prefix of the word
                if (words[word].indexOf(emoticons[k].patterns[w]) === 0) {
                  //only replace first instance
                  words[word] = words[word].replace(emoticons[k].patterns[w], this.getImgHtml(emoticons[k].src));
                  changed = true;
                  stop = true;
                }
              }
            }
          }

          var newHTML = words.join(' ');
          //replace text node by element node with updated yahoo emo
          if (changed) {
            //create new element, ready to replace the child node
            var newElement = document.createElement("SPAN");
            element.replaceChild(newElement, element.childNodes[j]);

            //replace temp span element with newHTML (text and img nodes)
            element.childNodes[j].outerHTML = newHTML;
            //Note: =)):))=)) still works because after updating the HTML,
            //:))=)) textnode will be catched again by the listener, then =))
          }
        }
      }
    }
  }

  /**
   * given the original source of the image, check if the filename in that source
   * matchs with any emoticon fbImgFilename in the dictionary
   * @param  {string} src the source of the image
   * @return {int}     index of the emoticons in the dict, otherwise return null
   */
  srcToIndex(src) {
    var filename = this.getFilename(src);
    //only the first 40 emo may be replaced by facebook img
    for (var i = 0; i < 40; i++) {
      if (emoticons[i].fbImgFilename && emoticons[i].fbImgFilename.includes(filename)) {
        return i;
      }
    }
    return null;
  }

  titleToIndex(title) {
    //only the first 25 emo may be replaced by facebook emo in comments
    for (var i = 0; i < 25; i++) {
      if (emoticons[i].title !== undefined) {
        if (emoticons[i].title === title) {
          return i;
        }
      }
    }
    return null;
  }

  /**
   * check if the element is valid by some condition:
   * do not change while typing
   * do not change facebook alternate name
   * skip if element do not contain text
   * skip if there aren't any textNode in childNodes
   * @param  {DOMelement} element processing element
   * @return {boolean}         return if the element is in good condition or not
   */
  valid(element) {
    if (element.textContent.length > 0) { //have text in subtree
      if (element.childNodes.length > element.children.length) { //contains text, comment nodes
        if (!element.hasAttribute("data-text")) { //attribute data-text show when typing,
          if (!element.classList.contains("alternate_name")) { //prevent change the alt name
            return true;
          }
        }
      }
    }
    return false;
  }
}

const service = new Service();
const emoticons = [
  {
    "fbImgFilename": ["1f642.png"],
    "patterns": [
      ":)",
      ":-)"
    ],
    "src": "images/YahooEmoticons/1.gif"
  },
  {
    "fbImgFilename": ["1f641.png", "1f61e.png"],
    "patterns": [
      ":(",
      ":-("
    ],
    "src": "images/YahooEmoticons/2.gif"
  },
  {
    "fbImgFilename": ["1f609.png"],
    "patterns": [
      ";)",
      ";-)"
    ],
    "src": "images/YahooEmoticons/3.gif"
  },
  {
    "fbImgFilename": ["1f600.png", "1f603.png"],
    "patterns": [
      ":D",
      ":d",
      ":-d",
      ":-D"
    ],
    "src": "images/YahooEmoticons/4.gif"
  },
  {
    "patterns": [
      ";;)"
    ],
    "src": "images/YahooEmoticons/5.gif"
  },
  {
    "patterns": [
      ">:D<",
      ">:d<"
    ],
    "src": "images/YahooEmoticons/6.gif"
  },
  {
    "fbImgFilename": ["1f615.png"],
    "patterns": [
      ":-/",
      ":-\\"
    ],
    "src": "images/YahooEmoticons/7.gif"
  },
  {
    "patterns": [
      ":x",
      ":X",
      ":-x",
      ":-X"
    ],
    "src": "images/YahooEmoticons/8.gif"
  },
  {
    "patterns": [
      ":\">",
      ":$"
    ],
    "src": "images/YahooEmoticons/9.gif"
  },
  {
    "fbImgFilename": ["1f61b.png"],
    "patterns": [
      ":P",
      ":p",
      ":-p",
      ":-P"
    ],
    "src": "images/YahooEmoticons/10.gif"
  },
  {
    "fbImgFilename": ["1f617.png", "1f618.png"],
    "patterns": [
      ":-*",
      ":*"
    ],
    "src": "images/YahooEmoticons/11.gif"
  },
  {
    "patterns": [
      "=(("
    ],
    "src": "images/YahooEmoticons/12.gif"
  },
  {
    "fbImgFilename": ["1f62e.png"],
    "patterns": [
      ":-O",
      ":-o",
      ":o",
      ":O"
    ],
    "src": "images/YahooEmoticons/13.gif"
  },
  {
    "fbImgFilename": ["1f621.png"],
    "patterns": [
      "X(",
      "x(",
      "x-(",
      "X-(",
      ":@"
    ],
    "src": "images/YahooEmoticons/14.gif"
  },
  {
    "patterns": [
      ":>",
      ":->"
    ],
    "src": "images/YahooEmoticons/15.gif"
  },
  {
    "fbImgFilename": ["1f913.png", "1f60e.png"],
    "patterns": [
      "B-)",
      "b-)",
      "b)",
      "B)"
    ],
    "src": "images/YahooEmoticons/16.gif"
  },
  {
    "patterns": [
      ":-S",
      ":-s",
      ":s",
      ":-S"
    ],
    "src": "images/YahooEmoticons/17.gif"
  },
  {
    "patterns": [
      "#:-S",
      "#:-s"
    ],
    "src": "images/YahooEmoticons/18.gif"
  },
  {
    "patterns": [
      ">:)"
    ],
    "src": "images/YahooEmoticons/19.gif"
  },
  {
    "patterns": [
      ":((",
      ":-(("
    ],
    "src": "images/YahooEmoticons/20.gif"
  },
  {
    "patterns": [
      ":))",
      ":-))"
    ],
    "src": "images/YahooEmoticons/21.gif"
  },
  {
    "fbImgFilename": ["1f610.png"],
    "patterns": [
      ":|",
      ":-|"
    ],
    "src": "images/YahooEmoticons/22.gif"
  },
  {
    "patterns": [
      "/:)",
      "/:-)"
    ],
    "src": "images/YahooEmoticons/23.gif"
  },
  {
    "patterns": [
      "=))"
    ],
    "src": "images/YahooEmoticons/24.gif"
  },
  {
    "fbImgFilename": ["1f607.png"],
    "patterns": [
      "O:-)",
      "o:-)",
      "O:)",
      "o:)"
    ],
    "src": "images/YahooEmoticons/25.gif"
  },
  {
    "patterns": [
      ":-B",
      ":-b",
      ":b",
      ":B"
    ],
    "src": "images/YahooEmoticons/26.gif"
  },
  {
    "patterns": [
      "=;"
    ],
    "src": "images/YahooEmoticons/27.gif"
  },
  {
    "patterns": [
      "I-)",
      "i-)"
    ],
    "src": "images/YahooEmoticons/28.gif"
  },
  {
    "patterns": [
      "8-|"
    ],
    "src": "images/YahooEmoticons/29.gif"
  },
  {
    "patterns": [
      "L-)",
      "l-)"
    ],
    "src": "images/YahooEmoticons/30.gif"
  },
  {
    "patterns": [
      ":-&"
    ],
    "src": "images/YahooEmoticons/31.gif"
  },
  {
    "patterns": [
      ":-$"
    ],
    "src": "images/YahooEmoticons/32.gif"
  },
  {
    "patterns": [
      "[-("
    ],
    "src": "images/YahooEmoticons/33.gif"
  },
  {
    "patterns": [
      ":O)",
      ":o)"
    ],
    "src": "images/YahooEmoticons/34.gif"
  },
  {
    "patterns": [
      "8-}"
    ],
    "src": "images/YahooEmoticons/35.gif"
  },
  {
    "patterns": [
      "<:-P",
      "<:-p"
    ],
    "src": "images/YahooEmoticons/36.gif"
  },
  {
    "patterns": [
      "(:|"
    ],
    "src": "images/YahooEmoticons/37.gif"
  },
  {
    "patterns": [
      "=P~",
      "=p~"
    ],
    "src": "images/YahooEmoticons/38.gif"
  },
  {
    "fbImgFilename": ["1f914.png"],
    "patterns": [
      ":-?"
    ],
    "src": "images/YahooEmoticons/39.gif"
  },
  {
    "patterns": [
      "#-o",
      "#-O"
    ],
    "src": "images/YahooEmoticons/40.gif"
  },
  {
    "patterns": [
      "=D>",
      "=d>"
    ],
    "src": "images/YahooEmoticons/41.gif"
  },
  {
    "patterns": [
      ":-SS",
      ":-ss"
    ],
    "src": "images/YahooEmoticons/42.gif"
  },
  {
    "patterns": [
      "@-)"
    ],
    "src": "images/YahooEmoticons/43.gif"
  },
  {
    "patterns": [
      ":^o",
      ":^O"
    ],
    "src": "images/YahooEmoticons/44.gif"
  },
  {
    "patterns": [
      ":-w",
      ":-W"
    ],
    "src": "images/YahooEmoticons/45.gif"
  },
  {
    "patterns": [
      ":-<"
    ],
    "src": "images/YahooEmoticons/46.gif"
  },
  {
    "patterns": [
      ">:P",
      ">:p"
    ],
    "src": "images/YahooEmoticons/47.gif"
  },
  {
    "patterns": [
      "<):)"
    ],
    "src": "images/YahooEmoticons/48.gif"
  },
  {
    "patterns": [
      ":@)"
    ],
    "src": "images/YahooEmoticons/49.gif"
  },
  {
    "patterns": [
      "3:-O",
      "3:-o"
    ],
    "src": "images/YahooEmoticons/50.gif"
  },
  {
    "patterns": [
      ":(|)"
    ],
    "src": "images/YahooEmoticons/51.gif"
  },
  {
    "patterns": [
      "~:>"
    ],
    "src": "images/YahooEmoticons/52.gif"
  },
  {
    "patterns": [
      "@};-"
    ],
    "src": "images/YahooEmoticons/53.gif"
  },
  {
    "patterns": [
      "%%-"
    ],
    "src": "images/YahooEmoticons/54.gif"
  },
  {
    "patterns": [
      "**=="
    ],
    "src": "images/YahooEmoticons/55.gif"
  },
  {
    "patterns": [
      "(~~)"
    ],
    "src": "images/YahooEmoticons/56.gif"
  },
  {
    "patterns": [
      "~O)",
      "~o)"
    ],
    "src": "images/YahooEmoticons/57.gif"
  },
  {
    "patterns": [
      "*-:)"
    ],
    "src": "images/YahooEmoticons/58.gif"
  },
  {
    "patterns": [
      "8-X",
      "8-x"
    ],
    "src": "images/YahooEmoticons/59.gif"
  },
  {
    "patterns": [
      "=:)"
    ],
    "src": "images/YahooEmoticons/60.gif"
  },
  {
    "patterns": [
      ">-)"
    ],
    "src": "images/YahooEmoticons/61.gif"
  },
  {
    "patterns": [
      ":-L",
      ":-l"
    ],
    "src": "images/YahooEmoticons/62.gif"
  },
  {
    "patterns": [
      "[-O<",
      "[-o<"
    ],
    "src": "images/YahooEmoticons/63.gif"
  },
  {
    "patterns": [
      "$-)"
    ],
    "src": "images/YahooEmoticons/64.gif"
  },
  {
    "patterns": [
      ":-\""
    ],
    "src": "images/YahooEmoticons/65.gif"
  },
  {
    "patterns": [
      "b-(",
      "B-("
    ],
    "src": "images/YahooEmoticons/66.gif"
  },
  {
    "patterns": [
      ":)>-"
    ],
    "src": "images/YahooEmoticons/67.gif"
  },
  {
    "patterns": [
      "[-X",
      "[-x"
    ],
    "src": "images/YahooEmoticons/68.gif"
  },
  {
    "patterns": [
      "\\:D/",
      "\\:d/"
    ],
    "src": "images/YahooEmoticons/69.gif"
  },
  {
    "patterns": [
      ">:/"
    ],
    "src": "images/YahooEmoticons/70.gif"
  },
  {
    "patterns": [
      ";))"
    ],
    "src": "images/YahooEmoticons/71.gif"
  },
  {
    "patterns": [
      "o->",
      "O->"
    ],
    "src": "images/YahooEmoticons/72.gif"
  },
  {
    "patterns": [
      "o=>",
      "O=>"
    ],
    "src": "images/YahooEmoticons/73.gif"
  },
  {
    "patterns": [
      "o-+",
      "O-+"
    ],
    "src": "images/YahooEmoticons/74.gif"
  },
  {
    "patterns": [
      "(%)"
    ],
    "src": "images/YahooEmoticons/75.gif"
  },
  {
    "patterns": [
      ":-@"
    ],
    "src": "images/YahooEmoticons/76.gif"
  },
  {
    "patterns": [
      "^:)^"
    ],
    "src": "images/YahooEmoticons/77.gif"
  },
  {
    "patterns": [
      ":-j",
      ":-J"
    ],
    "src": "images/YahooEmoticons/78.gif"
  },
  {
    "patterns": [
      "(*)"
    ],
    "src": "images/YahooEmoticons/79.gif"
  },
  {
    "patterns": [
      ":)]"
    ],
    "src": "images/YahooEmoticons/100.gif"
  },
  {
    "patterns": [
      ":-c",
      ":-C"
    ],
    "src": "images/YahooEmoticons/101.gif"
  },
  {
    "patterns": [
      "~X(",
      "~x("
    ],
    "src": "images/YahooEmoticons/102.gif"
  },
  {
    "patterns": [
      ":-h",
      ":-H"
    ],
    "src": "images/YahooEmoticons/103.gif"
  },
  {
    "patterns": [
      ":-t",
      ":-T"
    ],
    "src": "images/YahooEmoticons/104.gif"
  },
  {
    "patterns": [
      "8->"
    ],
    "src": "images/YahooEmoticons/105.gif"
  },
  {
    "patterns": [
      ":-??"
    ],
    "src": "images/YahooEmoticons/106.gif"
  },
  {
    "patterns": [
      "%-("
    ],
    "src": "images/YahooEmoticons/107.gif"
  },
  {
    "patterns": [
      ":o3",
      ":O3"
    ],
    "src": "images/YahooEmoticons/108.gif"
  },
  {
    "patterns": [
      "X_X",
      "x_x"
    ],
    "src": "images/YahooEmoticons/109.gif"
  },
  {
    "patterns": [
      ":!!"
    ],
    "src": "images/YahooEmoticons/110.gif"
  },
  {
    "patterns": [
      "\\m/",
      "\\M/"
    ],
    "src": "images/YahooEmoticons/111.gif"
  },
  {
    "patterns": [
      ":-q",
      ":-Q"
    ],
    "src": "images/YahooEmoticons/112.gif"
  },
  {
    "patterns": [
      ":-bd",
      ":-BD"
    ],
    "src": "images/YahooEmoticons/113.gif"
  },
  {
    "patterns": [
      "^#(^"
    ],
    "src": "images/YahooEmoticons/114.gif"
  },
  {
    "patterns": [
      ":bz",
      ":BZ"
    ],
    "src": "images/YahooEmoticons/115.gif"
  },
  {
    "patterns": [
      "~^o^~",
      "~^O^~"
    ],
    "src": "images/YahooEmoticons/116.gif"
  },
  {
    "patterns": [
      "'@^@|||"
    ],
    "src": "images/YahooEmoticons/117.gif"
  },
  {
    "patterns": [
      "[]---"
    ],
    "src": "images/YahooEmoticons/118.gif"
  },
  {
    "patterns": [
      "^o^||3",
      "^O^||3"
    ],
    "src": "images/YahooEmoticons/119.gif"
  },
  {
    "patterns": [
      ":-(||>"
    ],
    "src": "images/YahooEmoticons/120.gif"
  },
  {
    "patterns": [
      "'+_+"
    ],
    "src": "images/YahooEmoticons/121.gif"
  },
  {
    "patterns": [
      ":::^^:::"
    ],
    "src": "images/YahooEmoticons/122.gif"
  },
  {
    "patterns": [
      "o|^_^|o",
      "O|^_^|O"
    ],
    "src": "images/YahooEmoticons/123.gif"
  },
  {
    "patterns": [
      ":puke!",
      ":PUKE!"
    ],
    "src": "images/YahooEmoticons/124.gif"
  },
  {
    "patterns": [
      "o|\\~",
      "O|\\~"
    ],
    "src": "images/YahooEmoticons/125.gif"
  },
  {
    "patterns": [
      "o|:-)",
      "O|:-)"
    ],
    "src": "images/YahooEmoticons/126.gif"
  },
  {
    "patterns": [
      ":(fight)",
      ":(FIGHT)"
    ],
    "src": "images/YahooEmoticons/127.gif"
  },
  {
    "patterns": [
      "%*-{"
    ],
    "src": "images/YahooEmoticons/128.gif"
  },
  {
    "patterns": [
      "%||:-{"
    ],
    "src": "images/YahooEmoticons/129.gif"
  },
  {
    "patterns": [
      "&[]"
    ],
    "src": "images/YahooEmoticons/130.gif"
  },
  {
    "patterns": [
      ":(tv)",
      ":(TV)"
    ],
    "src": "images/YahooEmoticons/131.gif"
  },
  {
    "patterns": [
      "?@_@?"
    ],
    "src": "images/YahooEmoticons/132.gif"
  },
  {
    "patterns": [
      ":->~~"
    ],
    "src": "images/YahooEmoticons/133.gif"
  },
  {
    "patterns": [
      "'@-@"
    ],
    "src": "images/YahooEmoticons/134.gif"
  },
  {
    "patterns": [
      ":(game)",
      ":(GAME)"
    ],
    "src": "images/YahooEmoticons/135.gif"
  },
  {
    "patterns": [
      ":-)/\\:-)"
    ],
    "src": "images/YahooEmoticons/136.gif"
  },
  {
    "patterns": [
      "[]==[]"
    ],
    "src": "images/YahooEmoticons/137.gif"
  }
];
