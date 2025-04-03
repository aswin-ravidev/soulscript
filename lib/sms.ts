import twilio from 'twilio';

// Using Twilio for SMS service as an example
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = twilio(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
);

export async function sendSMS({
  to,
  message
}: {
  to: string;
  message: string;
}) {
  try {
    // Send the SMS
    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to
    });

    console.log('SMS sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}