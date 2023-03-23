const mysql = require("mysql");
const { myLog } = require("./uti");

const devMode = true;

const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "skyrim-map"
});

database.connect(function (err){
    if(err){
        myLog(err);
        throw(err);
    } else {
        console.log("mysql connected...");
    }
});

// Returns object or null
function selectOne(sql, params = []){
    return new Promise((resolve, reject) => {
        sql += " LIMIT 1";
        sql = mysql.format(sql,  params);

        database.query(sql, (err, result) => {
            if(err){
                console.log(err);

                if(devMode){
                    throw(err);
                } else {
                    myLog(err);
                    reject(err);
                }
            }

            if(result?.length){
                resolve(result[0]);
            } else {
                resolve(null);
            }
        });
    });
}

// Returns array
function select(sql, params = []){
    return new Promise((resolve, reject) => {
        sql = mysql.format(sql,  params);

        database.query(sql, (err, result) => {
            if(err){
                console.log(err);

                if(devMode){
                    throw(err);
                } else {
                    myLog(err);
                    reject(err);
                }
            }

            resolve(result);
        });
    });
}

// Retuns object on success, null on err
function query(sql, params = []){
    return new Promise((resolve, reject) => {
        sql = mysql.format(sql,  params);

        database.query(sql, (err, result) => {
            if(err){
                console.log(err);
                
                if(devMode){
                    throw(err);
                } else {
                    myLog(err);
                    reject(err);
                }
            }

            resolve(result);
        });
    });
}

module.exports = {
    select,
    selectOne,
    query, 
    database
}

// let post = {title: "sometitle", text: "sometext"};
// database.query(sql, post, (err, res) => {
//     if(err) throw err;
//     console.log(res);
// });

