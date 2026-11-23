import fs from 'fs';
import path from 'path';
import { connectDb, getCollection } from './db.js';

export async function runSeed() {
  const exportDirCandidates = [
    path.resolve(process.cwd(), 'mongodb_export'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../mongodb_export'),
    path.resolve(process.cwd(), '..', 'funfinder-xi', 'mongodb_export'),
  ];
  const exportDir = exportDirCandidates.find(d => fs.existsSync(d));
  console.log('🌱 Starting MongoDB sync and seed verification...');
  await connectDb();

  // 1. Sync exported collections if files exist
  if (exportDir) {
    console.log(`📁 Found export directory at: ${exportDir}`);
    const mapping = [
      { file: 'events.json', col: 'events' },
      { file: 'categories.json', col: 'categories' },
      { file: 'cities.json', col: 'cities' },
      { file: 'sliders.json', col: 'sliders' },
    ];

    for (const item of mapping) {
      const filePath = path.join(exportDir, item.file);
      if (fs.existsSync(filePath)) {
        const col = await getCollection(item.col);
        const count = await col.countDocuments();
        if (count === 0) {
          const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
          const data = JSON.parse(raw);
          if (Array.isArray(data) && data.length > 0) {
            await col.insertMany(data);
            console.log(`  ✅ Imported ${data.length} documents into "${item.col}"`);
          }
        } else {
          console.log(`  ℹ️  "${item.col}" already contains ${count} documents. Skipping import.`);
        }
      }
    }
  }

  // 2. Countries
  const countriesCol = await getCollection('countries');
  if ((await countriesCol.countDocuments()) === 0) {
    await countriesCol.insertMany([
      {
        _id: 1,
        id: 1,
        name: 'Georgia',
        name_en: 'Georgia',
        name_ka: 'საქართველო',
        name_ru: 'Грузия',
        name_hi: 'जॉर्जिया',
        name_ar: 'جورجيا',
        name_he: 'גאורגיה',
        is_active: true
      }
    ]);
    console.log('  ✅ Seeded default countries');
  }

  // 3. Admin / Staff Users
  const usersCol = await getCollection('users');
  if ((await usersCol.countDocuments()) === 0) {
    await usersCol.insertMany([
      {
        _id: 1,
        id: 1,
        firstname: 'Kakhi',
        lastname: 'Kakhidze',
        email: 'admin@funfinder.ge',
        username: 'admin',
        password: 'admin',
        mobile: '+995 555 123 456',
        country: 'Georgia',
        roles: ['admin', 'super_admin'],
        permissions: ['admin', 'super_admin', 'create', 'read', 'update', 'delete', 'manage_users', 'manage_settings'],
        is_active: true,
        is_staff: true,
        is_superuser: true,
        companies: [{ id: 7, name: 'Tbilisi Extreme & Adrenaline' }],
        created_at: new Date().toISOString()
      },
      {
        _id: 2,
        id: 2,
        firstname: 'Support',
        lastname: 'Operator',
        email: 'staff@funfinder.ge',
        username: 'staff',
        password: 'staff',
        mobile: '+995 555 987 654',
        country: 'Georgia',
        roles: ['staff'],
        permissions: ['staff', 'create', 'read', 'update'],
        is_active: true,
        is_staff: true,
        is_superuser: false,
        companies: [{ id: 6, name: 'Gudauri Ski & Paragliding' }],
        created_at: new Date().toISOString()
      }
    ]);
    console.log('  ✅ Seeded admin users');
  }

  // 4. Companies
  const companiesCol = await getCollection('companies');
  if ((await companiesCol.countDocuments()) === 0) {
    const defaultCompanies = [
      { id: 4, name: 'Dusheti Rafting & Outdoor Club', email: 'dusheti@funfinder.ge', phone: '+995 599 001 004', city_id: 4 },
      { id: 5, name: 'Samtskhe Travel & Tours', email: 'samtskhe@funfinder.ge', phone: '+995 599 001 005', city_id: 5 },
      { id: 6, name: 'Gudauri Ski & Paragliding', email: 'gudauri@funfinder.ge', phone: '+995 599 001 006', city_id: 6 },
      { id: 7, name: 'Tbilisi Extreme & Adrenaline', email: 'tbilisi@funfinder.ge', phone: '+995 599 001 007', city_id: 7 },
      { id: 8, name: 'Asureti Horse Riding Club', email: 'asureti@funfinder.ge', phone: '+995 599 001 008', city_id: 8 },
      { id: 9, name: 'Batumi Sea Activities', email: 'batumi@funfinder.ge', phone: '+995 599 001 009', city_id: 2 },
      { id: 10, name: 'Kakheti Wine & Quad Tours', email: 'kakheti@funfinder.ge', phone: '+995 599 001 010', city_id: 10 },
      { id: 11, name: 'Imereti Caving & Canyoning', email: 'imereti@funfinder.ge', phone: '+995 599 001 011', city_id: 11 },
      { id: 12, name: 'Samegrelo Water Adventures', email: 'samegrelo@funfinder.ge', phone: '+995 599 001 012', city_id: 12 },
      { id: 13, name: 'Svaneti Alpine Expeditions', email: 'svaneti@funfinder.ge', phone: '+995 599 001 013', city_id: 13 },
      { id: 14, name: 'Racha Kayaking & Rafting', email: 'racha@funfinder.ge', phone: '+995 599 001 014', city_id: 14 },
      { id: 16, name: 'Kartli Buggy & Offroad', email: 'kartli@funfinder.ge', phone: '+995 599 001 016', city_id: 16 },
      { id: 17, name: 'Rustavi Racing & Drift', email: 'rustavi@funfinder.ge', phone: '+995 599 001 017', city_id: 17 },
      { id: 18, name: 'Mtskheta Quad Tours', email: 'mtskheta@funfinder.ge', phone: '+995 599 001 018', city_id: 18 },
      { id: 19, name: 'Black Sea Yacht Club', email: 'yacht@funfinder.ge', phone: '+995 599 001 019', city_id: 2 },
      { id: 20, name: 'Georgia Helicopter Tours', email: 'heli@funfinder.ge', phone: '+995 599 001 020', city_id: 7 },
      { id: 21, name: 'Kazbegi Trekking Adventures', email: 'kazbegi@funfinder.ge', phone: '+995 599 001 021', city_id: 6 },
      { id: 22, name: 'Airsoft & Paintball Club', email: 'airsoft@funfinder.ge', phone: '+995 599 001 022', city_id: 7 },
      { id: 23, name: 'Drift Rent & Motor Sports', email: 'drift@funfinder.ge', phone: '+995 599 001 023', city_id: 7 }
    ].map(c => ({
      _id: c.id,
      id: c.id,
      company_id: c.id,
      name: c.name,
      description: c.name + ' - Partner provider on Funfinder',
      founded_year: 2022,
      is_verified: true,
      is_active: true,
      email: c.email,
      phone: c.phone,
      ceo: 'Director',
      expires_at: '2028-12-31',
      identity_number: '20' + c.id + '345678',
      address: 'Georgia',
      user_id: 1,
      created_at: new Date().toISOString()
    }));
    await companiesCol.insertMany(defaultCompanies);
    console.log('  ✅ Seeded companies');
  }

  // 5. Orders
  const ordersCol = await getCollection('orders');
  if ((await ordersCol.countDocuments()) === 0) {
    await ordersCol.insertMany([
      {
        _id: 1001,
        id: 1001,
        order_number: 'FF-1001',
        event_id: 78,
        event_name: 'Drift Rent Tbilisi - 1 Hour + Lesson',
        event_title: 'Drift Rent Tbilisi - 1 Hour + Lesson',
        customer_name: 'Giorgi Beridze',
        customer_email: 'giorgi@gmail.com',
        customer_phone: '+995 599 112 233',
        tickets_count: 1,
        total_price: 250,
        status: 'paid',
        payment_method: 'Card',
        created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        _id: 1002,
        id: 1002,
        order_number: 'FF-1002',
        event_id: 76,
        event_name: 'Extreme Rafting Experience',
        event_title: 'Extreme Rafting Experience',
        customer_name: 'David Kalandadze',
        customer_email: 'david@yahoo.com',
        customer_phone: '+995 598 445 566',
        tickets_count: 2,
        total_price: 180,
        status: 'paid',
        payment_method: 'Card',
        created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
      },
      {
        _id: 1003,
        id: 1003,
        order_number: 'FF-1003',
        event_id: 65,
        event_name: 'Tandem Paragliding Gudauri',
        event_title: 'Tandem Paragliding Gudauri',
        customer_name: 'Nino Gelashvili',
        customer_email: 'nino@gmail.com',
        customer_phone: '+995 577 778 899',
        tickets_count: 1,
        total_price: 300,
        status: 'pending',
        payment_method: 'Pending',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ]);
    console.log('  ✅ Seeded orders');
  }

  console.log('🎉 Seed & verification complete!');
  return true;
}

if (process.argv[1]?.endsWith('seed.js')) {
  runSeed().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
