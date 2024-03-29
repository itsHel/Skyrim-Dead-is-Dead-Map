<?php
/*
    Returns JSON
    OR db error
*/     

    header('Access-Control-Allow-Origin: https://itshel.github.io');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, x-xsrf-token, x_csrftoken, Cache-Control, X-Requested-With');

    session_start();

    require "../database.php";

    Db::sanitizeArray($_POST);

    if($_POST["nick"] ?? ""){
        // Get data of requested user
        $cmd = "SELECT d.id, d.x, d.y, d.scale, d.count, d.nick FROM map_deaths d JOIN map_users u ON d.nick = u.nick WHERE u.public = 1 AND count != 0 AND d.nick = '".$_POST["nick"]."'";
    } else {
        // Get data of logged user
        $cmd = "SELECT x, y, scale, count FROM map_deaths WHERE nick = '".$_SESSION["user"]."'";
    }

    if(is_string($select = Db::select($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

    echo json_encode($select);
    
    exit();
