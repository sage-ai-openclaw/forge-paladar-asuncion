import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Restaurant, MenuItem, RestaurantInput, MenuItemInput } from '../types';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initDb(): Promise<void> {
  db = await open({
    filename: './data/paladar.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      zone TEXT NOT NULL,
      phone TEXT,
      website TEXT,
      cuisine_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price_pyg INTEGER NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_restaurants_zone ON restaurants(zone);
    CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_price ON menu_items(price_pyg);
  `);
}

export function getDb(): Database<sqlite3.Database, sqlite3.Statement> {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// Restaurant operations
export async function getAllRestaurants(): Promise<Restaurant[]> {
  return await getDb().all<Restaurant[]>('SELECT * FROM restaurants ORDER BY name');
}

export async function getRestaurantById(id: number): Promise<Restaurant | undefined> {
  return await getDb().get<Restaurant>('SELECT * FROM restaurants WHERE id = ?', id);
}

export async function createRestaurant(input: RestaurantInput): Promise<Restaurant> {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO restaurants (name, address, zone, phone, website, cuisine_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.address, input.zone, input.phone || null, input.website || null, input.cuisine_type || null]
  );
  return await getRestaurantById(result.lastID!) as Restaurant;
}

export async function updateRestaurant(id: number, input: RestaurantInput): Promise<Restaurant> {
  const db = getDb();
  await db.run(
    `UPDATE restaurants SET 
      name = ?, address = ?, zone = ?, phone = ?, website = ?, cuisine_type = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.name, input.address, input.zone, input.phone || null, input.website || null, input.cuisine_type || null, id]
  );
  return await getRestaurantById(id) as Restaurant;
}

export async function deleteRestaurant(id: number): Promise<void> {
  await getDb().run('DELETE FROM restaurants WHERE id = ?', id);
}

// Menu item operations
export async function getMenuItemsByRestaurant(restaurantId: number): Promise<MenuItem[]> {
  return await getDb().all<MenuItem[]>(
    'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
    restaurantId
  );
}

export async function getMenuItemById(id: number): Promise<MenuItem | undefined> {
  return await getDb().get<MenuItem>('SELECT * FROM menu_items WHERE id = ?', id);
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO menu_items (restaurant_id, name, description, price_pyg, category)
     VALUES (?, ?, ?, ?, ?)`,
    [input.restaurant_id, input.name, input.description || null, input.price_pyg, input.category || null]
  );
  return await getMenuItemById(result.lastID!) as MenuItem;
}

export async function updateMenuItem(id: number, input: MenuItemInput): Promise<MenuItem> {
  const db = getDb();
  await db.run(
    `UPDATE menu_items SET 
      restaurant_id = ?, name = ?, description = ?, price_pyg = ?, category = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.restaurant_id, input.name, input.description || null, input.price_pyg, input.category || null, id]
  );
  return await getMenuItemById(id) as MenuItem;
}

export async function deleteMenuItem(id: number): Promise<void> {
  await getDb().run('DELETE FROM menu_items WHERE id = ?', id);
}

export async function bulkImportMenuItems(items: MenuItemInput[]): Promise<number> {
  const db = getDb();
  let inserted = 0;
  
  for (const item of items) {
    try {
      await db.run(
        `INSERT INTO menu_items (restaurant_id, name, description, price_pyg, category)
         VALUES (?, ?, ?, ?, ?)`,
        [item.restaurant_id, item.name, item.description || null, item.price_pyg, item.category || null]
      );
      inserted++;
    } catch (err) {
      console.error('Failed to insert item:', item, err);
    }
  }
  
  return inserted;
}
