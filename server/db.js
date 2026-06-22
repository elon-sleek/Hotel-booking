const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'bookings.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create bookings table
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    guest_name TEXT NOT NULL,
    id_image_path TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_days INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create admin table
db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pin_hash TEXT NOT NULL
  );
`);

// Seed default admin PIN if not exists
const adminRow = db.prepare('SELECT id FROM admin WHERE id = 1').get();
if (!adminRow) {
  const defaultPin = process.env.DEFAULT_ADMIN_PIN || '1234';
  const hash = bcrypt.hashSync(defaultPin, 10);
  db.prepare('INSERT INTO admin (id, pin_hash) VALUES (1, ?)').run(hash);
  console.log('Default admin PIN seeded (1234). Please change it after first login.');
}

module.exports = db;
