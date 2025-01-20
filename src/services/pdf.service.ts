/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';
// import { Client } from 'src/client/client.entity';
// import { Company } from 'src/company/company.entity';
import { Invoice } from 'src/invoice/invoice.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateInvoicePdf(invoice: Invoice): Promise<string> {
    if (!invoice) {
      throw new Error('Invoice data is required');
    }

    // Create PDF document with better quality settings
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Invoice ${invoice.invoiceNumber}`,
        Author: 'GTCO SmartInvoice',
      },
    });

    // Set up file path
    const invoicesDir = path.join(__dirname, '..', '..', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const filePath = path.join(
      invoicesDir,
      `invoice-${invoice.invoiceNumber}.pdf`,
    );

    // Pipe to file stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Load company logo if available and valid
    if (invoice.company?.logo && this.isValidUrl(invoice.company.logo)) {
      try {
        const response = await axios.get(invoice.company.logo, {
          responseType: 'arraybuffer',
        });
        doc.image(response.data, 50, 50, { width: 100 });
      } catch (error) {
        this.logger.warn(`Failed to load company logo: ${error.message}`);
        // Continue without the logo
      }
    }

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'right' });
    doc.fontSize(14).text(`#${invoice.invoiceNumber}`, { align: 'right' });

    // From and Bill To sections
    doc.moveDown();
    doc.fontSize(14).text('From:', 50, 150);
    doc
      .fontSize(12)
      .text(invoice.company.name)
      .text(invoice.company.description || '');

    doc.fontSize(14).text('Bill To:', 300, 150);
    doc
      .fontSize(12)
      .text(`${invoice.client.firstName} ${invoice.client.lastName}`)
      .text(invoice.client.email)
      .text(invoice.client.phoneNumber || '')
      .text(invoice.client.address || '');

    // Dates
    doc.moveDown(2);
    doc
      .fontSize(12)
      .text('Invoice Date:', 50)
      .text(new Date(invoice.createdAt).toLocaleDateString(), {
        align: 'left',
      });

    doc
      .text('Due Date:', 300)
      .text(new Date(invoice.dueDate).toLocaleDateString(), { align: 'left' });

    // Items table
    doc.moveDown(2);
    this.generateTable(doc, invoice);

    // Totals
    const y = doc.y + 20;
    const subtotal = parseFloat(invoice.totalAmount.toString());

    if (isNaN(subtotal)) {
      this.logger.error('Invalid subtotal amount:', invoice.totalAmount);
      throw new Error('Invalid invoice total amount');
    }

    const vat = subtotal * 0.075;
    const total = subtotal + vat;

    doc
      .fontSize(12)
      .text('Subtotal:', 400, y)
      .text(`₦${subtotal.toFixed(2)}`, 480, y, { align: 'right' });

    doc
      .text('VAT (7.5%):', 400, y + 20)
      .text(`₦${vat.toFixed(2)}`, 480, y + 20, { align: 'right' });

    doc
      .fontSize(14)
      .text('Total:', 400, y + 40)
      .text(`₦${total.toFixed(2)}`, 480, y + 40, { align: 'right' });

    // Footer
    doc.fontSize(10).text('Powered by GTCO', 50, doc.page.height - 50, {
      align: 'left',
      // color: 'grey',
    });

    // Finalize PDF
    doc.end();

    // Wait for the write stream to finish
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private generateTable(doc: typeof PDFDocument, invoice: Invoice) {
    // Table headers
    const tableTop = doc.y + 20;
    doc
      .fontSize(12)
      .text('Item', 50, tableTop)
      .text('Qty', 250, tableTop)
      .text('Price', 350, tableTop)
      .text('Total', 450, tableTop);

    doc.moveDown();

    // Table rows with explicit number parsing
    let y = doc.y;
    invoice.items.forEach((item) => {
      const price = parseFloat(item.price.toString());
      const quantity = parseInt(item.quantity.toString());

      if (isNaN(price) || isNaN(quantity)) {
        this.logger.error('Invalid price or quantity:', {
          price: item.price,
          quantity: item.quantity,
        });
        throw new Error('Invalid price or quantity in invoice items');
      }

      const total = price * quantity;

      doc
        .text(item.product.productName, 50, y)
        .text(quantity.toString(), 250, y)
        .text(`₦${price.toFixed(2)}`, 350, y)
        .text(`₦${total.toFixed(2)}`, 450, y);

      y += 20;
    });

    // Draw lines
    doc
      .moveTo(50, tableTop - 5)
      .lineTo(550, tableTop - 5)
      .stroke();

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();
  }

  // Add this helper method to validate URLs
  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch (err) {
      return false;
    }
  }
}
