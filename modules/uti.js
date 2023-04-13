export const $ = document.querySelector.bind(document);
export const $$ = document.querySelectorAll.bind(document);

const alertEl = {
    modal: $("#alert-modal"),
    headText: $("#alert-heading-text"),
    text: $("#alert-text"),
    chooseWrapper: $("#alert-choose"),
    confirmWrapper: $("#alert-simple"),
    cancel: $("#alert-cancel"),
    confirm: $("#alert-confirm"),
    ok: $("#alert-ok")
}

export function showAlert(headText = "", text = "", confirm = false){
    const defaultHeadText = "Server n<img src='./img/skull-alert.png'>t resp<img src='./img/skull-alert.png'>nding";
    const defaultText = "I just don't know what went wrong<br><span class=red>Try again later</span>";

    if(!headText){
        headText = defaultHeadText;
    }
    if(!text){
        text = defaultText;
    }

    $$(".modal").forEach(el => {
        el.classList.remove("show-modal");
    });

    alertEl.headText.innerHTML = headText;
    alertEl.text.innerHTML = text;
    alertEl.modal.classList.add("show-alert");
    alertEl.modal.focus();

    if(confirm){
        alertEl.modal.classList.add("show-alert");
        alertEl.chooseWrapper.classList.add("alert-submenu-show");
        alertEl.confirmWrapper.classList.remove("alert-submenu-show");

        alertEl.modal.onclick = null;
        alertEl.modal.onkeypress = null;

        return new Promise((resolve, reject) => {
            alertEl.confirm.onclick = () => {
                alertEl.modal.classList.remove("show-alert");
                resolve(true);
            }
            
            alertEl.cancel.onclick = () => {
                alertEl.modal.classList.remove("show-alert");
                resolve(false);
            }
        });
    } else {
        alertEl.confirmWrapper.classList.add("alert-submenu-show");
        alertEl.chooseWrapper.classList.remove("alert-submenu-show");

        alertEl.ok.onclick = () => alertEl.modal.classList.remove("show-alert");
        alertEl.modal.onclick = (e) => {
            if(e.target.id == "alert-modal"){
                alertEl.modal.classList.remove("show-alert");
            }
        };
        alertEl.modal.onkeydown = (e) => {
            if(e.key == "Enter" || e.key == "Escape"){
                alertEl.modal.classList.remove("show-alert");
            }
        };
    }
}

export function addSingleQuoteSlashes(str){
    return str.replaceAll("'", "\\'");
}
export function escapeSingleQuotes(str){
    return str.replaceAll("'", "&#39;");
}