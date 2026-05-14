import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
// console.log(process.env.PORT);
export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  mail: process.env.MAIL,
  mail_password: process.env.MAIL_PASS,
  base_url_server: process.env.BASE_URL_SERVER,
  base_url_client: process.env.BASE_URL_CLIENT,
  emailSender: {
    app_pass: process.env.APP_PASS,
    brevo_api_key: process.env.BREVO_API_KEY,
    email_sender_name: process.env.EMAIL_SENDER_NAME,
    email: process.env.EMAIL,
  },
  nodemailer: {
    email: process.env.NODE_MAILER_EMAIL,
    pass: process.env.NODE_MAILER_PASSWORD,
  },
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  do_space: {
    endpoints: process.env.DO_SPACE_ENDPOINT,
    access_key: process.env.DO_SPACE_ACCESS_KEY,
    secret_key: process.env.DO_SPACE_SECRET_KEY,
    bucket: process.env.DO_SPACE_BUCKET,
  },
  stripe: {
    published_key: process.env.STRIPE_PUBLISHED_KEY,

        secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    // These will be set dynamically
    essentialPriceId: process.env.STRIPE_ESSENTIAL_PRICE_ID || '',
    unlimitedPriceId: process.env.STRIPE_UNLIMITED_PRICE_ID || '',
    successUrl: process.env.FRONTEND_SUCCESS_URL!,
    cancelUrl: process.env.FRONTEND_CANCEL_URL!,

  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
};
