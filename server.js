const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5584;

app.use(express.json());
app.use(express.static('public'));

const db = new Database('./data/paladar.db');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    zone TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  );

  CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
  CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine);
  CREATE INDEX IF NOT EXISTS idx_restaurants_zone ON restaurants(zone);
  CREATE INDEX IF NOT EXISTS idx_menu_items_price ON menu_items(price);
`);

// API Routes

// Get all cuisines
app.get('/api/cuisines', (req, res) => {
  const cuisines = db.prepare('SELECT DISTINCT cuisine FROM restaurants ORDER BY cuisine').all();
  res.json(cuisines.map(c => c.cuisine));
});

// Get all zones
app.get('/api/zones', (req, res) => {
  const zones = db.prepare('SELECT DISTINCT zone FROM restaurants ORDER BY zone').all();
  res.json(zones.map(z => z.zone));
});

// Get price range
app.get('/api/price-range', (req, res) => {
  const range = db.prepare('SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM menu_items').get();
  res.json(range || { minPrice: 0, maxPrice: 100000 });
});

// Search menu items with filters
app.get('/api/search', (req, res) => {
  const { q, cuisine, zone, minPrice, maxPrice } = req.query;
  
  let whereConditions = ['1=1'];
  const params = [];

  if (q && q.trim()) {
    whereConditions.push('(mi.name LIKE ? OR mi.description LIKE ?)');
    const searchTerm = `%${q.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (cuisine && cuisine !== 'all') {
    whereConditions.push('r.cuisine = ?');
    params.push(cuisine);
  }

  if (zone && zone !== 'all') {
    whereConditions.push('r.zone = ?');
    params.push(zone);
  }

  if (minPrice !== undefined && minPrice !== '') {
    whereConditions.push('mi.price >= ?');
    params.push(parseInt(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    whereConditions.push('mi.price <= ?');
    params.push(parseInt(maxPrice));
  }

  const query = `
    SELECT 
      mi.id,
      mi.name as dishName,
      mi.description,
      mi.price,
      mi.category,
      r.id as restaurantId,
      r.name as restaurantName,
      r.cuisine,
      r.zone,
      r.address
    FROM menu_items mi
    JOIN restaurants r ON mi.restaurant_id = r.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY mi.name
  `;

  try {
    const results = db.prepare(query).all(...params);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all restaurants
app.get('/api/restaurants', (req, res) => {
  const restaurants = db.prepare('SELECT * FROM restaurants ORDER BY name').all();
  res.json(restaurants);
});

// Add restaurant
app.post('/api/restaurants', (req, res) => {
  const { name, cuisine, zone, address, phone } = req.body;
  
  try {
    const result = db.prepare(
      'INSERT INTO restaurants (name, cuisine, zone, address, phone) VALUES (?, ?, ?, ?, ?)'
    ).run(name, cuisine, zone, address, phone);
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add menu item
app.post('/api/menu-items', (req, res) => {
  const { restaurant_id, name, description, price, category } = req.body;
  
  try {
    const result = db.prepare(
      'INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES (?, ?, ?, ?, ?)'
    ).run(restaurant_id, name, description, price, category);
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get menu items for a restaurant
app.get('/api/restaurants/:id/menu', (req, res) => {
  const items = db.prepare(
    'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY name'
  ).all(req.params.id);
  res.json(items);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paladar Asuncion server running on port ${PORT}`);
});
