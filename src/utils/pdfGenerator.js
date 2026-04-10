import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateInvoiceHTML } from './pdfTemplate';

export async function sharePDF(billData, isRawHtml = false) {
  try {
    let html = '';
    if (isRawHtml) {
      html = billData.html;
    } else {
      const phone1 = await AsyncStorage.getItem('companyPhone1') || '';
      const phone2 = await AsyncStorage.getItem('companyPhone2') || '';
      html = generateInvoiceHTML(billData, phone1, phone2);
    }
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      const fileName = isRawHtml ? billData.bill_number : billData.bill_number;
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share ${fileName}`
      });
    }
    return uri;
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
}

export async function printBill(billData) {
  try {
    const phone1 = await AsyncStorage.getItem('companyPhone1') || '';
    const phone2 = await AsyncStorage.getItem('companyPhone2') || '';
    const html = generateInvoiceHTML(billData, phone1, phone2);
    await Print.printAsync({
      html,
    });
  } catch (error) {
    console.error('Error printing:', error);
    throw error;
  }
}

export function generateBillsListPDF(bills, filterDesc, totalRevenue) {
  const date = new Date().toLocaleDateString('en-GB');

  const TableRows = bills.map((b, i) => {
    let itemsStr = b.items && b.items.length > 0 ? b.items.map(item => `${item.product_name} (${item.quantity})`).join(', ') : '—';
    return `
    <tr>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px;">${i + 1}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; font-weight: bold;">${b.bill_number}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px;">${b.display_name} ${b.is_party_order ? '(Party)' : ''}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px;">${itemsStr}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px;">${new Date(b.created_at).toLocaleDateString('en-GB')}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; text-align: right; font-weight: bold;">${Number(b.final_amount > 0 ? b.final_amount : b.total_amount).toLocaleString('en-IN')}</td>
    </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Bills Report</title></head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="border: 2px solid #000; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase;">PCH & COMPANY Bills Report</h1>
          <p style="margin: 0; font-size: 14px;">Generated on ${date}</p>
        </div>
        <p style="font-size: 14px; margin-bottom: 15px;"><strong>Filters:</strong> ${filterDesc}</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">#</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">INVOICE NO</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">CUSTOMER</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">ITEMS</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">DATE</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #000; font-size: 12px;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>${TableRows}</tbody>
        </table>
        <div style="text-align: right; padding: 10px; border: 2px solid #000;">
          <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">Total Revenue (${bills.length} bills)</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold;">${Number(totalRevenue).toLocaleString('en-IN')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateCustomerReportPDF(reports) {
  const date = new Date().toLocaleDateString('en-GB');
  const totalRev = reports.reduce((s, r) => s + r.total_spent, 0);

  const TableRows = reports.map((r, i) => `
    <tr>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px;">${i + 1}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; font-weight: bold;">${r.customer_name}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px;">${r.customer_phone || '-'}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; text-align: center;">${r.total_bills}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; text-align: right; font-weight: bold;">${Number(r.total_spent).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Customer Report</title></head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="border: 2px solid #000; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase;">Customer Spending Report</h1>
          <p style="margin: 0; font-size: 14px;">Generated on ${date}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">RANK</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">CUSTOMER NAME</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">PHONE</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #000; font-size: 12px;">BILLS</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #000; font-size: 12px;">TOTAL SPENT</th>
            </tr>
          </thead>
          <tbody>${TableRows}</tbody>
        </table>
        <div style="text-align: right; padding: 10px; border: 2px solid #000;">
          <p style="margin: 0; font-size: 20px; font-weight: bold;">Total Revenue: ${Number(totalRev).toLocaleString('en-IN')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateDailySalesReportPDF(sales) {
  const date = new Date().toLocaleDateString('en-GB');
  const totalRev = sales.reduce((s, r) => s + r.daily_total, 0);
  const totalBills = sales.reduce((s, r) => s + r.bill_count, 0);

  const TableRows = sales.map((r, i) => `
    <tr>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; font-weight: bold;">${new Date(r.sale_date).toLocaleDateString('en-GB')}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; text-align: center;">${r.bill_count}</td>
      <td style="padding: 6px; border: 1px solid #000; font-size: 12px; text-align: right; font-weight: bold;">${Number(r.daily_total).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Daily Sales Report</title></head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #000; background: #fff;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="border: 2px solid #000; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase;">Daily Sales Report (30 Days)</h1>
          <p style="margin: 0; font-size: 14px;">Generated on ${date}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 12px;">DATE</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #000; font-size: 12px;">BILLS COUNT</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #000; font-size: 12px;">TOTAL SALES</th>
            </tr>
          </thead>
          <tbody>${TableRows}</tbody>
        </table>
        <div style="text-align: right; padding: 10px; border: 2px solid #000;">
          <p style="margin: 0 0 5px 0; font-size: 18px; font-weight: bold;">Total Bills: ${totalBills}</p>
          <p style="margin: 0; font-size: 24px; font-weight: bold;">Total Revenue: ${Number(totalRev).toLocaleString('en-IN')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
