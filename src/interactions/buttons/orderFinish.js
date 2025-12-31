const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "order_finish",
    async execute(interaction, client) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        await interaction.deferUpdate();

        // 1. Update Log Message
        try {
            const logEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
            logEmbed.setDescription(
                logEmbed.data.description.replace("`DALAM PROSES`", "`SELESAI`")
            );
            await interaction.message.edit({ embeds: [logEmbed], components: [] });
        } catch (e) {
            console.log("Gagal update log message:", e.message);
        }

        // 2. Ambil Ticket
        const ticketId = interaction.customId.split(":")[1];
        const ticket = interaction.guild.channels.cache.get(ticketId);
        if (!ticket) return;

        // 3. Ambil Info Order
        const messages = await ticket.messages.fetch({ limit: 50 });
        const orderMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("ORDER BARU"));

        let jumlahRobux = "Sekian";
        let buyerId = null;

        if (orderMsg) {
            const updated = EmbedBuilder.from(orderMsg.embeds[0]);
            let desc = updated.data.description;
            desc = desc.replace("`DALAM PROSES`", "`SELESAI`");
            desc = desc.replace("`MENUNGGU`", "`SELESAI`"); 
            updated.setDescription(desc);
            await orderMsg.edit({ embeds: [updated] });

            const matchRobux = desc.match(/\*\*◆ Jumlah:\*\* (.+?) Robux/);
            if (matchRobux) jumlahRobux = matchRobux[1];

            const matchUser = desc.match(/\*\*◆ User:\*\* <@(.+?)>/);
            if (matchUser) buyerId = matchUser[1];
        }

        // 4. [UPDATE] Kirim ke Channel History Dinamis
        const historyId = config.getChannel(interaction.guild.id, "history");
        if (historyId && buyerId) {
            const historyChannel = interaction.guild.channels.cache.get(historyId);
            if (historyChannel) {
                const historyEmbed = new EmbedBuilder()
                    .setTitle("🎉 PEMBELIAN BERHASIL")
                    .setColor("#00FF88")
                    .setDescription(
                        `User <@${buyerId}> telah sukses melakukan pembelian **${jumlahRobux} Robux**!\n` +
                        `Terima kasih sudah berbelanja di SYRBLOX.`
                    )
                    .setTimestamp();
                
                await historyChannel.send({ embeds: [historyEmbed] });
            }
        }

        // 5. Lock Channel
        await ticket.permissionOverwrites.edit(ticket.guild.id, { SendMessages: false });
        const buyerOverwrite = ticket.permissionOverwrites.cache.find(o => o.type === 1); 
        let buyerMention = "";
        
        if (buyerOverwrite) {
            await ticket.permissionOverwrites.edit(buyerOverwrite.id, { SendMessages: false });
            buyerMention = `<@${buyerOverwrite.id}>`;
        }

        // 6. Tombol Testimoni
        const testimoniRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("testimoni_start")
                .setLabel("⭐ Berikan Testimoni")
                .setStyle(ButtonStyle.Success)
                .setEmoji("✍️")
        );

        const finishEmbed = new EmbedBuilder()
            .setTitle("<:85618verified:1455185880330539173> ORDER SELESAI — SYRBLOX")
            .setColor("#00FF88")
            .setDescription(
                `Halo ${buyerMention}, pesanan kamu telah berhasil dikirim!\n\n` +
                `📦 **Item:** ${jumlahRobux} Robux\n` +
                `✅ **Status:** Selesai / Success\n\n` +
                `**Mohon isi testimoni dengan klik tombol di bawah ya!** 👇\n` +
                `Ticket akan dihapus otomatis dalam **7 hari**.`
            )
            .setFooter({ text: "Terima kasih telah belanja di SYRBLOX!" });

        await ticket.send({
            content: buyerMention ? `Hore! ${buyerMention} pesananmu selesai!` : "Order Selesai!",
            embeds: [finishEmbed],
            components: [testimoniRow]
        });
    }
};