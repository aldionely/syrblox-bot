const config = require("../config");
const createEmbed = require("./pricelistEmbed");
const db = require("../database/db");

module.exports = async (guild) => {
    // Ambil Channel ID khusus untuk server ini
    const channelId = config.getChannel(guild.id, "pricelist");
    if (!channelId) return; 

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    // Ambil Message ID khusus untuk server ini
    const row = db.prepare("SELECT value FROM configs WHERE guild_id = ? AND key = 'pricelist_message_id'").get(guild.id);
    let messageId = row ? row.value : null;

    const saveId = (id) => {
        db.prepare("INSERT OR REPLACE INTO configs (guild_id, key, value) VALUES (?, 'pricelist_message_id', ?)").run(guild.id, id);
    };

    if (!messageId) {
        const msg = await channel.send({ embeds: [createEmbed()] });
        saveId(msg.id);
        return;
    }

    try {
        const msg = await channel.messages.fetch(messageId);
        await msg.edit({ embeds: [createEmbed()] });
    } catch {
        const msg = await channel.send({ embeds: [createEmbed()] });
        saveId(msg.id);
    }
};