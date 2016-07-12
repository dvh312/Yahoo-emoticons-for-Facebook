const debugging = false; //turn print debug on or off
const idleTime = 250; //ms
var timerId;
var isEnabled, emoticons; //storageVariable

var queue = []; //main queue to save works
refreshStorage();
setTimeout(main, 1000);

//FUNCTION + EVENTS

function main(){
	if (isEnabled){
		debug("entering main");

		setTimeout(function(){
			//first replacement after pageload 2s
			replace(getNeedElements(document.body)); //run once after document loaded
		}, 2000);
		htmlChangedListener(); //add listener for HTML changed
		//event call when these actions happen
		document.onwheel = function(e){
			debug("scroll");
			resetTimer(idleTime);
		}
		document.onkeydown = function(e){
			if (e.keyCode === 13){
				debug("enter pressed");
				doWork();	
			} else {
				debug("key pressed");
				resetTimer(idleTime);
			}
		}
		document.onmousedown = function(e){
			debug("clicked");
			doWork();
		}
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
	if (debugging){
		var t0 = performance.now();
	}
	while (queue.length > 0){
		var mutation = queue.pop();
		for (var i = 0; i < mutation.addedNodes.length; i++){
			if (mutation.addedNodes[i].nodeType === 1){
				replace(getNeedElements(mutation.addedNodes[i]));
			}
		}
	}
	if (debugging){
		var t1 = performance.now();
		debug("doWork took " + (t1 - t0) + " milliseconds.");
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
		
		queue.push.apply(queue, mutations);
		resetTimer(idleTime);
		// debug("HTMLchanged " + queue.length);
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
	allElements.push.apply(allElements, x.getElementsByTagName("SPAN"));
	allElements.push.apply(allElements, x.getElementsByTagName("P"));
	allElements.push.apply(allElements, x.getElementsByTagName("IMG"));
	allElements.push.apply(allElements, x.getElementsByTagName("DIV"));
	allElements.push.apply(allElements, x.getElementsByTagName("A"));
	return allElements;
}
/**
 * replace
 * @param  {elements array} x focused elements
 * @return {void}   N/A
 */
function replace(x){
	replaceImg(x);
	replaceText(x);
}
/**
 * replace facebook emoticon show in an img tag with title = keyCombination (ex: :-D)
 * @param  {elements array} x focused elements
 * @return {void}   N/A
 */
function replaceImg(x){
	for (var i = 0; i < x.length; i++){
		if (x[i].tagName === "IMG"){
			var idx = srcToIndex(x[i].src);
			if (idx !== null){
				x[i].src = chrome.extension.getURL(emoticons[idx].src);
				x[i].style = "width: auto;";
			}
		}
	}
}

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
/**
 * replace keyCombination show as text to an img element
 * @param  {elements array} x focused elements
 * @return {void}   N/A
 */
function replaceText(x){
	for (var i = 0; i < x.length; i++){
		if (x[i].hasAttribute("data-text")) continue; //attribute data-text show when typing,
		if (x[i].classList.contains("alternate_name")) continue; //prevent change the alt name

		if (x[i].tagName === "SPAN" || x[i].tagName === "P" || x[i].tagName === "DIV" || x[i].tagName === "A"){
			if (x[i].textContent.length > 0){
				if (x[i].childNodes.length > x[i].children.length){
					//BEGIN
					for (var j = 0; j < x[i].childNodes.length; j++){
						//only process text child nodes
						if (x[i].childNodes[j].nodeType === 3 && x[i].childNodes[j].textContent.length > 0){
							//initially, element have same content as text child node
							var newHTML = x[i].childNodes[j].textContent;
							var changed = false;
							//search for matched yahoo key
							for (var k = emoticons.length - 1; k >= 0; k--){
								for (var w = 0; w < emoticons[k].keys.length; w++){
									while (newHTML.includes(emoticons[k].keys[w])){
										newHTML = newHTML.replace(emoticons[k].keys[w], "<img src=\"" + chrome.extension.getURL(emoticons[k].src) + "\">");
										changed = true;
									}
								}
							}
							
							//replace text node by element node with updated yahoo emo
							if (changed){
								//create new element, ready to replace the child node
								var newElement = document.createElement("SPAN");
								newElement.innerHTML = newHTML;

								x[i].replaceChild(newElement, x[i].childNodes[j]);

								removeInComments(x[i]);
								removeInPosts(x[i]);
							}
						}
					}
				}
			}
		}
	}
}
function removeInComments(x){
	//remove fb emo in comments
	if (x.parentNode !== null && x.parentNode.tagName === "SPAN"){
		if (x.parentNode.hasAttribute("title")){
			var titles = x.parentNode.title.split(' ');
			if (titles.length > 1 && titles[1] === "emoticon"){
				if (x.previousElementSibling !== null){
					if (x.previousElementSibling.tagName === "SPAN"){
						var classes = x.previousElementSibling.className.split(' ');
						if (classes.length > 0 && classes[0] === "emoticon"){
							x.parentNode.removeChild(x.previousElementSibling);
						}
					}
				}
			}
		}
	}
}
function removeInPosts(x){
	//remove fb emo in posts <p></p>
	if (x.parentNode !== null && x.parentNode.tagName === "I"){
		if (x.parentNode.hasAttribute("title")){
			var titles = x.parentNode.title.split(' ');
			if (titles.length > 1 && titles[1] === "emoticon"){
				if (x.previousElementSibling !== null){
					if (x.previousElementSibling.tagName === "I"){
						x.parentNode.removeChild(x.previousElementSibling);
					}
				}
			}
		}
	}
}
/**
 * refresh storage variables (local in content script)
 * @return {[type]} [description]
 */
function refreshStorage(){
	chrome.storage.sync.get(function (items){
	    isEnabled = items.isEnabled;
	    emoticons = items.emoticons;
	    debug("Refreshed. isEnabled=" + isEnabled);
	});
}

function getFilename(fullPath){
	var filename = fullPath.replace(/^.*[\\\/]/, '');
	return filename;
}

function debug(str){
	if (debugging) {
		console.log(str);
	}
}