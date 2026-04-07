const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    await client.connect();
    const res = await client.query("SELECT * FROM information_schema.table_constraints tc JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name WHERE tc.table_name = 'users'");
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}
check();
