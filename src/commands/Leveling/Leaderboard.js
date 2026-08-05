/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { AttachmentBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { generateLeaderboardCard } from "#utils/leaderboardCardGenerator";
import { emoji } from "#config/emoji";
import { logger } from "#utils/logger";

const MEDALS = ["🥇", "🥈", "🥉"];

class LeaderboardCommand extends Command {
  constructor() {
    super({
      name: "leaderboard",
      description: "View top 10 highest-ranked members in this server card image",
      aliases: ["top", "lb"],
      usage: "leaderboard",
      examples: ["leaderboard"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "leaderboard",
        description: "View top 10 highest-ranked members in this server card image",
      },
    });
  }

  async execute({ ctx }) {
    await ctx.sendTyping().catch(() => {});

    const rawTop = await ctx.client.db.getLeaderboard(ctx.guild.id, 10);

    if (!rawTop || rawTop.length === 0) {
      return ctx.reply({
        content: `${emoji.info} No members have earned XP in this server yet. Start chatting to gain XP!`,
      });
    }

    const topUsers = [];
    for (const u of rawTop) {
      const userObj = await ctx.client.users.fetch(u.userId).catch(() => null);
      topUsers.push({
        rank: u.rank,
        userId: u.userId,
        username: userObj ? userObj.username : `User ${u.userId.slice(0, 6)}`,
        avatarURL: userObj ? userObj.displayAvatarURL({ extension: "png", size: 128 }) : null,
        level: u.level,
        xp: u.xp,
        messages: u.messages,
      });
    }

    try {
      const imageBuffer = await generateLeaderboardCard({
        serverName: ctx.guild.name,
        serverIconURL: ctx.guild.iconURL({ extension: "png", size: 128 }),
        topUsers,
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: `leaderboard-${ctx.guild.id}.png` });

      return ctx.reply({ files: [attachment] });
    } catch (err) {
      logger.error("Leaderboard", "Failed to generate canvas leaderboard card", err);

      // Fallback Embed if Canvas fails
      const lines = topUsers.map(u => {
        const medal = MEDALS[u.rank - 1] ?? `**#${u.rank}**`;
        return `${medal} **${u.username}** — Level **${u.level}** (\`${u.xp.toLocaleString()} XP\`)`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🏆 ${ctx.guild.name} Server Leaderboard`)
        .setDescription(lines.join("\n\n"))
        .setFooter({ text: "Talk in server to earn XP!", iconURL: ctx.guild.iconURL({ dynamic: true }) ?? undefined })
        .setTimestamp();

      return ctx.reply({ embeds: [embed] });
    }
  }
}

export default new LeaderboardCommand();
// bread end
