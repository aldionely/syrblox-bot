require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Tempat simpan command
client.commands = new Collection();

// Load handler
require("./handlers/commandHandler")(client);
require("./handlers/eventHandler")(client);

// Login bot
client.login(process.env.BOT_TOKEN);
