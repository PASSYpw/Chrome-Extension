/**
 * Created by liz3 on 12.06.17.
 */
const port = chrome.runtime.connect({name: "site"});
var currentField = null;
port.onMessage.addListener(function (msg) {

    if (msg.action == "insert") {

        const password = msg.password;
        currentField.val(password);

    }
});
document.addEventListener("focus", function (event) {
    const elem = $(event.srcElement);

        currentField = elem;


}, true);

