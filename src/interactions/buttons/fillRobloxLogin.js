const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    customId: "fill_roblox_login", // <--- Pastikan ID ini sama persis
    async execute(interaction, client) {
        // Modal TIDAK BOLEH di-defer. Harus langsung showModal.
        const modal = new ModalBuilder()
            .setCustomId("roblox_login_modal")
            .setTitle("Isi Data Login Roblox");

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("rbx_username")
                    .setLabel("E-mail Login")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("rbx_password")
                    .setLabel("Password Login")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            )
        );

        await interaction.showModal(modal);
    }
};