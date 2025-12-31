const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");
const db = require("../../database/db");

module.exports = {
    name: "edit",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id, field, value] = args;
        if (!id || !field || !value)
            return message.reply("Format: !editproduct <ID> <jumlah|harga> <value>");

        if (!["jumlah", "harga"].includes(field))
            return message.reply("❌ Field hanya boleh jumlah atau harga.");

        // Update database
        const result = db.prepare(`UPDATE products SET ${field} = ? WHERE id = ?`)
                         .run(Number(value), id);

        if (result.changes === 0) return message.reply("❌ Produk tidak ditemukan.");

        await updatePricelist(message.guild);
        message.reply("✏️ Produk berhasil diperbarui.");
    }
};