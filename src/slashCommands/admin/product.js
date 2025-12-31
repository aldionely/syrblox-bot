const { SlashCommandBuilder } = require("discord.js");
const db = require("../../database/db");
const updatePricelist = require("../../utils/updatePricelist");
const config = require("../../config");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("product")
        .setDescription("Manajemen Produk (Admin)")
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Tambah produk baru")
                .addStringOption(opt => opt.setName("id").setDescription("Kode Produk (ex: RBX100)").setRequired(true))
                .addIntegerOption(opt => opt.setName("jumlah").setDescription("Jumlah Robux").setRequired(true))
                .addIntegerOption(opt => opt.setName("harga").setDescription("Harga (Rupiah)").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("delete")
                .setDescription("Hapus produk")
                .addStringOption(opt => opt.setName("id").setDescription("Kode Produk").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("edit")
                .setDescription("Edit harga/jumlah produk")
                .addStringOption(opt => opt.setName("id").setDescription("Kode Produk").setRequired(true))
                .addStringOption(opt => opt.setName("field").setDescription("Yang diedit").setRequired(true)
                    .addChoices({ name: 'Harga', value: 'harga' }, { name: 'Jumlah', value: 'jumlah' }))
                .addIntegerOption(opt => opt.setName("value").setDescription("Nilai Baru").setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName("status")
                .setDescription("Ubah status produk")
                .addStringOption(opt => opt.setName("id").setDescription("Kode Produk").setRequired(true))
                .addStringOption(opt => opt.setName("status").setDescription("Status").setRequired(true)
                    .addChoices({ name: 'OPEN', value: 'open' }, { name: 'CLOSE', value: 'close' }))
        ),
    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const id = interaction.options.getString("id");

        // --- ADD ---
        if (subcommand === "add") {
            const jumlah = interaction.options.getInteger("jumlah");
            const harga = interaction.options.getInteger("harga");

            const exists = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
            if (exists) return interaction.reply({ content: "❌ ID produk sudah ada.", ephemeral: true });

            db.prepare("INSERT INTO products (id, jumlah, harga, status) VALUES (?, ?, ?, 'open')")
              .run(id, jumlah, harga);
            
            await updatePricelist(interaction.guild);
            return interaction.reply(`✅ Produk **${id}** (${jumlah} Robux) berhasil ditambahkan.`);
        }

        // --- DELETE ---
        if (subcommand === "delete") {
            const res = db.prepare("DELETE FROM products WHERE id = ?").run(id);
            if (res.changes === 0) return interaction.reply({ content: "❌ Produk tidak ditemukan.", ephemeral: true });
            
            await updatePricelist(interaction.guild);
            return interaction.reply(`🗑️ Produk **${id}** dihapus.`);
        }

        // --- EDIT ---
        if (subcommand === "edit") {
            const field = interaction.options.getString("field");
            const value = interaction.options.getInteger("value");
            
            const res = db.prepare(`UPDATE products SET ${field} = ? WHERE id = ?`).run(value, id);
            if (res.changes === 0) return interaction.reply({ content: "❌ Produk tidak ditemukan.", ephemeral: true });

            await updatePricelist(interaction.guild);
            return interaction.reply(`✏️ Produk **${id}** diupdate: ${field} menjadi ${value}.`);
        }

        // --- STATUS ---
        if (subcommand === "status") {
            const status = interaction.options.getString("status");
            const res = db.prepare("UPDATE products SET status = ? WHERE id = ?").run(status, id);
            if (res.changes === 0) return interaction.reply({ content: "❌ Produk tidak ditemukan.", ephemeral: true });

            await updatePricelist(interaction.guild);
            return interaction.reply(`🔄 Status **${id}** diubah menjadi **${status.toUpperCase()}**.`);
        }
    }
};