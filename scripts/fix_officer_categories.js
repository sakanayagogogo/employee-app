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

const centralRoles = [
    { code: '31', name: '中央執行委員長', sort: 31 },
    { code: '32', name: '中央執行副委員長', sort: 32 },
    { code: '33', name: '中央執行書記長', sort: 33 },
    { code: '34', name: '中央執行副書記長', sort: 34 },
    { code: '35', name: '中央執行委員', sort: 35 },
];

const branchRoles = [
    { code: '11', name: '支部長', sort: 11 },
    { code: '14', name: 'PL委員', sort: 14 },
    { code: '19', name: 'PA委員', sort: 19 },
];

async function main() {
    console.log('Synchronizing categories correctly...');
    
    // For Central: ensure they only exist in 'union_role'
    for (const r of centralRoles) {
        // Delete from other categories if they exist (except what we want)
        await pool.query("DELETE FROM master_data WHERE code = $1 AND category != 'union_role'", [r.code]);
        // Upsert into union_role
        await pool.query(
            `INSERT INTO master_data (category, code, name, sort_order) 
             VALUES ('union_role', $1, $2, $3)
             ON CONFLICT (category, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
            [r.code, r.name, r.sort]
        );
    }
    
    // For Branch: ensure they only exist in 'branch_officer'
    for (const r of branchRoles) {
        // Delete from other categories if they exist
        await pool.query("DELETE FROM master_data WHERE code = $1 AND category != 'branch_officer'", [r.code]);
        // Upsert into branch_officer
        await pool.query(
            `INSERT INTO master_data (category, code, name, sort_order) 
             VALUES ('branch_officer', $1, $2, $3)
             ON CONFLICT (category, code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order`,
            [r.code, r.name, r.sort]
        );
    }

    console.log('Migrating user columns...');
    // Data check: If someone has a code 11, 14, 19 in union_role, move it to union_role_branch
    await pool.query(`UPDATE users SET union_role_branch = union_role WHERE union_role IN ('11','14','19')`);
    await pool.query(`UPDATE users SET union_role = 'MEMBER' WHERE union_role IN ('11','14','19')`);
    
    // If someone has 31-35 in union_role_branch, move it back to union_role
    await pool.query(`UPDATE users SET union_role = union_role_branch WHERE union_role_branch IN ('31','32','33','34','35')`);
    await pool.query(`UPDATE users SET union_role_branch = NULL WHERE union_role_branch IN ('31','32','33','34','35')`);

    console.log('Done!');
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
