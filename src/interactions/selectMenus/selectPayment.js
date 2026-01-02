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

        // Ambil Kategori ID dari database
        const categoryId = config.categories.getTicket(interaction.guild.id);
        
        // Validasi: Pastikan admin sudah setup kategori ticket
        if (!categoryId) {
            return interaction.reply({ 
                content: "❌ **Sistem Error:** Admin belum melakukan `/setup tipe:Kategori Ticket`. Mohon hubungi admin.", 
                ephemeral: true 
            });
        }
        
        // --- [BAGIAN INI YANG DIUBAH] ---
        // Membuat nama ticket: order-rbx + 4 angka acak
        const randomNum = Math.floor(1000 + Math.random() * 9000); // Menghasilkan angka antara 1000 - 9999
        const ticketName = `order-rbx${randomNum}`; 
        // --------------------------------

        // Buat Ticket
        const ticket = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: categoryId, 
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
            paymentEmbed.setDescription(`**BANK :** ${paymentData.bank}\n**NAMA :** ${paymentData.name}\n**NO REK :** \`\`\`css\n${paymentData.number}\n\`\`\`\n\n silahkan transfer sesuai nominal dan rekening di atas.`);
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
            content: `<a:6521verificationicon:1456639259787133202> Order dibuat, lanjut kesini buat pembayaran: ${ticket}`,
            components: [],
            ephemeral: true
        });
    }
};