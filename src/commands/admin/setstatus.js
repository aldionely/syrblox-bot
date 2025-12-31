const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");
const db = require("../../database/db");

module.exports = {
    name: "set",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id, status] = args;
        if (!id || !status) return message.reply("Format: !setstatus <ID> <open|close>");

        if (!["open", "close"].includes(status))
            return message.reply("❌ Status hanya open atau close.");

        const result = db.prepare("UPDATE products SET status = ? WHERE id = ?").run(status, id);

        if (result.changes === 0) return message.reply("❌ Produk tidak ditemukan.");

        await updatePricelist(message.guild);
        message.reply(`🔄 Status produk **${id}** diubah ke **${status.toUpperCase()}**.`);
    }
};