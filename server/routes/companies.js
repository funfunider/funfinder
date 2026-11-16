import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// GET /staff/company/list & /companies
router.get(['/list', '/company/list', '/'], async (req, res) => {
  try {
    const companiesCol = await getCollection('companies');
    const companies = await companiesCol.find({}).sort({ id: 1 }).toArray();
    return res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ message: 'Failed to fetch companies' });
  }
});

// GET /staff/company/:id
router.get(['/company/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const companiesCol = await getCollection('companies');
    const company = await companiesCol.findOne(toIdFilter(id));
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    return res.json(company);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch company' });
  }
});

// POST /staff/company/create
router.post(['/company/create', '/create', '/'], async (req, res) => {
  try {
    const companiesCol = await getCollection('companies');
    const nextId = await getNextId('companies');
    const data = req.body || {};

    const newCompany = {
      _id: nextId,
      id: nextId,
      company_id: nextId,
      name: data.name || '',
      description: data.description || '',
      founded_year: parseInt(data.founded_year, 10) || new Date().getFullYear(),
      is_verified: data.is_verified !== undefined ? Boolean(data.is_verified) : false,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      email: data.email || '',
      phone: data.phone || '',
      ceo: data.ceo || '',
      expires_at: data.expires_at || '',
      identity_number: data.identity_number || '',
      address: data.address || '',
      user_id: data.user_id || 1,
      staff_ids: [],
      created_at: new Date().toISOString()
    };

    await companiesCol.insertOne(newCompany);
    return res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({ message: 'Failed to create company' });
  }
});

// PATCH /staff/company/update/:id
router.all(['/company/update/:id', '/update/:id', '/:id'], async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { id } = req.params;
    const companiesCol = await getCollection('companies');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (updateData.founded_year !== undefined) {
      updateData.founded_year = parseInt(updateData.founded_year, 10);
    }
    if (updateData.is_verified !== undefined) {
      updateData.is_verified = Boolean(updateData.is_verified);
    }
    if (updateData.is_active !== undefined) {
      updateData.is_active = Boolean(updateData.is_active);
    }

    await companiesCol.updateOne(toIdFilter(id), { $set: updateData });
    const updated = await companiesCol.findOne(toIdFilter(id));
    return res.json(updated || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({ message: 'Failed to update company' });
  }
});

// DELETE /staff/company/delete/:id
router.delete(['/company/delete/:id', '/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const companiesCol = await getCollection('companies');
    const result = await companiesCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    return res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete company' });
  }
});

// POST /staff/company/link/:companyId (Link staff)
router.post(['/company/link/:companyId', '/link/:companyId'], async (req, res) => {
  try {
    const { companyId } = req.params;
    const staffIds = (req.body.staff_ids || []).map(Number);
    const cid = Number(companyId);

    const companiesCol = await getCollection('companies');
    const company = await companiesCol.findOne(toIdFilter(cid));

    const usersCol = await getCollection('users');
    // Add company to users
    if (company) {
      await usersCol.updateMany(
        { id: { $in: staffIds } },
        { $addToSet: { companies: { id: cid, name: company.name } } }
      );
    }

    // Add staff to company
    await companiesCol.updateOne(
      toIdFilter(cid),
      { $addToSet: { staff_ids: { $each: staffIds } } }
    );

    return res.json({ success: true, message: 'Staff linked successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to link staff' });
  }
});

// DELETE /staff/company/link/:companyId (Unlink staff)
router.delete(['/company/link/:companyId', '/link/:companyId'], async (req, res) => {
  try {
    const { companyId } = req.params;
    const body = req.body || {};
    const staffIds = (body.staff_ids || []).map(Number);
    const cid = Number(companyId);

    const usersCol = await getCollection('users');
    await usersCol.updateMany(
      { id: { $in: staffIds } },
      { $pull: { companies: { id: cid } } }
    );

    const companiesCol = await getCollection('companies');
    await companiesCol.updateOne(
      toIdFilter(cid),
      { $pull: { staff_ids: { $in: staffIds } } }
    );

    return res.json({ success: true, message: 'Staff unlinked successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to unlink staff' });
  }
});

export default router;
