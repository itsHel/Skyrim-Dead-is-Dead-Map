const express = require("express");
const router = express.Router();

const user = require("../controller/user");

router.use(trimAll);
router.use(validateFields);

router.post("/login", (req, res) => {
    user.tryLogin(req, res);
});

router.post("/logout", (req, res) => {
    if(req.session?.authorized){
        user.logout(req, res);
        console.log("logout TEST");
    }
});

router.post("/register", (req, res) => {
    console.log("register TEST");
    
    user.register(req, res);
});

router.post("/delete", (req, res) => {
    if(req.session?.authorized){
        user.del(req, res);
        console.log("delete TEST");
    }
});

router.post("/forgot-pass-mail", (req, res) => {
    user.forgotPassMail(req, res);
});

router.post("/reset-pass", (req, res) => {
    user.resetPass(req, res);
});

function validateFields(req, res, next){
    if(!req.body || req.body.captcha)
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
}

module.exports = router;
