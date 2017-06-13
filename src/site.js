/**
 * Created by liz3 on 13.06.17.
 */


const port = chrome.runtime.connect({name: "extension"});

port.onMessage.addListener(function(msg) {
    console.log(msg);

    if(msg.action == "set-pass") {
        setPasses(msg.data);
    }
    if(msg.action == "reset") {

        const tableBody = $("#tbodyPasswords");
        const loginPage = $("#login-page");
        const passPage = $("#password-page");

        passPage.fadeOut(300);
        tableBody.html("");
        setTimeout(function () {
            loginPage.fadeIn(300);
        }, 300);
    }
});

$("#page_login_form_login").submit(function () {

    const data = $("#page_login_form_login").serialize();


    port.postMessage({action: "login-call", data: data});

});

function insertPassword(id) {

    port.postMessage({action: "insert", passid: id});
    console.log("message sended");
}

function setPasses(data) {

    const tableBody = $("#tbodyPasswords");
    const loginPage = $("#login-page");
    const passPage = $("#password-page");

    data.forEach(function (value) {
        const button = "<button class='btn btn-success pull-right' id='pass-" + value.password_id + "'>Insert</button>";
        var add = "<tr>";
        add += field(value.username);
        add += field("");
        add += field(value.description);
        add += field(value.date_added_readable);
        add += field(button);
        add +="</tr>";

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
function field(value) {
    return "<td>"  +value  + "</td>";
}
