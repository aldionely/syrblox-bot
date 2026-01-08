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

        const categoryId = config.categories.getTicket(interaction.guild.id);
        
        if (!categoryId) {
            return interaction.reply({ 
                content: "❌ **Sistem Error:** Admin belum melakukan `/setup tipe:Kategori Ticket`. Mohon hubungi admin.", 
                ephemeral: true 
            });
        }
        
        const randomNum = Math.floor(1000 + Math.random() * 9000); 
        const ticketName = `order-rbx${randomNum}`; 
        const invoiceId = `INV-${randomNum}`;

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

        // --- VARIABEL GARIS PEMISAH ---
        const separator = { name: ' ', value: '─────────────────────────────', inline: false };

        // --- EMBED INVOICE VERTIKAL ---
        const invoiceEmbed = new EmbedBuilder()
            .setTitle(`🧾 SYRBLOX - INVOICE`)
            .setColor("#FFFFFF") 
            .setDescription(`**No. Invoice:** \`${invoiceId}\`\nsilahkan selesaikan pembayaran agar pembelian dapat diproses.`)
            .addFields(
                // BAGIAN 1: INFO CUSTOMER
                { 
                    name: '<:CF11:1456662765346230385> **INFORMASI PEMBELIAN**', 
                    value: `**Username :** <@${interaction.user.id}>\n**Tanggal :** <t:${Math.floor(Date.now() / 1000)}:f>`, 
                    inline: false 
                },
                
                separator, // Garis

                // BAGIAN 2: RINCIAN PRODUK
                { 
                    name: '<:CF11:1456662765346230385> **RINCIAN PEMBELIAN**', 
                    value: `**Produk :** ${product.id}\n**Jumlah :** ${product.jumlah} Robux\n**Harga :** Rp ${formatRupiah(product.harga)}`, 
                    inline: false 
                },

                separator, // Garis

                // BAGIAN 3: TOTAL & METODE
                { 
                    name: '<:CF11:1456662765346230385> TOTAL BAYAR', 
                    value: `**Rp ${formatRupiah(product.harga)}**`, 
                    inline: false 
                },
                { 
                    name: '<:CF11:1456662765346230385> METODE PEMBAYARAN', 
                    value: `**${paymentData.label}**`, 
                    inline: false 
                },

                separator, // Garis

                // BAGIAN 4: STATUS (DIBUAT TERPISAH)
                { 
                    name: '<:CF11:1456662765346230385> Status Payment', 
                    value: `<a:9366laydowntorest:1455168887833366559>\`MENUNGGU PEMBAYARAN\``, 
                    inline: false 
                },
                { 
                    name: '<:CF11:1456662765346230385> Status Order', 
                    value: `<a:9366laydowntorest:1455168887833366559>\`MENUNGGU PROSES\``, 
                    inline: false 
                }
            )
            .setFooter({ text: "SYRBLOX OFFICAL.", iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // --- EMBED DETAIL REKENING ---
        const paymentEmbed = new EmbedBuilder()
            .setTitle("💳 INSTRUKSI TRANSFER")
            .setColor("#00BFFF");

        if (paymentData.type === "ewallet") {
            paymentEmbed.setDescription(
                `Silakan transfer ke **${paymentData.label}**:\n` +
                `## ${paymentData.number}\n` +
                `**A/N :** ${paymentData.name}\n\n` +
                `*Mohon transfer sebesar* ***Rp ${formatRupiah(product.harga)}***`
            );
        } else if (paymentData.type === "bank") {
            paymentEmbed.setDescription(
                `Silakan transfer ke **BANK ${paymentData.bank}**:\n` +
                `# \`\`\`${paymentData.number}\`\`\`\n` +
                `**A/N :** ${paymentData.name}\n\n` +
                `*Mohon transfer sebesar* ***Rp ${formatRupiah(product.harga)}***`
            );
        } else if (paymentData.type === "qris") {
            paymentEmbed.setDescription(`**Scan QRIS di bawah ini:**\n**A/N :** ${paymentData.name}`).setImage(paymentData.image);
        }

        const uploadRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("upload_bukti")
                .setLabel("Konfirmasi Pembayaran")
                .setStyle(ButtonStyle.Success)
                .setEmoji("🧾")
        );

        await ticket.send({
            content: `<@${interaction.user.id}> ` + config.adminIds.map(id => `<@${id}>`).join(" "),
            embeds: [invoiceEmbed, paymentEmbed],
            components: [uploadRow]
        });

        return interaction.update({
            content: `<a:6521verificationicon:1456639259787133202> Invoice berhasil dibuat. cek disini: ${ticket}`,
            components: [],
            ephemeral: true
        });
    }
};