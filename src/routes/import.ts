import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { bulkImportMenuItems } from '../db';
import { MenuItemInput } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/menu-items', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const items: MenuItemInput[] = records.map((record: any) => ({
      restaurant_id: parseInt(record.restaurant_id),
      name: record.name,
      description: record.description || undefined,
      price_pyg: parseInt(record.price_pyg),
      category: record.category || undefined
    }));

    const inserted = await bulkImportMenuItems(items);
    
    res.json({
      message: `Successfully imported ${inserted} of ${items.length} items`,
      total: items.length,
      inserted
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import menu items' });
  }
});

export default router;
