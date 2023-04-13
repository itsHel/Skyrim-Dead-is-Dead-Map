import { showAlert, $, $$ } from "./uti";
import { setting, global, $main } from "./settings";
import { loadUserData } from "./loadData";
import { Counter } from "./Counter";
import { Sidemenu } from "./Sidemenu";
import { UsersTable } from "./UsersTable";

const $captcha = $("#captcha");
const $loginIcons = $("#login-icons");
const $loginIco = $("#login-svg");
const $logoutIco = $("#logout-svg");
const $settingsIco = $("#settings-svg");
const $settingsPublicCheckbox = $("#settings-public-checkbox");
const $nickText = $("#nick-text");
const $passHideToggle = $$(".pass-hide-toggle");

const $modal = $("#login-modal-full");
const $settingsModal = $("#user-settings-modal");

const $forms = {
    login: {
        wrapper: $("#login-wrapper"),
        nickOrMail: $("#login-name"),
        pass: $("#login-pass"),
        confirm: $("#login-confirm"),
        link: $$("#login-link, #login-link-forgot"),
        error: $("#login-error"),
        toFocus: $("#login-name"),
        enterConfirmSelectors: "input"
    },
    register: {
        wrapper: $("#register-wrapper"),
        nick: $("#register-name"),
        mail: $("#register-mail"),
        pass: $("#register-pass"),
        confirm: $("#register-confirm"),
        public: $("#public-checkbox"),
        link: $$("#register-link"),
        error: $("#register-error"),
        toFocus: $("#register-name"),
        enterConfirmSelectors: "input"
    },
    forgot: {
        wrapper: $("#forgot-wrapper"),
        mail: $("#forgot-mail"),
        create: $("#forgot-send"),
        code: $("#forgot-code"),
        pass: $("#forgot-pass"),
        confirm: $("#forgot-confirm"),
        link: $$("#forgot-link"),
        error: $("#forgot-error"),
        toFocus: $("#forgot-mail"),
        enterConfirmSelectors: "#forgot-code, #forgot-pass"
    }
};

