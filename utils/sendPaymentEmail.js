const sgMail = require('@sendgrid/mail');

/**
 * Sends a payment email to a user.
 *
 * @param {Object} options - Options to customize the email.
 * @param {string} options.email - The email address to send the email to.
 * @param {string} options.content - The content of the email.
 * @param {string} options.subject - The subject line of the email.
 *
 * @returns {Promise<void>}
 */
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
