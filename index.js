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

const premarketPrompts = [
  `🌅 Premarket PACE Check

What’s your focus today?

📈 Bias:
📍 Key level:
🧠 Rule you will not break:

Plan first. Trade second.`,

  `🚨 Good Morning KEEP PACE

Before NY opens, lock in.

Are you looking for longs, shorts, or waiting for confirmation?

Drop your plan below.`
];

const openPrompts = [
  `🔔 NY Session Check-In

Market is moving.

Are you trading your plan or chasing?

Stay patient. Let price come to you.`,

  `📊 NY Open PACE Check

What are you watching right now?

VWAP? PDH/PDL? Liquidity? Session highs/lows?`
];

const middayPrompts = [
  `📊 Midday Check-In

How’s the session going?

✅ Green
❌ Red
👀 Waiting
🧠 Observing only

Drop your status.`,

  `⏳ Midday Discipline Check

Did you force trades today or stay patient?

No shame. Just accountability.`,

  `🧠 Quick Reset

If today ended right now, did you trade well or emotionally?`
];

const closePrompts = [
  `🔒 Market Close Recap

Win / Loss / No Trade?

What did today teach you?

Use /pace to log your session.`,

  `📓 End of Day PACE Check

Did you follow your rules today?

Good trade, bad trade, no trade — log it with /pace.`
];

const eveningPrompts = [
  `🌙 Evening Journal Reminder

Did you log your trading day?

Use /pace and stay accountable.

Process And Consistency Everytime.`,

  `🧠 Night Reflection

What’s one thing you’ll improve tomorrow?

Small fixes become big growth.`
];

const sundayPrompts = [
  `📅 Sunday Reset

New trading week loading.

What’s your focus this week?

Discipline?
Patience?
Risk management?
Better entries?

KEEP PACE.`
];

