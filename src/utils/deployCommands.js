const { REST, Routes } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const commands = [];
const foldersPath = path.join(__dirname, "../slashCommands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log(`⏳ Memulai refresh ${commands.length} application (/) commands secara GLOBAL...`);

        // PERUBAHAN DISINI: Menggunakan applicationCommands (Global)
        // Bukan applicationGuildCommands (Per Server)
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), 
            { body: commands },
        );

        console.log(`✅ Sukses mendaftarkan ${data.length} commands secara Global!`);
        console.log("ℹ️ Catatan: Command Global butuh waktu s/d 1 jam untuk muncul di server baru (cache Discord).");
    } catch (error) {
        console.error(error);
    }
})();