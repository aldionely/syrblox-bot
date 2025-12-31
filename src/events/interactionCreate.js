module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        
        // --- 1. HANDLE SLASH COMMAND (/) ---
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Error sistem slash command.', ephemeral: true });
                }
            }
            return; // Stop disini agar tidak lanjut ke handler button
        }

        // --- 2. HANDLE BUTTON / MODAL / SELECT MENU ---
        // (Logika Button yang sudah kita rapihin sebelumnya)
        let customId = interaction.customId;

        if (customId && customId.includes(":")) {
            customId = customId.split(":")[0]; 
        }

        const handler = client.interactions.get(customId);

        if (!handler) {
            // Hilangkan warn jika bukan tipe interaksi yang kita kenal
            if (!interaction.isAutocomplete()) { 
                // console.warn(`⚠️ Handler tidak ditemukan: ${customId}`); 
            }
            return; 
        }

        try {
            await handler.execute(interaction, client);
        } catch (error) {
            console.error(`❌ Error interaksi ${customId}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Terjadi error.', ephemeral: true }).catch(() => {});
            }
        }
    }
};