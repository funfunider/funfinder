import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webp';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'event-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// GET /event/search?q=
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const showAll = req.query.all === 'true' || req.query.include_inactive === 'true' || req.query.admin === 'true';
    const eventsCol = await getCollection('events');
    const searchFilter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { name_en: { $regex: q, $options: 'i' } },
        { name_ka: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ]
    };
    if (!showAll) {
      searchFilter.is_active = { $ne: false };
    }
    const results = await eventsCol.find(searchFilter).limit(20).toArray();
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Search failed' });
  }
});

// POST /event/price-calculate
router.post('/price-calculate', async (req, res) => {
  try {
    const {
      event_id,
      people_count = 1,
      adults_count = 0,
      children_count = 0,
      infants_count = 0,
      age_prices = [],
      slot_time = null,
      booking_type = null,
      days_count = 1
    } = req.body;

    const eventsCol = await getCollection('events');
    const event = await eventsCol.findOne(toIdFilter(event_id));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let basePrice = 0;
    const hasExplicitCounts = req.body.adults_count !== undefined || req.body.children_count !== undefined;
    const adults = hasExplicitCounts ? (Number(adults_count) || 0) : (Number(children_count) === 0 ? Number(people_count) : 0);
    const children = Number(children_count) || 0;
    const infants = Number(infants_count) || 0;
    const totalPeople = (adults + children + infants) || (hasExplicitCounts ? 0 : (Number(people_count) || 1));

    const effectiveBookingType = booking_type || event.booking_type || 'activity';

    if (effectiveBookingType === 'rental' || effectiveBookingType === 'car_rental') {
      const dailyRate = Number(event.daily_price || event.base_price || event.price_per_person || 90);
      const days = Math.max(1, Number(days_count) || 1);
      basePrice = dailyRate * days;
    } else if (Array.isArray(age_prices) && age_prices.length > 0 && Array.isArray(event.age_prices) && event.age_prices.length > 0) {
      for (const item of age_prices) {
        const ap = event.age_prices.find(a => Number(a.id) === Number(item.age_price_id));
        if (ap) {
          basePrice += (Number(ap.price) || 0) * (Number(item.quantity) || 1);
        }
      }
    } else {
      let adultUnitPrice = Number(event.adult_price || event.discounted_price || event.price_per_person || event.base_price || 0);
      let childUnitPrice = Number(event.child_price !== null && event.child_price !== undefined && event.child_price !== '' ? event.child_price : Math.round(adultUnitPrice * 0.65));
      let infantUnitPrice = Number(event.infant_price !== null && event.infant_price !== undefined && event.infant_price !== '' ? event.infant_price : 0);

      if (slot_time && Array.isArray(event.time_slots) && event.time_slots.length > 0) {
        const matchedSlot = event.time_slots.find(s => (typeof s === 'string' ? s : s.start_time) === slot_time);
        if (matchedSlot && typeof matchedSlot === 'object') {
          if (matchedSlot.price) adultUnitPrice = Number(matchedSlot.price);
          if (matchedSlot.adult_price) adultUnitPrice = Number(matchedSlot.adult_price);
          if (matchedSlot.child_price !== undefined && matchedSlot.child_price !== null && matchedSlot.child_price !== '') {
            childUnitPrice = Number(matchedSlot.child_price);
          }
        }
      } else if (slot_time && event.slots_pricing && event.slots_pricing[slot_time]) {
        const sp = event.slots_pricing[slot_time];
        if (sp.adult || sp.price) adultUnitPrice = Number(sp.adult || sp.price);
        if (sp.child !== undefined && sp.child !== null) childUnitPrice = Number(sp.child);
      }

      basePrice = (adults * adultUnitPrice) + (children * childUnitPrice) + (infants * infantUnitPrice);
    }

    // Check discounts
    let discountAmount = 0;
    let discountInfo = null;
    const discounts = Array.isArray(event.discounts) ? event.discounts : [];
    const now = new Date();
    const activeDiscount = discounts.find(d => {
      if (!d.is_active) return false;
      if (d.start_date && new Date(d.start_date) > now) return false;
      if (d.end_date && new Date(d.end_date) < now) return false;
      return true;
    });

    if (activeDiscount) {
      const val = Number(activeDiscount.discount_value) || 0;
      if (activeDiscount.discount_type === 'percentage') {
        discountAmount = (basePrice * val) / 100;
      } else {
        discountAmount = Math.min(val, basePrice);
      }
      discountInfo = {
        name: activeDiscount.name || 'Special Discount',
        type: activeDiscount.discount_type || 'percentage',
        value: val,
        amount: discountAmount
      };
    }

    const totalPrice = Math.max(0, basePrice - discountAmount);

    return res.json({
      event_id: event.id,
      event_name: event.name || event.name_ka || event.name_en,
      people_count: totalPeople,
      adults_count: adults,
      children_count: children,
      infants_count: infants,
      base_price: Number(basePrice.toFixed(2)),
      discount: discountInfo,
      discount_amount: Number(discountAmount.toFixed(2)),
      total_price: Number(totalPrice.toFixed(2))
    });
  } catch (error) {
    console.error('Price calculation error:', error);
    return res.status(500).json({ message: 'Error calculating price' });
  }
});

