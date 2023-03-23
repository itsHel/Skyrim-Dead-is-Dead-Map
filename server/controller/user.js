const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { sendMail } = require("./mail");
const db = require("../database");

async function tryLogin(req, res){
    if(req.body.init){
        if(req.session?.authorized){
            return res.json({
                success: "logged-in",
                user: req.session.user
            });
        } else {
            return res.json({error: "init-missing"});
        }
    }

    if(!req.session?.authorized){
        const { nickOrMail, pass } = req.body;

        let sql = `SELECT nick, pass, public FROM users WHERE nick = ? OR mail = ?`;
        let params = [nickOrMail, nickOrMail];
        let userSelect = await db.selectOne(sql, params).catch(_ => ({ error: true }));

        if(userSelect?.error){
            return res.status(500).json(userSelect);
        }

        if(!userSelect){
            return res.json({error: "not-found"});
        }
        
        const valid = bcrypt.compare(pass, userSelect.pass);
        
        if(!valid){
            return res.json({error: "wrong-pass"});
        }

        const user = {
            nick: userSelect.nick,
            public: userSelect.public
        };

        return login(req, res, user);
    }
    
    return res.json({
        success: "logged-in",
        user: req.session.user
    });
}

function login(req, res, user){
    req.session.user = user;
    req.session.authorized = true;

    return res.json({
        success: "logged-in",
        user: req.session.user
    });
}

function logout(req, res){
    req.session.destroy();

    return res.json({ success: "logged-out" });
}

async function del(req, res){
    const nick = req.session?.user?.nick || "";

    let sql = `DELETE FROM data WHERE nick = ?`;
    let params = [nick];
    let result = await db.query(sql, params).catch(_ => ({ error: true }));

    if(result.error){
        return res.status(500).json(result);
    }
    
    sql = `DELETE FROM users WHERE nick = ?`;

    req.session.destroy();

    return db.query(sql, params)
        .then(_ => res.json({ success: true }))
        .catch(_ => res.status(500).json({ error: true }));
}

function editSetting(req, res){
    const { setting, value } = req.body;
    const nick = req.session?.user?.nick || "";

    let sql = "UPDATE users SET ?? = ? WHERE nick = ?";
    let params = [setting, value, nick];

    return db.query(sql, params)
        .then(_ => res.json({ success: true }))
        .catch(_ => res.status(500).json({ error: true }));
}

async function resetPass(req, res){
    const { mail, pass, code } = req.body;
    
    let sql = `SELECT pass_reset, nick, public FROM users WHERE mail = ?`;
    let params = [mail];
    let select = await db.selectOne(sql, params).catch(_ => ({ error: true }));

    if(select?.error){
        return res.status(500).json(select);
    }
    if(!select){
        return res.json({ error: "forgot-not-found" });
    }

    let valid = bcrypt.compareSync(code, select.pass_reset);

    if(!valid){
        return res.json({error: "wrong-code"});
    }

    let hashedPass = bcrypt.hashSync(pass, 10);

    sql = `UPDATE users SET pass = ?, pass_reset = '', pass_reset_updated = NULL WHERE mail = ?`;
    params = [hashedPass, mail];

    return db.query(sql, params)
        .then(_ => {
            const user = {
                nick: select.nick,
                public: select.public
            }

            return login(req, res, user);
        })
        .catch(_ => res.status(500).json({ error: true }));
}

async function forgotPassMail(req, res){
    try {
        const { mail } = req.body;
    
        let sql = `SELECT pass_reset_updated FROM users WHERE mail = ?`;
        let params = [mail];
        let select = await db.selectOne(sql, params).catch(_ => ({ error: true }));

        if(select?.error){
            return res.status(500).json(select);
        }
        if(!select){
            return res.json({ error: "forgot-not-found" });
        }
      
        if(select.pass_reset_updated){
            const updated = new Date(select.pass_reset_updated);
            const now = new Date();
            now.setHours(now.getHours() - 1);

            if(updated.getTime() > now.getTime()){
                return res.json({ error: "forgot-countdown" });
            }
        }
    
        const code = crypto.randomBytes(4).toString("hex");
        const hash = bcrypt.hashSync(code, 10);

        sql = `UPDATE users SET pass_reset = ?, pass_reset_updated = NOW() WHERE mail = ?`;
        params = [hash, mail];
    
        let response = await sendMail("forgot-pass", { code }, mail).catch(_ => ({ error: true }));

        if(response.error){
            console.log("ppppppp");
            return res.status(500).json(response);
        }
    
        return db.query(sql, params)
            .then(_ => res.json({ success: "forgot-mail-sent" }))
            .catch(_ => res.status(500).json({ error: true }));
    } catch (error) {
        console.error(error);
        res.status(500).send("db-error");
    }
}

async function register(req, res){
    const { nick, mail, pass, public } = req.body;

    let sql = `SELECT nick, mail FROM users WHERE nick = ? OR mail = ?`;
    let params = [nick, mail];
    let user = await db.selectOne(sql, params).catch(_ => ({ error: true }));

    if(user?.error){
        return res.status(500).json(user);
    }

    if(user){
        let foundColumn = "";

        if(user.nick == nick){
            foundColumn = "nick-exists";
        } else {
            foundColumn = "mail-exists";
        }

        return res.json({error: foundColumn});
    }

    let hashedPass = bcrypt.hashSync(pass, 10);
    sql = `INSERT INTO users (nick, mail, pass, public) VALUES(?, ?, ?, ${parseInt(public)})`;
    params = [nick, mail, hashedPass];
    
    return db.query(sql, params)
        .then(_ => {
            const user = {
                nick: nick,
                public: public
            }

            return login(req, res, user);
        })
        .catch(_ => res.status(500).json({ error: true }));
}

module.exports = {
    tryLogin,
    logout,
    register,
    editSetting,
    del,
    resetPass,
    forgotPassMail
}