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

export default {
  name: "messageCreate",
  async execute({ eventArgs, client }) {
    const [message] = eventArgs;

    // Ignore bots, DMs, or empty messages
    if (!message || !message.guild || message.author.bot) return;

    const guildId = message.guild.id;
    const userId  = message.author.id;

    try {
      const lvlCfg = await client.db.getLevelConfig(guildId);

      // If a specific XP channel is set, only award XP for messages in that channel
      if (lvlCfg.xpChannelId && lvlCfg.xpChannelId !== message.channel.id) {
        return;
      }

      const key      = `${guildId}_${userId}`;
      const lastTime = xpCooldowns.get(key);
      const nowTime  = Date.now();

      if (lastTime && nowTime - lastTime < COOLDOWN_MS) {
        return; // On cooldown
      }

      xpCooldowns.set(key, nowTime);

      // Award random XP between 15 and 25
      const xpGained = Math.floor(Math.random() * 11) + 15;
      const result   = await client.db.addXP(guildId, userId, xpGained);

      // Handle Level Up
      if (result.leveledUp) {
        logger.info("Leveling", `${message.author.tag} leveled up to Level ${result.level} in ${message.guild.name}`);

        // Check if level up messages are enabled
        if (lvlCfg.enabled !== false) {
          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({
              name: `${message.author.username} Leveled Up!`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(`🎉 **Congratulations** ${message.author}! You reached **Level ${result.level}**!`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
              { name: `${emoji.stats} Total XP`, value: `\`${result.xp.toLocaleString()} XP\``, inline: true },
              { name: `${emoji.arrow} Next Level`, value: `\`${result.nextLevelXP.toLocaleString()} XP\``, inline: true },
            )
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
