import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './database';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// ========== VEHICLE ROUTES ==========
app.get('/api/vehicles', (req, res) => {
  try {
    res.json(db.getVehicles());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vehicles/:id', (req, res) => {
  try {
    const vehicle = db.getVehicle(parseInt(req.params.id));
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles', (req, res) => {
  try {
    res.status(201).json(db.addVehicle(req.body));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', (req, res) => {
  try {
    const updated = db.updateVehicle(parseInt(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', (req, res) => {
  try {
    const deleted = db.deleteVehicle(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BOOKING ROUTES ==========
app.post('/api/bookings', (req, res) => {
  try {
    const data = req.body;
    const vehicle = db.getVehicle(data.vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const start = new Date(data.pickupDate).getTime();
    const end = new Date(data.returnDate).getTime();
    const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    const total = days * vehicle.price_per_day;

    const booking = db.createBooking({
      ...data,
      bookingNumber: 'BK' + Date.now(),
      days,
      totalAmount: total,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, bookingNumber: booking.bookingNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    res.json(db.getBookings());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/:bookingNumber', (req, res) => {
  try {
    const booking = db.getBookingByNumber(req.params.bookingNumber);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id/status', (req, res) => {
  try {
    const updated = db.updateBookingStatus(parseInt(req.params.id), req.body.status);
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== HOME ROUTE ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 ABI Car & Van Rental Server');
  console.log(`📱 Running on: http://localhost:${PORT}`);
  console.log('=================================');
});
