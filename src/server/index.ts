import express from 'express';
import cors from 'cors';
import path from 'path';
import { Database } from 'sqlite3';
import { open } from 'sqlite';

const PORT = 5584;

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database
async function getDb() {
  return open({
    filename: './data/paladar.db',
    driver: Database
  });
}

// Search endpoint with fuzzy matching
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const db = await getDb();
  
  // Create search pattern for fuzzy matching
  const searchPattern = `%${q}%`;
  
  const results = await db.all(`
    SELECT 
      mi.id as menu_item_id,
      mi.name as dish_name,
      mi.description,
      mi.price,
      mi.category,
      r.id as restaurant_id,
      r.name as restaurant_name,
      r.cuisine_type,
      r.address,
      r.zone,
      r.phone,
      r.website,
      CASE 
        WHEN LOWER(mi.name) = LOWER(?) THEN 5
        WHEN LOWER(mi.name) LIKE LOWER(?) THEN 4
        WHEN LOWER(mi.description) LIKE LOWER(?) THEN 3
        WHEN LOWER(r.name) LIKE LOWER(?) THEN 2
        WHEN LOWER(r.cuisine_type) LIKE LOWER(?) THEN 1
        ELSE 0
      END as relevance_score
    FROM menu_items mi
    JOIN restaurants r ON mi.restaurant_id = r.id
    WHERE 
      LOWER(mi.name) LIKE LOWER(?) OR
      LOWER(mi.description) LIKE LOWER(?) OR
      LOWER(r.name) LIKE LOWER(?) OR
      LOWER(r.cuisine_type) LIKE LOWER(?)
    ORDER BY relevance_score DESC, mi.price ASC
    LIMIT 50
  `, [q, `${q}%`, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]);

  await db.close();
  
  res.json({
    query: q,
    count: results.length,
    results
  });
});

// Get single restaurant with menu
app.get('/api/restaurants/:id', async (req, res) => {
  const db = await getDb();
  
  const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', req.params.id);
  
  if (!restaurant) {
    await db.close();
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  
  const menuItems = await db.all(
    'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
    req.params.id
  );
  
  await db.close();
  
  res.json({
    ...restaurant,
    menu_items: menuItems
  });
});

// List all restaurants
app.get('/api/restaurants', async (req, res) => {
  const { zone, cuisine } = req.query;
  
  const db = await getDb();
  
  let query = 'SELECT * FROM restaurants WHERE 1=1';
  const params: any[] = [];
  
  if (zone) {
    query += ' AND zone = ?';
    params.push(zone);
  }
  
  if (cuisine) {
    query += ' AND cuisine_type = ?';
    params.push(cuisine);
  }
  
  query += ' ORDER BY name';
  
  const restaurants = await db.all(query, params);
  await db.close();
  
  res.json(restaurants);
});

// Serve static files in production
app.use(express.static(path.join(__dirname, '../../dist/client')));

app.listen(PORT, () => {
  console.log(`Paladar Asuncion server running on port ${PORT}`);
});
