const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
    const res = await pool.query("SELECT id, name, group_id FROM stores LIMIT 5");
    console.log("Stores:", JSON.stringify(res.rows, null, 2));
    
    const res2 = await pool.query("SELECT id, name FROM groups");
    console.log("Groups:", JSON.stringify(res2.rows, null, 2));
    
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
