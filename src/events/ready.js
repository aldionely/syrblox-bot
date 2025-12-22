const fs = require("fs");
const path = require("path");
const config = require("../config");
const createOrderEmbed = require("../utils/orderEmbed");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`🤖 SYRBLOX online sebagai ${client.user.tag}`);

        const channel = client.channels.cache.get(config.channels.order);
        if (!channel) return;

        const filePath = path.join(__dirname, "../data/orderMessage.json");
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        const { embed, button } = createOrderEmbed();

        // Jika embed belum pernah dikirim
        if (!data.messageId) {
            const msg = await channel.send({
                embeds: [embed],
                components: [button]
            });

            data.messageId = msg.id;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return;
        }

        // Update embed lama
        try {
            const msg = await channel.messages.fetch(data.messageId);
            await msg.edit({
                embeds: [embed],
                components: [button]
            });
        } catch {
            const msg = await channel.send({
                embeds: [embed],
                components: [button]
            });

            data.messageId = msg.id;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
    }
};
