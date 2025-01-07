import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoice: any): Promise<string> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filePath = `./invoices/invoice-${invoice.invoiceNumber}.pdf`;

    // Ensure the invoices directory exists
    if (!fs.existsSync('./invoices')) {
      fs.mkdirSync('./invoices');
    }

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(filePath));

    // Add header
    doc.fontSize(20).text('GTCO SmartInvoice', 50, 50);
    doc.fontSize(14).text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 90);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 110);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 50, 130);
    doc.text(`Status: ${invoice.status}`, 50, 150);

    // Add company and client details
    doc.moveDown();
    doc.fontSize(16).text('From:', 50, 190);
    doc.text(`${invoice.company.name}`, 50, 210);
    doc.text(`${invoice.company.description}`, 50, 230);

    doc.moveDown();
    doc.fontSize(16).text('To:', 50, 270);
    doc.text(`${invoice.client.name}`, 50, 290);
    doc.text(`${invoice.client.email}`, 50, 310);
    doc.text(`${invoice.client.phone}`, 50, 330);

    // Add invoice items table
    doc.moveDown();
    doc.fontSize(16).text('Items:', 50, 370);
    const startY = 390;
    let y = startY;

    // Table headers
    doc.fontSize(12).text('Product', 50, y);
    doc.text('Quantity', 250, y);
    doc.text('Price', 350, y);
    doc.text('Total', 450, y);
    y += 20;

    // Table rows
    invoice.items.forEach((item) => {
      doc.text(item.product.name, 50, y);
      doc.text(item.quantity.toString(), 250, y);
      doc.text(`$${item.price.toFixed(2)}`, 350, y);
      doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 450, y);
      y += 20;
    });

    // Add total amount
    doc.moveDown();
    doc
      .fontSize(16)
      .text(`Total Amount: $${invoice.totalAmount.toFixed(2)}`, 50, y + 20);

    // Add payment link
    doc.moveDown();
    doc.fontSize(12).text(`Payment Link: ${invoice.paymentLink}`, 50, y + 50);

    // Finalize the PDF
    doc.end();

    return filePath;
  }
}
