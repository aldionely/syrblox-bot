require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");

// Load Init Database
const initDatabase = require("./database/init");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Setup Collection
client.commands = new Collection();       // Untuk Prefix Command (!)
client.slashCommands = new Collection();  // Untuk Slash Command (/)
client.interactions = new Collection();   // Untuk Button/Modal
client.waitingUpload = new Set();

// Jalankan Database
initDatabase();

// Load SEMUA Handler
require("./handlers/commandHandler")(client);     // Handle !
require("./handlers/slashHandler")(client);       // Handle / (BARU)
require("./handlers/interactionHandler")(client); // Handle Button
require("./handlers/eventHandler")(client);       // Handle Event

require("./utils/flashSaleManager")(client);

client.login(process.env.BOT_TOKEN);