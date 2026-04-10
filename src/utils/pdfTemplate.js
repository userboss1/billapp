export function generateInvoiceHTML(bill, phone1 = '', phone2 = '') {
  const itemRows = bill.items.map((item, index) => `
    <tr>
      <td style="padding: 6px 8px; border: 1px solid #000; font-size: 14px;">${item.party_name || '-'}</td>
      <td style="padding: 6px 8px; border: 1px solid #000; font-size: 14px;">${item.product_name}</td>
      <td style="padding: 6px 8px; border: 1px solid #000; text-align: center; font-size: 14px;">${item.quantity}</td>
      <td style="padding: 6px 8px; border: 1px solid #000; text-align: right; font-size: 14px;">${Number(item.rate).toLocaleString('en-IN')}</td>
      <td style="padding: 6px 8px; border: 1px solid #000; text-align: right; font-weight: bold; font-size: 14px;">${Number(item.total).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const date = new Date(bill.created_at);
  const formattedDate = date.toLocaleDateString('en-GB');

  let subtitleTxt = '';
  if (phone1 && phone2) {
     subtitleTxt = `${"Tel:"+phone1}, ${"Mob: "+phone2}`;
  } else if (phone1 || phone2) {      
     subtitleTxt = phone1 ? "Tel:"+phone1 : "Mob: "+phone2;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${bill.bill_number}</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000;">
      <div style="max-width: 800px; margin: 0 auto;">
        
        <div style="border: 2px solid #000; padding: 15px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0 0 5px 0; font-size: 26px; font-weight: bold; text-transform: uppercase;">PCH & COMPANY KONDOTTY</h1>
          ${subtitleTxt ? `<p style="margin: 0; font-size: 15px; font-weight: bold;">${subtitleTxt}</p>` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding: 0 5px;">
          <div style="font-size: 16px; font-weight: bold;">
            To: <span style="margin-left: 10px;">${bill.display_name || bill.customer_name}</span>
          </div>
          <div style="font-size: 16px; font-weight: bold;">
            Date: <span style="margin-left: 10px;">${formattedDate}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 14px;">PARTY</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #000; font-size: 14px;">ITEM</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #000; font-size: 14px;">QTY</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #000; font-size: 14px;">RATE</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #000; font-size: 14px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; padding-right: 5px;">
          <table style="width: 250px; border-collapse: collapse;">
            ${bill.discount > 0 ? `
              <tr>
                <td style="padding: 5px; font-size: 14px; text-align: right;">Subtotal</td>
                <td style="padding: 5px; font-size: 14px; text-align: right; font-weight: bold;">${Number(bill.total_amount).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 5px; font-size: 14px; text-align: right;">Discount</td>
                <td style="padding: 5px; font-size: 14px; text-align: right; font-weight: bold;">-${Number(bill.discount).toLocaleString('en-IN')}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; font-size: 16px; text-align: right; font-weight: bold;">TOTAL</td>
              <td style="padding: 8px; font-size: 18px; text-align: right; font-weight: bold;">${Number(bill.final_amount > 0 ? bill.final_amount : bill.total_amount).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

      </div>
    </body>
    </html>
  `;
}
