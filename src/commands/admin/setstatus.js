const fs = require("fs");
const path = require("path");
const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");

module.exports = {
    name: "setstatus",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id, status] = args;
        if (!id || !status)
            return message.reply("Format: !setstatus <ID> <open|close>");

        if (!["open", "close"].includes(status))
            return message.reply("❌ Status hanya open atau close.");

        const filePath = path.join(__dirname, "../../data/products.json");
        const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        const product = products.find(p => p.id === id);
        if (!product) return message.reply("❌ Produk tidak ditemukan.");

        product.status = status;
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

        await updatePricelist(message.guild);
        message.reply(`🔄 Status produk **${id}** diubah ke **${status.toUpperCase()}**.`);
    }
};
