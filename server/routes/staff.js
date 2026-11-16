import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// Helper to remove sensitive fields
function sanitize(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// GET /staff/list & /users/list & /customer/list
router.get(['/list', '/company/list', '/'], async (req, res) => {
  try {
    const usersCol = await getCollection('users');
    const isCustomer = req.baseUrl.includes('customer');
    const filter = isCustomer ? { is_staff: { $ne: true } } : {};
    const users = await usersCol.find(filter).sort({ id: 1 }).toArray();
    return res.json(users.map(sanitize));
  } catch (error) {
    console.error('Error fetching users/staff:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /staff/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usersCol = await getCollection('users');
    const user = await usersCol.findOne(toIdFilter(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(sanitize(user));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// POST /staff/create
router.post(['/create', '/'], async (req, res) => {
  try {
    const usersCol = await getCollection('users');
    const nextId = await getNextId('users');
    const data = req.body || {};

    const newUser = {
      _id: nextId,
      id: nextId,
      firstname: data.firstname || '',
      lastname: data.lastname || '',
      email: data.email || `user${nextId}@funfinder.ge`,
      username: data.username || data.email?.split('@')[0] || `user${nextId}`,
      mobile: data.mobile || '',
      country: data.country || 'Georgia',
      password: data.password || 'password123',
      roles: data.roles || ['staff'],
      permissions: data.permissions || ['read'],
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      is_staff: true,
      companies: Array.isArray(data.companies) ? data.companies : [],
      created_at: new Date().toISOString()
    };

    await usersCol.insertOne(newUser);
    return res.status(201).json(sanitize(newUser));
  } catch (error) {
    console.error('Error creating staff user:', error);
    return res.status(500).json({ message: 'Failed to create user' });
  }
});

// PUT /staff/update/:id or PATCH /staff/update/:id
router.all(['/update/:id', '/:id'], async (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { id } = req.params;
    const usersCol = await getCollection('users');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (!updateData.password) {
      delete updateData.password;
    }

    await usersCol.updateOne(toIdFilter(id), { $set: updateData });
    const updated = await usersCol.findOne(toIdFilter(id));
    return res.json(sanitize(updated) || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating staff user:', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE /staff/delete/:id
router.delete(['/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const usersCol = await getCollection('users');
    const result = await usersCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
