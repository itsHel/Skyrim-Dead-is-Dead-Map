<?php
/*
    Returns string:
        "logged-out"
*/     

    header('Access-Control-Allow-Origin: https://itshel.github.io');
    header('Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS, PATCH, DELETE');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, x-xsrf-token, x_csrftoken, Cache-Control, X-Requested-With');

    session_start();
    $_SESSION = [];
    session_destroy();

    echo "logged-out";
    
    exit();
    
