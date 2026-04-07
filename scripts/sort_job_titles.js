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
    console.log('Sorting job titles by code...');
    
    // Select all job titles
    const res = await pool.query("SELECT id, code FROM master_data WHERE category = 'job_title'");
    
    for (const row of res.rows) {
        const numericCode = parseInt(row.code, 10);
        if (!isNaN(numericCode)) {
            console.log(`Setting sort_order for ${row.code} to ${numericCode}`);
            await pool.query("UPDATE master_data SET sort_order = $1 WHERE id = $2", [numericCode, row.id]);
        } else {
            console.log(`Skipping non-numeric code: ${row.code}`);
        }
    }
    
    console.log('Done!');
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
