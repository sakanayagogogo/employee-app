const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        
        // Add status column to widget_responses
        await client.query(`
            ALTER TABLE widget_responses 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING'
        `);
        console.log('Added status column to widget_responses.');

        // Update existing rows to PROCESSED if we want, or PENDING
        // Let's keep them PENDING for now.

    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}
run();
