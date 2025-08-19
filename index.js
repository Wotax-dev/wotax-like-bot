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

const OWNER_IDS = [
  '1347611047338709052',
  '1178330508690739341',
  '1150752224956403763'
];
const CHANNEL_IDS = ['1398959087592673370', '1399332860175056987'];
const DAILY_LIMIT = 2;

const usageMap = new Map();

function checkUsage(userId) {
  const now = Date.now();
  let usage = usageMap.get(userId);

  if (!usage) {
    usage = { count: 0, lastReset: now };
    usageMap.set(userId, usage);
  } else {
    if (now - usage.lastReset > 24 * 60 * 60 * 1000) {
      usage.count = 0;
      usage.lastReset = now;
    }
  }

  return usage;
}

function incrementUsage(userId) {
  const now = Date.now();
  let usage = usageMap.get(userId);
  if (!usage) {
    usage = { count: 0, lastReset: now };
    usageMap.set(userId, usage);
  }
  usage.count++;
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash command /like
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'like') return;

  const uid = interaction.options.getString('uid');
  const region = interaction.options.getString('region');

  if (!CHANNEL_IDS.includes(interaction.channel.id)) {
    return interaction.reply({ content: 'This command is not allowed in this channel.', ephemeral: true });
  }

  if (!/^\d+$/.test(uid)) {
    const temp = await interaction.reply({ content: '❌ UID must be numeric.', ephemeral: true });
    setTimeout(() => { interaction.deleteReply().catch(() => {}); }, 5000);
    return;
  }

  if (!/^[a-zA-Z]+$/.test(region)) {
    const temp = await interaction.reply({ content: '❌ Region must only contain letters.', ephemeral: true });
    setTimeout(() => { interaction.deleteReply().catch(() => {}); }, 5000);
    return;
  }

  if (!OWNER_IDS.includes(interaction.user.id)) {
    const usage = checkUsage(interaction.user.id);
    if (usage.count >= DAILY_LIMIT) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ DAILY LIMIT REACHED')
        .setDescription(`You have used all your likes for today.\n\nTry again tomorrow!\n\n🔗 Join My Server: https://discord.gg/9yCkYfh3Nh`)
        .setColor('#8B0000')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();
      const msg = await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      setTimeout(() => { interaction.deleteReply().catch(() => {}); }, 5000);
      return;
    }
  }

  await interaction.deferReply();

  try {
    const res = await axios.get(`https://likes.api.freefireofficial.com/api/bd/${uid}?key=RebelTheLvB09`);
    const data = res.data;

    if (data.status === 1) {
      const player = data.response;

      if (!OWNER_IDS.includes(interaction.user.id)) incrementUsage(interaction.user.id);

      if (player.LikesGivenByAPI === 0) {
        const temp = await interaction.editReply('❗ Max likes already sent for today. Try again tomorrow.');
        setTimeout(() => { interaction.deleteReply().catch(() => {}); }, 5000);
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('⚡LIKE BOT BY WOTAX⚡')
        .setColor('#00FFFF')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(
          `💥 **ACCOUNT INFO** 💥\n` +
          `**Player Nickname**: ${player.PlayerNickname}\n` +
          `**Player UID**: ${player.UID}\n` +
          `**Region**: ${region.toUpperCase()}\n` +
          `**Level**: ${player.PlayerLevel}\n\n` +
          `📊 **RESULT STATUS**\n` +
          `**Added**: +${player.LikesGivenByAPI}\n` +
          `**Before**: ${player.LikesbeforeCommand}\n` +
          `**After**: ${player.LikesafterCommand}`
        )
        .addFields({ name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' })
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else {
      const temp = await interaction.editReply('❗ Unknown status returned from the API.');
      setTimeout(() => { interaction.deleteReply().catch(() => {}); }, 5000);
    }
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
    const msg = await interaction.editReply({ embeds: [errorEmbed] });
    setTimeout(() => { interaction.deleteReply().catch(() => {}); }, 5000);
  }
});

// Message command !like
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const parts = message.content.trim().split(/\s+/);
  if (parts[0] !== '!like') return;

  if (!CHANNEL_IDS.includes(message.channel.id)) {
    const temp = await message.reply('❌ This command is not allowed in this channel.');
    setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
    return;
  }

  const region = parts[1];
  const uid = parts[2];

  if (!region || !uid) {
    const temp = await message.reply('❌ Usage: `!like <region> <uid>`');
    setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
    return;
  }
  if (!/^\d+$/.test(uid)) {
    const temp = await message.reply('❌ UID must be numeric.');
    setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
    return;
  }
  if (!/^[a-zA-Z]+$/.test(region)) {
    const temp = await message.reply('❌ Region must only contain letters.');
    setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
    return;
  }

  if (!OWNER_IDS.includes(message.author.id)) {
    const usage = checkUsage(message.author.id);
    if (usage.count >= DAILY_LIMIT) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ DAILY LIMIT REACHED')
        .setDescription(`You have used all your likes for today.\n\nTry again tomorrow!\n\n🔗 Join My Server: https://discord.gg/9yCkYfh3Nh`)
        .setColor('#8B0000')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();
      const temp = await message.reply({ embeds: [errorEmbed] });
      setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
      return;
    }
  }

  try {
    const res = await axios.get(`https://likes.api.freefireofficial.com/api/bd/${uid}?key=RebelTheLvB09`);
    const data = res.data;

    if (data.status === 1) {
      const player = data.response;

      if (!OWNER_IDS.includes(message.author.id)) incrementUsage(message.author.id);

      if (player.LikesGivenByAPI === 0) {
        const temp = await message.reply('❗ Max likes already sent for today. Try again tomorrow.');
        setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('⚡LIKE BOT BY WOTAX⚡')
        .setColor('#00FFFF')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(
          `💥 **ACCOUNT INFO** 💥\n` +
          `**Player Nickname**: ${player.PlayerNickname}\n` +
          `**Player UID**: ${player.UID}\n` +
          `**Region**: ${region.toUpperCase()}\n` +
          `**Level**: ${player.PlayerLevel}\n\n` +
          `📊 **RESULT STATUS**\n` +
          `**Added**: +${player.LikesGivenByAPI}\n` +
          `**Before**: ${player.LikesbeforeCommand}\n` +
          `**After**: ${player.LikesafterCommand}`
        )
        .addFields({ name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' })
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

    } else {
      const temp = await message.reply('❗ Unknown status returned from the API.');
      setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
    }
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
    const temp = await message.reply({ embeds: [errorEmbed] });
    setTimeout(() => { temp.delete().catch(() => {}); message.delete().catch(() => {}); }, 5000);
  }
});

const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(process.env.PORT || 3000, () => {
  console.log('🌐 Keep-alive Express server started.');
});

process.on('unhandledRejection', err => console.error('Unhandled promise rejection:', err));
process.on('uncaughtException', err => console.error('Uncaught exception:', err));

client.login(process.env.DISCORD_TOKEN);
