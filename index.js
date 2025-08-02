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

  const remaining = OWNER_IDS.includes(userId)
    ? 'unlimited'
    : `${DAILY_LIMIT - usage.count}/${DAILY_LIMIT}`;

  return { usage, remaining };
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

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'like') return;

  const uid = interaction.options.getString('uid');
  const region = interaction.options.getString('region');

  if (!CHANNEL_IDS.includes(interaction.channel.id)) {
    return interaction.reply({ content: 'This command is not allowed in this channel.', ephemeral: true });
  }

  if (!/^\d+$/.test(uid)) {
    return interaction.reply({ content: 'UID must be numeric.', ephemeral: true });
  }

  if (!/^[a-zA-Z]+$/.test(region)) {
    return interaction.reply({ content: 'Region must only contain letters.', ephemeral: true });
  }

  if (!OWNER_IDS.includes(interaction.user.id)) {
    const { usage, remaining } = checkUsage(interaction.user.id);
    if (usage.count >= DAILY_LIMIT) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ DAILY LIMIT REACHED')
        .setDescription(`You have used all your likes for today.\n\n**Requests remaining:** \`\`\`0/${DAILY_LIMIT}\`\`\`\n\nTry again tomorrow!\n\n🔗 Join My Server: https://discord.gg/9yCkYfh3Nh`)
        .setColor('#8B0000')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }

  await interaction.deferReply();

  try {
    const res = await axios.get(`https://noxxcorporation.vercel.app/like?uid=${uid}&server_name=${region}`);
    const data = res.data;

    if (data.status === 1) {
      if (!OWNER_IDS.includes(interaction.user.id)) {
        incrementUsage(interaction.user.id);
      }
      const { remaining } = checkUsage(interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle('⚡LIKE BOT BY WOTAX⚡')
        .setColor('#00FFFF')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' },
          { name: '📊 Daily Limit', value: `\`\`\`Requests remaining: ${remaining}\`\`\`` }
        )
        .setDescription(
          `💥 **ACCOUNT INFO** 💥\n` +
          `**Player Nickname**: ${data.PlayerNickname}\n` +
          `**Player UID**: ${data.UID}\n` +
          `**Region**: ${region.toUpperCase()}\n\n` +
          `📊 **RESULT STATUS**\n` +
          `**Added**: +${data.LikesGivenByAPI}\n` +
          `**Before**: ${data.LikesbeforeCommand}\n` +
          `**After**: ${data.LikesafterCommand}`
        )
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else if (data.status === 2) {
      await interaction.editReply('❗ You already claimed likes for today. Try again tomorrow.');
    } else {
      await interaction.editReply('❗ Unknown status returned from the API.');
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
    await interaction.editReply({ embeds: [errorEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const parts = message.content.trim().split(/\s+/);
  if (parts[0] !== '!like') return;

  // ✅ Channel restriction added
  if (!CHANNEL_IDS.includes(message.channel.id)) {
    return message.reply('❌ This command is not allowed in this channel.');
  }

  const region = parts[1];
  const uid = parts[2];

  if (!region || !uid) return message.reply('❌ Usage: `!like <region> <uid>`');
  if (!/^\d+$/.test(uid)) return message.reply('❌ UID must be numeric.');
  if (!/^[a-zA-Z]+$/.test(region)) return message.reply('❌ Region must only contain letters.');

  if (!OWNER_IDS.includes(message.author.id)) {
    const { usage, remaining } = checkUsage(message.author.id);
    if (usage.count >= DAILY_LIMIT) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ DAILY LIMIT REACHED')
        .setDescription(`You have used all your likes for today.\n\n**Requests remaining:** \`\`\`0/${DAILY_LIMIT}\`\`\`\n\nTry again tomorrow!\n\n🔗 Join My Server: https://discord.gg/9yCkYfh3Nh`)
        .setColor('#8B0000')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();
      return message.reply({ embeds: [errorEmbed] });
    }
  }

  try {
    const res = await axios.get(`https://noxxcorporation.vercel.app/like?uid=${uid}&server_name=${region}`);
    const data = res.data;

    if (data.status === 1) {
      if (!OWNER_IDS.includes(message.author.id)) {
        incrementUsage(message.author.id);
      }
      const { remaining } = checkUsage(message.author.id);

      const embed = new EmbedBuilder()
        .setTitle('⚡LIKE BOT BY WOTAX⚡')
        .setColor('#00FFFF')
        .setImage('https://i.imgur.com/xzUP5cS.gif')
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: '🔗 Join My Server', value: 'https://discord.gg/9yCkYfh3Nh' },
          { name: '📊 Daily Limit', value: `\`\`\`Requests remaining: ${remaining}\`\`\`` }
        )
        .setDescription(
          `💥 **ACCOUNT INFO** 💥\n` +
          `**Player Nickname**: ${data.PlayerNickname}\n` +
          `**Player UID**: ${data.UID}\n` +
          `**Region**: ${region.toUpperCase()}\n\n` +
          `📊 **RESULT STATUS**\n` +
          `**Added**: +${data.LikesGivenByAPI}\n` +
          `**Before**: ${data.LikesbeforeCommand}\n` +
          `**After**: ${data.LikesafterCommand}`
        )
        .setFooter({ text: '🕷️ DEVELOPED BY WOTAX 🕷️' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

    } else if (data.status === 2) {
      await message.reply('❗ You already claimed likes for today. Try again tomorrow.');
    } else {
      await message.reply('❗ Unknown status returned from the API.');
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
    await message.reply({ embeds: [errorEmbed] });
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
