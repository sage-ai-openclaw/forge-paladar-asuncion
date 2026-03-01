import express from 'express';
import { getDatabase, closeDatabase } from './db/database';

const app = express();
const PORT = process.env.PORT || 5584;

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.get('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Paladar Asuncion server running on port ${PORT}`);
});
