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
    
    // Calculate days safely (FIXED VERSION)
    const pickup = new Date(bookingData.pickupDate);
    const ret = new Date(bookingData.returnDate);
    
    // Convert dates to timestamps for safe calculation
    const pickupTime = pickup.getTime();
    const returnTime = ret.getTime();
    const diffTime = Math.abs(returnTime - pickupTime);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
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
    console.error('Booking error:', error);
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

// PUT - Update booking status (for staff dashboard)
app.put('/api/bookings/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    const updated = db.updateBookingStatus(id, status);
    if (updated) {
      res.json({ success: true, booking: updated });
    } else {
      res.status(404).json({ error: 'Booking not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Add new vehicle (admin)
app.post('/api/vehicles', (req, res) => {
  try {
    const vehicleData = req.body;
    const newVehicle = db.addVehicle(vehicleData);
    res.status(201).json(newVehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update vehicle (admin)
app.put('/api/vehicles/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const updated = db.updateVehicle(id, updates);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete vehicle (admin)
app.delete('/api/vehicles/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = db.deleteVehicle(id);
    if (deleted) {
      res.json({ success: true, message: 'Vehicle deleted' });
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 ABI Car & Van Rental Server`);
  console.log(`📱 Running on: http://localhost:${PORT}`);
  console.log(`=================================`);
});  } catch (error: any) {
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
