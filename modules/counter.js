import { showAlert, escapeSingleQuotes, $, $$ } from "./uti.js";
import { setting, global, $main } from "./settings.js";
import { logout } from "./login.js";
import { Sidemenu } from "./sidemenu.js";

export const Counter = {
    size: 32,

    create: function(x, y, scale){
        // On map click
        let saveX = Math.round(x - ((this.size / 2) * scale) - scale);
        let saveY = Math.round(y - ((this.size / 2) * scale) - scale);
        
        let html = getCounterHtml(1, saveX, saveY);
    
        $main.mapWrapper.insertAdjacentHTML("beforeend", html);
    
        let div = $(".counter:last-of-type");
        
        div.focus();
    
        $main.deathCountEl.textContent = parseInt($main.deathCountEl.textContent) + 1;
        save(saveX, saveY, scale, 1);
        
        addCounterListeners(div);
    },
    insert: function(x, y, scale, count){
        // On login
        let saveX = x * (global.mapScale / scale);
        let saveY = y * (global.mapScale / scale);
    
        let html = getCounterHtml(count, saveX, saveY, x, y, scale);
    
        $main.mapWrapper.insertAdjacentHTML("beforeend", html);
    
        let div = $(".counter:last-of-type");
    
        addCounterListeners(div);
    },
    insertDisplayOnly: function(x, y, scale, count, nick, id, color){
        let saveX = Math.round(x * (global.mapScale / scale));
        let saveY = Math.round(y * (global.mapScale / scale));
    
        let html = getDisplayCounterHtml(count, saveX, saveY, x, y, scale, nick, id, color);
    
        $main.mapWrapper.insertAdjacentHTML("beforeend", html);
    },
    saveToServer: function(x, y, scale, count, target){
        let url = setting.ajaxUrl + "user-action/save-counter";
        let data = {
            x: parseInt(x),
            y: parseInt(y),
            scale: parseFloat(scale),
            count: parseInt(count)
        }
    
        return fetch(url, { method: "POST", headers: {"Content-type": "application/json"}, credentials: "include", body: JSON.stringify(data) })
            .then((response) => {
                if(!response.ok)
                    throw new Error;
            })
            .catch(function(err){
    console.log(err);
 
                target?.classList.add("unsaved");
                logout();
                showAlert();
                global.errorShown = true;
            });
    },
    getPosFromCounter: function(el){
        let id = el.id;
    
        let x = id.match(/x(\d+)y/)[1];
        let y = id.match(/y(\d+)s/)[1];
        let scale = id.match(/s([^s]+)$/)[1];
    
        return {
            x: x,
            y: y,
            scale: scale
        }
    }
}

function getDisplayCounterHtml(count, x, y, basex = x, basey = y, scale = global.mapScale, nick, id, color){ 
    let html = `<div id="counter-${id}" class="counter display-only-counter" title="${nick}" style="left: ${x}px; top: ${y}px; transform:scale(${global.mapScale}); background: ${color} !important; border-color: ${color};" data-basex="${basex}" data-basey="${basey}" data-scale=${scale} data-nick=${escapeSingleQuotes(nick)}>
                    <span class=count>${count}</span>
                </div>`;

    return html;
}

function getCounterHtml(count, x, y, basex = x, basey = y, scale = global.mapScale){
    let html = `<div id="counter-x${basex}y${basey}s${scale}" class="counter" style="left: ${x}px; top: ${y}px; transform:scale(${global.mapScale})" data-basex="${basex}" data-basey="${basey}" data-scale=${scale} tabindex=${count}>
                    <span class="arrow arrow-top"><svg viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z"/></svg></span>
                    <span class=count>${count}</span>
                    <span class="arrow arrow-bottom"><svg viewBox="0 0 24 24"><path d="M24 24H0V0h24v24z" fill="none" opacity=".87"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg></span>
                </div>`;

    return html;
}

function addCounterListeners(div){
    let countDiv = div.querySelector(".count");

    div.addEventListener("click", function(e){
        if(!e.target.closest(".arrow-bottom")){
            // ++
            countDiv.textContent = parseInt(countDiv.textContent) + 1;
            
            $main.deathCountEl.textContent = parseInt($main.deathCountEl.textContent) + 1;
        } else {
            // --
            countDiv.textContent = parseInt(countDiv.textContent) - 1;

            $main.deathCountEl.textContent = parseInt($main.deathCountEl.textContent) -1;

            if(countDiv.textContent == 0){
                countDiv.closest(".counter").remove();
            }
        }

        save(div.dataset.basex, div.dataset.basey, div.dataset.scale, countDiv?.textContent ?? 0);
    });
}

function save(x, y, scale, count){
    let id = getCounterId(x, y, scale);
    let counterEl = document.getElementById("counter-" + id);             // getElementById because id contains dot

    Sidemenu.editList(x, y, scale, count);

    if(global.loggedNick){
        Counter.saveToServer(x, y, scale, count, counterEl);
    } else {
        counterEl?.classList.add("unsaved");
    }
}

function getCounterId(x, y, scale){
    let divName = "x" + Math.round(x) + "y" + Math.round(y) + "s" + scale;

    return divName;
}