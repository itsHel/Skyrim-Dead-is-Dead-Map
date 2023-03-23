const db = require("../database");

async function getLoggedUserData(req, res){
    const nick = req.session?.user?.nick || "";
    let sql = `SELECT x, y, scale, count FROM data WHERE nick = ?`;
    let params = [nick];

    return db.select(sql, params)
        .then(select => res.json({ success: true, data: select }))
        .catch(_ => res.status(500).json({ error: true }));
}

async function getPublicUserData(req, res){
    const { nick } = req.body;
    let sql = `SELECT d.id, d.x, d.y, d.scale, d.count, d.nick FROM data d JOIN users u ON d.nick = u.nick WHERE u.public = 1 AND d.nick = ?`;
    let params = [nick];
    // const sql = `SELECT d.id, d.x, d.y, d.scale, d.count, d.nick FROM data d JOIN users u ON d.nick = u.nick WHERE u.public = 1 AND count != 0 AND d.nick = '${nick}';`;

    return db.select(sql, params)
        .then(select => res.json({ success: true, data: select }))
        .catch(_ => res.status(500).json({ error: true }));
}

async function saveCounter(req, res){
    const { x, y, scale, count } = req.body;
    const nick = req.session?.user?.nick || "";

    if(isNaN(x) || isNaN(y) || isNaN(scale) || isNaN(count)){
        res.json({error: "wrong-input"});
        return;
    }

    let sql = `SELECT x FROM data WHERE x = ${parseInt(x)} AND y = ${parseInt(y)} AND scale = ${parseFloat(scale)} AND nick = ?`;
    let params = [nick];
    let select = await db.selectOne(sql, params).catch(_ => ({ error: true }));

    if(select?.error){
        return res.status(500).json(select);
    }

    if(count == 0){
        sql = `DELETE FROM data WHERE x = ${parseInt(x)} AND y = ${parseInt(y)} AND scale = ${parseFloat(scale)} AND nick = ?`;
    } else {
        if(select){
            sql = `UPDATE data SET count = ${parseInt(count)}, updated = NOW() WHERE x = ${parseInt(x)} AND y = ${parseInt(y)} AND scale = ${parseFloat(scale)} AND nick = ?`;
        } else {
            sql = `INSERT INTO data (x, y, scale, count, nick, updated, created) VALUES(${parseInt(x)}, ${parseInt(y)}, ${parseFloat(scale)}, ${parseInt(count)}, ?, NOW(), NOW())`;
        }
    }
    params = [nick];
console.log(sql);
    return db.query(sql, params)
        .then(_ => res.json({ success: true }))
        .catch(_ => res.status(500).json({ error: true }));
}

async function getAllUsers(req, res){
    const quantity = 50;
    const { from, order, direction, search } = req.body;
    const nick = req.session?.user?.nick || "";
    const finalDirection = (direction == "desc") ? "DESC" : "ASC";

    let params = [];
    let currentUserCondition, fullOrder;

    if(nick){
        currentUserCondition = "d.nick = ? OR";
        params.push(nick);
    } else {
        currentUserCondition = "";
    }

    if(search){
        let searchText = "%" + search + "%";
        searchCondition = "AND d.nick LIKE ?";
        params.push(searchText);
    } else {
        searchCondition = "";
    }


    if(order == "nick"){
        fullOrder = "ORDER BY nick " + finalDirection;
    } else {
        fullOrder = "ORDER BY count " + finalDirection + ", nick ASC";
    }
    
    let sql = `SELECT d.nick, SUM(count) as count FROM data d JOIN users u ON d.nick = u.nick WHERE (${currentUserCondition} u.public = 1 AND count != 0) ${searchCondition} GROUP BY nick ${fullOrder} LIMIT ${parseInt(from)}, ${quantity}`;

    return db.select(sql, params)
        .then(select => res.json({ success: true, data: select }))
        .catch(_ => res.status(500).json({ error: true }));
}

async function refreshUsers(req, res){
    // Get updated deaths
    let sql = `SELECT d.id, d.nick, x, y, scale, count FROM data d JOIN users u ON d.nick = u.nick WHERE u.public = 1 AND updated >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`;
    let select = await db.select(sql).catch(_ => ({ error: true }));

    if(select?.error){
        return res.json(select);
    }

    if(select.length == 0){
        return res.json({
            deaths: [],
            total: []
        });
    }

    let users = [];
    let params = [];
    let usersCondition = "";

    for(let i = 0; i < select.length; i++){
        if(!users.filter(user => user == select[i]["nick"]).length){
            users.push(select[i]["nick"]);

            usersCondition += "d.nick = ? OR ";
            params.push(select[i]["nick"]);
        }
    }

    usersCondition = usersCondition.slice(0, -3);

    // Get updated total deaths
    sql = `SELECT d.nick, SUM(count) as count FROM data d JOIN users u ON d.nick = u.nick WHERE (${usersCondition}) AND u.public = 1 GROUP BY nick ORDER BY count`;

    return db.select(sql, params)
        .then(result => res.json({ deaths: select, total: result }))
        .catch(_ => res.status(500).json({ error: true }));
}

module.exports = {
    getLoggedUserData,
    getPublicUserData,
    saveCounter,
    getAllUsers,
    refreshUsers
}