const { EmbedBuilder } = require('discord.js');
const verifySessions = require('../../utils/verifySession');
const config = require('../../config');

function generateCaptcha() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

module.exports = {
    name: 'verif', // Nama command (tanpa prefix)
    async execute(message, args, client) {
        // 1. Cek Channel
        const verifyChannelId = config.getChannel(message.guild.id, 'verify');
        
        if (!verifyChannelId) {
            return message.reply("❌ Admin belum setup channel verifikasi.");
        }

        if (message.channel.id !== verifyChannelId) {
            setTimeout(() => message.delete().catch(() => {}), 1000);
            return message.channel.send(`❌ Gunakan command ini di <#${verifyChannelId}>`)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        }

        const userId = message.author.id;

        // 2. Cek apakah user sudah punya role (Biar gak spam)
        if (config.verifiedRole && message.member.roles.cache.has(config.verifiedRole)) {
            return message.reply("✅ Kamu sudah terverifikasi!");
        }

        // 3. Cek sesi aktif
        if (verifySessions.has(userId)) {
            return message.reply("⏳ Kamu masih punya sesi verifikasi aktif. Cek pesan sebelumnya.");
        }

        const captcha = generateCaptcha();

        // 4. Simpan sesi (User ID -> Kode)
        verifySessions.set(userId, {
            code: captcha,
            channelId: message.channel.id
        });

        const embed = new EmbedBuilder()
            .setTitle('🔐 VERIFIKASI DIRI')
            .setDescription(
                `Ketik **kode angka** berikut di chat ini:\n\n` +
                `# \`${captcha}\`\n` +
                `*(Waktu: 20 detik)*`
            )
            .setColor(0x00ff99)
            .setFooter({ text: 'Ketik angkanya saja tanpa prefix.' });

        const sent = await message.channel.send({ embeds: [embed] });

        // Timer 20 Detik (Hapus sesi jika expired)
        setTimeout(() => {
            if (verifySessions.has(userId)) {
                verifySessions.delete(userId);
                sent.delete().catch(() => {}); // Hapus pesan captcha
            }
        }, 20000);
    }
};