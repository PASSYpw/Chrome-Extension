var inputs = $(".textbox > input");
inputs.each(function (index, elem) {
	elem = $(elem);
	if (elem.val().length > 0)
		elem.addClass("hastext");
});

inputs.change(function () {
	const me = $(this);
	if (me.val().length > 0)
		me.addClass("hastext");
	else
		me.removeClass("hastext");
});

const port = chrome.runtime.connect({name: "extension"});

port.onMessage.addListener(function (msg) {
	console.debug(msg);
	switch (msg.action) {
		case "set-pass":
			setPasswords(msg.data);
			break;

		case "reset":
			const tableBody = $("#tbodyPasswords");
			const loginPage = $("#login-page");
			const passPage = $("#password-page");

			passPage.fadeOut(300);
			tableBody.html("");
			setTimeout(function () {
				loginPage.fadeIn(300);
			}, 300);
			break;
		case "saved-url-reply":
			$("#form_login").find('input[name="url"]').val(msg.url);
			break;
	}
});

$(document).ready(function () {
	port.postMessage({action: "saved-url"});
});

$("#form_login").submit(function (e) {
	e.preventDefault();
	const me = $(this),
		url = me.find('input[name="url"]').val();
	port.postMessage({action: "login-call", url: url, data: me.serialize()});
});

function insertPassword(id) {
	port.postMessage({action: "insert", id: id});
	console.debug("insert message sent");
}

function setPasswords(data) {

	const tableBody = $("#tbodyPasswords");
	const loginPage = $("#login-page");
	const passPage = $("#password-page");

	data.forEach(function (value) {
		const button = "<button class='btn btn-success' id='pass-" + value.password_id + "'>Insert</button>";
		var add = "<tr>";
		add += field(value.username);
		add += field(value.description);
		add += field(value.date_added_readable);
		add += field(button);
		add += "</tr>";

		tableBody.append(add);

		$("#pass-" + value.password_id).click(function () {
			insertPassword(value.password_id);
		});
	});
	loginPage.fadeOut(300);
	setTimeout(function () {
		passPage.fadeIn(300);
	}, 300);

}

function field(inner) {
	return "<td>" + inner + "</td>";
}
