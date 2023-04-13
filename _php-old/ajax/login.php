<?php
/*
    Returns string:
        "not-found"
    OR JSON
    OR db error
*/       

    header('Access-Control-Allow-Origin: https://itshel.github.io');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, x-xsrf-token, x_csrftoken, Cache-Control, X-Requested-With');

    session_start();

    require "../main.php";
    require "../database.php";

    // On load check if user session still exists
    if($_POST["init"] ?? ""){
        if($_SESSION["user"] ?? ""){
            $loginObj = Main::getLoginObject();

            echo json_encode($loginObj);
            die;
        } else {
            die;
        }
    }    

    Db::sanitizeArray($_POST);
    Main::validate($_POST);
    
    $mailOrNick = trim($_POST["nick"]);
    $pass = $_POST["pass"];

    $cmd = "SELECT nick, pass FROM map_users WHERE mail = '".$mailOrNick."' OR nick = '".$mailOrNick."'";
    if(is_string($select = Db::selectOne($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

    if(!$select)
        die("not-found");

    if(password_verify($pass, $select["pass"])){
        Db::sanitizeArray($select["nick"]);
        $_SESSION["user"] = $select["nick"];
        $loginObj = Main::getLoginObject();

        echo json_encode($loginObj);
    } else {
        echo "not-found";
    }

    exit();
