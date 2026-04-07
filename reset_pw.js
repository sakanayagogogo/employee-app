
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres';

async function resetPassword() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to the database.');

        const employeeNumber = '000001';
        const newPassword = 'Admin1234!';
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(newPassword, salt);

        console.log(`Updating password for user ${employeeNumber}...`);
        const res = await client.query(
            'UPDATE users SET password_hash = $1 WHERE employee_number = $2 RETURNING id',
            [hash, employeeNumber]
        );

        if (res.rowCount > 0) {
            console.log('Password updated successfully.');
        } else {
            console.log('User not found. Inserting new admin user...');
            await client.query(
                `INSERT INTO users (employee_number, name, email, role, store_id, employment_type, password_hash, is_active)
         VALUES ($1, $2, $3, $4, (SELECT id FROM stores WHERE code = 'HQ'), $5, $6, TRUE)`,
                [employeeNumber, '管理者 太郎', 'admin@example.com', 'HQ_ADMIN', 'EMPLOYEE', hash]
            );
            console.log('Admin user created successfully.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
        console.log('Disconnected.');
    }
}

resetPassword();
