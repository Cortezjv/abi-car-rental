const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function resetPasswords() {
    try {
        const dbPath = path.join(__dirname, '../database/abi-rental.json');
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Hash admin password
        const adminPassword = await bcrypt.hash('admin123', 10);
        // Hash staff password
        const staffPassword = await bcrypt.hash('staff123', 10);
        
        // Update users with hashed passwords
        data.users = data.users.map(user => {
            if (user.email === 'admin@abirentals.com') {
                return { ...user, password: adminPassword };
            }
            if (user.email === 'staff@abirentals.com') {
                return { ...user, password: staffPassword };
            }
            return user;
        });
        
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log('✅ Passwords reset successfully');
        console.log('Admin: admin@abirentals.com / admin123');
        console.log('Staff: staff@abirentals.com / staff123');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

resetPasswords();
