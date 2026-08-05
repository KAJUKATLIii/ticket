/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { AttachmentBuilder } from "discord.js";
import { generateBirthdayCard } from "#utils/birthdayCardGenerator";
import { logger } from "#utils/logger";

/**
 * Checks for member birthdays today across all guilds and sends Canvas celebration cards & roles.
 * @param {import('#classes/client').Bot} client
 */
export async function checkTodayBirthdays(client) {
  try {
    const now = new Date();
    const currentMonth = now.getUTCMonth() + 1; // 1-12
    const currentDay   = now.getUTCDate();      // 1-31
    const currentYear  = now.getUTCFullYear();

    const todayBirthdays = await client.db.getTodayBirthdays(currentMonth, currentDay);
    if (!todayBirthdays || todayBirthdays.length === 0) return;

    for (const bday of todayBirthdays) {
      // Skip if already celebrated this year
      if (bday.lastCelebratedYear === currentYear) continue;

      const guild = client.guilds.cache.get(bday.guildId);
      if (!guild) continue;

      const cfg = await client.db.getBirthdayConfig(bday.guildId);
      if (!cfg.enabled || !cfg.channelId) continue;

      const targetChannel = guild.channels.cache.get(cfg.channelId);
      if (!targetChannel || !targetChannel.isTextBased()) continue;

      const member = await guild.members.fetch(bday.userId).catch(() => null);
      if (!member) continue;

      // Calculate age if year was provided
      let age = null;
      if (bday.year && bday.year > 1900 && bday.year < currentYear) {
        age = currentYear - bday.year;
      }

      try {
        const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
        const imageBuffer = await generateBirthdayCard({
          username: member.user.username,
          avatarURL,
          serverName: guild.name,
          age,
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: `birthday-${member.id}.png` });

        // Post Canvas Birthday Announcement Card in channel
        await targetChannel.send({
          content: `🎉 🎂 **HAPPY BIRTHDAY** ${member}! Wishing you a wonderful day filled with happiness! 🥳🎈`,
          files: [attachment],
        });

        // Assign Birthday Role if configured
        if (cfg.roleId) {
          const role = guild.roles.cache.get(cfg.roleId);
          if (role) {
            await member.roles.add(role, "Happy Birthday! Role Reward").catch((err) => {
              logger.warn("Birthday", `Failed to assign birthday role to ${member.user.tag}: ${err.message}`);
            });
          }
        }

        // Mark as celebrated for this year
        await client.db.setBirthdayCelebratedYear(bday.guildId, bday.userId, currentYear);
        logger.info("Birthday", `Celebrated birthday for ${member.user.tag} in ${guild.name}`);
      } catch (err) {
        logger.error("Birthday", `Failed to celebrate birthday for ${member.user.tag}`, err);
      }
    }
  } catch (err) {
    logger.error("Birthday", "Error in birthday checker task", err);
  }
}

/**
 * Initializes recurring birthday check interval (every 30 minutes).
 * @param {import('#classes/client').Bot} client
 */
export function initBirthdayChecker(client) {
  // Run initial check on bot startup
  checkTodayBirthdays(client);

  // Check every 30 minutes (1,800,000 ms)
  setInterval(() => {
    checkTodayBirthdays(client);
  }, 1_800_000);
}

// bread birthday task
