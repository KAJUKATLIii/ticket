/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  EmbedBuilder,
} from "discord.js";
import { emoji } from "#config/emoji";

/** Generate ASCII/Unicode progress bar e.g. [██████░░░░] 60% */
function drawProgressBar(current, total, length = 12) {
  const percent = Math.min(Math.max(current / total, 0), 1);
  const progress = Math.round(length * percent);
  const empty = length - progress;

  const filledBar = "█".repeat(progress);
  const emptyBar  = "░".repeat(empty);

  return `[\`${filledBar}${emptyBar}\`] **${Math.round(percent * 100)}%**`;
}

class RankCommand extends Command {
  constructor() {
    super({
      name: "rank",
      description: "View your or another user's current level and XP rank",
      usage: "rank [@user]",
      examples: ["rank", "rank @user"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "rank",
        description: "View your or another user's current level and XP rank",
        options: [
          {
            name: "user",
            description: "User to check rank for (optional)",
            type: 6, // USER
            required: false,
          },
        ],
      },
    });
  }

  async execute({ ctx }) {
    let targetUser = ctx.author;

    if (ctx.isSlash) {
      const uOption = ctx.interaction.options.getUser("user");
      if (uOption) targetUser = uOption;
    } else if (ctx.args.length > 0) {
      const mention = ctx.message.mentions.users.first();
      if (mention) targetUser = mention;
    }

    const rankData = await ctx.client.db.getUserRank(ctx.guild.id, targetUser.id);
    const needed = rankData.neededXP;
    const progress = drawProgressBar(rankData.xp, needed);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: `${targetUser.username}'s Rank Card`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: `${emoji.crown} Rank`,        value: `#${rankData.rank}`,                           inline: true },
        { name: `${emoji.starFill} Level`,   value: `**Level ${rankData.level}**`,                 inline: true },
        { name: `${emoji.stats} Total XP`,    value: `\`${rankData.xp.toLocaleString()} XP\``,       inline: true },
        { name: `${emoji.note} Messages`,    value: `\`${rankData.messages.toLocaleString()}\``,    inline: true },
        { name: `${emoji.arrow} Level Progress`, value: `${progress}\n\`${rankData.xp} / ${needed} XP\``, inline: false },
      )
      .setFooter({ text: ctx.guild.name, iconURL: ctx.guild.iconURL({ dynamic: true }) ?? undefined })
      .setTimestamp();

    return ctx.reply({ embeds: [embed] });
  }
}

export default new RankCommand();
// bread end
