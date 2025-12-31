const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ChannelType, PermissionFlagsBits 
} = require("discord.js");
const config = require("../../config");
const paymentMethods = require("../../utils/paymentMethods");
const db = require("../../database/db"); 

const formatRupiah = (n) => new Intl.NumberFormat("id-ID").format(n);

module.exports = {
    customId: "select_payment",
    async execute(interaction, client) {
        const productId = interaction.customId.split(":")[1];
        const paymentKey = interaction.values[0];
        const paymentData = paymentMethods[paymentKey];

        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
        
        if (!product) return interaction.reply({ content: "Produk error/hilang dari database.", ephemeral: true });

        // --- UPDATE PENTING DI SINI ---
        // Ambil Kategori ID dari database
        const categoryId = config.categories.getTicket(interaction.guild.id);
        
        // Buat Ticket
        const ticketName = `order-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        const ticket = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: categoryId, // <--- PAKAI ID DINAMIS
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }
            ]
        });

        const orderEmbed = new EmbedBuilder()
            .setTitle("<:704309pendingids:1455185884549746872> ORDER BARU — SYRBLOX")
            .setColor("#FFD700")
            .setDescription(
                `**◆ User:** <@${interaction.user.id}>\n` +
                `**◆ ID Produk:** ${product.id}\n` +
                `**◆ Jumlah:** ${product.jumlah} Robux\n` +
                `**◆ Harga:** Rp ${formatRupiah(product.harga)}\n` +
                `**◆ Metode Bayar:** ${paymentData.label}\n\n` +
                `📌 **Status Payment:** \`MENUNGGU\`\n` +
                `📦 **Status Order:** \`MENUNGGU\``
            )
            .setFooter({ text: "© SYRBLOX Order System" });

        const paymentEmbed = new EmbedBuilder()
            .setTitle("💳 INFORMASI PEMBAYARAN")
            .setColor("#00BFFF");

        if (paymentData.type === "ewallet") {
            paymentEmbed.setDescription(`**METODE :** ${paymentData.label}\n**NOMOR :** ${paymentData.number}\n**NAMA :** ${paymentData.name}`);
        } else if (paymentData.type === "bank") {
            paymentEmbed.setDescription(`**BANK :** ${paymentData.bank}\n**NAMA :** ${paymentData.name}\n**NO REK :** \`\`\`css\n${paymentData.number}\n\`\`\``);
        } else if (paymentData.type === "qris") {
            paymentEmbed.setDescription(`**METODE :** QRIS\n**NAMA :** ${paymentData.name}\n\nSilakan scan QR di bawah ini`).setImage(paymentData.image);
        }

        const uploadRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("upload_bukti")
                .setLabel("➡ Sudah bayar? klik disini. ⬅")
                .setStyle(ButtonStyle.Primary)
        );

        await ticket.send({
            content: `<@${interaction.user.id}>\n` + config.adminIds.map(id => `<@${id}>`).join(" "),
            embeds: [orderEmbed, paymentEmbed],
            components: [uploadRow]
        });

        return interaction.update({
            content: `<:85618verified:1455185880330539173> Order dibuat: ${ticket}`,
            components: [],
            ephemeral: true
        });
    }
};