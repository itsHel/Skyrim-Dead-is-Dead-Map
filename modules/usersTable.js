import { showAlert, addSingleQuoteSlashes, escapeSingleQuotes, $, $$ } from "./uti.js";
import { setting, global } from "./settings.js";
import { Counter } from "./counter.js";
import { Sidemenu } from "./sidemenu.js";

const userColors = ["#cd499c", "#6592cd", "#ab49d4", "#915e88", "#6f67cf", "#40b4ad"];
const tableRowsLoadCount = 50;

const $modal = $("#user-table-modal");
const $search = $("#search-user");
const $tableIcon = $("#table-icon");

export const UsersTable = {
    table: null,

    init: function(){
        const self = this;
        const tableNavHtml = `  <th data-column='nick'><span>Nickname<ico></span></th>
                                <th data-column='count'><span>Deaths<ico></span></th>`;

        let refreshInterval;
        let scrollObserver = null;
        let searchText = "";
        let order = {
            reverse: true,
            column: "deaths"
        };

        loadUsersForTable(0).then(data => {
            if(!data?.length)
                return;

            createTable(data, true);
        });

//        refreshInterval = setInterval(() => {
//            refreshUsers();
        //}, 3600_000);             // SQL query looks for records updated in last hour 
//        }, 6_000);             // TEMP

        $tableIcon.addEventListener("click", function(){
            if($modal.classList.contains(setting.showModalClass)){
                $modal.classList.remove(setting.showModalClass);
            } else {
                $modal.classList.add(setting.showModalClass);
            }
        });

        $search.addEventListener("keyup", function(){
            searchText = this.value;
            console.log(searchText);
            loadUsersForTable(0).then(data => {
                if(!data?.length)
                    return;
    
                createTable(data);
            });
        });

        function createTable(data, first = false){
            const tableWrapper = $("#user-table-wrapper-under");

            self.table = new Table(
                data,
                tableNavHtml,
                tableWrapper,
                createRows,
                {
                    id: "user-table",
                    defaultOrder: "count",
                    firstRender: first,
                }
            )

            if(first){
                addTableListeners(self.table.element);
            }

            tableWrapper.scrollTo(0, 0);

            if(self.table.element.querySelector(".row").length != 0){
                markUsers();
                setupTableScrollObserver();
                $tableIcon.classList.remove("disabled");
            } else {
                $tableIcon.classList.add("disabled");
            }
        }

        function markUsers(){
            Sidemenu.loadedUsers.forEach(user => {
                if(user != global.loggedNick){
                    Sidemenu.addObservedUser(user);
                }
            });
            
            if(global.loggedNick){
                self.table?.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(global.loggedNick) + "']")?.classList.add("user-self");
            }
        }

        // Interval to find if any observed users added deaths and update them
        function refreshUsers(){
            let url = setting.ajaxUrl + "getdata/refresh-users";

            return fetch(url, { method: "POST", credentials: "include", })
                .then((response) => {
                    if(!response.ok)
                        throw new Error;

                    return response.json();
                })
                .then((result) => {
                    if(result.error)
                        return;

                    if(result.deaths.length){
                        result.deaths.forEach(death => {
                            let userIndex = -1;
            
                            for(let i = 0; i < Sidemenu.loadedUsers.length; i++){
                                if(Sidemenu.loadedUsers[i].nick == death.nick){
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
                                    Counter.insertDisplayOnly(death.x, death.y, death.scale, death.count, death.nick, death.id, Sidemenu.loadedUsers[userIndex].color);
                                }
                            }
                        });
                    }

                    if(result.total.length){
                        result.total.forEach(total => {
                            const tableUserDeathCount = self.table.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(total.nick) + "'] .user-deaths");
                            if(tableUserDeathCount){
                                tableUserDeathCount.textContent = total.count;
                            }
                        });
                    }

                    return result;
                })
                .catch(function(err){
    console.log(err);

                    if(!global.errorShown){
                        showAlert();
                        global.errorShown = true;
                    }
                });
        }

        function loadUsersForTable(from){
            let url = setting.ajaxUrl + "getdata/users-all";
            let direction = (order.reverse) ? "desc" : "asc";

            // Reverse direction for count
            if(order.column == "count"){
                direction = (direction == "asc") ? "desc" : "asc";
            }

            let data = {
                from: from,
                order: order.column,
                direction: direction,
                search: searchText
            }

            return fetch(url, { method: "POST", headers: { "Content-type": "application/json" }, credentials: "include", body: JSON.stringify(data) })
                .then((response) => {
                    if(!response.ok)
                        throw new Error;
    console.log(response);
                    return response.json();
                })
                .then((result) => {
                    if(!result.success)
                        return;

                    return result.data;
                })
                .catch(function(err){
    console.log(err);
                
                    if(!global.errorShown){
                        showAlert();
                        global.errorShown = true;
                    }
                });
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

                loadUsersForTable(0).then(data => {
                    if(!data?.length)
                        return;
        
                    createTable(data);
                });
            });

            table.addEventListener("click", function(e){
                if(e.target.closest(".row")){
                    let clickedRow = e.target.closest(".row");
                    let clickedNick = clickedRow.dataset.nick;

                    if(clickedRow.classList.contains("user-loaded")){
                        // Remove user
                        Sidemenu.removeObservedUser(clickedNick);
                    } else {
                        // Add user
                        let colorIndex = Sidemenu.loadedUsers.length % userColors.length;
                        if(userColors[colorIndex] == Sidemenu.loadedUsers[Sidemenu.loadedUsers.length - 1]?.color){
                            colorIndex++;
                            if(colorIndex == userColors.length){
                                colorIndex = 0;
                            }
                        }

                        let user = {
                            nick: clickedNick,
                            color: userColors[colorIndex],
                            loaded: false
                        };

                        Sidemenu.addObservedUser(user);

                        Sidemenu.show();
                        $("#nav-item-data").click();
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
                            let from = self.table.element.querySelectorAll(".row").length;
                            
                            loadUsersForTable(from).then(data => {
                                if(!data?.length){
                                    return;
                                }

                                let newHtml = createRows(data);
                                self.table.element.querySelector("tbody").insertAdjacentHTML("beforeend", newHtml);
                                
                                markUsers();

                                if(self.table.element.querySelectorAll(".row").length % tableRowsLoadCount == 0){
                                    scrollObserver.observe(self.table.element.querySelector(".row:nth-last-child(" + triggerOnNthFromBottom + ")"));
                                }
                            });
                        }
                    });
                }, options);
            } else {
                scrollObserver.disconnect();
            }

            if(self.table.element.querySelectorAll(".row").length % tableRowsLoadCount == 0){
                scrollObserver.observe(self.table.element.querySelector(".row:nth-last-child(" + triggerOnNthFromBottom + ")"));
            }
        }
    },
    markUser: function(nick, thisUser = false){
        let markClass = (thisUser) ? "user-self" : "user-loaded";

        this.table?.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.classList.add(markClass);
    },
    unmarkUser: function(nick, thisUser = false){
        let markClass = (thisUser) ? "user-self" : "user-loaded";

        this.table?.element.querySelector(".row[data-nick='" + addSingleQuoteSlashes(nick) + "']")?.classList.remove(markClass);
    }
}

