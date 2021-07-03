const fs = require('fs');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');



var env = dotenv.config();
dotenvExpand(env);



var nodemailer = require('nodemailer');
var mailer = nodemailer.createTransport({
    host: process.env.MAIL_SERVICE,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER_ADDRESS,
      pass: process.env.MAIL_PWD
    },
  });

function sendMail(mailType, bookTitle, bookSubtitle, userName, userEmail, date) {

      let body = '';
      let subject = '';

      switch(mailType) {
        case 'borrow': {
          body = 'borrowMail.html';
          subject = 'Empréstimo de livro';
          break;
        }
        case 'renew': {
          body = 'renewMail.html';
          subject = 'Renovação de empréstimo de livro';
          break;
        }
        case 'return': {
          body = 'returnMail.html';
          subject = 'Devolução de livro';
          break;
        }
        case 'returnQueue': {
          body = 'returnQueueMail.html';
          subject = 'O livro que estavas a aguardar foi devolvido';
          break;
        }
        case 'due': {
          body = 'dueMail.html';
          subject = 'A data de devolução do teu livro vence amanhã';
          break;
        }
      }

  		fs.readFile('../resources/mail/' + body, 'utf8', function (err, body) {
  		  if (err) {
  		    return console.log(err);
  		  }

        body = body.replace(/USERNAME/gi, userName);
  			body = body.replace(/BOOKTITLE/gi, bookTitle);

        if (bookSubtitle) {
          body = body.replace(/BOOKSUBTITLE/gi, ' - ' + bookSubtitle)
        }
        else {
          body = body.replace(/BOOKSUBTITLE/gi, '');
        }
        if (date) {
          const dateParts = date.split('-');
          body = body.replace(/DATE/gi, dateParts[2]+'/' + dateParts[1]+'/' + dateParts[0]);
        }

  			var mailOptions = {
          from: {
            name: process.env.MAIL_USER_NAME,
            address: process.env.MAIL_USER_ADDRESS
          },
  				to: userEmail,
          bcc: process.env.MAIL_USER_ADDRESS,
  				subject: subject,
  				html: body
  			};

  			mailer.sendMail(mailOptions, function(error, info){

  				if (error) {
  					console.log(error);
  				} else {
  					console.log('Email sent:' + info.response, 'to', userEmail, 'type', mailType);
  				}
  			});
  		});
}



module.exports =  { sendMail }
