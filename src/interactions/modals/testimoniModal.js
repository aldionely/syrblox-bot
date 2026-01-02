const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "testimoni_modal",
    async execute(interaction, client) {
        const pesan = interaction.fields.getTextInputValue("testi_pesan");
        const rating = interaction.fields.getTextInputValue("testi_rating");

        // Ambil Channel Testimoni dinamis
        const testiChannelId = config.getChannel(interaction.guild.id, "testimoni");
        
        if (!testiChannelId) {
            return interaction.reply({ 
                content: "❌ Channel testimoni belum di-setup oleh admin.", 
                ephemeral: true 
            });
        }

        const channelTesti = interaction.guild.channels.cache.get(testiChannelId);
        if (!channelTesti) return interaction.reply({ content: "Channel testimoni tidak ditemukan.", ephemeral: true });

        const ratingNum = parseInt(rating) || 0;
        const star = "⭐".repeat(Math.min(ratingNum, 10)); 

        const embed = new EmbedBuilder()
            .setTitle(`TESTIMONI DARI ${interaction.user.username.toUpperCase()}`)
            .setColor("#FFD700") 
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(
                `💬 **Feedback:**\n"${pesan}"\n\n` +
                `✨ **Rating:** ${rating}/10\n${star}`
            )
            .setFooter({ text: "Terima kasih atas kepercayaannya!" })
            .setTimestamp();

        // 1. Kirim Embed ke Channel Testimoni (Public)
        await channelTesti.send({ embeds: [embed] });

        // 2. Kirim pesan biasa ke channel Ticket (Notifikasi user)
        await interaction.channel.send(`<a:4364verificationicon:1456639269048156160> **Terima kasih! Testimoni kamu berhasil dikirim.**`);

        // 3. DISABLE Tombol Testimoni
        // Kita ambil komponen tombol dari pesan sebelumnya, lalu setDisabled(true)
        if (interaction.message) {
            const disabledRows = interaction.message.components.map(row => {
                const newRow = new ActionRowBuilder();
                row.components.forEach(component => {
                    const btn = ButtonBuilder.from(component);
                    btn.setDisabled(true); // Matikan tombol
                    newRow.addComponents(btn);
                });
                return newRow;
            });

            // Update pesan agar tombol jadi abu-abu
            await interaction.update({ components: disabledRows });
        } else {
            // Fallback jika tidak ada pesan (jarang terjadi)
            await interaction.deferUpdate();
        }
    }
};