const sgMail = require('@sendgrid/mail');

/**
 * Sends an email to the given email address using Sendgrid.
 *
 * The options argument must contain the following properties:
 *
 * - customerEmail: The email address to send the email to. Defaults to the email
 *   field of the user object.
 * - subject: The subject of the email.
 * - templateId: The Sendgrid template ID to use.
 * - code: The verification code to include in the email. Defaults to the
 *   emailVerifyCode field of the user object.
 *
 * The user object must contain the following properties:
 *
 * - email: The email address of the user.
 * - emailVerifyCode: The verification code for the user.
 * - username: The username of the user.
 * - firstName: The first name of the user.
 * - lastName: The last name of the user.
 *
 * The purchased object is optional and can contain the following properties:
 *
 * - purchasedId: The id of the purchased item.
 * - createdAt: The creation date of the purchased item.
 */
const sendEmail = (
  { email, emailVerifyCode, username, firstName, lastName },
  options,
) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const { customerEmail, purchased } = options;
  const createdPurchasedAt = new Date(
    purchased ? purchased.createdAt : Date.now(),
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const productPurchasedId = purchased ? purchased.purchasedId : 'N/A';

  // Generate verification code
  const code = options.code ? options.code : emailVerifyCode;
  const msg = {
    to: customerEmail || email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    templateId: options.templateId,
    dynamicTemplateData: {
      username: username || 'N/A',
      firstName: firstName || 'N/A',
      lastName: lastName || 'N/A',
      code,
      verificationCode: emailVerifyCode,
      purchasedId: productPurchasedId,
      createdPurchasedAt: createdPurchasedAt,
    },
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent successfully');
    })
    .catch((error) => {
      console.error('Error sending email:', error);
    });
};

module.exports = sendEmail;
