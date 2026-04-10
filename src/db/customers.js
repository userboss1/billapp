import { getDatabase } from './database';

export async function getAllCustomers() {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM customers ORDER BY name ASC');
}

export async function getCustomerById(id) {
  const db = await getDatabase();
  return await db.getFirstAsync('SELECT * FROM customers WHERE id = ?', [id]);
}

export async function createCustomer(name, phone = '', address = '') {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
    [name.trim(), phone.trim(), address.trim()]
  );
  return result.lastInsertRowId;
}

export async function updateCustomer(id, name, phone = '', address = '') {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name.trim(), phone.trim(), address.trim(), id]
  );
}

export async function deleteCustomer(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
}

export async function searchCustomers(query) {
  const db = await getDatabase();
  const searchTerm = `%${query}%`;
  return await db.getAllAsync(
    'SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC',
    [searchTerm, searchTerm]
  );
}
