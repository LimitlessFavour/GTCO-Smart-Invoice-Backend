import { sharedStyles } from './shared-styles';

export const invoiceTemplates = {
  invoiceCreated: (data: {
    name: string;
    paymentLink: string;
    companyName?: string;
    invoiceNumber: string;
    dueDate?: string;
  }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DD4F05; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { 
            background-color: #DD4F05; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            display: inline-block; 
            margin: 20px 0;
        }
        .details {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff;
            border-radius: 5px;
        }
        .important-note {
            background-color: #fff3e0;
            border-left: 4px solid #DD4F05;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>${data.companyName || 'GTCO SmartInvoice'}</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            
            <p>Please find your invoice (#${data.invoiceNumber}) attached to this email.</p>
            
            <div class="details">
                <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
            </div>

            <div class="important-note">
                <p><strong>Payment Instructions:</strong></p>
                <p>Click the button below to make your payment securely:</p>
            </div>
            
            <p style="text-align: center;">
                <a href="${data.paymentLink}" class="button">Make Payment</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${data.paymentLink}</p>
            
            <p>Best regards,<br>${data.companyName || 'GTCO SmartInvoice Team'}</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${data.companyName || 'GTCO SmartInvoice'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

  invoiceReminder: (data: {
    name: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    paymentLink: string;
    companyName?: string;
  }) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Same styles as above */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Payment Reminder</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            
            <p>This is a friendly reminder that payment for invoice #${data.invoiceNumber} is due on ${data.dueDate}.</p>
            
            <div class="details">
                <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                <p><strong>Amount Due:</strong> ₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                <p><strong>Due Date:</strong> ${data.dueDate}</p>
            </div>
            
            <p style="text-align: center;">
                <a href="${data.paymentLink}" class="button">Pay Now</a>
            </p>
            
            <p>If you have already made the payment, please disregard this reminder.</p>
            
            <p>Best regards,<br>${data.companyName || 'GTCO SmartInvoice Team'}</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.companyName || 'GTCO SmartInvoice'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,

  overdueInvoice: (data: {
    name: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    paymentLink: string;
    companyName?: string;
  }) => `
<!DOCTYPE html>
<html>
<head>
    <style>${sharedStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Invoice Overdue Notice</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            <p>This is a reminder that invoice #${data.invoiceNumber} for ₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} was due on ${data.dueDate}.</p>
            <p style="text-align: center;">
                <a href="${data.paymentLink}" class="button">Pay Now</a>
            </p>
            <p>If you have already made the payment, please disregard this notice.</p>
            <p>Best regards,<br>${data.companyName || 'GTCO SmartInvoice Team'}</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${data.companyName || 'GTCO SmartInvoice'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
};
