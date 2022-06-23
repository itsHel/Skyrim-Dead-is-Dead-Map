<?php
/*
    Returns string:
        "success"
    OR db error
*/  

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
