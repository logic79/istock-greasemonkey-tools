// ==UserScript==
// @name           IS_search_showMyData
// @namespace      sjlocke
// @include        http://www.istockphoto.com/search*
// ==/UserScript==
// upon visiting a lightbox search page, a button will show.
// clicking it will display downloads and royalties for each result you own on that page
// with a final tally at the top
// 11/11/10 - redid layout and added code from user anchev to show graph of monthly results
// 12/20/2010 - fixed to work with new search layout
// 01/06/2011 - added separate buttons for current and previous year + F5 button (anchev)

var numberOfImagesOnPage = 0;
var numberOfImagesFinished = 0;
var totalDownloadsOnPage = 0;
var totalRoyaltiesOnPage = 0.00;

// Monthly data variables
var monthlyRoyalties = new Array();
var monthlyDownloads = new Array();
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
for(i=0; i<months.length; i++) {
	monthlyRoyalties[i] = 0;
	monthlyDownloads[i] = 0;
}
// End of monthly data variables

function addLightboxData(year) {
//	With the new search and multiple page results it is better to have next lines off
//	so when we go to the next page, the button can be clicked again
//
	tmp = document.getElementsByName("showLightboxData_btn_0");
	tmp[0].setAttribute("disabled","true");
	tmp[0].style.color="#BBBBBB";
	
	tmp = document.getElementsByName("showLightboxData_btn_1");
	tmp[0].setAttribute("disabled","true");
	tmp[0].style.color="#BBBBBB";

	// Show royalties for your files on this page
	var nodeList = document.getElementsByTagName("div");
	// Find divs like srItem_15084285
	patternMatch = /srItem/gi;
	for (i=0;i<nodeList.length;i++) {
		// find images on page
		if (nodeList[i].id.match(patternMatch)){
			var imageNumber = nodeList[i].id.slice( nodeList[i].id.indexOf('_')+1 );
			var titleSpan = document.createElement("span");
			var dataSpan = document.createElement("span");
			titleSpan.innerHTML = "DLs/$: ";
			// find the meta data area div under the content
			var textDataDiv = nodeList[i].childNodes[1];
			if (textDataDiv) {
				numberOfImagesOnPage++;
				textDataDiv.appendChild(titleSpan);
				textDataDiv.appendChild(dataSpan);
	
				// make a new ajax object 
				var ajax = new ajaxObj();
				var imageDetailsURL="";
				
				// current year
				if(year == 0) {
					// get data for current year
					imageDetailsURL = ("http://www.istockphoto.com/file_downloads.php?id="+imageNumber);
				} else {
					// get data for previous year
					imageDetailsURL = ("http://www.istockphoto.com/file_downloads.php?id="+imageNumber+"&Offset=11&DownloadsGraphFileType=");
				}
				// pass the url from the 'a' object in the child node, and the waiting element to change
				ajax.makeRequest(imageDetailsURL, dataSpan, onImageDetailsResponse);
	
			}
		}
	}
}

function ajaxObj() {

	this.requestObject;
	this.elementToChange;

	this.makeRequest = function(url, elementToChange, onResponse) {
		// trying to stop weird exception
		if ((url=="") || (url==null))	{
			elementToChange.innerHTML = ("<center>N/A / N/A</center>");
			return;		
		}
		if (window.XMLHttpRequest) {                     // Does this browser have an XMLHttpRequest object?
			this.requestObject=new XMLHttpRequest();                    // Yes -- initialize it.
		} else {                                         // No, try to initialize it IE style
			this.requestObject=new ActiveXObject("Microsoft.XMLHTTP");  //  Wheee, ActiveX, how do we format c: again?
		}                                                // End setup Ajax.
		if (this.requestObject==null) {                                // If we couldn't initialize Ajax...
      		alert("Your browser doesn't support AJAX.");  // Sorry msg.                                               
      		return false;                                  // Return false, couldn't set up ajax
   		}

		this.requestObject.onreadystatechange = function() {                      // When the browser has the request info..
   			switch (this.readyState) {
				case 1:
					elementToChange.innerHTML = ("Start");
					break;
				case 2:
					elementToChange.innerHTML = ("Request");
					break;
				case 3:
					elementToChange.innerHTML = ("Process");
					break;
				default:
		     			onResponse(this.responseText, this.readyState, elementToChange);             // Pass the response to our processing function
   			}
		}            
		this.requestObject.open("GET",url,true);
		this.requestObject.send(null);
	}
}