// GET /event/company/:companyId/list or /:companyId/list
router.get(['/company/:companyId/list', '/:companyId/list'], async (req, res, next) => {
  const { companyId } = req.params;
  const cid = Number(companyId);
  if (isNaN(cid)) return next();
  try {
    const eventsCol = await getCollection('events');
    const events = await eventsCol.find({
      $or: [{ company: cid }, { company_id: cid }, { 'company.id': cid }]
    }).sort({ id: -1 }).toArray();
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch company events' });
  }
});

// GET /event/nearby or /events/location
router.get(['/nearby', '/nearby/', '/location', '/location/'], async (req, res) => {
  try {
    const showAll = req.query.all === 'true' || req.query.include_inactive === 'true' || req.query.admin === 'true';
    const eventsCol = await getCollection('events');
    const nearbyFilter = showAll ? {} : { is_active: { $ne: false } };
    const events = await eventsCol.find(nearbyFilter).sort({ id: -1 }).toArray();
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      events.sort((a, b) => {
        const distA = Math.hypot((a.latitude || 0) - lat, (a.longitude || 0) - lng);
        const distB = Math.hypot((b.latitude || 0) - lat, (b.longitude || 0) - lng);
        return distA - distB;
      });
    }
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch nearby events' });
  }
});

// GET /event/feed, /event/all, /events/all, etc.
router.get([
  '/feed', '/feed/',
  '/feed/popular', '/feed/popular/',
  '/feed/featured', '/feed/featured/',
  '/feed/discounted', '/feed/discounted/',
  '/all', '/all/',
  '/list', '/list/',
  '/'
], async (req, res) => {
  try {
    const eventsCol = await getCollection('events');
    const filter = {};
    if (req.path.includes('popular')) filter.is_popular = true;
    if (req.path.includes('featured')) filter.is_featured = true;

    // Filter active events for client unless admin/all requested
    const showAll = req.query.all === 'true' || req.query.include_inactive === 'true' || req.query.admin === 'true';
    if (!showAll) {
      filter.is_active = { $ne: false };
    }

    // Filter by category if query param is present
    const categoryParam = req.query.category || req.query.category_id;
    if (categoryParam) {
      const catNum = Number(categoryParam);
      const orClauses = [
        { 'category.name': categoryParam },
        { 'category.name_en': categoryParam },
        { 'category.name_ka': categoryParam }
      ];
      if (!isNaN(catNum)) {
        orClauses.push({ 'category.id': catNum });
        orClauses.push({ category: catNum });
        orClauses.push({ category_id: catNum });
      }
      filter.$or = orClauses;
    }

    const events = await eventsCol.find(filter).sort({ id: -1 }).toArray();
    // Return array directly (supported by Events.jsx and Dashboard.jsx unwrap)
    return res.json(events);
  } catch (error) {
    console.error('Error fetching events feed:', error);
    return res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// GET /event/details/:id or /event/:id
router.get(['/details/:id', '/:id'], async (req, res, next) => {
  const { id } = req.params;
  const skipWords = ['orders', 'feed', 'create', 'list', 'all', 'nearby', 'location', 'search', 'company'];
  if (!id || skipWords.includes(id.toLowerCase())) {
    return next();
  }
  try {
    const eventsCol = await getCollection('events');
    const event = await eventsCol.findOne(toIdFilter(id));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving event details' });
  }
});

// POST /event/create (or /event/admin/event/create)
router.post(['/create', '/admin/event/create'], async (req, res) => {
  try {
    const eventsCol = await getCollection('events');
    const nextId = await getNextId('events');
    const data = req.body || {};

    const normalizedAgePrices = Array.isArray(data.age_prices)
      ? data.age_prices.map((ap, idx) => ({
          id: ap.id || (idx + 1),
          category_name: ap.category_name || ap.name || 'Standard',
          min_age: ap.min_age !== undefined && ap.min_age !== '' ? Number(ap.min_age) : 0,
          max_age: ap.max_age !== undefined && ap.max_age !== '' ? Number(ap.max_age) : 99,
          price: parseFloat(ap.price) || 0,
          start_time: ap.start_time || null,
          end_time: ap.end_time || null
        }))
      : [];

    const newEvent = {
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
      description: data.description || data.description_en || '',
      description_ka: data.description_ka || data.description || '',
      description_en: data.description_en || data.description || '',
      description_ru: data.description_ru || '',
      description_hi: data.description_hi || '',
      description_ar: data.description_ar || '',
      description_he: data.description_he || '',
      description_tr: data.description_tr || '',
      description_hy: data.description_hy || '',
      description_kk: data.description_kk || '',
      description_uk: data.description_uk || '',
      description_zh: data.description_zh || '',
      base_price: parseFloat(data.base_price) || 0,
      discounted_price: parseFloat(data.discounted_price) || parseFloat(data.base_price) || 0,
      price_per_person: parseFloat(data.price_per_person) || parseFloat(data.base_price) || 0,
      adult_price: data.adult_price ? parseFloat(data.adult_price) : null,
      child_price: data.child_price ? parseFloat(data.child_price) : null,
      infant_price: data.infant_price !== undefined && data.infant_price !== '' && data.infant_price !== null ? parseFloat(data.infant_price) : null,
      min_people: parseInt(data.min_people, 10) || 1,
      max_people: parseInt(data.max_people, 10) || 10,
      location: data.location || '',
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      is_popular: Boolean(data.is_popular),
      is_featured: Boolean(data.is_featured),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      views_count: 0,
      bookings_count: 0,
      average_rating: 5,
      rating_count: 1,
      good_reviews_count: 1,
      bad_reviews_count: 0,
      category: data.category !== undefined ? data.category : null,
      city: data.city !== undefined ? data.city : null,
      company: data.company_id || data.company || null,
      image: data.image || data.primary_image?.image || null,
      primary_image: data.primary_image || null,
      images: Array.isArray(data.images) ? data.images : [],
      gallery_urls: Array.isArray(data.gallery_urls) ? data.gallery_urls : [],
      videos: Array.isArray(data.videos) ? data.videos : [],
      youtube_link: data.youtube_link || '',
      discounts: Array.isArray(data.discounts) ? data.discounts : [],
      age_prices: normalizedAgePrices,
      reviews: [],
      event_ticket: data.event_ticket || 'per person',
      duration: data.duration || '',
      seo_title: data.seo_title || '',
      seo_description: data.seo_description || '',
      booking_type: data.booking_type || 'activity',
      daily_price: data.daily_price ? parseFloat(data.daily_price) : (parseFloat(data.base_price) || null),
      deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
      car_transmission: data.car_transmission || 'Automatic',
      car_fuel: data.car_fuel || 'Petrol',
      car_seats: data.car_seats ? parseInt(data.car_seats, 10) : 5,
      working_hours_start: data.working_hours_start || '09:00',
      working_hours_end: data.working_hours_end || '20:00',
      slot_duration_mins: data.slot_duration_mins ? parseInt(data.slot_duration_mins, 10) : 60,
      time_slots: Array.isArray(data.time_slots) ? data.time_slots : [],
      timeSlots: Array.isArray(data.timeSlots) ? data.timeSlots : [],
      slots_pricing: data.slots_pricing && typeof data.slots_pricing === 'object' ? data.slots_pricing : {},
      created_at: new Date().toISOString()
    };

    await eventsCol.insertOne(newEvent);
    console.log(`Event created with ID ${nextId}`);
    return res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ message: 'Failed to create event' });
  }
});

// PATCH /event/update/:id or PUT /event/update/:id
router.all(['/update/:id', '/admin/event/update/:id'], async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { id } = req.params;
    const eventsCol = await getCollection('events');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    // Convert numeric fields if provided
    ['base_price', 'discounted_price', 'price_per_person', 'adult_price', 'child_price', 'infant_price', 'daily_price', 'deposit_amount', 'latitude', 'longitude'].forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '') {
        updateData[field] = parseFloat(updateData[field]);
      }
    });

    ['min_people', 'max_people', 'car_seats', 'slot_duration_mins'].forEach(field => {
      if (updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '') {
        updateData[field] = parseInt(updateData[field], 10);
      }
    });

    if (Array.isArray(updateData.age_prices)) {
      updateData.age_prices = updateData.age_prices.map((ap, idx) => ({
        ...ap,
        id: ap.id || (idx + 1),
        category_name: ap.category_name || ap.name || 'Standard',
        min_age: ap.min_age !== undefined && ap.min_age !== '' ? Number(ap.min_age) : 0,
        max_age: ap.max_age !== undefined && ap.max_age !== '' ? Number(ap.max_age) : 99,
        price: parseFloat(ap.price) || 0
      }));
    }

    if (updateData.company_id !== undefined) {
      updateData.company = updateData.company_id;
      delete updateData.company_id;
    }

    updateData.updated_at = new Date().toISOString();

    const result = await eventsCol.findOneAndUpdate(
      toIdFilter(id),
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const updatedEvent = result.value || result;
    return res.json(updatedEvent || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /event/delete/:id
router.delete(['/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const eventsCol = await getCollection('events');
    const result = await eventsCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete event' });
  }
});

// POST /event/:eventId/images (Upload image)
router.post('/:eventId/images', upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const eventsCol = await getCollection('events');
    const event = await eventsCol.findOne(toIdFilter(eventId));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const imagePath = `/uploads/${file.filename}`;
    const isPrimary = req.body.is_primary === 'true' || req.body.is_primary === true;
    const imageId = Date.now();

    const newImageObj = {
      id: imageId,
      alt_text: req.body.alt_text || event.name || '',
      image: imagePath,
      raw_image: imagePath,
      is_primary: isPrimary,
      order: Array.isArray(event.images) ? event.images.length : 0
    };

    const updateOperations = {
      $push: {
        images: newImageObj,
        gallery_urls: imagePath
      }
    };

    if (isPrimary || !event.image) {
      updateOperations.$set = {
        image: imagePath,
        primary_image: {
          id: imageId,
          alt_text: newImageObj.alt_text,
          image: imagePath,
          raw_path: imagePath,
          is_primary: true
        }
      };
    }

    await eventsCol.updateOne(toIdFilter(eventId), updateOperations);
    console.log(`Uploaded image ${imageId} for event ${eventId}: ${imagePath}`);
    return res.status(201).json(newImageObj);
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ message: 'Failed to upload event image' });
  }
});

