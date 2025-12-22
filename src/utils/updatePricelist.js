const fs = require("fs");
const path = require("path");
const config = require("../config");
const createEmbed = require("./pricelistEmbed");

module.exports = async (guild) => {
    const channel = guild.channels.cache.get(config.channels.pricelist);
    if (!channel) return;

    const msgFile = path.join(__dirname, "../data/pricelistMessage.json");
    const data = JSON.parse(fs.readFileSync(msgFile, "utf-8"));

    // Jika embed belum pernah dikirim
    if (!data.messageId) {
        const msg = await channel.send({ embeds: [createEmbed()] });
        data.messageId = msg.id;
        fs.writeFileSync(msgFile, JSON.stringify(data, null, 2));
        return;
    }

    // Update embed lama
    try {
        const msg = await channel.messages.fetch(data.messageId);
        await msg.edit({ embeds: [createEmbed()] });
    } catch {
        // Kalau message hilang
        const msg = await channel.send({ embeds: [createEmbed()] });
        data.messageId = msg.id;
        fs.writeFileSync(msgFile, JSON.stringify(data, null, 2));
    }
};