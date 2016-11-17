const debugging = false; //turn print debug on or off
const idleTime = 250; //ms

var timerId; //save the timerId to clear
var isEnabled, emoticons; //storageVariable
var queue = []; //main queue to save works

(function(){
	refreshStorage();
})();

//FUNCTION + EVENTS

/**
 * refresh storage variables (local in content script)
 * @return {[type]} [description]
 */
function refreshStorage(){
	chrome.storage.sync.get(function (items){
	    isEnabled = items.isEnabled;
	    emoticons = items.emoticons;
	    debug("Refreshed. isEnabled=" + isEnabled);

	    main();
	});
}

function main(){
	if (isEnabled){
		debug("entering main");

		replace(getNeedElements(document.body)); //run once after document loaded
		htmlChangedListener(); //add listener for HTML changed

		//event call when these actions happen
		document.addEventListener("wheel", function(e){
			debug("scroll");
			resetTimer(idleTime);
		});
		document.addEventListener("keydown", function(e){
			if (e.keyCode === 13){
				debug("enter pressed");
				resetTimer(0);
			} else {
				debug("key pressed");
				resetTimer(idleTime);
			}
		});
		document.addEventListener("mousedown", function(e){
			debug("clicked");
			resetTimer(0);
		});
	}
}

function resetTimer(t){
	clearTimeout(timerId);
	timerId = setTimeout(function(){
		doWork();
	}, t);
}

/**
 * do one work in the queue
 * @return {void} n/a
 */
function doWork(){
	if (queue.length > 0){
		var addedNode = queue.pop();
		if (addedNode.nodeType === 1){ //element node
			replace(getNeedElements(addedNode));
		}
		resetTimer(0); //avoid freezing the browser
	}
}

/**
 * applied html listener, add changes to the queue
 * @return {void} n/a
 */
function htmlChangedListener(){
	//HTML changed eventListener
	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	var observer = new MutationObserver(function(mutations, observer) {
		// fired when a mutation occurs
		mutations.forEach(function(mutation){
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
function getNeedElements(x){
	var allElements = [];
	//chat popup
	allElements.push.apply(allElements, x.querySelectorAll("._5yl5 span"));
	//inbox
	allElements.push.apply(allElements, x.querySelectorAll("._38 span p"));
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
function replace(x){
	for (var i = 0; i < x.length; i++){
		if (x[i].tagName === "IMG") {
			replaceImg(x[i]);
		} else if (x[i].classList.contains("_47e3")){
			replaceCommentsEmo(x[i]);
		} else {
			replaceText(x[i]);
		}

		if (isBuzzElement(x[i])){
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
function replaceImg(element){
	var idx = srcToIndex(element.src);
	if (idx !== null){
		if (!element.parentNode.hasAttribute("aria-label")){ //do not change in picking table
			element.src = chrome.extension.getURL(emoticons[idx].src);
			element.style = "height: auto; width: auto;";
		}
	}
}

/**
 * given the original source of the image, check if the filename in that source
 * matchs with any emoticon fbImgFilename in the dictionary
 * @param  {string} src the source of the image
 * @return {int}     index of the emoticons in the dict, otherwise return null
 */
function srcToIndex(src){
	var filename = getFilename(src);

	//only the first 25 emo may be replaced by facebook img
	for (var i = 0; i < 25; i++){
		if (emoticons[i].fbImgFilename !== undefined){
			if (emoticons[i].fbImgFilename === filename){
				return i;
			}
		}
	}
	return null;
}

function replaceCommentsEmo(element){
	var idx = titleToIndex(element.title);
	if (idx !== null){
		element.innerHTML = getImgHtml(emoticons[idx].src);
	}
}

function titleToIndex(title){
	//only the first 25 emo may be replaced by facebook emo in comments
	for (var i = 0; i < 25; i++){
		if (emoticons[i].title !== undefined){
			if (emoticons[i].title === title){
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
function replaceText(element){
	if (valid(element)){
		for (var j = 0; j < element.childNodes.length; j++){
			//only process text child nodes
			if (element.childNodes[j].nodeType === 3 && element.childNodes[j].textContent.length > 0){
				//initially, element have same content as text child node
				var words = element.childNodes[j].textContent.split(' ');
				var changed = false;
				//search for matched yahoo key
				for (var word = 0; word < words.length; word++){
					var stop = false; //only change one emoticon in each word
					for (var k = emoticons.length - 1; k >= 0; k--){
						if (stop) break;
						for (var w = 0; w < emoticons[k].keys.length; w++){
							if (stop) break;
							//the emoticon need to be the prefix of the word
							if (words[word].indexOf(emoticons[k].keys[w]) === 0){
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
				if (changed){
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
function valid(element){
	if (element.textContent.length > 0){ //have text in subtree
		if (element.childNodes.length > element.children.length){ //contains text, comment nodes
			if (!element.hasAttribute("data-text")){ //attribute data-text show when typing,
				if (!element.classList.contains("alternate_name")){ //prevent change the alt name
					return true;
				}
			}
		}
	}
	return false;
}

function getImgHtml(src){
	return "<img src=\"" + chrome.extension.getURL(src) + "\" style=\"vertical-align: middle; height: auto; width: auto;\">";
}

function getFilename(fullPath){
	var filename = fullPath.replace(/^.*[\\\/]/, '');
	return filename;
}

function isBuzzElement(element){
	if (element.children.length === 0){ //only leaf node
		if (element.textContent.length > 0) { //must contain text
			if (element.textContent === "<ding>"){
				if (!element.hasAttribute("data-text")){ //attribute data-text show when typing,
					return true;
				}
			}
		}
	}
	return false;
}

function replaceBuzz(element){
	element.setAttribute("style", "color: red; font-weight: bold;");
	element.textContent = "BUZZ!!!";
}

function tryBuzz(){
	chrome.runtime.sendMessage({
		type: "buzz",
	}, function(response) {});
}

function debug(str){
	if (debugging) {
		console.log(str);
	}
}