const config = require("../config");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        if (message.author.bot) return;

        if (!client.waitingUpload) {
            client.waitingUpload = new Set();
        }

        if (client.waitingUpload.has(message.channel.id) && message.attachments.size) {
            const file = message.attachments.first();
            if (!file.contentType?.startsWith("image/")) {
                return message.reply("❌ Bukti harus berupa gambar.");
            }

            const log = message.guild.channels.cache.get(config.channels.logPayment);
            if (!log) return;

            const embed = new EmbedBuilder()
                .setTitle("📸 BUKTI PEMBAYARAN")
                .setColor("#00BFFF")
                .setDescription(
                    `👤 <@${message.author.id}>\n📍 ${message.channel}`
                )
                .setImage(file.url);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`payment_confirm:${message.channel.id}`)
                    .setLabel("SUDAH BAYAR")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`payment_reject:${message.channel.id}`)
                    .setLabel("TOLAK")
                    .setStyle(ButtonStyle.Danger)
            );

            await log.send({ embeds: [embed], components: [row] });
            client.waitingUpload.delete(message.channel.id);

            return message.reply("✅ Bukti pembayaran dikirim.");
        }

        if (!message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            command.execute(message, args, client);
        } catch (err) {
            console.error(err);
            message.reply("❌ Error.");
        }
    }
};