function randomPrompt(prompts) {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

async function sendEngagementMessage(message) {
  try {
    if (!process.env.ENGAGEMENT_CHANNEL_ID) {
      console.log('ENGAGEMENT_CHANNEL_ID is missing.');
      return;
    }

    const channel = await client.channels.fetch(process.env.ENGAGEMENT_CHANNEL_ID);

    if (!channel) {
      console.log('Engagement channel not found.');
      return;
    }

    await channel.send(message);
  } catch (error) {
    console.error('Failed to send engagement message:', error);
  }
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 6:15 AM Pacific - Premarket PACE Check
  cron.schedule("15 6 * * 1-5", () => {
    sendEngagementMessage(randomPrompt(premarketPrompts));
  }, {
    timezone: "America/Los_Angeles"
  });

  // 8:00 AM Pacific - NY Session Check-In
  cron.schedule("0 8 * * 1-5", () => {
    sendEngagementMessage(randomPrompt(openPrompts));
  }, {
    timezone: "America/Los_Angeles"
  });

  // 10:30 AM Pacific - Midday Check-In
  cron.schedule("30 10 * * 1-5", () => {
    sendEngagementMessage(randomPrompt(middayPrompts));
  }, {
    timezone: "America/Los_Angeles"
  });

  // 1:15 PM Pacific - Market Close Recap
  cron.schedule("15 13 * * 1-5", () => {
    sendEngagementMessage(randomPrompt(closePrompts));
  }, {
    timezone: "America/Los_Angeles"
  });

  // 7:00 PM Pacific - Evening Journal Reminder
  cron.schedule("0 19 * * 1-5", () => {
    sendEngagementMessage(randomPrompt(eveningPrompts));
  }, {
    timezone: "America/Los_Angeles"
  });

  // Sunday 6:00 PM Pacific - Weekly Reset
  cron.schedule("0 18 * * 0", () => {
    sendEngagementMessage(randomPrompt(sundayPrompts));
  }, {
    timezone: "America/Los_Angeles"
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // ---------------------------
    // /PACE COMMAND
    // ---------------------------
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

    // ---------------------------
    // BUTTON HANDLERS
    // ---------------------------
    if (interaction.isButton()) {
      if (interaction.customId === 'recap') {
        const modal = new ModalBuilder()
          .setCustomId('recapModal')
          .setTitle('Trade Recap');

        const instrument = new TextInputBuilder()
          .setCustomId('instrument')
          .setLabel('Instrument (e.g. MNQ, NQ)')
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

    // ---------------------------
    // MODAL SUBMISSIONS
    // ---------------------------
    if (interaction.isModalSubmit()) {
      if (!process.env.REVIEW_CHANNEL_ID) {
        console.error('Missing REVIEW_CHANNEL_ID');

        return interaction.reply({
          content: '⚠️ Bot config error: REVIEW_CHANNEL_ID is missing.',
          ephemeral: true
        });
      }

      const channel = await client.channels.fetch(process.env.REVIEW_CHANNEL_ID);

      if (!channel) {
        console.error('Could not fetch review channel.');

        return interaction.reply({
          content: '⚠️ Bot config error: Could not find the review channel.',
          ephemeral: true
        });
      }

      if (interaction.customId === 'recapModal') {
        await interaction.deferReply({ ephemeral: true });

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

📸 **Attach screenshot under this post**
        `);

        return interaction.editReply('✅ Trade recap submitted.');
      }

      if (interaction.customId === 'violationModal') {
        await interaction.deferReply({ ephemeral: true });

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

        return interaction.editReply('🚨 Violation logged.');
      }

      if (interaction.customId === 'noTradeModal') {
        await interaction.deferReply({ ephemeral: true });

        const reason = interaction.fields.getTextInputValue('reason');

        await channel.send(`
🧘 **NO TRADE DAY**

👤 Trader: <@${interaction.user.id}>

Reason:
${reason}

📊 Discipline Logged
        `);

        return interaction.editReply('🧘 No trade logged.');
      }
    }
  } catch (error) {
    console.error('Interaction error:', error);

    if (interaction.isRepliable()) {
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('⚠️ Something went wrong. Check bot config/logs.');
        } else {
          await interaction.reply({
            content: '⚠️ Something went wrong. Check bot config/logs.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
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

    // ---------------------------
    // BUTTON HANDLERS
    // ---------------------------
    if (interaction.isButton()) {
      // =========================
      // 🟢 TRADE RECAP MODAL
      // =========================
      if (interaction.customId === 'recap') {
        const modal = new ModalBuilder()
          .setCustomId('recapModal')
          .setTitle('Trade Recap');

        const instrument = new TextInputBuilder()
          .setCustomId('instrument')
          .setLabel('Instrument (e.g. MNQ, NQ)')
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

      // =========================
      // 🚨 VIOLATION MODAL
      // =========================
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

      // =========================
      // 🧘 NO TRADE MODAL
      // =========================
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

    // ---------------------------
    // MODAL SUBMISSIONS
    // ---------------------------
    if (interaction.isModalSubmit()) {
      if (!process.env.REVIEW_CHANNEL_ID) {
        console.error('Missing REVIEW_CHANNEL_ID');
        return interaction.reply({
          content: '⚠️ Bot config error: REVIEW_CHANNEL_ID is missing.',
          ephemeral: true
        });
      }

      const channel = await client.channels.fetch(process.env.REVIEW_CHANNEL_ID);

      if (!channel) {
        console.error('Could not fetch review channel.');
        return interaction.reply({
          content: '⚠️ Bot config error: Could not find the review channel.',
          ephemeral: true
        });
      }

      // =========================
      // 🟢 TRADE RECAP HANDLER
      // =========================
      if (interaction.customId === 'recapModal') {
        await interaction.deferReply({ ephemeral: true });

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

📸 **Attach screenshot under this post**
        `);

        return interaction.editReply('✅ Trade recap submitted.');
      }

      // =========================
      // 🚨 VIOLATION HANDLER
      // =========================
      if (interaction.customId === 'violationModal') {
        await interaction.deferReply({ ephemeral: true });

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

        return interaction.editReply('🚨 Violation logged.');
      }

      // =========================
      // 🧘 NO TRADE HANDLER
      // =========================
      if (interaction.customId === 'noTradeModal') {
        await interaction.deferReply({ ephemeral: true });

        const reason = interaction.fields.getTextInputValue('reason');

        await channel.send(`
🧘 **NO TRADE DAY**

👤 Trader: <@${interaction.user.id}>

Reason:
${reason}

📊 Discipline Logged
        `);

        return interaction.editReply('🧘 No trade logged.');
      }
    }
  } catch (error) {
    console.error('Interaction error:', error);

    if (interaction.isRepliable()) {
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('⚠️ Something went wrong. Check bot config/logs.');
        } else {
          await interaction.reply({
            content: '⚠️ Something went wrong. Check bot config/logs.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
