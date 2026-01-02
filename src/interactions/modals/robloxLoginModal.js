const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config");

module.exports = {
    customId: "roblox_login_modal",
    async execute(interaction, client) {
        const username = interaction.fields.getTextInputValue("rbx_username");
        const password = interaction.fields.getTextInputValue("rbx_password");

        const messages = await interaction.channel.messages.fetch({ limit: 50 });
        const orderMsg = messages.find(m => m.embeds.length && m.embeds[0].title && m.embeds[0].title.includes("ORDER BARU"));
        
        // [UPDATE] Ambil Channel Log dinamis
        const logChannelId = config.getChannel(interaction.guild.id, "orderLog");
        if (!logChannelId) return interaction.reply({ content: "❌ Admin belum setup channel Order Log.", ephemeral: true });

        const log = interaction.guild.channels.cache.get(logChannelId);
        if (!log || !orderMsg) return interaction.reply({ content: "Gagal menemukan channel log / data order.", ephemeral: true});

        const logEmbed = new EmbedBuilder()
            .setTitle("🔐 DATA LOGIN ROBLOX — SYRBLOX")
            .setColor("#FF5555")
            .setDescription(
                `👤 **User:** <@${interaction.user.id}>\n` +
                `📍 **Ticket:** ${interaction.channel}\n\n` +
                `${orderMsg.embeds[0].data.description}\n\n` +
                `**Email:** \`${username}\`\n` +
                `**Pw Roblox:** \`${password}\``
            );

        const finishRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`order_finish:${interaction.channel.id}`) 
                .setLabel("✅ Selesaikan Order")
                .setStyle(ButtonStyle.Success)
        );

        await log.send({ embeds: [logEmbed], components: [finishRow] });

        await interaction.reply({
            ephemeral: true,
            content: "<:verif1:1452333754075840806> Data login berhasil di kirim ke admin, tunggu sebentar ya."
        });
        
        await interaction.channel.send("<a:88094loading:1455195433516269589> **Robux sedang diproses oleh admin.**");
    }
};