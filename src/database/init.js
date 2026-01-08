const db = require("./db");

const initDatabase = () => {
    // 1. Tabel Produk
    db.prepare(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            jumlah INTEGER NOT NULL,
            harga INTEGER NOT NULL,
            status TEXT DEFAULT 'open'
        )
    `).run();

    // 2. Tabel Configs
    db.prepare(`
        CREATE TABLE IF NOT EXISTS configs (
            guild_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (guild_id, key)
        )
    `).run();

    // 3. Tabel Blacklist (BARU)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS blacklist (
            user_id TEXT PRIMARY KEY,
            reason TEXT,
            admin_id TEXT,
            timestamp INTEGER
        )
    `).run();

    console.log("✅ Tabel Database (Produk, Config, Blacklist) siap.");
};

module.exports = initDatabase;