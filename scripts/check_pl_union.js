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
    const res = await pool.query("SELECT category, code, name, is_non_union FROM master_data WHERE name LIKE '%PL%' OR name LIKE '%非組合員%'");
    fs.writeFileSync(path.join(__dirname, '../pl_union.json'), JSON.stringify(res.rows, null, 2), 'utf8');
    await pool.end();
}

main().catch(console.error);
