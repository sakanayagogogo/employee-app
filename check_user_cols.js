const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
