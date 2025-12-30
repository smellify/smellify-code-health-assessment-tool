const nodemailer = require('nodemailer');

// Create a single transporter instance for Gmail
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password (not regular password)
  }
});

// Basic email verification function
async function sendEmail(email, code) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smellify Verification Code</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .header-subtitle {
          color: #d1d5db;
          font-size: 16px;
          margin: 0;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .icon-container {
          width: 80px;
          height: 80px;
          background: #dbeafe;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        
        .email-icon {
          width: 40px;
          height: 40px;
          fill: #2563eb;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        
        .code-container {
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin: 32px 0;
          display: inline-block;
          min-width: 200px;
        }
        
        .code-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .verification-code {
          font-size: 36px;
          font-weight: bold;
          color: #1f2937;
          font-family: 'Monaco', 'Menlo', monospace;
          letter-spacing: 8px;
          margin: 0;
          text-align: center;
        }
        
        .expiry-notice {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 16px;
          margin: 32px 0;
        }
        
        .expiry-notice p {
          margin: 0;
          font-size: 14px;
          color: #92400e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .warning-icon {
          width: 16px;
          height: 16px;
          fill: #d97706;
          margin-right: 8px;
        }
        
        .instructions {
          font-size: 16px;
          color: #4b5563;
          margin: 24px 0;
          line-height: 1.6;
        }
        
        .footer {
          background: #f9fafb;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px;
        }
        
        .footer-links {
          font-size: 14px;
        }
        
        .footer-links a {
          color: #6b7280;
          text-decoration: none;
          margin: 0 12px;
        }
        
        .footer-links a:hover {
          color: #374151;
        }
        
        .security-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
          text-align: left;
        }
        
        .security-notice p {
          margin: 0;
          font-size: 14px;
          color: #7f1d1d;
        }
        
        .security-icon {
          width: 16px;
          height: 16px;
          fill: #dc2626;
          float: left;
          margin-right: 8px;
          margin-top: 2px;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 20px 16px;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .header {
            padding: 24px;
          }
          
          .verification-code {
            font-size: 28px;
            letter-spacing: 4px;
          }
          
          .footer {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <!-- Header -->
          <div class="header">
            <div class="logo">Smellify</div>
            <p class="header-subtitle">Verify your email address</p>
          </div>
          
          <!-- Main Content -->
          <div class="content">
            <div class="icon-container">
              <svg class="email-icon" viewBox="0 0 24 24">
                <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <h1 class="title">Almost there!</h1>
            <p class="description">
              We've sent this verification code to complete your Smellify account setup. 
              Enter this code in the verification form to continue.
            </p>
            
            <div class="code-container">
              <div class="code-label">Your verification code</div>
              <div class="verification-code">${code}</div>
            </div>
            
            <div class="expiry-notice">
              <p>
                <svg class="warning-icon" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                This code will expire in 10 minutes
              </p>
            </div>
            
            <p class="instructions">
              If you didn't create a Smellify account, you can safely ignore this email.
            </p>
            
            <div class="security-notice">
              <svg class="security-icon" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p>
                <strong>Security tip:</strong> Never share this verification code with anyone. 
                Smellify will never ask for this code via phone, email, or text message.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">
              Thanks for choosing Smellify! If you have any questions, we're here to help.
            </p>
            <div class="footer-links">
              <a href="#">Help Center</a> •
              <a href="#">Privacy Policy</a> •
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Smellify Verification Code',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

// Email change verification email
async function sendEmailChangeVerification(email, code) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smellify Email Change Verification</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .header-subtitle {
          color: #d1d5db;
          font-size: 16px;
          margin: 0;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        
        .code-container {
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin: 32px 0;
          display: inline-block;
          min-width: 200px;
        }
        
        .code-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .verification-code {
          font-size: 36px;
          font-weight: bold;
          color: #1f2937;
          font-family: 'Monaco', 'Menlo', monospace;
          letter-spacing: 8px;
          margin: 0;
          text-align: center;
        }
        
        .expiry-notice {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 16px;
          margin: 32px 0;
        }
        
        .expiry-notice p {
          margin: 0;
          font-size: 14px;
          color: #92400e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .security-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
          text-align: left;
        }
        
        .security-notice p {
          margin: 0;
          font-size: 14px;
          color: #7f1d1d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
            <p class="header-subtitle">Email Change Verification</p>
          </div>
          
          <div class="content">
            <h1 class="title">Verify Your New Email</h1>
            <p class="description">
              You've requested to change your email address. Please enter this verification code to confirm the change.
            </p>
            
            <div class="code-container">
              <div class="code-label">Email Change Verification Code</div>
              <div class="verification-code">${code}</div>
            </div>
            
            <div class="expiry-notice">
              <p>This code will expire in 10 minutes</p>
            </div>
            
            <div class="security-notice">
              <p>
                <strong>Security Notice:</strong> If you did not request this email change, please ignore this email and contact our support team immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your New Email Address - Smellify',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email change verification sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending email change verification:', error);
    throw error;
  }
}

// Email change confirmation to old email
async function sendEmailChangeConfirmation(oldEmail, newEmail) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smellify Email Changed</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .email-change-info {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        
        .email-item {
          margin: 8px 0;
          font-size: 16px;
        }
        
        .old-email {
          color: #dc2626;
          text-decoration: line-through;
        }
        
        .new-email {
          color: #059669;
          font-weight: bold;
        }
        
        .security-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
          text-align: left;
        }
        
        .security-notice p {
          margin: 0;
          font-size: 14px;
          color: #7f1d1d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
          </div>
          
          <div class="content">
            <h1 class="title">Email Address Changed</h1>
            <p>Your Smellify account email address has been successfully changed.</p>
            
            <div class="email-change-info">
              <div class="email-item">
                <strong>Old Email:</strong> <span class="old-email">${oldEmail}</span>
              </div>
              <div class="email-item">
                <strong>New Email:</strong> <span class="new-email">${newEmail}</span>
              </div>
            </div>
            
            <p>All future communications will be sent to your new email address.</p>
            
            <div class="security-notice">
              <p>
                <strong>Security Alert:</strong> If you did not make this change, please contact our support team immediately as your account may be compromised.
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: oldEmail,
    subject: 'Email Address Changed - Smellify',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email change confirmation sent successfully to: ${oldEmail}`);
  } catch (error) {
    console.error('Error sending email change confirmation:', error);
    throw error;
  }
}

// Account deletion confirmation email
async function sendAccountDeletionConfirmation(email, name) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deleted - Smellify</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
          </div>
          
          <div class="content">
            <h1 class="title">Account Deleted</h1>
            <p class="description">
              ${name ? `Hello ${name},` : 'Hello,'}<br><br>
              Your Smellify account has been successfully deleted. All your data has been permanently removed from our systems.
              <br><br>
              Thank you for using Smellify. We're sorry to see you go.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Account Deleted - Smellify',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Account deletion confirmation sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending account deletion confirmation:', error);
    throw error;
  }
}

// 2FA Enabled Email
async function send2FAEnabledEmail(email, userName) {
  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔒 Two-Factor Authentication Enabled - Smellify',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .security-tips { background: #e8f4fd; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #2196F3; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🔒</div>
            <h1 style="margin: 0; font-size: 28px;">2FA Successfully Enabled!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${userName || 'User'},</p>
            
            <p><strong>Great news!</strong> Two-Factor Authentication (2FA) has been successfully enabled for your account.</p>
            
            <div class="security-tips">
              <h3 style="color: #2196F3; margin-top: 0;">🛡️ Your Account Is Now More Secure</h3>
              <ul style="margin-bottom: 0;">
                <li>You'll need your authenticator app to sign in</li>
                <li>Your backup codes are your lifeline - keep them safe</li>
                <li>Your account is now protected against unauthorized access</li>
              </ul>
            </div>
            
            <h3>What happens next?</h3>
            <ul>
              <li><strong>Signing in:</strong> You'll be asked for a 6-digit code from your authenticator app</li>
              <li><strong>Lost phone?</strong> Use one of your backup codes to regain access</li>
              <li><strong>Need help?</strong> Contact our support team anytime</li>
            </ul>
            
            <p><strong>Important Security Tips:</strong></p>
            <ul>
              <li>🔐 Store your backup codes in a secure location</li>
              <li>📱 Don't lose access to your authenticator app</li>
              <li>🚨 If you suspect unauthorized access, contact us immediately</li>
            </ul>
            
            <p style="margin-top: 30px;">If you didn't enable 2FA, please contact our support team immediately.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">
                Enabled on: ${new Date().toLocaleString()}<br>
                Account: ${email}
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification from Smellify.</p>
            <p>© ${new Date().getFullYear()} Smellify. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('2FA enabled email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending 2FA enabled email:', error);
    throw error;
  }
}

// 2FA Disabled Email
async function send2FADisabledEmail(email, userName) {
  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔓 Two-Factor Authentication Disabled - Smellify',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-icon { font-size: 48px; margin-bottom: 20px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .security-warning { background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ffc107; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">🔓</div>
            <h1 style="margin: 0; font-size: 28px;">2FA Has Been Disabled</h1>
          </div>
          
          <div class="content">
            <p>Hello ${userName || 'User'},</p>
            
            <p>Two-Factor Authentication (2FA) has been <strong>disabled</strong> for your account.</p>
            
            <div class="security-warning">
              <h3 style="color: #856404; margin-top: 0;">⚠️ Security Notice</h3>
              <p style="margin-bottom: 0;">Your account is now less secure without 2FA protection. We highly recommend re-enabling 2FA to keep your account safe from unauthorized access.</p>
            </div>
            
            <h3>What this means:</h3>
            <ul>
              <li>You'll no longer need an authenticator app to sign in</li>
              <li>Your account is more vulnerable to unauthorized access</li>
              <li>All backup codes have been deleted</li>
            </ul>
            
            <h3>Want to stay secure?</h3>
            <p>Consider re-enabling 2FA to protect your account:</p>
            <ul>
              <li>🔐 Prevents unauthorized access even if your password is compromised</li>
              <li>📱 Easy to use with any authenticator app</li>
              <li>🛡️ Industry-standard security practice</li>
            </ul>
            
            <p style="margin-top: 30px;"><strong>⚠️ Important:</strong> If you didn't disable 2FA, please secure your account immediately and contact our support team.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">
                Disabled on: ${new Date().toLocaleString()}<br>
                Account: ${email}
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification from Smellify.</p>
            <p>© ${new Date().getFullYear()} Smellify. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('2FA disabled email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending 2FA disabled email:', error);
    throw error;
  }
}


// Password reset email
async function sendPasswordResetEmail(email, code, userName) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smellify Password Reset</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .header-subtitle {
          color: #fef3c7;
          font-size: 16px;
          margin: 0;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .icon-container {
          width: 80px;
          height: 80px;
          background: #fef3c7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        
        .lock-icon {
          width: 40px;
          height: 40px;
          fill: #d97706;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        
        .code-container {
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          margin: 32px 0;
          display: inline-block;
          min-width: 200px;
        }
        
        .code-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .reset-code {
          font-size: 36px;
          font-weight: bold;
          color: #1f2937;
          font-family: 'Monaco', 'Menlo', monospace;
          letter-spacing: 8px;
          margin: 0;
          text-align: center;
        }
        
        .expiry-notice {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 16px;
          margin: 32px 0;
        }
        
        .expiry-notice p {
          margin: 0;
          font-size: 14px;
          color: #92400e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .warning-icon {
          width: 16px;
          height: 16px;
          fill: #d97706;
          margin-right: 8px;
        }
        
        .security-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
          text-align: left;
        }
        
        .security-notice p {
          margin: 0;
          font-size: 14px;
          color: #7f1d1d;
        }
        
        .security-icon {
          width: 16px;
          height: 16px;
          fill: #dc2626;
          float: left;
          margin-right: 8px;
          margin-top: 2px;
        }
        
        .footer {
          background: #f9fafb;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 16px;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 20px 16px;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .header {
            padding: 24px;
          }
          
          .reset-code {
            font-size: 28px;
            letter-spacing: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <!-- Header -->
          <div class="header">
            <div class="logo">Smellify</div>
            <p class="header-subtitle">Password Reset Request</p>
          </div>
          
          <!-- Main Content -->
          <div class="content">
            <div class="icon-container">
              <svg class="lock-icon" viewBox="0 0 24 24">
                <path d="M12 1a3 3 0 0 0-3 3v8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2V4a3 3 0 0 0-3-3zM9 4a3 3 0 0 1 6 0v8H9V4z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
            
            <h1 class="title">Reset Your Password</h1>
            <p class="description">
              ${userName ? `Hello ${userName},` : 'Hello,'}<br><br>
              We received a request to reset your password. Use the code below to create a new password for your Smellify account.
            </p>
            
            <div class="code-container">
              <div class="code-label">Password Reset Code</div>
              <div class="reset-code">${code}</div>
            </div>
            
            <div class="expiry-notice">
              <p>
                <svg class="warning-icon" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                This code will expire in 10 minutes
              </p>
            </div>
            
            <div class="security-notice">
              <svg class="security-icon" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              <p>
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged. Never share this code with anyone.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              This reset code can only be used once and expires in 10 minutes for your security.
            </p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p class="footer-text">
              Need help? Contact our support team if you're having trouble resetting your password.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Password Reset Code - Smellify',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to: ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// // Password change confirmation email
// async function sendPasswordChangeConfirmationEmail(email, userName) {
//   const emailTemplate = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Password Changed - Smellify</title>
//       <style>
//         body {
//           margin: 0;
//           padding: 0;
//           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
//           background-color: #f9fafb;
//           line-height: 1.6;
//         }
        
//         .container {
//           max-width: 600px;
//           margin: 0 auto;
//           padding: 40px 20px;
//         }
        
//         .email-card {
//           background: white;
//           border-radius: 24px;
//           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
//           border: 1px solid #e5e7eb;
//           overflow: hidden;
//         }
        
//         .header {
//           background: linear-gradient(135deg, #10b981 0%, #059669 100%);
//           padding: 32px;
//           text-align: center;
//         }
        
//         .logo {
//           color: white;
//           font-size: 28px;
//           font-weight: bold;
//           margin-bottom: 8px;
//         }
        
//         .header-subtitle {
//           color: #d1fae5;
//           font-size: 16px;
//           margin: 0;
//         }
        
//         .content {
//           padding: 40px 32px;
//           text-align: center;
//         }
        
//         .icon-container {
//           width: 80px;
//           height: 80px;
//           background: #d1fae5;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           margin: 0 auto 24px;
//         }
        
//         .check-icon {
//           width: 40px;
//           height: 40px;
//           fill: #059669;
//         }
        
//         .title {
//           font-size: 24px;
//           font-weight: bold;
//           color: #111827;
//           margin: 0 0 12px;
//         }
        
//         .description {
//           font-size: 16px;
//           color: #6b7280;
//           margin: 0 0 32px;
//           line-height: 1.5;
//         }
        
//         .info-box {
//           background: #f0f9ff;
//           border: 1px solid #bae6fd;
//           border-radius: 12px;
//           padding: 20px;
//           margin: 24px 0;
//           text-align: left;
//         }
        
//         .info-box h3 {
//           color: #1e40af;
//           margin: 0 0 12px 0;
//           font-size: 16px;
//         }
        
//         .info-box p {
//           margin: 8px 0;
//           color: #1f2937;
//           font-size: 14px;
//         }
        
//         .security-notice {
//           background: #fef2f2;
//           border: 1px solid #fecaca;
//           border-radius: 12px;
//           padding: 16px;
//           margin: 24px 0;
//           text-align: left;
//         }
        
//         .security-notice p {
//           margin: 0;
//           font-size: 14px;
//           color: #7f1d1d;
//         }
        
//         .footer {
//           background: #f9fafb;
//           padding: 32px;
//           text-align: center;
//           border-top: 1px solid #e5e7eb;
//         }
        
//         .footer-text {
//           font-size: 14px;
//           color: #6b7280;
//           margin: 0;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="email-card">
//           <!-- Header -->
//           <div class="header">
//             <div class="logo">Smellify</div>
//             <p class="header-subtitle">Password Successfully Changed</p>
//           </div>
          
//           <!-- Main Content -->
//           <div class="content">
//             <div class="icon-container">
//               <svg class="check-icon" viewBox="0 0 24 24">
//                 <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
//               </svg>
//             </div>
            
//             <h1 class="title">Password Changed Successfully!</h1>
//             <p class="description">
//               ${userName ? `Hello ${userName},` : 'Hello,'}<br><br>
//               Your Smellify account password has been successfully changed. Your account is now secured with your new password.
//             </p>
            
//             <div class="info-box">
//               <h3>🔐 What happened?</h3>
//               <p><strong>Changed:</strong> ${new Date().toLocaleString()}</p>
//               <p><strong>Account:</strong> ${email}</p>
//               <p><strong>Security:</strong> All devices have been signed out for your protection</p>
//             </div>
            
//             <div class="security-notice">
//               <p>
//                 <strong>🚨 Security Alert:</strong> If you did not make this change, please contact our support team immediately. Your account may have been compromised.
//               </p>
//             </div>
            
//             <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
//               You'll need to sign in again on all your devices using your new password.
//             </p>
//           </div>
          
//           <!-- Footer -->
//           <div class="footer">
//             <p class="footer-text">
//               This is an automated security notification from Smellify. If you need assistance, please contact our support team.
//             </p>
//           </div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;

//   const mailOptions = {
//     from: `"Smellify" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: '✅ Password Changed Successfully - Smellify',
//     html: emailTemplate
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`Password change confirmation sent successfully to: ${email}`);
//   } catch (error) {
//     console.error('Error sending password change confirmation:', error);
//     throw error;
//   }
// }


const sendPasswordChangeConfirmationEmail = async (email, userName = 'User', isFromSettings = false) => {
  try {
    const currentTime = new Date().toLocaleString();
    
    // Different messaging based on how password was changed
    const changeMethod = isFromSettings ? 
      'from your account settings' : 
      'using the password reset process';
    
    const securityNote = isFromSettings ? 
      'All your other active sessions have been terminated for security' :
      'All your active sessions have been terminated for security';

    const mailOptions = {
      from: `"Smellify" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #28a745; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
            <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">Password Changed Successfully</h1>
            <p style="color: #666; font-size: 16px;">Hello ${userName}, your password has been updated</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Security Details:</h3>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
              <strong>Email:</strong> ${email}<br>
              <strong>Changed at:</strong> ${currentTime}<br>
              <strong>Method:</strong> Password changed ${changeMethod}<br>
              <strong>Security Note:</strong> ${securityNote}
            </p>
          </div>
          
          ${isFromSettings ? `
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #155724; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong>✅ Security Update</strong><br>
              You successfully changed your password from your account settings. 
              Your current session remains active, but all other devices have been signed out.
            </p>
          </div>
          ` : `
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong>⚠️ Didn't make this change?</strong><br>
              If you didn't change your password, your account may be compromised. 
              Please contact our support team immediately.
            </p>
          </div>
          `}
          
          <div style="text-align: center; margin-bottom: 30px;">
            ${!isFromSettings ? `
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Sign In to Your Account
            </a>
            ` : `
            <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/settings" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Back to Settings
            </a>
            `}
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated security notification. Please do not reply to this email.<br>
              If you need help, contact our support team.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password change confirmation email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending password change confirmation email:', error);
    throw error;
  }
};

// Also create a wrapper function specifically for settings changes
const sendSettingsPasswordChangeEmail = async (email, userName = 'User') => {
  return sendPasswordChangeConfirmationEmail(email, userName, true);
};

// NEW: Successful Login Notification Email
async function sendLoginSuccessEmail(email, userName, deviceInfo, ipAddress) {
  const currentTime = new Date().toLocaleString();
  
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login Successful - Smellify</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .header-subtitle {
          color: #d1fae5;
          font-size: 16px;
          margin: 0;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .icon-container {
          width: 80px;
          height: 80px;
          background: #d1fae5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        
        .success-icon {
          width: 40px;
          height: 40px;
          fill: #059669;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        
        .login-details {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 16px;
          padding: 24px;
          margin: 32px 0;
          text-align: left;
        }
        
        .detail-item {
          margin: 12px 0;
          font-size: 15px;
          color: #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        
        .detail-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .detail-label {
          font-weight: 600;
          color: #1f2937;
        }
        
        .detail-value {
          color: #059669;
          font-weight: 500;
          text-align: right;
        }
        
        .security-notice {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: left;
        }
        
        .security-notice p {
          margin: 0;
          font-size: 14px;
          color: #1e40af;
        }
        
        .alert-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          margin: 24px 0;
          text-align: left;
        }
        
        .alert-notice p {
          margin: 0;
          font-size: 14px;
          color: #7f1d1d;
        }
        
        .footer {
          background: #f9fafb;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        
        @media (max-width: 600px) {
          .detail-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .detail-value {
            text-align: left;
            margin-top: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
            <p class="header-subtitle">Login Successful</p>
          </div>
          
          <div class="content">
            <div class="icon-container">
              <svg class="success-icon" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
            
            <h1 class="title">Welcome Back!</h1>
            <p class="description">
              Hello ${userName || 'there'},<br><br>
              You have successfully logged into your Smellify account. Here are the details of your login session:
            </p>
            
            <div class="login-details">
              <div class="detail-item">
                <span class="detail-label">📧 Email</span>
                <span class="detail-value">${email}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🕒 Login Time</span>
                <span class="detail-value">${currentTime}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🌐 Browser</span>
                <span class="detail-value">${deviceInfo?.browser || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">💻 Operating System</span>
                <span class="detail-value">${deviceInfo?.os || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">📱 Device Type</span>
                <span class="detail-value">${deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🌍 IP Address</span>
                <span class="detail-value">${ipAddress || 'Unknown'}</span>
              </div>
            </div>
            
            <div class="security-notice">
              <p>
                <strong>🛡️ Security Note:</strong> This is a routine security notification to keep you informed about account access. Your account security is our top priority.
              </p>
            </div>
            
            <div class="alert-notice">
              <p>
                <strong>⚠️ Didn't log in?</strong> If this wasn't you, please secure your account immediately by changing your password and contact our support team.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This is an automated security notification from Smellify. For your security, please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Successful Login to Your Smellify Account',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Login success notification sent to: ${email}`);
  } catch (error) {
    console.error('Error sending login success email:', error);
    throw error;
  }
}

// NEW: Suspicious Login Alert Email (when password is correct but no 2FA code provided)
async function sendSuspiciousLoginAlert(email, userName, deviceInfo, ipAddress) {
  const currentTime = new Date().toLocaleString();
  
  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Alert - Smellify</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9fafb;
          line-height: 1.6;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .email-card {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          padding: 32px;
          text-align: center;
        }
        
        .logo {
          color: white;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .header-subtitle {
          color: #fecaca;
          font-size: 16px;
          margin: 0;
        }
        
        .content {
          padding: 40px 32px;
          text-align: center;
        }
        
        .icon-container {
          width: 80px;
          height: 80px;
          background: #fecaca;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        
        .alert-icon {
          width: 40px;
          height: 40px;
          fill: #dc2626;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px;
        }
        
        .description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px;
          line-height: 1.5;
        }
        
        .alert-box {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 16px;
          padding: 24px;
          margin: 32px 0;
          text-align: left;
        }
        
        .alert-title {
          color: #dc2626;
          font-size: 18px;
          font-weight: bold;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
        }
        
        .alert-title svg {
          width: 24px;
          height: 24px;
          margin-right: 8px;
          fill: currentColor;
        }
        
        .login-details {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: left;
        }
        
        .detail-item {
          margin: 10px 0;
          font-size: 14px;
          color: #374151;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 6px;
        }
        
        .detail-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .detail-label {
          font-weight: 600;
          color: #1f2937;
        }
        
        .detail-value {
          color: #dc2626;
          font-weight: 500;
          text-align: right;
        }
        
        .action-required {
          background: #fff7ed;
          border: 2px solid #fed7aa;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        
        .action-required h3 {
          color: #ea580c;
          margin: 0 0 12px 0;
          font-size: 16px;
          display: flex;
          align-items: center;
        }
        
        .action-required h3 svg {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          fill: currentColor;
        }
        
        .action-required ul {
          margin: 12px 0 0 0;
          padding-left: 20px;
          color: #9a3412;
        }
        
        .action-required li {
          margin: 6px 0;
          font-size: 14px;
        }
        
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        
        .button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 0 8px;
        }
        
        .button.secondary {
          background: #6b7280;
        }
        
        .footer {
          background: #f9fafb;
          padding: 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        
        @media (max-width: 600px) {
          .detail-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .detail-value {
            text-align: left;
            margin-top: 4px;
          }
          
          .button {
            display: block;
            margin: 8px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
            <p class="header-subtitle">Security Alert</p>
          </div>
          
          <div class="content">
            <div class="icon-container">
              <svg class="alert-icon" viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </div>
            
            <h1 class="title">Security Alert</h1>
            <p class="description">
              Hello ${userName || 'User'},<br><br>
              We detected a login attempt with the correct password but without completing two-factor authentication on your Smellify account.
            </p>
            
            <div class="alert-box">
              <div class="alert-title">
                <svg viewBox="0 0 24 24">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                Incomplete Login Attempt Detected
              </div>
              <p style="margin: 0; color: #7f1d1d; font-size: 14px;">
                Someone attempted to access your account with the correct email and password but did not complete the two-factor authentication process. This could be a sign that someone has your password.
              </p>
            </div>
            
            <div class="login-details">
              <h3 style="color: #374151; margin: 0 0 12px 0; font-size: 16px;">Attempt Details:</h3>
              <div class="detail-item">
                <span class="detail-label">📧 Email</span>
                <span class="detail-value">${email}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🕒 Attempt Time</span>
                <span class="detail-value">${currentTime}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🌐 Browser</span>
                <span class="detail-value">${deviceInfo?.browser || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">💻 Operating System</span>
                <span class="detail-value">${deviceInfo?.os || 'Unknown'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">📱 Device Type</span>
                <span class="detail-value">${deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🌍 IP Address</span>
                <span class="detail-value">${ipAddress || 'Unknown'}</span>
              </div>
            </div>
            
            <div class="action-required">
              <h3>
                <svg viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                Immediate Action Required
              </h3>
              <ul>
                <li><strong>If this was you:</strong> Complete the login with your authenticator app</li>
                <li><strong>If this wasn't you:</strong> Change your password immediately</li>
                <li><strong>Review your account:</strong> Check for any unauthorized changes</li>
                <li><strong>Contact support:</strong> If you suspect your account is compromised</li>
              </ul>
            </div>
            
            <div class="button-container">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/change-password" class="button">Change Password</a>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/settings" class="button secondary">Account Settings</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This is an automated security alert from Smellify. If you need immediate assistance, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🚨 Security Alert: Incomplete Login Attempt - Smellify',
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Suspicious login alert sent to: ${email}`);
  } catch (error) {
    console.error('Error sending suspicious login alert:', error);
    throw error;
  }
}


async function sendGithubLinkedEmail(email, userName, githubUsername, githubId) {
  const currentTime = new Date().toLocaleString();

  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GitHub Account Linked - Smellify</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f9fafb; }
        .container { max-width: 600px; margin: auto; padding: 20px; }
        .email-card { background: #fff; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; color: white; }
        .header .logo { font-size: 26px; font-weight: bold; }
        .content { padding: 30px; text-align: center; }
        .icon-container { width: 80px; height: 80px; background: #bbf7d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .alert-icon { width: 40px; height: 40px; fill: #16a34a; }
        .title { font-size: 22px; font-weight: bold; margin-bottom: 10px; color: #111827; }
        .description { font-size: 15px; color: #374151; margin-bottom: 20px; }
        .login-details { text-align: left; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-item { margin: 8px 0; font-size: 14px; display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
        .detail-item:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #1f2937; }
        .detail-value { color: #16a34a; font-weight: 500; }
        .footer { padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
            <p>GitHub Account Linked</p>
          </div>
          <div class="content">
            <div class="icon-container">
              <svg class="alert-icon" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
            <h1 class="title">GitHub Account Linked</h1>
            <p class="description">Hello ${userName || "User"},<br>Your Smellify account has been successfully linked with your GitHub account.</p>
            
            <div class="login-details">
              <div class="detail-item"><span class="detail-label">👤 GitHub Username</span><span class="detail-value">${githubUsername}</span></div>
              <div class="detail-item"><span class="detail-label">🆔 GitHub ID</span><span class="detail-value">${githubId}</span></div>
              <div class="detail-item"><span class="detail-label">🕒 Linked At</span><span class="detail-value">${currentTime}</span></div>
            </div>
          </div>
          <div class="footer">
            <p>If this wasn't you, please unlink immediately and change your password for security.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "✅ GitHub Account Linked - Smellify",
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`GitHub linked email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending GitHub linked email:", error);
    throw error;
  }
}


async function sendGithubUnlinkedEmail(email, userName, githubUsername, githubId) {
  const currentTime = new Date().toLocaleString();

  const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>GitHub Account Unlinked - Smellify</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f9fafb; }
        .container { max-width: 600px; margin: auto; padding: 20px; }
        .email-card { background: #fff; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; color: white; }
        .header .logo { font-size: 26px; font-weight: bold; }
        .content { padding: 30px; text-align: center; }
        .icon-container { width: 80px; height: 80px; background: #fecaca; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .alert-icon { width: 40px; height: 40px; fill: #dc2626; }
        .title { font-size: 22px; font-weight: bold; margin-bottom: 10px; color: #111827; }
        .description { font-size: 15px; color: #374151; margin-bottom: 20px; }
        .login-details { text-align: left; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .detail-item { margin: 8px 0; font-size: 14px; display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
        .detail-item:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #1f2937; }
        .detail-value { color: #dc2626; font-weight: 500; }
        .footer { padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <div class="logo">Smellify</div>
            <p>GitHub Account Unlinked</p>
          </div>
          <div class="content">
            <div class="icon-container">
              <svg class="alert-icon" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </div>
            <h1 class="title">GitHub Account Unlinked</h1>
            <p class="description">Hello ${userName || "User"},<br>Your GitHub account has been unlinked from your Smellify account.</p>
            
            <div class="login-details">
              <div class="detail-item"><span class="detail-label">👤 GitHub Username</span><span class="detail-value">${githubUsername}</span></div>
              <div class="detail-item"><span class="detail-label">🆔 GitHub ID</span><span class="detail-value">${githubId}</span></div>
              <div class="detail-item"><span class="detail-label">🕒 Unlinked At</span><span class="detail-value">${currentTime}</span></div>
            </div>
          </div>
          <div class="footer">
            <p>If this wasn't you, please contact support immediately as someone might have tampered with your account.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Smellify Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "❌ GitHub Account Unlinked - Smellify",
    html: emailTemplate
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`GitHub unlinked email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending GitHub unlinked email:", error);
    throw error;
  }
}

// Add this function alongside your existing email functions
async function sendPasswordSetupEmail(email, userName) {
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to: email,
        subject: 'Password Set Up Successfully - Your Account',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Set Up Successfully</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: 24px;">✓</span>
                    </div>
                    <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Password Set Up Successfully</h1>
                </div>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <p style="color: #374151; margin: 0; line-height: 1.6;">
                        Hi ${userName},
                    </p>
                    <p style="color: #374151; margin: 16px 0 0 0; line-height: 1.6;">
                        Great news! You have successfully set up a password for your account. Your account security has been enhanced and you can now sign in using your email and password.
                    </p>
                </div>
                
                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 6px; margin-bottom: 30px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                        🔒 Security Reminder: Keep your password secure and don't share it with anyone.
                    </p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 16px;">What's Next?</h3>
                    <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                        <li>You can now sign in using your email and new password</li>
                        <li>Consider enabling two-factor authentication for extra security</li>
                        <li>You can change your password anytime from account settings</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${process.env.FRONTEND_URL}/login" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                        Sign In Now
                    </a>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                    <p style="color: #6b7280; margin: 0; font-size: 12px;">
                        If you didn't set up this password, please contact our support team immediately.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    return transporter.sendMail(mailOptions);
}
// Export the email functions
module.exports = {
  sendEmail,
  sendLoginSuccessEmail,                    // NEW: Send on successful login
  sendSuspiciousLoginAlert,                 // NEW: Send when password correct but no 2FA
  sendEmailChangeVerification,
  sendEmailChangeConfirmation,
  sendAccountDeletionConfirmation,
  send2FAEnabledEmail,
  send2FADisabledEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmationEmail,
  sendSettingsPasswordChangeEmail,
  sendGithubLinkedEmail,
  sendGithubUnlinkedEmail,
  sendPasswordSetupEmail,                   // NEW: Send on password setup
};