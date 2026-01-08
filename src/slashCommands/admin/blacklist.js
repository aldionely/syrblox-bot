const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../database/db");
const config = require("../../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blacklist")
        .setDescription("Kelola daftar user yang dilarang order (Admin Only)")
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Ban user dari bot")
                .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
                .addStringOption(opt => opt.setName("reason").setDescription("Alasan").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Hapus user dari blacklist")
                .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("check")
                .setDescription("Cek apakah user terkena blacklist")
                .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
        ),
    async execute(interaction) {
        // Cek Admin
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();
        const target = interaction.options.getUser("user");

        // --- ADD ---
        if (sub === "add") {
            const reason = interaction.options.getString("reason");
            
            // Cek apakah sudah ada
            const exists = db.prepare("SELECT * FROM blacklist WHERE user_id = ?").get(target.id);
            if (exists) return interaction.reply({ content: `⚠️ <@${target.id}> sudah ada di blacklist!`, ephemeral: true });

            db.prepare("INSERT INTO blacklist (user_id, reason, admin_id, timestamp) VALUES (?, ?, ?, ?)")
              .run(target.id, reason, interaction.user.id, Date.now());

            const embed = new EmbedBuilder()
                .setTitle("⛔ USER BLACKLISTED")
                .setColor("#FF0000")
                .setDescription(
                    `👤 **User:** <@${target.id}> (${target.tag})\n` +
                    `📝 **Alasan:** ${reason}\n` +
                    `👮 **Admin:** <@${interaction.user.id}>`
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // --- REMOVE ---
        if (sub === "remove") {
            const result = db.prepare("DELETE FROM blacklist WHERE user_id = ?").run(target.id);
            
            if (result.changes === 0) {
                return interaction.reply({ content: `❌ <@${target.id}> tidak ada di database blacklist.`, ephemeral: true });
            }

            return interaction.reply(`✅ **Sukses!** <@${target.id}> telah dihapus dari blacklist. Dia bisa order lagi sekarang.`);
        }

        // --- CHECK ---
        if (sub === "check") {
            const data = db.prepare("SELECT * FROM blacklist WHERE user_id = ?").get(target.id);
            
            if (!data) return interaction.reply(`✅ <@${target.id}> **AMAN** (Tidak di-blacklist).`);

            return interaction.reply({
                content: `🚫 **TERDETEKSI!** <@${target.id}> ada di blacklist.\n**Alasan:** ${data.reason}`,
                ephemeral: true
            });
        }
    }
};