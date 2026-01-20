const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const paymentMethods = require("../../utils/paymentMethods");

module.exports = {
    customId: "select_flash_payment",
    async execute(interaction, client) {
        const paymentKey = interaction.values[0];
        const paymentData = paymentMethods[paymentKey];

        // Update Invoice Embed yang sudah ada di chat
        const msg = interaction.message;
        const oldEmbed = EmbedBuilder.from(msg.embeds[0]);
        
        // Tambahkan Info Pembayaran ke Invoice
        // (Sederhana saja, tempel di deskripsi atau field baru)
        oldEmbed.addFields({ name: '💳 Bayar Via', value: paymentData.label, inline: true });

        // Embed Detail Transfer
        const paymentEmbed = new EmbedBuilder()
            .setTitle("💳 INSTRUKSI TRANSFER")
            .setColor("#00BFFF");

        if (paymentData.type === "ewallet") {
            paymentEmbed.setDescription(`Transfer ke **${paymentData.label}**: \`${paymentData.number}\` (A/N ${paymentData.name})`);
        } else if (paymentData.type === "bank") {
            paymentEmbed.setDescription(`Transfer ke **${paymentData.bank}**: \`${paymentData.number}\` (A/N ${paymentData.name})`);
        } else if (paymentData.type === "qris") {
            paymentEmbed.setDescription(`Scan QRIS di bawah`).setImage(paymentData.image);
        }

        const uploadRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("upload_bukti")
                .setLabel("Sudah Bayar")
                .setStyle(ButtonStyle.Success)
        );

        // Hapus Dropdown, ganti dengan instruksi transfer
        await interaction.update({ embeds: [oldEmbed, paymentEmbed], components: [uploadRow] });
    }
};