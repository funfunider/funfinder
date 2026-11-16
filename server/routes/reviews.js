import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// Helper to filter reviews by ID
function toReviewFilter(id) {
  return toIdFilter(id);
}

// Seed reviews if empty
async function ensureSampleReviews() {
  try {
    const reviewsCol = await getCollection('reviews');
    const count = await reviewsCol.countDocuments();
    if (count === 0) {
      await reviewsCol.insertMany([
        {
          _id: 1,
          id: 1,
          event_id: 78,
          event_name: 'Drift Rent Tbilisi - 1 Hour + Lesson',
          company_id: 7,
          customer: {
            id: 101,
            firstname: 'Giorgi',
            lastname: 'Beridze',
            full_name: 'Giorgi Beridze',
            email: 'giorgi@gmail.com'
          },
          mark: 'good',
          rating: 5,
          comment: 'Incredible experience! The instructor was very patient and taught the fundamentals within 20 minutes.',
          reply: 'Thank you Giorgi! Hope to see you back on track soon!',
          is_approved: true,
          is_flagged: false,
          created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        },
        {
          _id: 2,
          id: 2,
          event_id: 65,
          event_name: 'Tandem Paragliding Gudauri',
          company_id: 6,
          customer: {
            id: 102,
            firstname: 'Nino',
            lastname: 'Gelashvili',
            full_name: 'Nino Gelashvili',
            email: 'nino@gmail.com'
          },
          mark: 'good',
          rating: 5,
          comment: 'Breathtaking mountain views of Gudauri! The flight lasted 25 minutes and video quality was great.',
          reply: null,
          is_approved: true,
          is_flagged: false,
          created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
        },
        {
          _id: 3,
          id: 3,
          event_id: 65,
          event_name: 'Tandem Paragliding Gudauri',
          company_id: 6,
          customer: {
            id: 103,
            firstname: 'Luka',
            lastname: 'Kapanadze',
            full_name: 'Luka Kapanadze',
            email: 'luka@mail.ru'
          },
          mark: 'neutral',
          rating: 3,
          comment: 'Flight was great, but we had to wait 40 minutes at takeoff due to wind conditions.',
          reply: null,
          is_approved: true,
          is_flagged: false,
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ]);
      console.log('  ✅ Seeded sample reviews');
    }
  } catch (err) {
    console.warn('Reviews seed deferred:', err.message);
  }
}

ensureSampleReviews();

// GET /v2/review/company/:companyId/list or /v2/review/list or /v2/review
router.get(['/company/:companyId/list', '/company/:companyId', '/list', '/'], async (req, res) => {
  try {
    const { companyId } = req.params;
    const { event_id, mark, is_approved } = req.query;
    const filter = {};

    if (companyId && companyId !== 'all') {
      filter.$or = [
        { company_id: Number(companyId) },
        { company_id: String(companyId) }
      ];
    }
    if (event_id) {
      filter.event_id = Number(event_id);
    }
    if (mark) {
      filter.mark = mark;
    }
    if (is_approved !== undefined) {
      filter.is_approved = is_approved === 'true' || is_approved === true;
    }

    const reviewsCol = await getCollection('reviews');
    const reviews = await reviewsCol.find(filter).sort({ id: -1 }).toArray();
    return res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// GET /v2/review/event/:eventId/list
router.get('/event/:eventId/list', async (req, res) => {
  try {
    const { eventId } = req.params;
    const reviewsCol = await getCollection('reviews');
    const reviews = await reviewsCol.find({
      $or: [{ event_id: Number(eventId) }, { event_id: String(eventId) }]
    }).sort({ id: -1 }).toArray();
    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch event reviews' });
  }
});

// POST /v2/review/create or /review/create or /event/:eventId
router.post(['/create', '/event/:eventId', '/event/:eventId/create'], async (req, res) => {
  try {
    const eventId = req.params.eventId || req.body.event_id;
    const { comment, text, rating, mark, customer, customer_name, customer_email } = req.body;
    const reviewsCol = await getCollection('reviews');
    const nextId = await getNextId('reviews');

    const newReview = {
      _id: nextId,
      id: nextId,
      event_id: Number(eventId) || 0,
      customer: customer || {
        firstname: customer_name?.split(' ')[0] || 'Customer',
        lastname: customer_name?.split(' ').slice(1).join(' ') || '',
        full_name: customer_name || 'Customer',
        email: customer_email || ''
      },
      mark: mark || (Number(rating) >= 4 ? 'good' : (Number(rating) === 3 ? 'neutral' : 'bad')),
      rating: Number(rating) || 5,
      comment: comment || text || '',
      reply: null,
      is_approved: true,
      is_flagged: false,
      created_at: new Date().toISOString()
    };

    await reviewsCol.insertOne(newReview);
    return res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ message: 'Failed to create review' });
  }
});

// GET /v2/review/event/:eventId/summary
router.get('/event/:eventId/summary', async (req, res) => {
  try {
    const { eventId } = req.params;
    const reviewsCol = await getCollection('reviews');
    const reviews = await reviewsCol.find({
      $or: [{ event_id: Number(eventId) }, { event_id: String(eventId) }]
    }).toArray();

    const total = reviews.length;
    const good = reviews.filter(r => r.mark === 'good').length;
    const neutral = reviews.filter(r => r.mark === 'neutral').length;
    const bad = reviews.filter(r => r.mark === 'bad').length;
    const avgRating = total > 0 
      ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total).toFixed(1)) 
      : 0;

    return res.json({
      total,
      avg_rating: avgRating,
      good,
      neutral,
      bad
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch event review summary' });
  }
});

// POST /v2/review/:reviewId/approve
router.post(['/:id/approve', '/approve/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const reviewsCol = await getCollection('reviews');
    await reviewsCol.updateOne(toReviewFilter(id), { $set: { is_approved: true, updated_at: new Date().toISOString() } });
    const updated = await reviewsCol.findOne(toReviewFilter(id));
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to approve review' });
  }
});

// POST /v2/review/:reviewId/hide
router.post(['/:id/hide', '/hide/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const reviewsCol = await getCollection('reviews');
    await reviewsCol.updateOne(toReviewFilter(id), { $set: { is_approved: false, updated_at: new Date().toISOString() } });
    const updated = await reviewsCol.findOne(toReviewFilter(id));
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to hide review' });
  }
});

// POST /v2/review/:reviewId/reply
router.post(['/:id/reply', '/reply/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const reviewsCol = await getCollection('reviews');
    await reviewsCol.updateOne(toReviewFilter(id), { $set: { reply: reply || '', updated_at: new Date().toISOString() } });
    const updated = await reviewsCol.findOne(toReviewFilter(id));
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reply to review' });
  }
});

// DELETE /v2/review/:reviewId
router.delete(['/:id', '/delete/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const reviewsCol = await getCollection('reviews');
    await reviewsCol.deleteOne(toReviewFilter(id));
    return res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete review' });
  }
});

// PATCH /v2/review/:reviewId
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body, updated_at: new Date().toISOString() };
    delete update._id;
    delete update.id;
    const reviewsCol = await getCollection('reviews');
    await reviewsCol.updateOne(toReviewFilter(id), { $set: update });
    const updated = await reviewsCol.findOne(toReviewFilter(id));
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to patch review' });
  }
});

export default router;
