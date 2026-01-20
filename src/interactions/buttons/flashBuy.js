const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder } = require("discord.js");
const db = require("../../database/db");
const config = require("../../config");
const paymentMethods = require("../../utils/paymentMethods");

module.exports = {
    customId: "flash_buy",
    async execute(interaction, client) {
        // 1. Cek Blacklist
        const isBlacklisted = db.prepare("SELECT * FROM blacklist WHERE user_id = ?").get(interaction.user.id);
        if (isBlacklisted) return interaction.reply({ content: "⛔ Anda diblacklist.", ephemeral: true });

        const flashId = interaction.customId.split(":")[1];
        
        // 2. Ambil Data Flash Sale (Standalone)
        const sale = db.prepare("SELECT * FROM flash_sales WHERE id = ?").get(flashId);
        
        if (!sale || sale.status !== 'active') {
            return interaction.reply({ content: "❌ Flash Sale ini sudah berakhir.", ephemeral: true });
        }

        if (Date.now() > sale.end_time) {
            return interaction.reply({ content: "⏰ Waktu Flash Sale sudah habis!", ephemeral: true });
        }

        if (sale.stock <= 0) {
            return interaction.reply({ content: "😭 Yah.. Stok habis gan!", ephemeral: true });
        }

        // 3. Cek Apakah User Sudah Pernah Beli
        const participant = db.prepare("SELECT * FROM flash_users WHERE flash_id = ? AND user_id = ?").get(flashId, interaction.user.id);
        if (participant) {
            return interaction.reply({ content: "⛔ Kamu hanya boleh beli 1x per event Flash Sale ini.", ephemeral: true });
        }

        // --- TRANSAKSI STOK ---
        const result = db.prepare("UPDATE flash_sales SET stock = stock - 1 WHERE id = ? AND stock > 0").run(flashId);

        if (result.changes === 0) {
            return interaction.reply({ content: "😭 Stok baru saja habis diambil orang lain!", ephemeral: true });
        }

        // 4. Buat Tiket
        const categoryId = config.categories.getTicket(interaction.guild.id);
        if (!categoryId) return interaction.reply({ content: "❌ Admin belum setup kategori ticket.", ephemeral: true });

        const ticketName = `flash-${interaction.user.username.substring(0, 5)}`;
        
        const ticket = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        // 5. Simpan Data User & Timer
        const expiryTime = Date.now() + (5 * 60 * 1000); 
        
        db.prepare("INSERT INTO flash_users (flash_id, user_id, channel_id, expiry_time, status) VALUES (?, ?, ?, ?, 'pending')")
          .run(flashId, interaction.user.id, ticket.id, expiryTime);

        // 6. Kirim Invoice Flash Sale (Data dari tabel flash_sales langsung)
        const formatRupiah = (n) => new Intl.NumberFormat("id-ID").format(n);
        const uniqueCode = Math.floor(Math.random() * 99) + 1;
        const totalBayar = sale.flash_price + uniqueCode;

        const invoiceEmbed = new EmbedBuilder()
            .setTitle("⚡ TAGIHAN FLASH SALE")
            .setColor("#FF0000")
            .setDescription(`⚠️ **PENTING:** Anda memiliki waktu **5 MENIT** untuk melakukan pembayaran. Jika lewat, tiket otomatis dihapus dan stok dikembalikan.`)
            .addFields(
                { name: '📦 Produk', value: `${sale.product_name}`, inline: true }, // Pakai product_name dari DB
                { name: '💸 Harga Promo', value: `Rp ${formatRupiah(sale.flash_price)}`, inline: true },
                { name: '💰 Total (+Unik)', value: `**Rp ${formatRupiah(totalBayar)}**`, inline: true },
                { name: '⏳ Batas Waktu', value: `<t:${Math.floor(expiryTime / 1000)}:R>`, inline: false }
            );

        const menu = new StringSelectMenuBuilder()
            .setCustomId("select_flash_payment") 
            .setPlaceholder("Pilih Metode Pembayaran")
            .addOptions(Object.keys(paymentMethods).map(k => ({
                label: paymentMethods[k].label,
                value: k
            })));

        const row = new ActionRowBuilder().addComponents(menu);
        
        const rowBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("cancel_order").setLabel("Batal (Kembalikan Stok)").setStyle(ButtonStyle.Danger)
        );

        await ticket.send({ 
            content: `<@${interaction.user.id}> ⚡ Segera lunasi!`, 
            embeds: [invoiceEmbed], 
            components: [row, rowBtn] 
        });

        return interaction.reply({ content: `✅ Berhasil dapat slot! Cek tiket: ${ticket}`, ephemeral: true });
    }
};