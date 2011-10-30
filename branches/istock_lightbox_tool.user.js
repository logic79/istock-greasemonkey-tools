// ==UserScript==
// @name           iStock Lightbox Tool
// @namespace      anchev
// @description    Easy add/remove of files to lightboxes
// @include        http://www.istockphoto.com/*
// @version	   1.3
// ==/UserScript==
// by George Anchev

GM_for_chrome();

currentURL = String(window.location);

closeupURIMatch1 = currentURL.match(/stock-(photo|illustration|video|audio|flash).*\.php(\?st=.*)*$/);
closeupURIMatch2 = currentURL.match(/file_closeup(_edit)*\.php\?id=\d+$/);
searchURIMatch = currentURL.match(/search\/.*/);

if(closeupURIMatch1 || closeupURIMatch2 || searchURIMatch) {
	mainProgram(searchURIMatch);
}

function processAllFiles(addAction) {
	var nodeList = document.getElementsByTagName("div");
	var fileIDs = new Array();
	
	// Find divs like srItem_12345678 and get the href for each file
	for(i = 0; i < nodeList.length; i++) {
		// find files on page
		matches = nodeList[i].id.match(/srItem/gi);
		if(matches) {
			var currentFileID = parseInt(String(nodeList[i].id.match(/\d+/)));
			fileIDs.push(currentFileID);
			nodeList[i].style.backgroundColor = addAction?"#0f0":"#f00";
		}
	}
	if(fileIDs.length > 0) {
		filesInLightbox(fileIDs, addAction);
	} else {
		statusMessage('No files to process');
		return;
	}
}

function filesInLightbox(fileIDs, addAction) {
	lightboxID = getLightboxID();
	uri = "http://www.istockphoto.com/my-account/lightbox/updatefiles";
	params = '{"lightboxId":' + lightboxID + ',"addAction":' + addAction + ',"abstractFileIds":[' + fileIDs.toString() + ']}';
	params = 'options=' + encodeURIComponent(params);
	ajax = new ajaxObj();
	ajax.POSTRequest(uri, null, function() { statusMessage('Done!'); }, params, false);
}

function ajaxObj() {
	this.requestObject;
	this.elementToChange;
	
	this.POSTRequest = function(url, elementToChange, onResponse, dataToSend, asynchronous) {
		// trying to stop weird exception
		if ((url == "") || (url == null)) {
			alert('ajaxObj.POSTRequest(): no url specified');
			return;
		}
		if (window.XMLHttpRequest) {
			this.requestObject = new XMLHttpRequest();
		} else {
			this.requestObject = new ActiveXObject("Microsoft.XMLHTTP");
		}
		if (this.requestObject == null) {
			alert("Your browser doesn't support AJAX.");
			return false;
		}
	
		this.requestObject.onreadystatechange = function() {
			switch(this.readyState) {
				case 0: 
					statusMessage('Ajax request not initialized');
					break;
				case 1:
					statusMessage('Ajax connected');
					break;
				case 2:
					statusMessage('Ajax request received');
					break;
				case 3:
					statusMessage('Ajax processing request');
					break;
				default:
					if(this.readyState == 4 && this.status == 200) {
						statusMessage('Ajax ready');
						onResponse(this.responseText, this.readyState, elementToChange);
					} else {
							if(this.status != 200) {
								alert('POSTRequest: improper response from page.');
							}
					}
			}
		}
		this.requestObject.open("POST",url,asynchronous);
		this.requestObject.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=UTF-8");
		this.requestObject.send(dataToSend);
	}
}

function getLightboxID() {
	var x = document.getElementById("lightboxSelector").selectedIndex;
	var y = document.getElementById("lightboxSelector").options;
	return y[x].value;
}

// the main program:

