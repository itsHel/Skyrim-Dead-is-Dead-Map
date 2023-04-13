import { addSingleQuoteSlashes, escapeSingleQuotes, $, $$ } from "./uti";
import { $main } from "./settings";
import { loadUserData } from "./loadData";
import { UsersTable } from "./UsersTable";

const $toggle = $("#sidemenu-toggle");
const $list = $("#sidemenu-list");
const $navItem = $$(".sidemenu-nav-item");
const $sidemenuParts = $$(".sidemenu-part");
const $userList = $("#sidemenu-user-list");
const $wrapper = $("#sidemenu-wrapper");

export const Sidemenu = {
    loadedUsers: [],                       // {nick: "", color: ""}

    init: function(){
        const self = this;

        $toggle.addEventListener("click", function(){
            let $wrapper = this.parentNode;

            if($wrapper.classList.contains("side-hidden")){
                $wrapper.classList.remove("side-hidden");
            } else {
                $wrapper.classList.add("side-hidden");
            }
        });

        $list.addEventListener("mouseup", function(e){
            if(e.target.nodeName == "LI"){
                let target = document.getElementById("counter-" + e.target.id);             // getElementById because id contains dot

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center"
                });

                target.focus({preventScroll: true});
            }
        });

        $navItem.forEach(navItem => {
            navItem.addEventListener("click", function(){
                this.parentNode.querySelector(".active").classList.remove("active");
                this.classList.add("active");

                $sidemenuParts.forEach(part => {
                    if(part.id == this.dataset.showid){
                        part.classList.add("active");
                    } else {
                        part.classList.remove("active");
                    }
                });
            });
        });

        $userList.addEventListener("click", function(e){
            // Nick clicked
            if(e.target.classList.contains("added-user")){
                let nick = e.target.closest("li").dataset.nick;

                $main.mapWrapper.querySelectorAll(".ontop").forEach(el => el.classList.remove("ontop"));

                if(e.target.classList.contains("active")){
                    e.target.classList.remove("active");
                } else {
                    $userList.querySelector(".active")?.classList.remove("active");
                    e.target.classList.add("active");

                    $main.mapWrapper.querySelectorAll(".counter[data-nick='" + addSingleQuoteSlashes(nick) + "']").forEach(el => el.classList.add("ontop"));
                }
            }

            // Close clicked
            if(e.target.classList.contains("remove-user")){
                let nick = e.target.closest("li").dataset.nick;

                $main.mapWrapper.querySelectorAll(".counter[data-nick='" + addSingleQuoteSlashes(nick) + "']").forEach(el => el.remove());

                UsersTable.markUser(nick);

                e.target.closest("li").remove();

                self.loadedUsers = self.loadedUsers.filter(user => user.nick != nick);
            }
        });
    },
    editList: function(x, y, scale, count){
        let id = this.createListItemId(x, y, scale);
        let target = document.getElementById(id);                       // getElementById because id contains dot
    
        if(count == 0){
            target.remove();
            return;
        }
    
        if(!target){
            this.addPlayerItem(x, y, scale, count);
        } else {
            // Order elements without re-render
            target.textContent = count;
    
            let prevElement = target.previousElementSibling;
            let nextElement = target.nextElementSibling;
            let swap = false;
    
            while(prevElement?.previousElementSibling && count > parseInt(prevElement?.previousElementSibling.textContent)){
                if(swap){
                    prevElement = prevElement.previousElementSibling;
                } else {
                    swap = true;
                }
            }
    
            if(swap || count > parseInt(prevElement?.textContent)){
                swapSidemenuLi(target, prevElement, parseInt(target.previousElementSibling.textContent));
                swap = false;
            }
    
            while(nextElement?.nextElementSibling && count < parseInt(nextElement?.nextElementSibling.textContent)){
                if(swap){
                    nextElement = nextElement.nextElementSibling;
                } else {
                    swap = true;
                }
            }
    
            if(swap || count < parseInt(nextElement?.textContent)){
                swapSidemenuLi(target, nextElement, parseInt(target.nextElementSibling.textContent));
            }
        }
    
        function swapSidemenuLi(firstLi, secondLi, lastCount){
            const id = firstLi.id;
            const count = parseInt(firstLi.textContent);
    
            firstLi.id = secondLi.id;
            firstLi.textContent =  lastCount;
    
            secondLi.textContent = count;
            secondLi.id = id;
        }
    },
    addPlayerItem: function(x, y, scale, count = 1){
        let id = this.createListItemId(x, y, scale);
        let html = `<li id="${id}">${count}</li>`;
        
        $list.insertAdjacentHTML("beforeend", html);
    },
    createListItemId: function(x, y, scale){
        return "x" + x + "y" + y + "s" + scale;
    },
    clearPlayer: function(){
        $list.innerHTML = "";
    },
    show: function(){
        $wrapper.classList.remove("side-hidden");
    },
    addObservedUser: function(user){
        if(!user.loaded){
            loadUserData(user).then(_ => {
                user.loaded = true
                this.loadedUsers.push(user);

                let userLi = `  <li data-nick='${escapeSingleQuotes(user.nick)}'>
                                    <span class=remove-user>+</span>
                                    
                                    <span class=added-user style='color:${user.color}'>${user.nick}</span>
                                </li>`;

                $userList.insertAdjacentHTML("beforeend", userLi);
            });
        }
        
        // Mark user in table if it contains his nick
        UsersTable.markUser(user.nick);
    },
    removeObservedUser: function(nick){
        $main.mapWrapper.querySelectorAll(".counter[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.forEach(el => el.remove());
        $userList.querySelector("[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.remove();

        this.loadedUsers = this.loadedUsers.filter(user => user.nick != nick);
        UsersTable.unmarkUser(nick);
    }
}