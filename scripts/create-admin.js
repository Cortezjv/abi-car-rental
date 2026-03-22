const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function createAdmin() {
    try {
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const staffPassword = await bcrypt.hash('staff123', 10);
        
        // Read current database
        const dbPath = path.join(__dirname, '../database/abi-rental.json');
        let data = {};
        
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf8');
            data = JSON.parse(fileContent);
        }
        
        // Ensure users array exists
        if (!data.users) data.users = [];
        
        // Check if admin already exists
        const adminExists = data.users.some(function(u) { 
            return u.email === 'admin@abirentals.com'; 
        });
        
        const staffExists = data.users.some(function(u) { 
            return u.email === 'staff@abirentals.com'; 
        });
        
        if (!adminExists) {
            // Add admin
            data.users.push({
                id: data.users.length + 1,
                fullname: 'Admin User',
                email: 'admin@abirentals.com',
                phone: '+639123456789',
                password: adminPassword,
                role: 'admin',
                verified: true,
                createdAt: new Date().toISOString()
            });
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️ Admin user already exists');
        }
        
        if (!staffExists) {
            // Add staff
            data.users.push({
                id: data.users.length + 1,
                fullname: 'Staff User',
                email: 'staff@abirentals.com',
                phone: '+639123456790',
                password: staffPassword,
                role: 'staff',
                verified: true,
                createdAt: new Date().toISOString()
            });
            console.log('✅ Staff user created');
        } else {
            console.log('ℹ️ Staff user already exists');
        }
        
        // Save database
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log('💾 Database saved');
        console.log('\n📝 Login credentials:');
        console.log('Admin: admin@abirentals.com / admin123');
        console.log('Staff: staff@abirentals.com / staff123');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

createAdmin();
