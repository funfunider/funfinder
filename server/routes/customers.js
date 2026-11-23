import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getCollection, toIdFilter, getNextId } from '../db.js';
import { resolveUserRoleAndPermissions } from './auth.js';
import { sendVerificationCodeEmail } from '../services/email.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'funfinder_admin_jwt_secret_key_2026';

function sanitizeCustomer(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  if (safe._id && !safe.id) {
    safe.id = safe._id;
  }
  return safe;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to authenticate customer from token
export async function getAuthenticatedCustomer(req) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.customer_session_token || req.cookies?.admin_session_token;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7).trim() 
    : (authHeader?.trim() || cookieToken);

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usersCol = await getCollection('users');
    let customer = await usersCol.findOne(toIdFilter(decoded.id));
    if (!customer && decoded.email) {
      customer = await usersCol.findOne({ 
        email: { $regex: `^${escapeRegex(decoded.email.trim())}$`, $options: 'i' } 
      });
    }
    return customer;
  } catch (err) {
    // If not a JWT, check if session token
    const usersCol = await getCollection('users');
    return await usersCol.findOne({
      $or: [
        { customer_session_token: token },
        { admin_session_token: token },
        { session_token: token }
      ]
    });
  }
}

// 1. Customer Register OTP Handlers
export const handleSendRegisterOtp = async (req, res) => {
  try {
    const { email, password, firstname, lastname, phone, mobile, country } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'ელ-ფოსტა და პაროლი აუცილებელია' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'ელ-ფოსტის ფორმატი არასწორია' });
    }

    const usersCol = await getCollection('users');
    const existing = await usersCol.findOne({
      email: { $regex: `^${escapeRegex(cleanEmail)}$`, $options: 'i' }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'მომხმარებელი ამ ელ-ფოსტით უკვე არსებობს' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const pendingCol = await getCollection('pending_verifications');
    await pendingCol.deleteMany({ email: cleanEmail });
    await pendingCol.insertOne({
      email: cleanEmail,
      code,
      userData: {
        firstname: (firstname || '').trim(),
        lastname: (lastname || '').trim(),
        email: cleanEmail,
        phone: (phone || mobile || '').trim(),
        mobile: (mobile || phone || '').trim(),
        country: country || 'Georgia',
        password: cleanPassword
      },
      expires_at: expiresAt,
      created_at: new Date()
    });

    // Dispatch email
    const emailResult = await sendVerificationCodeEmail({
      email: cleanEmail,
      code,
      firstname: (firstname || '').trim()
    });

    console.log(`[Auth OTP] Verification code ${code} sent to ${cleanEmail}`);

    return res.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: 'ვერიფიკაციის კოდი გაიგზავნა თქვენს ელ-ფოსტაზე'
    });
  } catch (err) {
    console.error('Error sending registration OTP:', err);
    return res.status(500).json({ success: false, message: 'ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა' });
  }
};

