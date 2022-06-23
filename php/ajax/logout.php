<?php
/*
    Returns string:
        "logged-out"
*/     

    session_start();
    $_SESSION = [];
    session_destroy();

    echo "logged-out";
    
    exit();
    