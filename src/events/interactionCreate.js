const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("../config");
const getOpenProducts = require("../utils/getOpenProducts");
const paymentMethods = require("../utils/paymentMethods");

/* FORMAT RUPIAH */
const formatRupiah = (n) =>
    new Intl.NumberFormat("id-ID").format(n);

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {

        if (!interaction.client.waitingUpload) {
            interaction.client.waitingUpload = new Set();
        }

        /* ================= ORDER START ================= */

        if (interaction.isButton() && interaction.customId === "order_start") {
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

        if (interaction.isStringSelectMenu() && interaction.customId === "select_product") {
            const productId = interaction.values[0];

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`select_payment:${productId}`)
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

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("select_payment")) {
            const productId = interaction.customId.split(":")[1];
            const paymentKey = interaction.values[0];
            const paymentData = paymentMethods[paymentKey];

            const products = JSON.parse(
                fs.readFileSync(path.join(__dirname, "../data/products.json"))
            );
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const ticket = await interaction.guild.channels.create({
                name: `order-${interaction.user.username}`.toLowerCase(),
                type: ChannelType.GuildText,
                parent: config.categories.ticket,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            /* ORDER EMBED */
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

            /* PAYMENT EMBED */
            const paymentEmbed = new EmbedBuilder()
    .setTitle("💳 INFORMASI PEMBAYARAN")
    .setColor("#00BFFF");

if (paymentData.type === "ewallet") {
    paymentEmbed.setDescription(
        `**METODE :** ${paymentData.label}\n` +
        `**NOMOR :** ${paymentData.number}\n` +
        `**NAMA :** ${paymentData.name}`
    );
}

if (paymentData.type === "bank") {
    paymentEmbed.setDescription(
        `**BANK :** ${paymentData.bank}\n` +
        `**NAMA :** ${paymentData.name}\n` +
        `**NO REK :** \`\`\`css\n${paymentData.number}\n\`\`\`\n`
    );
}

if (paymentData.type === "qris") {
    paymentEmbed
        .setDescription(
            `**METODE :** QRIS\n` +
            `**NAMA :** ${paymentData.name}\n\n` +
            `Silakan scan QR di bawah ini`
        )
        .setImage(paymentData.image);
}
            const uploadRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("upload_bukti")
                    .setLabel("➡ Sudah bayar? klik disini. ⬅")
                    .setStyle(ButtonStyle.Primary)
            );

            await ticket.send({
                content:
                    `<@${interaction.user.id}>\n` +
                    config.adminIds.map(id => `<@${id}>`).join(" "),
                embeds: [orderEmbed, paymentEmbed],
                components: [uploadRow]
            });

            return interaction.update({
                content: `<:85618verified:1455185880330539173> order dibuat: ${ticket}`,
                components: [],
                ephemeral: true
            });
        }

        /* ================= UPLOAD BUKTI ================= */

        if (interaction.isButton() && interaction.customId === "upload_bukti") {
            interaction.client.waitingUpload.add(interaction.channel.id);
            return interaction.reply({
                ephemeral: true,
                content: "silahkan upload **bukti pembayaran** di channel ini\n (kirim sekali aja)."
            });
        }

        /* ================= ADMIN CONFIRM ================= */

        if (interaction.isButton() && interaction.customId.startsWith("payment_confirm")) {
            if (!config.adminIds.includes(interaction.user.id)) {
                return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
            }

            const ticketId = interaction.customId.split(":")[1];
            const ticket = interaction.guild.channels.cache.get(ticketId);
            if (!ticket) return;

            const messages = await ticket.messages.fetch({ limit: 50 });
            const orderMsg = messages.find(
                m => m.embeds.length && m.embeds[0].title.includes("ORDER BARU")
            );

            if (orderMsg) {
                const updated = EmbedBuilder.from(orderMsg.embeds[0]);
                updated.setDescription(
                    updated.data.description
                        .replace("`MENUNGGU`", "`SUDAH BAYAR`")
                        .replace("`MENUNGGU`", "`DALAM PROSES`")
                );
                await orderMsg.edit({ embeds: [updated] });
            }

            const confirmEmbed = new EmbedBuilder()
                .setTitle("<:157030approvedids:1455185882851315795> PEMBAYARAN DITERIMA")
                .setColor("#00FF88")
                .setDescription(
                    "Pembayaran telah diterima.\n" +
                    "Silakan isi data login Roblox dengan tombol di bawah."
                );

            const loginRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("fill_roblox_login")
                    .setLabel("🔐 Isi Data Login")
                    .setStyle(ButtonStyle.Primary)
            );

            await ticket.send({ embeds: [confirmEmbed], components: [loginRow] });
            return interaction.update({ components: [] });
        }

        /* ================= ADMIN REJECT ================= */

        if (interaction.isButton() && interaction.customId.startsWith("payment_reject")) {
            if (!config.adminIds.includes(interaction.user.id)) {
                return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
            }

            const ticket = interaction.guild.channels.cache.get(
                interaction.customId.split(":")[1]
            );
            if (!ticket) return;

            interaction.client.waitingUpload.add(ticket.id);
            await ticket.send("❌ **PEMBAYARAN DITOLAK**\nSilakan kirim bukti valid.");
            return interaction.update({ components: [] });
        }

        /* ================= LOGIN ROBLOX ================= */

        if (interaction.isButton() && interaction.customId === "fill_roblox_login") {
            const modal = new ModalBuilder()
                .setCustomId("roblox_login_modal")
                .setTitle("Isi Data Login Roblox");

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("rbx_username")
                        .setLabel("Username Roblox")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId("rbx_password")
                        .setLabel("Password Roblox")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );

            return interaction.showModal(modal);
        }

        /* ================= SUBMIT LOGIN ================= */

        if (interaction.isModalSubmit() && interaction.customId === "roblox_login_modal") {
            const username = interaction.fields.getTextInputValue("rbx_username");
            const password = interaction.fields.getTextInputValue("rbx_password");

            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            const orderMsg = messages.find(
                m => m.embeds.length && m.embeds[0].title.includes("ORDER BARU")
            );

            const log = interaction.guild.channels.cache.get(config.channels.orderLog);
            if (!log || !orderMsg) return;

            const logEmbed = new EmbedBuilder()
                .setTitle("🔐 DATA LOGIN ROBLOX — SYRBLOX")
                .setColor("#FF5555")
                .setDescription(
                    `👤 **User:** <@${interaction.user.id}>\n` +
                    `📍 **Ticket:** ${interaction.channel}\n\n` +
                    `${orderMsg.embeds[0].data.description}\n\n` +
                    `**Email:** \`${username}\`\n` +
                    `**Pw Roblox:** \`${password}\``
                );

            const finishRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`order_finish:${interaction.channel.id}`)
                    .setLabel("✅ Selesaikan Order")
                    .setStyle(ButtonStyle.Success)
            );

            await log.send({ embeds: [logEmbed], components: [finishRow] });

            await interaction.reply({
                ephemeral: true,
                content: "<:verif1:1452333754075840806> Data login berhasil di kirim ke admin."
            });
            
            await interaction.channel.send("<a:88094loading:1455195433516269589> **Robux sedang diproses oleh admin.**");
        }

        /* ================= FINISH ORDER ================= */

