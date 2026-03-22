import * as fs from 'fs';
import * as path from 'path';

// Simple JSON database
class JsonDB {
  private filePath: string;
  private data: any;

  constructor(filename: string) {
    this.filePath = path.join(__dirname, '../../database', filename);
    console.log('📁 Database path:', this.filePath);
    this.load();
  }
private load() {
  try {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(fileContent);
      
      // Ensure all arrays exist
      if (!this.data.walkins) this.data.walkins = [];
      if (!this.data.users) this.data.users = [];
      if (!this.data.vehicles) this.data.vehicles = [];
      if (!this.data.bookings) this.data.bookings = [];
      if (!this.data.otps) this.data.otps = [];
      
    } else {
      // Initialize new database
      this.data = {
        users: [],
        vehicles: [],
        bookings: [],
        walkins: [],  // Make sure this is here
        otps: [],
        content: {}
      };
      this.save();
    }
  } catch (error) {
    console.error('Error loading database:', error);
    this.data = { 
      users: [], 
      vehicles: [], 
      bookings: [], 
      walkins: [],  // And here
      otps: [], 
      content: {} 
    };
  }
}
  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
      console.log('💾 Database saved');
    } catch (error) {
      console.error('❌ Error saving database:', error);
    }
  }

  // ========== VEHICLE METHODS ==========
  getVehicles() {
    return this.data.vehicles || [];
  }

  getVehicle(id: number) {
    return this.data.vehicles?.find((v: any) => v.id === id);
  }

  addVehicle(vehicleData: any) {
    if (!this.data.vehicles) this.data.vehicles = [];
    
    const newId = this.data.vehicles.length > 0 
      ? Math.max(...this.data.vehicles.map((v: any) => v.id)) + 1 
      : 1;
    
    const newVehicle = { 
      id: newId,
      ...vehicleData
    };
    
    this.data.vehicles.push(newVehicle);
    this.save();
    return newVehicle;
  }

  updateVehicle(id: number, updates: any) {
    const index = this.data.vehicles?.findIndex((v: any) => v.id === id);
    if (index !== -1 && index !== undefined) {
      this.data.vehicles[index] = { 
        ...this.data.vehicles[index], 
        ...updates 
      };
      this.save();
      return this.data.vehicles[index];
    }
    return null;
  }

  deleteVehicle(id: number) {
    const index = this.data.vehicles?.findIndex((v: any) => v.id === id);
    if (index !== -1 && index !== undefined) {
      this.data.vehicles.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // ========== USER METHODS ==========
  getUsers() {
    return this.data.users || [];
  }

  getUserByIdentifier(identifier: string) {
    return this.data.users?.find((u: any) => 
      u.email === identifier || u.phone === identifier || u.username === identifier
    );
  }

  getUserByPhone(phone: string) {
    return this.data.users?.find((u: any) => u.phone === phone);
  }

  getUserById(id: number) {
    return this.data.users?.find((u: any) => u.id === id);
  }

  getUserByUsername(username: string) {
    return this.data.users?.find((u: any) => u.username === username);
  }

  getUserByEmail(email: string) {
    return this.data.users?.find((u: any) => u.email === email);
  }

  createUser(userData: any) {
    if (!this.data.users) this.data.users = [];
    
    const newId = this.data.users.length > 0 
      ? Math.max(...this.data.users.map((u: any) => u.id)) + 1 
      : 1;
    
    const newUser = { 
      id: newId, 
      verified: true,
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUserUsername(id: number, username: string) {
    if (!this.data.users) return false;
    const index = this.data.users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      this.data.users[index].username = username;
      this.save();
      return true;
    }
    return false;
  }

  updateUserPassword(id: number, hashedPassword: string) {
    if (!this.data.users) return false;
    const index = this.data.users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      this.data.users[index].password = hashedPassword;
      this.save();
      return true;
    }
    return false;
  }

  updateUserRole(id: number, role: string) {
    if (!this.data.users) return null;
    const index = this.data.users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      this.data.users[index].role = role;
      this.save();
      return this.data.users[index];
    }
    return null;
  }

  verifyUser(phone: string) {
    const user = this.getUserByPhone(phone);
    if (user) {
      user.verified = true;
      this.save();
      return user;
    }
    return null;
  }
// ========== WALK-IN METHODS ==========
createWalkin(data: any) {
  if (!this.data.walkins) this.data.walkins = [];
  
  const newId = this.data.walkins.length > 0 
    ? Math.max(...this.data.walkins.map((w: any) => w.id)) + 1 
    : 1;
  
  const newWalkin = {
    id: newId,
    bookingNumber: 'WK' + Date.now() + Math.floor(Math.random() * 1000),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...data
  };
  
  this.data.walkins.push(newWalkin);
  this.save();
  return newWalkin;
}

getWalkins() {
  return this.data.walkins || [];
}

getWalkinById(id: number) {
  return this.data.walkins?.find((w: any) => w.id === id);
}

updateWalkin(id: number, updates: any) {
  const index = this.data.walkins?.findIndex((w: any) => w.id === id);
  if (index !== -1 && index !== undefined) {
    this.data.walkins[index] = { ...this.data.walkins[index], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.walkins[index];
  }
  return null;
}

getWalkinsByStaff(staffId: number) {
  return this.data.walkins?.filter((w: any) => w.assignedStaffId === staffId) || [];
}

getPendingWalkins() {
  return this.data.walkins?.filter((w: any) => w.status === 'pending') || [];
}
  // ========== OTP METHODS ==========
  saveOTP(phone: string, otp: string) {
    if (!this.data.otps) this.data.otps = [];
    
    // Remove old OTPs for this phone
    this.data.otps = this.data.otps.filter((o: any) => o.phone !== phone);
    
    // Save new OTP with expiry (5 minutes)
    this.data.otps.push({
      phone,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    this.save();
  }

  verifyOTP(phone: string, otp: string) {
    if (!this.data.otps) return false;
    
    const otpRecord = this.data.otps.find(
      (o: any) => o.phone === phone && o.otp === otp && o.expiresAt > Date.now()
    );
    
    if (otpRecord) {
      // Remove used OTP
      this.data.otps = this.data.otps.filter((o: any) => o.phone !== phone);
      this.save();
      return true;
    }
    return false;
  }

  // ========== BOOKING METHODS ==========
  createBooking(bookingData: any) {
    if (!this.data.bookings) this.data.bookings = [];
    
    const newId = this.data.bookings.length > 0 
      ? Math.max(...this.data.bookings.map((b: any) => b.id)) + 1 
      : 1;
    
    const newBooking = {
      id: newId,
      bookingNumber: 'BK' + Date.now() + Math.floor(Math.random() * 1000),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...bookingData
    };
    
    this.data.bookings.push(newBooking);
    this.save();
    return newBooking;
  }

  getBookings() {
    return this.data.bookings || [];
  }

  getBookingById(id: number) {
    return this.data.bookings?.find((b: any) => b.id === id);
  }

  getBookingByNumber(bookingNumber: string) {
    return this.data.bookings?.find((b: any) => b.bookingNumber === bookingNumber);
  }

  getPendingBookings() {
    return this.data.bookings?.filter((b: any) => b.status === 'pending') || [];
  }

  updateBookingStatus(id: number, status: string, additionalData: any = {}) {
    const index = this.data.bookings?.findIndex((b: any) => b.id === id);
    if (index !== -1 && index !== undefined) {
      this.data.bookings[index] = {
        ...this.data.bookings[index],
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
      };
      this.save();
      return this.data.bookings[index];
    }
    return null;
  }

  getBookingsByUser(userId: number) {
    return this.data.bookings?.filter((b: any) => b.userId === userId) || [];
  }

  // ========== CONTENT METHODS ==========
  getContent() {
    return this.data.content || {};
  }

  updateContent(content: any) {
    this.data.content = { ...this.data.content, ...content };
    this.save();
    return this.data.content;
  }

  // ========== STATS METHODS ==========
  getStats() {
    return {
      totalVehicles: this.data.vehicles?.length || 0,
      totalUsers: this.data.users?.length || 0,
      totalBookings: this.data.bookings?.length || 0,
      pendingBookings: this.data.bookings?.filter((b: any) => b.status === 'pending').length || 0,
      activeBookings: this.data.bookings?.filter((b: any) => b.status === 'active').length || 0
    };
  }
}

// Create and export database instance
const db = new JsonDB('abi-rental.json');
console.log('✅ Database ready with user, vehicle, booking, and content support');

export default db;
