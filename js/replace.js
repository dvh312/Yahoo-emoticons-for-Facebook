const debugging = false; //turn print debug on or off
const idleTime = 250; //idle delay in ms
const breathTime = 10; //delay between each process ms
const MOD = 100000; //wrap around after action count reach 100000
var queue = []; //main queue to save works
var action = 0; //number of action % MOD

//check if the extension is enable or disable
chrome.runtime.sendMessage({}, function(response) {
	if (response.isEnable) {
		setTimeout(function(){
			//first replacement after pageload 2s
			replace(getNeedElements(document.body)); //run once after document loaded
		}, 2000);
		htmlChangedListener(); //add listener for HTML changed
		//event call when these actions happen
		document.onwheel = function(e){ 
			if (debugging) console.log("scroll");
			resetTimer(idleTime);
		}
		document.onkeydown = function(e){
			if (debugging) console.log("key");
			resetTimer(idleTime);
		}
		document.onmousedown = function(e){
			if (debugging) console.log("mouse");
			resetTimer(idleTime);	
		}
	}
});
/**
 * after t ms, if no action happens, do work in queue
 * @param  {int} t idleTime
 * @return {void}   n/a
 */
function resetTimer(t){
	action = (action + 1) % MOD;
	var lastAction = action;
	setTimeout(function(){
		if (lastAction === action){
			doWork();
		}
	}, t);
}
/**
 * do one work in the queue
 * @return {void} n/a
 */
function doWork(){
	if (queue.length > 0){
		var mutation = queue.pop();
		for (var i = 0; i < mutation.addedNodes.length; i++){
			if (mutation.addedNodes[i].nodeType === 1){
				replace(getNeedElements(mutation.addedNodes[i]));
			}
		}	
	}
	if (queue.length > 0) {
		resetTimer(breathTime); //avoid freezing the browswer
	}


	if (debugging) console.log(queue.length);
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
	replaceChatFBBig(x);
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
			if (x[i].hasAttribute("title")){
				//check if any yahoo emo match the title
				for (var j = keyComb.length - 1; j >= 0; j--){
					if (keyComb[j] !== ""){
						var key = toRegex(keyComb[j], j);

						//check for exact match with the key combination
						var matches = x[i].title.match(key);
						if (matches !== null){
							if (matches[0] === x[i].title){
								//change HTML code
								x[i].outerHTML = getCode(j);
								break;
							}
						}
					}
				}
			}
		}
	}
}
/**
 * replace standalone facebook emoticon in the message pop-up
 * @param  {elements array} x focused elements
 * @return {void}   N/A
 */
