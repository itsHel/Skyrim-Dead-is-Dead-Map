<?php

    Class Main
    {
        static function getLoginObject(){
            $cmd = "SELECT public, nick FROM map_users WHERE nick = '".$_SESSION["user"]."'";
            if(is_string($select = Db::selectOne($cmd))){ Db::dbError($select, $cmd, __FILE__, __LINE__); }

            $loginObj = [
                "nick" => $select["nick"],
                "public" => $select["public"]
            ];

            return $loginObj;
        }

        static function validate($POST){
            if(isset($POST["captcha"])){
                die();
            }
        }
    }

