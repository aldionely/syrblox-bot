const db = require("../database/db");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {
    setInterval(async () => {
        const now = Date.now();

        // --- 1. CEK TIKET EXPIRED (Belum Bayar) ---
        const expiredTickets = db.prepare("SELECT * FROM flash_users WHERE expiry_time < ? AND status = 'pending'").all(now);

        for (const ticketData of expiredTickets) {
            // A. Hapus Channel
            try {
                const channel = await client.channels.fetch(ticketData.channel_id).catch(() => null);
                if (channel) await channel.delete();
            } catch (e) { console.log("Gagal hapus tiket expired:", e.message); }

            // B. Kembalikan Stok (+1)
            db.prepare("UPDATE flash_sales SET stock = stock + 1 WHERE id = ?").run(ticketData.flash_id);

            // C. Hapus User dari List (Supaya bisa ikut lagi kalau masih ada stok)
            db.prepare("DELETE FROM flash_users WHERE channel_id = ?").run(ticketData.channel_id);

            console.log(`⏰ Tiket Flash Sale ${ticketData.channel_id} expired. Stok dikembalikan.`);
        }

        // --- 2. CEK FLASH SALE BERAKHIR (Waktu Habis) ---
        const activeSales = db.prepare("SELECT * FROM flash_sales WHERE status = 'active'").all();

        for (const sale of activeSales) {
            // Update Stok di Tombol (Visual Realtime)
            try {
                const channel = await client.channels.fetch(sale.channel_id).catch(() => null);
                if (channel) {
                    const msg = await channel.messages.fetch(sale.message_id).catch(() => null);
                    if (msg) {
                        // Jika waktu habis ATAU stok 0
                        const isExpired = now > sale.end_time;
                        const isSoldOut = sale.stock <= 0;

                        if (isExpired || isSoldOut) {
                            // Matikan Tombol
                            const disabledRow = new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId("flash_ended")
                                    .setLabel(isSoldOut ? "❌ SOLD OUT" : "⏰ WAKTU HABIS")
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            );
                            
                            // Jika expired, update status DB biar gak dicek lagi
                            if (isExpired) {
                                db.prepare("UPDATE flash_sales SET status = 'ended' WHERE id = ?").run(sale.id);
                            }

                            await msg.edit({ components: [disabledRow] });
                        } else {
                            // Update Jumlah Stok di Label Tombol (Biar live)
                            const currentBtn = msg.components[0].components[0];
                            // Cek dulu biar gak spam edit api kalau labelnya sama
                            if (!currentBtn.label.includes(`(${sale.stock})`)) {
                                const updateRow = new ActionRowBuilder().addComponents(
                                    ButtonBuilder.from(currentBtn).setLabel(`🔥 BELI SEKARANG (${sale.stock})`)
                                );
                                await msg.edit({ components: [updateRow] });
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore error (misal pesan dihapus admin)
            }
        }

    }, 10000); // Cek setiap 10 detik
};