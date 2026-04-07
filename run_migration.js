import { readFileSync } from 'fs';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const sql = readFileSync('db/002_add_announcement_category.sql', 'utf8');
    try {
        await pool.query(sql);
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed', err);
    } finally {
        pool.end();
    }
}

runMigration();
