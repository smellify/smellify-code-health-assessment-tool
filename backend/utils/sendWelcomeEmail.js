// utils/sendWelcomeEmail.js
const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (email, name = '') => {
  try {
    // Create transporter (adjust based on your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Determine greeting based on whether name is provided
    const greeting = name ? `Hi ${name}` : 'Hi there';

    const mailOptions = {
      from: `"Smellify" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Smellify! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin: 0;">Welcome to Smellify!</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
              ${greeting},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
              🎉 Congratulations! Your email has been successfully verified and your Smellify account is now active.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
              You're now ready to explore all the amazing features Smellify has to offer:
            </p>
            
            <ul style="font-size: 16px; line-height: 1.6; margin: 0 0 15px 20px;">
              <li>Analyze your MERN stack code</li>
            </ul>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 0;">
              We're thrilled to have you as part of the Smellify community! 
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Get Started
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
            <p>Happy exploring!</p>
            <p>The Smellify Team</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return result;

  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

module.exports = sendWelcomeEmail;