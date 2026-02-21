import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(__dirname, '../../database/abi-rental.json');

const vehicles = [
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
  },
  {
    id: 4,
    name: 'Nissan Urvan',
    type: 'van',
    price_per_day: 75,
    seats: 12,
    transmission: 'manual',
    availability: true,
    image_url: 'https://via.placeholder.com/300x200?text=Nissan+Urvan'
  },
  {
    id: 5,
    name: 'Suzuki Swift',
    type: 'car',
    price_per_day: 28,
    seats: 5,
    transmission: 'manual',
    availability: true,
    image_url: 'https://via.placeholder.com/300x200?text=Suzuki+Swift'
  },
  {
    id: 6,
    name: 'Mitsubishi Pajero',
    type: 'suv',
    price_per_day: 120,
    seats: 7,
    transmission: 'automatic',
    availability: true,
    image_url: 'https://via.placeholder.com/300x200?text=Mitsubishi+Pajero'
  }
];

const data = {
  vehicles: vehicles,
  bookings: []
};

// Write to file
try {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  console.log('✅ Database seeded successfully with', vehicles.length, 'vehicles');
  console.log('📁 File location:', dbPath);
  
  // Verify the file was written
  const verification = fs.readFileSync(dbPath, 'utf-8');
  const parsed = JSON.parse(verification);
  console.log('✅ Verification - Vehicles in DB:', parsed.vehicles.length);
} catch (error) {
  console.error('❌ Error seeding database:', error);
}
