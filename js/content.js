const idleTime = 250;
var timerId; //save the timerId to clear
var isEnabled; //storageVariable
var queue = []; //main queue to save works

(function () {
  refreshStorage();
})();

//FUNCTION + EVENTS

/**
 * refresh storage variables (local in content script)
 * @return {[type]} [description]
 */
function refreshStorage() {
  chrome.storage.sync.get(function (items) {
    isEnabled = items.isEnabled;
    main();
  });
}

function main() {
  if (isEnabled) {
    replace(getNeedElements(document.body)); //run once after document loaded
    htmlChangedListener(); //add listener for HTML changed

    //event call when these actions happen
    document.addEventListener("wheel", function (e) {
      resetTimer(idleTime);
    });
    document.addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        resetTimer(0);
      } else {
        resetTimer(idleTime);
      }
    });
    document.addEventListener("mousedown", function (e) {
      resetTimer(0);
    });
  }
}

function resetTimer(t) {
  clearTimeout(timerId);
  timerId = setTimeout(function () {
    doWork();
  }, t);
}

/**
 * do one work in the queue
 * @return {void} n/a
 */
function doWork() {
  if (queue.length > 0) {
    var addedNode = queue.pop();
    if (addedNode.nodeType === 1) { //element node
      replace(getNeedElements(addedNode));
    }
    resetTimer(0); //avoid freezing the browser
  }
}

/**
 * applied html listener, add changes to the queue
 * @return {void} n/a
 */
function htmlChangedListener() {
  //HTML changed eventListener
  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  var observer = new MutationObserver(function (mutations, observer) {
    // fired when a mutation occurs
    mutations.forEach(function (mutation) {
      queue.push.apply(queue, mutation.addedNodes);
    });
    resetTimer(idleTime);
  });

  // define what element should be observed by the observer
  // and what types of mutations trigger the callback
  observer.observe(document, {
    subtree: true,
    childList: true,
  });
}

/**
 * get elements with needed tag in the changed html
 * @param  {element} x htmlElement
 * @return {array}   all focused elements
 */
function getNeedElements(x) {
  var allElements = [];
  //chat popup
  allElements.push.apply(allElements, x.querySelectorAll("._5yl5 span"));
  //comments
  allElements.push.apply(allElements, x.querySelectorAll(".UFICommentBody span"));
  //posts
  allElements.push.apply(allElements, x.querySelectorAll("._5pbx p"));
  //MESSENGER.COM
  allElements.push.apply(allElements, x.querySelectorAll("._3oh-")); //only text
  allElements.push.apply(allElements, x.querySelectorAll("._3oh- span")); //img inline
  //all emoticons img
  allElements.push.apply(allElements, x.querySelectorAll("._1ift"));
  //all emotion on posts and comments
  allElements.push.apply(allElements, x.querySelectorAll("._47e3"));
  return allElements;
}

/**
 * replace
 * @param  {elements array} x focused elements
 * @return {void}   N/A
 */
function replace(x) {
  for (var i = 0; i < x.length; i++) {
    if (x[i].tagName === "IMG") {
      replaceImg(x[i]);
    } else if (x[i].classList.contains("_47e3")) {
      replaceCommentsEmo(x[i]);
    } else {
      replaceText(x[i]);
    }

    if (isBuzzElement(x[i])) {
      replaceBuzz(x[i]);
      tryBuzz();
    }
  }
}

/**
 * replace facebook emoticon show in an img tag with title = keyCombination (ex: :-D)
 * @param  {DOMelement} x focused element
 * @return {void}   N/A
 */
function replaceImg(element) {
  var idx = srcToIndex(element.src);
  if (idx !== null) {
    if (!element.parentNode.hasAttribute("aria-label")) { //do not change in picking table
      element.src = chrome.extension.getURL(emoticons[idx].src);
      element.style.height = "auto";
      element.style.width = "auto";
    }
  }
}

/**
 * given the original source of the image, check if the filename in that source
 * matchs with any emoticon fbImgFilename in the dictionary
 * @param  {string} src the source of the image
 * @return {int}     index of the emoticons in the dict, otherwise return null
 */
function srcToIndex(src) {
  var filename = getFilename(src);

  //only the first 25 emo may be replaced by facebook img
  for (var i = 0; i < 25; i++) {
    if (emoticons[i].fbImgFilename !== undefined) {
      if (emoticons[i].fbImgFilename === filename) {
        return i;
      }
    }
  }
  return null;
}

