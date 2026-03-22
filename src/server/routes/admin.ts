import express from 'express';
import db from '../database';
import { authenticateToken, authorize } from './auth';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const users = db.getUsers().map((u: any) => ({
      id: u.id,
      fullname: u.fullname,
      email: u.email,
      phone: u.phone,
      role: u.role,
      verified: u.verified,
      createdAt: u.createdAt
    }));
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    // Check if updateUserRole exists
    if (typeof db.updateUserRole !== 'function') {
      return res.status(500).json({ error: 'updateUserRole method not implemented' });
    }
    
    const updated = db.updateUserRole(userId, role);
    if (updated) {
      res.json({ success: true, user: updated });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const vehicles = db.getVehicles ? db.getVehicles() : [];
    const bookings = db.getBookings ? db.getBookings() : [];
    const users = db.getUsers ? db.getUsers() : [];
    
    const stats = {
      totalVehicles: vehicles.length,
      activeBookings: bookings.filter((b: any) => b.status === 'active').length,
      totalUsers: users.length,
      availableVehicles: vehicles.filter((v: any) => v.availability).length
    };
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

