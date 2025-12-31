const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "payment_confirm",
    async execute(interaction, client) {
        // [PERBAIKAN] Defer dulu agar tidak timeout (Unknown Interaction)
        await interaction.deferReply({ ephemeral: true });

        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.editReply({ content: "❌ Admin only." });
        }

        const ticketId = interaction.customId.split(":")[1]; 
        const ticket = interaction.guild.channels.cache.get(ticketId) || interaction.channel;
        
        if (!ticket) return interaction.editReply({ content: "Ticket tidak ditemukan." });

        // Update status di Embed Order
        try {
            const messages = await ticket.messages.fetch({ limit: 50 });
            const orderMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("ORDER BARU"));

            if (orderMsg) {
                const updated = EmbedBuilder.from(orderMsg.embeds[0]);
                let desc = updated.data.description;
                desc = desc.replace("`MENUNGGU`", "`SUDAH BAYAR`"); 
                desc = desc.replace("`MENUNGGU`", "`DALAM PROSES`"); 
                updated.setDescription(desc);
                await orderMsg.edit({ embeds: [updated] });
            }
        } catch (e) {
            console.log("Gagal update embed order (mungkin pesan dihapus):", e.message);
        }

        // Kirim Embed Konfirmasi & Tombol Login
        const confirmEmbed = new EmbedBuilder()
            .setTitle("<:157030approvedids:1455185882851315795> PEMBAYARAN DITERIMA")
            .setColor("#00FF88")
            .setDescription("Pembayaran telah diterima.\nSilakan isi data login Roblox dengan tombol di bawah.");

        const loginRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("fill_roblox_login")
                .setLabel("🔐 Isi Data Login")
                .setStyle(ButtonStyle.Primary)
        );

        await ticket.send({ embeds: [confirmEmbed], components: [loginRow] });
        
        // Hapus tombol confirm/reject di log channel
        if (interaction.message) {
            try {
                await interaction.message.edit({ components: [] });
            } catch (e) {
                console.log("Gagal hapus tombol log:", e.message);
            }
        }
        
        // [PERBAIKAN] Gunakan editReply karena sudah di-defer di awal
        return interaction.editReply({ content: "✅ Payment dikonfirmasi." });
    }
};