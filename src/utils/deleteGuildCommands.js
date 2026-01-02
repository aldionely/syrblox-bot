const { REST, Routes } = require("discord.js");
require("dotenv").config();

// GANTI ID SERVER DI BAWAH INI DENGAN ID SERVER YANG COMMANDNYA DOUBLE
const GUILD_ID = "466142259121881090"; 

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
	try {
		console.log(`🗑️ Sedang menghapus semua Guild Commands di server ${GUILD_ID}...`);

		// Kita kirim array kosong [] yang artinya "Tolong set command di server ini jadi 0"
		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
			{ body: [] },
		);

		console.log("✅ Sukses! Semua command versi Guild (Lama) sudah dihapus.");
        console.log("🔄 Silakan Restart Discord kamu (Ctrl + R) untuk melihat efeknya.");
	} catch (error) {
		console.error(error);
	}
})();