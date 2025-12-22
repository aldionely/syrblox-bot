const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

module.exports = () => {
    const filePath = path.join(__dirname, "../data/products.json");
    const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const formatRupiah = (n) =>
    new Intl.NumberFormat("id-ID").format(n);

    const embed = new EmbedBuilder()
        .setTitle("<:Robux3:1452336572904243291> SYRBLOX — PRICELIST VIA LOGIN")
        .setColor("#00BFFF")
        .setFooter({ text: "SYRBLOX Official" });

    if (!products.length) {
        embed.setDescription("Belum ada produk.");
        return embed;
    }

    embed.setDescription(
        products.map(p =>
            `**ID** : ${p.id}\n` +
            `**Jumlah** : ${p.jumlah} <:robux2:1452335891950604330>\n` +
            `**Harga**  : Rp ${formatRupiah(p.harga)}\n` +
            `**Status** : ${p.status.toUpperCase()}`
        ).join("\n**—————————————————**\n")
    );

    return embed;
};
