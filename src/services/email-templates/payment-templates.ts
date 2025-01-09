import { sharedStyles } from './shared-styles';

export const paymentTemplates = {
  paymentConfirmation: (data: {
    name: string;
    invoiceNumber: string;
    amount: number;
    date: string;
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
            <h2>${data.companyName || 'GTCO SmartInvoice'}</h2>
        </div>
        <div class="content">
            <p>Dear ${data.name},</p>
            
            <p>We are pleased to confirm that we have received your payment.</p>
            
            <div class="details">
                <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                <p><strong>Payment Amount:</strong> <span class="amount">₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span></p>
                <p><strong>Payment Date:</strong> ${data.date}</p>
            </div>
            
            <p>Thank you for your prompt payment. We truly value your business and look forward to serving you again.</p>
            
            <p>Best regards,<br>${data.companyName || 'GTCO SmartInvoice Team'}</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${data.companyName || 'GTCO SmartInvoice'}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
};
