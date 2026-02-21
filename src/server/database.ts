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
      // Create directory if it doesn't exist
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 Created database directory');
      }

      // Load or create file
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log('✅ Loaded existing database with', this.data.vehicles?.length || 0, 'vehicles');
      } else {
        console.log('🆕 Creating new database file');
        // Initialize with sample data
        this.data = {
          vehicles: [
            {
              id: 1,
              name: 'Toyota Vitz',
              type: 'car',
              price_per_day: 30,
              seats: 5,
              transmission: 'manual',
              availability: true,
              image_url: 'https://via.placeholder.com/300x200?text=Toyota+Vitz'
            },
            {
              id: 2,
              name: 'Honda Fit',
              type: 'car',
              price_per_day: 35,
              seats: 5,
              transmission: 'automatic',
              availability: true,
              image_url: 'https://via.placeholder.com/300x200?text=Honda+Fit'
            },
            {
              id: 3,
              name: 'Toyota Hiace',
              type: 'van',
              price_per_day: 80,
              seats: 15,
              transmission: 'manual',
              availability: true,
              image_url: 'https://via.placeholder.com/300x200?text=Toyota+Hiace'
            }
          ],
          bookings: []
        };
        this.save();
        console.log('✅ Created new database with sample vehicles');
      }
    } catch (error) {
      console.error('❌ Error loading database:', error);
      this.data = { vehicles: [], bookings: [] };
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

  // Vehicle methods
  getVehicles() {
    return this.data.vehicles || [];
  }

  getVehicle(id: number) {
    return this.data.vehicles.find((v: any) => v.id === id);
  }

  addVehicle(vehicle: any) {
    const newId = Math.max(...this.data.vehicles.map((v: any) => v.id), 0) + 1;
    const newVehicle = { id: newId, ...vehicle };
    this.data.vehicles.push(newVehicle);
    this.save();
    return newVehicle;
  }

  updateVehicle(id: number, updates: any) {
    const index = this.data.vehicles.findIndex((v: any) => v.id === id);
    if (index !== -1) {
      this.data.vehicles[index] = { ...this.data.vehicles[index], ...updates };
      this.save();
      return this.data.vehicles[index];
    }
    return null;
  }

  deleteVehicle(id: number) {
    const index = this.data.vehicles.findIndex((v: any) => v.id === id);
    if (index !== -1) {
      this.data.vehicles.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Booking methods
  createBooking(booking: any) {
    if (!this.data.bookings) {
      this.data.bookings = [];
    }
    
    // Generate new ID
    const newId = this.data.bookings.length > 0 
      ? Math.max(...this.data.bookings.map((b: any) => b.id)) + 1 
      : 1;
    
    // Create booking with additional fields
    const newBooking = { 
      id: newId,
      bookingNumber: 'BK' + Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      ...booking 
    };
    
    this.data.bookings.push(newBooking);
    this.save();
    return newBooking;
  }

  getBookings() {
    return this.data.bookings || [];
  }

  getBookingByNumber(bookingNumber: string) {
    return this.data.bookings?.find((b: any) => b.bookingNumber === bookingNumber);
  }

  updateBookingStatus(id: number, status: string) {
    const index = this.data.bookings?.findIndex((b: any) => b.id === id);
    if (index !== -1 && index !== undefined) {
      this.data.bookings[index].status = status;
      this.save();
      return this.data.bookings[index];
    }
    return null;
  }

  getBookingsByDate(date: string) {
    return this.data.bookings?.filter((b: any) => 
      b.pickupDate === date || b.returnDate === date
    ) || [];
  }
}

// Create and export database instance
const db = new JsonDB('abi-rental.json');
console.log('✅ JSON Database ready');

export default db;