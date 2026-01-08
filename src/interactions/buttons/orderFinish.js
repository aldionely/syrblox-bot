const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "order_finish",
    async execute(interaction, client) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        await interaction.deferUpdate();

        // 1. Update Log Message (Di Channel Log)
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

        // 3. Ambil Pesan-pesan di Ticket
        const messages = await ticket.messages.fetch({ limit: 50 });

        // Helper Disable Tombol
        const disableComponents = (msg) => {
            if (!msg.components.length) return [];
            return msg.components.map(row => {
                const newRow = ActionRowBuilder.from(row);
                const newBtns = newRow.components.map(btn => ButtonBuilder.from(btn).setDisabled(true));
                newRow.setComponents(newBtns);
                return newRow;
            });
        };

        // A. Hapus Pesan Loading
        const loadingMsg = messages.find(m => m.content && m.content.includes("robux sedang di proses"));
        if (loadingMsg) { try { await loadingMsg.delete(); } catch (e) {} }

        // B. Disable Tombol Login
        const loginMsg = messages.find(m => m.components.length > 0 && m.components[0].components.some(c => c.customId === 'fill_roblox_login'));
        if (loginMsg) { try { await loginMsg.edit({ components: disableComponents(loginMsg) }); } catch (e) {} }

        // C. UPDATE INVOICE & AMBIL DATA (PERBAIKAN DISINI)
        const invoiceMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("INVOICE"));

        let jumlahRobux = "Sekian";
        let buyerId = null;

        if (invoiceMsg) {
            const updated = EmbedBuilder.from(invoiceMsg.embeds[0]);
            const fields = updated.data.fields;

            // 1. Update Status Order -> SELESAI
            const ordStatus = fields.find(f => f.name.includes("Status Order"));
            if (ordStatus) ordStatus.value = "`✅ ORDER SELESAI`";
            
            // 2. Ambil ID User (SESUAI FORMAT BARU)
            // Format di embed: "**Username :** <@123456789>"
            const infoField = fields.find(f => f.name.includes("INFORMASI PEMBELIAN"));
            if (infoField) {
                const match = infoField.value.match(/Username :\*\* <@(\d+)>/);
                if (match) buyerId = match[1];
            }

            // 3. Ambil Jumlah Robux (SESUAI FORMAT BARU)
            // Format di embed: "**Jumlah :** 100 Robux"
            const prodField = fields.find(f => f.name.includes("RINCIAN PEMBELIAN"));
            if (prodField) {
                const matchRobux = prodField.value.match(/Jumlah :\*\* (\d+) Robux/);
                if (matchRobux) jumlahRobux = matchRobux[1];
            }

            // Simpan perubahan
            await invoiceMsg.edit({ 
                embeds: [updated], 
                components: disableComponents(invoiceMsg) 
            });
        }

        // 4. Kirim History (Sekarang pasti jalan karena buyerId sudah benar)
        const historyId = config.getChannel(interaction.guild.id, "history");
        
        // Debugging (Opsional, cek console kalau masih gagal)
        // console.log("History ID:", historyId, "Buyer ID:", buyerId);

        if (historyId && buyerId) {
            const historyChannel = interaction.guild.channels.cache.get(historyId);
            if (historyChannel) {
                const historyEmbed = new EmbedBuilder()
                    .setTitle("🎉 PEMBELIAN BERHASIL")
                    .setColor("#00FF88")
                    .setDescription(
                        `<@${buyerId}> telah sukses melakukan pembelian **${jumlahRobux} Robux**!\n` +
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
                .setLabel("Berikan Testimoni")
                .setStyle(ButtonStyle.Success)
                .setEmoji("✍️")
        );

        const finishEmbed = new EmbedBuilder()
            .setTitle("<:85618verified:1455185880330539173> ORDER SELESAI — SYRBLOX")
            .setColor("#00FF88")
            .setDescription(
                `Halo ${buyerMention}, robux dengan jumlah ${jumlahRobux} udah berhasil kami kirim!\n\n` +
                `segera cek akun kamu ya!\n\n` +
                `**NOTE**\n\n` +
                `◆ Ticket order ini akan dihapus otomatis dalam **7 hari**.\n` +
                `◆ Data login akan dihapus dari sistem kami.\n\n` +
                `**Jika berkenan isi testimoni dengan klik tombol di bawah ya!** 👇`
            )
            .setFooter({ text: "SYRBLOX OFFICIAL" });

        await ticket.send({
            content: buyerMention ? `Hore! ${buyerMention} pesananmu udah selesai!` : "Order Selesai!",
            embeds: [finishEmbed],
            components: [testimoniRow]
        });
    }
};