// We need to show the royalties and downloads from the imageDetails page
function onImageDetailsResponse(text, status, elementToChange) {

	var royalty = "N/A";
	var downloads = "N/A";
	var patternMatch;

	// This is the part to get for each month
	for(i=0; i<months.length; i++) {
		// read the royalties:
		var pattern = months[i] + ': \\$\\d+\\.\\d+';
		regexMatch = new RegExp(pattern, 'i');
		
		var matches = text.match(regexMatch);
		if(matches) {
			monthlyRoyalties[i] += parseFloat(String(matches).match(/\d+\.\d+/i));
		}
		
		// read the downloads:
		pattern = months[i] + ': \\d+';
		regexMatch = new RegExp(pattern, 'i');
	
		matches = text.match(regexMatch);
		if(matches) {
			monthlyDownloads[i] += parseInt(String(matches).match(/\d+/i));
		}
	}
	// End of per-month data scraping

	text = text.split("\n");

	for (i=0;i<text.length;i++) {
		// Find the line listing the total royalties
		patternMatch = /Total royalties/gi;
		if (text[i].match(patternMatch)) {
			royalty = text[i].slice(text[i].indexOf('$')+1, text[i].indexOf('</p>'));
		}
		patternMatch = /class=\"fl\"/gi;
		// Find the line that says "Displaying 1 to 20 of 122 matches" so we know num of dls
		if (text[i].match(patternMatch)) {
			tmp = text[i].slice(text[i].indexOf('<div class="fl">'));
			tmp = tmp.slice(tmp.indexOf('>')+1,tmp.indexOf('</'));
			if (tmp == "There are no items to display. ") {
				downloads = "0";
			} else {
				patternMatch = /Displaying/gi;
				if (text[i].match(patternMatch))
					downloads = tmp.split(" ")[5];
			}
		}
	}

	elementToChange.innerHTML = (downloads+" / $"+royalty);

	updatePageTotals(downloads, royalty);		
}

function updatePageTotals(downloads, royalty) {
	numberOfImagesFinished++;
	if (royalty == "N/A") {
		royalty = 0;
		downloads = 0;
	}

	// things keep changing into strings, and weird precision, so have to keep changing to float, etc.
	totalDownloadsOnPage += parseInt(downloads); 
	royalty = parseFloat(royalty);
	royalty = royalty.toFixed(2);
	totalRoyaltiesOnPage = parseFloat(totalRoyaltiesOnPage);
	totalRoyaltiesOnPage += parseFloat(royalty);
	totalRoyaltiesOnPage = totalRoyaltiesOnPage.toFixed(2);
	
	dataSpan = document.getElementById("searchReturnData_span");
	if(!dataSpan) {
		dataSpan = document.createElement("div");
		dataSpan.id = "searchReturnData_span";
		tmp = document.getElementById("searchReturnInterface_div");
		tmp.appendChild(dataSpan);
		// Need this to clear the floats so search return stays to the left
		tmp.appendChild(document.createElement("p"));
	}

	dataSpan.innerHTML = ("Finished with "+numberOfImagesFinished+" out of "+numberOfImagesOnPage+" results. Downloads: "+totalDownloadsOnPage+" Royalties: $"+(totalRoyaltiesOnPage+''));

	if (numberOfImagesFinished == numberOfImagesOnPage) {
		text = ("Final for "+numberOfImagesOnPage+" results on page: Downloads: "+totalDownloadsOnPage+" Royalties: $"+(totalRoyaltiesOnPage+''));
		text += "<br>";
		dataSpan.innerHTML = text;

		element = document.createElement("span");
		element.id = "searchReturnMonthlyData_text";
		element.innerHTML = "To see monthly results graph: ";
		dataSpan.appendChild(element);

		element = document.createElement("a");
		element.id = "searchReturnMonthlyData_link";
		element.innerHTML = "click here";
		dataSpan.appendChild(element);
		var triggerLink = document.getElementById('searchReturnMonthlyData_link');
		triggerLink.addEventListener('click',showHideMonthlyData, true);
		
		element = document.createElement("span");
		element.id = "searchReturnMonthlyData_text";
		element.innerHTML = '<br /><i style="color:#333">(To see for a different year - first reload.)</i><br /><br />';
		dataSpan.appendChild(element);

		element = document.createElement("div");
		element.id = "searchReturnDataMonthly_div";
		element.style.display = "none";
		element.style.height = "300px";
		dataSpan.appendChild(element);

		// Display monthly data:
		dlBars = chart(monthlyDownloads);
		royaltylBars = chart(monthlyRoyalties);
		var html_buffer = ''; // store temporary the html for the graph

		text = '<div>The year (per month). Royalties are above, downloads are below.<br />';
		for(i=0; i<months.length; i++) {
			text += '<div style="float:left; height: 300px; width: 50px; margin: 0 2px; text-align:center">';
			text += '<div style="display: table-cell; vertical-align: bottom; height: 150px; width: 50px">$' + monthlyRoyalties[i].toFixed(2) + '<div style="background-color:#5a86b3; width:50px; height: ' + royaltylBars[i]  + 'px"></div></div>';
			text += '<div style="background-color:#ddd; font-weight: bold">' + (i+1) + '</div>';
			text += '<div style="display: table-cell; vertical-align: top; height: 150px; width: 50px">' + '<div style="background-color:#5a86b3; width:50px; height: ' + dlBars[i]  + 'px"></div>' + monthlyDownloads[i] + '</div>';
			text += '</div>';
		}
		text += '</div>';
		element.innerHTML = text;
		dataSpan.appendChild(element);

		tmp = document.getElementById("srchCntr");
		tmp.style.float="left";

	}
}

