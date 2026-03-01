import { getDatabase } from '../db/database';
import { MenuItem, MenuItemInput } from '../types';

export class MenuItemModel {
  static async create(input: MenuItemInput): Promise<MenuItem> {
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO menu_items (name, description, price_pyg, category, restaurant_id)
       VALUES (?, ?, ?, ?, ?)`,
      [input.name, input.description || null, input.price_pyg, input.category, input.restaurant_id]
    );
    return this.findById(result.lastID!);
  }

  static async findById(id: number): Promise<MenuItem | undefined> {
    const db = await getDatabase();
    return db.get<MenuItem>('SELECT * FROM menu_items WHERE id = ?', id);
  }

  static async findAll(): Promise<MenuItem[]> {
    const db = await getDatabase();
    return db.all<MenuItem[]>('SELECT * FROM menu_items ORDER BY name');
  }

  static async findByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    const db = await getDatabase();
    return db.all<MenuItem[]>(
      'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
      restaurantId
    );
  }

  static async findByCategory(category: string): Promise<MenuItem[]> {
    const db = await getDatabase();
    return db.all<MenuItem[]>('SELECT * FROM menu_items WHERE category = ? ORDER BY name', category);
  }

  static async findByPriceRange(minPrice: number, maxPrice: number): Promise<MenuItem[]> {
    const db = await getDatabase();
    return db.all<MenuItem[]>(
      'SELECT * FROM menu_items WHERE price_pyg BETWEEN ? AND ? ORDER BY price_pyg',
      minPrice,
      maxPrice
    );
  }

  static async searchByName(name: string): Promise<MenuItem[]> {
    const db = await getDatabase();
    return db.all<MenuItem[]>(
      'SELECT * FROM menu_items WHERE name LIKE ? ORDER BY name',
      `%${name}%`
    );
  }

  static async searchWithRestaurant(name: string): Promise<(MenuItem & { restaurant_name: string })[]> {
    const db = await getDatabase();
    return db.all<(MenuItem & { restaurant_name: string })[]>(
      `SELECT mi.*, r.name as restaurant_name 
       FROM menu_items mi
       JOIN restaurants r ON mi.restaurant_id = r.id
       WHERE mi.name LIKE ? 
       ORDER BY mi.name`,
      `%${name}%`
    );
  }

  static async update(id: number, input: Partial<MenuItemInput>): Promise<MenuItem | undefined> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

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
    if (input.restaurant_id !== undefined) {
      fields.push('restaurant_id = ?');
      values.push(input.restaurant_id);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.run(
      `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM menu_items WHERE id = ?', id);
    return (result.changes || 0) > 0;
  }

  static async deleteByRestaurantId(restaurantId: number): Promise<number> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM menu_items WHERE restaurant_id = ?', restaurantId);
    return result.changes || 0;
  }
}
