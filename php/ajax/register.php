<?php
/*
    Returns string:
        "empty"
        "nick-exists"
        "mail-exists"
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
    
    Db::sanitizeArray($_POST);
    Main::validate($_POST);
	
    $nick = trim($_POST["nick"]);
    $mail = trim($_POST["mail"]);
    $pass = $_POST["pass"];
    $public = $_POST["public"];

    // username validation
    if(!preg_match("/.+@.+/", $mail))
        die;

    // password validation
    if(strlen($pass) < 4)
        die;

    if(!$nick || !$mail || !$pass)
        die("empty");

    $cmd = "SELECT mail, nick FROM map_users WHERE mail = '".$mail."' OR nick = '".$nick."'";
    if(is_string($select = Db::selectOne($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

	Db::sanitizeArray($select);
    if($select){
        if($select["nick"] == $nick)
            die("nick-exists");
        if($select["mail"] == $mail)
            die("mail-exists");
    }
        
    $passHashed = password_hash($pass, PASSWORD_DEFAULT);
    
    $cmd = "INSERT INTO map_users (mail, nick, pass, public) VALUES('".$mail."','".$nick."','".$passHashed."','".$public."')";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    $_SESSION["user"] = $nick;
    $loginObj = Main::getLoginObject();

    echo json_encode($loginObj);

    exit();
    
