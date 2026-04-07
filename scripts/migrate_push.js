const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:union26562664@db.qifxtufvvsihdhftcmii.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected. Running push notification migration...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id            SERIAL PRIMARY KEY,
                user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                endpoint      TEXT NOT NULL,
                p256dh        TEXT NOT NULL,
                auth          TEXT NOT NULL,
                user_agent    TEXT,
                created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(user_id, endpoint)
            );
        `);
        console.log('✅ push_subscriptions table created');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
        `);
        console.log('✅ index on push_subscriptions created');

        await client.query(`
            CREATE TABLE IF NOT EXISTS notification_preferences (
                user_id              INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                notify_announcements BOOLEAN NOT NULL DEFAULT TRUE,
                notify_inquiries     BOOLEAN NOT NULL DEFAULT TRUE,
                updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ notification_preferences table created');

        console.log('🎉 Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
run();
