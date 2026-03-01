import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';
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

  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/menu-items', menuItemRoutes);
  app.use('/api/import', importRoutes);

  app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

main().catch(console.error);
