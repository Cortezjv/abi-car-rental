import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret-key-2024-abi-rental';

// ========== EXPORTED MIDDLEWARE ==========
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🔐 Auth header received:', authHeader ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access denied - No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error('❌ JWT Verification Error:', err.message);
      return res.status(403).json({ error: 'Invalid token: ' + err.message });
    }
    console.log('✅ Token verified successfully for user:', user.id);
    req.user = user;
    next();
  });
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ========== RENTER LOGIN WITH USERNAME ==========
router.post('/renter-login', async (req, res) => {
  try {
    let { phone, username } = req.body;
    
    // Clean phone number
    phone = phone.replace(/\D/g, '');
    
    // Clean username
    username = username.toLowerCase().trim();
    
    console.log('📱 Renter login attempt:', { phone, username });
    
    // Validate username
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    // Validate phone
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    
    // Check if username is already taken by another user
    const existingUserByUsername = db.getUserByUsername(username);
    if (existingUserByUsername && existingUserByUsername.phone !== phone) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database with username
    db.saveOTP(phone, otp);
    
    console.log('🔢 OTP for', phone, ':', otp);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
    
  } catch (error: any) {
    console.error('Renter login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== VERIFY OTP AND LOGIN/REGISTER ==========
router.post('/renter-verify', async (req, res) => {
  try {
    let { phone, username, otp } = req.body;
    
    phone = phone.replace(/\D/g, '');
    username = username.toLowerCase().trim();
    
    console.log('✅ Verifying OTP for:', { phone, username });
    
    // Verify OTP
    const isValidOTP = db.verifyOTP(phone, otp);
    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Check if user exists
    let user = db.getUserByPhone(phone);
    let isNewUser = false;
    
    if (!user) {
      // Create new user with username
      console.log('🆕 Creating new user for:', phone);
      
      // Generate a fullname from username
      const fullname = username.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      
      user = db.createUser({
        username: username,
        fullname: fullname || username,
        phone: phone,
        role: 'client',
        verified: true,
        createdAt: new Date().toISOString()
      });
      
      isNewUser = true;
    } else {
      // Update username if not set
      if (!user.username) {
        user.username = username;
        db.updateUserUsername(user.id, username);
      }
    }
    
    console.log('✅ User found/created:', user.id, user.role);
    
    // Create token payload
    const payload = { 
      id: user.id, 
      phone: user.phone, 
      role: user.role,
      username: user.username 
    };
    
    // Generate JWT
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        phone: user.phone,
        role: user.role,
        isNewUser: isNewUser
      }
    });
    
  } catch (error: any) {
    console.error('Renter verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== STAFF/ADMIN LOGIN ==========
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    console.log('🔑 Staff/Admin login attempt for:', identifier);
    
    // Find user by email OR phone
    const user = db.getUserByIdentifier(identifier);
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is staff or admin
    if (user.role !== 'admin' && user.role !== 'staff') {
      console.log('❌ Not authorized - role:', user.role);
      return res.status(403).json({ error: 'Access denied. Staff/Admin only.' });
    }
    
    // Check password (for staff/admin only)
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ Login successful for:', user.email);
    
    // Create token payload
    const payload = { 
      id: user.id, 
      email: user.email,
      phone: user.phone, 
      role: user.role,
      username: user.username 
    };
    
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        username: user.username
      }
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== REQUEST OTP (Legacy - kept for compatibility) ==========
router.post('/request-otp', async (req, res) => {
  try {
    let { phone } = req.body;
    phone = phone.replace(/\D/g, '');
    
    console.log('📞 OTP requested for phone:', phone);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    db.saveOTP(phone, otp);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
    
  } catch (error: any) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== REGISTER (Legacy - kept for compatibility) ==========
router.post('/register', async (req, res) => {
  try {
    const { fullname, phone, password, otp } = req.body;
    
    console.log('📝 Registration attempt for:', phone);
    
    const isValidOTP = db.verifyOTP(phone, otp);
    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    const existingUser = db.getUserByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = db.createUser({
      fullname,
      phone,
      password: hashedPassword,
      role: 'client',
      verified: true,
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ User created:', newUser.id);
    
    const payload = { 
      id: newUser.id, 
      phone: newUser.phone, 
      role: newUser.role 
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        fullname: newUser.fullname,
        phone: newUser.phone,
        role: newUser.role
      }
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GET CURRENT USER ==========
router.get('/me', authenticateToken, (req: any, res) => {
  try {
    const user = db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      phone: user.phone,
      email: user.email,
      role: user.role,
      address: user.address,
      facebook: user.facebook,
      createdAt: user.createdAt
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== RESET PASSWORD REQUEST ==========
router.post('/reset-password-request', async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanPhone = phone.replace(/\D/g, '');
    
    const user = db.getUserByPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({ error: 'Phone number not registered' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    db.saveOTP(cleanPhone, otp);
    
    console.log('🔑 Password reset OTP for', cleanPhone, ':', otp);
    
    res.json({ 
      success: true, 
      message: 'OTP sent for password reset',
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    const cleanPhone = phone.replace(/\D/g, '');
    
    const isValidOTP = db.verifyOTP(cleanPhone, otp);
    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    const user = db.getUserByPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // You need to implement this method in database.ts
    if (db.updateUserPassword) {
      db.updateUserPassword(user.id, hashedPassword);
    }
    
    res.json({ success: true, message: 'Password reset successful' });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
