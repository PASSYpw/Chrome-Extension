const port = chrome.runtime.connect({name: "site"});
var activeField = null;
port.onMessage.addListener(function (msg) {
	if (msg.action === "insert") {
		const password = msg.password;
		activeField.val(password);
	}
});

$(document).on("focus", "input", function () {
	activeField = $(this);
});

$(document).on("focus", "textarea", function () {
	activeField = $(this);
});
