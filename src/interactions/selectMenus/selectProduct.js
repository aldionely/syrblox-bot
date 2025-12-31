const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const paymentMethods = require("../../utils/paymentMethods");

module.exports = {
    customId: "select_product",
    async execute(interaction, client) {
        const productId = interaction.values[0];

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`select_payment:${productId}`) // Pass Product ID ke step berikutnya
            .setPlaceholder("Pilih metode pembayaran")
            .addOptions(
                Object.keys(paymentMethods).map(k => ({
                    label: paymentMethods[k].label,
                    value: k
                }))
            );

        return interaction.update({
            components: [new ActionRowBuilder().addComponents(menu)]
        });
    }
};