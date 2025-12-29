const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = () => {
    const embed = new EmbedBuilder()
        .setTitle("🛒 SYRBLOX — Order Robux")
        .setColor("#00FF99")
        .setDescription(
            "**Selamat datang di SYRBLOX!**\n\n" +
            "Klik tombol **BELI ROBUX** di bawah untuk memulai pembelian robux.\n\n" +
            "<:657267verified:1452335402605347056> Proses cepat 1-15 menit.\n" +
            "<:657267verified:1452335402605347056> Via login\n" +
            "<:657267verified:1452335402605347056> Aman & terpercaya"
        )
        .setFooter({ text: "SYRBLOX OFFICIAL " });

    const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("order_start")
            .setLabel("🛒 BELI ROBUX !")
            .setStyle(ButtonStyle.Success)
    );

    return { embed, button };
};
