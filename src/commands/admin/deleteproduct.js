const fs = require("fs");
const path = require("path");
const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");

module.exports = {
    name: "del",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id] = args;
        if (!id)
            return message.reply("Format: !deleteproduct <ID>");

        const filePath = path.join(__dirname, "../../data/products.json");
        let products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        const exists = products.some(p => p.id === id);
        if (!exists) return message.reply("❌ Produk tidak ditemukan.");

        products = products.filter(p => p.id !== id);
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

        await updatePricelist(message.guild);
        message.reply("🗑️ Produk berhasil dihapus.");
    }
};