function replaceCommentsEmo(element) {
  var idx = titleToIndex(element.title);
  if (idx !== null) {
    if (idx === 0) { //smile emoticon :)
      if (element.nextSibling !== null) {
        if (element.nextSibling.nodeType === 3) {
          if (element.nextSibling.textContent[0] === ')') {
            element.removeAttribute("title");
            element.innerHTML = getImgHtml(emoticons[20].src); //replace with :)) emo
            element.nextSibling.textContent = element.nextSibling.textContent.substr(1);
            return;
          }
        }
      }
    }
    element.innerHTML = getImgHtml(emoticons[idx].src);
  }
}

function titleToIndex(title) {
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
 * replace keyCombination show as text to an img element
 * @param  {DOMelement} x focused element
 * @return {void}   N/A
 */
function replaceText(element) {
  if (valid(element)) {
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
            for (var w = 0; w < emoticons[k].keys.length; w++) {
              if (stop) break;
              //the emoticon need to be the prefix of the word
              if (words[word].indexOf(emoticons[k].keys[w]) === 0) {
                //only replace first instance
                words[word] = words[word].replace(emoticons[k].keys[w], getImgHtml(emoticons[k].src));
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
 * check if the element is valid by some condition:
 * do not change while typing
 * do not change facebook alternate name
 * skip if element do not contain text
 * skip if there aren't any textNode in childNodes
 * @param  {DOMelement} element processing element
 * @return {boolean}         return if the element is in good condition or not
 */
function valid(element) {
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

function getImgHtml(src) {
  return "<img src=\"" + chrome.extension.getURL(src) + "\" style=\"vertical-align: middle; height: auto; width: auto;\">";
}

function getFilename(fullPath) {
  var filename = fullPath.replace(/^.*[\\\/]/, '');
  return filename;
}

function isBuzzElement(element) {
  if (element.children.length === 0) { //only leaf node
    if (element.textContent.length > 0) { //must contain text
      if (element.textContent === "<ding>") {
        if (!element.hasAttribute("data-text")) { //attribute data-text show when typing,
          return true;
        }
      }
    }
  }
  return false;
}

function replaceBuzz(element) {
  element.style.color = "red";
  element.style.fontWeight = "bold";
  element.textContent = "BUZZ!!!";
}

function tryBuzz() {
  chrome.runtime.sendMessage({
    type: "buzz",
  }, function (response) {
  });
}

const emoticons = [
  {
    "fbImgFilename": "1f642.png",
    "title": "smile emoticon",
    "keys": [
      ":)",
      ":-)"
    ],
    "src": "images/YahooEmoticons/1.gif"
  },
  {
    "fbImgFilename": "1f61e.png",
    "title": "frown emoticon",
    "keys": [
      ":(",
      ":-("
    ],
    "src": "images/YahooEmoticons/2.gif"
  },
  {
    "fbImgFilename": "1f609.png",
    "title": "wink emoticon",
    "keys": [
      ";)",
      ";-)"
    ],
    "src": "images/YahooEmoticons/3.gif"
  },
  {
    "fbImgFilename": "1f600.png",
    "title": "grin emoticon",
    "keys": [
      ":D",
      ":d",
      ":-d",
      ":-D"
    ],
    "src": "images/YahooEmoticons/4.gif"
  },
  {
    "keys": [
      ";;)"
    ],
    "src": "images/YahooEmoticons/5.gif"
  },
  {
    "keys": [
      ">:D<",
      ">:d<"
    ],
    "src": "images/YahooEmoticons/6.gif"
  },
  {
    "fbImgFilename": "1f615.png",
    "title": "unsure emoticon",
    "keys": [
      ":-/",
      ":-\\"
    ],
    "src": "images/YahooEmoticons/7.gif"
  },
  {
    "keys": [
      ":x",
      ":X",
      ":-x",
      ":-X"
    ],
    "src": "images/YahooEmoticons/8.gif"
  },
  {
    "keys": [
      ":\">",
      ":$"
    ],
    "src": "images/YahooEmoticons/9.gif"
  },
  {
    "fbImgFilename": "1f61b.png",
    "title": "tongue emoticon",
    "keys": [
      ":P",
      ":p",
      ":-p",
      ":-P"
    ],
    "src": "images/YahooEmoticons/10.gif"
  },
  {
    "fbImgFilename": "1f617.png",
    "title": "kiss emoticon",
    "keys": [
      ":-*",
      ":*"
    ],
    "src": "images/YahooEmoticons/11.gif"
  },
  {
    "keys": [
      "=(("
    ],
    "src": "images/YahooEmoticons/12.gif"
  },
  {
    "fbImgFilename": "1f62e.png",
    "title": "gasp emoticon",
    "keys": [
      ":-O",
      ":-o",
      ":o",
      ":O"
    ],
    "src": "images/YahooEmoticons/13.gif"
  },
  {
    "fbImgFilename": "1f621.png",
    "title": "upset emoticon",
    "keys": [
      "X(",
      "x(",
      "x-(",
      "X-(",
      ":@"
    ],
    "src": "images/YahooEmoticons/14.gif"
  },
  {
    "keys": [
      ":>",
      ":->"
    ],
    "src": "images/YahooEmoticons/15.gif"
  },
  {
    "fbImgFilename": "1f60e.png",
    "title": "glasses emoticon",
    "keys": [
      "B-)",
      "b-)",
      "b)",
      "B)"
    ],
    "src": "images/YahooEmoticons/16.gif"
  },
  {
    "keys": [
      ":-S",
      ":-s",
      ":s",
      ":-S"
    ],
    "src": "images/YahooEmoticons/17.gif"
  },
  {
    "keys": [
      "#:-S",
      "#:-s"
    ],
    "src": "images/YahooEmoticons/18.gif"
  },
  {
    "keys": [
      ">:)"
    ],
    "src": "images/YahooEmoticons/19.gif"
  },
  {
    "keys": [
      ":((",
      ":-(("
    ],
    "src": "images/YahooEmoticons/20.gif"
  },
  {
    "keys": [
      ":))",
      ":-))"
    ],
    "src": "images/YahooEmoticons/21.gif"
  },
  {
    "fbImgFilename": "1f610.png",
    "keys": [
      ":|",
      ":-|"
    ],
    "src": "images/YahooEmoticons/22.gif"
  },
  {
    "keys": [
      "/:)",
      "/:-)"
    ],
    "src": "images/YahooEmoticons/23.gif"
  },
  {
    "keys": [
      "=))"
    ],
    "src": "images/YahooEmoticons/24.gif"
  },
  {
    "fbImgFilename": "1f607.png",
    "title": "angel emoticon",
    "keys": [
      "O:-)",
      "o:-)",
      "O:)",
      "o:)"
    ],
    "src": "images/YahooEmoticons/25.gif"
  },
  {
    "keys": [
      ":-B",
      ":-b",
      ":b",
      ":B"
    ],
    "src": "images/YahooEmoticons/26.gif"
  },
  {
    "keys": [
      "=;"
    ],
    "src": "images/YahooEmoticons/27.gif"
  },
  {
    "keys": [
      "I-)",
      "i-)"
    ],
    "src": "images/YahooEmoticons/28.gif"
  },
  {
    "keys": [
      "8-|"
    ],
    "src": "images/YahooEmoticons/29.gif"
  },
  {
    "keys": [
      "L-)",
      "l-)"
    ],
    "src": "images/YahooEmoticons/30.gif"
  },
  {
    "keys": [
      ":-&"
    ],
    "src": "images/YahooEmoticons/31.gif"
  },
  {
    "keys": [
      ":-$"
    ],
    "src": "images/YahooEmoticons/32.gif"
  },
  {
    "keys": [
      "[-("
    ],
    "src": "images/YahooEmoticons/33.gif"
  },
  {
    "keys": [
      ":O)",
      ":o)"
    ],
    "src": "images/YahooEmoticons/34.gif"
  },
  {
    "keys": [
      "8-}"
    ],
    "src": "images/YahooEmoticons/35.gif"
  },
  {
    "keys": [
      "<:-P",
      "<:-p"
    ],
    "src": "images/YahooEmoticons/36.gif"
  },
  {
    "keys": [
      "(:|"
    ],
    "src": "images/YahooEmoticons/37.gif"
  },
  {
    "keys": [
      "=P~",
      "=p~"
    ],
    "src": "images/YahooEmoticons/38.gif"
  },
  {
    "keys": [
      ":-?"
    ],
    "src": "images/YahooEmoticons/39.gif"
  },
  {
    "keys": [
      "#-o",
      "#-O"
    ],
    "src": "images/YahooEmoticons/40.gif"
  },
  {
    "keys": [
      "=D>",
      "=d>"
    ],
    "src": "images/YahooEmoticons/41.gif"
  },
  {
    "keys": [
      ":-SS",
      ":-ss"
    ],
    "src": "images/YahooEmoticons/42.gif"
  },
  {
    "keys": [
      "@-)"
    ],
    "src": "images/YahooEmoticons/43.gif"
  },
  {
    "keys": [
      ":^o",
      ":^O"
    ],
    "src": "images/YahooEmoticons/44.gif"
  },
  {
    "keys": [
      ":-w",
      ":-W"
    ],
    "src": "images/YahooEmoticons/45.gif"
  },
  {
    "keys": [
      ":-<"
    ],
    "src": "images/YahooEmoticons/46.gif"
  },
  {
    "keys": [
      ">:P",
      ">:p"
    ],
    "src": "images/YahooEmoticons/47.gif"
  },
  {
    "keys": [
      "<):)"
    ],
    "src": "images/YahooEmoticons/48.gif"
  },
  {
    "keys": [
      ":@)"
    ],
    "src": "images/YahooEmoticons/49.gif"
  },
  {
    "keys": [
      "3:-O",
      "3:-o"
    ],
    "src": "images/YahooEmoticons/50.gif"
  },
  {
    "keys": [
      ":(|)"
    ],
    "src": "images/YahooEmoticons/51.gif"
  },
  {
    "keys": [
      "~:>"
    ],
    "src": "images/YahooEmoticons/52.gif"
  },
  {
    "keys": [
      "@};-"
    ],
    "src": "images/YahooEmoticons/53.gif"
  },
  {
    "keys": [
      "%%-"
    ],
    "src": "images/YahooEmoticons/54.gif"
  },
  {
    "keys": [
      "**=="
    ],
    "src": "images/YahooEmoticons/55.gif"
  },
  {
    "keys": [
      "(~~)"
    ],
    "src": "images/YahooEmoticons/56.gif"
  },
  {
    "keys": [
      "~O)",
      "~o)"
    ],
    "src": "images/YahooEmoticons/57.gif"
  },
  {
    "keys": [
      "*-:)"
    ],
    "src": "images/YahooEmoticons/58.gif"
  },
  {
    "keys": [
      "8-X",
      "8-x"
    ],
    "src": "images/YahooEmoticons/59.gif"
  },
  {
    "keys": [
      "=:)"
    ],
    "src": "images/YahooEmoticons/60.gif"
  },
  {
    "keys": [
      ">-)"
    ],
    "src": "images/YahooEmoticons/61.gif"
  },
  {
    "keys": [
      ":-L",
      ":-l"
    ],
    "src": "images/YahooEmoticons/62.gif"
  },
  {
    "keys": [
      "[-O<",
      "[-o<"
    ],
    "src": "images/YahooEmoticons/63.gif"
  },
  {
    "keys": [
      "$-)"
    ],
    "src": "images/YahooEmoticons/64.gif"
  },
  {
    "keys": [
      ":-\""
    ],
    "src": "images/YahooEmoticons/65.gif"
  },
  {
    "keys": [
      "b-(",
      "B-("
    ],
    "src": "images/YahooEmoticons/66.gif"
  },
  {
    "keys": [
      ":)>-"
    ],
    "src": "images/YahooEmoticons/67.gif"
  },
  {
    "keys": [
      "[-X",
      "[-x"
    ],
    "src": "images/YahooEmoticons/68.gif"
  },
  {
    "keys": [
      "\\:D/",
      "\\:d/"
    ],
    "src": "images/YahooEmoticons/69.gif"
  },
  {
    "keys": [
      ">:/"
    ],
    "src": "images/YahooEmoticons/70.gif"
  },
  {
    "keys": [
      ";))"
    ],
    "src": "images/YahooEmoticons/71.gif"
  },
  {
    "keys": [
      "o->",
      "O->"
    ],
    "src": "images/YahooEmoticons/72.gif"
  },
  {
    "keys": [
      "o=>",
      "O=>"
    ],
    "src": "images/YahooEmoticons/73.gif"
  },
  {
    "keys": [
      "o-+",
      "O-+"
    ],
    "src": "images/YahooEmoticons/74.gif"
  },
  {
    "keys": [
      "(%)"
    ],
    "src": "images/YahooEmoticons/75.gif"
  },
  {
    "keys": [
      ":-@"
    ],
    "src": "images/YahooEmoticons/76.gif"
  },
  {
    "keys": [
      "^:)^"
    ],
    "src": "images/YahooEmoticons/77.gif"
  },
  {
    "keys": [
      ":-j",
      ":-J"
    ],
    "src": "images/YahooEmoticons/78.gif"
  },
  {
    "keys": [
      "(*)"
    ],
    "src": "images/YahooEmoticons/79.gif"
  },
  {
    "keys": [
      ":)]"
    ],
    "src": "images/YahooEmoticons/100.gif"
  },
  {
    "keys": [
      ":-c",
      ":-C"
    ],
    "src": "images/YahooEmoticons/101.gif"
  },
  {
    "keys": [
      "~X(",
      "~x("
    ],
    "src": "images/YahooEmoticons/102.gif"
  },
  {
    "keys": [
      ":-h",
      ":-H"
    ],
    "src": "images/YahooEmoticons/103.gif"
  },
  {
    "keys": [
      ":-t",
      ":-T"
    ],
    "src": "images/YahooEmoticons/104.gif"
  },
  {
    "keys": [
      "8->"
    ],
    "src": "images/YahooEmoticons/105.gif"
  },
  {
    "keys": [
      ":-??"
    ],
    "src": "images/YahooEmoticons/106.gif"
  },
  {
    "keys": [
      "%-("
    ],
    "src": "images/YahooEmoticons/107.gif"
  },
  {
    "keys": [
      ":o3",
      ":O3"
    ],
    "src": "images/YahooEmoticons/108.gif"
  },
  {
    "keys": [
      "X_X",
      "x_x"
    ],
    "src": "images/YahooEmoticons/109.gif"
  },
  {
    "keys": [
      ":!!"
    ],
    "src": "images/YahooEmoticons/110.gif"
  },
  {
    "keys": [
      "\\m/",
      "\\M/"
    ],
    "src": "images/YahooEmoticons/111.gif"
  },
  {
    "keys": [
      ":-q",
      ":-Q"
    ],
    "src": "images/YahooEmoticons/112.gif"
  },
  {
    "keys": [
      ":-bd",
      ":-BD"
    ],
    "src": "images/YahooEmoticons/113.gif"
  },
  {
    "keys": [
      "^#(^"
    ],
    "src": "images/YahooEmoticons/114.gif"
  },
  {
    "keys": [
      ":bz",
      ":BZ"
    ],
    "src": "images/YahooEmoticons/115.gif"
  },
  {
    "keys": [
      "~^o^~",
      "~^O^~"
    ],
    "src": "images/YahooEmoticons/116.gif"
  },
  {
    "keys": [
      "'@^@|||"
    ],
    "src": "images/YahooEmoticons/117.gif"
  },
  {
    "keys": [
      "[]---"
    ],
    "src": "images/YahooEmoticons/118.gif"
  },
  {
    "keys": [
      "^o^||3",
      "^O^||3"
    ],
    "src": "images/YahooEmoticons/119.gif"
  },
  {
    "keys": [
      ":-(||>"
    ],
    "src": "images/YahooEmoticons/120.gif"
  },
  {
    "keys": [
      "'+_+"
    ],
    "src": "images/YahooEmoticons/121.gif"
  },
  {
    "keys": [
      ":::^^:::"
    ],
    "src": "images/YahooEmoticons/122.gif"
  },
  {
    "keys": [
      "o|^_^|o",
      "O|^_^|O"
    ],
    "src": "images/YahooEmoticons/123.gif"
  },
  {
    "keys": [
      ":puke!",
      ":PUKE!"
    ],
    "src": "images/YahooEmoticons/124.gif"
  },
  {
    "keys": [
      "o|\\~",
      "O|\\~"
    ],
    "src": "images/YahooEmoticons/125.gif"
  },
  {
    "keys": [
      "o|:-)",
      "O|:-)"
    ],
    "src": "images/YahooEmoticons/126.gif"
  },
  {
    "keys": [
      ":(fight)",
      ":(FIGHT)"
    ],
    "src": "images/YahooEmoticons/127.gif"
  },
  {
    "keys": [
      "%*-{"
    ],
    "src": "images/YahooEmoticons/128.gif"
  },
  {
    "keys": [
      "%||:-{"
    ],
    "src": "images/YahooEmoticons/129.gif"
  },
  {
    "keys": [
      "&[]"
    ],
    "src": "images/YahooEmoticons/130.gif"
  },
  {
    "keys": [
      ":(tv)",
      ":(TV)"
    ],
    "src": "images/YahooEmoticons/131.gif"
  },
  {
    "keys": [
      "?@_@?"
    ],
    "src": "images/YahooEmoticons/132.gif"
  },
  {
    "keys": [
      ":->~~"
    ],
    "src": "images/YahooEmoticons/133.gif"
  },
  {
    "keys": [
      "'@-@"
    ],
    "src": "images/YahooEmoticons/134.gif"
  },
  {
    "keys": [
      ":(game)",
      ":(GAME)"
    ],
    "src": "images/YahooEmoticons/135.gif"
  },
  {
    "keys": [
      ":-)/\\:-)"
    ],
    "src": "images/YahooEmoticons/136.gif"
  },
  {
    "keys": [
      "[]==[]"
    ],
    "src": "images/YahooEmoticons/137.gif"
  }
];
