module.exports = {
    customId: "upload_bukti",
    async execute(interaction, client) {
        // Aktifkan mode menunggu upload di channel ini
        client.waitingUpload.add(interaction.channel.id);
        
        return interaction.reply({
            ephemeral: true,
            content: "Silahkan upload **bukti pembayaran** di channel ini.\ndan tunggu konfirmasi dari admin ya!\n\n(cukup upload 1 bukti saja.)"
        });
    }
};