// import twilio from 'twilio';
// import config from '../../config';

// // Validate configuration
// if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
//   throw new Error('Twilio credentials are not configured properly');
// }

// const client = twilio(config.twilio.accountSid, config.twilio.authToken);

// export const sendSMS = async (phone: string, message: string): Promise<void> => {
//   try {
//     await client.messages.create({
//       body: message,
//       from: config.twilio.phoneNumber,
//       to: phone,
//     });
//     console.log(`SMS sent successfully to ${phone}`);
//   } catch (error) {
//     console.error('Error sending SMS via Twilio:', error);
//     // Re-throw so the caller can handle (e.g., log and maybe retry)
//     throw error;
//   }
// };