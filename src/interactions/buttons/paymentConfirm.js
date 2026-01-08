const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "payment_confirm",
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.editReply({ content: "❌ Admin only." });
        }

        const ticketId = interaction.customId.split(":")[1]; 
        const ticket = interaction.guild.channels.cache.get(ticketId) || interaction.channel;
        
        if (!ticket) return interaction.editReply({ content: "Ticket tidak ditemukan." });

        let buyerId = null;

        // --- UPDATE INVOICE STATUS ---
        try {
            const messages = await ticket.messages.fetch({ limit: 50 });
            const invoiceMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("INVOICE"));

            if (invoiceMsg) {
                const updated = EmbedBuilder.from(invoiceMsg.embeds[0]);
                const fields = updated.data.fields;

                // 1. Update Status Payment -> LUNAS
                const payStatus = fields.find(f => f.name.includes("Status Payment"));
                if (payStatus) payStatus.value = "<a:1370everythingisstable:1455186732306923600> `LUNAS (SUDAH DIBAYAR)`";

                // 2. Update Status Order -> DALAM PROSES
                const ordStatus = fields.find(f => f.name.includes("Status Order"));
                if (ordStatus) ordStatus.value = "<:704309pendingids:1455185884549746872> `DALAM PROSES PENGERJAAN`";

                // 3. Ambil ID User dari Field Info Customer
                const infoField = fields.find(f => f.name.includes("Informasi Customer"));
                if (infoField) {
                    const match = infoField.value.match(/Customer:\*\* <@(\d+)>/);
                    if (match) buyerId = match[1];
                }
                
                await invoiceMsg.edit({ embeds: [updated] });
            }
        } catch (e) {
            console.log("Gagal update invoice:", e.message);
        }

        // Kirim Pesan Konfirmasi & Tombol Login
        const confirmEmbed = new EmbedBuilder()
            .setTitle("<a:8054verifiedicon:1456639271904608337> PEMBAYARAN DITERIMA")
            .setColor("#00FF88")
            .setDescription("pembayaran kamu sudah diterima.\nsilahkan lanjut isi data login di bawah ini.");

        const loginRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("fill_roblox_login")
                .setLabel("🔐 Isi Data Login")
                .setStyle(ButtonStyle.Primary)
        );

        const simpleMessage = buyerId 
            ? `<a:707793redbell:1456642921502605435> notifikasi pembayaran <@${buyerId}>` 
            : "<a:707793redbell:1456642921502605435> notifikasi pembayaran";

        await ticket.send({ 
            content: simpleMessage, 
            embeds: [confirmEmbed], 
            components: [loginRow] 
        });
        
        if (interaction.message) {
            try { await interaction.message.edit({ components: [] }); } catch (e) {}
        }
        
        return interaction.editReply({ content: "<:verif1:1452333754075840806> Payment dikonfirmasi." });
    }
};