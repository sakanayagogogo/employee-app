const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        console.log('--- HQ Admins ---');
        const hqAdmins = await client.query("SELECT employee_number, name FROM users WHERE role = 'HQ_ADMIN' LIMIT 1");
        console.log(hqAdmins.rows);

        console.log('--- Area Admins (Union Role 19/29/39/...) ---');
        const areaAdmins = await client.query("SELECT employee_number, name, union_role, store_id FROM users WHERE role = 'STORE_ADMIN' AND (union_role IN ('19', '29', '39', '49', '59', '69')) LIMIT 1");
        console.log(areaAdmins.rows);

        console.log('--- Simple Store Admins (Branch Leaders) ---');
        const storeAdmins = await client.query("SELECT employee_number, name, store_id FROM users WHERE role = 'STORE_ADMIN' AND (union_role NOT IN ('19', '29', '39', '49', '59', '69') OR union_role IS NULL) LIMIT 1");
        console.log(storeAdmins.rows);

        console.log('--- General Users ---');
        const generalUsers = await client.query("SELECT employee_number, name, store_id FROM users WHERE role = 'GENERAL' LIMIT 1");
        console.log(generalUsers.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
