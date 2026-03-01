import { getDatabase } from '../db/database';
import { Restaurant, RestaurantInput } from '../types';

export class RestaurantModel {
  static async create(input: RestaurantInput): Promise<Restaurant | undefined> {
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO restaurants (name, address, zone, phone, hours, cuisine_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.name, input.address, input.zone, input.phone || null, input.hours || null, input.cuisine_type]
    );
    return this.findById(result.lastID!);
  }

  static async findById(id: number): Promise<Restaurant | undefined> {
    const db = await getDatabase();
    return db.get<Restaurant>('SELECT * FROM restaurants WHERE id = ?', id);
  }

  static async findAll(): Promise<Restaurant[]> {
    const db = await getDatabase();
    return db.all<Restaurant[]>('SELECT * FROM restaurants ORDER BY name');
  }

  static async findByZone(zone: string): Promise<Restaurant[]> {
    const db = await getDatabase();
    return db.all<Restaurant[]>('SELECT * FROM restaurants WHERE zone = ? ORDER BY name', zone);
  }

  static async findByCuisineType(cuisineType: string): Promise<Restaurant[]> {
    const db = await getDatabase();
    return db.all<Restaurant[]>('SELECT * FROM restaurants WHERE cuisine_type = ? ORDER BY name', cuisineType);
  }

  static async searchByName(name: string): Promise<Restaurant[]> {
    const db = await getDatabase();
    return db.all<Restaurant[]>(
      'SELECT * FROM restaurants WHERE name LIKE ? ORDER BY name',
      `%${name}%`
    );
  }

  static async update(id: number, input: Partial<RestaurantInput>): Promise<Restaurant | undefined> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

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
      return this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.run(
      `UPDATE restaurants SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.run('DELETE FROM restaurants WHERE id = ?', id);
    return (result.changes || 0) > 0;
  }
}
