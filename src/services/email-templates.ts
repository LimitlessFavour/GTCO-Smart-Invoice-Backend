export const emailTemplates = {
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
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #DD4F05;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9f9f9;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #DD4F05;
        }
        .details {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff;
            border-radius: 5px;
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
</html>
`,
};
