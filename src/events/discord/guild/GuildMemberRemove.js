/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { emoji } from "#config/emoji";
import { resolvePlaceholders } from "#commands/Settings/Welcome";

export default {
  name: "guildMemberRemove",
  async execute({ eventArgs, client }) {
    const [member] = eventArgs;
    const { guild }  = member;

    try {
      const cfg = await client.db.getWelcome(guild.id);

      // Check if goodbye system is configured
      if (!cfg || !cfg.enabled || !cfg.goodbyeEnabled) return;

      const rawMessage = cfg.goodbyeMessage ||
        `Goodbye **{username}**! We are now at **{membercount}** members.`;
      const resolved = resolvePlaceholders(rawMessage, member);
      const color = 0xED4245; // Red color for leave

      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({
          name: `${member.user.username} left the server`,
          iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(resolved)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: `${emoji.id} User ID`,      value: `\`${member.user.id}\``,             inline: true },
          { name: `${emoji.users} Members`,    value: `\`${guild.memberCount}\``,          inline: true },
        )
        .setFooter({ text: guild.name, iconURL: guild.iconURL({ dynamic: true }) ?? undefined })
        .setTimestamp();

      const channelId = cfg.goodbyeChannelId || cfg.channelId;
      if (channelId) {
        const channel = guild.channels.cache.get(channelId);
        if (channel?.isTextBased()) {
          await channel.send({ embeds: [embed] });
        }
      }

      logger.info("Goodbye", `Member ${member.user.tag} left ${guild.name}`);
    } catch (err) {
      logger.error("Goodbye", `Failed to process member leave for ${member.user.tag}`, err);
    }
  },
};

// bread end
