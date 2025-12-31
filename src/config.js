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
    prefix: "!",

    adminIds: [
        "394313977234194432", 
        "1220270062284570714",
        "1191725638156025919"
    ],
    
    // Fungsi umum untuk ambil config
    getChannel: (guildId, type) => {
        return getConfig(guildId, type);
    },

    // KITA UBAH BAGIAN INI JADI DINAMIS
    categories: {
        getTicket: (guildId) => getConfig(guildId, "ticketCategory") || "1451162050762899530" // Fallback ke ID lama jika belum disetup
    }
};