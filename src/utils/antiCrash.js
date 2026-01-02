const { EmbedBuilder } = require("discord.js");
const db = require("../database/db"); // Import Database

module.exports = (client) => {
    // Fungsi Helper: Cari Channel Log di Database & Kirim Pesan
    const sendErrorLog = async (title, errorData, color) => {
        try {
            // 1. Cari settingan 'errorLog' di database (ambil yang pertama ketemu aja)
            const row = db.prepare("SELECT value FROM configs WHERE key = 'errorLog' LIMIT 1").get();
            
            if (!row) return; // Kalau belum disetup, diam saja (console only)

            const channelId = row.value;
            const channel = await client.channels.fetch(channelId).catch(() => null);

            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setColor(color)
                    .setDescription(`\`\`\`js\n${errorData}\n\`\`\``)
                    .setTimestamp();
                
                await channel.send({ content: "⚠️ **SYSTEM ALERT: An Error Occurred!**", embeds: [embed] });
            }
        } catch (e) {
            console.error("Gagal mengirim error log ke Discord:", e);
        }
    };

    // 1. Uncaught Exception
    process.on("uncaughtException", (err, origin) => {
        console.log(" [AntiCrash] :: Uncaught Exception");
        console.log(err, origin);
        
        const errorMsg = err.stack ? err.stack.slice(0, 4000) : `${err}`;
        sendErrorLog("🚨 CRITICAL ERROR: Uncaught Exception", errorMsg, "#FF0000");
    });

    // 2. Unhandled Rejection
    process.on("unhandledRejection", (reason, promise) => {
        console.log(" [AntiCrash] :: Unhandled Rejection");
        console.log(reason);

        const errorMsg = reason.stack ? reason.stack.slice(0, 4000) : `${reason}`;
        sendErrorLog("⚠️ ERROR: Unhandled Rejection", errorMsg, "#FFA500");
    });

    // 3. Monitor (Optional)
    process.on("uncaughtExceptionMonitor", (err, origin) => {
        console.log(" [AntiCrash] :: Monitor");
    });

    console.log("✅ Anti-Crash System Activated (Database Mode)");
};