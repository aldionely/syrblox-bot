require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

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
        console.log(`🔄 Refreshing ${commands.length} commands...`);
        
        // ID Kamu yang sudah benar
        const CLIENT_ID = "1113483118016479363"; 
        const GUILD_ID = "466142259121881090";

        // --- BAGIAN IF YANG ERROR TADI SUDAH DIHAPUS ---

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Sukses! Slash commands sudah terdaftar.`);
    } catch (error) {
        console.error(error);
    }
})();