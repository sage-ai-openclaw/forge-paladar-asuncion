const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5584;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new Database('./data/paladar.db');

// Initialize database tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine_type TEXT,
    zone TEXT,
    address TEXT,
    phone TEXT,
    hours TEXT,
    lat REAL,
    lng REAL,
    price_range_min INTEGER,
    price_range_max INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER,
    category TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
  );
`);

// API Routes

// Get all restaurants with filters
app.get('/api/restaurants', (req, res) => {
  const { q, cuisine, zone, minPrice, maxPrice } = req.query;
  
  let sql = 'SELECT * FROM restaurants WHERE 1=1';
  const params = [];
  
  if (q) {
    sql += ' AND (name LIKE ? OR id IN (SELECT restaurant_id FROM menu_items WHERE name LIKE ?))';
    params.push(`%${q}%`, `%${q}%`);
  }
  
  if (cuisine) {
    sql += ' AND cuisine_type = ?';
    params.push(cuisine);
  }
  
  if (zone) {
    sql += ' AND zone = ?';
    params.push(zone);
  }
  
  if (minPrice) {
    sql += ' AND price_range_max >= ?';
    params.push(parseInt(minPrice));
  }
  
  if (maxPrice) {
    sql += ' AND price_range_min <= ?';
    params.push(parseInt(maxPrice));
  }
  
  sql += ' ORDER BY name';
  
  const restaurants = db.prepare(sql).all(...params);
  res.json(restaurants);
});

// Get restaurant by ID with full menu
app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
  
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  
  const menuItems = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name').all(req.params.id);
  
  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  
  res.json({
    ...restaurant,
    menu: menuByCategory
  });
});

// Create restaurant (admin)
app.post('/api/restaurants', (req, res) => {
  const { name, cuisine_type, zone, address, phone, hours, lat, lng, price_range_min, price_range_max } = req.body;
  
  const result = db.prepare(`
    INSERT INTO restaurants (name, cuisine_type, zone, address, phone, hours, lat, lng, price_range_min, price_range_max)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, cuisine_type, zone, address, phone, hours, lat, lng, price_range_min, price_range_max);
  
  res.json({ id: result.lastInsertRowid });
});

// Update restaurant (admin)
app.put('/api/restaurants/:id', (req, res) => {
  const { name, cuisine_type, zone, address, phone, hours, lat, lng, price_range_min, price_range_max } = req.body;
  
  db.prepare(`
    UPDATE restaurants SET name = ?, cuisine_type = ?, zone = ?, address = ?, phone = ?, hours = ?, lat = ?, lng = ?, price_range_min = ?, price_range_max = ?
    WHERE id = ?
  `).run(name, cuisine_type, zone, address, phone, hours, lat, lng, price_range_min, price_range_max, req.params.id);
  
  res.json({ success: true });
});

// Delete restaurant (admin)
app.delete('/api/restaurants/:id', (req, res) => {
  db.prepare('DELETE FROM restaurants WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Add menu item (admin)
app.post('/api/restaurants/:id/menu', (req, res) => {
  const { name, description, price, category } = req.body;
  
  const result = db.prepare(`
    INSERT INTO menu_items (restaurant_id, name, description, price, category)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, name, description, price, category);
  
  res.json({ id: result.lastInsertRowid });
});

// Update menu item (admin)
app.put('/api/menu/:id', (req, res) => {
  const { name, description, price, category } = req.body;
  
  db.prepare(`
    UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?
    WHERE id = ?
  `).run(name, description, price, category, req.params.id);
  
  res.json({ success: true });
});

// Delete menu item (admin)
app.delete('/api/menu/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Get filter options
app.get('/api/filters', (req, res) => {
  const cuisines = db.prepare('SELECT DISTINCT cuisine_type FROM restaurants WHERE cuisine_type IS NOT NULL ORDER BY cuisine_type').all();
  const zones = db.prepare('SELECT DISTINCT zone FROM restaurants WHERE zone IS NOT NULL ORDER BY zone').all();
  
  res.json({
    cuisines: cuisines.map(c => c.cuisine_type),
    zones: zones.map(z => z.zone)
  });
});

// Serve index for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paladar Asuncion server running on port ${PORT}`);
});