// PUT /event/:eventId/images/update/:imageId
router.put('/:eventId/images/update/:imageId', async (req, res) => {
  try {
    const { eventId, imageId } = req.params;
    const { alt_text, is_primary } = req.body;
    const eventsCol = await getCollection('events');
    const event = await eventsCol.findOne(toIdFilter(eventId));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const images = (event.images || []).map(img => {
      if (String(img.id) === String(imageId)) {
        return {
          ...img,
          alt_text: alt_text !== undefined ? alt_text : img.alt_text,
          is_primary: is_primary !== undefined ? Boolean(is_primary) : img.is_primary
        };
      }
      return img;
    });

    const updateDoc = { images };
    if (is_primary) {
      const primary = images.find(img => String(img.id) === String(imageId));
      if (primary) {
        updateDoc.primary_image = {
          id: primary.id,
          alt_text: primary.alt_text,
          image: primary.image,
          raw_path: primary.image,
          is_primary: true
        };
      }
    }

    await eventsCol.updateOne(toIdFilter(eventId), { $set: updateDoc });
    return res.json({ success: true, message: 'Image updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update image' });
  }
});

// DELETE /event/:eventId/images/delete/:imageId
router.delete('/:eventId/images/delete/:imageId', async (req, res) => {
  try {
    const { eventId, imageId } = req.params;
    const eventsCol = await getCollection('events');
    const event = await eventsCol.findOne(toIdFilter(eventId));
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const removed = (event.images || []).find(img => String(img.id) === String(imageId));
    const filteredImages = (event.images || []).filter(img => String(img.id) !== String(imageId));
    const filteredGallery = removed 
      ? (event.gallery_urls || []).filter(u => u !== removed.image && u !== removed.raw_image)
      : event.gallery_urls || [];

    const updateDoc = {
      images: filteredImages,
      gallery_urls: filteredGallery
    };

    if (event.primary_image && String(event.primary_image.id) === String(imageId)) {
      updateDoc.primary_image = filteredImages[0] || null;
    }

    await eventsCol.updateOne(toIdFilter(eventId), { $set: updateDoc });
    return res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete image' });
  }
});

export default router;
