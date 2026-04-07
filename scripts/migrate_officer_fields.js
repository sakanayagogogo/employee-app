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
    console.log('Adding union_role_branch column...');
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN union_role_branch character varying(20)`);
    } catch (e) {
        console.log('Column might already exist, skipping...');
    }
    
    console.log('Moving existing branch officer assignments...');
    await pool.query(`UPDATE users SET union_role_branch = union_role WHERE union_role IN ('11', '14', '19')`);
    await pool.query(`UPDATE users SET union_role = NULL WHERE union_role IN ('11', '14', '19')`);
    
    console.log('Splitting master data category...');
    // Update category in master_data
    await pool.query(`UPDATE master_data SET category = 'branch_officer' WHERE category = 'union_role' AND code IN ('11', '14', '19')`);
    
    console.log('Done!');
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
