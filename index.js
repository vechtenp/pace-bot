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
  // BUTTONS
  // ---------------------------
  if (interaction.isButton()) {

    // 🟢 TRADE RECAP MODAL
    if (interaction.customId === 'recap') {

      const modal = new ModalBuilder()
        .setCustomId('recapModal')
        .setTitle('Trade Recap');

      const setup = new TextInputBuilder()
        .setCustomId('setup')
        .setLabel('Setup Type')
        .setStyle(TextInputStyle.Short);

      const emotion = new TextInputBuilder()
        .setCustomId('emotion')
        .setLabel('Emotion (FOMO / Discipline / etc.)')
        .setStyle(TextInputStyle.Short);

      const lesson = new TextInputBuilder()
        .setCustomId('lesson')
        .setLabel('Lesson Learned')
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(setup),
        new ActionRowBuilder().addComponents(emotion),
        new ActionRowBuilder().addComponents(lesson)
      );

      return interaction.showModal(modal);
    }

    // 🚨 VIOLATION MODAL
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

    // 🧘 NO TRADE MODAL
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

    // 🟢 TRADE RECAP
    if (interaction.customId === 'recapModal') {

      await interaction.deferReply({ ephemeral: true });

      const setup = interaction.fields.getTextInputValue('setup');
      const emotion = interaction.fields.getTextInputValue('emotion');
      const lesson = interaction.fields.getTextInputValue('lesson');

      let pace = 10;
      if (emotion.toLowerCase().includes('fomo')) pace -= 2;

      await channel.send(`
📊 **TRADE RECAP**

👤 Trader: <@${interaction.user.id}>

Setup: ${setup}
Emotion: ${emotion}

Lesson:
${lesson}

📸 **Attach screenshot under this post**

🧠 PACE Score: ${pace}/10
      `);

      return interaction.editReply("✅ Trade recap submitted.");
    }

    // 🚨 VIOLATION
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

    // 🧘 NO TRADE
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