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
        const hash = await bcrypt.hash('User1234!', 12);
        await client.query("UPDATE users SET password_hash = $1 WHERE employee_number = '090017'", [hash]);
        console.log('Password set for 090017');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
reset();
