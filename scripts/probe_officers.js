const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts[1].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
});

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

async function main() {
    console.log('Querying for users with officer roles in DB...');
    const res = await pool.query(
        "SELECT id, name, union_role, union_role_branch, store_id FROM users WHERE union_role IN ('11','14','19','31','32','33','34','35') OR union_role_branch IN ('11','14','19','31','32','33','34','35')"
    );
    console.log(`Found ${res.rows.length} officers:`);
    console.log(JSON.stringify(res.rows, null, 2));

    const mastersRes = await pool.query("SELECT category, code, name FROM master_data WHERE category IN ('union_role', 'branch_officer')");
    console.log('Officer Masters:');
    console.log(JSON.stringify(mastersRes.rows, null, 2));
    
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
