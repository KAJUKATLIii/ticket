/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import {
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";

// ─── Status Configs ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    color: 0x5865F2,
    badge: "⏳ Pending Community Votes",
    title: "💡 New Suggestion",
  },
  accepted: {
    color: 0x57F287,
    badge: "✅ Accepted",
    title: "✅ Suggestion Accepted",
  },
  denied: {
    color: 0xED4245,
    badge: "❌ Denied",
    title: "❌ Suggestion Denied",
  },
  considered: {
    color: 0xFEE75C,
    badge: "🤔 Under Consideration",
    title: "🤔 Suggestion Under Consideration",
  },
};

// ─── Embed Builder ─────────────────────────────────────────────────────────────

export function buildSuggestionEmbed(sug, userObj) {
  const statusInfo = STATUS_CONFIG[sug.status] ?? STATUS_CONFIG.pending;
  const upCount    = sug.upvotes ? sug.upvotes.length : 0;
  const downCount  = sug.downvotes ? sug.downvotes.length : 0;
  const score      = upCount - downCount;

  const embed = new EmbedBuilder()
    .setColor(statusInfo.color)
    .setAuthor({
      name: userObj ? `${userObj.username} (${userObj.id})` : `User ${sug.userId}`,
      iconURL: userObj ? userObj.displayAvatarURL({ dynamic: true }) : undefined,
    })
    .setTitle(`${statusInfo.title} • \`${sug.suggestionId}\``)
    .setDescription(sug.content)
    .addFields(
      { name: "Status", value: statusInfo.badge, inline: true },
      { name: "Votes",  value: `👍 \`${upCount}\`  •  👎 \`${downCount}\`  (Score: \`${score >= 0 ? "+" : ""}${score}\`)`, inline: true },
    )
    .setFooter({ text: `ID: ${sug.suggestionId} • Submit yours with /suggest` })
    .setTimestamp(new Date(sug.createdAt));

  if (sug.staffResponse) {
    const staffTag = sug.staffId ? `<@${sug.staffId}>` : "Staff";
    embed.addFields({
      name: `📝 Staff Response (${staffTag})`,
      value: sug.staffResponse,
      inline: false,
    });
  }

  return embed;
}

export function buildSuggestionButtons(sug) {
  const upCount   = sug.upvotes ? sug.upvotes.length : 0;
  const downCount = sug.downvotes ? sug.downvotes.length : 0;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`sug_vote_up_${sug.suggestionId}`)
      .setLabel(`Upvote (${upCount})`)
      .setStyle(ButtonStyle.Success)
      .setEmoji("👍"),
    new ButtonBuilder()
      .setCustomId(`sug_vote_down_${sug.suggestionId}`)
      .setLabel(`Downvote (${downCount})`)
      .setStyle(ButtonStyle.Danger)
      .setEmoji("👎"),
  );
}

// ─── Main Suggest Command ──────────────────────────────────────────────────────

class SuggestCommand extends Command {
  constructor() {
    super({
      name: "suggest",
      description: "Submit a suggestion for the server",
      usage: "suggest <suggestion text>",
      examples: ["suggest Add a new meme channel"],
      userPermissions: [],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "suggest",
        description: "Submit a suggestion for the server",
        options: [
          {
            name: "text",
            description: "Your suggestion message",
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

    let content = "";
    if (ctx.isSlash) {
      content = ctx.interaction.options.getString("text").trim();
    } else {
      content = ctx.args.join(" ").trim();
    }

    if (!content) {
      return ctx.reply({
        content: `${emoji.cross} Please provide suggestion text. Usage: \`/suggest <suggestion text>\``,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if suggestion channel is set
    const sugConfig = await db.getSuggestionConfig(guildId);
    let targetChannel = null;

    if (sugConfig && sugConfig.channelId) {
      targetChannel = ctx.guild.channels.cache.get(sugConfig.channelId);
    }

    if (!targetChannel || !targetChannel.isTextBased()) {
      return ctx.reply({
        content: `${emoji.cross} The suggestions channel has not been set up by an admin yet. Ask an admin to run \`/suggest-manage setup #channel\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      // Delete user's prefix command trigger message (e.g. .suggest xyz)
      if (!ctx.isSlash && ctx.message && ctx.message.deletable) {
        ctx.message.delete().catch(() => {});
      }

      // Create suggestion in DB
      const sug = await db.createSuggestion(guildId, ctx.author.id, targetChannel.id, content);

      // Post suggestion embed & buttons to suggestions channel
      const embed   = buildSuggestionEmbed(sug, ctx.author);
      const buttons = buildSuggestionButtons(sug);

      const sentMsg = await targetChannel.send({ embeds: [embed], components: [buttons] });

      // Update DB with message ID
      await db.setSuggestionMessageId(sug.suggestionId, sentMsg.id);

      // Send confirmation reply
      const replyMsg = await ctx.reply({
        content: `${emoji.check} Your suggestion has been submitted to ${targetChannel}! (ID: \`${sug.suggestionId}\`)`,
        flags: MessageFlags.Ephemeral,
      });

      // Auto-delete confirmation message after 5 seconds (5000ms) for prefix messages
      if (!ctx.isSlash && replyMsg) {
        setTimeout(() => {
          if (replyMsg.deletable) {
            replyMsg.delete().catch(() => {});
          }
        }, 5000);
      }
    } catch (err) {
      logger.error("Suggestions", "Failed to process suggestion", err);
      return ctx.reply({
        content: `${emoji.cross} Failed to submit suggestion: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export default new SuggestCommand();
// bread end
