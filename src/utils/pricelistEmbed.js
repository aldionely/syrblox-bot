const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");

module.exports = () => {
    // Ambil semua produk, urutkan dari harga termurah
    const products = db.prepare("SELECT * FROM products ORDER BY harga ASC").all();
    const formatRupiah = (n) => new Intl.NumberFormat("id-ID").format(n);

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
            `**Harga** : Rp ${formatRupiah(p.harga)}\n` +
            `**Status** : ${p.status.toUpperCase()}`
        ).join("\n**—————————————————**\n")
    );

    return embed;
};