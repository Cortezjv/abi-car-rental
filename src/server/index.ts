import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import db from './database';
import authRoutes, { authenticateToken, authorize } from './routes/auth';
import adminRoutes from './routes/admin';
import contentRoutes from './routes/content';
import walkinRoutes from './routes/walkin';
const app = express();
const PORT = 3000;

// Middleware with increased limits for images
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/walkin', walkinRoutes);
// ========== VEHICLE ROUTES ==========
// GET all vehicles (public)
app.get('/api/vehicles', (req, res) => {
  try {
    const vehicles = db.getVehicles();
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single vehicle (public)
app.get('/api/vehicles/:id', (req, res) => {
  try {
    const vehicle = db.getVehicle(parseInt(req.params.id));
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Add new vehicle (admin only)
app.post('/api/vehicles', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const vehicleData = req.body;
    
    if (!vehicleData.name || !vehicleData.type || !vehicleData.seats || !vehicleData.transmission) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!vehicleData.images) {
      vehicleData.images = [];
    }
    
    const newVehicle = db.addVehicle({
      ...vehicleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    res.status(201).json(newVehicle);
  } catch (error: any) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update vehicle (admin only)
app.put('/api/vehicles/:id', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    updates.updatedAt = new Date().toISOString();
    
    const updated = db.updateVehicle(id, updates);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete vehicle (admin only)
app.delete('/api/vehicles/:id', authenticateToken, authorize('admin'), (req, res) => {
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

// ========== BOOKING ROUTES ==========
// Create new booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Get user info from token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET || 'your-secret-key');
    const user = db.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Create booking
    const newBooking = db.createBooking({
      ...bookingData,
      userId: user.id,
      userName: user.fullname || user.username,
      userPhone: user.phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Get admin phone numbers for SMS notification
    const admins = db.getUsers().filter((u: any) => u.role === 'admin');
    const adminPhones = admins.map((a: any) => a.phone);
    
    // Format booking details for SMS
    const smsMessage = formatBookingSMS(newBooking);
    
    console.log('📱 New booking created:', newBooking.bookingNumber);
    console.log('📨 SMS would be sent to admins:', adminPhones);
    console.log('📝 Message:', smsMessage);
    
    res.status(201).json({
      success: true,
      bookingNumber: newBooking.bookingNumber,
      message: 'Booking request submitted successfully'
    });
    
  } catch (error: any) {
    console.error('Booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all bookings (admin only)
app.get('/api/bookings', authenticateToken, authorize('admin', 'staff'), (req, res) => {
  try {
    const bookings = db.getBookings();
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
app.get('/api/my-bookings', authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.id;
    const bookings = db.getBookings().filter((b: any) => b.userId === userId);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single booking
app.get('/api/bookings/:id', authenticateToken, (req, res) => {
  try {
    const booking = db.getBookingById(parseInt(req.params.id));
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status (admin only)
app.put('/api/bookings/:id/status', authenticateToken, authorize('admin', 'staff'), (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status, price, notes, carwashFee, assignedStaffId } = req.body;

    // Create additionalData object
    const additionalData: any = { 
      price, 
      notes,
      carwashFee,
      assignedStaffId,
      updatedAt: new Date().toISOString()
    };
    
    // If approved, add approved timestamp
    if (status === 'approved') {
      additionalData.approvedAt = new Date().toISOString();
    }

    const updated = db.updateBookingStatus(bookingId, status, additionalData);
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get booking details for SMS
    const booking = db.getBookingById(bookingId);

    // Send SMS to customer about status update
    if (booking && booking.userPhone) {
      const statusMessage = formatStatusSMS(booking, status, price);
      console.log(`📨 Status SMS to ${booking.userPhone}:`, statusMessage);
    }

    res.json({ success: true, booking: updated });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: error.message });
  }
});
;
// ========== HELPER FUNCTIONS ==========
function formatBookingSMS(booking: any): string {
  return `
🚗 NEW BOOKING REQUEST
━━━━━━━━━━━━━━━━━━━━━
Booking #: ${booking.bookingNumber}
Vehicle: ${booking.vehicleName} (${booking.vehicleBrand || 'N/A'})
Plate: ${booking.vehiclePlate || 'N/A'}
Color: ${booking.vehicleColor || 'N/A'}

👤 RENTER INFO
Name: ${booking.fullName}
Phone: ${booking.contactNumber}
Address: ${booking.address}
FB: ${booking.facebookName}
Emergency: ${booking.emergencyPerson} - ${booking.emergencyNumber}

📅 SCHEDULE
Pickup: ${booking.startDate} ${booking.startTime}
Return: ${booking.endDate} ${booking.endTime}
Option: ${booking.deliveryOption === 'pickup' ? '🚩 Pickup' : '🚚 Delivery'}
Driver: ${booking.driverOption === 'with' ? '👤 With Driver' : '🚗 Self Drive'}

Log in to admin dashboard to review.
  `.trim();
}

function formatStatusSMS(booking: any, status: string, price?: number): string {
  if (status === 'approved') {
    return `
✅ BOOKING APPROVED
Booking #: ${booking.bookingNumber}
Agreed Price: ₱${price || 'TBD'}

Please wait for our call to confirm details.
Thank you for choosing ABI Rentals!
    `.trim();
  } else if (status === 'rejected') {
    return `
❌ BOOKING REJECTED
Booking #: ${booking.bookingNumber}

Sorry, your booking request could not be approved.
Please contact us for more information.
    `.trim();
  }
  return `Booking #${booking.bookingNumber} status updated to: ${status}`;
}

// ========== HOME ROUTE ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 ABI Car & Van Rental Server`);
  console.log(`📱 Running on: http://localhost:${PORT}`);
  console.log(`=================================`);
});
