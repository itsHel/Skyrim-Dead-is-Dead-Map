<?php
/*
    Returns string:
        "logged-out"
    OR db error
*/  

    header('Access-Control-Allow-Origin: https://itshel.github.io');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, x-xsrf-token, x_csrftoken, Cache-Control, X-Requested-With');

    session_start();

    if(!($_SESSION["user"] ?? ""))
        die;

    require "../database.php";
    	
    $nick = $_SESSION["user"];

    $cmd = "DELETE FROM map_users WHERE nick = '".$nick."'";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    $cmd = "DELETE FROM map_deaths WHERE nick = '".$nick."'";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    $_SESSION = [];
    session_destroy();

    echo "logged-out";
    
    exit();
