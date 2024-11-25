const sgMail = require('@sendgrid/mail');

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
