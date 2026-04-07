const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, name, employee_number, role FROM users WHERE employee_number = '210036'");
        const user = res.rows[0];
        console.log('Role:', `'${user.role}'`, 'Length:', user.role.length);
        console.log('Is STORE_ADMIN:', user.role === 'STORE_ADMIN');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
