const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const interactionsFolder = path.join(__dirname, "../interactions");

    // Buat folder jika belum ada
    if (!fs.existsSync(interactionsFolder)) {
        fs.mkdirSync(interactionsFolder);
    }

    const categories = ["buttons", "modals", "selectMenus"];

    for (const category of categories) {
        const categoryPath = path.join(interactionsFolder, category);
        
        // Buat sub-folder jika belum ada
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
            continue;
        }

        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith(".js"));

        for (const file of files) {
            const interaction = require(path.join(categoryPath, file));
            // Simpan ke memory bot
            if (interaction.customId) {
                client.interactions.set(interaction.customId, interaction);
            }
        }
    }
    
    console.log("✅ Interaction handler loaded");
};