'use strict';

(function(){
    // localStorage used: localStorage["scale"], localStorage["mapType"], localStorage["tableVisited"], localStorage["observedUsers"]

    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    const map = $("#map");
    const mapWrapper = $("#map-wrapper");
    const baseImg = $("#type-select option").value;
    const loading = $("#loading");
    const deathCountEl = $("#count-val");
    const sidemenuUserList = $("#sidemenu-user-list");

    const userColors = ["#cd499c", "#6592cd", "#ab49d4", "#915e88", "#6f67cf", "#40b4ad"];
    const showModalClass = "show-modal";
    const imgDir = "";
    const counterSize = 32;
    const ajaxUrl = "php/ajax/";
    const scalling = {
        "https://www.gamebanshee.com/skyrim/mapofskyrim/skyrimmap.png": "none",
        "https://images.uesp.net/e/ef/SR-map-Skyrim.jpg": "translate(-0.85%, 0.65%) scale(1.05, 1.135)"
    }

    var dragging = false;
    var mapScale = parseFloat(localStorage["scale"] || 1);    
    var mapType = localStorage["mapType"] || baseImg;
    var loadedUsers = [];                       // {nick: "", color: ""}
    var usersTable;
    var loggedNick = "";

    map.src = imgDir + mapType;

    window.addEventListener("load", function(){
        init();
        setupLogin();
        setupTable();
        setupSettings();
    });
    
    if(map.complete){
        mapWrapper.style.opacity = 1;
        mapWrapper.style.transform = "none";
        loading.style.display = "none";
    }

    map.addEventListener("load", function(){
        mapWrapper.style.opacity = 1;
        mapWrapper.style.transform = "none";
        loading.style.display = "none";
    });

    function init(){
        $("nav").style.width = "calc(100vw - " + (window.innerWidth - document.documentElement.clientWidth) + "px)";
        
        map.style.transform = scalling[mapType];
        
        document.documentElement.style.setProperty("--counter-size", counterSize + "px");
        
        setupSidemenu();
        setupFirstVisitTooltips();

        if(localStorage["observedUsers"]){
            try {
                let savedUsers = JSON.parse(localStorage["observedUsers"]);
                
                savedUsers.forEach(user => {
                    if(user != loggedNick){
                        user.loaded = false;
                        addUser(user);
                    }
                });
            } catch(e){
                localStorage["observedUsers"] = "";
            }
        }

        // Select
        let typeSelect = $("#type-select");
        typeSelect.value = mapType;

        if(mapType != baseImg){
            typeSelect.value = mapType;
        }

        typeSelect.addEventListener("change", function(){
            map.src = imgDir + this.value;
            map.style.transform = scalling[this.value];

            if(!map.complete){
                loading.style.display = "block";
            }

            localStorage["mapType"] = this.value;
        });

        customSelect(typeSelect, {theme: "dark"});

        if(mapScale != 1){
            if(map.complete){
                setZoom();
            } else {
                map.addEventListener("load", function(){
                    setZoom();
                });
            }
        } else {
            $("#scale-val").textContent = 100;
        }

        $(".plus").addEventListener("click", function(){
            let newScale = mapScale;
        
            newScale = (newScale * 1.1).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(8, newScale);
        
            mapScale = newScale;
            setZoom();
        });

        $(".minus").addEventListener("click", function(){
            let newScale = mapScale;

            newScale = (newScale / 1.1).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(0.2, newScale);

            mapScale = newScale;
            setZoom();
        });

        mapWrapper.addEventListener("click", function(e){
            if(e.target.nodeName != "IMG")
                return;

            // layerX works in Chrome and Opera despite MDN saying it doesnt
            let x = e.layerX || e.offsetX;
            let y = e.layerY || e.offsetY;

            if(dragging){
                dragging = false;
            } else {
                createCounter(x, y, mapScale);
            }
        });

        window.addEventListener("wheel", wheelZoom, {passive: false});

        window.addEventListener("beforeunload", function(){
            localStorage["scale"] = mapScale;
            localStorage["observedUsers"] = JSON.stringify(loadedUsers);
        });

        window.addEventListener("keydown", function(e){
            if(e.key == "Escape"){
                $("." + showModalClass).classList.remove(showModalClass);
            }
        });

        $$(".modal").forEach(modal => {
            modal.addEventListener("click", function(e){
                if(e.target.classList.contains(showModalClass)){
                    modal.classList.remove(showModalClass);
                }
            });
        })

        mouseGrab($("html"), 2.5);
    }

    function setupFirstVisitTooltips(){
        if(localStorage["tableVisited"])
            return;

        $$(".first-visit-tooltip").forEach(function(el){
            el.addEventListener("click", function(){
                this.classList.remove("visible");
            });
        });

        $("#table-icon").addEventListener("click", function(){
            if(sidemenuUserList.innerHTML)
                return;
            
            $("#observing-nav-tooltip").classList.remove("visible");
            $("#table-tooltip").classList.add("visible");

            localStorage["tableVisited"] = "1";
            
            setTimeout(() => {
                $("#table-tooltip").classList.remove("visible");
            }, 30000);
        }, {once: true});
        
        $("#nav-item-data").addEventListener("click", function(){
            if(sidemenuUserList.innerHTML)
                return;

            $("#observing-nav-tooltip").classList.add("visible");

            setTimeout(() => {
                $("#observing-nav-tooltip").classList.remove("visible");
            }, 30000);
        }, {once: true});
    }

    // Empty nick = load data for current user, otherwise load assigned user
    function loadData(user = null){
        let url = ajaxUrl + "load-data.php";
        let form = new FormData();

        if(user){
            form.append("nick", user.nick);
        }

        return fetch(url, { method: "POST", body: form })
            .then((response) => response.text())
            .then((text) => {
                if(!text)
                    return;

                let data = JSON.parse(text);

                let index = 0;
                let listHtml = "";
                
                for(let i = 0; i < data.length; i++){
                    if(!user){
                        insertCounter(data[i].x, data[i].y, data[i].scale, data[i].count);

                        listHtml += getListItemHtml("x" + data[i].x + "y" + data[i].y + "s" + data[i].scale, data[i].count);

                        index += parseInt(data[i].count);
                    } else {
                        insertDisplayCounter(data[i].x, data[i].y, data[i].scale, data[i].count, data[i].nick, data[i].id, user.color);
                    }
                }

                deathCountEl.textContent = index;

                if(index){
                    $("#sidemenu-list").insertAdjacentHTML("beforeend", listHtml);
                }
            })
            .catch(function(err){ console.log(err) });
    }

    function setupSidemenu(){
        $("#sidemenu-toggle").addEventListener("click", function(){
            let wrapper = this.parentNode;

            if(wrapper.classList.contains("side-hidden")){
                wrapper.classList.remove("side-hidden");
            } else {
                wrapper.classList.add("side-hidden");
            }
        });

        $("#sidemenu-list").addEventListener("mouseup", function(e){
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

        $$(".sidemenu-nav-item").forEach(navItem => {
            navItem.addEventListener("click", function(){
                this.parentNode.querySelector(".active").classList.remove("active");
                this.classList.add("active");

                $$(".sidemenu-part").forEach(part => {
                    if(part.id == this.dataset.showid){
                        part.classList.add("active");
                    } else {
                        part.classList.remove("active");
                    }
                });
            });
        });

        sidemenuUserList.addEventListener("click", function(e){
            // Nick clicked
            if(e.target.classList.contains("added-user")){
                let nick = e.target.closest("li").dataset.nick;

                mapWrapper.querySelectorAll(".ontop").forEach(el => el.classList.remove("ontop"));

                if(e.target.classList.contains("active")){
                    e.target.classList.remove("active");
                } else {
                    sidemenuUserList.querySelector(".active")?.classList.remove("active");
                    e.target.classList.add("active");

                    mapWrapper.querySelectorAll(".counter[data-nick='" + addSingleQuoteSlashes(nick) + "']").forEach(el => el.classList.add("ontop"));
                }
            }

            // Close clicked
            if(e.target.classList.contains("remove-user")){
                let nick = e.target.closest("li").dataset.nick;

                mapWrapper.querySelectorAll(".counter[data-nick='" + addSingleQuoteSlashes(nick) + "']").forEach(el => el.remove());

                usersTable.element.querySelector(".user-loaded[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.classList.remove("user-loaded");

                e.target.closest("li").remove();

                loadedUsers = loadedUsers.filter(user => user.nick != nick);
            }
        });
    }

    function setupTable(){
        const tableNav = `  <th data-column='nick'><span>Nickname<ico></span></th>
                            <th data-column='count'><span>Deaths<ico></span></th>`;
        const modal = $("#user-table-modal");

        let refreshInterval;
        let scrollObserver = null;
        let order = {
            reverse: true,
            column: "deaths"
        };

        loadUsers(0).then(data => {
            if(!data?.length)
                return;

            createTable(data, true);
        });

        $("#table-icon").addEventListener("click", function(){
            if(modal.classList.contains(showModalClass)){
                modal.classList.remove(showModalClass);
            } else {
                modal.classList.add(showModalClass);
            }
        });

        refreshInterval = setInterval(() => {
            refreshUsers();
        }, 60_000);             // SQL query looks for records updated in last minute

        function createTable(data, first = false){
            const tableWrapper = $("#user-table-wrapper-under");

            usersTable = new Table(
                data,
                tableNav,
                tableWrapper,
                createRows,
                {
                    id: "user-table",
                    defaultOrder: "count",
                    firstRender: first,
                    // search: {
                    //     placeholder: "Hello..."
                    // }
                }
            )

            if(first){
                addTableListeners(usersTable.element);
            }

            tableWrapper.scrollTo(0, 0);

            markUsers();
            setupTableScrollObserver();
        }

        function markUsers(){
            loadedUsers.forEach(user => {
                if(user != loggedNick){
                    addUser(user);
                }
            });
            
            if(loggedNick){
                usersTable?.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(loggedNick) + "']")?.classList.add("user-self");
            }
        }

        function refreshUsers(){
            let url = ajaxUrl + "refresh-users.php";

            return fetch(url, { method: "POST" })
                .then((response) => response.text())
                .then((text) => {
                    if(!text)
                        return;

                    let data = JSON.parse(text);

                    if(data.deaths.length){
                        data.deaths.forEach(death => {
                            let userIndex = -1;
                            for(let i = 0; i < loadedUsers; i++){
                                if(loadedUsers[i].nick == death.nick){
                                    userIndex = i;
                                    break;
                                }
                            }

                            if(userIndex == -1)
                                return;

                            let counter = $("#counter-" + death.id);

                            if(counter){
                                if(death.count == 0){
                                    counter.remove();
                                } else {
                                    counter.querySelector(".count").textContent = death.count;
                                }
                            } else {
                                if(death.count != 0){
                                    insertDisplayCounter(death.x, death.y, death.scale, death.count, death.nick, death.id, loadedUsers[userIndex].color);
                                }
                            }
                        });
                    }

                    if(data.total.length){
                        data.total.forEach(total => {
                            usersTable.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(total.nick) + "'] .user-deaths").textContent = total.count;
                        });
                    }

                    return data;
                })
                .catch(function(err){ console.log(err) });
        }

        function loadUsers(from){
            let direction = (order.reverse) ? "desc" : "asc";

            // Reverse direction for count
            if(order.column == "count"){
                direction = (direction == "asc") ? "desc" : "asc";
            }

            let form = new FormData();
            form.append("from", from);
            form.append("order", order.column);
            form.append("direction", direction);

            let url = ajaxUrl + "load-users.php";

            return fetch(url, { method: "POST", body: form })
                .then((response) => response.text())
                .then((text) => {
                    if(text)
                        return JSON.parse(text);
                })
                .catch(function(err){ console.log(err) });
        }

        function createRows(data){
            let html = "";
            
            data.forEach(row => {
                html += "<tr class=row data-nick=\'" + escapeSingleQuotes(row.nick) + "'>" +
                            "<td class=nick data-label='Nickname'>" + row.nick + "</td>" +
                            "<td data-label='Deaths' class=user-deaths>" + row.count + "</td>" +
                        "</tr>";
            });

            return html;
        }

        function addTableListeners(table){
            // table.querySelector("thead tr").addEventListener("click", function(){
            //     // Do everytime ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
            //     loadedUsers.forEach(user => {
            //         table.querySelector(".row[data-nick='" + addSingleQuoteSlashes(user.nick) + "'").classList.add("user-loaded");
            //     });
            // });

            table.addEventListener("click", function(e){
                if(!e.target.closest("th"))
                    return;
                
                let target = e.target.closest("th");

                if(!target.dataset.column){
                    target.style.pointerEvents = "none";
                    return;
                }

                if(target.classList.contains("th-active")){
                    if(target.classList.contains("th-reverse")){
                        order.reverse = false;
                        target.classList.remove("th-reverse");
                    } else {
                        order.reverse = true;
                        target.classList.add("th-reverse");
                    }
                } else {
                    order.reverse = false;
                }
                order.column = target.dataset.column;
                
                target.parentNode.querySelectorAll("th").forEach(el => {
                    if(el != target){
                        el.classList.remove("th-active", "th-reverse");
                    }
                });

                target.classList.add("th-active");

                loadUsers(0).then(data => {
                    if(!data?.length)
                        return;
        
                    createTable(data);
                });
            });

            table.addEventListener("click", function(e){
                if(e.target.classList.contains("nick")){
                    let clickedRow = e.target.parentNode;
                    let clickedNick = clickedRow.dataset.nick;
                    let loadedUsersCount = loadedUsers.length;

                    loadedUsers = loadedUsers.filter(user => user.nick != clickedNick);

                    if(loadedUsers.length != loadedUsersCount){
                        // Remove user
                        removeUser(clickedNick);
                    } else {
                        // Add user
                        let user = {
                            nick: clickedNick,
                            color: userColors[loadedUsers.length % userColors.length],
                            loaded: false
                        };

                        addUser(user);

                        $("#nav-item-data").click();
                        $("#sidemenu-wrapper").classList.remove("side-hidden");
                    }
                }
            });
        }

        function setupTableScrollObserver(){
            const triggerOnNthFromBottom = 6;
            
            if(!scrollObserver){
                const options = {root: $("#user-table-wrapper-under"), rootMargin: "0px", threshold: 1};

                scrollObserver = new IntersectionObserver(function(entries){
                    entries.forEach(entry => {
                        if(entry.isIntersecting){
                            scrollObserver.disconnect();
                            let from = usersTable.element.querySelectorAll(".row").length;
                            
                            loadUsers(from).then(data => {
                                if(!data?.length){
                                    return;
                                }

                                let newHtml = createRows(data);
                                
                                usersTable.element.querySelector("tbody").insertAdjacentHTML("beforeend", newHtml);
                                
                                markUsers();

                                scrollObserver.observe($(".row:nth-last-child(" + triggerOnNthFromBottom + ")"));
                            });
                        }
                    });
                }, options);
            } else {
                scrollObserver.disconnect();
            }

            scrollObserver.observe($(".row:nth-last-child(" + triggerOnNthFromBottom + ")"));
        }
    }

    function addUser(user){
        if(!user.loaded){
            loadData(user).then(_ => {
                user.loaded = true
                loadedUsers.push(user);

                let userLi = "<li data-nick='" + escapeSingleQuotes(user.nick) + "'><span class=remove-user>+</span><span class=added-user>" + user.nick + "</span></li>";
                sidemenuUserList.insertAdjacentHTML("beforeend", userLi);
            });
        }
        
        // Mark user in table if it contains his nick
        usersTable?.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(user.nick) + "']")?.classList.add("user-loaded");
    }
    
    function removeUser(nick){
        mapWrapper.querySelectorAll(".counter[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.forEach(el => el.remove());
        sidemenuUserList.querySelector("[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.remove();

        usersTable?.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.classList.remove("user-loaded");
    }

    function addSingleQuoteSlashes(str){
        return str.replaceAll("'", "\\'");
    }
    function escapeSingleQuotes(str){
        return str.replaceAll("'", "&#39;");
    }

    function setupLogin(){
        const loginIcons = $("#login-icons");
        const loginIco = $("#login-svg");
        const logoutIco = $("#logout-svg");
        const settingsIco = $("#settings-svg");

        const modal = $("#login-modal-full");
        const settingsModal = $("#user-settings-modal");

        const login = {
            wrapper: $("#login-wrapper"),
            nick: $("#login-name"),
            pass: $("#login-pass"),
            confirm: $("#login-confirm"),
            links: $$("#login-link, #login-link-forgot"),
            error: $("#login-error")
        };
        const register = {
            wrapper: $("#register-wrapper"),
            nick: $("#register-name"),
            mail: $("#register-mail"),
            pass: $("#register-pass"),
            confirm: $("#register-confirm"),
            public: $("#public-checkbox"),
            link: $("#register-link"),
            error: $("#register-error")
        };
        const forgot = {
            wrapper: $("#forgot-wrapper"),
            mail: $("#forgot-mail"),
            create: $("#forgot-send"),
            code: $("#forgot-code"),
            pass: $("#forgot-pass"),
            confirm: $("#forgot-confirm"),
            link: $("#forgot-link"),
            error: $("#forgot-error")
        };

        // Check if user still logged
        sendLoginRequest("init");

        $$(".pass-hide-toggle").forEach(el => {
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

        login.wrapper.querySelectorAll("input").forEach(function(input){
            input.addEventListener("keypress", (e) => {
                if(e.key == "Enter"){
                    login.confirm.click();
                }
            });
        });
        register.wrapper.querySelectorAll("input").forEach(function(input){
            input.addEventListener("keypress", (e) => {
                if(e.key == "Enter"){
                    register.confirm.click();
                }
            });
        });
        forgot.wrapper.querySelector("#forgot-mail").addEventListener("keypress", (e) => {
            if(e.key == "Enter"){
                forgot.create.click();
            }
        });
        forgot.wrapper.querySelectorAll("#forgot-code, #forgot-pass").forEach(function(input){
            input.addEventListener("keypress", (e) => {
                if(e.key == "Enter"){
                    forgot.confirm.click();
                }
            });
        });
        
        // Add focus on transition end
        modal.addEventListener("transitionend", function(e){
            if(e.propertyName == "opacity" && e.target.classList.contains("modal") && modal.classList.contains(showModalClass)){
                let input = modal.querySelector("input");
                input.focus();
            }
        });

        loginIcons.addEventListener("click", function(e){
            if(e.target.closest("svg").id == "login-svg"){
                modal.classList.add(showModalClass);
            }

            if(e.target.closest("svg").id == "settings-svg"){
                settingsModal.classList.add(showModalClass);                
            }
        });
        logoutIco.addEventListener("click", function(){
            sendLoginRequest("logout");
        });

        login.confirm.addEventListener("click", function(){
            if(!validateLogin())
                return;
            
            sendLoginRequest("login");
        });
        register.confirm.addEventListener("click", function(){
            if(!validateRegister())
                return;

            sendLoginRequest("register");
        });
        forgot.create.addEventListener("click", function(){
            if(!validateForgotCreate())
                return;

            sendLoginRequest("forgot-create");
        });
        forgot.confirm.addEventListener("click", function(){
            if(!validateForgotConfirm())
                return;

            sendLoginRequest("forgot-confirm");
        });

        login.links.forEach(link => {
            link.addEventListener("click", function(){
                login.wrapper.classList.remove("hide-login");
                register.wrapper.classList.add("hide-login");
                forgot.wrapper.classList.add("hide-login");
                login.nick.focus();
            });
        });
        register.link.addEventListener("click", function(){
            login.wrapper.classList.add("hide-login");
            register.wrapper.classList.remove("hide-login");
            forgot.wrapper.classList.add("hide-login");
            register.nick.focus();
        });
        forgot.link.addEventListener("click", function(){
            login.wrapper.classList.add("hide-login");
            register.wrapper.classList.add("hide-login");
            forgot.wrapper.classList.remove("hide-login");
            forgot.mail.focus();
        });

        function sendLoginRequest(type){
            let url = ajaxUrl;
            let form = new FormData();

            switch(type){
                case "logout":
                    url += "logout.php";
                    break;
                case "login":
                    url += "login.php";

                    form.append("nick", login.nick.value);
                    form.append("pass", login.pass.value);
                    break;
                case "register":
                    url += "register.php";
                    
                    form.append("nick", register.nick.value);
                    form.append("mail", register.mail.value);
                    form.append("pass", register.pass.value);
                    form.append("public", register.public.checked);
                    break;
                case "forgot-create":
                    url += "forgot-create.php";
                    
                    form.append("mail", forgot.mail.value);
                    break;
                case "forgot-confirm":
                    url += "forgot-reset.php";
                    
                    form.append("mail", forgot.mail.value);
                    form.append("pass", forgot.pass.value);
                    form.append("code", forgot.code.value);
                    break;
                case "init":
                    url += "login.php";
                    
                    form.append("init", true);
                    break;
            }

            fetch(url, { method: "POST", body: form })
                .then((response) => response.text())
                .then((text) => {

                    // If successfully logged - json object is returned, otherwise string
                    if(text[0] == "{"){
                        let user = JSON.parse(text);
                        
                        modal.classList.remove(showModalClass);
                        loggedNick = user.nick;
                        settingsIco.style.display = "block";
                        loginIco.style.display = "none";
                        
                        if(usersTable){
                            usersTable.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(user.nick)+ "']")?.classList.add("user-self");
                            removeUser(user.nick);
                        }
                        
                        modal.querySelectorAll("input", input => {
                            input.value = "";
                        });
                        modal.querySelectorAll(".login-part-error", div => {
                            div.textContent = "";
                        });

                        $("#nick-text").textContent = user.nick;
                        $("#settings-public-checkbox").checked = parseInt(user.public);
                        
                        return;
                    }

                    switch(text){
                        case "credentials":
                            toggleError("Wrong credentials", login.error);
                            break;
                        case "mail-exists":
                            toggleError("Email is taken", register.error);
                            break;
                        case "nick-exists":
                            toggleError("Nick is taken", register.error);
                            break;
                        case "empty":
                            toggleError("All values are mandatory", register.error);
                            break;
                        case "not-found":
                            toggleError("Not found", login.error);
                            break;
                        case "forgot-not-found":
                            toggleError("Not found", forgot.error);
                            break;
                        case "forgot-sent":
                            toggleError("Email sent", forgot.error);
                            break;
                        case "forgot-countdown":
                            toggleError("Email was already sent", forgot.error);
                            break;
                        case "logged-out":
                            location.reload();
                            break;
                        default:
                            deathCountEl.textContent = 0;
                            break;
                    }
                })
                .catch(function(err){ console.log(err) });
        }

        function validateLogin(){
            if(!login.nick.value){
                toggleError("Empty nickname", login.error);
                return false;
            }
            if(login.nick.value.trim() != login.nick.value){
                toggleError("Nickname cannot start or end with space", login.error);
                return false;
            }

            if(!login.pass.value){
                toggleError("Empty password", login.error);
                return false;
            }

            return true;
        }

        function validateForgotCreate(){
            if(!forgot.mail.value){
                toggleError("Empty email", forgot.error);
                return false;
            }
            if(!forgot.mail.value.match(/.+@.+/)){
                toggleError("Wrong email format", forgot.error);
                return false;
            }
            if(forgot.mail.value.trim() != forgot.mail.value){
                toggleError("Email cannot start or end with space", forgot.error);
                return false;
            }

            return true;
        }
        function validateForgotConfirm(){
            if(!forgot.pass.value){
                toggleError("Empty password", forgot.error);
                return false;
            }
            if(forgot.pass.value.length < 4){
                toggleError("Password is 4 characters minimum", forgot.error);
                return false;
            }

            if(forgot.code.value.length != 8){
                toggleError("Code has 8 characters", forgot.error);
                return false;
            }

            return true;
        }

        function validateRegister(){
            if(!register.pass.value){
                toggleError("Empty password", register.error);
                return false;
            }
            if(register.pass.value.length < 4){
                toggleError("Password is 4 characters minimum", register.error);
                return false;
            }

            if(!register.nick.value){
                toggleError("Empty nickname", register.error);
                return false;
            }
            if(register.nick.value.trim() != register.nick.value){
                toggleError("Nickname cannot start or end with space", register.error);
                return false;
            }

            if(!register.mail.value){
                toggleError("Empty email", register.error);
                return false;
            }
            if(!register.mail.value.match(/.+@.+/)){
                toggleError("Wrong email format", register.error);
                return false;
            }
            if(register.mail.value.trim() != register.mail.value){
                toggleError("Email cannot start or end with space", register.error);
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

    function saveData(x, y, scale, count){
        let url = ajaxUrl + "savedata.php";
        let form = new FormData();

        form.append("x", x);
        form.append("y", y);
        form.append("scale", scale);
        form.append("count", count);

        fetch(url, { method: "POST", body: form })
            .catch(function(err){ console.log(err) });
    }

    function setupSettings(){
        $("#settings-public-checkbox").addEventListener("change", function(){
            editProfileSetting("public", (this.checked) ? 1 : 0);
        });

        $("#delete-profile").addEventListener("click", function(){
            $("#delete-profile-confirm-wrapper").style.opacity = 1;
            this.style.pointerEvents = "none";
            this.style.opacity = 0.6;
        });

        $("#delete-profile-confirm").addEventListener("click", function(){
            let url = ajaxUrl + "profile-delete.php";

            fetch(url)
                .then((response) => response.text())
                .then((text) => {
                    if(text == "logged-out"){
                        location.reload();
                    }
                })
                .catch(function(err){ console.log(err) });
        });

        function editProfileSetting(setting, value){
            let url = ajaxUrl + "profile-setting.php";
            let form = new FormData();
    
            form.append("setting", setting);
            form.append("value", value);
    
            fetch(url, { method: "POST", body: form })
                .catch(function(err){ console.log(err) });
        }
    }

    // On load
    function insertCounter(x, y, scale, count, nick = ""){
        let saveX = x * (mapScale / scale);
        let saveY = y * (mapScale / scale);

        let html = getCounterHtml(count, saveX, saveY, x, y, scale, nick);

        mapWrapper.insertAdjacentHTML("beforeend", html);

        let div = $(".counter:last-of-type");

        addCounterListeners(div);
    }

    // On table click
    function insertDisplayCounter(x, y, scale, count, nick, id, color){
        let saveX = Math.round(x * (mapScale / scale));
        let saveY = Math.round(y * (mapScale / scale));

        let html = getDisplayCounterHtml(count, saveX, saveY, x, y, scale, nick, id, color);

        mapWrapper.insertAdjacentHTML("beforeend", html);
    }

    // On map click
    function createCounter(x, y, scale){
        let saveX = Math.round(x - ((counterSize / 2) * scale) - scale);
        let saveY = Math.round(y - ((counterSize / 2) * scale) - scale);
        
        let html = getCounterHtml(1, saveX, saveY);

        mapWrapper.insertAdjacentHTML("beforeend", html);

        let div = $(".counter:last-of-type");
        
        div.focus();

        deathCountEl.textContent = parseInt(deathCountEl.textContent) + 1;
        save(saveX, saveY, scale, 1);
        
        addCounterListeners(div);
    }

    function addCounterListeners(div){
        let countDiv = div.querySelector(".count");

        div.addEventListener("click", function(e){
            if(!e.target.closest(".arrow-bottom")){
                // ++
                countDiv.textContent = parseInt(countDiv.textContent) + 1;
                
                deathCountEl.textContent = parseInt(deathCountEl.textContent) + 1;
            } else {
                // --
                countDiv.textContent = parseInt(countDiv.textContent) - 1;

                deathCountEl.textContent = parseInt(deathCountEl.textContent) -1;

                if(countDiv.textContent == 0){
                    countDiv.closest(".counter").remove();
                }
            }

            save(div.dataset.basex, div.dataset.basey, div.dataset.scale, countDiv?.textContent ?? 0);
        });
    }

    function getCounterHtml(count, x, y, basex = x, basey = y, scale = mapScale){
        let html = `<div id="counter-x${basex}y${basey}s${scale}" class="counter" style="left: ${x}px; top: ${y}px; transform:scale(${mapScale})" data-basex="${basex}" data-basey="${basey}" data-scale=${scale} tabindex=${count}>
                        <span class="arrow arrow-top"><svg viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z"/></svg></span>
                        <span class=count>${count}</span>
                        <span class="arrow arrow-bottom"><svg viewBox="0 0 24 24"><path d="M24 24H0V0h24v24z" fill="none" opacity=".87"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg></span>
                    </div>`;

        return html;
    }

    function getDisplayCounterHtml(count, x, y, basex = x, basey = y, scale = mapScale, nick, id, color){
        let html = `<div id="counter-${id}" class="counter display-only-counter" title="${nick}" style="left: ${x}px; top: ${y}px; transform:scale(${mapScale}); background: ${color} !important; border-color: ${color};" data-basex="${basex}" data-basey="${basey}" data-scale=${scale} data-nick=${escapeSingleQuotes(nick)}>
                        <span class=count>${count}</span>
                    </div>`;

        return html;
    }

    function getCounterId(x, y, scale){
        let divName = "x" + Math.round(x) + "y" + Math.round(y) + "s" + scale;

        return divName;
    }

    function mouseGrab(grabElement, dragMultiplier = 2){
        let pos = {
            clickX: 0,
            clickY: 0,
            clickScrollX: 0,
            clickScrollY: 0,
            coordsLeft: 0,
            coordsTop: 0
        };

        grabElement.addEventListener("mousedown", function(e){
            if(e.target.id != "map" || e.button != 0)               // button 0 = mouse left button
                return;

            window.addEventListener("mousemove", mouseMoveGrab);
            document.body.classList.add("grabbed");
            
            let coords = grabElement.getBoundingClientRect();

            pos.clickX = e.clientX - coords.left;
            pos.clickY = e.clientY - coords.top;
            pos.clickScrollX = grabElement.scrollLeft;
            pos.clickScrollY = grabElement.scrollTop;
            pos.coordsLeft = coords.left;
            pos.coordsTop = coords.top;
            
            window.addEventListener("mouseup", function(){
                window.removeEventListener("mousemove", mouseMoveGrab);
                document.body.classList.remove("grabbed");
                
                if(Math.abs(grabElement.scrollLeft - pos.clickScrollX) > 5 || Math.abs(grabElement.scrollTop - pos.clickScrollY) > 5){
                    dragging = true;
                }
            }, {once: true});
        });
        
        function mouseMoveGrab(e){
            let newX = - pos.clickX + e.clientX - pos.coordsLeft;
            let newY = - pos.clickY + e.clientY - pos.coordsTop;

            grabElement.scrollTo(pos.clickScrollX - newX * dragMultiplier, pos.clickScrollY - newY * dragMultiplier);
        }
        
        if(!$("#grab-style")){
            let grabStyle = "<style id=grab-style>body.grabbed *{cursor:grab !important}</style>";
            document.body.insertAdjacentHTML("afterend", grabStyle);
        }
    }

    function setZoom(){
        // Save scroll
        let oldWidth = $("body").offsetWidth;
        let widthRatio = window.scrollX / oldWidth;
        let oldHeight = $("body").offsetHeight;
        let heightRatio = window.scrollY / oldHeight;

        map.width = map.dataset.width * mapScale;
        map.height = map.dataset.height * mapScale;

        // Zoom texts
        mapWrapper.querySelectorAll(".counter").forEach((el) => {
            let zoomEdit = mapScale / el.dataset.scale;
            el.style.left = (parseInt(el.dataset.basex) * zoomEdit) + "px";
            el.style.top = (parseInt(el.dataset.basey) * zoomEdit) + "px";
            el.style.transform = "scale(" + mapScale + ")";
        });

        $("#scale-val").textContent = parseInt(mapScale * 100);

        // Scroll to previous pos
        let newHeight = $("body").offsetHeight;
        let newTop = newHeight * heightRatio;
        
        let newWidth = $("body").offsetWidth;
        let newLeft = newWidth * widthRatio;

        window.scroll({left: newLeft, top: newTop});
    }

    function save(x, y, scale, count){
        let divName = getCounterId(x, y, scale);

        editList(divName, count);

        saveData(x, y, scale, count);
    }

    function editList(id, count){
        let target = document.getElementById(id);                       // getElementById because id contains dot

        if(count == 0){
            target.remove();
            return;
        } 

        if(!target){
            $("#sidemenu-list").insertAdjacentHTML("beforeend", getListItemHtml(id));
        } else {
            target.textContent = count;
        }
    }

    function getListItemHtml(id, count = 1){
        let html = `<li id="${id}">${count}</li>`;
        return html;
    }

    function wheelZoom(e){
        if(e.ctrlKey){
            e.preventDefault();

            if(e.deltaY < 0){
                $(".plus").click();
            } else {
                $(".minus").click();
            }
        }
    }
})();
