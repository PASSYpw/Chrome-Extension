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

const port = chrome.runtime.connect({name: "frontend"});

function switchPages() {
	if ($("#save-page").is(":visible")) {
		$("#save-page").hide();
		$("#password-page").show();
	} else {
		$("#save-page").show();
		$("#password-page").hide();
	}
}

port.onMessage.addListener(function (msg) {
	console.debug(msg);
	switch (msg.action) {
		case "login-successful": {
			setPasswords(msg.data);
			break;
		}

		case "create-confirm" : {
			switchPages();
			setPasswords(msg.data, false);
			break;
		}

		case "reset": {
			const tableBody = $("#tbodyPasswords");
			const loginPage = $("#login-page");
			const passPage = $("#password-page");

			passPage.fadeOut(300);
			tableBody.html("");
			setTimeout(function () {
				loginPage.fadeIn(300);
			}, 300);
			break;
		}

		case "saved-url-reply": {
			$("#form_login").find('input[name="url"]').val(msg.url);
			break;
		}

		case "prepare-save": {
			if (msg.data.username !== null)
				$("#pre-save-username").val(msg.data.username);
			if (msg.data.password !== null)
				$("#pre-save-password").val(msg.data.password);
			break;
		}
	}
});

$(function () {
	port.postMessage({action: "saved-url"});
});

$("#form_login").submit(function (e) {
	e.preventDefault();
	const me = $(this),
		url = me.find('input[name="url"]').val();
	port.postMessage({action: "login-call", url: url, data: me.serialize()});
});

$("#form_save").submit(function (e) {
	e.preventDefault();
	const me = $(this);
	port.postMessage({action: "save-call", data: me.serialize()});
});

$("#pass-switch-pages").click(function () {
	switchPages();
});

$("#show-save-pass").click(function () {
	const current = $("#pre-save-password").attr("type");

	$("#pre-save-password").attr("type", current === "text" ? "password" : "text");
});
$("#save-switch-pages").click(function () {
	switchPages();
});

function insertPassword(id) {
	port.postMessage({action: "insert", id: id});
	console.debug("insert message sent");
}

function setPasswords(data, fade = true) {
	const tableBody = $("#tbodyPasswords");
	tableBody.html("");
	const loginPage = $("#login-page");
	const passPage = $("#password-page");

	data.forEach(function (value) {
		if (value.archived)
			return; // continue
		const button = "<button class='btn btn-success' id='pass-" + value.password_id + "'>Insert</button>";
		var add = "<tr>";
		add += field(value.username.safe);
		add += field(value.description.safe);
		add += field(value.date_added.pretty);
		add += field(button);
		add += "</tr>";

		tableBody.append(add);

		$("#pass-" + value.password_id).click(function () {
			insertPassword(value.password_id);
		});
	});
	if (fade) {
		loginPage.fadeOut(300);
		setTimeout(function () {
			passPage.fadeIn(300);
		}, 300);
	}

}

function field(inner) {
	if (inner.trim().length === 0)
		inner = "<i>None</i>";
	return "<td>" + inner + "</td>";
}
