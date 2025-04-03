import nodemailer from 'nodemailer';

// Create a transporter with better deliverability settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    // Validate required environment variables
    if (!process.env.GMAIL_USER) {
      throw new Error('GMAIL_USER environment variable is not set');
    }
    if (!process.env.GMAIL_APP_PASSWORD) {
      throw new Error('GMAIL_APP_PASSWORD environment variable is not set');
    }

    // Create the email message with better formatting
    const msg = {
      from: `SoulScript Support <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      replyTo: process.env.GMAIL_USER,
      headers: {
        'X-Mailer': 'SoulScript Alert System',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'Precedence': 'bulk',
        'List-Unsubscribe': '<mailto:support@soulscript.com>'
      }
    };

    // Send the email
    const info = await transporter.sendMail(msg);
    
    console.log('Email sent successfully:', info);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}