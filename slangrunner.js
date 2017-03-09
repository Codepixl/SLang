var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        alert(xmlhttp.responseText);
    }
}
xmlhttp.open("GET", "slang.js", true);
xmlhttp.send();

function run(){
	var blob = new Blob([
     	document.querySelector('#workerScript').textContent
  	], { type: "text/javascript" });
  	var worker = new Worker(window.URL.createObjectURL(blob));
}
