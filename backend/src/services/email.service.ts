import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
  }
}
