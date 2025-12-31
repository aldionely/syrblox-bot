const config = require("../../config");

module.exports = {
    customId: "payment_reject",
    async execute(interaction, client) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        const ticketId = interaction.customId.split(":")[1];
        const ticket = interaction.guild.channels.cache.get(ticketId);

        if (ticket) {
            client.waitingUpload.add(ticket.id); // Izinkan upload ulang
            await ticket.send("❌ **PEMBAYARAN DITOLAK**\nBukti tidak valid. Silakan kirim bukti yang benar.");
        }

        // Hapus tombol di log channel
        if (interaction.message) await interaction.message.edit({ components: [] });

        return interaction.reply({ content: "🚫 Payment ditolak.", ephemeral: true });
    }
};