import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData } from '@/components/invoice/invoice-template';

export class InvoiceService {
  /**
   * Generate PDF from HTML element
   */
  static async generatePDFFromHTML(element: HTMLElement, filename: string): Promise<Blob> {
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Return as blob
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Generate invoice data from order
   */
  static generateInvoiceData(order: any): InvoiceData {
    const invoiceNumber = `INV-${order.orderNumber}`;
    const currentDate = new Date().toISOString().split('T')[0];

    return {
      invoiceNumber,
      invoiceDate: currentDate,
      dueDate: currentDate, // Immediate payment
      orderNumber: order.orderNumber,
      customerInfo: {
        name: order.user?.name || 'Guest Customer',
        email: order.email,
        phone: order.shippingAddress?.phone || '',
        address: order.shippingAddress ? {
          street: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        } : {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
        },
      },
      billingAddress: order.billingAddress ? {
        street: order.billingAddress.street,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        postalCode: order.billingAddress.postalCode,
        country: order.billingAddress.country,
      } : order.shippingAddress ? {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      } : {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      items: order.orderItems?.map((item: any) => ({
        name: item.product?.name || 'Product',
        description: item.product?.description || '',
        quantity: item.quantity,
        price: item.price,
        sku: item.product?.sku || '',
      })) || [],
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      shipping: order.shippingCost || 0,
      taxes: order.tax || 0,
      totalPrice: order.totalPrice || 0,
      currency: 'INR',
      paymentMethod: order.paymentMethod || 'Online Payment',
      paymentStatus: order.status || 'Paid',
      notes: 'Thank you for your business!',
      couponCode: order.couponCode || undefined,
    };
  }

  /**
   * Save invoice file to server (placeholder for file system storage)
   */
  static async saveInvoiceFile(pdfBlob: Blob, filename: string): Promise<string> {
    // In a real implementation, you would save this to a file storage service
    // like AWS S3, Google Cloud Storage, or local file system
    // For now, we'll return a placeholder path
    const filePath = `/invoices/${filename}`;
    
    // TODO: Implement actual file storage
    console.log(`Invoice would be saved to: ${filePath}`);
    
    return filePath;
  }

  /**
   * Generate filename for invoice
   */
  static generateInvoiceFilename(orderNumber: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `invoice-${orderNumber}-${timestamp}.pdf`;
  }
}

export default InvoiceService;