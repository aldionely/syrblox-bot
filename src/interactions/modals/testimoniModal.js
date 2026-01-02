const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "testimoni_modal",
    async execute(interaction, client) {
        const pesan = interaction.fields.getTextInputValue("testi_pesan");
        const rating = interaction.fields.getTextInputValue("testi_rating");

        // [UPDATE] Ambil Channel Testimoni dinamis
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
                // `👤 **User:** <@${interaction.user.id}>\n` +
                `💬 **Feedback:**\n"${pesan}"\n\n` +
                `✨ **Rating:** ${rating}/10\n${star}`
            )
            .setFooter({ text: "Terima kasih atas kepercayaannya!" })
            .setTimestamp();

        await channelTesti.send({ embeds: [embed] });

        await interaction.update({
            content: "✅ **Terima kasih! Testimoni kamu berhasil dikirim.**",
            components: [] 
        });
    }
};