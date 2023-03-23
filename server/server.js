require("dotenv").config();

const express = require("express");
const app = express();
const session = require("express-session");
const cors = require("cors");
const MySQLStore = require('express-mysql-session')(session);
const { database } = require("./database")
const sessionStore = new MySQLStore({}, database);

const accountRouter = require("./routes/accountAction");
const userRouter = require("./routes/action");
const dataRouter = require("./routes/getdata");

const secret = process.env.SESSION_SECRET;

// app.use(bodyParser.urlencoded({extended: false}));
// app.use(bodyParser.json());
app.use(session({
    store: sessionStore,
    secret: secret,
    saveUninitialized : true,
    resave: false, 
    cookie: {
        // secure: true,
        // httpOnly: true,
        // sameSite: "strict",
        // maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(
    cors({
        origin: "http://127.0.0.1",
        credentials: true,
    })
);

app.use(express.json());

app.use("/user-control", accountRouter);
app.use("/user-action", userRouter);
app.use("/getdata", dataRouter);

app.listen(3000, function(err){
    if(err) console.log(err);
    console.log("Server listening on Port", 3000);
});
