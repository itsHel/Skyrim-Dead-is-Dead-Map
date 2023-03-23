<?php

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;

    require __DIR__."/lib/vendor/autoload.php";

    require __DIR__."/../config/SMTPconfig.php";

    Class Mail
    {
        const HEADING = "Skyrim - Dead Map";

        static function sendMail($type, $vars, $mail){
            switch($type){
                case "forgot-pass":
                    $subject = "Forgotten password - ".self::HEADING;
        
                    $text = "Your code is";
                    $message = self::getMailHtml($subject, $text, $vars["code"]);
                    break;
            }

            try {
                $email = new PHPMailer(true);                                    // True param means it will throw exceptions on errors

                $email->isSMTP();                                                // Send using SMTP
                // $mail->SMTPDebug = SMTP::DEBUG_SERVER;                        // Enable verbose debug output
                $email->SMTPAuth   = true;                                       // Enable SMTP authentication
                $email->Host       = SMTP_HOST;                                  // Set the SMTP server to send through
                $email->Username   = SMTP_USERNAME;                              // SMTP username
                $email->Password   = SMTP_PASS;                                  // SMTP password
                $email->Port       = SMTP_PORT;                                  // TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`
                $email->SMTPSecure = "tsl";                                      // Enable implicit TLS encryption
                
                $email->setFrom(SMTP_FROM, self::HEADING);

                // Add recipient
                try {
                    $email->addAddress($mail);              
                } catch(Exception $e){}

                //Content
                $email->isHTML(true);
                $email->CharSet = "UTF-8";
                $email->Subject = $subject;
                $email->Body    = $message;

                $email->send();

                return false;
            } catch (Exception $e) {
                return "error";
            }
        }

        static function getMailHtml($title, $text, $code){
            return '
                <!DOCTYPE html>
                    <html>
                        <head>
                            <!--[if !mso]><!-- -->
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <!--<![endif]-->
                            <title>'.$title.'</title>
                            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                        </head>
                        <body style="margin:0;padding:0;">
                            <table align="center" style="width:100%;margin:2rem auto; box-shadow: 0px 6px 16px 0px rgb(0 0 0 / 20%); border-radius:10px;border:1px solid #b8b8b8">
                                <tr>
                                    <td>
                                        <table align="center" style="border: 40px solid #ffffff;">
                                            <tbody style="font-family:\'Open sans\'">
                                                <tr><th align="center"><div style="text-align: center; font-family:\'Open sans\';font-weight:700;font-size:32px;margin:1rem 0 0rem 0;">'.self::HEADING.'</div></th></tr>
                                                <tr><th>&nbsp;</th></tr>
                                                <tr><th style="border-top:40px solid #ffffff;" align="center"><h3 style="text-align: center; color:#747474; font-family:\'Open sans\' font-size:16px; border-top:1px solid #ffffff;" color="#747474">'.$text.'</h3></th></tr>
                                                <tr><th align="center" style="text-align: center;"><h2 align="center" style="text-align: center;margin:0; border-top:40px solid #ffffff; border-bottom:20px solid #ffffff; color:rgb(29, 183, 238);" color="rgb(29, 183, 238);">'.$code.'</h2></th></tr>
                                                <!--<tr><th align="center" style="text-align: center;"><h4 align="center" style="text-align: center;">footer</h4></th></tr>-->
                                                <tr style="line-height: 1px;"><th>&nbsp;</th></tr>
                                            </tbody>
                                        </table>
                                        <br>
                                    </td>
                                </tr>
                            </table>
                        </body>
                    </html>';
        }
    }