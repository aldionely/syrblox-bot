const db = require("./database/db");

// Helper untuk ambil data per server
const getConfig = (guildId, key) => {
    try {
        if (!guildId) return null;
        // Ambil data, jika tidak ada return null
        const row = db.prepare("SELECT value FROM configs WHERE guild_id = ? AND key = ?").get(guildId, key);
        return row ? row.value : null;
    } catch (e) {
        return null;
    }
};

module.exports = {
    prefix: "!",

    adminIds: [
        "394313977234194432", 
        "1220270062284570714",
        "1191725638156025919"
    ],
    
    getChannel: (guildId, type) => {
        return getConfig(guildId, type);
    },

    categories: {
        // PERBAIKAN: Hapus "|| 145..." (Hardcode). 
        // Biarkan null jika belum disetup, agar kita tahu itu error.
        getTicket: (guildId) => getConfig(guildId, "ticketCategory") 
    }
};