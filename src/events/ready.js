const updatePricelist = require("../utils/updatePricelist");
const updateOrder = require("../utils/updateOrder");

module.exports = {
    name: "clientReady",
    once: true,
    async execute(clientReady) {
        console.log(`🤖 SYRBLOX online sebagai ${clientReady.user.tag}`);

        // Loop ke semua server saat bot nyala untuk update embed
        for (const [id, guild] of clientReady.guilds.cache) {
            try {
                await updatePricelist(guild);
                await updateOrder(guild);
                console.log(`✅ Embed updated untuk server: ${guild.name}`);
            } catch (err) {
                // Jangan spam error console jika bot belum disetup di server tersebut
                // console.error(`❌ Skip update di ${guild.name} (belum setup atau error).`);
            }
        }
    }
};