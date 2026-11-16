import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// GET /category/all or /category/list
router.get(['/all', '/all/', '/list', '/list/', '/'], async (req, res) => {
  try {
    const categoriesCol = await getCollection('categories');
    const categories = await categoriesCol.find({}).sort({ order: 1, id: 1 }).toArray();
    return res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// GET /category/company-category & /services/companycategory/list
router.get(['/company-category', '/company/feed/:categoryId'], async (req, res) => {
  try {
    const relCol = await getCollection('company_categories');
    const rels = await relCol.find({}).toArray();
    return res.json(rels);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch relationships' });
  }
});

// GET /category/company/:companyId/list & admin variant
router.get(['/company/:companyId/list', '/admin/company/:companyId/list'], async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const relCol = await getCollection('company_categories');
    const rels = await relCol.find({ company_id: companyId }).toArray();
    const categoryIds = rels.map(r => r.category_id);

    const categoriesCol = await getCollection('categories');
    const categories = await categoriesCol.find({
      $or: [
        { id: { $in: categoryIds } },
        { _id: { $in: categoryIds } }
      ]
    }).toArray();

    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch company categories' });
  }
});

// POST /category/company-category (Link)
router.post('/company-category', async (req, res) => {
  try {
    const { company_id, category_id } = req.body;
    const cid = parseInt(company_id, 10);
    const catid = parseInt(category_id, 10);

    const relCol = await getCollection('company_categories');
    await relCol.updateOne(
      { company_id: cid, category_id: catid },
      { $set: { company_id: cid, category_id: catid, created_at: new Date().toISOString() } },
      { upsert: true }
    );
    return res.json({ success: true, message: 'Category linked to company' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to link category' });
  }
});

// DELETE /category/company-category (Unlink)
router.delete('/company-category', async (req, res) => {
  try {
    const { company_id, category_id } = req.body;
    const cid = parseInt(company_id, 10);
    const catid = parseInt(category_id, 10);

    const relCol = await getCollection('company_categories');
    await relCol.deleteOne({ company_id: cid, category_id: catid });
    return res.json({ success: true, message: 'Category unlinked from company' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to unlink category' });
  }
});

// GET /category/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoriesCol = await getCollection('categories');
    const category = await categoriesCol.findOne(toIdFilter(id));
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch category' });
  }
});

// POST /category/upload or /category/create
router.post(['/upload', '/create', '/'], async (req, res) => {
  try {
    const categoriesCol = await getCollection('categories');
    const nextId = await getNextId('categories');
    const data = req.body || {};

    const newCategory = {
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
      activity: data.activity || 'land',
      color: data.color || '#16A34A',
      icon: data.icon || 'Category',
      order: parseInt(data.order, 10) || 0,
      events_count: 0,
      description: data.description || '',
      description_ka: data.description_ka || '',
      description_en: data.description_en || data.description || '',
      created_at: new Date().toISOString()
    };

    await categoriesCol.insertOne(newCategory);
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Failed to create category' });
  }
});

// PATCH /category/upload or /category/:id
router.all(['/upload', '/:id'], async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const id = req.params.id || req.body.category_id || req.body.id;
    if (!id) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const categoriesCol = await getCollection('categories');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.category_id;

    if (updateData.order !== undefined) {
      updateData.order = parseInt(updateData.order, 10);
    }

    await categoriesCol.updateOne(toIdFilter(id), { $set: updateData });
    const updated = await categoriesCol.findOne(toIdFilter(id));
    return res.json(updated || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Failed to update category' });
  }
});

// DELETE /category/delete/:id or /category/:id
router.delete(['/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const categoriesCol = await getCollection('categories');
    const result = await categoriesCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete category' });
  }
});

export default router;
