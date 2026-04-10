import { getDatabase } from './database';

export async function getAllProducts() {
  const db = await getDatabase();
  return await db.getAllAsync('SELECT * FROM products ORDER BY name ASC');
}

export async function getProductById(id) {
  const db = await getDatabase();
  return await db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
}

export async function createProduct(name, rate) {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO products (name, rate) VALUES (?, ?)',
    [name.trim(), parseFloat(rate)]
  );
  return result.lastInsertRowId;
}

export async function updateProduct(id, name, rate) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE products SET name = ?, rate = ? WHERE id = ?',
    [name.trim(), parseFloat(rate), id]
  );
}

export async function deleteProduct(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

export async function searchProducts(query) {
  const db = await getDatabase();
  const searchTerm = `%${query}%`;
  return await db.getAllAsync(
    'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC',
    [searchTerm]
  );
}