function Table(data, nav, parentEl, createRows, options = {}){
    const chevron = '<svg viewBox="2 2 20 20"><path d="M24 24H0V0h24v24z" fill="none" opacity=".87"/><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z"/></svg>';

    options.id = options.id ?? getUniqueId();
    options.tableListeners = options.tableListeners ?? false;               // Callback, receives table element as parameter
    options.filter = options.filter ?? false;
    options.search = options.search ?? false;
    options.orderCaseSensitive = options.orderCaseSensitive ?? false;
    options.defaultOrder = options.defaultOrder ?? false;
    options.firstRender = options.firstRender ?? true;

    this.element = null;

    var self = this;
    var order = {
        reverse: false,
        column: ""
    };

    if(options.defaultOrder){
        order.column = options.defaultOrder;
    } else {
        // Default order is first row
        try { order.column = nav.match(/<th\sdata\-column='(.*?)'/)[1] } catch(e){}
    }

    this.render = function(renderData){
        data = renderData;
        
        let tableBody = createRows(renderData);

        if(options.firstRender){
            nav = nav.replaceAll('<ico>', '<span class="table-chevron">' + chevron + '</span>');
            parentEl.insertAdjacentHTML("beforeend", "<table id='" + options.id + "' class='z-table'>" + "<thead><tr>" + nav + "</tr></thead><tbody>" + tableBody + "</tbody></div>");
        } else {
            parentEl.querySelector("#" + options.id + " tbody").innerHTML = tableBody;
        }

        this.element = parentEl.querySelector("#" + options.id);
        
        if(options.tableListeners)
            options.tableListeners(this.element);

        // Do only once
        if(options.firstRender){
            if(order.column){
                this.element.querySelector("th[data-column='" + order.column + "']").classList.add("th-active");
            } else {
                this.element.querySelector("thead th").classList.add("th-active");
                order.column = this.element.querySelector("thead th").dataset.column;
            }

            if(options.search){
                self.addSearch();
            }

            options.firstRender = false;
        }
    }

    this.addSearch = function(){
        const searchIcon = '<svg viewBox="1 1 20 20"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>';
        
        let placeholder = options.search.placeholder ?? "Search...";
        let searchButton = ((options.search.icon === false) ? "" : "<div class=btn-search>" + searchIcon + "</div>");

        let searchHtml = "<div class=table-search-wrapper>" + searchButton + "<input id='search-" + options.id + "' type=search class=table-search autocomplete=off placeholder='" + placeholder + "'></div>";

        if(options.search.id){
            document.querySelector("#" + options.search.id).innerHTML = searchHtml;
        } else {
            this.appendToOptions(searchHtml);
        }

        let search = document.querySelector("#search-" + options.id);

        search.previousElementSibling.addEventListener("click", function(){
            search.focus();
        });

        search.addEventListener("keyup", function(e){
            if(e.key.toLowerCase() != "enter" && e.key.toLowerCase() != "escape"){
                searchFilter(this.value);
            }
        });
        search.addEventListener("search", function(){
            searchFilter(this.value);
        });

        function searchFilter(query){
            if(!query){
                this.element.querySelectorAll("tbody tr").forEach(row => {
                    row.style.display = "table-row";
                });
                return;
            }
    
            let toHide = [];

            this.element.querySelectorAll("tbody tr").forEach(row => {
                let hide = true;

                row.querySelectorAll("td:not(.search-ignore)").forEach(td => {
                    if(td.textContent.match(query)){
                        hide = false;
                        return false;
                    }
                });

                if(hide){
                    toHide.push(1);
                } else {
                    toHide.push(0);
                }
            });

            this.element.querySelectorAll("tbody tr").forEach((row, index) => {
                if(toHide[index]){
                    row.style.display = "none";
                } else {
                    row.style.display = "table-row";
                }
            });
        }
    }

    this.appendToOptions = function(addHtml){
        let tableOptions = document.querySelector("#table-options-" + options.id);

        if(tableOptions){
            tableOptions.insertAdjacentHTML("beforeend", addHtml);
        } else {
            let tableOptionsHtml = "<div id='table-options-" + options.id + "' class=table-options>" + addHtml + "</div>";
            this.element.insertAdjacentHTML("beforebegin", tableOptionsHtml);
        }
    }

    function getUniqueId(){
        let i = 0;
        let id = "table-";

        do {
            id += i;
            i++;
        } while(document.querySelector("#" + id))

        return id;
    }

    this.render(data);
}
