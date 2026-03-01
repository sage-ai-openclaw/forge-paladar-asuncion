import { Router } from 'express';
import {
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../db';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const item = await getMenuItemById(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

router.post('/', async (req, res) => {
  try {
    const item = await createMenuItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await updateMenuItem(Number(req.params.id), req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteMenuItem(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
