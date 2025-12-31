module.exports = {
    customId: "upload_bukti",
    async execute(interaction, client) {
        // Aktifkan mode menunggu upload di channel ini
        client.waitingUpload.add(interaction.channel.id);
        
        return interaction.reply({
            ephemeral: true,
            content: "Silahkan upload **bukti pembayaran** (gambar) di channel ini sekarang."
        });
    }
};