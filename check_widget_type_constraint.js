const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name, column_name, data_type, udt_name, column_default
            FROM information_schema.columns 
            WHERE table_name = 'portal_widgets' AND column_name = 'type'
        `);
        console.log('Column Schema:', res.rows[0]);

        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid) as def
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'portal_widgets'::regclass
        `);
        console.log('Constraints:', constraints.rows);

        // Check for specific check constraint on type
        const checkType = constraints.rows.find(c => c.def.includes('type'));
        if (checkType) {
            console.log('Found type constraint:', checkType.def);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
