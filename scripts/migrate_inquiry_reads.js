const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inquiry_reads (
                inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (inquiry_id, user_id)
            );
        `);
        console.log('inquiry_reads table created successfully');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
