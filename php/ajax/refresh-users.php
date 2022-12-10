<?php
/*
    Returns JSON
    OR db error
*/  

    header('Access-Control-Allow-Origin: https://itshel.github.io');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, x-xsrf-token, x_csrftoken, Cache-Control, X-Requested-With');

    require "../database.php";

    // Get updated deaths
    $cmd = "SELECT d.id, d.nick, x, y, scale, count FROM map_deaths d JOIN map_users u ON d.nick = u.nick WHERE u.public = 1 AND updated >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)";
    if(is_string($select = Db::select($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

    if(empty($select))
        die;
    
    $users = [];
    $usersCondition = "";

    foreach($select as $death){
        if(!in_array($death["nick"], $users)){
            $users[] = $death["nick"];

            $usersCondition .= "d.nick = '".$death["nick"]."' OR ";
        }
    }

    $usersCondition = substr($usersCondition, 0, -3);

    // Get updated total deaths
    $cmd = "SELECT d.nick, SUM(count) as count FROM map_deaths d JOIN map_users u ON d.nick = u.nick WHERE (".$usersCondition.") AND u.public = 1 GROUP BY nick ORDER BY count";
    if(is_string($select2 = Db::select($cmd))){ Db::dbError($select2, $cmd, __FILE__, __LINE__); }

    $data = [
        "deaths" => $select,
        "total" => $select2
    ];

    echo json_encode($data);
    
    exit();
