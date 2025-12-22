const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = () => {
    const embed = new EmbedBuilder()
        .setTitle("🛒 SYRBLOX — Order Robux")
        .setColor("#00FF99")
        .setDescription(
            "**Selamat datang di SYRBLOX!**\n\n" +
            "Klik tombol **ORDER** di bawah untuk memulai pembelian Robux.\n\n" +
            "📌 Proses cepat & otomatis\n" +
            "📌 Via login\n" +
            "📌 Aman & terpercaya"
        )
        .setFooter({ text: "SYRBLOX Official" });

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("order_start")
            .setLabel("ORDER")
            .setStyle(ButtonStyle.Success)
    );

    return { embed, button };
};
