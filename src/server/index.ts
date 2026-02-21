import express from 'express';
import cors from 'cors';
import path from 'path';
import db from './database';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.get('/api/vehicles', (req, res) => {
  try {
    const vehicles = db.getVehicles();
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/vehicles/:id', (req, res) => {
  try {
    const vehicle = db.getVehicle(parseInt(req.params.id));
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// Add this after your vehicle routes

// POST - Create new booking
app.post('/api/bookings', (req, res) => {
  try {
    const bookingData = req.body;
    
    // Generate booking number
    const bookingNumber = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    
    // Get vehicle details
    const vehicle = db.getVehicle(bookingData.vehicleId);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    
    // Calculate days and total
    const pickup = new Date(bookingData.pickupDate);
    const ret = new Date(bookingData.returnDate);
    const days = Math.ceil((ret - pickup) / (1000 * 60 * 60 * 24)) + 1;
    const totalAmount = days * vehicle.price_per_day;
    
    // Create booking object
    const newBooking = {
      bookingNumber,
      vehicleId: bookingData.vehicleId,
      vehicleName: vehicle.name,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      licenseNumber: bookingData.licenseNumber,
      pickupDate: bookingData.pickupDate,
      returnDate: bookingData.returnDate,
      days,
      totalAmount,
      specialRequests: bookingData.specialRequests || '',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    const booking = db.createBooking(newBooking);
    res.status(201).json({ 
      success: true, 
      bookingNumber: booking.bookingNumber,
      message: 'Booking confirmed' 
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get all bookings (for staff dashboard)
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = db.getBookings();
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get single booking by number
app.get('/api/bookings/:bookingNumber', (req, res) => {
  try {
    const booking = db.getBookingByNumber(req.params.bookingNumber);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// IMPORTANT: Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 ABI Car & Van Rental Server`);
  console.log(`📱 Running on: http://localhost:${PORT}`);
  console.log(`=================================`);
});
