/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits, MessageFlags, EmbedBuilder } from "discord.js";
import { emoji } from "#config/emoji";

class FeedbackAdminCommand extends Command {
  constructor() {
    super({
      name: "feedback-manage",
      description: "Configure feedback channel & view rating analytics (Admin)",
      usage: "feedback-manage <setup|stats>",
      examples: [
        "feedback-manage setup #reviews",
        "feedback-manage stats",
      ],
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "feedback-manage",
        description: "Configure feedback channel & view rating analytics (Admin)",
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
        options: [
          {
            name: "setup",
            description: "Set the channel for public feedback/reviews",
            type: 1, // SUB_COMMAND
            options: [
              {
                name: "channel",
                description: "The text channel for feedback",
                type: 7, // CHANNEL
                required: true,
              },
            ],
          },
          {
            name: "stats",
            description: "View server feedback & rating analytics",
            type: 1, // SUB_COMMAND
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    const db = ctx.client.db;
    const guildId = ctx.guild.id;

    if (!ctx.isSlash) {
      return ctx.reply({ content: "Please use the slash command `/feedback-manage <setup|stats>`." });
    }

    const sub = ctx.interaction.options.getSubcommand();

    // ── Setup Feedback Channel ───────────────────────────────────────────────
    if (sub === "setup") {
      const channel = ctx.interaction.options.getChannel("channel");
      if (!channel || !channel.isTextBased()) {
        return ctx.reply({ content: `${emoji.cross} Please select a valid text channel.`, flags: MessageFlags.Ephemeral });
      }

      await db.setFeedbackConfig(guildId, channel.id);
      return ctx.reply({ content: `${emoji.check} Feedback channel set to ${channel}!` });
    }

    // ── View Rating Analytics & Breakdown ───────────────────────────────────
    if (sub === "stats") {
      const stats = await db.getFeedbackStats(guildId);

      if (stats.total === 0) {
        return ctx.reply({ content: `${emoji.info} No feedback has been submitted in this server yet.` });
      }

      const avgStarsStr = emoji.stars(Math.round(stats.average), 5);

      const breakdownLines = [
        `5⭐: \`${stats.breakdown[5]}\` reviews`,
        `4⭐: \`${stats.breakdown[4]}\` reviews`,
        `3⭐: \`${stats.breakdown[3]}\` reviews`,
        `2⭐: \`${stats.breakdown[2]}\` reviews`,
        `1⭐: \`${stats.breakdown[1]}\` reviews`,
      ];

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`⭐ ${ctx.guild.name} Feedback & Rating Stats`)
        .setDescription(`Overall Rating: **${stats.average} / 5.0** ${avgStarsStr}`)
        .addFields(
          { name: "Total Reviews", value: `\`${stats.total}\``, inline: true },
          { name: "Average Rating", value: `\`${stats.average} / 5.0\``, inline: true },
          { name: "Star Breakdown", value: breakdownLines.join("\n"), inline: false },
        )
        .setFooter({ text: ctx.guild.name, iconURL: ctx.guild.iconURL({ dynamic: true }) ?? undefined })
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }
  }
}

export default new FeedbackAdminCommand();
// bread end