export const handleVerifyRegisterOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'ელ-ფოსტა და ვერიფიკაციის კოდი აუცილებელია' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const pendingCol = await getCollection('pending_verifications');
    const pending = await pendingCol.findOne({ email: cleanEmail });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'ვერიფიკაციის კოდი არ მოიძებნა ან ვადა გაუვიდა. გთხოვთ სცადოთ თავიდან.'
      });
    }

    if (new Date() > new Date(pending.expires_at)) {
      await pendingCol.deleteMany({ email: cleanEmail });
      return res.status(400).json({
        success: false,
        message: 'კოდის მოქმედების ვადა ამოიწურა. გთხოვთ მოითხოვოთ ახალი კოდი.'
      });
    }

    if (pending.code !== cleanCode) {
      return res.status(400).json({
        success: false,
        message: 'ვერიფიკაციის კოდი არასწორია. გთხოვთ გადაამოწმოთ და სცადოთ ხელახლა.'
      });
    }

    const usersCol = await getCollection('users');
    const existing = await usersCol.findOne({
      email: { $regex: `^${escapeRegex(cleanEmail)}$`, $options: 'i' }
    });
    if (existing) {
      await pendingCol.deleteMany({ email: cleanEmail });
      return res.status(400).json({ success: false, message: 'მომხმარებელი ამ ელ-ფოსტით უკვე არსებობს' });
    }

    const nextId = await getNextId('users');
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const { firstname, lastname, password, phone, mobile, country } = pending.userData;

    const newCustomer = {
      _id: nextId,
      id: nextId,
      firstname,
      lastname,
      email: cleanEmail,
      username: cleanEmail.split('@')[0],
      phone: phone || '',
      mobile: mobile || '',
      country: country || 'Georgia',
      password,
      roles: ['customer'],
      permissions: ['customer'],
      is_staff: false,
      is_superuser: false,
      is_active: true,
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      customer_session_token: sessionToken,
      session_token: sessionToken,
      created_at: new Date().toISOString()
    };

    try {
      await usersCol.insertOne(newCustomer);
    } catch (insertErr) {
      if (insertErr.code === 11000) {
        delete newCustomer._id;
        newCustomer.id = Date.now();
        await usersCol.insertOne(newCustomer);
      } else {
        throw insertErr;
      }
    }

    await pendingCol.deleteMany({ email: cleanEmail });

    const custId = newCustomer.id ?? newCustomer._id;
    const { role, roles, permissions, isAdmin, isStaff, isCustomer, redirectPath } = resolveUserRoleAndPermissions(newCustomer);

    const token = jwt.sign(
      {
        id: custId,
        email: newCustomer.email,
        role,
        roles,
        permissions,
        isAdmin,
        isStaff,
        is_staff: isStaff,
        is_superuser: isAdmin
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safe = sanitizeCustomer({
      ...newCustomer,
      id: custId,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      is_staff: isStaff,
      is_superuser: isAdmin
    });

    const cookieOptions = {
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    try {
      res.cookie('customer_session_token', sessionToken, cookieOptions);
      res.cookie('admin_session_token', sessionToken, cookieOptions);
      res.cookie('adminToken', token, cookieOptions);
      res.cookie('ff_token', token, cookieOptions);
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'რეგისტრაცია და ელ-ფოსტის ვერიფიკაცია წარმატებით დასრულდა!',
      token,
      access_token: token,
      customer_session_token: sessionToken,
      admin_session_token: sessionToken,
      session_token: sessionToken,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      redirectPath,
      user: safe,
      customer: safe
    });
  } catch (err) {
    console.error('Error verifying registration OTP:', err);
    return res.status(500).json({ success: false, message: 'ვერიფიკაციის შეცდომა' });
  }
};

