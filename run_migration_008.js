const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query('ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL');
        console.log('Added recipient_id column');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_inquiries_recipient_id ON inquiries(recipient_id)');
        console.log('Created index');
        console.log('Migration 008 complete!');
    } catch (e) {
        console.error('Migration error:', e.message);
    } finally {
        await pool.end();
    }
}
run();
