let passwords = [];
let url = "";

var intervals = [];
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
	suspendAllIntervals();

	// Set url to last used URL
	chrome.storage.sync.get("lastUrl", function (items) {
		url = items.lastUrl;

		isLoggedIn(function (loggedIn) {
			if (loggedIn) {
				postLogin();
			}
		});
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

				if (!isUrlValid())
					return false;

				chrome.storage.sync.set({"lastUrl": url});
				$.ajax({
					method: 'POST',
					url: url + "/action.php",
					data: request.data,
					success: function (response) {
						if (response.success) {
							postLogin();
						} else {
						}
					},
					error: function () {
						console.log("Error");
					}
				});
				break;

			case "saved-url":
				extensionPort.postMessage({
					action: "saved-url-reply",
					url: url
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

function suspendAllIntervals() {
	intervals.forEach(function (t, index) {
		suspendInterval(index);
	});
}

function suspendInterval(index) {
	clearInterval(intervals[index]);
	intervals.splice(index, 1);
}

function postLogin() {
	fetchPasswords(function (response) {
		passwords = response.data;
		if (extensionPort !== null)
			extensionPort.postMessage({
				data: passwords,
				action: "set-pass"
			});

		const intervalIndex = intervals.push(setInterval(function () {
			$.ajax({
				method: 'POST',
				url: url + "/action.php",
				data: "a=status",
				success: function (response) {
					if (!response.data.logged_in) {
						suspendInterval(intervalIndex);
						reset();
					}
				}
			})
		}, 2000));
	});
}

function isLoggedIn(callback) {
	if (!isUrlValid())
		return false;
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

function reset() {
	passwords = [];
	extensionPort.postMessage({action: "reset"});
}

function fetchPassword(id, callback) {
	if (!isUrlValid())
		return false;
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
	if (!isUrlValid())
		return false;
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

function isUrlValid() {
	return !(url == null || url == "");

}