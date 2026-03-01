const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5584;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize database
const db = new Database(path.join(dataDir, 'paladar.db'));

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    zone TEXT,
    phone TEXT,
    cuisine_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
  );

  CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
  CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
  CREATE INDEX IF NOT EXISTS idx_restaurants_zone ON restaurants(zone);
  CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);
`);

app.use(express.json());
app.use(express.static('public'));

// Search API with fuzzy matching
app.get('/api/search', (req, res) => {
  const { q, zone, cuisine, minPrice, maxPrice } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.json({ results: [], total: 0 });
  }

  const searchTerm = q.trim().toLowerCase();
  const searchPattern = `%${searchTerm}%`;
  
  // Build query with relevance scoring
  let query = `
    SELECT 
      mi.id as menu_item_id,
      mi.name as dish_name,
      mi.description,
      mi.price,
      mi.category,
      r.id as restaurant_id,
      r.name as restaurant_name,
      r.address,
      r.zone,
      r.phone,
      r.cuisine_type,
      CASE 
        WHEN LOWER(mi.name) = ? THEN 100
        WHEN LOWER(mi.name) LIKE ? THEN 80
        WHEN LOWER(mi.name) LIKE ? THEN 60
        WHEN LOWER(mi.description) LIKE ? THEN 40
        ELSE 20
      END as relevance
    FROM menu_items mi
    JOIN restaurants r ON mi.restaurant_id = r.id
    WHERE (
      LOWER(mi.name) LIKE ? OR
      LOWER(mi.description) LIKE ?
    )
  `;

  const params = [
    searchTerm,           // exact match
    `${searchTerm} %`,    // starts with
    `% ${searchTerm} %`,  // contains as word
    searchPattern,        // description match
    searchPattern,        // WHERE clause
    searchPattern         // WHERE clause
  ];

  // Add filters
  if (zone) {
    query += ` AND LOWER(r.zone) = LOWER(?)`;
    params.push(zone);
  }

  if (cuisine) {
    query += ` AND LOWER(r.cuisine_type) = LOWER(?)`;
    params.push(cuisine);
  }

  if (minPrice) {
    query += ` AND mi.price >= ?`;
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    query += ` AND mi.price <= ?`;
    params.push(parseFloat(maxPrice));
  }

  query += ` ORDER BY relevance DESC, mi.price ASC`;

  try {
    const stmt = db.prepare(query);
    const results = stmt.all(...params);
    
    // Group by restaurant for better UX
    const grouped = results.reduce((acc, item) => {
      const key = item.restaurant_id;
      if (!acc[key]) {
        acc[key] = {
          restaurant: {
            id: item.restaurant_id,
            name: item.restaurant_name,
            address: item.address,
            zone: item.zone,
            phone: item.phone,
            cuisine_type: item.cuisine_type
          },
          dishes: []
        };
      }
      acc[key].dishes.push({
        id: item.menu_item_id,
        name: item.dish_name,
        description: item.description,
        price: item.price,
        category: item.category,
        relevance: item.relevance
      });
      return acc;
    }, {});

    res.json({
      results: Object.values(grouped),
      total: results.length,
      query: q
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all zones
app.get('/api/zones', (req, res) => {
  const stmt = db.prepare('SELECT DISTINCT zone FROM restaurants WHERE zone IS NOT NULL ORDER BY zone');
  const zones = stmt.all().map(r => r.zone);
  res.json(zones);
});

// Get all cuisine types
app.get('/api/cuisines', (req, res) => {
  const stmt = db.prepare('SELECT DISTINCT cuisine_type FROM restaurants WHERE cuisine_type IS NOT NULL ORDER BY cuisine_type');
  const cuisines = stmt.all().map(r => r.cuisine_type);
  res.json(cuisines);
});

// Admin: Add restaurant
app.post('/api/admin/restaurants', (req, res) => {
  const { name, address, zone, phone, cuisine_type } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO restaurants (name, address, zone, phone, cuisine_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, address, zone, phone, cuisine_type);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add menu item
app.post('/api/admin/menu-items', (req, res) => {
  const { restaurant_id, name, description, price, category } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO menu_items (restaurant_id, name, description, price, category)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(restaurant_id, name, description, price, category);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all restaurants
app.get('/api/admin/restaurants', (req, res) => {
  const stmt = db.prepare('SELECT * FROM restaurants ORDER BY name');
  res.json(stmt.all());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paladar Asuncion server running on port ${PORT}`);
});
