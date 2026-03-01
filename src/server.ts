import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb, getDb } from './db';
import restaurantRoutes from './routes/restaurants';
import menuItemRoutes from './routes/menuItems';
import importRoutes from './routes/import';

const PORT = process.env.PORT || 5584;

async function main() {
  await initDb();
  console.log('Database initialized');

  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.static(path.join(__dirname, '../dist/client')));

  // Search endpoint with fuzzy matching
  app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    const db = getDb();
    
    // Create search pattern for fuzzy matching
    const searchPattern = `%${q}%`;
    
    const results = await db.all(`
      SELECT 
        mi.id as menu_item_id,
        mi.name as dish_name,
        mi.description,
        mi.price_pyg as price,
        mi.category,
        r.id as restaurant_id,
        r.name as restaurant_name,
        r.cuisine_type,
        r.address,
        r.zone,
        r.phone,
        r.hours,
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
      ORDER BY relevance_score DESC, mi.price_pyg ASC
      LIMIT 50
    `, [q, `${q}%`, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]);
    
    res.json({
      query: q,
      count: results.length,
      results
    });
  });

  // Get single restaurant with menu
  app.get('/api/restaurants/:id', async (req, res) => {
    const db = getDb();
    
    const restaurant = await db.get('SELECT * FROM restaurants WHERE id = ?', req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const menuItems = await db.all(
      'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name',
      req.params.id
    );
    
    res.json({
      ...restaurant,
      menu_items: menuItems
    });
  });

  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/menu-items', menuItemRoutes);
  app.use('/api/import', importRoutes);

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    console.log(`Search page: http://localhost:${PORT}/`);
  });
}

main().catch(console.error);
