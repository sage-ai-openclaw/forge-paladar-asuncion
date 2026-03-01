import fs from 'fs';
import path from 'path';
import { getDatabase, closeDatabase } from './database';

async function initializeDatabase(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = await getDatabase();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const statements = schema.split(';').filter(s => s.trim().length > 0);

  for (const statement of statements) {
    await db.exec(statement + ';');
  }

  console.log('Database initialized successfully');
  await closeDatabase();
}

initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
