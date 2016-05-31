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

	// var x = document.getElementsByTagName("SPAN"); //all tag <span></span>
	replaceFBEmo(x); //replace facebook emo FIRST - all in leaf node

	//change key combination to emo
	x = document.getElementsByTagName("SPAN"); //all tag <span></span>
	replaceByTag(x);
	x = document.getElementsByTagName("P"); //all tag <p></p>
	replaceByTag(x);
	x = document.getElementsByTagName("DIV"); //all tag <div></div>
	replaceByTag(x);
	x = document.getElementsByTagName("U"); //all tag <div></div>
	replaceByTag(x);


	// var end = new Date().getTime();
	// var time = end - start;
	// console.log("Run............ "+ time + "ms");	
}
/**
 * replace the HTML element with image code
 * @param  {x} x array
 */
function replaceByTag(x){
	for (var i = 0; i < x.length; i++){
		if (x[i].hasAttribute("done")) continue;
		if (x[i].hasAttribute("data-text")) continue; //attribute data-text show when typing,
		if (x[i].classList.contains("alternate_name")) continue; //prevent change the alt name
		
		x[i].setAttribute("done", "1");
		//just get text in this node, not in any child
		var text = "";
		for (var j = 0; j < x[i].childNodes.length; j++){
			if (x[i].childNodes[j].nodeType == 3){
				text += x[i].childNodes[j].textContent;
			}
		}
		if (text.length == 0) continue;
		if (!containSpecialChar(text)) continue; //tweak,only run possible text

		//search textContent inside the element for emoticon key combination
		for (var j = keyComb.length - 1; j >= 0; j--){
			if (j + 1 < 80 || j + 1 > 99){
				var key = toRegex(keyComb[j], j);

				if (text.match(key) != null){
					processed = preprocessHTML(x[i].innerHTML);
					if (x[i].tagName == "U") x[i].outerHTML = changeYHEmo(processed, key, j);
					else x[i].innerHTML = changeYHEmo(processed, key, j);
				}
			}
		}
	}
}
/**
 * replace facebook emo - leaf node with span tag
 * @param  {array} x elements
 */
function replaceFBEmo(x){
	for (var i = 0; i < x.length; i++){
		// if (x[i].hasAttribute("done")) continue;
		if (x[i].childElementCount > 0) continue;
		if (x[i].tagName == "SPAN"){
			if (x[i].hasAttribute("title")){
				for (var j = keyComb.length - 1; j >= 0; j--){
					if (j + 1 < 80 || j + 1 > 99){
						var key = toRegex(keyComb[j], j);
						if (x[i].title.match(key) != null){
							x[i].outerHTML = getCode(j);
							changed = true;
							break;
						}
					}
				}
			}
		}
	}
}
/**
 * change special char > < and & in innerHTML back
 * @param  {string} innerHTML element.innerHTML
 * @return {string}           processed string
 */
function preprocessHTML(innerHTML){
	//preprocess - replace special char in HTML
	var res = innerHTML;
	while(res.includes("&lt;")){
		res = res.replace("&lt;", "<");
	}
	while(res.includes("&gt;")){
		res = res.replace("&gt;", ">");
	}
	while(res.includes("&amp;")){
		res = res.replace("&amp;", "&");
	}
	return res;
}
/**
 * Change all keys (if any) in innerHTML to img if matched keyComb[idx]
 * @param  {string} innerHTML innerHTML of current element
 * @param  {string} key       regex key combination for keyComb[idx]
 * @param  {int} idx       	  index of the query key
 * @return {string}			  processed string 
 */
function changeYHEmo(innerHTML, key, idx){
	var res = innerHTML;
	//change yh emo
	var m = res.match(key);
	if (m != null){
		for (var k = 0; k < m.length; k++){
			res = res.replace(key, getCode(idx));
		}
	}
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
var basicEmo = [1,2,3,4,8,10,11,13,15,16,17,22,46];
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