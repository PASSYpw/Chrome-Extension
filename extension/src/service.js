let passwords = [];
let url = "";
const intervals = [];
let extensionPort;
let sitePort;

const dataToSave = {};

chrome.runtime.onConnect.addListener((port) => {
	if (port.name === "frontend")
		extensionPort = createFrontendPort(port);
	if (port.name === "background")
		sitePort = createBackgroundPort(port);
});

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install") {
		chrome.storage.sync.set({"lastUrl": "https://app.passy.pw"});
	}
});

chrome.contextMenus.create({
	"title": "Generate and mark password",
	"contexts": ["editable"],
	"onclick": () => {

		if (sitePort !== null) {
			const pass = randomPassword(20);
			dataToSave.password = pass;
			sitePort.postMessage({action: "generate-pass", password: pass});
		}
	}
});
chrome.contextMenus.create({
	"title": "Mark as username",
	"contexts": ["editable"],
	"onclick": () => {

		if (sitePort !== null)
			sitePort.postMessage({action: "update-save", field: "username"});

	}
});
chrome.contextMenus.create({
	"title": "Mark as password",
	"contexts": ["editable"],
	"onclick": () => {

		if (sitePort !== null)
			sitePort.postMessage({action: "update-save", field: "password"});

	}
});

function createFrontendPort(port) {
	suspendAllIntervals();

	// Set url to last used URL
	chrome.storage.sync.get("lastUrl", function (items) {
		url = items.lastUrl;

		checkLoginState(function (loggedIn) {
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
						sitePort.postMessage({action: "insert", password: response.data.password.raw});
					}
				});
				break;


			case "login-call": {
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
						}
					},
					error: function () {
						console.log("Login error");
					}
				});
				break;
			}

			case "save-call" : {
				$.ajax({
					method: 'POST',
					url: url + "/action.php",
					data: request.data,
					success: function (response) {
						if (response.success) {
							fetchPasswords((response) => {
								passwords = response.data;
								if (extensionPort !== null) extensionPort.postMessage({
									action: "create-confirm",
									data: passwords
								});
							});

						} else {
						}
					},
					error: function () {
						console.log("Error");
					}
				});
				break;
			}

			case "saved-url": {
				extensionPort.postMessage({
					action: "saved-url-reply",
					url: url
				});
				break;
			}
		}
	});
	port.postMessage({action: "prepare-save", data: dataToSave});
	return port;
}

function createBackgroundPort(port) {
	console.log("Backgroundport connected");
	port.onMessage.addListener(function (request) {
		const action = request.action;
		switch (action) {
			case "callback-save" : {
				const field = request.field;
				const value = request.value;
				if (field == "username") {
					dataToSave.username = value;
					return;
				}
				if (field == "password") {
					dataToSave.password = value;
					return;
				}
			}
		}
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
				action: "login-successful"
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

function checkLoginState(callback) {
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

// Helper functions

function isUrlValid() {
	return !(url == null || url.trim().length === 0);

}

function randomPassword(length) {
	const safeAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		specialAlphabet = "@#$%_-";

	let string = "";

	for (let i = 0; i < length; i++) {
		const alphabet = (i === 0 || i === length) ? safeAlphabet : safeAlphabet + specialAlphabet; // first and last letter is not a special char

		string += alphabet.charAt(randomNumber(alphabet.length));
	}
	return string;
}

function randomNumber(max = 1) {
	return Math.floor(Math.random() * max)
}