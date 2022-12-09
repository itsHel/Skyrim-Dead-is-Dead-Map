<?php

    require __DIR__."/../config/DBconfig.php";

    Class Db
    {
        // Returns false on success, string on error
        static function query($cmd){
            $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS, DB_NAME);

            if(!$conn->query($cmd)){
                $return = $conn->error;
            } else {
                $return = false;
            }

            $conn->close();

            return $return;
        }

        // Returns array of arrays on success, string on error
        static function select($cmd){
            $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS, DB_NAME);

            if(!$result = $conn->query($cmd))
                return("Query failed: ".$conn->error);

            $select = [];
            if($result->num_rows > 0){
                while($row = $result->fetch_assoc()){
                    $select[] = $row;
                }
            }

            $conn->close();

            return $select;
        }

        // Returns array on success, string on error
        static function selectOne($cmd){
            $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS, DB_NAME);

            if(!$result = $conn->query($cmd))
                return("Query failed: ".$conn->error);

            if($result->num_rows > 0){
                while($row = $result->fetch_assoc()){
                    $select = $row;
                }
            } else {
                $select = [];
            }

            $conn->close();

            return $select;
        }

        static function sanitizeArray(&$data, $conn = false){
            if(!$conn){
                $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS, DB_NAME);
            }

            if(is_array($data)){
                foreach($data as $key => $val){
                    if(is_array($data[$key])){
                        self::sanitizeArray($data[$key], $conn);
                    } else {
                        $data[$key] = mysqli_escape_string($conn, $val);
                    }
                }
            } else {
                $data = mysqli_escape_string($conn, $data);
            }
        }

        static function dbError($err, $cmd, $function, $line){
            http_response_code(500);
            self::errorLog("db_log.txt", $err, $cmd, $function, $line);
        
            die("Database Error");
            die($err);
        }

        static function errorLog($filename, $message, $cmd = "", $function = "", $line = ""){
            $file = fopen(__DIR__."/../error_log/".$filename, "a+");
            if(!is_string($message))
                $message = var_export($message, true);
            $message .= "\n".$cmd;
            
            if($function && $line)
                $head = $function." ; Line: ".$line."\n";
            else if($function)
                $head = $function."\n";
            else if($line)
                $head = "Line: ".$line."\n";
            else
                $head = "";
    
            fwrite($file, "[".date('Y-m-d H:i:s')."]\n".$head.$message."\n\n");
            fclose($file);
        }

        // *************************************************************** Install ***************************************************************
        static function createDb(){
            $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS);

            if($conn->connect_error){
                die("Connection failed: ".$conn->connect_error);
            }

            $cmd = "CREATE DATABASE ".DB_NAME;
            if(!$conn->query($cmd))
                die("Query failed: ".$conn->error);

            $conn->close();
        }

        static function createTables($reset = false){
            if($reset)
                self::resetDb();
            
            $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS, DB_NAME);

            $cmds = [];

            $cmds[] =
                "CREATE TABLE IF NOT EXISTS map_users(
                    id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    mail VARCHAR(255) UNIQUE,
                    nick VARCHAR(255) UNIQUE,
                    pass VARCHAR(255),
                    public TINYINT(1),
                    pass_reset VARCHAR(255),
                    pass_reset_updated DATETIME
                )";
            $cmds[] =
                "CREATE TABLE IF NOT EXISTS map_deaths(
                    id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    nick VARCHAR(255),
                    x INT(8),
                    y INT(8),
                    scale FLOAT(6,2),
                    count INT(8),
                    updated DATETIME,
                    created DATETIME
                )";

            // Dummy data
            $cmds[] = "INSERT INTO `map_users` VALUES (w,w);";
            $cmds[] = "INSERT INTO `map_users` VALUES (admin,admin);";
            $cmds[] = "INSERT INTO `map_data` VALUES (500,500,1);";
            $cmds[] = "INSERT INTO `map_data` VALUES (500,500,1);";
            $cmds[] = "INSERT INTO `map_data` VALUES (500,500,1);";
            $cmds[] = "INSERT INTO `map_data` VALUES (600,600,1);";

            foreach($cmds as $cmd){
                if(!$conn->query($cmd)){
                    die("Query failed: ".$conn->error);
                }
            }
        }

        function resetDb(){
            $conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASS);

            if($conn->connect_error){
                die("Connection failed: ".$conn->connect_error);
            }

            $cmd = "DROP DATABASE ".DB_NAME;
            $conn->query($cmd);
            $cmd = "CREATE DATABASE ".DB_NAME;
            $conn->query($cmd);
        }
    }
