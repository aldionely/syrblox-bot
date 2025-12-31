const Database = require('better-sqlite3');
const path = require('path');

// File database akan otomatis dibuat dengan nama 'syrblox.db' di folder utama
const dbPath = path.join(__dirname, '../../syrblox.db');
const db = new Database(dbPath);

// Mengaktifkan mode WAL (Write-Ahead Logging) agar lebih cepat dan aman dari corrupt
db.pragma('journal_mode = WAL');

console.log("✅ Database SQLite terhubung.");

module.exports = db;