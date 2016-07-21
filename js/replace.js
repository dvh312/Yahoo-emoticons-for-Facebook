const debugging = true; //turn print debug on or off
const idleTime = 250; //ms
const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
	if (queue.length > 0){
		var addedNode = queue.pop();
		if (addedNode.nodeType === 1){
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
	for (var i = 0; i < x.length; i++){
		if (x[i].tagName === "IMG") {
			replaceImg(x[i]);
		} else {
			replaceText(x[i]);
		}

		if (isBuzzElement(x[i])){
			replaceBuzz(x[i]);

			tryBuzz( getBuzzUserTime(x[i]) ); //only work with chatTab at fb.com
		}
	}
}

/**
 * replace facebook emoticon show in an img tag with title = keyCombination (ex: :-D)
 * @param  {DOMelement} x focused element
 * @return {void}   N/A
 */
function replaceImg(element){
	if (element.tagName === "IMG"){
		var idx = srcToIndex(element.src);
		if (idx !== null){
			if (!element.parentNode.hasAttribute("aria-label")){
				element.src = chrome.extension.getURL(emoticons[idx].src);
				element.style = "height: auto; width: auto;";
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
 * @param  {DOMelement} x focused element
 * @return {void}   N/A
 */
function replaceText(element){
	if (valid(element)){
		for (var j = 0; j < element.childNodes.length; j++){
			//only process text child nodes
			if (element.childNodes[j].nodeType === 3 && element.childNodes[j].textContent.length > 0){
				//initially, element have same content as text child node
				var newHTML = element.childNodes[j].textContent;
				var changed = false;
				//search for matched yahoo key
				for (var k = emoticons.length - 1; k >= 0; k--){
					for (var w = 0; w < emoticons[k].keys.length; w++){
						if (newHTML.includes(emoticons[k].keys[w])){
							newHTML = replaceAllInstances(newHTML, emoticons[k].keys[w], getImgHtml(emoticons[k].src));
							changed = true;
						}
					}
				}
				
				//replace text node by element node with updated yahoo emo
				if (changed){
					//fix bug duplicate when replacing old emoticons in posts and comments
					if (isOldEmoInPostsComments(element)){
						if (!containText(newHTML)){ //fix (:P)oop: bug, only replace if the whole string match
							element.parentNode.innerHTML = newHTML;
						}
					} else {
						//create new element, ready to replace the child node
						var newElement = document.createElement("SPAN");
						element.replaceChild(newElement, element.childNodes[j]);

						//replace temp span element with newHTML (text and img nodes)
						element.childNodes[j].outerHTML = newHTML;	
					}
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

function isOldEmoInPostsComments(element){
	if (element.parentNode !== null){
		if (element.parentNode.hasAttribute("title")){
			var titles = element.parentNode.title.split(' ');
			if (titles.length > 1 && titles[1] === "emoticon"){
				return true;
			}
		}
	}
	return false;
}

function containText(html){
	var newElement = document.createElement("SPAN");
	newElement.innerHTML = html;
	if (newElement.textContent.length === 0) {
		return false;
	}
	return true;
}

function getImgHtml(src){
	return "<img src=\"" + chrome.extension.getURL(src) + "\" style=\"vertical-align: middle;\">";
}

function replaceAllInstances(str, origin, token){
	return str.split(origin).join(token);
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

function getBuzzUserTime(element){
	var rootElement = getXthParent(element, 9);
	var timeElements = rootElement.getElementsByTagName("A");
	if (rootElement === null || timeElements.length === 0) {
		return null;
	}
	if (timeElements[0].hasAttribute("data-tooltip-content")){
		var temp = timeElements[0].getAttribute("data-tooltip-content").split(' '); //name (day of the week) time
		var time = temp.pop();
		//checking if the tooltip text has weekday or not, push back if it's not
		var day = temp.pop();
		if (weekday.indexOf(day) === -1) {
			temp.push(day);
		} else {
			time = day + ' ' + time;
		}
		var name = temp.join(' ');
		return [name, time];
	}
	return null;
}

function getXthParent(element, x){
	while (x > 0 && element.parentNode !== null){
		element = element.parentNode;
		x--;
	}
	if (x === 0) {
		return element;
	} else {
		return null;
	}
}

function tryBuzz(userTime){
	//userTime[0] = username, userTime[1] = time
	if (userTime !== null){
		if (userTime[1] === getCurrentTime12H()){ //only send buzz request if the <ding>'s time is in the same min (at most 60s)
			//send buzz request, play sound, make focus on this tab
			chrome.runtime.sendMessage({
				type: "buzz",
				user: userTime[0]
			}, function(response) {
				if (response.type === "ok") {
					debug("buzzed");
				} else {
					debug("buzz fail");
				}
			});
		}
	}
}

function getCurrentTime12H() {
	var date = new Date();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ampm;
	return strTime;
}

function debug(str){
	if (debugging) {
		console.log(str);
	}
}