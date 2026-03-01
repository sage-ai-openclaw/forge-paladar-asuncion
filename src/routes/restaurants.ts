import { Router } from 'express';
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getMenuItemsByRestaurant
} from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const restaurants = await getAllRestaurants();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const restaurant = await getRestaurantById(Number(req.params.id));
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

router.get('/:id/menu-items', async (req, res) => {
  try {
    const items = await getMenuItemsByRestaurant(Number(req.params.id));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

router.post('/', async (req, res) => {
  try {
    const restaurant = await createRestaurant(req.body);
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const restaurant = await updateRestaurant(Number(req.params.id), req.body);
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteRestaurant(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

export default router;
