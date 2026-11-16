import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// GET /country/list
router.get(['/list', '/'], async (req, res) => {
  try {
    const countriesCol = await getCollection('countries');
    const countries = await countriesCol.find({}).sort({ id: 1 }).toArray();
    return res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return res.status(500).json({ message: 'Failed to fetch countries' });
  }
});

// GET /country/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const countriesCol = await getCollection('countries');
    const country = await countriesCol.findOne(toIdFilter(id));
    if (!country) {
      return res.status(404).json({ message: 'Country not found' });
    }
    return res.json(country);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch country' });
  }
});

// POST /country/upload or /country/create
router.post(['/upload', '/create', '/'], async (req, res) => {
  try {
    const countriesCol = await getCollection('countries');
    const nextId = await getNextId('countries');
    const data = req.body || {};

    const newCountry = {
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
      created_at: new Date().toISOString()
    };

    await countriesCol.insertOne(newCountry);
    return res.status(201).json(newCountry);
  } catch (error) {
    console.error('Error creating country:', error);
    return res.status(500).json({ message: 'Failed to create country' });
  }
});

// PATCH /country/upload or /country/:id
router.all(['/upload', '/:id'], async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const id = req.params.id || req.body.country_id || req.body.id;
    if (!id) {
      return res.status(400).json({ message: 'Country ID is required' });
    }

    const countriesCol = await getCollection('countries');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.country_id;

    await countriesCol.updateOne(toIdFilter(id), { $set: updateData });
    const updated = await countriesCol.findOne(toIdFilter(id));
    return res.json(updated || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating country:', error);
    return res.status(500).json({ message: 'Failed to update country' });
  }
});

// DELETE /country/delete/:id
router.delete(['/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const countriesCol = await getCollection('countries');
    const result = await countriesCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Country not found' });
    }
    return res.json({ success: true, message: 'Country deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete country' });
  }
});

export default router;
