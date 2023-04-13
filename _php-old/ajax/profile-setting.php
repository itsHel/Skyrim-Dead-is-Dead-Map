<?php
/*
    Returns string:
        "success"
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

    Db::sanitizeArray($_POST);

    $setting = $_POST["setting"];
    $newValue = $_POST["value"];

    $cmd = "UPDATE map_users SET ".$setting." = ".$newValue." WHERE nick = '".$_SESSION["user"]."'";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }
    
    exit();
