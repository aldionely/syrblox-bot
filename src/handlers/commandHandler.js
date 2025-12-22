const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const commandPath = path.join(__dirname, "../commands");
    if (!fs.existsSync(commandPath)) return;

    const folders = fs.readdirSync(commandPath);

    for (const folder of folders) {
        const folderPath = path.join(commandPath, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

        for (const file of files) {
            const command = require(path.join(folderPath, file));
            if (!command.name) continue;
            client.commands.set(command.name, command);
        }
    }

    console.log("✅ Command handler loaded");
};
