<?php
/*
    Returns string:
        "not-found"
    OR JSON
    OR db error
*/       

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
