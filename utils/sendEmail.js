const sgMail = require('@sendgrid/mail');

const sendEmail = ({ email, emailVerifyCode, username }, options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const { customerEmail, purchased } = options;
  const createdPurchasedAt = new Date(purchased.createdAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  );
  // Generate verification code
  const code = options.code ? options.code : emailVerifyCode;
  const msg = {
    to: customerEmail || email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    templateId: options.templateId,
    dynamicTemplateData: {
      username: username || "N/A",
      code,
      verificationCode: emailVerifyCode,
      purchasedId: purchased.purchasedId,
      createdPurchasedAt: createdPurchasedAt || 'N/A',
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
