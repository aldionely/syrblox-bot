const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    customId: "testimoni_start",
    async execute(interaction, client) {
        const modal = new ModalBuilder()
            .setCustomId("testimoni_modal")
            .setTitle("Kirim Testimoni");

        // Input 1: Pesan Testimoni
        const reviewInput = new TextInputBuilder()
            .setCustomId("testi_pesan")
            .setLabel("Gimana pengalaman beli di SYRBLOX?")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Prosesnya cepat banget, mantap min!")
            .setRequired(true);

        // Input 2: Rating
        const ratingInput = new TextInputBuilder()
            .setCustomId("testi_rating")
            .setLabel("Berikan rating (1-10)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("10")
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(reviewInput),
            new ActionRowBuilder().addComponents(ratingInput)
        );

        await interaction.showModal(modal);
    }
};