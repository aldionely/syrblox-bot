const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");
const db = require("../../database/db");

module.exports = {
    name: "add",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id, jumlah, harga] = args;
        if (!id || !jumlah || !harga)
            return message.reply("Format: !addproduct <ID> <JUMLAH> <HARGA>");

        // Cek ID di database
        const exists = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
        if (exists) return message.reply("❌ ID produk sudah ada.");

        try {
            // Masukkan ke database
            db.prepare("INSERT INTO products (id, jumlah, harga, status) VALUES (?, ?, ?, 'open')")
              .run(id, Number(jumlah), Number(harga));
            
            await updatePricelist(message.guild);
            message.reply("✅ Produk berhasil ditambahkan.");
        } catch (err) {
            console.error(err);
            message.reply("❌ Gagal menyimpan ke database.");
        }
    }
};