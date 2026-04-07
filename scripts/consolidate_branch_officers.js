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
    { code: '11', name: '支部長', sort: 11 },
    { code: '14', name: 'PL委員', sort: 14 },
    { code: '19', name: 'PA委員', sort: 19 },
    { code: '31', name: '中央執行委員長', sort: 31 },
    { code: '32', name: '中央執行副委員長', sort: 32 },
    { code: '33', name: '中央執行書記長', sort: 33 },
    { code: '34', name: '中央執行副書記長', sort: 34 },
    { code: '35', name: '中央執行委員', sort: 35 },
];

async function main() {
    console.log('Resetting and consolidating all 8 roles into branch_officer category...');
    
    // First, migrate data if they were in union_role
    console.log('Migrating user data to union_role_branch column...');
    await pool.query(`UPDATE users SET union_role_branch = union_role WHERE union_role IN ('11','14','19','31', '32', '33', '34', '35')`);
    await pool.query(`UPDATE users SET union_role = NULL WHERE union_role IN ('11','14','19','31', '32', '33', '34', '35')`);

    // Second, clear existing master entries with these codes (wherever they are)
    await pool.query(`DELETE FROM master_data WHERE code IN ('11', '14', '19', '31', '32', '33', '34', '35')`);
    
    for (const r of roles) {
        console.log(`Inserting: ${r.name} (${r.code}) as branch_officer`);
        await pool.query(
            `INSERT INTO master_data (category, code, name, sort_order) VALUES ('branch_officer', $1, $2, $3)`,
            [r.code, r.name, r.sort]
        );
    }
    
    console.log('Done!');
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
