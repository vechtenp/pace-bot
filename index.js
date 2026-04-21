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

require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {

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
      content: "📊 **PACE SYSTEM — Select an action**",
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

    const channel = await client.channels.fetch(process.env.REVIEW_CHANNEL_ID);

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

      return interaction.editReply("✅ Trade recap submitted.");
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

      return interaction.editReply("🚨 Violation logged.");
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

      return interaction.editReply("🧘 No trade logged.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