function showHideMonthlyData() {

	monthlyDataDiv = document.getElementById("searchReturnDataMonthly_div");
	if (monthlyDataDiv.style.display == "none") {
		monthlyDataDiv.style.display = "block";
		tmp = document.getElementById("searchReturnMonthlyData_text");
		tmp.innerHTML = "To hide monthly results graph: ";
	} else {
		monthlyDataDiv.style.display = "none";
		tmp = document.getElementById("searchReturnMonthlyData_text");
		tmp.innerHTML = "To see monthly results graph: ";
	}
}

// Returns an array of div tags ready for outputing
// Added for monthly graph output
function chart(values) {
	var sum = 0;
	var maximum = 0;
	var chartSize = 100;
	output = new Array();
	for(i = 0; i < values.length; i++) {
		if(parseFloat(values[i]) > maximum) {
			maximum = parseFloat(values[i]);
		}
	}
	
	for(i = 0; i < values.length; i++) {
		barSize = Math.round(chartSize*parseFloat(values[i])/maximum);
		output[i] = barSize;
	}
	
	return output;
}


// Greasemonkey running twice in some browsers, duplicating buttons
// If button already exists, don't make another
tmp = document.getElementsByName("showLightboxData_btn_0");

if (!tmp.length) {
	// Create the buttons and place them
	// Find the div at the top
	
	searchContent = document.getElementById("srchCntnt");

	searchTitle = document.getElementById("searchTitle");

	var div;
	tmp = document.getElementById("searchReturnInterface_div");
	if(!tmp){

		element = document.createElement("div");
		element.setAttribute("id", "searchReturnInterface_div");
		element.style.padding = "6px";
		//element.style.margin = "2px";
		//element.style.border = "1px solid blue";
		element.style.backgroundColor = "#DDDDFF";
		//searchContent.insertBefore(element, searchCenter);
		searchTitle.appendChild(element);
		div = element;
	} else
		div = tmp;

	text = '<h2>Add Dynamic Lightbox DLs/Royalty data with monthly graphs</h2>';
	text += '<p><b>Note</b>: DLs/Royalty data is a total for the whole file(s) lifetime. Only graphs are for the chosen period</p>';
	element.innerHTML = text;

	element = document.createElement("input");
	element.setAttribute("type", "button");
	element.setAttribute("value", "2011");
	element.setAttribute("name", "showLightboxData_btn_0");
	element.style.width="100px";
	element.style.margin="2px";
	element.addEventListener("click",function() { addLightboxData(0);} ,true);
	// get the parent of the div and add the button
	div.appendChild(element);
	
	
	element = document.createElement("input");
	element.setAttribute("type", "button");
	element.setAttribute("value", "2010");
	element.setAttribute("name", "showLightboxData_btn_1");
	element.style.width="100px";
	element.style.margin="2px";
	element.addEventListener("click",function() { addLightboxData(1);} ,true);
	// get the parent of the div and add the button
	div.appendChild(element);
	
	element = document.createElement("input");
	element.setAttribute("type", "button");
	element.setAttribute("value", "Reload (F5)");
	element.setAttribute("name", "reload_btn");
	element.style.width="100px";
	element.style.margin="2px";
	element.addEventListener("click",function() { window.location.reload();} ,true);
	// get the parent of the div and add the button
	div.appendChild(element);

}