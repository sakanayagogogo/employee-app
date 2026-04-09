const { Pool } = require('pg');

async function check() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Announcements Categories ---');
        const res = await pool.query("SELECT category, is_published, COUNT(*) FROM announcements GROUP BY category, is_published");
        console.table(res.rows);

        console.log('\n--- Sample PRESIDENT Announcement ---');
        const res2 = await pool.query("SELECT * FROM announcements WHERE category = 'PRESIDENT' LIMIT 1");
        console.log(res2.rows[0]);

        console.log('\n--- Date Check for PRESIDENT ---');
        const res3 = await pool.query("SELECT id, title, start_at, end_at, NOW() as current_time FROM announcements WHERE category = 'PRESIDENT'");
        console.table(res3.rows);

    } catch (err) {
        console.error('Error during diagnostic:', err);
    } finally {
        await pool.end();
    }
}

check();
