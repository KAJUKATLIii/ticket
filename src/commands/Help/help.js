/**
 * Copyright (c) 2026 KAJUKATlii
 * Code by KAJUKATLI
 * MIT License
 */

import { Command } from "#structures/classes/Command";
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { config } from "#config/config";
import { emoji } from "#config/emoji";

class HelpCommand extends Command {
  constructor() {
    super({
      name: "help",
      description: "Show all available commands and features",
      usage: "help",
      examples: ["help"],
      userPermissions: [],
      botPermissions: [],
      enabledSlash: true,
      slashData: {
        name: "help",
        description: "Show all available commands and features",
      },
    });
  }

  async execute({ ctx }) {
    const botAvatarURL = ctx.client.user.displayAvatarURL({ size: 256 });

    const helpContent = [
      `## 🎫 TicketBot Command Directory`,
      ``,
      `All commands are available via Slash \`/\` and Prefix \`${config.prefix}\`.`,
      ``,
      `### 🎫 Ticket Commands`,
      `\`add\` • \`close\` • \`delete\` • \`remove\` • \`reopen\``,
      ``,
      `### 📢 Welcome & Goodbye System`,
      `\`welcome\` — *Interactive welcome embed, auto-role & leave setup*`,
      ``,
      `### 📊 Leveling & XP System`,
      `\`rank\` • \`leaderboard\` (\`top\`) • \`leveladmin\``,
      ``,
      `### 💡 Suggestions System`,
      `\`suggest\` • \`suggest-manage\``,
      ``,
      `### ⭐ Feedback & Reviews System`,
      `\`feedback\` (\`review\`) • \`feedback-manage\``,
      ``,
      `### 🎨 Custom Embed Builder`,
      `\`embed\` — *Interactive rich embed designer*`,
      ``,
      `### 📊 Poll System`,
      `\`poll\` — *Interactive community polls (up to 5 options)*`,
      ``,
      `### 🛠️ Admin & Management`,
      `\`panel\` • \`settings\` • \`prefix\` • \`blacklist\``,
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(helpContent)
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(config.links.supportServer),
          new ButtonBuilder()
            .setLabel("GitHub Repository")
            .setStyle(ButtonStyle.Link)
            .setURL(config.links.github)
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# © 2026 KAJUKATLI — TicketBot v2.0")
      );

    await ctx.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

export default new HelpCommand();
// bread end
