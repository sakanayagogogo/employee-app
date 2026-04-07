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

const roles = [
    { code: '11', name: '支部長', sort_order: 11, category: 'union_role' },
    { code: '14', name: 'PL委員', sort_order: 14, category: 'union_role' },
    { code: '19', name: 'PA委員', sort_order: 19, category: 'union_role' },
    { code: '31', name: '中央執行委員長', sort_order: 31, category: 'union_role' },
    { code: '32', name: '中央執行副委員長', sort_order: 32, category: 'union_role' },
    { code: '33', name: '中央執行書記長', sort_order: 33, category: 'union_role' },
    { code: '34', name: '中央執行副書記長', sort_order: 34, category: 'union_role' },
    { code: '35', name: '中央執行委員', sort_order: 35, category: 'union_role' },
];

async function main() {
    console.log('Starting sync...');
    for (const role of roles) {
        console.log(`Processing role: ${role.name} (${role.code})`);
        try {
            // Delete first then insert to avoid constraint issues if sort_order/whatever changes
            await pool.query(
                `DELETE FROM master_data WHERE category = $1 AND code = $2`,
                [role.category, role.code]
            );
            await pool.query(
                `INSERT INTO master_data (category, code, name, sort_order) VALUES ($1, $2, $3, $4)`,
                [role.category, role.code, role.name, role.sort_order]
            );
        } catch (err) {
            console.error(`Failed to process role ${role.name}: ${err.message}`);
        }
    }
    console.log('Finished sync!');
    await pool.end();
}

main().catch(err => {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
});
