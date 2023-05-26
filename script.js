'use strict';

import { setting, global, $main } from "modules/settings";
import { showAlert, $, $$ } from "./modules/uti";
import { UsersTable } from "./modules/UsersTable";
import { setupLogin, logout } from "./modules/login";
import { Counter } from "./modules/Counter";
import { Sidemenu } from "./modules/Sidemenu";

// localStorages: localStorage["scale"], localStorage["mapType"], localStorage["tableVisited"], localStorage["observedUsers"], localStorage["loginTooltipShown"]
(function(){
    const $scale = $("#scale-val");
    const $body = $("body");
    const $zoomPlus = $(".plus");
    const $zoomMinus = $(".minus");

    console.log("start");
    let dragging = false;

    $main.map.src = setting.imgDir + global.mapType;

    window.addEventListener("load", function(){
        init();
        setupLogin();
        setupSettings();
        setupFirstVisitTooltips();
        UsersTable.init();
        Sidemenu.init();
    });

    $main.map.addEventListener("load", function(){
        showMap();
    });

    if($main.map.complete){
        console.log(" MAP COMPLETE");
        showMap();
    } else {
        console.log(" MAP NOT COMPLETE");
    }

    function showMap(){
        $main.mapWrapper.style.opacity = 1;
        $main.mapWrapper.style.transform = "none";
        $main.loading.style.display = "none";
    }

    function init(){
        $("nav").style.width = "calc(100vw - " + (window.innerWidth - document.documentElement.clientWidth) + "px)";

        $main.map.style.transform = setting.scalling[global.mapType.replace(/.*\//, "")];

        document.documentElement.style.setProperty("--counter-size", Counter.size + "px");

        if(localStorage["observedUsers"]){
            try {
                let savedUsers = JSON.parse(localStorage["observedUsers"]);
                
                savedUsers.forEach(user => {
                    if(user != global.loggedNick){
                        user.loaded = false;
                        Sidemenu.addObservedUser(user);
                    }
                });
            } catch(e){
                localStorage["observedUsers"] = "";
            }
        }

        // Select
        let typeSelect = $("#type-select");
        typeSelect.value = global.mapType;

        if(global.mapType != setting.baseImg){
            typeSelect.value = global.mapType;
        }

        typeSelect.addEventListener("change", function(){
            $main.map.src = setting.imgDir + this.value;
            $main.map.style.transform = setting.scalling[this.value.replace(/.*\//, "")];

            if(!map.complete){
                $main.loading.style.display = "block";
            }

            localStorage["mapType"] = this.value;
        });

        customSelect(typeSelect, {theme: "dark"});

        if(global.mapScale != 1){
            if($main.map.complete){
                setZoom();
            } else {
                map.addEventListener("load", function(){
                    setZoom();
                });
            }
        } else {
            $scale.textContent = 100;
        }

        $zoomPlus.addEventListener("click", function(){
            let newScale = global.mapScale;
        
            newScale = (newScale * 1.1).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(8, newScale);
        
            global.mapScale = newScale;
            setZoom();
        });

        $zoomMinus.addEventListener("click", function(){
            let newScale = global.mapScale;

            newScale = (newScale / 1.1).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(0.2, newScale);

            global.mapScale = newScale;
            setZoom();
        });

        $main.mapWrapper.addEventListener("click", function(e){
            if(e.target.nodeName != "IMG")
                return;
            
            // layerX works in Chrome and Opera despite MDN saying it doesnt
            let x = e.layerX || e.offsetX;
            let y = e.layerY || e.offsetY;

            if(!dragging){
                Counter.create(x, y, global.mapScale);
            }
        });

        window.addEventListener("wheel", wheelZoom, {passive: false});

        window.addEventListener("beforeunload", function(){
            localStorage["scale"] = global.mapScale;
            localStorage["observedUsers"] = JSON.stringify(Sidemenu.loadedUsers);
        });

        window.addEventListener("keydown", function(e){
            if(e.key == "Escape"){
                $("." + setting.showModalClass)?.classList.remove(setting.showModalClass);
            }
        });

        $$(".modal").forEach(modal => {
            modal.addEventListener("click", function(e){
                if(e.target.classList.contains(setting.showModalClass)){
                    modal.classList.remove(setting.showModalClass);
                }
            });
        })

        mouseGrab($("html"), setting.dragMultiplier);
    }

    function setupFirstVisitTooltips(){
        const tableTooltip = $("#table-tooltip");
        const observingTooltip = $("#observing-nav-tooltip");
        const loginTooltip = $("#login-tooltip");
        const allTooltips = $$(".first-visit-tooltip");

        if(!localStorage["loginTooltipShown"] || true){
            $main.mapWrapper.addEventListener("click", showLoginTooltip);
            $("#login-icons").addEventListener("click", function(){
                loginTooltip.classList.remove("visible");
            }, {once: true});

            function showLoginTooltip(){
                if(global.loggedNick || parseInt($main.deathCountEl.textContent) > 1){
                    $main.mapWrapper.removeEventListener("click", showLoginTooltip);
                    return;
                }

                if(!dragging){
                    allTooltips.forEach(tooltip => tooltip.classList.remove("visible"));
                    loginTooltip.classList.add("visible");

                    $main.mapWrapper.removeEventListener("click", showLoginTooltip);

                    setTimeout(() => {
                        loginTooltip.classList.remove("visible");
                    }, 20_000);
                }
            }

            localStorage["loginTooltipShown"] = 1;
        }

        if(!localStorage["tableVisited"]){
            allTooltips.forEach(function(el){
                el.addEventListener("click", function(){
                    this.classList.remove("visible");
                });
            });

            $("#table-icon").addEventListener("click", function(){
                if(Sidemenu.loadedUsers.length)
                    return;
                
                allTooltips.forEach(tooltip => tooltip.classList.remove("visible"));
                tableTooltip.classList.add("visible");

                localStorage["tableVisited"] = 1;
                
                setTimeout(() => {
                    tableTooltip.classList.remove("visible");
                }, 20_000);
            }, {once: true});
            
            $("#nav-item-data").addEventListener("click", function(){
                if($$(".user-loaded").length)
                    return;

                allTooltips.forEach(tooltip => tooltip.classList.remove("visible"));
                observingTooltip.classList.add("visible");

                setTimeout(() => {
                    observingTooltip.classList.remove("visible");
                }, 20_000);
            }, {once: true});
        }
    }

    function setupSettings(){
        const publicCheckbox = $("#settings-public-checkbox");
        const deleteProfile = $("#delete-profile");

        publicCheckbox.addEventListener("change", function(){
            editProfileSetting("public", (this.checked) ? 1 : 0);
        });

        deleteProfile.addEventListener("click", function(){
            showAlert("Delete", "Are you sure?", deleteConfirm);
        });

        function editProfileSetting(settingName, value){
            let url = setting.ajaxUrl + "user-action/edit-setting";
            let data = {
                setting: settingName,
                value: value
            };

            fetch(url, { method: "POST", headers: { "Content-type": "application/json" }, credentials: "include", body: JSON.stringify(data) })
                .then((response) => {
                    if(!response.ok)
                        throw new Error;
                })
                .catch(function(err){ 
console.log(err);
                    logout();
                    showAlert();
                    global.errorShown = true;
                });
        }
    }

    function deleteConfirm(){
        let url = setting.ajaxUrl + "user-control/delete";

        fetch(url, { method: "GET", credentials: "include" })
            .then((response) => {
                if(!response.ok)
                    throw new Error;

                return response.json();
            })
            .then((result) => {
                if(!result.success){
                    location.reload();
                }
            })
            .catch(function(err){ 
    console.log(err);
                logout();
                showAlert();
                global.errorShown = true;
            });
    }

    function mouseGrab(grabElement, dragMultiplier){
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

            dragging = false;
            window.addEventListener("mousemove", mouseMoveGrab);
            let grabbedTimeout = setTimeout(() => {
                document.body.classList.add("grabbed");
            }, 100);
            
            let coords = grabElement.getBoundingClientRect();

            pos.clickX = e.clientX - coords.left;
            pos.clickY = e.clientY - coords.top;
            pos.clickScrollX = grabElement.scrollLeft;
            pos.clickScrollY = grabElement.scrollTop;
            pos.coordsLeft = coords.left;
            pos.coordsTop = coords.top;
            
            window.addEventListener("mouseup", function(event){
                const minGrabDifference = 5;

                window.removeEventListener("mousemove", mouseMoveGrab);
                clearTimeout(grabbedTimeout);
                document.body.classList.remove("grabbed");

                if(Math.abs(e.clientX - event.clientX) >= minGrabDifference || Math.abs(e.clientY - event.clientY) >= minGrabDifference){
                    dragging = true;
                }
            }, {once: true});
        });
        
        function mouseMoveGrab(e){
            let newX = - pos.clickX + e.clientX - pos.coordsLeft;
            let newY = - pos.clickY + e.clientY - pos.coordsTop;

            grabElement.scrollTo(pos.clickScrollX - newX * dragMultiplier, pos.clickScrollY - newY * dragMultiplier);
        }
    }

    function setZoom(){
        // Save scroll
        let oldWidth = $body.offsetWidth;
        let widthRatio = window.scrollX / oldWidth;
        let oldHeight = $body.offsetHeight;
        let heightRatio = window.scrollY / oldHeight;

        $main.map.width = map.dataset.width * global.mapScale;
        $main.map.height = map.dataset.height * global.mapScale;

        // Zoom texts
        $main.mapWrapper.querySelectorAll(".counter").forEach((el) => {
            let zoomEdit = global.mapScale / el.dataset.scale;
            el.style.left = (parseInt(el.dataset.basex) * zoomEdit) + "px";
            el.style.top = (parseInt(el.dataset.basey) * zoomEdit) + "px";
            el.style.transform = "scale(" + global.mapScale + ")";
        });

        $scale.textContent = parseInt(global.mapScale * 100);

        // Scroll to previous pos
        let newHeight = $body.offsetHeight;
        let newTop = newHeight * heightRatio;
        
        let newWidth = $body.offsetWidth;
        let newLeft = newWidth * widthRatio;

        window.scroll({left: newLeft, top: newTop});
    }

    function wheelZoom(e){
        if(e.ctrlKey){
            e.preventDefault();

            if(e.deltaY < 0){
                $zoomPlus.click();
            } else {
                $zoomMinus.click();
            }
        }
    }
}());
