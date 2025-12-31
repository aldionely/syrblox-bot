const { EmbedBuilder } = require("discord.js");
const config = require("../config");
const createOrderEmbed = require("./orderEmbed"); // Pastikan file orderEmbed.js ada di folder utils
const db = require("../database/db");

module.exports = async (guild) => {
    // Ambil Channel Order khusus server ini
    const channelId = config.getChannel(guild.id, "order");
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    // Ambil Message ID khusus server ini
    const row = db.prepare("SELECT value FROM configs WHERE guild_id = ? AND key = 'order_message_id'").get(guild.id);
    let messageId = row ? row.value : null;

    const saveId = (id) => {
        db.prepare("INSERT OR REPLACE INTO configs (guild_id, key, value) VALUES (?, 'order_message_id', ?)").run(guild.id, id);
    };

    const { embed, button } = createOrderEmbed();

    if (!messageId) {
        const msg = await channel.send({ embeds: [embed], components: [button] });
        saveId(msg.id);
        return;
    }

    try {
        const msg = await channel.messages.fetch(messageId);
        await msg.edit({ embeds: [embed], components: [button] });
    } catch {
        const msg = await channel.send({ embeds: [embed], components: [button] });
        saveId(msg.id);
    }
};