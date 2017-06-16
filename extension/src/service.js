let loggedIn = false;
let accessToken = "";
let passwords = [];

var extensionConnector = null;
var siteConnector = null;


chrome.runtime.onConnect.addListener(function (port) {
	if (port.name == "extension") createExtensionPort(port);
	if (port.name == "site") createSitePort(port);


});
function createExtensionPort(port) {
	if (loggedIn) {
		port.postMessage({data: passwords, action: "set-pass"});
	}
	port.onMessage.addListener(function (request) {

		const action = request.action;

		if (action == "insert") {

			fetchPassword(request.id, function (response) {


				if (response.success) {
					siteConnector.postMessage({action: "insert", password: response.data.password});
				}
			});

		}
		if (action == "login-call") {

			$.ajax({
				method: 'POST',
				url: 'https://dev.liz3.net/passy-api/index.php',
				data: request.data,
				success: function (response) {

					if (response.success) {
						loggedIn = true;
						accessToken = response.token[0];
						fetchPasswords(function (response) {

							passwords = response.data;
							if (extensionConnector != null) extensionConnector.postMessage({
								data: passwords,
								action: "set-pass"
							});

							let checker = setInterval(function () {

								$.ajax({
									method: 'POST',
									url: 'https://dev.liz3.net/passy-api/index.php',
									data: "a=" + encodeURIComponent("status") + "&" +
									encodeURIComponent("access_token") + "=" +
									encodeURIComponent(accessToken),
									success: function (response) {

										if (response.data.logged_in == false) {
											clearInterval(checker);
											logOut();

										}
									},
									error: function (response) {


									}
								})

							}, 2000);
						});
					} else {

					}
				},
				error: function (response) {
					console.log("Error");

				}
			})

		}

	});
	extensionConnector = port;
}
function logOut() {

	accessToken = "";
	loggedIn = false;
	extensionConnector.postMessage({action: "reset"});
}
function createSitePort(port) {

	port.onMessage.addListener(function (request) {
		console.log(request);
	});
	siteConnector = port;

}

function fetchPassword(id, callback) {

	$.ajax({
		method: 'POST',
		url: 'https://dev.liz3.net/passy-api/index.php',
		data: "a=" + encodeURIComponent("password/query") + "&" +
		encodeURIComponent("access_token") + "=" +
		encodeURIComponent(accessToken) + "&id=" + encodeURIComponent(id),
		success: function (response) {
			callback(response);
		},
		error: function (response) {
			callback(response);

		}
	})
}
function fetchPasswords(callback) {

	$.ajax({
		method: 'POST',
		url: 'https://dev.liz3.net/passy-api/index.php',
		data: "a=" + encodeURIComponent("password/queryAll") + "&" +
		encodeURIComponent("access_token") + "=" +
		encodeURIComponent(accessToken),
		success: function (response) {
			callback(response);
		},
		error: function (response) {
			callback(response);

		}
	})

}