const port = chrome.runtime.connect({name: "background"});
let activeField = null;
const manuellSet = [];

function handleForSave() {

	if (activeField == null) return;

	if (activeField.attr("type") === "text") {
		if (activeField.attr("name").toLowerCase().indexOf("name") !== -1 || activeField.attr("id").toLowerCase().indexOf("name") !== -1) {
			if (port != null && manuellSet.indexOf("username") == -1) {
				port.postMessage({action: "callback-save", field: "username", value: activeField.val()});
			}
		}
	} else if (activeField.attr("type") === "password" && manuellSet.indexOf("password") == -1) {
		port.postMessage({action: "callback-save", field: "password", value: activeField.val()});

	}
}

port.onMessage.addListener(function (msg) {
	if (msg.action === "insert") {
		const password = msg.password;
		activeField.val(password);
	}
	if (msg.action === "generate-pass") {
		if (activeField) {
			const pass = msg.password;
			const form = activeField[0].form;
			$(form).find("input").each(function (index) {
				const current = $(this);
				if (current.attr("type") == "password") {
					current.val(pass);
				}
			});
		}
	}
	if(msg.action === "update-save") {
		const target = msg.field;
		if(activeField) {
			manuellSet.push(target);
			port.postMessage({action: "callback-save", field: target, value: activeField.val()});
		}

	}


});

$(document).on("focus", "input", function () {
	handleForSave();
	activeField = $(this);
});

$(document).on("focus", "textarea", function () {
	handleForSave();
	activeField = $(this);
});

