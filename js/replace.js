const debugging = false;
const idleTime = 250; //ms
const breathTime = 10; //ms
var queue = [];
var action = 0;

chrome.runtime.sendMessage({}, function(response) {
	if (response.isEnable) {
		setTimeout(function(){
			replace(getNeedElements(document.body)); //run once after document loaded
		}, 2000);
		htmlChangedListener();
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

function resetTimer(t){
	action = (action + 1) % 100000;
	var lastAction = action;
	setTimeout(function(){
		if (lastAction === action){
			doWork();
		}
	}, t);
}

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
function getNeedElements(x){
	var allElements = [];
	allElements.push.apply(allElements, x.getElementsByTagName("SPAN"));
	allElements.push.apply(allElements, x.getElementsByTagName("P"));
	allElements.push.apply(allElements, x.getElementsByTagName("IMG"));
	allElements.push.apply(allElements, x.getElementsByTagName("DIV"));
	allElements.push.apply(allElements, x.getElementsByTagName("A"));
	return allElements;
}
function replace(x){
	replaceImg(x);
	replaceChatFBBig(x);
	replaceText(x);
}
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