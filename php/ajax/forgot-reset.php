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
    
    Db::sanitizeArray($_POST);
    Main::validate($_POST);

    $mail = $_POST["mail"];
    $pass = $_POST["pass"];
    $code = $_POST["code"];
    
    $cmd = "SELECT pass_reset, nick FROM map_users WHERE mail = '".$mail."'";
    if(is_string($select = Db::selectOne($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }
    
    if(!$select)
        die("not-found");
    
    if(password_verify($code, $select["pass_reset"])){
        $passHashed = password_hash($pass, PASSWORD_DEFAULT);

        $cmd = "UPDATE map_users SET pass = '".$passHashed."', pass_reset = '' WHERE mail = '".$mail."'";
        if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

		Db::sanitizeArray($select["nick"]);
        $_SESSION["user"] = $select["nick"];
        $loginObj = Main::getLoginObject();

        echo json_encode($loginObj);
        
        exit();
    }
