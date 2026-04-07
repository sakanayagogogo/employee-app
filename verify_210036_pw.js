const bcrypt = require('bcryptjs');
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        await client.connect();
        const res = await client.query("SELECT password_hash FROM users WHERE employee_number = '210036'");
        const hash = res.rows[0].password_hash;
        
        const tests = ["Admin1234!", "210036", "password"];
        for (const pw of tests) {
            if (await bcrypt.compare(pw, hash)) {
                console.log(`MATCH FOUND: ${pw}`);
                return;
            }
        }
        console.log("No match found.");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
