const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function update() {
    await client.connect();
    const res = await client.query("UPDATE master_data SET is_non_union = TRUE WHERE category = 'union_role' AND code = '88'");
    console.log(`Updated ${res.rowCount} rows.`);
    await client.end();
}
update();
