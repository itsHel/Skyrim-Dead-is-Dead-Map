const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const user = require("../controller/user");

const db = require("../database");
const data = require("../controller/data");

// router.use(validateFields);
// router.use(trimAll);

router.use(validateUser);

router.post("/test", (req, res) => {
    if(req.session.authorized){
        return res.json({ success: "succ" });
    } else {
        return res.json({ error: "unauthorized" });
    }
});

router.post("/save-counter", (req, res) => {
    data.saveCounter(req, res);
});

router.post("/edit-setting", (req, res) => {
    if(req.session.authorized){
        user.editSetting(req, res);
    } else {
        return res.json({ error: "unauthorized" });
    }
});

function validateUser(req, res, next){
    if(req.session?.authorized){
        next();
    } else {
        return res.json({ error: "unauthorized" });
    }
}
 
function validate(req, res, next){
    console.log(req.originalUrl);
    console.log('body');
    console.log(req.body);
    if(!req.body)
        return;

    // ************************ TEMP ************************
    next();
    return;
    for(const property in req.body) {
        if(property != "public" && !req.body[property]){
            console.log(property, " is empty");
            return;
        }
    }

    if(req.body.pass && req.body.pass.length < 4){
        console.log("short pass");
        return;
    }

    if(req.body.mail && !req.body.mail.match(/.+@.+/)){
        console.log("wrong mail format");
        return;
    }

    next();
}

function trimAll(req, res, next){
    for(const property in req.body){
        if(typeof req.body == "string"){
            req.body[property] = req.body[property].trim();
        }
    }

    next();
    return;
}

module.exports = router;
