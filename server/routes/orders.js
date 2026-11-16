import { Router } from 'express';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

// Helper to filter orders by ID / order number
function toOrderFilter(identifier) {
  const num = Number(identifier);
  if (!isNaN(num)) {
    return {
      $or: [
        { id: num },
        { _id: num },
        { order_number: String(identifier) },
        { order_number: `FF-${identifier}` }
      ]
    };
  }
  return {
    $or: [
      { order_number: String(identifier) },
      { id: String(identifier) },
      { _id: String(identifier) }
    ]
  };
}

// GET /event/:eventId/bookings or /:eventId/bookings
router.get(['/event/:eventId/bookings', '/:eventId/bookings'], async (req, res) => {
  try {
    const { eventId } = req.params;
    const ordersCol = await getCollection('orders');
    const orders = await ordersCol.find({
      $or: [
        { event_id: Number(eventId) },
        { event_id: String(eventId) },
        { 'event.id': Number(eventId) }
      ]
    }).toArray();
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// GET /event/orders & /order/feed & /orders
router.get(['/feed', '/orders', '/event/orders', '/event/orders/', '/'], async (req, res) => {
  try {
    const ordersCol = await getCollection('orders');
    const eventsCol = await getCollection('events');
    const categoriesCol = await getCollection('categories');
    const citiesCol = await getCollection('cities');
    const { status, search, eventId } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (eventId) {
      filter.event_id = Number(eventId);
    }
    if (search) {
      filter.$or = [
        { customer_name: { $regex: search, $options: 'i' } },
        { customer_email: { $regex: search, $options: 'i' } },
        { customer_phone: { $regex: search, $options: 'i' } },
        { order_number: { $regex: search, $options: 'i' } },
        { event_name: { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, allEvents, allCategories, allCities] = await Promise.all([
      ordersCol.find(filter).sort({ id: -1 }).toArray(),
      eventsCol.find({}).toArray(),
      categoriesCol.find({}).toArray(),
      citiesCol.find({}).toArray()
    ]);

    const eventsMap = new Map(allEvents.map(e => [Number(e.id), e]));
    const categoriesMap = new Map(allCategories.map(c => [Number(c.id), c]));
    const citiesMap = new Map(allCities.map(c => [Number(c.id), c]));

    const enrichedOrders = orders.map(order => {
      const evId = Number(order.event_id || (typeof order.event === 'object' ? order.event?.id : order.event));
      const evDoc = eventsMap.get(evId) || (typeof order.event === 'object' ? order.event : null);
      let enrichedEvent = evDoc ? { ...evDoc } : { id: evId || null, name: order.event_name || order.event_title || 'Funfinder Experience' };

      if (enrichedEvent.category && typeof enrichedEvent.category !== 'object') {
        const catObj = categoriesMap.get(Number(enrichedEvent.category));
        if (catObj) enrichedEvent.category = catObj;
      }
      if (enrichedEvent.city && typeof enrichedEvent.city !== 'object') {
        const cityObj = citiesMap.get(Number(enrichedEvent.city));
        if (cityObj) enrichedEvent.city = cityObj;
      }

      return {
        ...order,
        event: enrichedEvent,
        event_name: order.event_name || enrichedEvent.name || 'Funfinder Experience',
        payment_status: order.payment_status || order.status || 'pending',
        total_amount: order.total_amount ?? order.total_price ?? 0
      };
    });

    return res.json(enrichedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// POST /order/create & /create
router.post(['/create', '/order/create'], async (req, res) => {
  try {
    const ordersCol = await getCollection('orders');
    const nextId = await getNextId('orders');
    const data = req.body || {};

    const orderNumber = data.order_number || `FF-${nextId}`;
    const eventId = data.event_id ? Number(data.event_id) : (data.event?.id || (data.event && !isNaN(Number(data.event)) ? Number(data.event) : null));
    let totalPrice = parseFloat(data.total_price || data.total_amount || data.amount || data.price) || 0;
    let eventName = data.event_name || data.event?.name || 'Funfinder Experience';
    let companyId = data.company_id || data.company?.id || null;

    if (eventId) {
      try {
        const eventsCol = await getCollection('events');
        const eventDoc = await eventsCol.findOne({
          $or: [
            { id: Number(eventId) },
            { id: String(eventId) },
            { _id: Number(eventId) }
          ]
        });
        if (eventDoc) {
          if (!data.event_name) eventName = eventDoc.name || eventDoc.title || eventName;
          if (!companyId) companyId = eventDoc.company_id || eventDoc.company?.id || null;
          if (totalPrice <= 0) {
            const unit = parseFloat(eventDoc.discounted_price ?? eventDoc.base_price ?? eventDoc.price ?? 0);
            const count = parseInt(data.people_count || data.tickets_count || 1, 10);
            totalPrice = unit * count;
          }
        }
      } catch (err) {
        console.warn('Could not fetch event pricing:', err);
      }
    }

    const newOrder = {
      _id: nextId,
      id: nextId,
      order_number: orderNumber,
      event_id: eventId,
      event_name: eventName,
      event_title: eventName,
      company_id: companyId,
      customer_id: data.customer_id || data.customer?.id || null,
      customer_name: data.customer_name || data.name || (data.customer ? `${data.customer.firstname || ''} ${data.customer.lastname || ''}`.trim() : 'Guest'),
      customer_email: data.customer_email || data.email || data.customer?.email || '',
      customer_phone: data.customer_phone || data.phone || data.customer?.phone || '',
      tickets_count: parseInt(data.tickets_count || data.people_count || data.quantity, 10) || 1,
      people_count: parseInt(data.people_count || data.tickets_count || 1, 10),
      adults_count: parseInt(data.adults_count, 10) || 0,
      children_count: parseInt(data.children_count, 10) || 0,
      infants_count: parseInt(data.infants_count, 10) || 0,
      booking_type: data.booking_type || 'activity',
      pickup_date: data.pickup_date || null,
      dropoff_date: data.dropoff_date || null,
      pickup_time: data.pickup_time || null,
      dropoff_time: data.dropoff_time || null,
      pickup_location: data.pickup_location || null,
      dropoff_location: data.dropoff_location || null,
      days_count: parseInt(data.days_count, 10) || 1,
      slot_time: data.slot_time || null,
      add_ons: Array.isArray(data.add_ons) ? data.add_ons : [],
      driver_license: data.driver_license || null,
      total_price: totalPrice,
      status: data.status || 'pending',
      payment_method: data.payment_method || 'Card',
      event_date: data.event_date || data.date || new Date().toISOString(),
      notes: data.notes || '',
      is_used: false,
      created_at: new Date().toISOString()
    };

    await ordersCol.insertOne(newOrder);
    return res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Failed to create order' });
  }
});

// GET /event/orders/export
router.get(['/export', '/event/orders/export'], async (req, res) => {
  try {
    const ordersCol = await getCollection('orders');
    const orders = await ordersCol.find({}).sort({ id: -1 }).toArray();

    const header = 'Order Number,Event Name,Customer Name,Customer Email,Customer Phone,Tickets,Total Price,Status,Created At\n';
    const rows = orders.map(o => 
      `"${o.order_number || o.id}","${(o.event_name || '').replace(/"/g, '""')}","${(o.customer_name || '').replace(/"/g, '""')}","${o.customer_email || ''}","${o.customer_phone || ''}",${o.tickets_count || 1},${o.total_price || 0},"${o.status || 'paid'}","${o.created_at || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    return res.send(header + rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export orders' });
  }
});

// GET order details: /event/orders/number/:id or /order/details/:id or /event/orders/:id
router.get(['/number/:id', '/details/:id', '/event/orders/number/:id', '/event/orders/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const ordersCol = await getCollection('orders');
    const order = await ordersCol.findOne(toOrderFilter(id));
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const evId = Number(order.event_id || (typeof order.event === 'object' ? order.event?.id : order.event));
    let enrichedEvent = typeof order.event === 'object' && order.event ? { ...order.event } : null;
    if (evId && !enrichedEvent) {
      try {
        const eventsCol = await getCollection('events');
        const evDoc = await eventsCol.findOne({ $or: [{ id: evId }, { _id: evId }] });
        if (evDoc) enrichedEvent = { ...evDoc };
      } catch (_) {}
    }

    if (enrichedEvent) {
      try {
        if (enrichedEvent.category && typeof enrichedEvent.category !== 'object') {
          const categoriesCol = await getCollection('categories');
          const catObj = await categoriesCol.findOne({ id: Number(enrichedEvent.category) });
          if (catObj) enrichedEvent.category = catObj;
        }
        if (enrichedEvent.city && typeof enrichedEvent.city !== 'object') {
          const citiesCol = await getCollection('cities');
          const cityObj = await citiesCol.findOne({ id: Number(enrichedEvent.city) });
          if (cityObj) enrichedEvent.city = cityObj;
        }
      } catch (_) {}
    }

    return res.json({
      ...order,
      event: enrichedEvent || { id: evId || null, name: order.event_name || order.event_title || 'Funfinder Experience' },
      payment_status: order.payment_status || order.status || 'pending',
      total_amount: order.total_amount ?? order.total_price ?? 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order details' });
  }
});

// PATCH /event/orders/:id/status
router.patch(['/:id/status', '/event/orders/:id/status'], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ordersCol = await getCollection('orders');
    await ordersCol.updateOne(toOrderFilter(id), { $set: { status, updated_at: new Date().toISOString() } });
    const updated = await ordersCol.findOne(toOrderFilter(id));
    return res.json(updated || { id, status });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status' });
  }
});

// POST /event/orders/:id/cancel
router.post(['/:id/cancel', '/event/orders/:id/cancel'], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const ordersCol = await getCollection('orders');
    await ordersCol.updateOne(toOrderFilter(id), {
      $set: {
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by admin',
        cancelled_at: new Date().toISOString()
      }
    });
    const updated = await ordersCol.findOne(toOrderFilter(id));
    return res.json(updated || { id, status: 'cancelled' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// POST /event/orders/:id/mark-used or /:id/mark-used
router.post(['/:id/mark-used', '/event/orders/:id/mark-used', '/orders/:id/mark-used'], async (req, res) => {
  try {
    const { id } = req.params;
    const ordersCol = await getCollection('orders');
    const order = await ordersCol.findOne(toOrderFilter(id));
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    await ordersCol.updateOne(toOrderFilter(id), {
      $set: {
        is_used: true,
        used_at: new Date().toISOString(),
        status: 'completed',
        updated_at: new Date().toISOString()
      }
    });
    const updated = await ordersCol.findOne(toOrderFilter(id));
    return res.json(updated);
  } catch (error) {
    console.error('Error marking order as used:', error);
    return res.status(500).json({ message: 'Failed to mark order as used' });
  }
});

export default router;
