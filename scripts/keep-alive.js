const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dns = require('node:dns');

// Fix for DNS resolution flakiness on some networks (especially EAI_AGAIN/IPv6 issues)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Load .env.local if it exists (local dev), otherwise default .env
const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
} else {
  require('dotenv').config();
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Error: DATABASE_URL is not set.");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase PostgreSQL database...");
    await client.connect();
    console.log("Connected. Executing keep-alive query...");
    const start = Date.now();
    const res = await client.query('SELECT NOW() as current_time');
    const duration = Date.now() - start;
    console.log(`Success! Server time: ${res.rows[0].current_time} (took ${duration}ms)`);
  } catch (error) {
    console.error("Keep-alive query failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
