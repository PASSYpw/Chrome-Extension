const port = chrome.runtime.connect({name: "site"});
var activeField = null;
port.onMessage.addListener(function (msg) {
	if (msg.action == "insert") {
		const password = msg.password;
		activeField.val(password);
	}
});
document.addEventListener("focus", function (event) {
	var elem = $(event.srcElement);
	if (elem.is("input") || elem.is("textarea"))
		activeField = elem;
}, true);

