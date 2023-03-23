require("dotenv").config();

const nodemailer = require("nodemailer");
const { myLog } = require("../uti");

const heading = "Skyrim - Dead Map";
const from = "Skyrim Map";

function sendMail(type, code, mail){
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,      // true for 465, false for other ports?
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASS
        }
    });

    let subject, html;

    switch(type){
        case "forgot-pass":
            subject = "Forgotten password - " + heading;
            html = getResetpassHtml(subject, code);
            break;
    }

    const mailOptions = {
        from: from,
        to: mail,
        subject: subject,
        html: html,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if(err){
                console.log(err);
                myLog(err);
                reject(err);
            }

            resolve(info);
        });
    });
}

function getResetpassHtml(title, code){
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <!--[if !mso]><!-- -->
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <!--<![endif]-->
                <title>${title}</title>
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
                                    <tr><th style="border-top:40px solid #ffffff;" align="center"><h3 style="text-align: center; color:#747474; font-family:\'Open sans\' font-size:16px; border-top:1px solid #ffffff;" color="#747474">Your code is</h3></th></tr>
                                    <tr><th align="center" style="text-align: center;"><h2 align="center" style="text-align: center;margin:0; border-top:40px solid #ffffff; border-bottom:20px solid #ffffff; color:rgb(29, 183, 238);" color="rgb(29, 183, 238);">${code}</h2></th></tr>
                                    <!--<tr><th align="center" style="text-align: center;"><h4 align="center" style="text-align: center;">footer</h4></th></tr>-->
                                    <tr style="line-height: 1px;"><th>&nbsp;</th></tr>
                                </tbody>
                            </table>
                            <br>
                        </td>
                    </tr>
                </table>
            </body>
        </html>`;
}

module.exports = {
    sendMail
}