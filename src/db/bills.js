import { getDatabase, generateBillNumber } from './database';

export async function createBill(customerId, customerName, items, isPartyOrder = false, discount = 0) {
  const db = await getDatabase();
  const billNumber = await generateBillNumber();
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const finalAmount = Math.max(0, totalAmount - discount);

  let billId;

  await db.withTransactionAsync(async () => {
    let finalCustId = customerId;
    
    // Satisfy older NOT NULL database constraints and auto-save manual customers
    if (!finalCustId) {
      const custResult = await db.runAsync(
        'INSERT INTO customers (name, phone) VALUES (?, ?)',
        [customerName || 'Walk-in', '']
      );
      finalCustId = custResult.lastInsertRowId;
    }

    const billResult = await db.runAsync(
      'INSERT INTO bills (customer_id, customer_name, bill_number, total_amount, discount, final_amount, is_party_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [finalCustId, customerName, billNumber, totalAmount, discount, finalAmount, isPartyOrder ? 1 : 0]
    );
    billId = billResult.lastInsertRowId;

    for (const item of items) {
      await db.runAsync(
        'INSERT INTO bill_items (bill_id, product_id, product_name, party_name, quantity, rate, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [billId, item.productId || null, item.productName, item.partyName || '', item.quantity, item.rate, item.quantity * item.rate]
      );
    }
  });

  return { billId, billNumber };
}

export async function getAllBills() {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT b.*, 
      CASE WHEN b.customer_id IS NOT NULL THEN c.name ELSE b.customer_name END as display_name,
      c.phone as customer_phone
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    ORDER BY b.created_at DESC
  `);
}

export async function getBillsFiltered(customerId, customerName, startDate, endDate, partyOnly, billNumber) {
  const db = await getDatabase();
  let query = `
    SELECT b.*, 
      CASE WHEN b.customer_id IS NOT NULL THEN c.name ELSE b.customer_name END as display_name,
      c.phone as customer_phone
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (customerId) {
    query += ' AND b.customer_id = ?';
    params.push(customerId);
  } else if (customerName) {
    query += ' AND (c.name = ? OR b.customer_name = ?)';
    params.push(customerName, customerName);
  }
  if (startDate) {
    query += ' AND date(b.created_at) >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date(b.created_at) <= ?';
    params.push(endDate);
  }
  if (partyOnly) {
    query += ' AND b.is_party_order = 1';
  }
  if (billNumber) {
    query += ' AND b.bill_number LIKE ?';
    params.push(`%${billNumber}%`);
  }
  query += ' ORDER BY b.created_at DESC';

  return await db.getAllAsync(query, params);
}

export async function getUniqueBillCustomers() {
  const db = await getDatabase();
  // Get all unique customers who have bills, plus all customers in the DB
  return await db.getAllAsync(`
    SELECT DISTINCT name FROM (
      SELECT name FROM customers
      UNION
      SELECT customer_name as name FROM bills WHERE customer_name IS NOT NULL AND customer_name != ''
    ) ORDER BY name ASC
  `);
}

export async function getBillById(id) {
  const db = await getDatabase();
  return await db.getFirstAsync(`
    SELECT b.*, 
      CASE WHEN b.customer_id IS NOT NULL THEN c.name ELSE b.customer_name END as display_name,
      c.name as customer_name, c.phone as customer_phone, c.address as customer_address
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `, [id]);
}

export async function getBillItems(billId) {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM bill_items WHERE bill_id = ? ORDER BY id ASC',
    [billId]
  );
}

export async function getBillWithItems(id) {
  const bill = await getBillById(id);
  if (!bill) return null;
  const items = await getBillItems(id);
  return { ...bill, items };
}

export async function deleteBill(id) {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM bill_items WHERE bill_id = ?', [id]);
    await db.runAsync('DELETE FROM bills WHERE id = ?', [id]);
  });
}

export async function getBillStats() {
  const db = await getDatabase();
  const stats = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as total_bills,
      COALESCE(SUM(CASE WHEN final_amount > 0 THEN final_amount ELSE total_amount END), 0) as total_revenue
    FROM bills
  `);
  return stats || { total_bills: 0, total_revenue: 0 };
}

export async function getAllCustomerReports() {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT 
      c.id,
      c.name as customer_name,
      c.phone as customer_phone,
      COUNT(b.id) as total_bills,
      COALESCE(SUM(CASE WHEN b.final_amount > 0 THEN b.final_amount ELSE b.total_amount END), 0) as total_spent
    FROM customers c
    LEFT JOIN bills b ON c.id = b.customer_id
    GROUP BY c.id
    ORDER BY total_spent DESC
  `);
}

export async function getSalesByDate(startDate, endDate) {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT 
      date(created_at) as sale_date,
      COUNT(*) as bill_count,
      SUM(CASE WHEN final_amount > 0 THEN final_amount ELSE total_amount END) as daily_total
    FROM bills
    WHERE date(created_at) BETWEEN ? AND ?
    GROUP BY date(created_at)
    ORDER BY sale_date DESC
  `, [startDate, endDate]);
}

export async function getTodayStats() {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const stats = await db.getFirstAsync(`
    SELECT 
      COUNT(*) as today_bills,
      COALESCE(SUM(CASE WHEN final_amount > 0 THEN final_amount ELSE total_amount END), 0) as today_revenue
    FROM bills
    WHERE date(created_at) = ?
  `, [today]);
  return stats || { today_bills: 0, today_revenue: 0 };
}

export async function getBillsByDate(dateStr) {
  const db = await getDatabase();
  return await db.getAllAsync(`
    SELECT b.*, 
      CASE WHEN b.customer_id IS NOT NULL THEN c.name ELSE b.customer_name END as display_name,
      c.phone as customer_phone
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE date(b.created_at) = ?
    ORDER BY b.created_at DESC
  `, [dateStr]);
}
