import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// GET /city/all or /city/list
router.get(['/all', '/all/', '/list', '/list/', '/'], async (req, res) => {
  try {
    const citiesCol = await getCollection('cities');
    const cities = await citiesCol.find({}).sort({ id: 1 }).toArray();
    return res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return res.status(500).json({ message: 'Failed to fetch cities' });
  }
});

// GET /city/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const citiesCol = await getCollection('cities');
    const city = await citiesCol.findOne(toIdFilter(id));
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    return res.json(city);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch city' });
  }
});

// POST /city/upload or /city/create
router.post(['/upload', '/create', '/'], async (req, res) => {
  try {
    const citiesCol = await getCollection('cities');
    const nextId = await getNextId('cities');
    const data = req.body || {};

    const newCity = {
      _id: nextId,
      id: nextId,
      name: data.name || data.name_en || '',
      name_ka: data.name_ka || data.name || '',
      name_en: data.name_en || data.name || '',
      name_ru: data.name_ru || '',
      name_hi: data.name_hi || '',
      name_ar: data.name_ar || '',
      name_he: data.name_he || '',
      name_tr: data.name_tr || '',
      name_hy: data.name_hy || '',
      name_kk: data.name_kk || '',
      name_uk: data.name_uk || '',
      name_zh: data.name_zh || '',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      population: parseInt(data.population, 10) || 0,
      country: data.country_id || data.country || 1,
      created_at: new Date().toISOString()
    };

    await citiesCol.insertOne(newCity);
    return res.status(201).json(newCity);
  } catch (error) {
    console.error('Error creating city:', error);
    return res.status(500).json({ message: 'Failed to create city' });
  }
});

// PATCH /city/upload or /city/:id
router.all(['/upload', '/:id'], async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const id = req.params.id || req.body.city_id || req.body.id;
    if (!id) {
      return res.status(400).json({ message: 'City ID is required' });
    }

    const citiesCol = await getCollection('cities');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.city_id;

    if (updateData.population !== undefined) {
      updateData.population = parseInt(updateData.population, 10);
    }
    if (updateData.country_id !== undefined) {
      updateData.country = updateData.country_id;
      delete updateData.country_id;
    }

    await citiesCol.updateOne(toIdFilter(id), { $set: updateData });
    const updated = await citiesCol.findOne(toIdFilter(id));
    return res.json(updated || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating city:', error);
    return res.status(500).json({ message: 'Failed to update city' });
  }
});

// DELETE /city/delete/:id
router.delete(['/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const citiesCol = await getCollection('cities');
    const result = await citiesCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'City not found' });
    }
    return res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete city' });
  }
});

export default router;
