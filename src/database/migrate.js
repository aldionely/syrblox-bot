const fs = require("fs");
const path = require("path");
const db = require("./db");

const migrateData = () => {
    console.log("🔄 Memulai migrasi data...");

    // --- 1. PINDAHKAN PRODUK ---
    const productsPath = path.join(__dirname, "../data/products.json");
    
    if (fs.existsSync(productsPath)) {
        try {
            const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
            const insert = db.prepare("INSERT OR REPLACE INTO products (id, jumlah, harga, status) VALUES (?, ?, ?, ?)");
            const insertMany = db.transaction((items) => {
                for (const item of items) insert.run(item.id, item.jumlah, item.harga, item.status);
            });

            insertMany(products);
            console.log(`✅ Berhasil memindahkan ${products.length} produk ke Database.`);
        } catch (error) {
            console.error("❌ Gagal migrasi produk:", error.message);
        }
    } else {
        console.log("⚠️ File products.json tidak ditemukan, melewati langkah ini.");
    }

    // --- 2. PINDAHKAN ID MESSAGE (Pricelist & Order) ---
    // Kita simpan ID pesan embed agar bot tetap bisa edit pesan lama
    const saveConfig = db.prepare("INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)");

    // Pricelist Message
    const pricelistPath = path.join(__dirname, "../data/pricelistMessage.json");
    if (fs.existsSync(pricelistPath)) {
        const data = JSON.parse(fs.readFileSync(pricelistPath, "utf-8"));
        if (data.messageId) {
            saveConfig.run("pricelist_message_id", data.messageId);
            console.log("✅ Pricelist Message ID tersimpan.");
        }
    }

    // Order Message
    const orderPath = path.join(__dirname, "../data/orderMessage.json");
    if (fs.existsSync(orderPath)) {
        const data = JSON.parse(fs.readFileSync(orderPath, "utf-8"));
        if (data.messageId) {
            saveConfig.run("order_message_id", data.messageId);
            console.log("✅ Order Message ID tersimpan.");
        }
    }

    console.log("🎉 MIGRASI SELESAI! Sekarang data sudah aman di SQLite.");
};

migrateData();