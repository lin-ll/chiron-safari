/* ********
  AUTHOR: Lucy Lin
  DATE: 21 June 2016 (Tuesday)
  DESCRIPTION:
  	enable double click to transform selected word into either greek or latin
    enable quizlet functionality
    fixed glitch that would toggle between Latin and Greek definitions when clicking the popup in the same session more than once
  NOTES:
  	jquery preloaded in using Safari Extensionbuilder
  	injected into page using Safari Extensionbuilder
******** */
safari.self.addEventListener("message", handleMessage, false);
console.log('running injected.js');
var event = 0;
var lang;
var saved = "";

function handleMessage(msgEvent) {
	var messageName = msgEvent.name;
    var messageData = msgEvent.message;
    if (messageName == "language") {
    	if (event == 0) runPaideiaChromium(messageData);
    	else {
    		if (messageData == "latin") lang = "la";
    		else lang = "greek";
    	}
    }
    else if (messageName == "ajax") parseAjax(messageData);
    else if (messageName == "quizlet") quizlet();
    else alert("Error!");
}

function quizlet() {
	insertDiv('<div id="paideia-panel"><b>Just copy and paste the text below into the import space when creating a Quizlet set.</b><br>' + 
		'<div id="vocab"><pre>' + saved + '</pre></div>' + 
		'<button id="copy">Highlight, then Ctrl/Cmd-C to copy!</button>' + 
		'<button id="go-quizlet">Open Quizlet in new tab!</button>' + 
		'<button id="remove">Close</button><br></div>');
	$('#remove').click(rmPanel);
	document.getElementById('copy').addEventListener('click', function() { selectText('vocab'); });
	document.getElementById('go-quizlet').addEventListener('click', function() {
		safari.self.tab.dispatchMessage("open-quizlet", "https://quizlet.com/create-set");
	});
}

function selectText(containerid) {
    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(containerid));
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().addRange(range);
    }
}

function parseAjax(response) {
	var word = response[0];
	var toReturn = response[1];

	var thanks = '<hr style="margin-top: 2em;" /><footer><img src="' + safari.extension.baseURI + 'paideia.png' + '" alt="Paideia Icon" style="width:5em;height:5em;float:left;">Chromium was developed by the <a href="http://paideiainstitute.org">Paideia Institute for Humanistic Study</a>.<br>Morphology provided by Morpheus from the <a href="http://www.perseus.tufts.edu/hopper/">Perseus Digital Library</a> at Tufts University.</footer>';
	var perseus = $('<div/>').html(toReturn).contents();
	lemma = perseus.find('.lemma');
	resultFound = perseus.find('.lemma').html(); // will be undefined if perseus finds no results
    if (resultFound) {
		var header = lemma.find('.lemma_header').prop('outerHTML');
		var def = lemma.find('.lemma_definition')[0].innerHTML;
		var word_saved = lemma.find('.' + lang)[0].innerHTML;
		saved += word_saved + '\t' + def.trim() + '\n';
		console.log(saved);
		table = lemma.find('table').addClass('paideia-table').prop('outerHTML');

		insertDiv('<div id="paideia-panel"><button id="remove" style="float: right;">X</button>' + 
			header + table + anotherDictionary(word) + thanks + '</div>');

		var thead = document.getElementsByClassName("paideia-table")[0].createTHead();
		var row = thead.insertRow();
		var cell1 = row.insertCell();
		var cell2 = row.insertCell();
		cell1.innerHTML = "Form";
		cell2.innerHTML = "Morphology";
		$('#remove').click(rmPanel);
    } 
    else manualSearch(word);
}

function anotherDictionary(word) {
	return '<p>Try this word in another dictionary: </p>' + 
	'<ul class="another-dict">' + 
		'<li><a target="_blank" href="http://logeion.uchicago.edu/index.html#'+ word + '">Logeion</a></li>' + 
		'<li><a target="_blank" href="http://www.perseus.tufts.edu/hopper/resolveform?type=exact&lookup=' + 
			word + '&lang=' + lang + '">Perseus</a></li>' + 
	'</ul>'
}

function rmPanel() {
	var last = document.getElementById('paideia-panel');
	if (last) last.remove();
}

function insertDiv(child) {
	var div = document.createElement('div');
	div.setAttribute('id', 'paideia-panel');
	div.setAttribute('style', 'position: fixed; top: 1em; right: 1em; padding: 10px 20px; '
    +'border: 1px solid #007095; border-radius: 2em; width: 34em; max-height: 400px; '
    + 'overflow-y: scroll; word-wrap: break-word; background-color: aliceblue; z-index:999;'
    + 'font-family: "Times New Roman", Times, serif; font-size: 12px;');
    
	rmPanel()

	var rawHTML = child;
	var innerDiv = document.createElement('div');
	innerDiv.innerHTML = rawHTML;
	div.appendChild(innerDiv);
	document.body.appendChild(div);
}

function manualSearch(word) {
  	insertDiv(
		'<div class="container" id="paideia-panel"><div class="row">' +
		'<p style="text-align: center; font-size: 14px; font-weight: bold;">Sorry!</p> ' +
		'<p>We couldn\'t find any results for this entry.</p>' +
		anotherDictionary(word) +
		'<p>Or try typing the word manually:</p>' +
		'</div><div class="row">' +
		'<div class="col-xs-6 col-xs-offset-3 paideia-input">' +
		'  <input type="text" id="manual-paideia-entry" class="form-control" placeholder="type your word here...">' +
		'  <br>' +
		'  <div style="text-align:center;">' +
		'    <button class="paideia-button" type="submit" id="manual-paideia-search">Search</button>' +
		'    <button class="paideia-button" id="cancel-paideia">Cancel</button>' +
		'  </div>' + '</div>' + '</div></div>'
	);
	$('#manual-paideia-search').click(function() {
		var manualPaideiaEntry = $('#manual-paideia-entry').val();
		rmPanel();
		console.log(manualPaideiaEntry);
		paidieaify(manualPaideiaEntry);
	});
	$('#cancel-paideia').click(rmPanel);
}

function runPaideiaChromium(language) {
	event = 1;
	if (language == "latin") lang = "la";
	else lang = "greek";
	document.body.addEventListener('dblclick', function(info) {
		console.log("language = " + lang);
		safari.self.tab.dispatchMessage("selected", [window.getSelection().toString(), lang]);
	});
}