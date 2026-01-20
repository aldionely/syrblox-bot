const db = require("./database/db");

// Helper untuk ambil data per server
const getConfig = (guildId, key) => {
    try {
        if (!guildId) return null;
        const row = db.prepare("SELECT value FROM configs WHERE guild_id = ? AND key = ?").get(guildId, key);
        return row ? row.value : null;
    } catch (e) {
        return null;
    }
};

module.exports = {
    prefix: "-",

    adminIds: [
        "394313977234194432", 
        "1220270062284570714",
        "1191725638156025919"
    ],

    // [BARU] Role ID untuk Mention saat Flash Sale
    // Ganti angka di bawah dengan ID Role kamu (Klik Kanan Role -> Copy ID)
    // Jika dibiarkan kosong "", bot akan default tag @everyone
    mentionRole: "1460222265982451713", 
    verifiedRole: "1460222265982451713",
    unverifiedRole: "1459146537023311882",
    
    getChannel: (guildId, type) => {
        return getConfig(guildId, type);
    },

    categories: {
        getTicket: (guildId) => getConfig(guildId, "ticketCategory") 
    }
};