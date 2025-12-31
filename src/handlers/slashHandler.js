const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    client.slashCommands = new Map(); // Wadah khusus Slash Command

    const slashPath = path.join(__dirname, "../slashCommands");
    
    // Buat folder jika belum ada
    if (!fs.existsSync(slashPath)) {
        fs.mkdirSync(slashPath);
    }

    const folders = fs.readdirSync(slashPath);

    for (const folder of folders) {
        const folderPath = path.join(slashPath, folder);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

        for (const file of files) {
            const command = require(path.join(folderPath, file));
            if (command.data) {
                client.slashCommands.set(command.data.name, command);
            }
        }
    }

    console.log("✅ Slash Command Handler loaded");
};