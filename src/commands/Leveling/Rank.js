/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import { AttachmentBuilder, MessageFlags } from "discord.js";
import { generateRankCard } from "#utils/rankCardGenerator";
import { logger } from "#utils/logger";
import { emoji } from "#config/emoji";

class RankCommand extends Command {
  constructor() {
    super({
      name: "rank",
      description: "View your or another user's MEE6 rank card image",
      usage: "rank [@user]",
      examples: ["rank", "rank @user"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "rank",
        description: "View your or another user's MEE6 rank card image",
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

    try {
      const rankData = await ctx.client.db.getUserRank(ctx.guild.id, targetUser.id);
      const currentLevelXP = rankData.currentLevelXP ?? rankData.xp;
      const neededXP = rankData.neededXP || (rankData.level + 1) * 100;

      const avatarURL = targetUser.displayAvatarURL({ extension: "png", size: 256 });

      const imageBuffer = await generateRankCard({
        username: targetUser.username,
        avatarURL,
        level: rankData.level,
        xp: currentLevelXP,
        requiredXP: neededXP,
        rank: rankData.rank,
        messages: rankData.messages,
        serverName: ctx.guild.name,
      });

      const attachment = new AttachmentBuilder(imageBuffer, { name: `rank-${targetUser.id}.png` });

      return ctx.reply({ files: [attachment] });
    } catch (err) {
      logger.error("Rank", `Failed to generate MEE6 rank card image for ${targetUser.tag}`, err);
      return ctx.reply({
        content: `${emoji.cross} Failed to generate rank card image: ${err.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export default new RankCommand();
// bread end
