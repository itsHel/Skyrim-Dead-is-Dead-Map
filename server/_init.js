const db = require("./database");

const devMode = true;

let cmds = [];

cmds.push(`CREATE TABLE IF NOT EXISTS users(
            id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            mail VARCHAR(255) UNIQUE,
            nick VARCHAR(255) UNIQUE,
            pass VARCHAR(255),
            public TINYINT(1),
            pass_reset VARCHAR(255),
            pass_reset_updated DATETIME
        )`);     
            
cmds.push(`CREATE TABLE IF NOT EXISTS data(
            id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nick VARCHAR(255),
            x INT(8),
            y INT(8),
            scale FLOAT(6,2),
            count INT(8),
            updated DATETIME,
            created DATETIME
        )`);

// Dummy data
if(devMode){
    cmds.push("INSERT INTO `users` (nick, pass, public) VALUES ('w','w', 1), ('admin','admin', 1), ('test', 'test', 1), ('hidden', 'hidden', 0), ('new', 'new', 1);");
    cmds.push("INSERT INTO `data` (nick, x, y, count, scale) VALUES ('test', 650,650,111,1), ('test', 740,740,12,1), ('test', 870,870,5,1), ('test',960,960,6,1), ('test', 1100,1100,22,1);");
    cmds.push("INSERT INTO `data` (nick, x, y, count, scale) VALUES ('hidden', 800,800,1000,1), ('hidden', 400,400,12,1);");
    
    for(let i = 0; i < 100; i++){
        cmds.push("INSERT INTO `users` (nick, pass, public) VALUES ('" + i + "','" + i + "', 1);");
        cmds.push("INSERT INTO `data` (nick, x, y, count, scale) VALUES ('" + i + "','" + Math.floor(Math.random()*1500) + "', '" + Math.floor(Math.random()*1500) + "', " + i + ", 1);");
    }
}

cmds.forEach(cmd =>{
    db.query(cmd).catch(console.error);
});