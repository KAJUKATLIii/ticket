/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { EmbedBuilder } from "discord.js";
import { emoji } from "#config/emoji";

const MEDALS = ["🥇", "🥈", "🥉"];

class LeaderboardCommand extends Command {
  constructor() {
    super({
      name: "leaderboard",
      description: "View top 10 highest-ranked members in this server",
      aliases: ["top", "lb"],
      usage: "leaderboard",
      examples: ["leaderboard"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "leaderboard",
        description: "View top 10 highest-ranked members in this server",
      },
    });
  }

  async execute({ ctx }) {
    const topUsers = await ctx.client.db.getLeaderboard(ctx.guild.id, 10);

    if (!topUsers || topUsers.length === 0) {
      return ctx.reply({
        content: `${emoji.info} No members have earned XP in this server yet. Start chatting to gain XP!`,
      });
    }

    const lines = [];

    for (const u of topUsers) {
      const medal = MEDALS[u.rank - 1] ?? `**#${u.rank}**`;
      const userObj = await ctx.client.users.fetch(u.userId).catch(() => null);
      const tag = userObj ? userObj.username : `<@${u.userId}>`;

      lines.push(`${medal} **${tag}** — Level **${u.level}** (\`${u.xp.toLocaleString()} XP\`)`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🏆 ${ctx.guild.name} Server Leaderboard`)
      .setDescription(lines.join("\n\n"))
      .setFooter({ text: "Type message in server to earn XP!", iconURL: ctx.guild.iconURL({ dynamic: true }) ?? undefined })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  }
}

export default new LeaderboardCommand();
// bread end
