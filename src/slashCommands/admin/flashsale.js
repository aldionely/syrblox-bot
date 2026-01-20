const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const db = require("../../database/db");
const config = require("../../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("flashsale")
        .setDescription("Atur Event Flash Sale (Standalone)")
        .addSubcommand(sub => 
            sub.setName("start")
               .setDescription("Mulai Flash Sale Baru (Tanpa ambil stok Pricelist)")
               .addStringOption(opt => opt.setName("name").setDescription("Nama Produk (ex: 1000 Robux Murah)").setRequired(true))
               .addIntegerOption(opt => opt.setName("original").setDescription("Harga Asli/Coret (ex: 150000)").setRequired(true))
               .addIntegerOption(opt => opt.setName("price").setDescription("Harga Flash Sale (ex: 100000)").setRequired(true))
               .addIntegerOption(opt => opt.setName("stock").setDescription("Stok Flash Sale").setRequired(true))
               .addIntegerOption(opt => opt.setName("duration").setDescription("Durasi (Menit)").setRequired(true))
        ),
    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        const name = interaction.options.getString("name");
        const originalPrice = interaction.options.getInteger("original");
        const flashPrice = interaction.options.getInteger("price");
        const stock = interaction.options.getInteger("stock");
        const duration = interaction.options.getInteger("duration");

        // Cek Channel Flash Sale (Default ke Broadcast jika belum disetup)
        let channelId = config.getChannel(interaction.guild.id, "flashsale");
        if (!channelId) {
            // Fallback ke broadcast kalau user lupa setup flashsale channel
            channelId = config.getChannel(interaction.guild.id, "broadcast");
        }

        if (!channelId) {
            return interaction.reply({ content: "❌ Channel Flash Sale belum disetup! Gunakan `/setup tipe:Channel Flash Sale`.", ephemeral: true });
        }
        
        const targetChannel = interaction.client.channels.cache.get(channelId);
        if (!targetChannel) return interaction.reply({ content: "❌ Channel Flash Sale tidak ditemukan/terhapus.", ephemeral: true });

        // Hitung Waktu
        const endTime = Date.now() + (duration * 60 * 1000);

        // Simpan ke Database Flash Sale (Standalone)
        const info = db.prepare(`
            INSERT INTO flash_sales (product_name, original_price, flash_price, stock, end_time, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        `).run(name, originalPrice, flashPrice, stock, endTime);

        const flashId = info.lastInsertRowid;

        // Buat Embed Pengumuman
        const embed = new EmbedBuilder()
            .setTitle("⚡ FLASH SALE ALERT! ⚡")
            .setColor("#FF0000")
            .setDescription(
                `🔥 **Produk:** ${name}\n` +
                `💸 **Harga Normal:** ~~Rp ${originalPrice.toLocaleString()}~~\n` +
                `🏷️ **Harga Flash Sale:** **Rp ${flashPrice.toLocaleString()}**\n\n` +
                `📦 **Stok Terbatas:** ${stock} Slot\n` +
                `⏳ **Berakhir:** <t:${Math.floor(endTime / 1000)}:R>\n\n` +
                `*Siapa cepat dia dapat! Klik tombol di bawah untuk rebutan!*`
            )
            .setImage("https://media.discordapp.net/attachments/1206010185504784394/1220000000000000000/flashsale.png?ex=66000&is=65idk&hm=fake"); 

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`flash_buy:${flashId}`)
                .setLabel(`🔥 BELI SEKARANG (${stock})`)
                .setStyle(ButtonStyle.Danger)
        );

        // Mention Role Logic
        const mentionText = config.mentionRole ? `<@&${config.mentionRole}>` : "@everyone";

        const msg = await targetChannel.send({ 
            content: `${mentionText} **FLASH SALE DIMULAI!** ⚡`, 
            embeds: [embed], 
            components: [row] 
        });

        // Update Message ID & Channel ID
        db.prepare("UPDATE flash_sales SET message_id = ?, channel_id = ? WHERE id = ?")
          .run(msg.id, targetChannel.id, flashId);

        return interaction.reply({ content: `✅ Flash Sale dimulai di ${targetChannel}! ID: ${flashId}`, ephemeral: true });
    }
};