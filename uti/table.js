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
