/* eslint-disable @typescript-eslint/no-unused-vars */
import { sharedStyles } from './shared-styles';

export const authTemplates = {
  emailVerification: (data: { name: string; verificationLink: string }) => `
<!DOCTYPE html>
<html>
<head>
    <style>${sharedStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Verify Your Email</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            <p>Welcome to GTCO SmartInvoice! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="${data.verificationLink}" class="button">Verify Email</a>
            </p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${data.verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} GTCO SmartInvoice. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

  resetPassword: (data: { name: string; resetLink: string }) => `
<!DOCTYPE html>
<html>
<head>
    <style>${sharedStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Reset Your Password</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
                <a href="${data.resetLink}" class="button">Reset Password</a>
            </p>
            <p>If you didn't request this change, you can ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} GTCO SmartInvoice. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

  magicLink: (data: { name: string; loginLink: string }) => `
<!DOCTYPE html>
<html>
<head>
    <style>${sharedStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Magic Link Sign In</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            <p>Click the button below to sign in to your account:</p>
            <p style="text-align: center;">
                <a href="${data.loginLink}" class="button">Sign In</a>
            </p>
            <p>If you didn't request this link, you can safely ignore this email.</p>
            <p>This link will expire in 15 minutes.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} GTCO SmartInvoice. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

  welcome: (data: { name: string; companyName?: string }) => `
<!DOCTYPE html>
<html>
<head>
    <style>${sharedStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to ${data.companyName || 'GTCO SmartInvoice'}</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            
            <p>Welcome to ${data.companyName || 'GTCO SmartInvoice'}! We're excited to have you on board.</p>
            
            <div class="details">
                <p>With our platform, you can:</p>
                <ul>
                    <li>Create and send professional invoices</li>
                    <li>Track payments in real-time</li>
                    <li>Manage your clients and products</li>
                    <li>Generate detailed financial reports</li>
                </ul>
            </div>
            
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            
            <p>Best regards,<br>${data.companyName || 'GTCO SmartInvoice Team'}</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.companyName || 'GTCO SmartInvoice'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
};
