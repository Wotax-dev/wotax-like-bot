const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const OWNER_IDS = ['1347611047338709052'];
const CHANNEL_ID = '1398959087592673370';
const cooldown = new Map();

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'like') return;

  const uid = interaction.options.getString('uid');
  const region = interaction.options.getString('region');

  if (interaction.channel.id !== CHANNEL_ID) {
    return interaction.reply({ content: 'This command is not allowed in this channel.', ephemeral: true });
  }
  if (!/^\d+$/.test(uid) || !/^[a-zA-Z]+$/.test(region)) {
    return interaction.reply({ content: 'UID must be numbers and region must only contain letters.', ephemeral: true });
  }

  if (!OWNER_IDS.includes(interaction.user.id)) {
    const last = cooldown.get(interaction.user.id), now = Date.now();
    if (last && now - last < 86400000) {
      const diff = 86400000 - (now - last);
      const h = Math.floor(diff / 3600000),
            m = Math.floor((diff % 3600000) / 60000);
      return interaction.reply({ content: `⏳ Try again in ${h}h ${m}m.`, ephemeral: true });
    }
    cooldown.set(interaction.user.id, now);
  }

  await interaction.deferReply();
  try {
    const res = await axios.get(`https://noxxlikeesusano.vercel.app/like?uid=${uid}&server_name=${region}`);
    const data = res.data;

    const embed = new EmbedBuilder()
      .setTitle('⚡LIKE BOT BY WOTAX⚡')
      .setColor(data.status === 1 ? '#00FFFF' : '#8B0000')
      .setImage('https://i.imgur.com/xzUP5cS.gif')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields({ name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' })
      .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
      .setTimestamp();

    if (data.status === 1) {
      embed.setDescription(
        `💥 **ACCOUNT INFO** 💥\n` +
        `**Player Nickname**: ${data.PlayerNickname}\n` +
        `**Player UID**: ${data.UID}\n` +
        `**Region**: ${region.toUpperCase()}\n\n` +
        `📊 **RESULT STATUS**\n` +
        `**Added**: +${data.LikesGivenByAPI}\n` +
        `**Before**: ${data.LikesbeforeCommand}\n` +
        `**After**: ${data.LikesafterCommand}`
      );
    } else if (data.status === 2) {
      embed.setDescription('❗ You already claimed likes for today.\n\nTry again tomorrow.');
    } else {
      embed.setDescription('❗ Unknown status returned from the API.');
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ ERROR OCCURRED')
      .setDescription(`\`\`\`${err.message}\`\`\``)
      .setColor('#8B0000')
      .setImage('https://i.imgur.com/xzUP5cS.gif')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields({ name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' })
      .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
      .setTimestamp();
    await interaction.editReply({ embeds: [errorEmbed] });
  }
});

// Message-based !like handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const parts = message.content.trim().split(/\s+/);
  if (parts[0] !== '!like') return;

  const region = parts[1], uid = parts[2];
  if (!region || !uid) return message.reply('❌ Usage: `!like <region> <uid>`');
  if (!/^\d+$/.test(uid)) return message.reply('❌ UID must be numeric.');
  if (!/^[a-zA-Z]+$/.test(region)) return message.reply('❌ Region must only contain letters.');

  if (!OWNER_IDS.includes(message.author.id)) {
    const last = cooldown.get(message.author.id), now = Date.now();
    if (last && now - last < 86400000) {
      const diff = 86400000 - (now - last);
      const h = Math.floor(diff / 3600000),
            m = Math.floor((diff % 3600000) / 60000);
      return message.reply(`⏳ Try again in ${h}h ${m}m.`);
    }
    cooldown.set(message.author.id, now);
  }

  try {
    const res = await axios.get(`https://noxxlikeesusano.vercel.app/like?uid=${uid}&server_name=${region}`);
    const data = res.data;

    const embed = new EmbedBuilder()
      .setTitle('⚡LIKE BOT BY WOTAX⚡')
      .setColor(data.status === 1 ? '#00FFFF' : '#8B0000')
      .setImage('https://i.imgur.com/xzUP5cS.gif')
      .setThumbnail(message.author.displayAvatarURL())
      .addFields({ name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' })
      .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
      .setTimestamp();

    if (data.status === 1) {
      embed.setDescription(
        `💥 **ACCOUNT INFO** 💥\n` +
        `**Player Nickname**: ${data.PlayerNickname}\n` +
        `**Player UID**: ${data.UID}\n` +
        `**Region**: ${region.toUpperCase()}\n\n` +
        `📊 **RESULT STATUS**\n` +
        `**Added**: +${data.LikesGivenByAPI}\n` +
        `**Before**: ${data.LikesbeforeCommand}\n` +
        `**After**: ${data.LikesafterCommand}`
      );
    } else if (data.status === 2) {
      embed.setDescription('❗ You already claimed likes for today. Try again tomorrow.');
    } else {
      embed.setDescription('❗ Unknown status returned from the API.');
    }

    await message.reply({ embeds: [embed] });
  } catch (err) {
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ ERROR OCCURRED')
      .setDescription(`\`\`\`${err.message}\`\`\``)
      .setColor('#8B0000')
      .setImage('https://i.imgur.com/xzUP5cS.gif')
      .setThumbnail(message.author.displayAvatarURL())
      .addFields({ name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' })
      .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
      .setTimestamp();
    await message.reply({ embeds: [errorEmbed] });
  }
});

// Express keep-alive server
const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Keep-alive Express server started.');
});

process.on('unhandledRejection', err => console.error('Unhandled promise rejection:', err));
process.on('uncaughtException', err => console.error('Uncaught exception:', err));

client.login(process.env.DISCORD_TOKEN);
