const db = require("./db");

const initDatabase = () => {
    // 1. Tabel Produk (Masih Global - atau mau per server juga? Untuk sekarang kita buat Global dulu biar admin pusat yang atur stok)
    // Jika mau tiap server punya produk beda, tambahkan guild_id di sini juga. 
    // TAPI biasanya bot store produknya terpusat.
    db.prepare(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            jumlah INTEGER NOT NULL,
            harga INTEGER NOT NULL,
            status TEXT DEFAULT 'open'
        )
    `).run();

    // 2. Tabel Configs (KITA UBAH DISINI)
    // Kita hapus tabel lama dulu biar bersih (hati-hati data setup hilang)
    // db.prepare("DROP TABLE IF EXISTS configs").run(); 
    // ^ Uncomment baris di atas jika kamu siap setup ulang dari awal (REKOMENDASI: DROP SAJA BIAR BERSIH)

    db.prepare(`
        CREATE TABLE IF NOT EXISTS configs (
            guild_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (guild_id, key)
        )
    `).run();

    console.log("✅ Tabel Database Multi-Server siap.");
};

module.exports = initDatabase;