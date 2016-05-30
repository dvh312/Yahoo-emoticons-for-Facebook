var running = 0; //check if the script is running

//HTML changed eventListener
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations, observer) {
	// fired when a mutation occurs
	
	// console.log(mutations, observer);
	if (running == 0) replace();
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  childList: true,
});

function replace(){
	// var start = new Date().getTime();

	//run script 250ms after the calling - prevent calling too many times
	running = 1;
	setTimeout(function rerunScript(){
		var x = document.getElementsByTagName("SPAN"); //all tag <span></span>
		replaceFBEmo(x); //replace facebook emo first

		//change key combination to emo
		x = document.getElementsByTagName("SPAN"); //all tag <span></span>
		replaceByTag(x);
		x = document.getElementsByTagName("P"); //all tag <p></p>
		replaceByTag(x);
		running = 0;
	}, 250);
	
	

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
		if (!x[i].hasAttribute("data-text")){ //attribute data-text show when typing,
			//just get text in this node, not in any child
			var text = "";
			for (var j = 0; j < x[i].childNodes.length; j++){
				if (x[i].childNodes[j].nodeType == 3){
					text += x[i].childNodes[j].textContent;
				}
			}

			//search textContent inside the element for emoticon key combination
			for (var j = keyComb.length - 1; j >= 0; j--){
				if (j + 1 < 80 || j + 1 > 99){
					var key = toRegex(keyComb[j]);
					if (text.match(key) != null){
						//preprocess - replace special char in HTML
						var temp = x[i].innerHTML;
						while(temp.includes("&lt;")){
							temp = temp.replace("&lt;", "<");
						}
						while(temp.includes("&gt;")){
							temp = temp.replace("&gt;", ">");
						}
						while(temp.includes("&amp;")){
							temp = temp.replace("&amp;", "&");
						}

						//change yh emo
						var s = temp.match(key);
						if (s != null){
							for (var k = 0; k < s.length; k++){
								temp = temp.replace(key, getCode(j) );
							}
							x[i].innerHTML = temp;
						}
					}
					
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
		if (x[i].childElementCount > 0) continue;
		if (x[i].tagName == "SPAN"){
			if (x[i].hasAttribute("title")){
				for (var j = keyComb.length - 1; j >= 0; j--){
					if (j + 1 < 80 || j + 1 > 99){
						var key = toRegex(keyComb[j]);
						if (x[i].title.match(key) != null){
							x[i].outerHTML = getCode(j);
							break;
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
function toRegex(str){
	//avoid some special case - do not apply MAIN to these keys
	if (str == keyComb[6] || str == keyComb[64] || str == keyComb[75]){ 
		//avoid http url :// change to :-//			keyComb[6]
		//avoid :"> change to :-">					keyComb[64]
		//avoid :@) change to :-@)					keyComb[75]
		return ( new RegExp( "(" + preg_quote(str) + ")" , 'gi' ) );
	}

	//MAIN: case insensitive, optional '-' or space character
	var temp = preg_quote(str);
	if (temp.includes("-")){
		//can remove '-' in keycombine. Ex: can show :) if keycomb is :-)
		temp = temp.replace("-", "-?");
	} else if (temp.includes("\:")){
		//can add '-' after ':' in keycombine. 
		//Ex: can show :-) if keycomb is :)
		//
		//can add ONE whitespace after before or after OPTIONAL '-'. 
		//Ex: can show : ) or : -) or :- ) or : - ) if keycomb is :)
		temp = temp.replace("\:", "\:\\s?-?\\s?");
	}
	return ( new RegExp( "(" + temp + ")" , 'gi' ) );
}
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