const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("restart")
        .setDescription("Restart bot secara paksa (Admin Only)"),
    async execute(interaction) {
        // 1. Cek Apakah User adalah Admin/Owner
        // SANGAT PENTING: Jangan sampai member biasa iseng merestart bot
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Enak aja! Kamu bukan Admin.", ephemeral: true });
        }

        // 2. Kirim pesan konfirmasi dulu
        await interaction.reply("🔄 **Sedang melakukan restart sistem...**\nBot akan kembali online dalam 5-10 detik.");

        console.log(`[RESTART] Restart diperintahkan oleh ${interaction.user.tag}`);

        // 3. Matikan Proses
        // setTimeout digunakan agar pesan di atas sempat terkirim sebelum bot mati
        setTimeout(() => {
            process.exit(1); // Kode '1' memberitahu PM2 bahwa bot mati (bukan stop normal)
        }, 1000); 
    }
};