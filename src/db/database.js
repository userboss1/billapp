import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDatabase() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('billing.db');
  
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  return db;
}

export async function initDatabase() {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      customer_name TEXT DEFAULT '',
      bill_number TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      final_amount REAL NOT NULL DEFAULT 0,
      is_party_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      party_name TEXT DEFAULT '',
      quantity REAL NOT NULL DEFAULT 1,
      rate REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // Migrations for existing databases
  try {
    await database.execAsync(`ALTER TABLE bills ADD COLUMN is_party_order INTEGER NOT NULL DEFAULT 0;`);
  } catch (e) { /* column already exists */ }
  try {
    await database.execAsync(`ALTER TABLE bills ADD COLUMN discount REAL NOT NULL DEFAULT 0;`);
  } catch (e) {}
  try {
    await database.execAsync(`ALTER TABLE bills ADD COLUMN final_amount REAL NOT NULL DEFAULT 0;`);
  } catch (e) {}
  try {
    await database.execAsync(`ALTER TABLE bills ADD COLUMN customer_name TEXT DEFAULT '';`);
  } catch (e) {}

  try {
    await database.execAsync(`ALTER TABLE bill_items ADD COLUMN party_name TEXT DEFAULT '';`);
  } catch (e) {}

  // Backfill final_amount for old bills that have 0
  await database.execAsync(`UPDATE bills SET final_amount = total_amount WHERE final_amount = 0 AND total_amount > 0;`);

  return database;
}

export async function generateBillNumber() {
  const database = await getDatabase();
  const result = await database.getFirstAsync('SELECT COUNT(*) as count FROM bills');
  const count = (result?.count || 0) + 1;
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}-${String(count).padStart(4, '0')}`;
}
