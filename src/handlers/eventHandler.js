const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const eventPath = path.join(__dirname, "../events");
    if (!fs.existsSync(eventPath)) return;

    const files = fs.readdirSync(eventPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
        const event = require(path.join(eventPath, file));

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }

    console.log("✅ Event handler loaded");
};
