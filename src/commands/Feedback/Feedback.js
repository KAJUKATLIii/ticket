/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits, MessageFlags, EmbedBuilder } from "discord.js";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";

function getStarDisplay(stars) {
  return emoji.stars(stars, 5);
}

class FeedbackCommand extends Command {
  constructor() {
    super({
      name: "feedback",
      description: "Submit feedback or a review for the server/staff",
      aliases: ["review"],
      usage: "feedback <1-5> <message>",
      examples: ["feedback 5 The support team is fast and helpful!"],
      userPermissions: [],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "feedback",
        description: "Submit feedback or a review for the server/staff",
        options: [
          {
            name: "stars",
            description: "Star rating (1 to 5 stars)",
            type: 4, // INTEGER
            required: true,
            choices: [
              { name: "⭐ (1 Star)", value: 1 },
              { name: "⭐⭐ (2 Stars)", value: 2 },
              { name: "⭐⭐⭐ (3 Stars)", value: 3 },
              { name: "⭐⭐⭐⭐ (4 Stars)", value: 4 },
              { name: "⭐⭐⭐⭐⭐ (5 Stars)", value: 5 },
            ],
          },
          {
            name: "message",
            description: "Your review or feedback details",
            type: 3, // STRING
            required: true,
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    const db = ctx.client.db;
    const guildId = ctx.guild.id;

    let stars = 5;
    let messageText = "";

    if (ctx.isSlash) {
      stars = ctx.interaction.options.getInteger("stars");
      messageText = ctx.interaction.options.getString("message").trim();
    } else {
      if (ctx.args.length < 2) {
        return ctx.reply({
          content: `${emoji.cross} Usage: \`.feedback <1-5> <your message>\``,
        });
      }
      stars = parseInt(ctx.args[0], 10);
      messageText = ctx.args.slice(1).join(" ").trim();
    }

    if (isNaN(stars) || stars < 1 || stars > 5) {
      return ctx.reply({
        content: `${emoji.cross} Rating must be a number between 1 and 5 stars.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!messageText) {
      return ctx.reply({
        content: `${emoji.cross} Please provide a feedback message.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check channel configuration
    const fbConfig = await db.getFeedbackConfig(guildId);
    let targetChannel = null;

    if (fbConfig && fbConfig.channelId) {
      targetChannel = ctx.guild.channels.cache.get(fbConfig.channelId);
    }

    if (!targetChannel || !targetChannel.isTextBased()) {
      return ctx.reply({
        content: `${emoji.cross} Feedback channel has not been set up by an admin yet. Ask an admin to run \`/feedback-manage setup #channel\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const fb = await db.createFeedback(guildId, ctx.author.id, stars, messageText, targetChannel.id);

      const starStr = getStarDisplay(stars);
      const color = stars >= 4 ? 0x57F287 : stars === 3 ? 0xFEE75C : 0xED4245;

      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({
          name: `${ctx.author.username}'s Feedback & Review`,
          iconURL: ctx.author.displayAvatarURL({ dynamic: true }),
        })
        .setTitle(`Review Rating: ${starStr}`)
        .setDescription(messageText)
        .addFields(
          { name: "Rating Score", value: `\`${stars} / 5 Stars\``, inline: true },
          { name: "Submitted By",  value: `${ctx.author}`,         inline: true },
        )
        .setFooter({ text: `ID: ${fb.feedbackId} • ${ctx.guild.name}` })
        .setTimestamp();

      const sentMsg = await targetChannel.send({ embeds: [embed] });
      await db.setFeedbackMessageId(fb.feedbackId, sentMsg.id);

      return ctx.reply({
        content: `${emoji.check} Thank you for your feedback! Posted in ${targetChannel}.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      logger.error("Feedback", "Failed to process feedback", err);
      return ctx.reply({
        content: `${emoji.cross} Failed to submit feedback: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export default new FeedbackCommand();
// bread end
