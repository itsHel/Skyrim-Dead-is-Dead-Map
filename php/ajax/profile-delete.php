<?php
/*
    Returns string:
        "logged-out"
    OR db error
*/  

    session_start();

    require "../database.php";
    	
    $nick = $_SESSION["user"] ?? "";

    $cmd = "DELETE FROM map_users WHERE nick = '".$nick."'";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    $cmd = "DELETE FROM map_deaths WHERE nick = '".$nick."'";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    $_SESSION = [];
    session_destroy();

    echo "logged-out";
    
    exit();