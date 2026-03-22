import express from 'express';
import db from '../database';
import { authenticateToken, authorize } from './auth';

const router = express.Router();

// ========== GET PUBLIC CONTENT ==========
// This is public - no authentication needed
router.get('/', (req, res) => {
  try {
    const content = db.getContent();
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== UPDATE CONTENT (Admin only) ==========
router.put('/', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const updatedContent = db.updateContent(req.body);
    res.json({ 
      success: true, 
      message: 'Content updated successfully',
      content: updatedContent 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== UPLOAD HERO IMAGES ==========
router.post('/hero-images', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const { imageUrl } = req.body;
    const content = db.getContent();
    
    if (!content.hero.carImages) {
      content.hero.carImages = [];
    }
    
    content.hero.carImages.push({
      id: Date.now(),
      url: imageUrl,
      createdAt: new Date().toISOString()
    });
    
    db.updateContent(content);
    res.json({ success: true, images: content.hero.carImages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DELETE HERO IMAGE ==========
router.delete('/hero-images/:id', authenticateToken, authorize('admin'), (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const content = db.getContent();
    
    content.hero.carImages = content.hero.carImages.filter((img: any) => img.id !== imageId);
    db.updateContent(content);
    
    res.json({ success: true, images: content.hero.carImages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
