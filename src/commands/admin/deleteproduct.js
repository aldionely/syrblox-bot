const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");
const db = require("../../database/db");

module.exports = {
    name: "del",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id] = args;
        if (!id) return message.reply("Format: !deleteproduct <ID>");

        const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);

        if (result.changes === 0) return message.reply("❌ Produk tidak ditemukan.");

        await updatePricelist(message.guild);
        message.reply("🗑️ Produk berhasil dihapus.");
    }
};