const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');

const cron = require('node-cron');
require('dotenv').config();

console.log('DISCORD_TOKEN loaded:', !!process.env.DISCORD_TOKEN);
console.log('REVIEW_CHANNEL_ID:', process.env.REVIEW_CHANNEL_ID || 'undefined');
console.log('ENGAGEMENT_CHANNEL_ID:', process.env.ENGAGEMENT_CHANNEL_ID || 'undefined');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===========================
// PACE AUTO ENGAGEMENT POSTS
// ===========================

function sendEngagementMessage(message) {
  if (!process.env.ENGAGEMENT_CHANNEL_ID) return;

  client.channels.fetch(process.env.ENGAGEMENT_CHANNEL_ID)
    .then(channel => {
      if (channel) channel.send(message);
    })
    .catch(console.error);
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 6:15 AM Pacific - Premarket PACE Check
  cron.schedule("15 6 * * 1-5", () => {
    sendEngagementMessage(`@everyone

🌅 Premarket PACE Check

Good morning traders.

Before NY opens, lock in your mindset.

📈 Bias today:
📍 Key level you’re watching:
🧠 Rule you refuse to break:

Don’t chase. Don’t force. KEEP PACE.`);
  }, {
    timezone: "America/Los_Angeles"
  });

  // 8:00 AM Pacific - NY Session Check-In
  cron.schedule("0 8 * * 1-5", () => {
    sendEngagementMessage(`@everyone

🚨 NY Session Check-In

Market is moving.

Are you trading your plan or reacting emotionally?

Drop what you're watching below.`);
  }, {
    timezone: "America/Los_Angeles"
  });

  // 10:30 AM Pacific - Midday Check-In
  cron.schedule("30 10 * * 1-5", () => {
    sendEngagementMessage(`@everyone

📊 Midday Check-In

How’s the session going?

✅ Green
❌ Red
👀 Waiting
🧠 Observing only

Be honest. Accountability builds consistency.`);
  }, {
    timezone: "America/Los_Angeles"
  });

  // 1:15 PM Pacific - Market Close Recap
  cron.schedule("15 13 * * 1-5", () => {
    sendEngagementMessage(`@everyone

🔒 Market Close Recap

Win / Loss / No Trade?

What did today teach you?

Use /pace to log your session.`);
  }, {
    timezone: "America/Los_Angeles"
  });

  // 7:00 PM Pacific - Evening Reflection
  cron.schedule("0 19 * * 1-5", () => {
    sendEngagementMessage(`@everyone

🌙 Evening Reflection

What’s one thing you’ll improve tomorrow?

Small fixes become big growth.

KEEP PACE.`);
  }, {
    timezone: "America/Los_Angeles"
  });

  // Sunday 6:00 PM Pacific - Weekly Reset
  cron.schedule("0 18 * * 0", () => {
    sendEngagementMessage(`@everyone

📅 Sunday Reset

New trading week loading.

What’s your focus this week?

Discipline?
Patience?
Risk management?
Better entries?

KEEP PACE.`);
  }, {
    timezone: "America/Los_Angeles"
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {

    // =========================
    // /PACE COMMAND
    // =========================
    if (interaction.isChatInputCommand() && interaction.commandName === 'pace') {

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('recap')
          .setLabel('New Trade Recap')
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId('violation')
          .setLabel('Rule Violation')
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId('notrade')
          .setLabel('No Trade Day')
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({
        content: '📊 **PACE SYSTEM — Select an action**',
        components: [row],
        ephemeral: true
      });
    }

    // =========================
    // BUTTON HANDLERS
    // =========================
    if (interaction.isButton()) {

      if (interaction.customId === 'recap') {

        const modal = new ModalBuilder()
          .setCustomId('recapModal')
          .setTitle('Trade Recap');

        const instrument = new TextInputBuilder()
          .setCustomId('instrument')
          .setLabel('Instrument (MNQ, NQ, etc)')
          .setStyle(TextInputStyle.Short);

        const direction = new TextInputBuilder()
          .setCustomId('direction')
          .setLabel('Direction (Long / Short)')
          .setStyle(TextInputStyle.Short);

        const entry = new TextInputBuilder()
          .setCustomId('entry')
          .setLabel('Entry Area')
          .setStyle(TextInputStyle.Short);

        const result = new TextInputBuilder()
          .setCustomId('result')
          .setLabel('Result (Win / Loss / BE)')
          .setStyle(TextInputStyle.Short);

        const summary = new TextInputBuilder()
          .setCustomId('summary')
          .setLabel('Summary')
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
          new ActionRowBuilder().addComponents(instrument),
          new ActionRowBuilder().addComponents(direction),
          new ActionRowBuilder().addComponents(entry),
          new ActionRowBuilder().addComponents(result),
          new ActionRowBuilder().addComponents(summary)
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'violation') {

        const modal = new ModalBuilder()
          .setCustomId('violationModal')
          .setTitle('Rule Violation');

        const rule = new TextInputBuilder()
          .setCustomId('rule')
          .setLabel('Rule Broken')
          .setStyle(TextInputStyle.Short);

        const emotion = new TextInputBuilder()
          .setCustomId('emotion')
          .setLabel('Emotion')
          .setStyle(TextInputStyle.Short);

        const lesson = new TextInputBuilder()
          .setCustomId('lesson')
          .setLabel('What Should Have Happened')
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
          new ActionRowBuilder().addComponents(rule),
          new ActionRowBuilder().addComponents(emotion),
          new ActionRowBuilder().addComponents(lesson)
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === 'notrade') {

        const modal = new ModalBuilder()
          .setCustomId('noTradeModal')
          .setTitle('No Trade Day');

        const reason = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Why no trade today?')
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
          new ActionRowBuilder().addComponents(reason)
        );

        return interaction.showModal(modal);
      }
    }

    // =========================
    // MODAL SUBMISSIONS
    // =========================
    if (interaction.isModalSubmit()) {

      const channel = await client.channels.fetch(process.env.REVIEW_CHANNEL_ID);

      if (!channel) {
        return interaction.reply({
          content: '⚠️ Review channel not found.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'recapModal') {

        const instrument = interaction.fields.getTextInputValue('instrument');
        const direction = interaction.fields.getTextInputValue('direction');
        const entry = interaction.fields.getTextInputValue('entry');
        const result = interaction.fields.getTextInputValue('result');
        const summary = interaction.fields.getTextInputValue('summary');

        await channel.send(`
📊 **TRADE RECAP**

👤 Trader: <@${interaction.user.id}>

Instrument: ${instrument}
Direction: ${direction}
Entry Area: ${entry}
Result: ${result}

Summary:
${summary}

📸 Attach screenshot under this post.
        `);

        return interaction.reply({
          content: '✅ Trade recap submitted.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'violationModal') {

        const rule = interaction.fields.getTextInputValue('rule');
        const emotion = interaction.fields.getTextInputValue('emotion');
        const lesson = interaction.fields.getTextInputValue('lesson');

        await channel.send(`
🚨 **PACE VIOLATION**

👤 Trader: <@${interaction.user.id}>

Rule Broken: ${rule}
Emotion: ${emotion}

What Should Have Happened:
${lesson}
        `);

        return interaction.reply({
          content: '🚨 Violation logged.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'noTradeModal') {

        const reason = interaction.fields.getTextInputValue('reason');

        await channel.send(`
🧘 **NO TRADE DAY**

👤 Trader: <@${interaction.user.id}>

Reason:
${reason}

📊 Discipline Logged
        `);

        return interaction.reply({
          content: '🧘 No trade logged.',
          ephemeral: true
        });
      }
    }

  } catch (error) {
    console.error(error);

    if (interaction.isRepliable()) {
      return interaction.reply({
        content: '⚠️ Something went wrong.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
