const fs = require("fs");
const path = require("path");
const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");

module.exports = {
    name: "edit",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id, field, value] = args;
        if (!id || !field || !value)
            return message.reply("Format: !editproduct <ID> <jumlah|harga> <value>");

        const filePath = path.join(__dirname, "../../data/products.json");
        const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        const product = products.find(p => p.id === id);
        if (!product) return message.reply("❌ Produk tidak ditemukan.");

        if (!["jumlah", "harga"].includes(field))
            return message.reply("❌ Field hanya boleh jumlah atau harga.");

        product[field] = Number(value);
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

        await updatePricelist(message.guild);
        message.reply("✏️ Produk berhasil diperbarui.");
    }
};
