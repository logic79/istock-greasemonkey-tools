// ==UserScript==
// @name           iStock UBB Referrals
// @namespace      anchev
// @description    Convert HTML referrals to UBB code
// @include        http://www.istockphoto.com/my-account/referral-program/generate-referral-links
// @include        http://www.istockphoto.com/my-account/referral-program/view-banner/*
// ==/UserScript==
// by George Anchev, www.anchev.net

mainProgram();

function mainProgram(searchPage) {
	tmp = document.getElementById("get_ubb_code");
	
	if (!tmp) {
		currentURI = window.location;
		matches = String(currentURI).match(/links/i);
		if(matches) {
			// it's a link
			parentNode = document.getElementById("copyUrlText");
		} else {
			// it's a banner
			parentNode = document.getElementById("createBanner");
		}

		element = document.createElement("input");
		element.setAttribute("type", "button");
		element.setAttribute("value", "Convert to UBB code");
		element.setAttribute("id", "get_ubb_code");
		element.style.width = "160px";
		element.style.margin = "2px";
		element.addEventListener("click",function() { generateUBB(); } ,true);
		parentNode.appendChild(element);
		
		element = document.createElement("input");
		element.setAttribute("type", "button");
		element.setAttribute("value", "Reload");
		element.style.width = "60px";
		element.style.margin = "2px";
		element.addEventListener("click",function() { window.location.reload(); } ,true);
		parentNode.appendChild(element);
	}
}

function generateUBB() {
	parentNode = document.getElementById("URLTextarea");
	if(!parentNode) {
		// for banner
		parentNode = document.getElementById("CopyURLTextarea");
	}
	text = parentNode.innerHTML;
	text = text.replace(/&lt;a href=\"/,"[url=");
	text = text.replace(/\"&gt;&lt;img src=\"/,"][img]");
	text = text.replace(/\" border=\"0\"\/&gt;/,"[/img]");
	text = text.replace(/&lt;\/a&gt;/,"[/url]");
	text = text.replace(/&amp;/,"&");
	parentNode.innerHTML = text;
}