const { PermissionFlagsBits } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "cancel_order",
    async execute(interaction, client) {
        // 1. Ambil Data Invoice untuk mencari pemilik tiket
        const messages = await interaction.channel.messages.fetch({ limit: 50 });
        const invoiceMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("INVOICE"));

        let ticketOwnerId = null;

        if (invoiceMsg) {
            const fields = invoiceMsg.embeds[0].fields;
            // Mencari field "INFORMASI PEMBELIAN" untuk mengambil ID User
            const infoField = fields.find(f => f.name.includes("INFORMASI PEMBELIAN"));
            if (infoField) {
                // Regex untuk mengambil angka ID dari format <@123456>
                const match = infoField.value.match(/Username :\*\* <@(\d+)>/);
                if (match) ticketOwnerId = match[1];
            }
        }

        // 2. CEK KEAMANAN (Security Check)
        const isAdmin = config.adminIds.includes(interaction.user.id);
        const isOwner = interaction.user.id === ticketOwnerId;

        // Jika bukan Owner DAN bukan Admin, tolak akses
        if (!isOwner && !isAdmin) {
            return interaction.reply({ 
                content: "⛔ **Akses Ditolak!** Hanya pembuat order atau admin yang bisa membatalkan tiket ini.", 
                ephemeral: true 
            });
        }

        // 3. PROSES PENGHAPUSAN
        await interaction.reply({
            content: "🗑️ **Order Dibatalkan.** Tiket akan dihapus dalam 5 detik..."
        });

        // Hapus channel dalam 5 detik
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.log("Gagal menghapus channel (mungkin sudah dihapus manual):", error.message);
            }
        }, 5000);
    }
};