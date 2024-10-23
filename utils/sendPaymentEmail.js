const sgMail = require('@sendgrid/mail');

const sendPaymentEmail = ({ email, content, subject }) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: subject,
    html: content,
  };

  sgMail.send(msg).then(() => {
    console.log('Email sent successfully');
  }).catch((error) => {
    console.error('Error sending email:', error);
  });
};

module.exports = sendPaymentEmail;
