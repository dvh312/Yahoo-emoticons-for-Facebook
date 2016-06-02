var canRun = true; //check if the script is running

chrome.runtime.sendMessage({}, function(response) {
	if (response.isEnable) {
		htmlChangedListener();
	}
});
function htmlChangedListener(){
	//HTML changed eventListener
	MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	var observer = new MutationObserver(function(mutations, observer) {
		// fired when a mutation occurs
		
		// console.log("HTMLchanged");
		if (canRun){
			canRun = false;
		    setTimeout(function afterMs(){ //triger Xms after event
		    	canRun = true;
		    	setTimeout(function afterMs(){ 
		    		//consider as HTML continuously change if canRun is set back to false
		    		if (canRun) replace();
		    	}, 25);    	
			}, 250);
		}
	});

	// define what element should be observed by the observer
	// and what types of mutations trigger the callback
	observer.observe(document, {
	  subtree: true,
	  childList: true,
	});
}
function replace(){
	var start = new Date().getTime();

	var x = document.getElementsByTagName("SPAN"); //all tag <span></span>
	replaceBigFBEmo(x); //replace facebook emo FIRST - all in leaf node

	//change key combination to emo
	x = document.getElementsByTagName("SPAN"); //all tag <span></span>
	replaceByTag(x);
	x = document.getElementsByTagName("P"); //all tag <p></p>
	replaceByTag(x);
	x = document.getElementsByTagName("DIV"); //all tag <div></div>
	replaceByTag(x);
	x = document.getElementsByTagName("U"); //all tag <u></u>
	replaceByTag(x);
	x = document.getElementsByTagName("I"); //all tag <i></i>
	replaceByTag(x);


	var end = new Date().getTime();
	var time = end - start;
	console.log("Run............ "+ time + "ms");	
}
/**
 * replace the HTML element with image code
 * @param  {array} x elements array
 */
function replaceByTag(x){
	for (var i = 0; i < x.length; i++){
		if (x[i].hasAttribute("done")) continue;
		if (x[i].hasAttribute("data-text")) continue; //attribute data-text show when typing,
		if (x[i].classList.contains("alternate_name")) continue; //prevent change the alt name
		x[i].setAttribute("done", "1");

		//remove if the element is a facebook emoticon
		if (x[i].parentNode.hasAttribute("title")){
			if (x[i].parentNode.title.includes("emoticon")){
				if (x[i].textContent.length == 0){
					if (x[i].tagName == "SPAN" && x[i].className.includes("emoticon")){
						x[i].remove();
						continue;
					} else if (x[i].tagName == "I"){
						x[i].remove();
						continue;
					}
				}
			}
		}

		//just get text in this node, not in any child
		var text = "";
		for (var j = 0; j < x[i].childNodes.length; j++){
			if (x[i].childNodes[j].nodeType == 3){
				text += x[i].childNodes[j].textContent;
			}
		}

		//check if have text and contain special char
		if (text.length == 0) continue;
		if (!containSpecialChar(text)) continue; //tweak,only run possible text

		//search textContent inside the element for emoticon key combination
		var processedHTML = preprocessHTML(x[i].innerHTML); //change > < and & back to normal
		var changed = false;
		for (var j = keyComb.length - 1; j >= 0; j--){
			if (keyComb[j] != ""){
				var key = toRegex(keyComb[j], j);

				if (text.match(key)){ //only replace HTML in the node which have key in textContent
					//replace key in innerHTML to img (if any)
					processedHTML = processedHTML.replace(key, getCode(j));

					//remove in text after replaced in innerHTML (if any)
					text = text.replace(key, "");

					//mark as changed to save the result back to element
					changed = true;
				}
			}
		}
		
		if (changed){ //only change if emoticon detected
			if (x[i].tagName == "U"){
				//cannot add img child node inside tag <u>, 
				//so have replace the whole tag
				x[i].outerHTML = processedHTML;
			} else{
				//for p, span, div tag can have img child node
				x[i].innerHTML = processedHTML;
			}
		}
	}
}

/**
 * replace BIG facebook emo in chatbox - leaf node with span tag
 * @param  {array} x elements
 */
function replaceBigFBEmo(x){
	for (var i = 0; i < x.length; i++){
		// if (x[i].hasAttribute("done")) continue;
		if (x[i].childElementCount > 0) continue;
		if (x[i].tagName == "SPAN"){
			if (x[i].hasAttribute("title")){
				for (var j = keyComb.length - 1; j >= 0; j--){
					if (keyComb[j] != ""){
						var key = toRegex(keyComb[j], j);
						var match = x[i].title.match(key);
						if (match != null){
							if (match[0] == x[i].title){
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
 * change special char > < and & in innerHTML back
 * @param  {string} str element.innerHTML
 * @return {string}           processed string
 */
function preprocessHTML(str){
	//preprocess - replace special char in HTML
	var res = str;
	res = res.replace(/&lt;/g, "<");
	res = res.replace(/&gt;/g, ">");
	res = res.replace(/&amp;/g, "&");
	return res;
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
		if (idx == basicEmo[i] - 1) {
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
		} else if (idx == 2){ //show emo for ;-) <-> ;) 
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
var specialChar = ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', ';', '<', '=', '>', '?', '@', '\\', ']', '^', '_', '`', '|', '}', '~', '{', ':'];
var basicEmo = [1,2,3,4,8,10,11,13,15,16,17,20,21,22,46];
var keyComb = [
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