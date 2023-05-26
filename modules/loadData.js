import { showAlert } from "./uti.js";
import { setting, global, $main } from "./settings.js";
import { Counter } from "./Counter.js";
import { Sidemenu } from "./Sidemenu.js";

// Empty user = load data for current user, otherwise load assigned user
export function loadUserData(user = null){
    let url = setting.ajaxUrl + "getdata/";
    let data = {};

    if(!user){
        url += "logged-user";
    } else {
        url += "public-user";
        data.nick = user.nick;
    }

    return fetch(url, { method: "POST", headers: { "Content-type": "application/json" }, credentials: "include", body: JSON.stringify(data) })
        .then((response) => {
            if(!response.ok)
                throw new Error;

            return response.json();
        })
        .then((result) => {
            if(!result.success)
                return;

            let data = result.data;

            let index = 0;

            data = data.sort((a, b) => b.count - a.count);
            
            if(!user){
                Sidemenu.clearPlayer();
            }

            for(let i = 0; i < data.length; i++){
                if(!user){
                    // Logged user
                    Counter.insert(data[i].x, data[i].y, data[i].scale, data[i].count);

                    Sidemenu.addPlayerItem(data[i].x, data[i].y, data[i].scale, data[i].count);

                    index += parseInt(data[i].count);
                } else {
                    Counter.insertDisplayOnly(data[i].x, data[i].y, data[i].scale, data[i].count, data[i].nick, data[i].id, user.color);
                }
            }

            $main.deathCountEl.textContent = index;
        })
        .catch(function(err){ 
console.log(err);

            if(user){
                if(!global.errorShown){
                    showAlert();
                    global.errorShown = true;
                }
            } else {
                showAlert();
                global.errorShown = true;
            }
        });
}
