const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const getOpenProducts = require("../../utils/getOpenProducts");
const formatRupiah = (n) => new Intl.NumberFormat("id-ID").format(n);

module.exports = {
    customId: "order_start",
    async execute(interaction, client) {
        const products = getOpenProducts();
        if (!products.length) {
            return interaction.reply({ content: "❌ Tidak ada produk.", ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId("select_product")
            .setPlaceholder("Pilih jumlah robux")
            .addOptions(products.map(p => ({
                label: `${p.jumlah} Robux`,
                description: `Rp ${formatRupiah(p.harga)}`,
                value: p.id
            })));

        return interaction.reply({
            ephemeral: true,
            components: [new ActionRowBuilder().addComponents(menu)]
        });
    }
};