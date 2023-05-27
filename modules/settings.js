import { $, $$ } from "./uti.js";

export const $main = {
    map: $("#map"),
    mapWrapper: $("#map-wrapper"),
    loading: $("#loading"),
    deathCountEl: $("#count-val") 
}

export const setting = {
    devMode: true,
    baseImg: $("#type-select option").value,
    dragMultiplier: 1.5,
    showModalClass: "show-modal",
    imgDir: "",
    ajaxUrl: "http://127.0.0.1:3000/",
    scalling: {
       "map-marked.png": "none",
       "map-original.jpg": "translate(-0.85%, 0.65%) scale(1.05, 1.135)"
   }
}

export const global = {
    mapScale: parseFloat(localStorage["scale"] || 1), 
    mapType: localStorage["mapType"] || setting.baseImg,
    loggedNick: "",
    errorShown: false
}