export function setupLogin(){
    // Check if user still logged
    sendLoginRequest("init");

    $passHideToggle.forEach(el => {
        el.addEventListener("click", function(){
            if(this.classList.contains("pass-hide-active")){
                this.classList.remove("pass-hide-active");
                this.parentNode.querySelector("input").type = "text";
            } else {
                this.classList.add("pass-hide-active");
                this.parentNode.querySelector("input").type = "password";
            }
        });
    })

    for(const property in $forms){
        $forms[property].wrapper.querySelectorAll($forms[property].enterConfirmSelectors).forEach(function(input){
            input.addEventListener("keypress", (e) => {
                if(e.key == "Enter"){
                    $forms[property].confirm.click();
                }
            });
        });
    }

    $forms.forgot.wrapper.querySelector("#forgot-mail").addEventListener("keypress", (e) => {
        if(e.key == "Enter"){
            $forms.forgot.create.click();
        }
    });
    
    // Add focus on transition end
    $modal.addEventListener("transitionend", function(e){
        if(e.propertyName == "opacity" && e.target.classList.contains("modal") && $modal.classList.contains(setting.showModalClass)){
            let input = $modal.querySelector("input");
            input.focus();
        }
    });

    $loginIcons.addEventListener("click", function(e){
        if(e.target.closest("svg").id == "login-svg"){
            $modal.classList.add(setting.showModalClass);
        }

        if(e.target.closest("svg").id == "settings-svg"){
            $settingsModal.classList.add(setting.showModalClass);                
        }
    });
    $logoutIco.addEventListener("click", function(){
        sendLoginRequest("logout");
    });

    $forms.login.confirm.addEventListener("click", function(){
        if(!validateLogin())
            return;
        
        sendLoginRequest("login");
    });
    $forms.register.confirm.addEventListener("click", function(){
        if(!validateRegister())
            return;

        sendLoginRequest("register");
    });
    $forms.forgot.create.addEventListener("click", function(){
        if(!validateForgotCreate())
            return;

        sendLoginRequest("forgot-create");
    });
    $forms.forgot.confirm.addEventListener("click", function(){
        if(!validateForgotConfirm())
            return;

        sendLoginRequest("forgot-confirm");
    });

    for(const property in $forms){
        $forms[property].link.forEach(link => {
            link.addEventListener("click", function(){
                for(const _property in $forms){
                    if($forms[property] == $forms[_property]){
                        $forms[_property].wrapper.classList.remove("hide-login");
                    } else {
                        $forms[_property].wrapper.classList.add("hide-login");
                    }
                }
                
                $forms[property].toFocus.focus();
            });
        });
    }

    function sendLoginRequest(type){
        let url = setting.ajaxUrl + "user-control/";
        let data = { captcha: $captcha.value };

        switch(type){
            case "logout":
                url += "logout";
                break;
            case "login":
                url += "login";
                data.nickOrMail = $forms.login.nickOrMail.value;
                data.pass = $forms.login.pass.value;
                break;
            case "register":
                url += "register";
                data.nick = $forms.register.nick.value;
                data.mail = $forms.register.mail.value;
                data.pass = $forms.register.pass.value;
                data.public = $forms.register.public.checked | 0;
                break;
            case "forgot-create":
                url += "forgot-pass-mail";
                data.mail = $forms.forgot.mail.value;
                break;
            case "forgot-confirm":
                url += "reset-pass";
                data.mail = $forms.forgot.mail.value;
                data.pass = $forms.forgot.pass.value;
                data.code = $forms.forgot.code.value;
                break;
            case "init":
                url += "login";
                data.init = true;
                break;
        }

        fetch(url, { method: "POST", headers: { "Content-type": "application/json" }, credentials: "include", body: JSON.stringify(data) })
            .then((response) => {
                if(!response.ok)
                    throw new Error;
console.log(response);
                return response.json();
            })
            .then(async (result) => {
                if(!result.error){
                    switch(result.success){
                        case "logged-out":
                            location.reload();
                            break;
                        case "forgot-mail-sent":
                            toggleError("Email sent", $forms.forgot.error);
                            break;
                        case "logged-in":
                            if($(".unsaved")){
                                let pick = await showAlert("Unsaved data", "You've made changes while logged out, do you want to save them?", true);

                                if(pick){
                                    let promises = [];

                                    $$(".unsaved").forEach(counterEl => {
                                        let pos = Counter.getPosFromCounter(counterEl);

                                        promises.push(Counter.saveToServer(pos.x, pos.y, pos.scale, counterEl.querySelector(".count").textContent, counterEl));
                                    });

                                    await Promise.all(promises).then(() => {}).catch(()=>{});
                                } 
                            }

                            $$(".counter").forEach(counterEl => {
                                if(!counterEl.classList.contains("display-only-counter")){
                                    counterEl.remove();
                                }
                            });

                            loadUserData();
                            
                            const user = result.user;

                            $modal.classList.remove(setting.showModalClass);
                            global.loggedNick = user.nick;
                            $settingsIco.style.display = "block";
                            $loginIco.style.display = "none";
                            global.errorShown = false;
                            
                            UsersTable.markUser(user.nick, true);
                            Sidemenu.removeObservedUser(user.nick);
                            
                            // if(global.usersTable){
                            //     global.usersTable.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(user.nick)+ "']")?.classList.add("user-self");
                            //     Sidemenu.removeObservedUser(user.nick);
                            // }
                            
                            $modal.querySelectorAll("input", input => {
                                input.value = "";
                            });
                            $modal.querySelectorAll(".login-part-error", div => {
                                div.textContent = "";
                            });

                            $nickText.textContent = user.nick;
                            $settingsPublicCheckbox.checked = parseInt(user.public);

                            break;
                    }
                } else {
                    switch(result.error){
                        case "credentials":
                            toggleError("Wrong credentials", $forms.login.error);
                            break;
                        case "mail-exists":
                            toggleError("Email is taken", $forms.register.error);
                            break;
                        case "nick-exists":
                            toggleError("Nick is taken", $forms.register.error);
                            break;
                        case "empty":
                            toggleError("All values are mandatory", $forms.register.error);
                            break;
                        case "not-found":
                            toggleError("Not found", $forms.login.error);
                            break;
                        case "wrong-pass":
                            toggleError("Wrong password", $forms.login.error);
                            break;
                        case "forgot-not-found":
                            toggleError("Not found", $forms.forgot.error);
                            break;
                        case "wrong-code":
                            toggleError("Wrong code", $forms.forgot.error);
                            break;
                        case "forgot-countdown":
                            toggleError("Email was already sent", $forms.forgot.error);
                            break;  
                        case "init-missing":                          
                        default:
                            $main.deathCountEl.textContent = 0;
                            break;
                    }
                }
            })
            .catch(function(err){

console.log(err);
                if(type != "init"){
                    logout();
                    showAlert();
                    global.errorShown = true;
                }
            });
    }

    function validateLogin(){
// ************************ TEMP ************************
return true;
        if(!$forms.login.nick.value){
            toggleError("Empty nickname", $forms.login.error);
            return false;
        }
        if($forms.login.nickOrMail.value.trim() != $forms.login.nickOrMail.value){
            toggleError("Nickname cannot start or end with space", $forms.login.error);
            return false;
        }

        if(!$forms.login.pass.value){
            toggleError("Empty password", $forms.login.error);
            return false;
        }

        return true;
    }

    function validateRegister(){
// ************************ TEMP ************************
return true;
        if(!$forms.register.nick.value){
            toggleError("Empty nickname", $forms.register.error);
            return false;
        }
        if($forms.register.nick.value.trim() != $forms.register.nick.value){
            toggleError("Nickname cannot start or end with space", $forms.register.error);
            return false;
        }

        if(!$forms.register.mail.value){
            toggleError("Empty email", $forms.register.error);
            return false;
        }
        if(!$forms.register.mail.value.match(/.+@.+/)){
            toggleError("Wrong email format", $forms.register.error);
            return false;
        }
        if($forms.register.mail.value.trim() != $forms.register.mail.value){
            toggleError("Email cannot start or end with space", $forms.register.error);
            return false;
        }

        if(!$forms.register.pass.value){
            toggleError("Empty password", $forms.register.error);
            return false;
        }
        if($forms.register.pass.value.length < 4){
            toggleError("Password is 4 characters minimum", $forms.register.error);
            return false;
        }

        return true;
    }

    function validateForgotCreate(){
// ************************ TEMP ************************
return true;
        if(!$forms.forgot.mail.value){
            toggleError("Empty email", $forms.forgot.error);
            return false;
        }
        if(!$forms.forgot.mail.value.match(/.+@.+/)){
            toggleError("Wrong email format", $forms.forgot.error);
            return false;
        }
        if($forms.forgot.mail.value.trim() != $forms.forgot.mail.value){
            toggleError("Email cannot start or end with space", $forms.forgot.error);
            return false;
        }

        return true;
    }
    
    function validateForgotConfirm(){
// ************************ TEMP ************************
return true;
        if($forms.forgot.code.value.length != 8){
            toggleError("Code has 8 characters", $forms.forgot.error);
            return false;
        }

        if(!$forms.forgot.pass.value){
            toggleError("Empty password", $forms.forgot.error);
            return false;
        }
        if($forms.forgot.pass.value.length < 4){
            toggleError("Password is 4 characters minimum", $forms.forgot.error);
            return false;
        }

        return true;
    }

    function toggleError(text, element, show = true){
        element.textContent = text;

        if(show){
            element.style.opacity = "1";
        } else {
            element.style.opacity = "0";
        }
    }
}

export function logout(){
    if(global.loggedNick){
        UsersTable.unmarkUser(global.loggedNick, true);

        global.loggedNick = "";
    }

    $settingsIco.style.display = "none";
    $loginIco.style.display = "block";
}
