<?php
/*
    Returns string:
        "forgot-not-found"
        "forgot-countdown"
        "forgot-sent"
    OR db error
*/

    header('Access-Control-Allow-Origin: https://itshel.github.io');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, x-xsrf-token, x_csrftoken, Cache-Control, X-Requested-With');

    require "../mail.php";
    require "../main.php";
    require "../database.php";

    Db::sanitizeArray($_POST);
    Main::validate($_POST);

    $mail = $_POST["mail"];

    $cmd = "SELECT pass_reset_updated FROM map_users WHERE mail = '".$mail."'";
    if(is_string($select = Db::selectOne($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

    if(!$select)
        die("forgot-not-found");

    if($select["pass_reset_updated"]){
        $updated = new DateTime($select["pass_reset_updated"]);
        $now = new DateTime();
        $now->modify("-1 hour");

        if($updated > $now)
            die("forgot-countdown");
    }

    $code = bin2hex(random_bytes(4));
    $hash = password_hash($code, PASSWORD_DEFAULT);

    $cmd = "UPDATE map_users SET pass_reset = '".$hash."', pass_reset_updated = NOW() WHERE mail = '".$mail."'";
    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    Mail::sendMail("forgot-pass", array("code" => $code), $mail);

    echo "forgot-sent";
    
    exit();
