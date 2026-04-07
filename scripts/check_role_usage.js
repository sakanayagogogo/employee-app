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
    const res = await pool.query("SELECT COUNT(*) FROM users WHERE union_role_branch = '35'");
    console.log("Count for code 35 (branch):", res.rows[0].count);
    
    const res2 = await pool.query("SELECT COUNT(*) FROM users WHERE union_role = '35'");
    console.log("Count for code 35 (union):", res2.rows[0].count);
    
    const res3 = await pool.query("SELECT union_role, union_role_branch, COUNT(*) FROM users WHERE union_role IN ('19','29','39','49','59','69') GROUP BY union_role, union_role_branch");
    console.log("Area executives samples:", JSON.stringify(res3.rows, null, 2));

    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
