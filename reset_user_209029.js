const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres';

async function reset() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const employeeNumber = '209029';
        const newPassword = '19860705'; // Birthday YYYYMMDD
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(newPassword, salt);

        console.log(`Resetting password for user ${employeeNumber} to ${newPassword}...`);
        const res = await client.query(
            "UPDATE users SET password_hash = $1, must_change_pw = TRUE WHERE employee_number = $2 RETURNING id",
            [hash, employeeNumber]
        );

        if (res.rowCount > 0) {
            console.log('Password reset successfully.');
        } else {
            console.log('User not found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
reset();
