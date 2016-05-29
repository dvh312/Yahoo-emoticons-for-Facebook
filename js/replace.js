//TODO: fix fb + yahoo emo same line
//add more keyComb 
//responsive image
//
//
//changelog 1.5.3
//change permission, remove tabs
//change function name

var running = 0; //check if the script is running

//HTML changed eventListener
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var observer = new MutationObserver(function(mutations, observer) {
	// fired when a mutation occurs
	
	// console.log(mutations, observer);
	replace();
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  childList: true,
  //...
});

function replace(){
	
	if (running == 1) return;
	// var start = new Date().getTime();

	//run script 250ms after the calling - prevent calling too many times
	running = 1;
	setTimeout(function rerunScript(){
		var x = document.getElementsByTagName("SPAN"); //tag <span></span>
		replaceByTag(x);
		x = document.getElementsByTagName("P"); //tag <p></p>
		replaceByTag(x);
		running = 0;
	}, 250);
	
	

	// var end = new Date().getTime();
	// var time = end - start;
	// console.log("Run............ "+ time + "ms");
}
function replaceByTag(x){
	for (i = 0; i < x.length; i++){
		if (x[i].childElementCount > 0) continue;
		if (x[i].attributes.length == 0 || !x[i].hasAttribute("data-text")){
			var temp = x[i].textContent;
			var changed = 0;
			for (j = keyComb.length - 1; j >= 0; j--){
				if (j + 1 < 80 || j + 1 > 99){
					while (temp.includes(keyComb[j])){
						changed++;
						temp = temp.replace(keyComb[j], getCode(j));
					}
				}
			}
			if (changed > 0) {
				x[i].innerHTML = temp;
			}
		}	
	}
}
function getCode(id){
	var res = "<img src=\"http://l.yimg.com/us.yimg.com/i/mesg/emoticons7/" + (id + 1) + ".gif\">";
	return res;
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
];