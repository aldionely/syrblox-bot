const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "payment_confirm",
    async execute(interaction, client) {
        // Defer dulu agar tidak timeout
        await interaction.deferReply({ ephemeral: true });

        // 1. Cek Admin
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.editReply({ content: "❌ Admin only." });
        }

        // 2. Ambil Channel Ticket
        const ticketId = interaction.customId.split(":")[1]; 
        const ticket = interaction.guild.channels.cache.get(ticketId) || interaction.channel;
        
        if (!ticket) return interaction.editReply({ content: "Ticket tidak ditemukan." });

        let buyerId = null; // Variabel untuk menyimpan ID Pembeli

        // 3. Update Status di Embed Order & Ambil ID Pembeli
        try {
            const messages = await ticket.messages.fetch({ limit: 50 });
            const orderMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("ORDER BARU"));

            if (orderMsg) {
                const updated = EmbedBuilder.from(orderMsg.embeds[0]);
                const oldDesc = updated.data.description;

                // Update Status Teks
                let newDesc = oldDesc.replace("`MENUNGGU`", "`SUDAH BAYAR`"); 
                newDesc = newDesc.replace("`MENUNGGU`", "`DALAM PROSES`"); 
                updated.setDescription(newDesc);
                
                await orderMsg.edit({ embeds: [updated] });

                // Ambil ID User dari deskripsi embed
                const match = oldDesc.match(/\*\*◆ User:\*\* <@(\d+)>/);
                if (match) {
                    buyerId = match[1]; 
                }
            }
        } catch (e) {
            console.log("Gagal update embed order / ambil ID user:", e.message);
        }

        // 4. Kirim Pesan Konfirmasi
        const confirmEmbed = new EmbedBuilder()
            .setTitle("<a:8054verifiedicon:1456639271904608337> PEMBAYARAN DITERIMA")
            .setColor("#00FF88")
            .setDescription("Pembayaran telah diterima.\nSilakan isi data login Roblox dengan tombol di bawah.");

        const loginRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("fill_roblox_login")
                .setLabel("🔐 Isi Data Login")
                .setStyle(ButtonStyle.Primary)
        );

        // --- INI BAGIAN YANG DIUBAH MENJADI SIMPEL ---
        const simpleMessage = buyerId 
            ? `<a:707793redbell:1456642921502605435> notifikasi pembayaran <@${buyerId}>` 
            : "<a:707793redbell:1456642921502605435> notifikasi pembayaran";

        await ticket.send({ 
            content: simpleMessage, // <--- Pesan simpel + Mention
            embeds: [confirmEmbed], 
            components: [loginRow] 
        });
        
        // 5. Hapus tombol confirm/reject di log channel admin
        if (interaction.message) {
            try {
                await interaction.message.edit({ components: [] });
            } catch (e) {
                console.log("Gagal hapus tombol log:", e.message);
            }
        }
        
        return interaction.editReply({ content: "<:verif1:1452333754075840806> Payment dikonfirmasi." });
    }
};