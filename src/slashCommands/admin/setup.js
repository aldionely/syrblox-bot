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
                   { name: 'Order Channel', value: 'order' }, 
                   { name: 'Pricelist Channel', value: 'pricelist' },
                   { name: 'Broadcast Channel', value: 'broadcast' },
                   // OPSI BARU (ERROR LOGS) 👇
                   { name: 'Error Log', value: 'errorLog' },
                   
                   { name: 'Payment Log', value: 'logPayment' },
                   { name: 'Order Log', value: 'orderLog' },
                   { name: 'History Log', value: 'history' },
                   { name: 'Testimoni Channel', value: 'testimoni' },
                   { name: 'Kategori Ticket', value: 'ticketCategory' }
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

        // Validasi Kategori vs Text Channel
        if (tipe === 'ticketCategory' && channel.type !== ChannelType.GuildCategory) {
            return interaction.reply({ content: "❌ Untuk 'Kategori Ticket', pilih Kategori (Folder).", ephemeral: true });
        }
        if (tipe !== 'ticketCategory' && channel.type === ChannelType.GuildCategory) {
             return interaction.reply({ content: "❌ Untuk opsi ini, pilih Text Channel biasa.", ephemeral: true });
        }

        // Simpan ke Database
        db.prepare("INSERT OR REPLACE INTO configs (guild_id, key, value) VALUES (?, ?, ?)")
          .run(guildId, tipe, channel.id);

        let responseText = `✅ **${tipe}** berhasil diset ke **${channel.name}**.`;

        // Trigger Update Embed
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