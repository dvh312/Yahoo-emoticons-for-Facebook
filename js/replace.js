chrome.runtime.sendMessage({}, function(response) {
	
	if (response.isEnable) {
		var canRun = true; //check if the script is running
		var idle = true;

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
			    		if (canRun && idle) replace();
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



		document.onscroll = function(e){
			// console.log("scroll");
			notIdle();
		}
		document.onkeypress = function(e){
			// console.log("keypress");
			notIdle();
		}
		document.onmousemove = function(e){
			// console.log("mousemove");
			notIdle();
		}
		document.onclick = function(e){
			// console.log("mouseclick");
			notIdle();
		}

		function notIdle(){
			if (idle){
				idle = false;
				setTimeout(idle = true, 250);
			}
		}

		function replace(){
			var start = new Date().getTime();

			var x = document.getElementsByTagName("SPAN"); //all tag <span></span>
			replaceFBEmo(x); //replace facebook emo first

			//change key combination to emo
			x = document.getElementsByTagName("SPAN"); //all tag <span></span>
			replaceByTag(x);
			x = document.getElementsByTagName("P"); //all tag <p></p>
			replaceByTag(x);
			x = document.getElementsByTagName("DIV"); //all tag <div></div>
			replaceByTag(x);

			var end = new Date().getTime();
			var time = end - start;
			console.log("Run............ "+ time + "ms");	
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

				//search textContent inside the element for emoticon key combination
				for (var j = keyComb.length - 1; j >= 0; j--){
					if (j + 1 < 80 || j + 1 > 99){
						var key = toRegex(keyComb[j], j);

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
							while (temp.match(key) != null){
								temp = temp.replace(key, getCode(j));
							}
							x[i].innerHTML = temp;
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
				if (x[i].hasAttribute("done")) continue;
				if (x[i].childElementCount > 0) continue;
				

				var changed = false;
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
				if (changed) x[i].setAttribute("done", "1");
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
	}
});
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