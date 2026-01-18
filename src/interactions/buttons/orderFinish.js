const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const discordTranscripts = require('discord-html-transcripts'); // Import Library Baru
const config = require("../../config");

module.exports = {
    customId: "order_finish",
    async execute(interaction, client) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        // Defer reply karena proses transcript mungkin butuh 1-3 detik
        await interaction.deferReply({ ephemeral: true }); 

        // 1. Update Log Message (Di Channel Log) - Ubah status jadi SELESAI
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
        if (!ticket) return interaction.editReply("❌ Ticket tidak ditemukan (mungkin sudah dihapus).");

        // --- FITUR TRANSCRIPT (BARU) ---
        // Buat file transcript HTML
        const attachment = await discordTranscripts.createTranscript(ticket, {
            limit: -1, // Ambil semua pesan
            returnType: 'attachment', // Balikkan sebagai file attachment
            filename: `transcript-${ticket.name}.html`, // Nama file
            saveImages: true, // Simpan gambar agar tidak hilang
            footerText: "Exported by Syrblox Bot", 
            poweredBy: false // Hilangkan watermark library
        });

        // Kirim Transcript ke Channel Log (orderLog)
        const logId = config.getChannel(interaction.guild.id, "orderLog");
        if (logId) {
            const logChannel = interaction.guild.channels.cache.get(logId);
            if (logChannel) {
                const transEmbed = new EmbedBuilder()
                    .setTitle("📑 TICKET TRANSCRIPT")
                    .setColor("#2b2d31")
                    .setDescription(`**Channel:** ${ticket.name}\n**Closed By:** <@${interaction.user.id}>\n**Time:** <t:${Math.floor(Date.now() / 1000)}:R>`)
                    .setFooter({ text: "Download file di atas untuk melihat riwayat chat." });

                await logChannel.send({ embeds: [transEmbed], files: [attachment] });
            }
        }
        // --------------------------------

        // 3. Ambil Pesan-pesan di Ticket (Untuk Logic Invoice)
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

        // C. UPDATE INVOICE & AMBIL DATA (Logika Invoice Baru)
        const invoiceMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("INVOICE"));

        let jumlahRobux = "Sekian";
        let buyerId = null;

        if (invoiceMsg) {
            const updated = EmbedBuilder.from(invoiceMsg.embeds[0]);
            const fields = updated.data.fields;

            // 1. Update Status Order -> SELESAI
            const ordStatus = fields.find(f => f.name.includes("Status Order"));
            if (ordStatus) ordStatus.value = "✅ `ORDER SELESAI`";
            
            // 2. Ambil ID User
            const infoField = fields.find(f => f.name.includes("INFORMASI PEMBELIAN"));
            if (infoField) {
                const match = infoField.value.match(/Username :\*\* <@(\d+)>/);
                if (match) buyerId = match[1];
            }

            // 3. Ambil Jumlah Robux
            const prodField = fields.find(f => f.name.includes("RINCIAN PEMBELIAN"));
            if (prodField) {
                const matchRobux = prodField.value.match(/Jumlah :\*\* (\d+) Robux/);
                if (matchRobux) jumlahRobux = matchRobux[1];
            }

            await invoiceMsg.edit({ 
                embeds: [updated], 
                components: disableComponents(invoiceMsg) 
            });
        }

        // 4. Kirim History
        const historyId = config.getChannel(interaction.guild.id, "history");
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
                `**NOTE**\n` +
                `◆ Ticket order ini akan dihapus otomatis dalam **7 hari**.\n` +
                `◆ Data login akan dihapus dari sistem kami.\n` +
                `**Jika berkenan isi testimoni dengan klik tombol di bawah ya!** 👇`
            )
            .setFooter({ text: "SYRBLOX OFFICIAL" });

        await ticket.send({
            content: buyerMention ? `Hore! ${buyerMention} pesananmu udah selesai!` : "Order Selesai!",
            embeds: [finishEmbed],
            components: [testimoniRow]
        });

        // Balas interaksi tombol (karena tadi di-defer)
        await interaction.editReply({ content: "✅ Order diselesaikan & Transcript tersimpan." });
    }
};