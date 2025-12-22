const fs = require("fs");
const path = require("path");
const config = require("../../config");
const updatePricelist = require("../../utils/updatePricelist");

module.exports = {
    name: "addproduct",
    async execute(message, args) {
        if (!config.adminIds.includes(message.author.id)) return;

        const [id, jumlah, harga] = args;
        if (!id || !jumlah || !harga)
            return message.reply("Format: !addproduct <ID> <JUMLAH> <HARGA>");

        const filePath = path.join(__dirname, "../../data/products.json");
        const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        if (products.find(p => p.id === id))
            return message.reply("❌ ID produk sudah ada.");

        products.push({
            id,
            jumlah: Number(jumlah),
            harga: Number(harga),
            status: "open"
        });

        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

        await updatePricelist(message.guild);
        message.reply("✅ Produk berhasil ditambahkan.");
    }
};
