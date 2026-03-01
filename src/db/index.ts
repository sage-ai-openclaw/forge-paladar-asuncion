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
      hours TEXT,
      cuisine_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price_pyg INTEGER NOT NULL,
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_restaurants_zone ON restaurants(zone);
    CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_price ON menu_items(price_pyg);
    CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
    CREATE INDEX IF NOT EXISTS idx_restaurants_name ON restaurants(name);
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

export async function createRestaurant(input: RestaurantInput): Promise<Restaurant | undefined> {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO restaurants (name, address, zone, phone, hours, cuisine_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.address, input.zone, input.phone || null, input.hours || null, input.cuisine_type]
  );
  return await getRestaurantById(result.lastID!);
}

export async function updateRestaurant(id: number, input: Partial<RestaurantInput>): Promise<Restaurant | undefined> {
  const db = getDb();
  
  const fields: string[] = [];
  const values: (string | null | number)[] = [];
  
  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.address !== undefined) {
    fields.push('address = ?');
    values.push(input.address);
  }
  if (input.zone !== undefined) {
    fields.push('zone = ?');
    values.push(input.zone);
  }
  if (input.phone !== undefined) {
    fields.push('phone = ?');
    values.push(input.phone || null);
  }
  if (input.hours !== undefined) {
    fields.push('hours = ?');
    values.push(input.hours || null);
  }
  if (input.cuisine_type !== undefined) {
    fields.push('cuisine_type = ?');
    values.push(input.cuisine_type);
  }
  
  if (fields.length === 0) {
    return await getRestaurantById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.run(
    `UPDATE restaurants SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return await getRestaurantById(id);
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

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem | undefined> {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO menu_items (restaurant_id, name, description, price_pyg, category)
     VALUES (?, ?, ?, ?, ?)`,
    [input.restaurant_id, input.name, input.description || null, input.price_pyg, input.category]
  );
  return await getMenuItemById(result.lastID!);
}

export async function updateMenuItem(id: number, input: Partial<MenuItemInput>): Promise<MenuItem | undefined> {
  const db = getDb();
  
  const fields: string[] = [];
  const values: (string | null | number)[] = [];
  
  if (input.restaurant_id !== undefined) {
    fields.push('restaurant_id = ?');
    values.push(input.restaurant_id);
  }
  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push('description = ?');
    values.push(input.description || null);
  }
  if (input.price_pyg !== undefined) {
    fields.push('price_pyg = ?');
    values.push(input.price_pyg);
  }
  if (input.category !== undefined) {
    fields.push('category = ?');
    values.push(input.category);
  }
  
  if (fields.length === 0) {
    return await getMenuItemById(id);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.run(
    `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return await getMenuItemById(id);
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
        [item.restaurant_id, item.name, item.description || null, item.price_pyg, item.category]
      );
      inserted++;
    } catch (err) {
      console.error('Failed to insert item:', item, err);
    }
  }
  
  return inserted;
}
