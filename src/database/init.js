const db = require("./db");

const initDatabase = () => {
    // 1. Tabel Produk
    db.prepare(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            jumlah INTEGER NOT NULL,
            harga INTEGER NOT NULL,
            status TEXT DEFAULT 'open',
            category TEXT DEFAULT 'login'
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

    // 3. Tabel Blacklist
    db.prepare(`
        CREATE TABLE IF NOT EXISTS blacklist (
            user_id TEXT PRIMARY KEY,
            reason TEXT,
            admin_id TEXT,
            timestamp INTEGER
        )
    `).run();

    // --- PERBAIKAN DI SINI ---
    // 4. Cek & Reset Tabel Flash Sale jika masih pakai struktur lama
    try {
        // Cek apakah kolom 'product_id' ada (tanda tabel lama)
        const check = db.prepare("PRAGMA table_info(flash_sales)").all();
        const isOldTable = check.some(col => col.name === 'product_id');
        
        if (isOldTable) {
            console.log("⚠️ Struktur tabel Flash Sale lama terdeteksi. Menghapus & membuat ulang...");
            db.prepare("DROP TABLE flash_sales").run();
        }
    } catch (e) {
        // Abaikan error jika tabel belum ada
    }

    // Buat Tabel Flash Sale Baru (Dengan product_name)
    db.prepare(`
        CREATE TABLE IF NOT EXISTS flash_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT,      -- Kolom Baru
            original_price INTEGER, -- Kolom Baru
            flash_price INTEGER,
            stock INTEGER,
            end_time INTEGER,
            message_id TEXT,
            channel_id TEXT,
            status TEXT DEFAULT 'active'
        )
    `).run();

    // 5. Tabel Flash Users
    db.prepare(`
        CREATE TABLE IF NOT EXISTS flash_users (
            flash_id INTEGER,
            user_id TEXT,
            channel_id TEXT PRIMARY KEY,
            expiry_time INTEGER,
            status TEXT DEFAULT 'pending' 
        )
    `).run();

    console.log("✅ Database siap (Flash Sale Table Updated).");
};

module.exports = initDatabase;