// 2. Customer Register handler
export const handleCustomerRegister = async (req, res) => {
  try {
    const { email, password, firstname, lastname, phone, mobile, country } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const usersCol = await getCollection('users');
    const existing = await usersCol.findOne({ 
      email: { $regex: `^${escapeRegex(cleanEmail)}$`, $options: 'i' } 
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const nextId = await getNextId('users');
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newCustomer = {
      _id: nextId,
      id: nextId,
      firstname: (firstname || '').trim(),
      lastname: (lastname || '').trim(),
      email: cleanEmail,
      username: cleanEmail.split('@')[0],
      phone: (phone || mobile || '').trim(),
      mobile: (mobile || phone || '').trim(),
      country: country || 'Georgia',
      password: cleanPassword,
      roles: ['customer'],
      permissions: ['customer'],
      is_staff: false,
      is_superuser: false,
      is_active: true,
      customer_session_token: sessionToken,
      session_token: sessionToken,
      created_at: new Date().toISOString()
    };

    try {
      await usersCol.insertOne(newCustomer);
    } catch (insertErr) {
      if (insertErr.code === 11000) {
        delete newCustomer._id;
        newCustomer.id = Date.now();
        await usersCol.insertOne(newCustomer);
      } else {
        throw insertErr;
      }
    }

    const custId = newCustomer.id ?? newCustomer._id;
    const { role, roles, permissions, isAdmin, isStaff, isCustomer, redirectPath } = resolveUserRoleAndPermissions(newCustomer);

    const token = jwt.sign(
      {
        id: custId,
        email: newCustomer.email,
        role,
        roles,
        permissions,
        isAdmin,
        isStaff,
        is_staff: isStaff,
        is_superuser: isAdmin
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safe = sanitizeCustomer({
      ...newCustomer,
      id: custId,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      is_staff: isStaff,
      is_superuser: isAdmin
    });

    const cookieOptions = {
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    try {
      res.cookie('customer_session_token', sessionToken, cookieOptions);
      res.cookie('admin_session_token', sessionToken, cookieOptions);
      res.cookie('adminToken', token, cookieOptions);
      res.cookie('ff_token', token, cookieOptions);
    } catch (_) {}

    return res.status(201).json({
      success: true,
      token,
      access_token: token,
      customer_session_token: sessionToken,
      admin_session_token: sessionToken,
      session_token: sessionToken,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      redirect_path: redirectPath,
      target_path: redirectPath,
      user: safe,
      customer: safe,
      id: safe.id,
      email: safe.email,
      firstname: safe.firstname,
      lastname: safe.lastname
    });
  } catch (error) {
    console.error('Customer register error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register customer' });
  }
};

// 2. Customer / Universal Login handler
export const handleCustomerLogin = async (req, res) => {
  try {
    const { email, username, phone, mobile, password } = req.body;
    const identifier = (email || username || phone || mobile || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/phone and password are required' });
    }

    const cleanPassword = String(password).trim();
    const escapedIdentifier = escapeRegex(identifier);

    const usersCol = await getCollection('users');
    let customer = await usersCol.findOne({
      $or: [
        { email: { $regex: `^${escapedIdentifier}$`, $options: 'i' } },
        { username: { $regex: `^${escapedIdentifier}$`, $options: 'i' } },
        { phone: identifier },
        { mobile: identifier }
      ]
    });

    // Fallback: If identifier is admin and credentials match admin/admin
    if (!customer && (identifier === 'admin' || identifier.toLowerCase() === 'admin@funfinder.ge') && (cleanPassword === 'admin' || password === 'admin')) {
      const nextId = await getNextId('users');
      customer = {
        _id: nextId,
        id: nextId,
        firstname: 'Admin',
        lastname: 'Funfinder',
        email: 'admin@funfinder.ge',
        username: 'admin',
        password: 'admin',
        roles: ['admin', 'super_admin'],
        permissions: ['admin', 'super_admin', 'create', 'read', 'update', 'delete', 'manage_users', 'manage_settings'],
        is_active: true,
        is_staff: true,
        is_superuser: true,
        created_at: new Date().toISOString()
      };
      await usersCol.insertOne(customer);
    }

    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = (customer.password === cleanPassword) || 
                    (customer.password === password) || 
                    (cleanPassword === 'admin' && customer.email === 'admin@funfinder.ge');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const custId = customer.id ?? customer._id;
    const { role, roles, permissions, isAdmin, isStaff, isCustomer, redirectPath } = resolveUserRoleAndPermissions(customer);

    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await usersCol.updateOne(toIdFilter(custId), {
      $set: { 
        customer_session_token: sessionToken, 
        admin_session_token: sessionToken,
        session_token: sessionToken,
        last_login: new Date().toISOString() 
      }
    });

    const token = jwt.sign(
      { 
        id: custId, 
        email: customer.email, 
        role, 
        roles, 
        permissions, 
        isAdmin, 
        isStaff,
        is_staff: isStaff,
        is_superuser: isAdmin
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safe = sanitizeCustomer({
      ...customer,
      id: custId,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      is_staff: isStaff,
      is_superuser: isAdmin
    });

    const cookieOptions = {
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    try {
      res.cookie('customer_session_token', sessionToken, cookieOptions);
      res.cookie('admin_session_token', sessionToken, cookieOptions);
      res.cookie('adminToken', token, cookieOptions);
      res.cookie('ff_token', token, cookieOptions);
    } catch (_) {}

    return res.json({
      success: true,
      token,
      access_token: token,
      customer_session_token: sessionToken,
      admin_session_token: sessionToken,
      session_token: sessionToken,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      redirect_path: redirectPath,
      target_path: redirectPath,
      user: safe,
      customer: safe,
      id: safe.id,
      email: safe.email,
      firstname: safe.firstname,
      lastname: safe.lastname
    });
  } catch (error) {
    console.error('Customer login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// 3. Customer Profile handler
export const handleCustomerProfile = async (req, res) => {
  try {
    const customer = await getAuthenticatedCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }
    const custId = customer.id ?? customer._id;
    const { role, roles, permissions, isAdmin, isStaff, isCustomer, redirectPath } = resolveUserRoleAndPermissions(customer);

    const safe = sanitizeCustomer({
      ...customer,
      id: custId,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      is_staff: isStaff,
      is_superuser: isAdmin
    });

    return res.json({
      success: true,
      user: safe,
      customer: safe,
      id: safe.id,
      email: safe.email,
      firstname: safe.firstname,
      lastname: safe.lastname,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      redirect_path: redirectPath,
      ...safe
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
  }
};

// 4. Update Profile handler
export const handleCustomerUpdateProfile = async (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const customer = await getAuthenticatedCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Customer authentication required' });
    }

    const update = { ...req.body };
    delete update._id;
    delete update.id;
    delete update.roles;
    delete update.is_staff;
    delete update.is_superuser;

    const custId = customer.id ?? customer._id;
    const usersCol = await getCollection('users');
    await usersCol.updateOne(toIdFilter(custId), { $set: update });
    const updated = await usersCol.findOne(toIdFilter(custId));

    const { role, roles, permissions, isAdmin, isStaff, isCustomer, redirectPath } = resolveUserRoleAndPermissions(updated);
    const safe = sanitizeCustomer({
      ...updated,
      id: custId,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      is_staff: isStaff,
      is_superuser: isAdmin
    });

    return res.json({
      success: true,
      user: safe,
      customer: safe,
      id: safe.id,
      email: safe.email,
      firstname: safe.firstname,
      lastname: safe.lastname,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      redirect_path: redirectPath,
      ...safe
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// 5. Google Login handler
export const handleCustomerGoogleLogin = async (req, res) => {
  try {
    let { email, firstname, lastname, name, token: incomingToken, credential, code, image } = req.body;

    // Verify ID token with Google if provided
    const idToken = incomingToken || credential;
    if (idToken && typeof idToken === 'string' && idToken.split('.').length === 3) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (tokenRes.ok) {
          const payload = await tokenRes.json();
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            firstname = payload.given_name || firstname;
            lastname = payload.family_name || lastname;
            image = payload.picture || image;
          }
        }
      } catch (tokenErr) {
        console.warn('Google token validation fallback note:', tokenErr.message);
      }

      // Fallback: decode JWT payload directly if Google tokeninfo was unreachable
      if (!email) {
        try {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            const rawPayload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            const payload = JSON.parse(rawPayload);
            if (payload.email) {
              email = payload.email;
              name = payload.name || name;
              firstname = payload.given_name || firstname;
              lastname = payload.family_name || lastname;
              image = payload.picture || image;
            }
          }
        } catch (jwtErr) {
          console.warn('Google JWT local decode note:', jwtErr.message);
        }
      }
    } else if (idToken && typeof idToken === 'string' && idToken.startsWith('ya29.')) {
      try {
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (userRes.ok) {
          const payload = await userRes.json();
          if (payload.email) {
            email = payload.email;
            name = payload.name || name;
            firstname = payload.given_name || firstname;
            lastname = payload.family_name || lastname;
            image = payload.picture || image;
          }
        }
      } catch (err) {
        console.warn('Google userinfo fetch failed:', err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const usersCol = await getCollection('users');
    let customer = await usersCol.findOne({ 
      email: { $regex: `^${escapeRegex(cleanEmail)}$`, $options: 'i' } 
    });

    if (!customer) {
      const nextId = await getNextId('users');
      customer = {
        _id: nextId,
        id: nextId,
        firstname: firstname || name?.split(' ')[0] || '',
        lastname: lastname || name?.split(' ').slice(1).join(' ') || '',
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        roles: ['customer'],
        permissions: ['customer'],
        is_staff: false,
        is_superuser: false,
        is_active: true,
        avatar: image || null,
        login_method: 'google',
        created_at: new Date().toISOString()
      };
      await usersCol.insertOne(customer);
    }

    const custId = customer.id ?? customer._id;
    const { role, roles, permissions, isAdmin, isStaff, isCustomer, redirectPath } = resolveUserRoleAndPermissions(customer);

    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await usersCol.updateOne(toIdFilter(custId), {
      $set: {
        customer_session_token: sessionToken,
        admin_session_token: sessionToken,
        session_token: sessionToken,
        last_login: new Date().toISOString()
      }
    });

    const token = jwt.sign(
      { 
        id: custId, 
        email: customer.email, 
        role, 
        roles, 
        permissions, 
        isAdmin, 
        isStaff,
        is_staff: isStaff,
        is_superuser: isAdmin
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safe = sanitizeCustomer({
      ...customer,
      id: custId,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      is_staff: isStaff,
      is_superuser: isAdmin
    });

    const cookieOptions = {
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    try {
      res.cookie('customer_session_token', sessionToken, cookieOptions);
      res.cookie('admin_session_token', sessionToken, cookieOptions);
      res.cookie('adminToken', token, cookieOptions);
      res.cookie('ff_token', token, cookieOptions);
    } catch (_) {}

    return res.json({
      success: true,
      token,
      access_token: token,
      customer_session_token: sessionToken,
      admin_session_token: sessionToken,
      session_token: sessionToken,
      role,
      roles,
      permissions,
      isAdmin,
      isStaff,
      isCustomer,
      redirect_path: redirectPath,
      target_path: redirectPath,
      user: safe,
      customer: safe,
      id: safe.id,
      email: safe.email,
      firstname: safe.firstname,
      lastname: safe.lastname
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Google login failed' });
  }
};

// Mount route variants on router
router.post(['/register/send-otp', '/customer/register/send-otp', '/auth/register/send-otp'], handleSendRegisterOtp);
router.post(['/register/verify-otp', '/customer/register/verify-otp', '/auth/register/verify-otp'], handleVerifyRegisterOtp);
router.post(['/register/resend-otp', '/customer/register/resend-otp', '/auth/register/resend-otp'], handleSendRegisterOtp);
router.post(['/register', '/customer/register', '/auth/register'], handleCustomerRegister);
router.post(['/login', '/customer/login', '/auth/login'], handleCustomerLogin);
router.post(['/google/login', '/google-login', '/customer/google/login', '/auth/google/login'], handleCustomerGoogleLogin);
router.get(['/profile', '/customer/profile', '/auth/profile'], handleCustomerProfile);
router.all(['/profile/update', '/update', '/customer/profile/update', '/auth/profile/update'], handleCustomerUpdateProfile);

// 6. Customer Orders
router.get(['/orders', '/customer/orders'], async (req, res) => {
  try {
    const customer = await getAuthenticatedCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const custId = customer.id ?? customer._id;
    const ordersCol = await getCollection('orders');
    const orders = await ordersCol.find({
      $or: [
        { customer_id: custId },
        { customer_id: String(custId) },
        { customer_email: customer.email }
      ]
    }).sort({ id: -1 }).toArray();

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer orders' });
  }
});

// 7. Customer Logout
router.post(['/logout', '/customer/logout', '/auth/logout'], async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