function mainProgram(searchPage) {
	tmp = document.getElementById("GM_menu_bar");

	if (!tmp) {
		var div;
		body = document.getElementsByTagName("body");
		header = document.getElementById("header");
		header.style.marginTop = GM_getValue("lightboxToolActive")?"50px":"0";
		element = document.createElement("div");
		element.setAttribute("id", "GM_menu_bar");
		element.style.padding = "6px";
		element.style.backgroundColor = "#ddf";
		element.style.position = "fixed";
		element.style.top = "0px";
		element.style.left = "0px";
		element.style.width = "100%";
		element.style.height = "50px";
		element.style.zIndex = "2";
		element.style.display = "inline";
		body[0].insertBefore(element, header);
		div = element;
		div.style.display = GM_getValue("lightboxToolActive")?"":"none";

		text = '<b>Help:</b> Select a lightbox from the dropdown list. Toggle the controls for per file operations. All controls operate on the selected lightbox.<br />';
		element = document.createElement("span");
		element.innerHTML = text;
		div.appendChild(element);
		
		var lbSelector = document.createElement("select");
		lbSelector.setAttribute("id", "lightboxSelector");
		lbSelector.style.fontSize = "11px";
		div.appendChild(lbSelector);
		
		// Get all lightboxes:
		
		uri = "http://www.istockphoto.com/json/getlightboxes";
		ajax = new ajaxObj();
		ajax.POSTRequest(uri, div, onLightboxesLoaded, null, true);
		
		element = document.createElement("input");
		element.setAttribute("type", "button");
		element.setAttribute("value", "Go to LB");
		element.style.width = "60px";
		element.style.margin = "2px";
		element.addEventListener("click",function() { window.location = "http://www.istockphoto.com/search/lightbox/" + getLightboxID() ;} ,true);
		div.appendChild(element);
		
		if(searchPage) {
			element = document.createElement("input");
			element.setAttribute("type", "button");
			element.setAttribute("value", "Add all");
			element.style.width = "100px";
			element.style.margin = "2px";
			element.style.background = "#5d5";
			element.addEventListener("click",function() { processAllFiles(true); } ,true);
			div.appendChild(element);
	
			element = document.createElement("input");
			element.setAttribute("type", "button");
			element.setAttribute("value", "Remove all");
			element.style.width = "100px";
			element.style.margin = "2px";
			element.style.background = "#d55";
			element.addEventListener("click",function() { processAllFiles(false); } ,true);
			div.appendChild(element);
	
			element = document.createElement("input");
			element.setAttribute("type", "button");
			element.setAttribute("value", "Show Controls");
			element.setAttribute("id", "toggle_controls_btn");
			element.style.width = "100px";
			element.style.margin = "2px";
			element.addEventListener("click",function() { toggleControls(); } ,true);
			div.appendChild(element);

			element = document.createElement("input");
			element.setAttribute("type", "button");
			element.setAttribute("value", "Refresh");
			element.style.width = "100px";
			element.style.margin = "2px";
			element.addEventListener("click",function() { window.location = String(window.location).replace(/#.*$/, ''); } ,true);
			div.appendChild(element);
		} else {
			element = document.createElement("input");
			element.setAttribute("type", "button");
			element.setAttribute("value", "Add file");
			element.setAttribute("id", "add_file_btn");
			element.style.width = "100px";
			element.style.margin = "2px";
			element.addEventListener("click",function() { addCurrentFileToLB(); } ,true);
			div.appendChild(element);
		}
		
		element = document.createElement("span");
		element.setAttribute("id", "myMessageBox");
		element.style.marginLeft = "5px";
		div.appendChild(element);
		statusMessage("Inital");
		
		element = document.createElement("input");
		element.setAttribute("type", "button");
		element.setAttribute("value", "Toggle LB tool");
		element.setAttribute("id", "toggle_lb_tool_btn");
		element.style.width = "150px";
		element.style.background = "none";
		element.style.border = "none";
		element.style.cssFloat = "right";
		element.style.margin = "2px";
		element.style.fontSize = ".9em";
		element.addEventListener("click",function() {
			bar = document.getElementById("GM_menu_bar");
			header.style.marginTop = "0";
			active = GM_getValue("lightboxToolActive");
			if(active) {
				bar.style.display = 'none';
				header.style.marginTop = "0";
				GM_setValue("lightboxToolActive", false);
			} else {
				bar.style.display = '';
				header.style.marginTop = "50px";
				GM_setValue("lightboxToolActive", true);
			}
		} ,true);
		nav = document.getElementsByTagName("nav");
		nav = nav[0];
		nav.appendChild(element);
	}
}

function onLightboxesLoaded(text, status, elementToChange) {
	result = JSON.parse(text);
	if(result.status == 1) {
		lightbox = result.lightboxes;
	} else {
		alert("Can't get lightboxes. Are you logged in?");
		return;
	}

	lbSelector = document.getElementById("lightboxSelector");

	var optionText  = new Array();
	var optionValue = new Array();

	if(GM_getValue("currentLightboxID") == undefined) {
		currentLightboxID = false;	
		if(searchURIMatch) {
			matches = currentURL.match(/search\/lightbox\/\d+(#.*)*/);
			if(matches) {
				currentLightboxID = parseInt(String(matches[0]).match(/\d+/));
				GM_setValue("currentLightboxID", currentLightboxID);
			}
		}
	} else {
		currentLightboxID = GM_getValue("currentLightboxID");
	}

	for(i = 0; i < lightbox.length; i++) {
		optionText[i] = lightbox[i].name;
		optionValue[i] = lightbox[i].id;

		var lbOption = document.createElement("option");
		lbOption.text  = (optionText[i]); 
		lbOption.value = (optionValue[i]);
		
		if(currentLightboxID) {
			if(currentLightboxID == optionValue[i]) {
				lbOption.selected = true;
			}
		}
		lbSelector.options[i] = lbOption;
	}
	lbSelector.addEventListener("change",function() { GM_setValue("currentLightboxID", this.value); } ,false);
}

function statusMessage(text) {
	msgBox = document.getElementById("myMessageBox");
	msgBox.innerHTML = '<b>Status: </b><span style="color:#00f">' + text + '</span>';
}

function toggleControls() {
	var nodeList = document.getElementsByTagName("div");
	controlButton = document.getElementById("toggle_controls_btn");

	if(controlButton.getAttribute("value") == "Show Controls") {
		controlButton.setAttribute("value", "Hide Controls");
		// Find files on page
		for(i = 0; i < nodeList.length; i++) {
			matches = nodeList[i].id.match(/srItem/gi);
			if(matches) {
				fileID = parseInt(String(nodeList[i].id.match(/\d+/)));
	
				lbControl = document.createElement("div");
				lbControl.setAttribute("name", "state_initial");
				lbControl.setAttribute("id", fileID);
				
				element = document.createElement("input");
				element.setAttribute("type", "button");
				element.style.width = "30px";
				element.style.height = "30px";
				element.style.fontSize = "2em";
				element.style.margin = "2px";
				element.style.padding = "0";
				element.style.marginLeft = "20px";
				element.setAttribute("value", "+");
				element.addEventListener("click", function() {
					filesInLightbox(getFileID(this.parentNode), true);
					statusMessage("Added " + getFileID(this.parentNode));
					setLightboxControlState(this.parentNode, true);
				} ,true);
				lbControl.appendChild(element);
				
				element = document.createElement("input");
				element.setAttribute("type", "button");
				element.style.width = "30px";
				element.style.height = "30px";
				element.style.fontSize = "2em";
				element.style.margin = "2px";
				element.style.padding = "0";
				element.style.marginLeft = "10px";
				element.setAttribute("value", "-");
				element.addEventListener("click", function() {
					filesInLightbox(getFileID(this.parentNode), false);
					statusMessage("Removed " + getFileID(this.parentNode));
					setLightboxControlState(this.parentNode, false);
				} ,true);
				lbControl.appendChild(element);
				
				nodeList[i].lastChild.appendChild(lbControl);
			}
		}
	} else {
		controlButton.setAttribute("value", "Show Controls");
		for(i = 0; i < nodeList.length; i++) {
			matches = nodeList[i].id.match(/srItem/gi);
			if(matches) {
				nodeList[i].lastChild.removeChild(nodeList[i].lastChild.lastChild);
			}
		}
	}
}

function setLightboxControlState(element, state) {
	if(state) {
		element.lastChild.setAttribute("value", "-");
		element.lastChild.style.background = "";
		element.lastChild.style.fontSize = "2em";
		element.firstChild.style.fontSize = "1em";
		element.firstChild.setAttribute("value", "OK");
		element.firstChild.setAttribute("name", "state_added");
		element.firstChild.style.background = "#0d0";
	} else {
		element.firstChild.setAttribute("value", "+");
		element.firstChild.style.background = "";
		element.firstChild.style.fontSize = "2em";
		element.lastChild.style.fontSize = "1em";
		element.lastChild.setAttribute("value", "OK");
		element.lastChild.setAttribute("name", "state_removed");
		element.lastChild.style.background = "#d00";
	}
}

function getFileID(element) {
	return element.getAttribute("id");
}

function addCurrentFileToLB() {
	if(closeupURIMatch1) {
		fileID = String(closeupURIMatch1[0]).match(/\d+/);
	} else {
		fileID = parseInt(String(String(closeupURIMatch2[0]).match(/\d+/)));
	}
	filesInLightbox(fileID, true);
}

// this function is...
// @copyright      2009, 2010 James Campos
// @license        cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
function GM_for_chrome() {
  if (typeof GM_deleteValue == 'undefined') {

    GM_addStyle = function(css) {
        var style = document.createElement('style');
        style.textContent = css;
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    GM_deleteValue = function(name) {
        localStorage.removeItem(name);
    }

    GM_getValue = function(name, defaultValue) {
        var value = localStorage.getItem(name);
        if (!value)
            return defaultValue;
        var type = value[0];
        value = value.substring(1);
        switch (type) {
            case 'b':
                return value == 'true';
            case 'n':
                return Number(value);
            default:
                return value;
        }
    }

    GM_log = function(message) {
        console.log(message);
    }

    GM_openInTab = function(url) {
        return window.open(url, "_blank");
    }

     GM_registerMenuCommand = function(name, funk) {
    //todo
    }

    GM_setValue = function(name, value) {
        value = (typeof value)[0] + value;
        localStorage.setItem(name, value);
    }
  }
}


