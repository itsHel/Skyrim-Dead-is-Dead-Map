const express = require("express");
const router = express.Router();

const data = require("../controller/data");

router.post("/logged-user", (req, res) => {
    if(req.session?.authorized){
        data.getLoggedUserData(req, res);
    } else {
        return res.json({error: "unauthorized"});
    }
});

router.post("/public-user", (req, res) => {
    // if(req.session?.authorized){
        data.getPublicUserData(req, res);
    // } else {
        // res.json({error: "unauthorized"});
    // }
});

router.post("/users-all", (req, res) => {
    // if(req.session?.authorized){
        data.getAllUsers(req, res);
    // } else {
        // res.json({error: "unauthorized"});
    // }
});

router.post("/refresh-users", (req, res) => {
    // if(req.session?.authorized){
        data.refreshUsers(req, res);
    // } else {
        // res.json({error: "unauthorized"});
    // }
});

module.exports = router;



