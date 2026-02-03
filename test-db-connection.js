const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres';

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
});

client.connect()
  .then(() => {
    console.log('✅ Connected to Supabase!');
    return client.query('SELECT 1');
  })
  .then((res) => {
    console.log('✅ Query successful:', res.rows);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
