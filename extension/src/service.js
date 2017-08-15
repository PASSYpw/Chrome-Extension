let passwords = [];
let url = "";

var extensionPort;
var sitePort;

chrome.runtime.onConnect.addListener(function (port) {
	if (port.name == "extension")
		extensionPort = createExtensionPort(port);
	if (port.name == "site")
		sitePort = createSitePort(port);
});

chrome.runtime.onInstalled.addListener(function (details) {
	if (details.reason == "install") {
		chrome.storage.sync.set({"lastUrl": "https://app.passy.pw"});
	}
});

function createExtensionPort(port) {
	isLoggedIn(function (loggedin) {
		if (loggedin)
			port.postMessage({data: passwords, action: "set-pass"});
	});
	port.onMessage.addListener(function (request) {
		const action = request.action;
		switch (action) {
			case "insert":
				fetchPassword(request.id, function (response) {
					if (response.success) {
						sitePort.postMessage({action: "insert", password: response.data.password});
					}
				});
				break;

			case "login-call":
				url = request.url;
				// remove trailing slash
				if (url.endsWith("/"))
					url = url.substring(0, url.length - 1);

				chrome.storage.sync.set({"lastUrl": url});
				$.ajax({
					method: 'POST',
					url: url + "/action.php",
					data: request.data,
					success: function (response) {
						if (response.success) {
							fetchPasswords(function (response) {
								passwords = response.data;
								if (extensionPort !== null)
									extensionPort.postMessage({
										data: passwords,
										action: "set-pass"
									});

								const checker = setInterval(function () {
									$.ajax({
										method: 'POST',
										url: url + "/action.php",
										data: "a=status",
										success: function (response) {
											if (!response.data.logged_in) {
												clearInterval(checker);
												logOut();
											}
										}
									})
								}, 2000);
							});
						} else {
						}
					},
					error: function () {
						console.log("Error");
					}
				});
				break;

			case "saved-url":
				chrome.storage.sync.get("lastUrl", function (items) {
					extensionPort.postMessage({
						action: "saved-url-reply",
						url: items.lastUrl
					});
				});
				break;
		}
	});
	return port;
}

function createSitePort(port) {
	port.onMessage.addListener(function (request) {
		console.log(request);
	});
	return port;
}

function isLoggedIn(callback) {
	$.ajax({
		method: 'POST',
		url: url + "/action.php",
		data: "a=status",
		success: function (response) {
			if (callback != null)
				callback(response.data.logged_in);
		}
	})
}

function logOut() {
	passwords = [];
	url = "";
	extensionPort.postMessage({action: "reset"});
}

function fetchPassword(id, callback) {

	$.ajax({
		method: 'POST',
		url: url + "/action.php",
		data: "a=password/query&id=" + id,
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
		url: url + "/action.php",
		data: "a=password/queryAll",
		success: function (response) {
			callback(response);
		},
		error: function (response) {
			callback(response);

		}
	})

}