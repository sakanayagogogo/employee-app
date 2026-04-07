const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'widget_type'");
        console.log('Current Enum Values:', res.rows.map(r => r.enumlabel));

        // Let's also check if 'FORM' is already there (unlikely)
        if (!res.rows.find(r => r.enumlabel === 'FORM')) {
            console.log('FORM is NOT in enum. Adding it...');
            await client.query("ALTER TYPE widget_type ADD VALUE 'FORM'");
            console.log('Successfully added FORM to widget_type enum.');
        } else {
            console.log('FORM is already in enum.');
        }

    } catch (err) {
        console.error('Error modifying enum:', err);
    } finally {
        await client.end();
    }
}
run();
