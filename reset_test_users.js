const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres';

async function reset() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        const hash = await bcrypt.hash('Admin1234!', 12);
        const users = ['000001', '000101', '210036', '001001'];
        for (const u of users) {
             await client.query('UPDATE users SET password_hash = $1, must_change_pw = FALSE WHERE employee_number = $2', [hash, u]);
             console.log(`Reset ${u}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
reset();
