const fs = require("fs");

function myLog(text, file = "log", line = null, func = null){
    let d = new Date();
    let time = d.toLocaleTimeString();
    let printText = "[" + time + "]\n";

    if(line){
        printText += "Line: " + line + ((funct) ? ", " : "\n");
    }
    if(func){
        printText += "Function: " + func + "\n";
    }

    printText += text + "\n\n";

    fs.appendFileSync("temp/" + file + ".txt", printText, function(){});
}

function getLine(){
    let e = new Error();
    let frame = e.stack.split("\n")[2];
    return frame.match(/:(\d+):/)[1];
}

function getFunc(){
    let e = new Error();
    let frame = e.stack.split("\n")[2];
    return frame.match(/at\s(.+)\s/)[1];
}

module.exports = {
    myLog,
    getLine,
    getFunc
}