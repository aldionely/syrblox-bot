const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config");
const db = require("../../database/db");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("broadcast")
        .setDescription("Kirim pengumuman ke server (Admin Only)")
        .addStringOption(option =>
            option.setName("target")
                .setDescription("Mau kirim kemana?")
                .setRequired(true)
                .addChoices(
                    { name: 'Hanya Channel Ini (Current Channel)', value: 'here' },
                    // TARGET BARU KHUSUS CHANNEL BROADCAST 👇
                    { name: 'Semua Server - Channel Broadcast', value: 'broadcast' },
                    { name: 'Semua Server - Channel Pricelist', value: 'pricelist' },
                    { name: 'Semua Server - Channel Order/Tombol', value: 'order' }
                )
        )
        .addStringOption(option =>
            option.setName("judul")
                .setDescription("Judul Pengumuman")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("pesan")
                .setDescription("Isi Pesan Pengumuman (Gunakan \\n untuk enter)")
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName("gambar")
                .setDescription("Gambar/Banner (Opsional)")
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName("mention")
                .setDescription("Tag member?")
                .setRequired(false)
                .addChoices(
                    { name: 'Tag @everyone', value: '@everyone' },
                    { name: 'Tag @here', value: '@here' },
                    { name: 'Tanpa Tag', value: 'none' }
                )
        ),
    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const target = interaction.options.getString("target");
        const judul = interaction.options.getString("judul");
        const pesan = interaction.options.getString("pesan");
        const gambar = interaction.options.getAttachment("gambar");
        const mention = interaction.options.getString("mention") || "none";

        const embed = new EmbedBuilder()
            .setTitle(`📢 ${judul}`)
            .setDescription(pesan.replace(/\\n/g, "\n")) 
            .setColor("#FF0000") 
            .setFooter({ text: `Broadcast by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        if (gambar) {
            embed.setImage(gambar.url);
        }

        const contentMsg = mention === "none" ? null : mention;

        // KASUS A: Kirim ke channel ini saja
        if (target === 'here') {
            try {
                await interaction.channel.send({ content: contentMsg, embeds: [embed] });
                return interaction.editReply(`✅ Broadcast terkirim di channel ini.`);
            } catch (e) {
                return interaction.editReply(`❌ Gagal mengirim: ${e.message}`);
            }
        }

        // KASUS B: Kirim ke semua server (Looping Database)
        // Bot akan mencari key 'broadcast', 'pricelist', atau 'order' sesuai pilihanmu
        const rows = db.prepare("SELECT value FROM configs WHERE key = ?").all(target);

        if (rows.length === 0) {
            return interaction.editReply(`⚠️ Belum ada server yang melakukan setup untuk **${target}**.`);
        }

        let successCount = 0;
        let failCount = 0;

        for (const row of rows) {
            const channelId = row.value;
            try {
                const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
                if (channel) {
                    await channel.send({ content: contentMsg, embeds: [embed] });
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                failCount++;
            }
        }

        return interaction.editReply(`✅ **Broadcast Selesai!**\nTarget: Channel ${target.toUpperCase()}\n📤 Sukses: ${successCount}\n💀 Gagal: ${failCount}`);
    }
};