const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config");
const verifySessions = require("../utils/verifySession");

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        // 1. Filter Dasar
        if (message.author.bot) return;
        if (!message.guild) return;

        // ---------------------------------------------------------
        // HANDLE VERIFIKASI CAPTCHA (Cek Jawaban)
        // ---------------------------------------------------------
        // =========================================================
        // [LOGIKA BARU] CEK JAWABAN VERIFIKASI (Tanpa Prefix)
        // =========================================================
        if (verifySessions.has(message.author.id)) {
            const session = verifySessions.get(message.author.id);

            // Cek apakah dia mengetik di channel yang benar
            if (message.channel.id === session.channelId) {
                
                // Hapus pesan user (angka yang diketik) biar rapi
                setTimeout(() => message.delete().catch(() => {}), 500);

                if (message.content.trim() === session.code) {
                    // --- JAWABAN BENAR ---
                    verifySessions.delete(message.author.id);

                    try {
                        const member = message.member;

                        // 1. Hapus Role Unverified (Jika ada)
                        if (config.unverifiedRole && member.roles.cache.has(config.unverifiedRole)) {
                            await member.roles.remove(config.unverifiedRole);
                        }

                        // 2. Tambah Role Verified
                        if (config.verifiedRole) {
                            await member.roles.add(config.verifiedRole);
                            
                            const successMsg = await message.channel.send(`✅ **verifikasi berhasil!** Selamat datang <@${message.author.id}>.`);
                            // setTimeout(() => successMsg.delete().catch(() => {}), 5000);
                        } else {
                            message.channel.send("✅ Kode benar! (Tapi role belum disetup di config).");
                        }

                    } catch (e) {
                        console.error(e);
                        message.channel.send("❌ Gagal memberi role. Cek posisi role bot!");
                    }
                    return; // STOP! Jangan lanjut ke bawah
                }
            }
        }

        // ---------------------------------------------------------
        // HANDLE COMMAND BIASA (Prefix !)
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
                }
            }
            return;
        }

        // ---------------------------------------------------------
        // HANDLE BUKTI TRANSFER (Otomatis)
        // ---------------------------------------------------------
        
        // Cek 1: Apakah ada gambar?
        if (message.attachments.size === 0) return;
        const file = message.attachments.first();
        if (!file.contentType?.startsWith("image/")) return;

        // Cek 2: Ambil ID Kategori Ticket dari Database
        const ticketCategoryId = config.categories.getTicket(message.guild.id);

        if (!ticketCategoryId) return;

        // Cek 3: Validasi Parent Category
        if (message.channel.parentId !== ticketCategoryId) return;

        // --- PROSES LOGGING KE ADMIN ---

        const logId = config.getChannel(message.guild.id, "logPayment");
        if (!logId) return message.reply("⚠️ **Admin Alert:** Channel `Log Payment` belum disetup.");

        const logChannel = message.guild.channels.cache.get(logId);
        if (!logChannel) return message.reply("⚠️ **Admin Alert:** Channel Log Payment tidak ditemukan.");

        // Buat Embed
        const logEmbed = new EmbedBuilder()
            .setTitle("📸 BUKTI PEMBAYARAN BARU")
            .setColor("#00BFFF")
            .setDescription(
                `👤 **User:** <@${message.author.id}>\n` +
                `📍 **Ticket:** ${message.channel}\n` +
                `⏰ **Waktu:** <t:${Math.floor(Date.now() / 1000)}:R>`
            )
            .setImage(file.url)
            .setFooter({ text: "SYRBLOX OFFICIAL." });

        // --- PERBAIKAN DI SINI ---
        // Kita tambahkan ID Channel Ticket ke dalam Custom ID tombol
        // Format: "action:TICKET_CHANNEL_ID"
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`payment_confirm:${message.channel.id}`) // <--- ID DITEMPEL DISINI
                .setLabel("✅ verifikasi pembayaran")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`payment_reject:${message.channel.id}`) // <--- ID DITEMPEL DISINI JUGA
                .setLabel("❌ Tolak")
                .setStyle(ButtonStyle.Danger)
        );

        try {
            await logChannel.send({ content: "Ada bukti bayar masuk!", embeds: [logEmbed], components: [row] });
            await message.channel.send({ 
                content: `<:verif1:1452333754075840806> **Terima kasih!** Bukti pembayaran sudah di teruskan ke admin.\n tunggu sebentar ya, lagi di cek.` 
            });
        } catch (e) {
            console.error("Gagal kirim log:", e);
            message.reply("❌ Gagal mengirim bukti (Cek permission bot).");
        }
    }
};