const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('like')
    .setDescription('Send likes to a Free Fire UID')
    .addStringOption(option =>
      option.setName('uid')
        .setDescription('Your Free Fire UID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('region')
        .setDescription('Region code like ind, sg, br')
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    console.log('Deploying commands with:');
    console.log('CLIENT_ID:', process.env.CLIENT_ID);
    console.log('ILD_ID:', process.env.GUILD_ID);
    console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ Token loaded' : '❌ Token missing');
    
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();GU