function replaceChatFBBig(x){
	//process on parent span node contains title = keycomb, child img 
	for (var i = 0; i < x.length; i++){
		//check if person type the emo in with keycombine
		if (x[i].tagName === "SPAN"){
			if (x[i].hasAttribute("title")){
				if (x[i].children.length === 1 && x[i].children[0].tagName === "IMG"){
					//check if any yahoo emo match the title
					for (var j = keyComb.length - 1; j >= 0; j--){
						if (keyComb[j] !== ""){
							var key = toRegex(keyComb[j], j);

							//check for exact match with the key combination
							var matches = x[i].title.match(key);
							if (matches !== null){
								if (matches[0] === x[i].title){
									//change HTML code
									x[i].innerHTML = getCode(j);
									break;
								}
							}
						}
					}
				}
			}
		}
	}
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
							if (containSpecialChar(x[i].childNodes[j].textContent)) {
								//initially, element have same content as text child node
								var newHTML = x[i].childNodes[j].textContent;
								var changed = false;
								//search for matched yahoo key
								for (var k = keyComb.length - 1; k >= 0; k--){
									if (keyComb[k] !== ""){
										var key = toRegex(keyComb[k], k);
										//replace key combination with img element (if any)
										if (newHTML.match(key)){ //tweak
											newHTML = newHTML.replace(key, getCode(k));
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

									//remove fb emo in comments
									if (x[i].parentNode !== null && x[i].parentNode.tagName === "SPAN"){
										if (x[i].parentNode.hasAttribute("title")){
											var titles = x[i].parentNode.title.split(' ');
											if (titles.length > 1 && titles[1] === "emoticon"){
												if (x[i].previousElementSibling !== null){
													if (x[i].previousElementSibling.tagName === "SPAN"){
														var classes = x[i].previousElementSibling.className.split(' ');
														if (classes.length > 0 && classes[0] === "emoticon"){
															x[i].parentNode.removeChild(x[i].previousElementSibling);
														}
													}
												}
											}
										}
									}

									//remove fb emo in posts <p></p>
									if (x[i].parentNode !== null && x[i].parentNode.tagName === "I"){
										if (x[i].parentNode.hasAttribute("title")){
											var titles = x[i].parentNode.title.split(' ');
											if (titles.length > 1 && titles[1] === "emoticon"){
												if (x[i].previousElementSibling !== null){
													if (x[i].previousElementSibling.tagName === "I"){
														x[i].parentNode.removeChild(x[i].previousElementSibling);
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

/**
 * get the image code based on the keyComb array index
 * @param  {int} id the array index
 * @return {string}    the code to inject into HTML
 */
function getCode(id){
	var s = "\"" + chrome.extension.getURL("images/YahooEmoticons/" + (id + 1) + ".gif") + "\"";
	var res = "<img src=" + s + ">";
	return res;
}
/**
 * include special char in the string
 * @param  {string} str unprocessed string
 * @return {string}     processed string
 */
function preg_quote( str ) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

    return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}
/**
 * change key combination to regex
 * @param  {string} str keyCombination
 * @param  {int} idx index of the keyCombination
 * @return {RegExp}     Regular Expression object, no case sensitive, get all matches
 */
function toRegex(str, idx){
	//only run MAIN for basic emoticons
	var basic = false;
	for (var i = 0; i < basicEmo.length; i++){
		if (idx === basicEmo[i] - 1) {
			basic = true;
			break;
		}
	}

	var temp = preg_quote(str);
	// //MAIN: case insensitive, optional '-' character
	if (basic){
		if (temp.includes("-")){
			//can remove '-' in keycombine. Ex: can show :) if keycomb is :-)
			temp = temp.replace("-", "-?");
		} else if (temp.includes("\:")){
			//can add '-' after ':' in keycombine. 
			//Ex: can show :-) if keycomb is :)
			//
			temp = temp.replace("\:", "\:-?");
		} else if (idx === 2){ //show emo for ;-) <-> ;) 
			temp = temp.replace(";", "\;-?");
		}
	}
	return ( new RegExp( "(" + temp + ")" , 'gi' ) );
}
/**
 * check if a string  contain any special character (for optimization)
 * @param  {string} str to-be-checked string
 * @return {boolean}     indicate contain or not
 */
function containSpecialChar(str){
	for (var i = 0; i < specialChar.length; i++){
		if (str.includes(specialChar[i])){
			return true;
		}
	}
	return false;
}

const specialChar = ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', '-', '/', ';', '<', '=', '>', '?', '@', '\\', ']', '^', '_', '`', '|', '}', '~', '{', ':'];
const basicEmo = [1,2,3,4,8,10,11,13,15,16,17,20,21,22,46];
const keyComb = [
	":)",
	":(",
	";)",
	":D",
	";;)",
	">:D<",
	":-/",
	":x",
	":\">",
	":P",
	":-*",
	"=((",
	":-O",
	"X(",
	":>",
	"B-)",
	":-S",
	"#:-S",
	">:)",
	":((",
	":))",
	":|",
	"/:)",
	"=))",
	"O:-)",
	":-B",
	"=;",
	"I-)",
	"8-|",
	"L-)",
	":-&",
	":-$",
	"[-(",
	":O)",
	"8-}",
	"<:-P",
	"(:|",
	"=P~",
	":-?",
	"#-o",
	"=D>",
	":-SS",
	"@-)",
	":^o",
	":-w",
	":-<",
	">:P",
	"<):)",
	":@)",
	"3:-O",
	":(|)",
	"~:>",
	"@};-",
	"%%-",
	"**==",
	"(~~)",
	"~O)",
	"*-:)",
	"8-X",
	"=:)",
	">-)",
	":-L",
	"[-O<",
	"$-)",
	":-\"",
	"b-(",
	":)>-",
	"[-X",
	"\\:D/",
	">:/",
	";))",
	"o->",
	"o=>",
	"o-+",
	"(%)",
	":-@",
	"^:)^",
	":-j",
	"(*)",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	"",
	":)]",
	":-c",
	"~X(",
	":-h",
	":-t",
	"8->",
	":-??",
	"%-(",
	":o3",
	"X_X",
	":!!",
	"\\m/",
	":-q",
	":-bd",
	"^#(^",
	":bz",

	//hidden emoticons from yahoo messenger 11
	"~^o^~",
	"'@^@|||",
	"[]---",
	"^o^||3",
	":-(||>",
	"'+_+",
	":::^^:::",
	"o|^_^|o",
	":puke!",
	"o|\\~",
	"o|:-)",
	":(fight)",
	"%*-{",
	"%||:-{",
	"&[]",
	":(tv)",
	"?@_@?",
	":->~~",
	"'@-@",
	":(game)",
	":-)/\\:-)",
	"[]==[]",
];


var emoticons = [{
	"key": [":)"],
	"src": "images/YahooEmoticons/1.gif"
}, {
	"key": [":("],
	"src": "images/YahooEmoticons/2.gif"
}, {
	"key": [";)"],
	"src": "images/YahooEmoticons/3.gif"
}, {
	"key": [":D"],
	"src": "images/YahooEmoticons/4.gif"
}, {
	"key": [";;)"],
	"src": "images/YahooEmoticons/5.gif"
}, {
	"key": [">:D<"],
	"src": "images/YahooEmoticons/6.gif"
}, {
	"key": [":-/"],
	"src": "images/YahooEmoticons/7.gif"
}, {
	"key": [":x"],
	"src": "images/YahooEmoticons/8.gif"
}, {
	"key": [":\">"],
	"src": "images/YahooEmoticons/9.gif"
}, {
	"key": [":P"],
	"src": "images/YahooEmoticons/10.gif"
}, {
	"key": [":-*"],
	"src": "images/YahooEmoticons/11.gif"
}, {
	"key": ["=(("],
	"src": "images/YahooEmoticons/12.gif"
}, {
	"key": [":-O"],
	"src": "images/YahooEmoticons/13.gif"
}, {
	"key": ["X("],
	"src": "images/YahooEmoticons/14.gif"
}, {
	"key": [":>"],
	"src": "images/YahooEmoticons/15.gif"
}, {
	"key": ["B-)"],
	"src": "images/YahooEmoticons/16.gif"
}, {
	"key": [":-S"],
	"src": "images/YahooEmoticons/17.gif"
}, {
	"key": ["#:-S"],
	"src": "images/YahooEmoticons/18.gif"
}, {
	"key": [">:)"],
	"src": "images/YahooEmoticons/19.gif"
}, {
	"key": [":(("],
	"src": "images/YahooEmoticons/20.gif"
}, {
	"key": [":))"],
	"src": "images/YahooEmoticons/21.gif"
}, {
	"key": [":|"],
	"src": "images/YahooEmoticons/22.gif"
}, {
	"key": ["/:)"],
	"src": "images/YahooEmoticons/23.gif"
}, {
	"key": ["=))"],
	"src": "images/YahooEmoticons/24.gif"
}, {
	"key": ["O:-)"],
	"src": "images/YahooEmoticons/25.gif"
}, {
	"key": [":-B"],
	"src": "images/YahooEmoticons/26.gif"
}, {
	"key": ["=;"],
	"src": "images/YahooEmoticons/27.gif"
}, {
	"key": ["I-)"],
	"src": "images/YahooEmoticons/28.gif"
}, {
	"key": ["8-|"],
	"src": "images/YahooEmoticons/29.gif"
}, {
	"key": ["L-)"],
	"src": "images/YahooEmoticons/30.gif"
}, {
	"key": [":-&"],
	"src": "images/YahooEmoticons/31.gif"
}, {
	"key": [":-$"],
	"src": "images/YahooEmoticons/32.gif"
}, {
	"key": ["[-("],
	"src": "images/YahooEmoticons/33.gif"
}, {
	"key": [":O)"],
	"src": "images/YahooEmoticons/34.gif"
}, {
	"key": ["8-}"],
	"src": "images/YahooEmoticons/35.gif"
}, {
	"key": ["<:-P"],
	"src": "images/YahooEmoticons/36.gif"
}, {
	"key": ["(:|"],
	"src": "images/YahooEmoticons/37.gif"
}, {
	"key": ["=P~"],
	"src": "images/YahooEmoticons/38.gif"
}, {
	"key": [":-?"],
	"src": "images/YahooEmoticons/39.gif"
}, {
	"key": ["#-o"],
	"src": "images/YahooEmoticons/40.gif"
}, {
	"key": ["=D>"],
	"src": "images/YahooEmoticons/41.gif"
}, {
	"key": [":-SS"],
	"src": "images/YahooEmoticons/42.gif"
}, {
	"key": ["@-)"],
	"src": "images/YahooEmoticons/43.gif"
}, {
	"key": [":^o"],
	"src": "images/YahooEmoticons/44.gif"
}, {
	"key": [":-w"],
	"src": "images/YahooEmoticons/45.gif"
}, {
	"key": [":-<"],
	"src": "images/YahooEmoticons/46.gif"
}, {
	"key": [">:P"],
	"src": "images/YahooEmoticons/47.gif"
}, {
	"key": ["<):)"],
	"src": "images/YahooEmoticons/48.gif"
}, {
	"key": [":@)"],
	"src": "images/YahooEmoticons/49.gif"
}, {
	"key": ["3:-O"],
	"src": "images/YahooEmoticons/50.gif"
}, {
	"key": [":(|)"],
	"src": "images/YahooEmoticons/51.gif"
}, {
	"key": ["~:>"],
	"src": "images/YahooEmoticons/52.gif"
}, {
	"key": ["@};-"],
	"src": "images/YahooEmoticons/53.gif"
}, {
	"key": ["%%-"],
	"src": "images/YahooEmoticons/54.gif"
}, {
	"key": ["**=="],
	"src": "images/YahooEmoticons/55.gif"
}, {
	"key": ["(~~)"],
	"src": "images/YahooEmoticons/56.gif"
}, {
	"key": ["~O)"],
	"src": "images/YahooEmoticons/57.gif"
}, {
	"key": ["*-:)"],
	"src": "images/YahooEmoticons/58.gif"
}, {
	"key": ["8-X"],
	"src": "images/YahooEmoticons/59.gif"
}, {
	"key": ["=:)"],
	"src": "images/YahooEmoticons/60.gif"
}, {
	"key": [">-)"],
	"src": "images/YahooEmoticons/61.gif"
}, {
	"key": [":-L"],
	"src": "images/YahooEmoticons/62.gif"
}, {
	"key": ["[-O<"],
	"src": "images/YahooEmoticons/63.gif"
}, {
	"key": ["$-)"],
	"src": "images/YahooEmoticons/64.gif"
}, {
	"key": [":-\""],
	"src": "images/YahooEmoticons/65.gif"
}, {
	"key": ["b-("],
	"src": "images/YahooEmoticons/66.gif"
}, {
	"key": [":)>-"],
	"src": "images/YahooEmoticons/67.gif"
}, {
	"key": ["[-X"],
	"src": "images/YahooEmoticons/68.gif"
}, {
	"key": ["\\:D/"],
	"src": "images/YahooEmoticons/69.gif"
}, {
	"key": [">:/"],
	"src": "images/YahooEmoticons/70.gif"
}, {
	"key": [";))"],
	"src": "images/YahooEmoticons/71.gif"
}, {
	"key": ["o->"],
	"src": "images/YahooEmoticons/72.gif"
}, {
	"key": ["o=>"],
	"src": "images/YahooEmoticons/73.gif"
}, {
	"key": ["o-+"],
	"src": "images/YahooEmoticons/74.gif"
}, {
	"key": ["(%)"],
	"src": "images/YahooEmoticons/75.gif"
}, {
	"key": [":-@"],
	"src": "images/YahooEmoticons/76.gif"
}, {
	"key": ["^:)^"],
	"src": "images/YahooEmoticons/77.gif"
}, {
	"key": [":-j"],
	"src": "images/YahooEmoticons/78.gif"
}, {
	"key": ["(*)"],
	"src": "images/YahooEmoticons/79.gif"
}, {
	"key": [":)]"],
	"src": "images/YahooEmoticons/100.gif"
}, {
	"key": [":-c"],
	"src": "images/YahooEmoticons/101.gif"
}, {
	"key": ["~X("],
	"src": "images/YahooEmoticons/102.gif"
}, {
	"key": [":-h"],
	"src": "images/YahooEmoticons/103.gif"
}, {
	"key": [":-t"],
	"src": "images/YahooEmoticons/104.gif"
}, {
	"key": ["8->"],
	"src": "images/YahooEmoticons/105.gif"
}, {
	"key": [":-??"],
	"src": "images/YahooEmoticons/106.gif"
}, {
	"key": ["%-("],
	"src": "images/YahooEmoticons/107.gif"
}, {
	"key": [":o3"],
	"src": "images/YahooEmoticons/108.gif"
}, {
	"key": ["X_X"],
	"src": "images/YahooEmoticons/109.gif"
}, {
	"key": [":!!"],
	"src": "images/YahooEmoticons/110.gif"
}, {
	"key": ["\\m/"],
	"src": "images/YahooEmoticons/111.gif"
}, {
	"key": [":-q"],
	"src": "images/YahooEmoticons/112.gif"
}, {
	"key": [":-bd"],
	"src": "images/YahooEmoticons/113.gif"
}, {
	"key": ["^#(^"],
	"src": "images/YahooEmoticons/114.gif"
}, {
	"key": [":bz"],
	"src": "images/YahooEmoticons/115.gif"
}, {
	"key": ["~^o^~"],
	"src": "images/YahooEmoticons/116.gif"
}, {
	"key": ["'@^@|||"],
	"src": "images/YahooEmoticons/117.gif"
}, {
	"key": ["[]---"],
	"src": "images/YahooEmoticons/118.gif"
}, {
	"key": ["^o^||3"],
	"src": "images/YahooEmoticons/119.gif"
}, {
	"key": [":-(||>"],
	"src": "images/YahooEmoticons/120.gif"
}, {
	"key": ["'+_+"],
	"src": "images/YahooEmoticons/121.gif"
}, {
	"key": [":::^^:::"],
	"src": "images/YahooEmoticons/122.gif"
}, {
	"key": ["o|^_^|o"],
	"src": "images/YahooEmoticons/123.gif"
}, {
	"key": [":puke!"],
	"src": "images/YahooEmoticons/124.gif"
}, {
	"key": ["o|\\~"],
	"src": "images/YahooEmoticons/125.gif"
}, {
	"key": ["o|:-)"],
	"src": "images/YahooEmoticons/126.gif"
}, {
	"key": [":(fight)"],
	"src": "images/YahooEmoticons/127.gif"
}, {
	"key": ["%*-{"],
	"src": "images/YahooEmoticons/128.gif"
}, {
	"key": ["%||:-{"],
	"src": "images/YahooEmoticons/129.gif"
}, {
	"key": ["&[]"],
	"src": "images/YahooEmoticons/130.gif"
}, {
	"key": [":(tv)"],
	"src": "images/YahooEmoticons/131.gif"
}, {
	"key": ["?@_@?"],
	"src": "images/YahooEmoticons/132.gif"
}, {
	"key": [":->~~"],
	"src": "images/YahooEmoticons/133.gif"
}, {
	"key": ["'@-@"],
	"src": "images/YahooEmoticons/134.gif"
}, {
	"key": [":(game)"],
	"src": "images/YahooEmoticons/135.gif"
}, {
	"key": [":-)/\\:-)"],
	"src": "images/YahooEmoticons/136.gif"
}, {
	"key": ["[]==[]"],
	"src": "images/YahooEmoticons/137.gif"
}]