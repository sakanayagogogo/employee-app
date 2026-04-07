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
    const res = await pool.query("SELECT category, code, name FROM master_data WHERE name LIKE '%書記%' OR name LIKE '%議長%'");
    res.rows.forEach(r => {
        console.log(`${r.category} | ${r.code} | ${r.name}`);
    });
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
