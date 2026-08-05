/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { EmbedBuilder } from "discord.js";
import { logger } from "#utils/logger";
import { emoji } from "#config/emoji";

// In-memory cooldown map to prevent XP spamming (60 second cooldown per user per guild)
const xpCooldowns = new Map();
const COOLDOWN_MS = 60_000;

function resolveLevelPlaceholders(template, member, level, xp) {
  return template
    .replace(/\{user\}/g,        member.toString())
    .replace(/\{username\}/g,    member.user.username)
    .replace(/\{displayname\}/g, member.displayName ?? member.user.username)
    .replace(/\{server\}/g,      member.guild.name)
    .replace(/\{level\}/g,       level.toString())
    .replace(/\{xp\}/g,          xp.toLocaleString());
}

export default {
  name: "messageCreate",
  async execute({ eventArgs, client }) {
    const [message] = eventArgs;

    // Ignore bots, DMs, or empty messages
    if (!message || !message.guild || message.author.bot) return;

    const guildId = message.guild.id;
    const userId  = message.author.id;
    const key     = `${guildId}_${userId}`;

    const lastTime = xpCooldowns.get(key);
    const nowTime  = Date.now();

    if (lastTime && nowTime - lastTime < COOLDOWN_MS) {
      return; // On cooldown
    }

    xpCooldowns.set(key, nowTime);

    try {
      // Award random MEE6 XP between 15 and 25
      const xpGained = Math.floor(Math.random() * 11) + 15;
      const result   = await client.db.addXP(guildId, userId, xpGained);

      // Handle Level Up
      if (result.leveledUp) {
        logger.info("Leveling", `${message.author.tag} leveled up to Level ${result.level} in ${message.guild.name}`);

        const lvlCfg = await client.db.getLevelConfig(guildId);

        // Check if level up messages are enabled
        if (lvlCfg.enabled !== false) {
          const rawMsg = lvlCfg.message || "GG {user}, you just advanced to level **{level}**! 🎉";
          const resolvedText = resolveLevelPlaceholders(rawMsg, message.member ?? { user: message.author, guild: message.guild }, result.level, result.xp);

          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({
              name: `${message.author.username} Leveled Up!`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(resolvedText)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
              { name: `${emoji.starFill} Level`,   value: `**Level ${result.level}**`,                 inline: true },
              { name: `${emoji.stats} Current XP`,  value: `\`${result.currentLevelXP.toLocaleString()} / ${result.nextLevelXP.toLocaleString()} XP\``, inline: true },
            )
            .setFooter({ text: `MEE6 Level System • ${message.guild.name}` })
            .setTimestamp();

          // Determine target channel (configured channel or current channel)
          let targetChannel = message.channel;
          if (lvlCfg.channelId) {
            const ch = message.guild.channels.cache.get(lvlCfg.channelId);
            if (ch && ch.isTextBased()) {
              targetChannel = ch;
            }
          }

          // Send congratulation message
          await targetChannel.send({ embeds: [embed] }).catch(() => {});
        }

        // Check for Level Role rewards
        const levelRoles = await client.db.getLevelRoles(guildId);
        const reward = levelRoles.find((r) => r.level === result.level);

        if (reward) {
          const role = message.guild.roles.cache.get(reward.roleId);
          if (role && message.member) {
            await message.member.roles.add(role, `Level ${result.level} Reward`).catch((err) => {
              logger.warn("Leveling", `Failed to assign level role reward ${role.id}: ${err.message}`);
            });
          }
        }
      }
    } catch (err) {
      logger.error("Leveling", `Error updating XP for ${message.author.tag}`, err);
    }
  },
};

// bread end
