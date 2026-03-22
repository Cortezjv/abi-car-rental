import express from 'express';
import db from '../database';
import { authenticateToken, authorize } from './auth';

const router = express.Router();

// Extend Request type to include user
interface AuthRequest extends express.Request {
  user?: any;
}

// Staff submits walk-in request
router.post('/', authenticateToken, authorize('staff'), (req: AuthRequest, res) => {
  try {
    const walkinData = req.body;
    
    // Validate required fields
    if (!walkinData.fullName || !walkinData.phone || !walkinData.vehicleId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newWalkin = db.createWalkin({
      ...walkinData,
      staffId: req.user?.id,
      staffName: req.user?.fullname || req.user?.username,
      createdBy: 'staff',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Walk-in created:', newWalkin.bookingNumber);
    
    res.status(201).json({
      success: true,
      bookingNumber: newWalkin.bookingNumber,
      message: 'Walk-in request submitted successfully'
    });
    
  } catch (error: any) {
    console.error('Walk-in creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin gets all walk-ins
router.get('/admin', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const walkins = db.getWalkins();
    res.json(walkins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin updates walk-in status
router.put('/:id', authenticateToken, authorize('admin'), (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const updated = db.updateWalkin(id, {
      ...updates,
      reviewedBy: req.user?.id,
      reviewedAt: new Date().toISOString()
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Walk-in not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Walk-in updated successfully',
      walkin: updated 
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Staff gets assigned walk-ins
router.get('/staff', authenticateToken, authorize('staff'), (req: AuthRequest, res) => {
  try {
    const walkins = db.getWalkins().filter((w: any) => 
      w.assignedStaffId === req.user?.id
    );
    res.json(walkins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single walk-in by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const walkin = db.getWalkinById(id);
    
    if (!walkin) {
      return res.status(404).json({ error: 'Walk-in not found' });
    }
    
    res.json(walkin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
