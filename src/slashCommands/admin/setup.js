const { SlashCommandBuilder, ChannelType } = require("discord.js");
const db = require("../../database/db");
const config = require("../../config");

// IMPORT UTILITY UPDATE
const updatePricelist = require("../../utils/updatePricelist");
const updateOrder = require("../../utils/updateOrder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup Channel & Kategori Bot (Per Server)")
        .addStringOption(opt => 
            opt.setName("tipe")
               .setDescription("Tipe Konfigurasi")
               .setRequired(true)
               .addChoices(
                   // --- DAFTAR OPSI SETUP ---
                   { name: 'Channel Order (Tombol Beli)', value: 'order' }, 
                   { name: 'Channel Pricelist', value: 'pricelist' },
                   // OPSI BARU (BROADCAST) 👇
                   { name: 'Channel Broadcast (Pengumuman)', value: 'broadcast' }, 
                   { name: 'Log Payment (Bukti Bayar)', value: 'logPayment' },
                   { name: 'Order Log (Data Login)', value: 'orderLog' },
                   { name: 'History (Public)', value: 'history' },
                   { name: 'Testimoni (Public)', value: 'testimoni' },
                   { name: 'Kategori Ticket (Folder)', value: 'ticketCategory' }
               )
        )
        .addChannelOption(opt => 
            opt.setName("channel")
               .setDescription("Pilih Channel atau Kategori")
               .addChannelTypes(ChannelType.GuildText, ChannelType.GuildCategory)
               .setRequired(true)
        ),
    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
        }

        const tipe = interaction.options.getString("tipe");
        const channel = interaction.options.getChannel("channel");
        const guildId = interaction.guild.id;

        // Validasi Kategori
        if (tipe === 'ticketCategory' && channel.type !== ChannelType.GuildCategory) {
            return interaction.reply({ content: "❌ Untuk 'Kategori Ticket', pilih Kategori (Folder).", ephemeral: true });
        }
        if (tipe !== 'ticketCategory' && channel.type === ChannelType.GuildCategory) {
             return interaction.reply({ content: "❌ Untuk opsi ini, pilih Text Channel biasa.", ephemeral: true });
        }

        // Simpan ke Database (Key: broadcast, Value: ID Channel)
        db.prepare("INSERT OR REPLACE INTO configs (guild_id, key, value) VALUES (?, ?, ?)")
          .run(guildId, tipe, channel.id);

        let responseText = `✅ **${tipe}** berhasil diset ke **${channel.name}**.`;

        // Trigger Update Embed (Hanya untuk channel tertentu)
        if (tipe === 'pricelist') {
            try {
                await updatePricelist(interaction.guild);
                responseText += "\n📦 **Embed Pricelist** sedang dikirim/diupdate...";
            } catch (e) { console.error(e); }
        }

        if (tipe === 'order') {
            try {
                await updateOrder(interaction.guild);
                responseText += "\n🛒 **Embed Order** sedang dikirim/diupdate...";
            } catch (e) { console.error(e); }
        }

        return interaction.reply(responseText);
    }
};