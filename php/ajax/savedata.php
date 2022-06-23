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

    $x = $_POST["x"];
    $y = $_POST["y"];
    $scale = $_POST["scale"];
    $count = $_POST["count"];

    $cmd = "SELECT x FROM map_deaths WHERE x = ".$_POST["x"]." AND y = ".$_POST["y"]." AND scale = ".$_POST["scale"]." AND nick = '".$_SESSION["user"]."'";
    if(is_string($select = Db::selectOne($cmd))){ Db::dbError($err, $cmd, __FILE__, __LINE__); }

    if($count == 0){
        $cmd = "DELETE FROM map_deaths WHERE x = ".$_POST["x"]." AND y = ".$_POST["y"]." AND scale = ".$_POST["scale"]." AND nick = '".$_SESSION["user"]."'";
    } else {
        if($select){
            $cmd = "UPDATE map_deaths SET count = ".$count.", updated = NOW() WHERE x = ".$_POST["x"]." AND y = ".$_POST["y"]." AND scale = ".$_POST["scale"]." AND nick = '".$_SESSION["user"]."'";
        } else {
            $cmd = "INSERT INTO map_deaths (x, y, scale, count, nick, updated, created) VALUES(".$x.", ".$y.", ".$scale.", 1, '".$_SESSION["user"]."', NOW(), NOW())";
        }
    }

    if($err = Db::query($cmd)){ Db::dbError($err, $cmd, __FILE__, __LINE__); }
        
    echo "success";

    exit();