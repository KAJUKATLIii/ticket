/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { PermissionFlagsBits, MessageFlags } from "discord.js";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";
import { buildSuggestionEmbed, buildSuggestionButtons } from "./Suggest.js";

class SuggestAdminCommand extends Command {
  constructor() {
    super({
      name: "suggest-manage",
      description: "Manage, accept, deny, or configure suggestions (Staff / Admin)",
      usage: "suggest-manage <setup|accept|deny|consider> ...",
      examples: [
        "suggest-manage setup #suggestions",
        "suggest-manage accept sug_123456 Looks great!",
        "suggest-manage deny sug_123456 Not feasible",
      ],
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
      enabledSlash: true,
      slashData: {
        name: "suggest-manage",
        description: "Manage, accept, deny, or configure suggestions (Staff / Admin)",
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
        options: [
          {
            name: "setup",
            description: "Set the channel for suggestions",
            type: 1, // SUB_COMMAND
            options: [
              {
                name: "channel",
                description: "The text channel for suggestions",
                type: 7, // CHANNEL
                required: true,
              },
            ],
          },
          {
            name: "accept",
            description: "Accept a suggestion",
            type: 1, // SUB_COMMAND
            options: [
              { name: "id", description: "Suggestion ID (e.g. sug_123456)", type: 3, required: true },
              { name: "reason", description: "Reason / response text", type: 3, required: false },
            ],
          },
          {
            name: "deny",
            description: "Deny a suggestion",
            type: 1, // SUB_COMMAND
            options: [
              { name: "id", description: "Suggestion ID (e.g. sug_123456)", type: 3, required: true },
              { name: "reason", description: "Reason / response text", type: 3, required: false },
            ],
          },
          {
            name: "consider",
            description: "Mark a suggestion as under consideration",
            type: 1, // SUB_COMMAND
            options: [
              { name: "id", description: "Suggestion ID (e.g. sug_123456)", type: 3, required: true },
              { name: "reason", description: "Reason / response text", type: 3, required: false },
            ],
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    const db = ctx.client.db;
    const guildId = ctx.guild.id;

    if (!ctx.isSlash) {
      return ctx.reply({ content: "Please use the slash command `/suggest-manage`." });
    }

    const sub = ctx.interaction.options.getSubcommand();

    // ── Setup Channel ────────────────────────────────────────────────────────
    if (sub === "setup") {
      const channel = ctx.interaction.options.getChannel("channel");
      if (!channel || !channel.isTextBased()) {
        return ctx.reply({ content: `${emoji.cross} Please select a valid text channel.`, flags: MessageFlags.Ephemeral });
      }

      await db.setSuggestionConfig(guildId, { channelId: channel.id });
      return ctx.reply({ content: `${emoji.check} Suggestions channel set to ${channel}!` });
    }

    // ── Accept / Deny / Consider ─────────────────────────────────────────────
    if (sub === "accept" || sub === "deny" || sub === "consider") {
      const sugId  = ctx.interaction.options.getString("id").trim();
      const reason = ctx.interaction.options.getString("reason")?.trim() || null;

      const sug = await db.getSuggestion(sugId);
      if (!sug || sug.guildId !== guildId) {
        return ctx.reply({ content: `${emoji.cross} Suggestion \`${sugId}\` not found in this server.`, flags: MessageFlags.Ephemeral });
      }

      const newStatus = sub === "accept" ? "accepted" : sub === "deny" ? "denied" : "considered";
      const updatedSug = await db.updateSuggestionStatus(sugId, newStatus, ctx.author.id, reason);

      // Update message in channel if message ID exists
      if (sug.channelId && sug.messageId) {
        const channel = ctx.guild.channels.cache.get(sug.channelId);
        if (channel && channel.isTextBased()) {
          try {
            const msg = await channel.messages.fetch(sug.messageId);
            const authorObj = await ctx.client.users.fetch(sug.userId).catch(() => null);
            const embed   = buildSuggestionEmbed(updatedSug, authorObj);
            const buttons = buildSuggestionButtons(updatedSug);

            await msg.edit({ embeds: [embed], components: [buttons] });
          } catch (err) {
            logger.warn("Suggestions", `Could not edit message for suggestion ${sugId}: ${err.message}`);
          }
        }
      }

      return ctx.reply({
        content: `${emoji.check} Suggestion \`${sugId}\` updated to status **${newStatus.toUpperCase()}**!`,
      });
    }
  }
}

export default new SuggestAdminCommand();
// bread end
