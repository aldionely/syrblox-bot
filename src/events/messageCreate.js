const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config");

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        // 1. Filter Dasar (Abaikan bot & DM)
        if (message.author.bot) return;
        if (!message.guild) return;

        // ---------------------------------------------------------
        // BAGIAN 1: HANDLE COMMAND BIASA (Prefix !)
        // ---------------------------------------------------------
        if (message.content.startsWith(config.prefix)) {
            const args = message.content.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName);

            if (command) {
                try {
                    await command.execute(message, args, client);
                } catch (err) {
                    console.error(err);
                    message.reply("❌ Error saat menjalankan command.");
                }
            }
            return; // Stop disini kalau ini adalah command, jangan lanjut ke cek gambar
        }

        // ---------------------------------------------------------
        // BAGIAN 2: HANDLE BUKTI TRANSFER (Otomatis)
        // ---------------------------------------------------------
        
        // Cek 1: Apakah pesan mengandung GAMBAR?
        if (message.attachments.size === 0) return;
        const file = message.attachments.first();
        if (!file.contentType?.startsWith("image/")) return; // Abaikan file zip/pdf dll

        // Cek 2: Ambil ID Kategori Ticket dari Database Server ini
        // (Pastikan kamu sudah setup ticket category via /setup atau hardcode di config jika belum)
        const ticketCategoryId = config.categories.getTicket(message.guild.id);

        // Cek 3: Apakah channel ini anak dari Kategori Ticket?
        // Jika IYA, berarti ini adalah channel transaksi
        if (message.channel.parentId !== ticketCategoryId) return;

        // --- PROSES LOGGING KE ADMIN ---

        // Ambil Channel Log Payment dari Database
        const logId = config.getChannel(message.guild.id, "logPayment");
        if (!logId) return message.reply("⚠️ Admin belum setup channel **Log Payment**. Bukti tidak terkirim.");

        const logChannel = message.guild.channels.cache.get(logId);
        if (!logChannel) return message.reply("⚠️ Channel Log Payment tidak ditemukan (mungkin terhapus).");

        // Buat Embed untuk Admin
        const logEmbed = new EmbedBuilder()
            .setTitle("📸 BUKTI PEMBAYARAN BARU")
            .setColor("#00BFFF")
            .setDescription(
                `👤 **User:** <@${message.author.id}>\n` +
                `📍 **Ticket:** ${message.channel}\n` +
                `⏰ **Waktu:** <t:${Math.floor(Date.now() / 1000)}:R>`
            )
            .setImage(file.url)
            .setFooter({ text: "Sistem Multi-Server Syrblox" });

        // Tombol Aksi untuk Admin
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`payment_confirm`) // Logic tombol ini ada di file button/adminAccPayment.js
                .setLabel("✅ Valid (Minta Login)")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`payment_reject`)
                .setLabel("❌ Tolak")
                .setStyle(ButtonStyle.Danger)
        );

        try {
            // Kirim ke Channel Log Admin
            await logChannel.send({ content: "Ada bukti bayar masuk!", embeds: [logEmbed], components: [row] });
            
            // Balas ke User di Ticket
            await message.reply({ 
                content: `<:verif1:1452333754075840806> **Terima kasih!** Bukti pembayaran kamu sudah masuk ke sistem admin.\nMohon tunggu validasi ya.` 
            });
        } catch (e) {
            console.error("Gagal kirim log:", e);
            message.reply("❌ Terjadi kesalahan saat mengirim bukti ke admin.");
        }
    }
};