if (interaction.isButton() && interaction.customId.startsWith("order_finish")) {
    if (!config.adminIds.includes(interaction.user.id)) {
        return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
    }

    await interaction.deferUpdate();

    /* UPDATE ORDER LOG + MATIKAN TOMBOL */
    const logEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    logEmbed.setDescription(
        logEmbed.data.description.replace(
            "📦 **Status Order:** `DALAM PROSES`",
            "📦 **Status Order:** `SELESAI`"
        )
    );

    await interaction.message.edit({
        embeds: [logEmbed],
        components: []
    });

    /* TARGET TICKET */
    const ticketId = interaction.customId.split(":")[1];
    const ticket = interaction.guild.channels.cache.get(ticketId);
    if (!ticket) return;

    /* UPDATE EMBED DI TICKET */
    const messages = await ticket.messages.fetch({ limit: 50 });
    const orderMsg = messages.find(
        m => m.embeds.length && m.embeds[0].title.includes("ORDER BARU")
    );

    if (orderMsg) {
        const updated = EmbedBuilder.from(orderMsg.embeds[0]);
        updated.setDescription(
            updated.data.description.replace(
                "📦 **Status Order:** `DALAM PROSES`",
                "📦 **Status Order:** `SELESAI`"
            )
        );
        await orderMsg.edit({ embeds: [updated] });
    }

    /* LOCK CHANNEL */
    await ticket.permissionOverwrites.edit(ticket.guild.id, {
        SendMessages: false
    });

    const buyerOverwrite = ticket.permissionOverwrites.cache.find(o => o.type === 1);
    if (buyerOverwrite) {
        await ticket.permissionOverwrites.edit(buyerOverwrite.id, {
            SendMessages: false
        });
    }

    /* EMBED ORDER SELESAI */
    await ticket.send({
        content:
        `<@${buyerOverwrite.id}>`,
        embeds: [
            new EmbedBuilder()
                .setTitle("<:85618verified:1455185880330539173> ORDER SELESAI — SYRBLOX")
                .setColor("#00FF88")
                .setDescription(
                    "Order telah selesai.\n" +
                    "Ticket ini bersifat **read-only** dan akan dihapus otomatis dalam **7 hari**."
                )
        ]
    });
}



    }
};
