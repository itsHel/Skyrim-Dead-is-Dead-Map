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

    $quantity = 50;

    Db::sanitizeArray($_POST);
    
    $from = $_POST["from"];
    $order = $_POST["order"];
    $direction = $_POST["direction"];

    $currentUserCondition = ($_SESSION["user"] ?? "") ? "d.nick = '".$_SESSION["user"]."' OR" : "";

    $fullOrder = "ORDER BY ".(($order == "nick") ? "nick ".$direction : "count ".$direction.", nick ASC");

    $cmd = "SELECT d.nick, SUM(count) as count FROM map_deaths d JOIN map_users u ON d.nick = u.nick
            WHERE (".$currentUserCondition." u.public = 1) AND count != 0 GROUP BY nick ".$fullOrder." LIMIT ".$from.", ".$quantity."";
    if(is_string($select = Db::select($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

    echo json_encode($select);
    
    exit();
